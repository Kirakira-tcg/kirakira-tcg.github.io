# Baut den Index japanischer Karten mit TCGdex-Bild (nur Links, keine Bilder im Repo): API-Feld image + HEAD-Prüfung auf assets.tcgdex.net.
# Aufruf: python3 tools/tcgdex_ja_index.py  -> have.json; Kurzform (Set: [Pfad, Nummernbereiche]) als jaIdx() in app.js eintragen. Nicht automatisch ausführen.
import json,urllib.request,concurrent.futures as cf,time
sets=json.loads(urllib.request.urlopen(urllib.request.Request('https://api.tcgdex.net/v2/ja/sets',headers={'User-Agent':'kartenapp-build'}),timeout=30).read())
UA={'User-Agent':'kartenapp-build (jayezhdtwitch.github.io/kartenapp; image index, link only)'}
def g(sid):
    for i in range(3):
        try:return json.loads(urllib.request.urlopen(urllib.request.Request('https://api.tcgdex.net/v2/ja/sets/'+urllib.request.quote(sid),headers=UA),timeout=30).read())
        except Exception: time.sleep(1+i)
with cf.ThreadPoolExecutor(4) as ex: D=list(ex.map(lambda s:g(s['id']),sets))
# v146: Sets, deren Bilder auf assets.tcgdex.net nicht zur Kartennummer passen (Stichprobe 18.10.2026) – nicht ergänzen
BAD={'M1S'}
jobs=[];have={}
for d in D:
    if not d:continue
    se=(d.get('serie') or {}).get('id');sid=d['id']
    for c in d.get('cards',[]):
        if c.get('image'):have.setdefault(sid,{})[c['localId']]=c['image'];continue
        if se and sid not in BAD:jobs.append((sid,c['localId'],f"https://assets.tcgdex.net/ja/{se}/{sid}/{c['localId']}"))
print('to probe',len(jobs))
def head(j):
    u=j[2]+'/low.webp'
    for i in range(2):
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,method='HEAD',headers=UA),timeout=20);return j,r.status==200
        except urllib.error.HTTPError as e:return j,False
        except Exception:time.sleep(1)
    return j,None
found=0;unk=0
with cf.ThreadPoolExecutor(8) as ex:
    for j,ok in ex.map(head,jobs):
        if ok:have.setdefault(j[0],{})[j[1]]=j[2];found+=1
        elif ok is None:unk+=1
json.dump({k:v for k,v in have.items()},open('have.json','w'),ensure_ascii=False)
print('found extra',found,'unknown',unk,'total with image',sum(len(v) for v in have.values()),'sets',len(have))
