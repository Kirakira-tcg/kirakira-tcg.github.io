#!/usr/bin/env python3
"""Build sets.json: set list for the Sets tab and set-name search (v170).

Only TCGdex (api.tcgdex.net): /v2/en/sets, /v2/de/sets, /v2/en/series, /v2/de/series and each set detail
(serie, releaseDate, cardCount, logo). Runs by hand or in a GitHub Action – never in the browser.
Output: {"built", "source", "sets":[{"id","en","de"?,"sid","s","sd"?,"d"?,"n"?,"o"?,"logo"?}]} newest first.
  id = TCGdex set id, en/de = set name, sid = serie id, s/sd = serie name EN/DE, d = releaseDate,
  n = cardCount.total, o = cardCount.official, logo = TCGdex logo base URL (as delivered, no extension added).
"""
import json, os, re, sys, time, urllib.request, concurrent.futures as cf, datetime

B = "https://api.tcgdex.net/v2"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sets.json")
POCKET = re.compile(r"^(a\d+[a-z]?|b\d+[a-z]?|p-[ab])$", re.I)

def get(url, tries=6):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "kartenapp-sets"}), timeout=40) as r:
                return json.load(r)
        except Exception as e:
            last = e; time.sleep(2 * (i + 1))
    raise RuntimeError(f"{url}: {last}")

def main():
    en = [s for s in get(f"{B}/en/sets") if not POCKET.match(s["id"])]
    de = {s["id"]: s["name"] for s in get(f"{B}/de/sets")}
    sde = {s["id"]: s["name"] for s in get(f"{B}/de/series")}
    def one(s):
        try:
            return s, get(f"{B}/en/sets/{s['id']}")
        except Exception as e:
            print("FEHLER", s["id"], e, file=sys.stderr); return s, None
    with cf.ThreadPoolExecutor(8) as ex:
        res = list(ex.map(one, en))
    bad = [s["id"] for s, d in res if d is None]
    if bad:
        print("Abbruch – Set-Details fehlen:", bad, file=sys.stderr); sys.exit(1)
    out = []
    for s, d in res:
        r = {"id": s["id"], "en": s["name"]}
        if de.get(s["id"]) and de[s["id"]] != s["name"]: r["de"] = de[s["id"]]
        se = d.get("serie") or {}
        if se.get("id"): r["sid"] = se["id"]
        if se.get("name"): r["s"] = se["name"]
        if sde.get(se.get("id")) and sde[se["id"]] != se.get("name"): r["sd"] = sde[se["id"]]
        if d.get("releaseDate"): r["d"] = d["releaseDate"]
        cc = d.get("cardCount") or s.get("cardCount") or {}
        if cc.get("total"): r["n"] = cc["total"]
        if cc.get("official"): r["o"] = cc["official"]
        if d.get("logo") or s.get("logo"): r["logo"] = d.get("logo") or s.get("logo")
        out.append(r)
    out.sort(key=lambda r: (r.get("d") or "0000"), reverse=True)
    json.dump({"built": datetime.date.today().isoformat(), "source": "api.tcgdex.net (sets/series en+de, Set-Details); tools/build_sets.py", "sets": out},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("sets.json:", len(out), "Sets,", sum(1 for r in out if r.get("d")), "mit Datum,", sum(1 for r in out if r.get("s")), "mit Serie")

if __name__ == "__main__":
    main()
