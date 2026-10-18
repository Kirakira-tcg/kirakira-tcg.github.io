#!/usr/bin/env python3
"""Kartenapp scan benchmark - step 3: summarize results.csv into summary.md."""
import argparse, csv, json, os, re, statistics, collections, urllib.request

ALIAS = {'me55': '30th', 'me55c': '30th-c', 'sv1': 'sv01', 'sv2': 'sv02', 'sv3': 'sv03', 'sv4': 'sv04', 'sv5': 'sv05', 'sv6': 'sv06', 'sv7': 'sv07', 'sv8': 'sv08', 'sv9': 'sv09', 'sv3pt5': 'sv03.5', 'sv4pt5': 'sv04.5', 'sv6pt5': 'sv06.5', 'sv8pt5': 'sv08.5'}
def nid(x):
    x = (x or '').strip()
    if '-' not in x: return x.lower()
    s, n = x.rsplit('-', 1); n = n.lstrip('0') or '0'
    s = ALIAS.get(s.lower(), s)  # pokemontcg.io set ids that the OCR path reports
    return s.lower() + '-' + n.lower()
def sid(x): return (x or '').rsplit('-', 1)[0].lower()
def pct(a, b): return f"{100*a/b:.1f}%" if b else '–'
def q(v, p):
    v = sorted(v); return v[min(len(v) - 1, int(round(p * (len(v) - 1))))] if v else 0

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default='/workspace/scanbench'); ap.add_argument('--csv', default='results.csv')
    ap.add_argument('--fp', default='https://jayezhdtwitch.github.io/kartenapp/fp/')
    a = ap.parse_args()
    R = list(csv.DictReader(open(os.path.join(a.out, a.csv))))
    names = {}
    for f in ('all-en.json', 'all-ja.json'):
        for c in json.load(open(os.path.join(a.out, 'cache', f))): names.setdefault(nid(c['id']), c['name'])
    fp = set()
    for f in ('all-intl.txt', 'all-ja.txt'):
        try: fp |= {nid(l.split()[0]) for l in urllib.request.urlopen(a.fp + f, timeout=60).read().decode().splitlines() if l.strip()}
        except Exception as e: print('fp list', f, e)
    for r in R:
        t = nid(r['id']); r['in_fp'] = t in fp
        au = r['outcome'].startswith('auto'); r['auto'] = au
        r['correct'] = au and nid(r['auto_id']) == t
        r['wrong'] = au and not r['correct']
        pn = names.get(nid(r['auto_id']), '')
        r['reprint'] = r['wrong'] and (pn and pn.lower() == r['name'].lower() or (r['lang'] == 'ja' and r['outcome'] == 'auto_img'))
        c = [nid(x) for x in r['cands'].split('|') if x]
        r['rank'] = c.index(t) + 1 if t in c else 0
        it = [nid(x.split(':')[0]) for x in r['img_top'].split()]
        r['img_rank'] = it.index(t) + 1 if t in it else 0
        r['top1score'] = float(r['img_top'].split()[0].split(':')[1]) if r['img_top'] else 0
        r['t'] = int(r['t_result_ms']) if r.get('t_result_ms') else None
        num = re.sub(r'\D', '', (r['ocr_number'] or '').split('/')[0]).lstrip('0')
        # v141: Sprache prüfen – gedruckte Sprache (plang, sonst TCGdex-Bildsprache en→EN, ja→JP)
        tl = (r.get('plang') or ('JP' if r['lang'] == 'ja' else 'EN')).upper(); r['true_lang'] = tl
        ol = (r.get('ocr_lang') or '').upper(); ol = 'JP' if ol in ('JA', 'JP') else ol
        r['wrong_lang_auto'] = au and ol != tl
        sl = (r.get('sheet_lang') or '').upper(); r['wrong_lang_sheet'] = (not au) and sl in ('DE', 'EN', 'JP') and sl != tl
        r['sheet_lang_none'] = (not au) and r.get('sheet_lang') == '-'
        r['num_ok'] = bool(num) and num == re.sub(r'\D', '', r['id'].rsplit('-', 1)[1]).lstrip('0')
    def block(rows):
        n = len(rows); au = [r for r in rows if r['auto']]
        ts = [r['t'] for r in rows if r['t'] is not None]
        pk = [r for r in rows if not r['auto']]
        return dict(n=n, auto=pct(len(au), n), acc=pct(sum(r['correct'] for r in rows), n), wrong=pct(sum(r['wrong'] for r in rows), n),
                    wrong_n=sum(r['wrong'] for r in rows), rep=sum(r['reprint'] for r in rows),
                    top5=pct(sum(0 < r['rank'] <= 5 for r in pk), len(pk)), none=pct(sum(r['outcome'] in ('none', 'error') for r in rows), n),
                    found=pct(sum(r['correct'] or 0 < r['rank'] <= 5 for r in rows), n),
                    med=f"{q(ts,.5)/1000:.1f}", p90=f"{q(ts,.9)/1000:.1f}", fp=pct(sum(r['in_fp'] for r in rows), n))
    H = '| Gruppe | n | Auto-Übernahme | **richtig auto** | **falsch auto** (davon Reprint/Sprache) | Auswahl: richtige in Top 5 | richtig auto ODER Top 5 | nichts | Median s | p90 s | Fingerabdruck vorhanden |\n|---|---|---|---|---|---|---|---|---|---|---|\n'
    def row(k, b): return f"| {k} | {b['n']} | {b['auto']} | {b['acc']} | {b['wrong']} ({b['rep']}) | {b['top5']} | {b['found']} | {b['none']} | {b['med']} | {b['p90']} | {b['fp']} |\n"
    md = ['# Kartenapp Scan-Benchmark\n', f"Live-App, 400px-Viewport, headless Chromium, Pfad „Bild hochladen“. {len(R)} synthetische Handyfotos von TCGdex-Bildern.\n\n"]
    md.append('## Gesamt\n' + H + row('alle', block(R)))
    md.append('\n## Nach Kategorie (normales Foto)\n' + H + ''.join(row(k, block([r for r in R if r['cat'] == k and r['variant'] == 'photo'])) for k in sorted({r['cat'] for r in R})))
    md.append('\n## Nach Variante\n' + H + ''.join(row(k, block([r for r in R if r['variant'] == k])) for k in ('photo', 'ui', 'cutoff')))
    md.append('\n## Ausgang\n' + ', '.join(f"{k}: {v}" for k, v in collections.Counter(r['outcome'] for r in R).most_common()) + f"; 5-s-Abbruch: {pct(sum(r['timeout5s']=='1' for r in R), len(R))}\n")
    W = [r for r in R if r['wrong']]
    md.append(f"\n## Falsche Auto-Übernahmen ({len(W)})\n| Wahr | Kat/Var | Übernommen | Weg | Bildscore | OCR |\n|---|---|---|---|---|---|\n" +
              ''.join(f"| {r['id']} {r['name']} | {r['cat']}/{r['variant']} | {r['auto_id']} {names.get(nid(r['auto_id']),'')} | {r['outcome']} | {r['img_score']} | {r['ocr_name']} {r['ocr_number']} |\n" for r in W))
    # failure causes among not-correct
    F = [r for r in R if not r['correct']]
    cause = collections.Counter(); ex = collections.defaultdict(list)
    for r in F:
        if r['wrong']: k = 'falsch übernommen' + (' (Reprint/JP→EN gleiches Artwork)' if r['reprint'] else '')
        elif not r['in_fp']: k = 'kein Fingerabdruck für die Karte'
        elif r['img_rank'] == 1: k = 'Bildvergleich Platz 1, aber unter Schwelle/Abstand'
        elif r['img_rank'] > 1: k = 'Bildvergleich Top 5, nicht Platz 1'
        else: k = 'Bildvergleich verfehlt (nicht in Top 5)'
        cause[k] += 1; ex[k].append(r)
    md.append(f"\n## Fehlerursachen (alle nicht korrekt automatisch übernommenen, {len(F)})\n")
    for k, v in cause.most_common():
        e = ex[k]; sc = [r['top1score'] for r in e if r['top1score']]
        md.append(f"- **{k}: {v}**: in Auswahl Top 5 {pct(sum(0<r['rank']<=5 for r in e), v)}, Ø Top-Score {statistics.mean(sc) if sc else 0:.2f}, Nummer richtig gelesen {pct(sum(r['num_ok'] for r in e), v)}. Kategorien: {dict(collections.Counter(r['cat']+'/'+r['variant'] for r in e).most_common(5))}. Beispiele: {', '.join(r['id'] for r in e[:6])}\n")
    if 'sheet_lang' in R[0]:
        WL = [r for r in R if r['wrong_lang_auto'] or r['wrong_lang_sheet']]
        md.append(f"\n## Sprache\nFalsche Sprache bei Auto-Übernahme: {sum(r['wrong_lang_auto'] for r in R)}; falsch vorgewählt im Blatt: {sum(r['wrong_lang_sheet'] for r in R)}; Blatt ohne Vorwahl: {sum(r['sheet_lang_none'] for r in R)} von {sum(not r['auto'] and bool(r.get('sheet_lang')) for r in R)} Blättern\n" +
                  ''.join(f"- {r['id']} ({r['cat']}/{r['variant']}): echt {r['true_lang']}, übernommen {r['ocr_lang'] if r['auto'] else '–'}, Blatt {r.get('sheet_lang')}\n" for r in WL))
    md.append(f"\n## OCR\nNummer richtig gelesen: {pct(sum(r['num_ok'] for r in R), len(R))} (Foto {pct(sum(r['num_ok'] for r in R if r['variant']=='photo'), sum(r['variant']=='photo' for r in R))}); Name gelesen (nicht leer): {pct(sum(bool(r['ocr_name']) for r in R), len(R))}\n")
    open(os.path.join(a.out, 'summary.md'), 'w').write(''.join(md))
    with open(os.path.join(a.out, 'results_scored.csv'), 'w', newline='') as f:
        w = csv.DictWriter(f, list(R[0].keys())); w.writeheader(); w.writerows(R)
    print(''.join(md))

if __name__ == '__main__': main()
