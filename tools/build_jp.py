#!/usr/bin/env python3
"""Builds jpcards.json: Japanese cards from pokemon-card.com for sets TCGdex (/v2/ja/sets/{id}) lacks.
Format: {"v":1,"base":IMGBASE,"sets":{id:name},"c":[[set,localId,total,name,imgPath],...]}
Usage: python3 tools/build_jp.py [pages=80] > jpcards.json
Set code comes from each card's detail page (catches reprints filed under older image folders)."""
import json,re,sys,html,urllib.request,urllib.parse,urllib.error
from concurrent.futures import ThreadPoolExecutor
B="https://www.pokemon-card.com";IMG=B+"/assets/images/card_images/large/"
def get(u,tries=3):
    for i in range(tries):
        try:return urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=30).read().decode()
        except urllib.error.HTTPError as e:
            if e.code==404:return None
        except Exception:pass
    return None
pages=int(sys.argv[1]) if len(sys.argv)>1 else 80
def page(p):
    d=get(B+"/card-search/resultAPI.php?"+urllib.parse.urlencode({"regulation_sidebar_form":"all","page":p}))
    return json.loads(d)["cardList"] if d else []
with ThreadPoolExecutor(8) as ex:lst=[c for l in ex.map(page,range(1,pages+1)) for c in l]
def detail(c):
    h=get(f"{B}/card-search/details.php/card/{c['cardID']}/regu/all") or ""
    s=re.search(r'img-regulation"\s+alt="([^"]+)"',h) or re.search(r'alt="([^"]+)"\s*class="img-regulation',h)
    n=re.search(r'(\d+)&nbsp;/&nbsp;([^&<\s]+)',h)
    return [s.group(1) if s else c["cardThumbFile"].split("/")[-2], str(int(n.group(1))) if n else "", n.group(2) if n else "",
            html.unescape(c["cardNameViewText"]), c["cardThumbFile"].replace("/assets/images/card_images/large/","")]
with ThreadPoolExecutor(12) as ex:rows=list(ex.map(detail,lst))
miss={}
for s in sorted({r[0] for r in rows}):
    t=get(f"https://api.tcgdex.net/v2/ja/sets/{urllib.parse.quote(s)}")
    if t is None:miss[s]=s
    print(s,"404" if t is None else "ok",file=sys.stderr)
lh=""
try:
    lh=get("https://limitlesstcg.com/cards/jp") or ""
    for sid,nm in re.findall(r'href="/cards/jp/([A-Za-z0-9-]+)"><img class="set"[^>]*>\s*([^<]+?)\s*<',lh):
        if sid in miss:miss[sid]=html.unescape(nm)
except Exception:pass
seen=set();out=[]
for r in rows:
    k=(r[0],r[1] or r[4])
    if r[0] in miss and k not in seen:seen.add(k);out.append(r)
out.sort(key=lambda r:(r[0],int(r[1] or 9999),r[4]))
json.dump({"v":1,"base":IMG,"sets":miss,"c":out},sys.stdout,ensure_ascii=False,separators=(",",":"))
print(len(out),"cards",file=sys.stderr)
