#!/usr/bin/env python3
"""Baut jpsetdates.json: TCGdex-JA-Set-ID -> Erscheinungsdatum (YYYY-MM-DD).
Quelle: https://api.tcgdex.net/v2/ja/sets/<id> (Feld releaseDate). Die Set-Liste /ja/sets
liefert kein Datum, darum einmal je Set abfragen und als Datei mitliefern (Liste Nr. 49).
Sets ohne releaseDate bei TCGdex fehlen in der Datei – nichts wird geraten."""
import json,urllib.request,urllib.parse,datetime,concurrent.futures as cf
get=lambda u:json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 kartenapp-builder'}),timeout=30).read().decode())
ids=[s['id'] for s in get('https://api.tcgdex.net/v2/ja/sets')]
def one(i):
  try:return i,(get('https://api.tcgdex.net/v2/ja/sets/'+urllib.parse.quote(i)).get('releaseDate') or '')[:10]
  except Exception:return i,''
with cf.ThreadPoolExecutor(8) as ex:res=dict(ex.map(one,ids))
dates={i:d for i,d in res.items() if len(d)==10}
json.dump({'source':'https://api.tcgdex.net/v2/ja/sets/<id> releaseDate','built':datetime.date.today().isoformat(),'dates':dates},open('jpsetdates.json','w'),ensure_ascii=False,indent=0,sort_keys=False)
print(len(ids),'Sets,',len(dates),'mit Datum; ohne:',sorted(set(ids)-set(dates)))
