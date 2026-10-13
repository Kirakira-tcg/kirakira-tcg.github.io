# Baut jpprices.json aus pokeca-souba Screener (JP-Markt, Yen, snkrdunk-Mittelwert).
# Aufruf: python3 tools/build_jpprices.py  (im Repo-Root)
import re,json,urllib.request,datetime
UA={'User-Agent':'Mozilla/5.0'}
get=lambda u:urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60).read().decode()
s=get('https://pokeca-souba.vercel.app/screener').replace('\\"','"')
items=re.findall(r'\{"id":"([^"]+)","name":"([^"]*)","rarity":"([^"]*)","boxId":"([^"]*)","boxName":"([^"]*)","image":"([^"]*)","mid":(\d+|null)',s)
norm=lambda x:re.sub(r'[\s・]','',x).lower()
sets={norm(x['name']):x['id'] for x in json.loads(get('https://api.tcgdex.net/v2/ja/sets'))}
for k,v in {'30th CELEBRATION':'M6a','シャイニートレジャーex':'SV4a','タッグオールスターズ':'SM12a','25th ANNIVERSARY COLLECTION':'S8a','MEGAドリームex':'M2a'}.items():sets[norm(k)]=v
out={};miss=set()
for iid,name,rar,box,bname,img,mid in items:
  if mid=='null':continue
  num=re.search(r'-(\d+)$',iid);sid=sets.get(norm(bname))
  if not num or not sid:miss.add(bname);continue
  out[f"{sid}-{int(num.group(1))}"]={'n':name,'y':int(mid),'i':img}
if len(out)<100:raise SystemExit(f'Nur {len(out)} Preise – Seite geändert? jpprices.json bleibt unverändert.')
try:
  old=json.load(open('jpprices.json'))
  if old.get('p')==out:print('unverändert');raise SystemExit(0)
except (FileNotFoundError,ValueError):pass
json.dump({'src':'pokeca-souba (JP-Markt)','url':'https://pokeca-souba.vercel.app/screener','date':datetime.date.today().isoformat(),'p':out},open('jpprices.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(out),'Preise; ohne Set-Zuordnung:',len(miss),sorted(miss)[:20])
