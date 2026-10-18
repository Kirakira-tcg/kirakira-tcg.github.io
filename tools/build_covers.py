#!/usr/bin/env python3
"""Adds "covers" {setId: imageURL} to jpcards.json: a representative card per JP set
(TCGdex ja sets + jpcards sets). Rule: secret-rare Pokemon (number > official), famous Pokemon first,
else first Pokemon card, else any card. TCGdex URLs are stored without '/low.webp' (app appends).
Usage: python3 tools/build_covers.py   (run after build_jp.py)"""
import json,re,urllib.error,urllib.request,urllib.parse,os
from concurrent.futures import ThreadPoolExecutor
D=os.path.join(os.path.dirname(__file__),'..');J=os.path.join(D,'jpcards.json')
ja=[r[2] for r in json.loads(re.search(r'PNAMES=(\[.*?\]);?\s*$',open(os.path.join(D,'names.js'),encoding='utf8').read(),re.S|re.M).group(1)) if len(r)>2 and r[2]]
ja.sort(key=len,reverse=True)
FAM=["リザードン","ピカチュウ","ミュウツー","ミュウ","イーブイ","ブラッキー","エーフィ","ゲンガー","ルギア","レックウザ","ギラティナ","カイリュー","ニンフィア","サーナイト","ルカリオ","ゲッコウガ","ホウオウ","フシギバナ","カメックス"]
import time
def g(u):
    for i in range(4):
        try:return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=30))
        except urllib.error.HTTPError as e:
            if e.code==404:return None
        except Exception:pass
        time.sleep(1+i)
    return None
def num(x):
    m=re.match(r'\d+',str(x or ''));return int(m.group()) if m else 0
def isP(n):return any(p in n for p in ja)
def fam(n):
    for i,f in enumerate(FAM):
        if f in n:return i
    return 99
def pick(cards,official):
    cs=[c for c in cards if c.get('img')]
    if not cs:return None
    sec=[c for c in cs if official and num(c['n'])>official and isP(c['name'])]
    pool=sec or [c for c in cs if isP(c['name'])] or cs
    return min(pool,key=lambda c:(fam(c['name']),num(c['n'])))['img']
def head(u):
    for i in range(3):
        try:r=urllib.request.urlopen(urllib.request.Request(u,method="HEAD",headers={"User-Agent":"Mozilla/5.0"}),timeout=20);return r.headers.get("content-type","").startswith("image")
        except urllib.error.HTTPError as e:
            if e.code==404:return False
        except Exception:pass
        time.sleep(1+i)
    return False
d=json.load(open(J,encoding='utf8'));cov={}
for s in d['sets']:
    cs=[{'n':r[1],'name':r[3],'img':d['base']+r[4]} for r in d['c'] if r[0]==s]
    tot=max((int(r[2]) for r in d['c'] if r[0]==s and str(r[2]).isdigit()),default=0)
    u=pick([c for c in cs if c['img'].startswith('http')],tot)
    if u and head(u):cov[s]=u
def tset(sid):
    x=g('https://api.tcgdex.net/v2/ja/sets/'+urllib.parse.quote(sid))
    if not x:return sid,None
    cs=[{'n':c['localId'],'name':c['name'],'img':c.get('image')} for c in x.get('cards',[])]
    u=pick(cs,(x.get('cardCount') or {}).get('official') or 0)
    return sid,(u if u and head(u+'/low.webp') else None)
ids=[s['id'] for s in (g('https://api.tcgdex.net/v2/ja/sets') or []) if s['id'] not in cov]
with ThreadPoolExecutor(4) as ex:
    for sid,u in ex.map(tset,ids):
        if u:cov[sid]=u
# Keine Cover von pokemon-card.com / serebii.net (Hotlink-Risiko) – siehe tools/img_policy.py
d.pop('logos',None);d.pop('logoBase',None);d['covers']=cov
import sys;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import img_policy
P={}  # v142: keine jpprices.json mehr (pokeca-souba)
img_policy.fix_cards(d,P)
json.dump(d,open(J,'w',encoding='utf8'),ensure_ascii=False,separators=(",",":"))
print(len(cov),'covers;',len(d['sets'])+len(ids)-len([i for i in ids if i in cov])-len([s for s in d['sets'] if s in cov]),'without')
