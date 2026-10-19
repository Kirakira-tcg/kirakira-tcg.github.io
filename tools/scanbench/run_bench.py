#!/usr/bin/env python3
"""Kartenapp scan benchmark - step 2: feed every photo of manifest.json through the real
'Bild hochladen' path of the live app (headless Chromium, 400px mobile viewport) and record
outcome, time and OCR fields. Only hooks window.analyze/analyze0 (read-only wrappers)."""
import argparse, asyncio, json, os, re, time, csv
from playwright.async_api import async_playwright

HOOK = """(()=>{if(window.__hooked)return;window.__hooked=1;const a=window.analyze,a0=window.analyze0;
window.analyze=async(...x)=>{const r=await a(...x);window.__bench.r=r;window.__bench.tR=performance.now();return r};
const nc=window.nmCands;if(nc)window.nmCands=async(...x)=>{const C=await nc(...x);try{(C||[]).forEach(c=>{window.__cmap[(c.name||'')+'|'+(c.localId||'')]=c.id})}catch(e){}return C};
window.__cmap={};const fb=window.attachImgFallback;if(fb)window.attachImgFallback=(im,c)=>{try{if(im&&c&&c.id){im.dataset.cid=c.id;window.__cmap[(c.name||'')+'|'+(c.localId||'')]=c.id}}catch(e){}return fb(im,c)};
window.analyze0=async(...x)=>{const r=await a0(...x);window.__bench.r0=r;window.__bench.tR0=performance.now();return r};})()"""
RESET = """()=>{window.__bench={};try{clearScanUI()}catch(e){};document.getElementById('nmSheet')?.remove();
document.body.classList.remove('hassb');const P=document.getElementById('scanPick');if(P){P.hidden=true;P.innerHTML=''}
const R=document.getElementById('results');if(R)R.innerHTML='';window.anaCut=false;
try{go('v-scan')}catch(e){document.querySelector('nav [data-v=v-scan]')?.click()}return performance.now()}"""
SNAP = """()=>{const b=window.__bench,r=b.r||{},r0=b.r0||{};const f=document.getElementById('nmSheet');
const C=f?[...f.querySelectorAll('.nmgrid .spThumb')].map(x=>{const t=x.querySelector(':scope > span')?.textContent||'';const p=t.split(' · ');const id=x.querySelector('img')?.dataset.cid||window.__cmap[p[0]+'|'+p[p.length-1]]||'';return {id,html:x.innerHTML.slice(0,600),txt:t}}):[];
const pick=r.hit?{id:r.hit.id,name:r.hit.name}:null;
const sl=x=>x&&{name:x.name,number:x.number,full:x.full,lang:x.lang,set:x.set,setId:x.setId,confident:!!x.confident,conflict:!!x.conflict,timeout:!!x.timeout,
 imgHit:x.imgHit&&{cardId:x.imgHit.cardId,score:x.imgHit.score},img:(x.imgMatch||[]).slice(0,5).map(m=>m.cardId+':'+(+m.score).toFixed(3)),energy:!!x.energy,ms:x.ms};
return {r:b.r?sl(r):null,r0:b.r0?sl(r0):null,tR:b.tR,tR0:b.tR0,sheet:!!f,nmst:f?f.querySelector('.nmst')?.textContent:'',cands:C,pick,
 sheetLang:f?(f.querySelector('.nmlang .chip.on')?.dataset.l||'-'):'',langEv:window.langEvDbg||'',
 status:document.getElementById('scanStatus2')?.textContent||'',imgVar:window.imgVar||'',
 uiName:f&&f.name?f.name.value:'',uiNum:f&&f.num?f.num.value:'',tile1:C[0]?C[0].txt:''}}"""
def stnum(t):
    m = re.search(r'Nr\. ([0-9A-Za-z]+(?:/[0-9A-Za-z]+)?)', t or '')
    return m.group(1) if m else ''
ID_RE = re.compile(r'assets\.tcgdex\.net/(\w+)/[^/"]+/([^/"]+)/([^/"]+)/')

async def worker(wid, br, url, q, out, args):
    W = int(os.environ.get('BENCH_WIDTH', '400'))
    ctx = await br.new_context(viewport={'width': W, 'height': 860 if W < 700 else 900}, device_scale_factor=2 if W < 700 else 1, is_mobile=W < 700, has_touch=W < 700, locale='de-DE')
    page = await ctx.new_page()
    async def boot():
        await page.goto(url, wait_until='load', timeout=90000)
        await page.wait_for_function("typeof analyze==='function'", timeout=90000)
        await page.evaluate("window.tessLoad?window.tessLoad():0")
        await page.wait_for_function("!!window.Tesseract", timeout=90000)
        await page.evaluate(HOOK)
    await boot(); n = 0
    while True:
        try: m = q.get_nowait()
        except asyncio.QueueEmpty: break
        n += 1
        if args.reload_every and n % args.reload_every == 0: await boot()
        try:
            t0 = await page.evaluate(RESET)
            await page.set_input_files('#uploadFile', m['photo'])
            await page.wait_for_function("window.__bench&&window.__bench.r", timeout=args.timeout * 1000)
            s = await page.evaluate(SNAP); r = s['r'] or {}
            outcome = 'none'; auto = ''
            if r.get('imgHit') and r.get('confident'): outcome, auto = 'auto_img', r['imgHit']['cardId']
            elif r.get('confident') and (r.get('number') or r.get('energy')) and r.get('lang') != 'JP' and not r.get('conflict'):
                outcome = 'auto_ocr'; auto = (r.get('setId') or r.get('set') or '?') + '-' + str(r.get('number') or '')
            else:
                # picker: wait until sheet lists results (or JP pick resolves); if 5-s cutoff hit, wait for late OCR refill
                end = time.time() + args.picker_wait; seen_r0 = 0
                while time.time() < end:
                    s = await page.evaluate(SNAP)
                    ready = (s['sheet'] and re.search(r'Treffer|Nichts gefunden|eingeben', s['nmst'] or '')) or (not s['sheet'] and (s['pick'] or not s['status'].startswith('⏳')))
                    if ready and s['nmst'] and s['nmst'].startswith('⏳'): ready = False
                    if ready and (not r.get('timeout') or (s['r0'] and s['cands'])): break
                    if ready and r.get('timeout') and s['r0'] and not seen_r0: seen_r0 = time.time()
                    if seen_r0 and time.time() - seen_r0 > 6 and ready: break
                    await asyncio.sleep(.4)
                await asyncio.sleep(.6); s = await page.evaluate(SNAP)
                outcome = 'picker' if (s['cands'] or s['pick']) else 'none'
            tpick = (time.time() * 1000)
            ids = []
            for c in s['cands']:
                mm = ID_RE.search(c['html']); ids.append(c['id'] or (mm.group(2) + '-' + mm.group(3) if mm else '?:' + c['txt']))
            if s['pick']: ids = [s['pick']['id']] + ids
            rr = s['r'] or {}
            rec = dict(scan_id=m['scan_id'], id=m['id'], name=m['name'], cat=m['cat'], variant=m['variant'], rarity=m['rarity'], lang=m['lang'], plang=m.get('plang', ''),
                       outcome=outcome, auto_id=auto, cands='|'.join(ids[:10]), n_cands=len(ids),
                       t_result_ms=round(s['tR'] - t0) if s['tR'] else '', timeout5s=int(bool(rr.get('timeout'))),
                       ocr_name=(s['r0'] or rr).get('name') or '', ocr_number=(s['r0'] or rr).get('full') or (s['r0'] or rr).get('number') or '',
                       ocr_lang=rr.get('lang') or '', sheet_lang=s.get('sheetLang') or '', lang_ev=s.get('langEv') or '', img_top=' '.join(rr.get('img') or (s['r0'] or {}).get('img') or []),
                       img_score=(rr.get('imgHit') or {}).get('score', ''), img_var=s['imgVar'], status=s['status'][:120],
                       # v185: ocr_name/ocr_number sind das ROHE analyze0-Ergebnis (Name in EN-Suchform via deName, Nummer vor der Gesamtzahl-Korrektur 130/102→13 im Blatt).
                       # Was der Nutzer sieht: ui_name/ui_num (Felder im Auswahlblatt), ui_status_num (Nummer aus der Statuszeile), tile1 (erste Kachel)
                       ui_name=s.get('uiName') or '', ui_num=s.get('uiNum') or '', ui_status_num=stnum(s['status']),
                       tile1=s.get('tile1') or '', photo=os.path.basename(m['photo']), err='')
        except Exception as e:
            rec = dict(scan_id=m['scan_id'], id=m['id'], name=m['name'], cat=m['cat'], variant=m['variant'], rarity=m['rarity'], lang=m['lang'],
                       outcome='error', err=str(e)[:200], photo=os.path.basename(m['photo']))
            try: await boot()
            except Exception: pass
        out.append(rec)
        print(f"[w{wid}] {len(out)} {m['id']} {m['variant']} -> {rec['outcome']} {rec.get('auto_id','')} {rec.get('t_result_ms','')}ms", flush=True)
    await ctx.close()

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='/workspace/scanbench'); ap.add_argument('--url', default='https://jayezhdtwitch.github.io/kartenapp/')
    ap.add_argument('--workers', type=int, default=6); ap.add_argument('--timeout', type=int, default=60)
    ap.add_argument('--picker-wait', type=int, default=20); ap.add_argument('--reload-every', type=int, default=40)
    ap.add_argument('--limit', type=int, default=0); ap.add_argument('--csv', default='results.csv')
    args = ap.parse_args()
    man = json.load(open(os.path.join(args.out, 'manifest.json')))
    if args.limit: man = man[::max(1, len(man) // args.limit)][:args.limit]
    q = asyncio.Queue()
    for m in man: q.put_nowait(m)
    out = []
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-dev-shm-usage'])
        await asyncio.gather(*[worker(i, br, args.url, q, out, args) for i in range(args.workers)])
        await br.close()
    keys = list(dict.fromkeys(k for r in out for k in r))
    with open(os.path.join(args.out, args.csv), 'w', newline='') as f:
        w = csv.DictWriter(f, keys); w.writeheader(); [w.writerow(r) for r in sorted(out, key=lambda r: r['scan_id'])]
    print('wrote', len(out))

asyncio.run(main())
