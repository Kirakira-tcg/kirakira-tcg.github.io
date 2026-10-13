#!/usr/bin/env python3
"""Baut Bild-Fingerabdruecke fuer window.matchCardImage (app.js) aus TCGdex-Kartenbildern.
Copyright: Es werden NUR Fingerabdruecke gespeichert (80 Hex-Zeichen pro Karte), nie Bilder.
Bilder werden nur im Arbeitsspeicher bzw. in einem lokalen Cache ausserhalb des Repos gelesen.

Ausgabe (im Repo-Root):
  fp/intl/<setId>.json   DE/EN-Karten (gleiche IDs wie TCGdex de/en, z.B. sv01-086, 30th-023)
  fp/ja/<setId>.json     JA-Karten (TCGdex /v2/ja, z.B. SV4a-115)
  fp/index.json          {"v":1,"intl":{setId:anzahl},"ja":{...}}
  fp/all-intl.txt, fp/all-ja.txt   globaler Index: je Zeile "<cardId> <112 hex>" (fuer Suche ohne setIds)
Shard-Format: {"v":1,"s":"<setId>","c":[["<localId>","<112 hex>"],...]}  cardId = setId + "-" + localId

Fingerabdruck (muss exakt zu fpOf() in app.js passen):
  Artwork-Ausschnitt x 8%..92%, y 11%..53% der Karte (Standardkarten; bei Full-Arts ist alles Artwork)
  -> 32x32 RGB (Flaechenmittel) -> Grau 0.299/0.587/0.114
  pHash: 2D-DCT-II 32x32, Koeffizienten [0..7]x[0..7], Bit = Koeff > Median (ohne DC) -> 16 hex
  dHash: 8x8 Blockmittel (4x4 px), Bit = m[y][x] > m[y][(x+1)%8]                     -> 16 hex
  Farbe: 4x4 Blockmittel R,G,B, je 4 Bit (v>>4)                                       -> 48 hex
Aufruf: python3 tools/build_fingerprints.py [--lang intl|ja|all] [--sets sv01,30th] [--cache DIR]"""
import json,os,re,io,sys,time,argparse,urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image
CROP=(0.08,0.11,0.92,0.53)
WCROP=(0.04,0.03,0.96,0.97)
FPV=2
API='https://api.tcgdex.net/v2/'
POCKET=re.compile(r'^(a\d+[a-z]?|b\d+[a-z]?|p-[ab])$',re.I)
N=32;_k=np.arange(N);DCT=np.cos(np.pi*(2*_k[None,:]+1)*_k[:,None]/(2*N))
def get(u,tries=4):
    for i in range(tries):
        try:return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'kartenapp-fp/1'}),timeout=30).read()
        except urllib.error.HTTPError as e:
            if e.code==404:return None
            time.sleep(1+i)
        except Exception:time.sleep(1+i)
    return None
def area_resize(a,w,h):
    """Flaechenmittel-Verkleinerung (float), wie im Browser via Zwischenstufen naeherungsweise."""
    return np.asarray(Image.fromarray(a.astype(np.uint8)).resize((w,h),Image.BOX),dtype=np.float64)
def crop32(img,cr):
    W,H=img.size;x0,y0,x1,y1=cr
    return np.asarray(img.crop((round(x0*W),round(y0*H),round(x1*W),round(y1*H))).resize((N,N),Image.BOX),dtype=np.float64)
def fp_from_rgb(img):
    """img: PIL RGB der ganzen Karte. 80 hex Artwork + 32 hex ganze Karte (v2)."""
    return fp_from_32(crop32(img,CROP))+whole_from_32(crop32(img,WCROP))
def whole_from_32(a):
    """v2: pHash+dHash der ganzen Karte (x 4..96 %, y 3..97 %), robust gegen verschobenen Artwork-Zuschnitt."""
    return fp_from_32(a)[:32]
def bits_hex(bits):
    v=0
    for b in bits:v=(v<<1)|int(bool(b))
    return '%016x'%v
def fp_from_32(a):
    g=a[...,0]*0.299+a[...,1]*0.587+a[...,2]*0.114
    d=DCT@g@DCT.T;c=d[:8,:8].flatten();med=np.median(c[1:])
    ph=bits_hex(c>med)
    m=g.reshape(8,4,8,4).mean(axis=(1,3));dh=bits_hex((m>np.roll(m,-1,axis=1)).flatten())
    col=a.reshape(4,8,4,8,3).mean(axis=(1,3));cq=np.clip(col,0,255).astype(int)>>4
    return ph+dh+''.join('%x'%v for v in cq.flatten())
def fp_url(base,cache):
    p=None
    if cache:
        p=os.path.join(cache,re.sub(r'[^A-Za-z0-9._-]','_',base.split('assets.tcgdex.net/')[-1])+'.webp')
        if os.path.exists(p):
            try:return fp_from_rgb(Image.open(p).convert('RGB'))
            except Exception:pass
    b=get(base+'/low.webp')
    if not b:return None
    if p:open(p,'wb').write(b)
    try:return fp_from_rgb(Image.open(io.BytesIO(b)).convert('RGB'))
    except Exception:return None
def cards(lang):
    if lang=='ja':
        L=json.loads(get(API+'ja/cards'));R=[(c['id'],c['image']) for c in L if c.get('image')]
        # Viele JA-Sets haben in der API kein image-Feld, die Bilder liegen aber trotzdem auf assets.tcgdex.net/ja/<Serie>/<Set>/<Nr>
        # -> Set fuer Set mit der ersten Karte pruefen (404 = TCGdex hat keine Bilder fuer das Set)
        have={c.rsplit('-',1)[0] for c,_ in R};probe={}
        def one(s):
            if s['id'] in have or POCKET.match(s['id']):return
            d=json.loads(get(API+'ja/sets/'+urllib.request.quote(s['id'])) or b'{}');C=d.get('cards') or [];ser=(d.get('serie') or {}).get('id')
            if not C or not ser:probe[s['id']]=0;return
            base='https://assets.tcgdex.net/ja/'+ser+'/'+s['id']+'/'
            ok=get(base+C[0]['localId']+'/low.webp',tries=2)
            probe[s['id']]=len(C) if ok else 0
            if ok:R.extend((c['id'],base+c['localId']) for c in C)
        with ThreadPoolExecutor(12) as ex:list(ex.map(one,json.loads(get(API+'ja/sets'))))
        print('ja Sets per Asset-Pruefung ergaenzt:',sorted(k for k,v in probe.items() if v),flush=True)
        print('ja Sets ohne Bilder bei TCGdex:',sorted(k for k,v in probe.items() if not v),flush=True)
        return R
    seen={}
    for l in ('en','de'):  # Artwork ist sprachunabhaengig: EN-Bild bevorzugt, sonst DE
        for c in json.loads(get(API+l+'/cards')):
            if c.get('image') and c['id'] not in seen:seen[c['id']]=c['image']
    return list(seen.items())
def same_art(out,lang,maxd=6):
    """sameArt-Gruppen: Karten mit (fast) identischem Artwork (pHash+dHash Artwork <=maxd Bit UND ganze Karte <=20 Bit
    ODER Artwork <=2 Bit). Ausgabe fp/same-<lang>.json: [[cardId,...],...] (nur Gruppen >=2)."""
    ids=[];A=[];Wh=[]
    for l in open(os.path.join(out,'all-'+lang+'.txt')):
        i,h=l.split();ids.append(i)
        A.append(np.unpackbits(np.frombuffer(bytes.fromhex(h[:32]),np.uint8)));Wh.append(np.unpackbits(np.frombuffer(bytes.fromhex(h[80:112]),np.uint8)) if len(h)>=112 else np.zeros(128,np.uint8))
    A=np.array(A,bool);Wh=np.array(Wh,bool);n=len(ids);par=list(range(n))
    def f(x):
        while par[x]!=x:par[x]=par[par[x]];x=par[x]
        return x
    for i in range(n):
        d=(A[i+1:]!=A[i]).sum(1);dw=(Wh[i+1:]!=Wh[i]).sum(1)
        for j in np.nonzero((d<=2)|((d<=maxd)&(dw<=20)))[0]:par[f(i)]=f(i+1+j)
    G={}
    for i in range(n):G.setdefault(f(i),[]).append(ids[i])
    L=[g for g in G.values() if len(g)>1]
    json.dump(L,open(os.path.join(out,'same-'+lang+'.json'),'w'),separators=(',',':'))
    print(lang,'sameArt-Gruppen',len(L),'Karten',sum(map(len,L)),flush=True)
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--lang',default='all');ap.add_argument('--sets');ap.add_argument('--cache');ap.add_argument('--out',default='fp')
    o=ap.parse_args();want=set(o.sets.split(',')) if o.sets else None
    if o.cache:os.makedirs(o.cache,exist_ok=True)
    idx={'v':FPV,'crop':CROP,'wcrop':WCROP}
    if os.path.exists(os.path.join(o.out,'index.json')):idx.update(json.load(open(os.path.join(o.out,'index.json'))))
    for lang in (['intl','ja'] if o.lang=='all' else [o.lang]):
        L=[]
        for cid,img in cards(lang):
            sid,lid=cid.rsplit('-',1) if '-' in cid else (None,None)
            if not sid or POCKET.match(sid) or (want and sid not in want):continue
            L.append((sid,lid,cid,img))
        print(lang,len(L),'Karten',flush=True)
        with ThreadPoolExecutor(24) as ex:F=list(ex.map(lambda t:fp_url(t[3],o.cache),L))
        S={}
        for (sid,lid,cid,img),f in zip(L,F):
            if f:S.setdefault(sid,[]).append([lid,f])
        os.makedirs(os.path.join(o.out,lang),exist_ok=True)
        cnt=idx.get(lang,{}) if want else {}
        for sid,C in S.items():
            json.dump({'v':FPV,'s':sid,'c':C},open(os.path.join(o.out,lang,sid+'.json'),'w'),separators=(',',':'),ensure_ascii=False);cnt[sid]=len(C)
        idx[lang]=cnt
        with open(os.path.join(o.out,'all-'+lang+'.txt'),'w') as f:
            for sid in sorted(cnt):
                try:d=json.load(open(os.path.join(o.out,lang,sid+'.json')))
                except Exception:continue
                for lid,h in d['c']:f.write(f'{sid}-{lid} {h}\n')
        same_art(o.out,lang)
        print(lang,'ok',sum(1 for f in F if f),'von',len(L),'in',len(S),'Sets',flush=True)
    json.dump(idx,open(os.path.join(o.out,'index.json'),'w'),separators=(',',':'))
if __name__=='__main__':main()
