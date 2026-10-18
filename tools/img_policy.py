#!/usr/bin/env python3
"""Bild-Regeln fuer jpprices.json / jpcards.json (keine Hotlinks zu riskanten Hosts).
Erlaubt: assets.tcgdex.net, images.pokemontcg.io, images.scrydex.com, limitlesstcg (DigitalOcean).
Riskante Hosts (pokemon-card.com, snkrdunk, tcgplayer, serebii, pokeca.net) werden durch das
TCGdex-JA-Bild derselben Karte ersetzt (Set-ID + Nummer + gleicher Name), sonst kein Bild
(App zeigt Platzhalter mit Name + Nummer). Nie ein falsches Kartenbild.
Aufruf: python3 tools/img_policy.py   (im Repo-Root; wird auch von build_jpprices.py/build_covers.py genutzt)"""
import json,re,os,time,urllib.request,urllib.parse,urllib.error
from concurrent.futures import ThreadPoolExecutor
BAD=re.compile(r'^https?://([^/]*\.)?(pokemon-card\.com|snkrdunk\.com|tcgplayer\.com|serebii\.net|pokeca\.net|pokeca-souba\.[a-z.]+|limitlesstcg\.nyc3\.cdn\.digitaloceanspaces\.com)(/|$)',re.I)
OK=re.compile(r'^https://(assets\.tcgdex\.net|images\.pokemontcg\.io)/',re.I)  # v143: nur TCGdex/pokemontcg.io
def safe(u):return bool(u) and bool(OK.match(u)) and not BAD.match(u)
nrm=lambda x:re.sub(r'[\s・･]','',x or '').lower()
nz=lambda x:re.sub(r'^0+(?=\d)','',str(x or '').split('/')[0].strip())
_C={}
def tset(sid):
    if sid in _C:return _C[sid]
    d=None
    for i in range(3):
        try:d=json.load(urllib.request.urlopen(urllib.request.Request('https://api.tcgdex.net/v2/ja/sets/'+urllib.parse.quote(sid),headers={'User-Agent':'Mozilla/5.0'}),timeout=30));break
        except urllib.error.HTTPError as e:
            if e.code==404:break
        except Exception:time.sleep(1+i)
    _C[sid]=d;return d
def prefetch(ids):
    with ThreadPoolExecutor(8) as ex:list(ex.map(tset,[i for i in set(ids) if i not in _C]))
def tdx_img(sid,num,name):
    """TCGdex-JA-Bild nur bei exakt gleicher Nummer UND gleichem Namen."""
    s=tset(sid)
    for c in (s or {}).get('cards',[]):
        if nz(c.get('localId'))==nz(num) and c.get('image') and nrm(c.get('name'))==nrm(name):return c['image']+'/high.webp'
    return None
def fix_prices(p,stats=None):
    prefetch(k.rsplit('-',1)[0] for k in p)
    for k,v in p.items():
        u=v.get('i') or ''
        if safe(u):continue
        h=(re.match(r'https?://([^/]+)',u) or [None,'-'])[1]
        sid,num=k.rsplit('-',1);t=tdx_img(sid,num,v.get('n'))
        if t:v['i']=t
        else:v.pop('i',None)
        if stats is not None:stats.setdefault(h,[0,0])[0 if t else 1]+=1
    return p
def fix_cards(d,p,stats=None):
    """jpcards: Bild -> volle URL (nur sichere Hosts) ueber jpprices (gleiche Set+Nr+Name) oder TCGdex.
    Sonst bleibt nur der relative Dateiname (ID-Schluessel fuer Karten ohne Nummer, z.B. Energien); die App laedt nur http(s)-URLs."""
    base=d.get('base','')
    prefetch({r[0] for r in d['c']})
    for r in d['c']:
        u=r[4] if re.match(r'https?://',r[4] or '') else (base+r[4] if r[4] and base else '')
        if safe(u):r[4]=u;continue
        e=p.get(f"{r[0]}-{nz(r[1])}") if r[1] else None
        t=(e['i'] if e and safe(e.get('i')) and nrm(e.get('n'))==nrm(r[3]) else None) or (tdx_img(r[0],r[1],r[3]) if r[1] else None)
        r[4]=t or re.sub(r'^https?://[^/]+/assets/images/card_images/large/','',u)  # relativer Pfad bleibt nur als ID-Schluessel (wird nie geladen)
        h=(re.match(r'https?://([^/]+)',u) or [None,'-'])[1]
        if stats is not None:stats.setdefault('jpcards:'+h,[0,0])[0 if t else 1]+=1
    d['base']=''
    cov=d.get('covers',{})
    for sid,u in list(cov.items()):
        if safe(u):continue
        s=tset(sid);cs=[c for c in (s or {}).get('cards',[]) if c.get('image')]
        alt=(cs[0]['image'] if cs else None) or next((r[4] for r in d['c'] if r[0]==sid and safe(r[4])),None) \
            or next((v['i'] for k,v in p.items() if k.rsplit('-',1)[0]==sid and safe(v.get('i'))),None)
        if alt:cov[sid]=alt
        else:cov.pop(sid)
        if stats is not None:stats.setdefault('covers:'+(re.match(r'https?://([^/]+)',u) or [None,'-'])[1],[0,0])[0 if alt else 1]+=1
    return d
if __name__=='__main__':
    D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..');P=os.path.join(D,'jpprices.json');J=os.path.join(D,'jpcards.json')
    jj=json.load(open(J,encoding='utf8'));st={}
    fix_cards(jj,{},st)  # v142: jpprices.json (pokeca-souba) entfernt
    json.dump(jj,open(J,'w',encoding='utf8'),ensure_ascii=False,separators=(',',':'))
    for k,(a,b) in sorted(st.items()):print(f'{k}: ersetzt {a}, Platzhalter/entfernt {b}')
