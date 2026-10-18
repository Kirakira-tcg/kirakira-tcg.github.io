import json,urllib.request,concurrent.futures as cf
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'kartenapp-coverage'}),timeout=20) as r:return json.load(r)
    except Exception as e:return None
sets=get('https://api.tcgdex.net/v2/ja/sets') or []
def one(s):
    d=get('https://api.tcgdex.net/v2/ja/sets/'+s['id'])
    if not d:return None
    cards=d.get('cards') or []
    im=sum(1 for c in cards if c.get('image'))
    return {'id':s['id'],'name':d.get('name'),'releaseDate':d.get('releaseDate'),'serie':(d.get('serie') or {}).get('id'),'cards':len(cards),'withImage':im}
with cf.ThreadPoolExecutor(8) as ex:res=[r for r in ex.map(one,sets) if r]
res.sort(key=lambda r:(r['releaseDate'] or ''),reverse=True)
json.dump(res,open('tools/tcgdex_ja_coverage.json','w'),ensure_ascii=False,indent=0)
print(len(sets),len(res),sum(r['withImage']>0 for r in res),sum(r['withImage'] for r in res),sum(r['cards'] for r in res))
