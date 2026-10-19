#!/usr/bin/env python3
"""Baut jpsetdates.json: TCGdex-JA-Set-ID -> Erscheinungsdatum (YYYY-MM-DD).
Quelle: https://api.tcgdex.net/v2/ja/sets/<id> (Feld releaseDate). Die Set-Liste /ja/sets
liefert kein Datum, darum einmal je Set abfragen und als Datei mitliefern (Liste Nr. 49).
Sets, die TCGdex nicht hat (jpcards.json, z. B. M6a): Datum aus Bulbapedia „List of Japanese
Pokémon Trading Card Game expansions“ (action=raw), nur wenn die Zeile das Set-Symbol mit genau
dieser Set-ID nennt („File:SetSymbol… <ID>.png“). Sonst fehlt das Set – nichts wird geraten."""
import json,re,urllib.request,urllib.parse,datetime,concurrent.futures as cf
get=lambda u:json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 kartenapp-builder'}),timeout=30).read().decode())
ids=[s['id'] for s in get('https://api.tcgdex.net/v2/ja/sets')]
def one(i):
  try:return i,(get('https://api.tcgdex.net/v2/ja/sets/'+urllib.parse.quote(i)).get('releaseDate') or '')[:10]
  except Exception:return i,''
with cf.ThreadPoolExecutor(8) as ex:res=dict(ex.map(one,ids))
dates={i:d for i,d in res.items() if len(d)==10}
BP='https://bulbapedia.bulbagarden.net/w/index.php?title=List_of_Japanese_Pok%C3%A9mon_Trading_Card_Game_expansions&action=raw'
raw=urllib.request.urlopen(urllib.request.Request(BP,headers={'User-Agent':'Mozilla/5.0 kartenapp-builder'}),timeout=30).read().decode()
for sid in json.load(open('jpcards.json')).get('sets',{}):
  if sid in dates:continue
  for r in re.split(r'\n\|-',raw):
    m=re.search(r'\[\[File:SetSymbol[^\]|]*?\s(\S+)\.png',r);d=re.findall(r'\n\|\s*([A-Z][a-z]+ \d{1,2}, \d{4})\s*(?:\n|$)',r)
    if m and d and m.group(1)==sid:
      try:dates[sid]=datetime.datetime.strptime(d[-1],'%B %d, %Y').date().isoformat();break
      except ValueError:pass
json.dump({'source':'https://api.tcgdex.net/v2/ja/sets/<id> releaseDate; Sets ohne TCGdex: Bulbapedia (Set-Symbol mit Set-ID)','built':datetime.date.today().isoformat(),'dates':dates},open('jpsetdates.json','w'),ensure_ascii=False,indent=0,sort_keys=False)
print(len(ids),'TCGdex-Sets,',len(dates),'mit Datum; ohne:',sorted((set(ids)|set(json.load(open('jpcards.json')).get('sets',{})))-set(dates)))
