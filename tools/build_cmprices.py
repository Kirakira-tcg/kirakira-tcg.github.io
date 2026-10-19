#!/usr/bin/env python3
"""Build cmprices.json from Cardmarket's official price file (runs by hand or via GitHub Action, never in the browser).

Sources (official downloads, no website scraping):
  https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json
  https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_6.json
Card -> product mapping: ONLY the idProduct TCGdex reports per card (pricing.cardmarket.idProduct), for EN and JA cards.
No idMetacard inference. Cards without such an anchor are not included (the app shows "–" plus the Cardmarket link).
Output: {"date": "YYYY-MM-DD", "p": {"<idProduct>": [trend, low]}, "x": [unklare idProduct]} – only products used by our cards, only trend and low.
TCGdex ids are cached in .cache/tcgdex_cm.json (not committed) so daily runs only fetch new cards.
"""
import json, os, sys, time, urllib.request, urllib.error, concurrent.futures as cf, datetime

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "cmprices.json")
CACHE = os.environ.get("TCGDEX_CM_CACHE", os.path.join(ROOT, ".cache", "tcgdex_cm.json"))
CM = "https://downloads.s3.cardmarket.com/productCatalog"
TDX = "https://api.tcgdex.net/v2"
LANGS = ["en", "ja"]
REFRESH_DAYS = 14

def get(url, tries=6, timeout=60):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "kartenapp-cmprices"}), timeout=timeout) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 404: return None
        except Exception as e:
            last = e
        time.sleep(min(30, 2 * (i + 1)))
    raise RuntimeError(f"{url}: {last}")

def tcgdex_products():
    try: cache = json.load(open(CACHE))
    except Exception: cache = {}
    now = time.time(); todo = []
    for lang in LANGS:
        sets = get(f"{TDX}/{lang}/sets")
        def cards(s):
            d = get(f"{TDX}/{lang}/sets/{s['id']}", tries=4) or {}
            return [c["id"] for c in d.get("cards") or []]
        with cf.ThreadPoolExecutor(12) as ex:
            for ids in ex.map(cards, sets):
                for cid in ids:
                    k = f"{lang}:{cid}"; e = cache.get(k)
                    if not e or now - e[1] > REFRESH_DAYS * 86400 or (e[0] is None and now - e[1] > 86400):
                        todo.append((lang, cid))
    print("TCGdex-Karten zu prüfen:", len(todo), flush=True)
    def one(x):
        lang, cid = x
        try: d = get(f"{TDX}/{lang}/cards/{urllib.request.quote(cid)}", tries=4, timeout=30)
        except Exception: return x, False, None
        cm = ((d or {}).get("pricing") or {}).get("cardmarket") or {}
        had = any(cm.get(f) for f in ("trend", "avg", "low", "avg30", "trend-holo", "avg30-holo", "avg-holo", "low-holo"))
        return x, True, (cm.get("idProduct"), had)
    with cf.ThreadPoolExecutor(24) as ex:
        for i, ((lang, cid), ok, pid) in enumerate(ex.map(one, todo)):
            if ok: cache[f"{lang}:{cid}"] = [pid[0], now, pid[1]]
            if i % 5000 == 0: print(" ", i, flush=True)
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    json.dump(cache, open(CACHE, "w"))
    return cache

def resolve_amb(cache, amb, prods):
    """v185 (Nr. 113): {idProduct: [Karten, denen sie gehört]} für mehrdeutige idProduct.
    Gehört nur, wer in derselben Sprache (en) GENAU den Produktnamen trägt und als einziges Set passt; sonst [] = für keine Karte verlässlich.
    JA-Karten heißen japanisch, Cardmarket-Produkte englisch -> nie per Name auflösbar -> []."""
    want = set(amb); by = {}
    for k, (pid, *_r) in cache.items():
        if pid in want: by.setdefault(pid, []).append(k)
    def name(k):
        lang, cid = k.split(":", 1)
        try: return (get(f"{TDX}/{lang}/cards/{urllib.request.quote(cid)}", tries=3, timeout=30) or {}).get("name")
        except Exception: return None
    keys = sorted({k for v in by.values() for k in v})
    with cf.ThreadPoolExecutor(12) as ex: names = dict(zip(keys, ex.map(name, keys)))
    out = {}
    for pid, ks in by.items():
        pn = (prods.get(pid) or {}).get("name", "").split(" [")[0].strip().lower()
        hit = [k for k in ks if k.startswith("en:") and (names.get(k) or "").strip().lower() == pn]
        sets = {k.rsplit("-", 1)[0] for k in hit}
        if len(sets) > 1:  # Classic-Collection-Nachdruck (cel25cc, 30th-c) trägt den Namen des Originals -> Original behält das Produkt (vgl. BADP in prices.js)
            hit = [k for k in hit if not k.startswith(("en:cel25cc-", "en:30th-c-"))]; sets = {k.rsplit("-", 1)[0] for k in hit}
        out[str(pid)] = hit if pn and len(sets) == 1 and not any(k.startswith("ja:") for k in ks) else []
    return out

def main():
    cache = tcgdex_products()
    guide = get(f"{CM}/priceGuide/price_guide_6.json", timeout=180)
    singles = get(f"{CM}/productList/products_singles_6.json", timeout=180)
    single_ids = {p["idProduct"] for p in singles["products"]}
    pg = {g["idProduct"]: g for g in guide["priceGuides"]}
    used = {}; users = {}
    for k, (pid, *_r) in cache.items():
        if pid:
            used.setdefault(pid, set()).add(k.split(":")[0])
            lang, cid = k.split(":", 1)
            users.setdefault(pid, set()).add((lang, cid.rsplit("-", 1)[0]))
    # v185 (Nr. 113): unklare Zuordnung = TCGdex gibt dieselbe idProduct Karten aus verschiedenen Sprachausgaben (en+ja)
    # oder verschiedenen Sets einer Sprache (z. B. 821707: ja SV-P-262 und SV9a-022/071). Die App zeigt dafür keinen Preis/Link.
    amb = sorted(pid for pid, u in users.items() if len({l for l, _ in u}) > 1 or len(u) > 1)
    xmap = resolve_amb(cache, amb, {p["idProduct"]: p for p in singles["products"]})
    out = {}
    for pid in sorted(used):
        g = pg.get(pid)
        if not g or pid not in single_ids: continue
        t, l = g.get("trend"), g.get("low")
        if t is None and l is None: continue
        out[str(pid)] = [t, l]
    date = (guide.get("createdAt") or "")[:10] or datetime.date.today().isoformat()
    json.dump({"date": date, "p": out, "x": xmap}, open(OUT, "w"), separators=(",", ":"))
    open(OUT, "a").write("\n")
    # Kennzahlen
    stat = {}
    for k, (pid, _t, *had) in cache.items():
        lang = k.split(":")[0]; s = stat.setdefault(lang, [0, 0, 0, 0, 0])
        s[0] += 1
        if had and had[0]: s[4] += 1
        if pid: s[1] += 1
        e = out.get(str(pid)) if pid else None
        if e: s[2] += 1
        if e and e[0] is None and e[1] is not None: s[3] += 1
    for lang, (n, anc, pr, ab, had) in stat.items():
        print(f"{lang}: Karten {n}, vorher mit TCGdex-Preis {had}, mit TCGdex-idProduct {anc}, mit Preis aus Datei {pr}, nur ab-Preis {ab}")
    print("cmprices.json:", len(out), "Produkte, Stand", date)
    print("mehrdeutige idProduct (x):", len(xmap), "davon ohne eindeutige Karte:", sum(1 for v in xmap.values() if not v))

if __name__ == "__main__":
    main()
