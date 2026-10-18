#!/usr/bin/env python3
"""Build imgmap.json: image URLs for TCGdex-EN cards that have NO image at TCGdex.

Runs only by hand or via GitHub Action (workflow_dispatch / weekly) – never in the browser.
Output: imgmap.json = {tcgdexId: {"url": ..., "src": "pokemontcg.io" | "scrydex"}}  (nothing else, no prices).

Stage 1: pokemontcg.io API (api.pokemontcg.io, retries on 5xx). URL = images.small exactly as returned.
Stage 2 (optional): Scrydex API, only if env SCRYDEX_API_KEY and SCRYDEX_TEAM_ID are set.
         URL = images[front].small exactly as returned by the API. Never built by hand, never from the website.
Set matching: same id / '.5'->'pt5' / dots removed / same set name; NAME_SETS use name matching
(different numbering) and only accept a name that is unique in both sets.
"""
import json, os, re, sys, time, urllib.request, urllib.error, concurrent.futures as cf

TDX = "https://api.tcgdex.net/v2/en"
PTCG = "https://api.pokemontcg.io/v2"
SCRY = "https://api.scrydex.com/pokemon/v1"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "imgmap.json")
NAME_SETS = {"30th-c": "me55c", "cel25cc": "cel25c"}  # tcgdex set -> pokemontcg.io set, other numbering
# Single cards whose names differ between TCGdex and pokemontcg.io, checked by hand. The URL still comes only from the API response.
# 30th-c-022 "Palkia" (TCGdex drops "LV.X"): the only Palkia in 30th-c; me55c-106p "Palkia LV.X" is the only Palkia in me55c.
MANUAL_CARDS = {"30th-c-022": "me55c-106p"}

def get(url, headers=None, tries=10):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "kartenapp-imgmap", **(headers or {})})
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            last = e
            if e.code < 500 and e.code != 429:
                raise
        except Exception as e:
            last = e
        time.sleep(min(60, 2 * (i + 1)))
    raise RuntimeError(f"{url}: {last}")

norm = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
nnum = lambda x: re.sub(r"^0+(?=\w)", "", str(x)).lower()

def tdx_gaps():
    sets = get(f"{TDX}/sets")
    def one(s):
        try:
            d = get(f"{TDX}/sets/{s['id']}", tries=4)
        except Exception as e:
            print("tcgdex", s["id"], e, file=sys.stderr); return s, []
        return d, [c for c in d.get("cards") or [] if not c.get("image")]
    with cf.ThreadPoolExecutor(8) as ex:
        return [(d, g) for d, g in ex.map(one, sets) if g]

def ptcg_stage(gaps, out):
    psets = get(f"{PTCG}/sets?pageSize=250&select=id,name")["data"]
    pid = {p["id"] for p in psets}; pname = {norm(p["name"]): p["id"] for p in psets}
    for d, miss in gaps:
        tid = d["id"]
        p = NAME_SETS.get(tid) or next((c for c in (tid, tid.replace(".5", "pt5"), tid.replace(".", "")) if c in pid), None) or pname.get(norm(d.get("name")))
        if not p:
            continue
        try:
            cards = get(f"{PTCG}/cards?q=set.id:{p}&pageSize=250&select=id,number,name,images")["data"]
        except Exception as e:
            print("ptcg", p, e, file=sys.stderr); continue
        cards = [c for c in cards if (c.get("images") or {}).get("small")]
        if tid in NAME_SETS:
            cnt = {}
            for c in cards: cnt[norm(c["name"])] = cnt.get(norm(c["name"]), 0) + 1
            tcnt = {}
            for c in d.get("cards") or []: tcnt[norm(c["name"])] = tcnt.get(norm(c["name"]), 0) + 1
            byname = {norm(c["name"]): c for c in cards if cnt[norm(c["name"])] == 1}
            hit = lambda c: byname.get(norm(c["name"])) if tcnt.get(norm(c["name"])) == 1 else None
        else:
            bynum = {nnum(c["number"]): c for c in cards}
            hit = lambda c: bynum.get(nnum(c["localId"]))
        byid = {c["id"]: c for c in cards}
        n = 0
        for c in miss:
            h = byid.get(MANUAL_CARDS.get(c["id"], "")) or hit(c)
            if h:
                out[c["id"]] = {"url": h["images"]["small"], "src": "pokemontcg.io"}; n += 1
        print(f"ptcg {tid:<14} -> {p:<12} {n}/{len(miss)}", flush=True)

def scrydex_stage(gaps, out):
    key, team = os.environ.get("SCRYDEX_API_KEY"), os.environ.get("SCRYDEX_TEAM_ID")
    if not (key and team):
        print("scrydex: SCRYDEX_API_KEY/SCRYDEX_TEAM_ID nicht gesetzt – Stufe übersprungen"); return
    H = {"X-Api-Key": key, "X-Team-ID": team}
    n = 0
    for d, miss in gaps:
        for c in miss:
            if c["id"] in out:
                continue
            try:
                j = get(f"{SCRY}/cards/{urllib.request.quote(c['id'])}?select=id,images", headers=H, tries=4)
            except Exception:
                continue
            imgs = (j.get("data") or j).get("images") or []
            front = next((i for i in imgs if i.get("type") == "front"), imgs[0] if imgs else None)
            if front and front.get("small"):
                out[c["id"]] = {"url": front["small"], "src": "scrydex"}; n += 1
    print(f"scrydex: {n} Lücken geschlossen")

def main():
    gaps = tdx_gaps()
    print("TCGdex-EN ohne Bild:", sum(len(g) for _, g in gaps), "Karten in", len(gaps), "Sets")
    out = {}
    ptcg_stage(gaps, out)
    scrydex_stage(gaps, out)
    if not out:
        print("leer – imgmap.json bleibt unverändert", file=sys.stderr); sys.exit(1)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(dict(sorted(out.items())), f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    print("imgmap.json:", len(out), "Einträge")

if __name__ == "__main__":
    main()
