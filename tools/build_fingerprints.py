#!/usr/bin/env python3
"""Baut Bild-Fingerabdruecke fuer window.matchCardImage (app.js) aus TCGdex-Kartenbildern.
Copyright: Es werden NUR Fingerabdruecke gespeichert (80 Hex-Zeichen pro Karte), nie Bilder.
Bilder werden nur im Arbeitsspeicher bzw. in einem lokalen Cache ausserhalb des Repos gelesen.

Ausgabe (im Repo-Root):
  fp/intl/<setId>.json   DE/EN-Karten (gleiche IDs wie TCGdex de/en, z.B. sv01-086, 30th-023)
  fp/ja/<setId>.json     JA-Karten (TCGdex /v2/ja, z.B. SV4a-115)
  fp/index.json          {"v":1,"intl":{setId:anzahl},"ja":{...}}
  fp/all-intl.txt, fp/all-ja.txt   globaler Index: je Zeile "<cardId> <80 hex>" (fuer Suche ohne setIds)
Shard-Format: {"v":1,"s":"<setId>","c":[["<localId>","<80 hex>"],...]}  cardId = setId + "-" + localId

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
def fp_from_rgb(img):
    """img: PIL RGB der ganzen Karte."""
    W,H=img.size;x0,y0,x1,y1=CROP
    art=img.crop((round(x0*W),round(y0*H),round(x1*W),round(y1*H))).resize((N,N),Image.BOX)
    a=np.asarray(art,dtype=np.float64)
    return fp_from_32(a)
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
        L=json.loads(get(API+'ja/cards'));return [(c['id'],c['image']) for c in L if c.get('image')]
    seen={}
    for l in ('en','de'):  # Artwork ist sprachunabhaengig: EN-Bild bevorzugt, sonst DE
        for c in json.loads(get(API+l+'/cards')):
            if c.get('image') and c['id'] not in seen:seen[c['id']]=c['image']
    return list(seen.items())
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--lang',default='all');ap.add_argument('--sets');ap.add_argument('--cache');ap.add_argument('--out',default='fp')
    o=ap.parse_args();want=set(o.sets.split(',')) if o.sets else None
    if o.cache:os.makedirs(o.cache,exist_ok=True)
    idx={'v':1,'crop':CROP}
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
            json.dump({'v':1,'s':sid,'c':C},open(os.path.join(o.out,lang,sid+'.json'),'w'),separators=(',',':'),ensure_ascii=False);cnt[sid]=len(C)
        idx[lang]=cnt
        with open(os.path.join(o.out,'all-'+lang+'.txt'),'w') as f:
            for sid in sorted(cnt):
                try:d=json.load(open(os.path.join(o.out,lang,sid+'.json')))
                except Exception:continue
                for lid,h in d['c']:f.write(f'{sid}-{lid} {h}\n')
        print(lang,'ok',sum(1 for f in F if f),'von',len(L),'in',len(S),'Sets',flush=True)
    json.dump(idx,open(os.path.join(o.out,'index.json'),'w'),separators=(',',':'))
if __name__=='__main__':main()
