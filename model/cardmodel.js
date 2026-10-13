// Drop-in recogniser for Kartenapp. Exposes window.CardModel.match(canvas,{setIds,lang,limit}) -> [{cardId,score}]
// canvas: deskewed card (any size, ideally 716x1000). Requires ort (onnxruntime-web) loaded globally.
(function(){
const W=160,H=224,MEAN=[.485,.456,.406],STD=[.229,.224,.225];let SESS=null,IDX=null;const SH={};let BASE='./';
async function init(o={}){BASE=o.base||BASE;if(!SESS){ort.env.wasm.numThreads=o.threads||1;SESS=await ort.InferenceSession.create(BASE+(o.model||'model_fp16.onnx'),{executionProviders:['wasm'],logSeverityLevel:3})}
 if(!IDX)IDX=await (await fetch(BASE+'emb/index.json')).json();return true}
async function shard(fam,sid){const k=fam+'/'+sid;if(!SH[k])SH[k]=fetch(BASE+'emb/'+fam+'/'+encodeURIComponent(sid)+'.bin').then(r=>r.ok?r.arrayBuffer():null).then(b=>{const R=[];if(!b)return R;const u=new Uint8Array(b);let p=0;while(p<u.length){const n=u[p++];const lid=new TextDecoder().decode(u.subarray(p,p+n));p+=n;R.push({id:sid+'-'+lid,v:new Int8Array(b,p,128)});p+=128}return R});return SH[k]}
function fams(lang){return lang==='ja'?['ja']:lang&&lang!==''?['intl']:['intl','ja']}
async function embed(cv){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingQuality='high';g.drawImage(cv,0,0,W,H);
 const d=g.getImageData(0,0,W,H).data,x=new Float32Array(3*W*H);for(let i=0,n=W*H;i<n;i++)for(let ch=0;ch<3;ch++)x[ch*n+i]=(d[i*4+ch]/255-MEAN[ch])/STD[ch];
 const out=await SESS.run({image:new ort.Tensor('float32',x,[1,3,H,W])});return out.emb.data}
async function match(cv,o={}){await init();const limit=o.limit||5,t0=performance.now();const e=await embed(cv),t1=performance.now();
 const L=[];for(const f of fams(o.lang)){const ks=IDX.sets[f]||{},S=(o.setIds&&o.setIds.length)?[...new Set(o.setIds.map(s=>ks[s]!=null?s:Object.keys(ks).find(k=>k.toLowerCase()===String(s).toLowerCase())).filter(Boolean))]:Object.keys(ks);for(const R of await Promise.all(S.map(s=>shard(f,s))))L.push(...R)}
 const top=[];for(const r of L){let s=0,nn=0;const v=r.v;for(let i=0;i<128;i++){s+=e[i]*v[i];nn+=v[i]*v[i]}s/=Math.sqrt(nn)||1;if(top.length<limit||s>top[top.length-1].score){top.push({cardId:r.id,score:+s.toFixed(4)});top.sort((a,b)=>b.score-a.score);if(top.length>limit)top.pop()}}
 match.last={inferMs:t1-t0,searchMs:performance.now()-t1,n:L.length};return top}
window.CardModel={init,match,embed};})();
