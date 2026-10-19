#!/usr/bin/env python3
"""Fingerabdruecke fuer Sets ohne TCGdex-Bilder (v185: 30th-c = 30th Celebration: Classic Collection).
Bilder kommen NUR ueber die woertlichen URLs aus imgmap.json (pokemontcg.io-API, u. a. images.scrydex.com),
werden nur im Arbeitsspeicher gelesen (kein Cache, keine Dateien) und sofort verworfen.
Gespeichert werden nur die Fingerabdruecke (gleiches Verfahren wie build_fingerprints.py / fpOf() in app.js).
Aufruf (im Repo-Root): python3 tools/build_fp_imgmap.py [--sets 30th-c]"""
import json,os,io,sys,argparse
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import build_fingerprints as B
def fp_mem(u):
    b=B.get(u)
    if not b:return None
    try:return B.fp_from_rgb(Image.open(io.BytesIO(b)).convert('RGB'))
    except Exception:return None
    finally:del b
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--sets',default='30th-c');ap.add_argument('--out',default='fp');o=ap.parse_args()
    M=json.load(open('imgmap.json'));idx=json.load(open(os.path.join(o.out,'index.json')))
    for sid in o.sets.split(','):
        L=sorted((k[len(sid)+1:],v['url']) for k,v in M.items() if k.rsplit('-',1)[0]==sid and v.get('url'))
        with ThreadPoolExecutor(6) as ex:F=list(ex.map(lambda t:fp_mem(t[1]),L))
        C=[[lid,f] for (lid,_),f in zip(L,F) if f]
        print(sid,len(C),'von',len(L),flush=True)
        if not C:continue
        json.dump({'v':B.FPV,'s':sid,'c':C},open(os.path.join(o.out,'intl',sid+'.json'),'w'),separators=(',',':'),ensure_ascii=False)
        idx['intl'][sid]=len(C)
    with open(os.path.join(o.out,'all-intl.txt'),'w') as f:
        for sid in sorted(idx['intl']):
            try:d=json.load(open(os.path.join(o.out,'intl',sid+'.json')))
            except Exception:continue
            for lid,h in d['c']:f.write(f'{sid}-{lid} {h}\n')
    B.same_art(o.out,'intl')
    json.dump(idx,open(os.path.join(o.out,'index.json'),'w'),separators=(',',':'))
if __name__=='__main__':main()
