#!/usr/bin/env python3
"""Baut jpsetnames.json: TCGdex-JA-Set-ID -> englischer + japanischer Name.
Quelle: Bulbapedia "List of Japanese Pokémon Trading Card Game expansions" (action=raw),
abgeglichen mit https://api.tcgdex.net/v2/ja/sets. Ein Set kommt nur rein, wenn
(a) der japanische Name bei Bulbapedia == TCGdex-JA-Name ist (eindeutig), oder
(b) Bulbapedia das Logo mit genau dieser Set-ID benennt ("File:<ID> <English> Logo.png").
(b) gewinnt und korrigiert falsche TCGdex-Namen (z.B. SV4a, bei TCGdex 'レイジングサーフ').
v130: alle TCGdex-JA-Sets + jpcards.json-Sets; Sets ohne TCGdex nur per Logo-ID (b). Nichts wird geraten."""
import json,re,sys,unicodedata,urllib.request,datetime
BP='https://bulbapedia.bulbagarden.net/w/index.php?title=List_of_Japanese_Pok%C3%A9mon_Trading_Card_Game_expansions&action=raw'
WANT='''SV1S SV1V SV1a SV2P SV2D SV2a SV3 SV3a SV4K SV4M SV4a SV5K SV5M SV5a SV6 SV6a SV7 SV7a SV8 SV8a SV9 SV9a SV10 SV11B SV11W
M1L M1S M2 M2a M3 M4 M5 M6 M6a S1a S4a S6a S8a S8b S9 S10a S11 S11a S12a S5a S9a SM12a SM8b'''.split()
get=lambda u:urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 kartenapp-builder'}),timeout=30).read().decode()
n=lambda s:unicodedata.normalize('NFKC',s).replace(' ','').replace('　','').lower()
raw=get(BP).split('\n');tdx={s['id']:s for s in json.loads(get('https://api.tcgdex.net/v2/ja/sets'))}
byJa={};byCode={}
for i,l in enumerate(raw):
  m=re.match(r"\|\s*(.+?)<br>\{\{TCG\|([^|}]+)(?:\|([^}]+))?\}\}",l)
  if not m:continue
  ja=[x.strip() for x in re.split(r'[•・]\s',m.group(1))];en=[x.strip() for x in (m.group(3) or m.group(2)).split('•')]
  if len(ja)!=len(en):ja,en=[m.group(1).strip()],[ (m.group(3) or m.group(2)).strip()]
  for a,b in zip(ja,en):byJa.setdefault(n(a),set()).add((a,b))
  for k in (i-1,i-2):
    c=re.match(r"\|\s*\[\[File:(\S+) (.+?) Logo\.png",raw[k]) if k>=0 else None
    if c and len(en)==1:byCode[c.group(1)]=(ja[0],en[0])
WANT=list(dict.fromkeys(list(tdx)+list(json.load(open('jpcards.json')).get('sets',{}))))
out={};skip=[]
for sid in WANT:
  s=tdx.get(sid)
  if not s and sid not in byCode:skip.append((sid,'nicht bei TCGdex JA, keine Logo-ID'));continue
  s=s or {'name':byCode[sid][0]}
  if sid in byCode:ja,en=byCode[sid];src='bulbapedia-logo-id'
  else:
    c=byJa.get(n(s['name']),set())
    if len(c)!=1:skip.append((sid,f"{s['name']}: {len(c)} Treffer bei Bulbapedia"));continue
    ja,en=next(iter(c));src='bulbapedia-ja-name'
  # mehrfach vergebene TCGdex-Namen (SV3a/SV4a) nur per Logo-ID akzeptieren
  if src=='bulbapedia-ja-name' and sum(1 for t in tdx.values() if n(t['name'])==n(s['name']))>1:skip.append((sid,'TCGdex-Name mehrdeutig'));continue
  e={'en':en,'ja':ja,'src':src}
  if n(ja)!=n(s['name']):e['tcgdexName']=s['name']
  out[sid]=e
json.dump({'source':BP,'built':datetime.date.today().isoformat(),'sets':out},open(sys.argv[1] if len(sys.argv)>1 else 'jpsetnames.json','w'),ensure_ascii=False,indent=0)
print(len(out),'Sets');[print('SKIP',*x) for x in skip]
