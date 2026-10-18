#!/usr/bin/env python3
"""Baut setxref.json: internationale Sets (TCGdex-ID, DE/EN-Name) + belegte japanische Gegenstücke.
Nur echte Daten, nichts geraten:
- DE/EN-Namen: https://api.tcgdex.net/v2/{de,en}/sets (gleiche Set-ID in allen Sprachen).
- JP-Gegenstück: Kartenlisten beider Sets bei TCGdex (/v2/en/sets/<id>, /v2/ja/sets/<id>).
  Jede Pokémon-Karte -> (Dex-Nr. aus names.js/PokeAPI, Zusatz ex/V/VMAX/VSTAR/GX/EX/BREAK/Mega).
  Ein JP-Set gilt als Gegenstück eines internationalen Sets nur, wenn
  (1) >= 60 % seiner Pokémon-Karten im internationalen Set vorkommen (50–60 % nur bei doppeltem Abstand zum Zweitbesten),
  (2) das internationale Set klar vor dem Zweitbesten liegt (Abstand >= MARGIN),
  (3) das internationale Set 0–400 Tage nach dem JP-Set erschien (Erscheinungsdaten TCGdex),
  (4) mindestens MINCARDS Pokémon-Karten verglichen wurden.
  Unsichere Paare fallen weg. Je Paar wird die Quelle (Abdeckung, Anzahl Karten) gespeichert.
- JP-Namen: TCGdex JA; korrigiert durch jpsetnames.json (geprüfte Namen, z. B. SV4a).
jpNoList: JP-Sets, für die TCGdex nur die Kartenanzahl, aber keine Kartenliste führt (z. B. S4a).
Aufruf: python3 tools/build_setxref.py [setxref.json]   (Cache in /tmp/xc)"""
import json,re,os,sys,datetime,unicodedata,urllib.request,concurrent.futures as cf
API='https://api.tcgdex.net/v2'
MINCOV,MARGIN,MINCARDS=0.6,0.15,20
LOWCOV=0.5  # 50–60 % nur, wenn das Set mindestens doppelt so gut passt wie das Zweitbeste
def get(u):
  f='/tmp/xc/'+re.sub(r'[^A-Za-z0-9.]+','_',u[len(API):])+'.json'
  if os.path.exists(f):return json.load(open(f))
  try:d=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'kartenapp-builder'}),timeout=30).read())
  except Exception as e:d=None
  json.dump(d,open(f,'w'));return d
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P=json.loads(re.search(r'PNAMES=(\[.*\])',open(os.path.join(root,'names.js'),encoding='utf-8').read(),re.S).group(1))
N=lambda s:unicodedata.normalize('NFKC',s or '')
EN=sorted(((r[0],i) for i,r in enumerate(P) if r[0]),key=lambda x:-len(x[0]))
JA=sorted(((r[2],i) for i,r in enumerate(P) if len(r)>2 and r[2]),key=lambda x:-len(x[0]))
ENSET={nm:i for nm,i in EN}
KC={}
def key(name,lang):
  if (name,lang) in KC:return KC[(name,lang)]
  n=N(name);hit=None
  if lang=='en':
    w=re.findall(r"[A-Za-z0-9'.:\-é♀♂]+",n)
    for L in (3,2,1):
      for a in range(len(w)-L+1):
        t=' '.join(w[a:a+L])
        if t in ENSET:hit=(t,ENSET[t]);break
      if hit:break
  else:
    for nm,i in JA:
      if nm in n:hit=(nm,i);break
  r=None
  if hit:
    nm,i=hit;rest=n.replace(nm,' ')
    suf=next((t for t in ['VMAX','VSTAR','BREAK','GX','EX','ex','V'] if re.search(r'(^|[^A-Za-z])'+t+r'($|[^A-Za-z])',rest)),'')
    mega='M' if re.search(r'^(Mega|M) |メガ',n) else ''
    r=f'{i}:{mega}{suf}'
  KC[(name,lang)]=r;return r
def fp(cards,lang):
  m={}
  for c in cards or []:
    k=key(c.get('name'),lang)
    if k:m[k]=m.get(k,0)+1
  return m
inter=lambda a,b:sum(min(v,b.get(k,0)) for k,v in a.items())
def pool(urls):
  with cf.ThreadPoolExecutor(8) as ex:return list(ex.map(get,urls))
os.makedirs('/tmp/xc',exist_ok=True)
en=[s for s in get(API+'/en/sets') if not re.match(r'^(A\d|P-A|B\d)',s['id'])]
de={s['id']:s['name'] for s in get(API+'/de/sets')}
ja=get(API+'/ja/sets')
jsn=json.load(open(os.path.join(root,'jpsetnames.json'),encoding='utf-8'))['sets']
ED=pool([API+'/en/sets/'+s['id'] for s in en]);JD=pool([API+'/ja/sets/'+s['id'] for s in ja])
ED={d['id']:d for d in ED if d};JD={d['id']:d for d in JD if d}
EF={k:fp(d.get('cards'),'en') for k,d in ED.items()};JF={k:fp(d.get('cards'),'ja') for k,d in JD.items()}
dt=lambda s:datetime.date.fromisoformat(s) if s and re.match(r'\d{4}-\d\d-\d\d$',s) else None
pairs={};skips=[]
for jid,jf in JF.items():
  tot=sum(jf.values())
  if tot<MINCARDS:continue
  jd=dt(JD[jid].get('releaseDate'))
  sc=[]
  for eid,ef in EF.items():
    sh=inter(jf,ef)
    if not sh:continue
    ed=dt(ED[eid].get('releaseDate'))
    ok=bool(jd and ed and 0<=(ed-jd).days<=400)
    sc.append((sh/tot,sh,eid,ok,(ed-jd).days if jd and ed else None))
  sc.sort(reverse=True)
  if not sc:continue
  b=sc[0];s2=sc[1][0] if len(sc)>1 else 0
  why=None
  if b[0]<MINCOV and not (b[0]>=LOWCOV and b[0]>=2*s2):why=f'Abdeckung {b[0]:.0%} (nächstes {sc[1][2] if len(sc)>1 else "-"} {s2:.0%})'
  elif b[0]-s2<MARGIN:why=f'nicht eindeutig ({b[2]} {b[0]:.0%} vs {sc[1][2]} {s2:.0%})'
  elif not b[3]:why=f'Datum passt nicht ({b[4]} Tage)'
  if why:skips.append((jid,b[2],why));continue
  pairs.setdefault(b[2],[]).append({'id':jid,'cov':round(b[0],2),'n':b[1],'of':tot,'next':round(s2,2)})
out=[]
for s in en:
  e=ED.get(s['id'],{});r={'id':s['id'],'en':s['name']}
  if de.get(s['id']):r['de']=de[s['id']]
  if e.get('releaseDate'):r['d']=e['releaseDate']
  if e.get('serie',{}).get('name'):r['s']=e['serie']['name']
  if s['id'] in pairs:
    r['jp']=[]
    for p in sorted(pairs[s['id']],key=lambda x:x['id']):
      j=JD[p['id']];nm=(jsn.get(p['id']) or {}).get('ja') or j.get('name')
      r['jp'].append({'id':p['id'],'ja':nm,**({'en':jsn[p['id']]['en']} if p['id'] in jsn else {}),'src':f"TCGdex-Kartenlisten: {p['n']} von {p['of']} JP-Pokémon-Karten im Set ({p['cov']:.0%}, nächstes Set {p['next']:.0%})"})
  out.append(r)
o=sys.argv[1] if len(sys.argv)>1 else os.path.join(root,'setxref.json')
nolist=sorted(k for k,d in JD.items() if not d.get('cards') and ((d.get('cardCount') or {}).get('total') or 0)>0)
json.dump({'v':1,'built':datetime.date.today().isoformat(),'jpNoList':nolist,'source':'api.tcgdex.net (Set- und Kartenlisten en/de/ja); JP-Namen korrigiert durch jpsetnames.json; Methode: tools/build_setxref.py','sets':out},open(o,'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(sum(len(v) for v in pairs.values()),'JP-Sets zugeordnet zu',len(pairs),'internationalen Sets;',len(out),'Sets gesamt')
for x in skips:print('SKIP',*x)
