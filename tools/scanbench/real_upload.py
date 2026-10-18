"""Real-upload gate (v155): cold page, photos uploaded one after another through #uploadFile exactly like a user,
UI-level outcome per photo (auto panel / sheet name / sheet language / rank of the right card in the sheet grid).
Photos are NOT in the repo; pass a manifest (same format as the scanbench manifests) via MANIFEST=... .
Usage: MANIFEST=/path/manifest.json W=1280 WAIT=20 python3 tools/scanbench/real_upload.py http://localhost:8137/ > out.jsonl"""
import asyncio,json,sys,time,glob,os
from playwright.async_api import async_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8137/'
W=int(os.environ.get('W','1280'));WAIT=float(os.environ.get('WAIT','20'))
only=os.environ.get('ONLY','')
man={os.path.basename(m['photo'])[:2]:m for m in json.load(open(os.environ['MANIFEST']))}
HOOK="""(()=>{window.__T={};const a0=window.analyze0,a=window.analyze;window.__cmap={};const nc=window.nmCands;if(nc)window.nmCands=async(...x)=>{const C=await nc(...x);try{(C||[]).forEach(c=>{window.__cmap[(c.name||'')+'|'+(c.localId||'')]=c.id})}catch(e){}return C};const fb=window.attachImgFallback;if(fb)window.attachImgFallback=(im,c)=>{try{if(im&&c&&c.id){im.dataset.cid=c.id}}catch(e){}return fb(im,c)};window.analyze0=async(...x)=>{const t=performance.now();const r=await a0(...x);window.__T.r0=Math.round(performance.now()-t);window.__T.r0name=r&&r.name;return r};})()"""
UI="""()=>{const q=s=>document.querySelector(s);const f=q('#nmSheet');const conf=q('#confirmBox')||q('.confirm');
const vis=e=>e&&e.offsetParent!==null;const cs=f?[...f.querySelectorAll('.nmgrid .spThumb')].map(x=>{const t=x.querySelector(':scope > span')?.textContent||'';const p=t.split(' · ');return x.querySelector('img')?.dataset.cid||(window.__cmap||{})[p[0]+'|'+p[p.length-1]]||t}):[];
const hd=(f&&f.querySelector('b')||{}).textContent||'';const cf=q('#scanConfirm');const sp=q('#scanPick');const spv=sp&&!sp.hidden&&vis(sp)?sp.textContent.trim().slice(0,120):'';return {pick:spv,head:hd.slice(0,80),confirm:cf?cf.textContent.trim().slice(0,90):'',sheet:!!(f&&vis(f)),name:f&&f.name?f.name.value:'',num:f&&f.num?f.num.value:'',hb:(f&&f.querySelector('.nmbg')||{}).textContent||'',lang:f?(f.querySelector('.nmlang .chip.on')?.dataset.l||'-'):'',
 cands:cs,ls:window.lastScan?{id:window.lastScan.id||window.lastScan.tdxId||'',name:window.lastScan.name,lang:window.lastScan.lang}:null,
 toast:[...document.querySelectorAll('.toast,#toast')].filter(vis).map(e=>e.textContent.trim().slice(0,80)),
 banner:(q('#scanStatus2')||{}).textContent||'',T:window.__T}}"""
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch()
        ctx=await br.new_context(viewport={'width':W,'height':900 if W>500 else 860},service_workers='block')
        pg=await ctx.new_page()
        thr=float(os.environ.get('THROTTLE','1'))
        if thr>1:
            cdp=await ctx.new_cdp_session(pg);await cdp.send('Emulation.setCPUThrottlingRate',{'rate':thr})
        await pg.goto(URL,wait_until='load');await pg.wait_for_function("typeof analyze==='function'")
        await pg.evaluate("go('v-scan')");await pg.evaluate(HOOK)
        for k in sorted(man):
            if only and k not in only.split(','):continue
            m=man[k];await pg.evaluate("window.__T={};window.lastScan=null;document.querySelectorAll('#nmSheet').forEach(e=>e.remove&&0)")
            t0=time.time();await pg.set_input_files('#uploadFile',m['photo'])
            first=None;snap=None
            while time.time()-t0<WAIT:
                await asyncio.sleep(.25);s=await pg.evaluate(UI)
                if first is None and (s['sheet'] or s['ls'] or s['confirm']):first=round(time.time()-t0,1);tf=time.time()
                if first is not None and snap is None and time.time()-tf>=1.0:snap=s
            s=await pg.evaluate(UI)
            exp=m['id'];rank=(s['cands'].index(exp)+1) if exp in s['cands'] else None
            print(json.dumps(dict(nr=k,exp=exp,plang=m.get('plang'),first_s=first,user=snap and dict(pick=snap['pick'],head=snap['head'],confirm=snap['confirm'],name=snap['name'],num=snap['num'],lang=snap['lang'],hb=snap['hb'][:40],cands=snap['cands'][:40]),first_name=snap and snap['name'],final_name=s['name'],num=s['num'],hb=s['hb'][:40],pick=s['pick'],lang=s['lang'],ls=s['ls'],rank=rank,ncand=len(s['cands']),cands=s['cands'][:6],toast=s['toast'],T=s['T']),ensure_ascii=False),flush=True)
            await pg.evaluate("try{document.querySelector('#nmSheet')&&closeNm&&closeNm()}catch(e){};try{go('v-scan')}catch(e){}")
            await pg.keyboard.press('Escape')
        await br.close()
asyncio.run(main())
