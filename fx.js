'use strict';
// Effekte: Holo-Tilt, Hochzählen, Booster-Reveal, Binder
window.FX=(()=>{
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const TC={grass:'#3ccf6e',fire:'#ff6a3d',water:'#3aa7ff',lightning:'#ffd23f',psychic:'#c65bff',fighting:'#e0803a',darkness:'#5b5f8f',metal:'#9fb3c8',fairy:'#ff7ad9',dragon:'#d9a73a',colorless:'#cfd3e0',none:'#8d7bff'};
// Tilt per Pointer
function setTilt(el,x,y){el.style.setProperty('--rx',((.5-y)*16).toFixed(2)+'deg');el.style.setProperty('--ry',((x-.5)*20).toFixed(2)+'deg');el.style.setProperty('--mx',(x*100).toFixed(1)+'%');el.style.setProperty('--my',(y*100).toFixed(1)+'%');el.style.setProperty('--ho',Math.min(1,.35+Math.hypot(x-.5,y-.5)*1.4).toFixed(2))}
function target(e){return e.target.closest&&e.target.closest('.tile .im,.dcard')}
let cur=null,raf=0;
if(!RM){
 document.addEventListener('pointermove',e=>{const el=target(e);if(cur&&cur!==el)reset(cur);cur=el;if(!el)return;const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{el.classList.add('tilting');setTilt(el,x,y)})},{passive:true});
 document.addEventListener('pointerleave',()=>cur&&reset(cur));document.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse'&&cur)reset(cur)});
}
function reset(el){el.classList.remove('tilting');['--rx','--ry','--ho'].forEach(p=>el.style.removeProperty(p))}
// Gyro (iOS braucht Erlaubnis per Tipp)
let gyroOn=false;
async function gyro(){try{if(typeof DeviceOrientationEvent!=='undefined'&&DeviceOrientationEvent.requestPermission){const r=await DeviceOrientationEvent.requestPermission();if(r!=='granted')return}
 if(gyroOn)return;gyroOn=true;addEventListener('deviceorientation',e=>{if(e.gamma==null)return;const x=Math.max(0,Math.min(1,.5+e.gamma/50)),y=Math.max(0,Math.min(1,.5+(e.beta-45)/50));
  cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>document.querySelectorAll('.dcard').forEach(el=>{el.classList.add('tilting');setTilt(el,x,y)}))})}catch(e){}}
// Android: ohne Erlaubnis automatisch
if(typeof DeviceOrientationEvent!=='undefined'&&!DeviceOrientationEvent.requestPermission&&matchMedia('(pointer:coarse)').matches&&!RM)gyro();
// Hochzählen
const last=new WeakMap();
function count(el,v){const from=last.get(el)??0;last.set(el,v);const fmt=n=>{const u=S.settings.cur==='USD';return (u?n*USD:n).toLocaleString('de-DE',{style:'currency',currency:u?'USD':'EUR'})};
 if(RM||Math.abs(v-from)<.005){el.textContent=fmt(v);return}const t0=performance.now(),d=900;
 (function step(t){const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=fmt(from+(v-from)*e);if(k<1)requestAnimationFrame(step);else{el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}})(t0)}
// Booster-Reveal
function reveal(it){const L=document.getElementById('fxLayer');if(!L)return;const ty=((it.types||[])[0]||'none').toLowerCase(),col=TC[ty]||TC.none;
 const img=(it.img||'').replace('/small','/large')||it.img;
 L.innerHTML=`<div class="rv" style="--tc:${col}"><div class="rv-rays"></div>
 <div class="pack"><div class="pack-top"></div><div class="pack-body"><svg viewBox="0 0 64 64" width="70" height="70"><path d="M32 6l7 15 16 2-12 11 3 17-14-8-14 8 3-17L9 23l16-2z" fill="#fff" opacity=".95"/></svg><b>NEUE KARTE</b><small>Tippen zum Öffnen</small></div></div>
 <div class="rv-card"><div class="dcard">${img?`<img src="${esc(img)}" alt="">`:`<div class="rv-ph">${esc(it.name)}</div>`}<i class="holo"></i></div><div class="rv-name">${esc(it.name)}</div><div class="rv-price">${money(it.price)}</div><button type="button" class="primary rv-ok">Super!</button></div>
 <div class="sparks">${Array.from({length:18},(_,i)=>`<i style="--a:${i*20}deg;--d:${80+Math.random()*90}px"></i>`).join('')}</div></div>`;
 const rv=L.firstChild;L.classList.add('on');requestAnimationFrame(()=>rv.classList.add('in'));
 const open=()=>{if(rv.classList.contains('open'))return;rv.classList.add('open');navigator.vibrate?.([30,40,60])};
 rv.querySelector('.pack').onclick=open;if(RM)open();
 rv.querySelector('.rv-ok').onclick=()=>{rv.classList.add('out');setTimeout(()=>{L.classList.remove('on');L.innerHTML=''},RM?0:350)}}
// Binder-Ansicht für Sets
function binder(R,set){const tiles=[...R.children];if(!tiles.length)return;const per=9,pages=Math.ceil(tiles.length/per);let pg=0;
 const wrap=document.createElement('div');wrap.className='binder';
 wrap.innerHTML=`<div class="binder-head"><b>${esc(set?set.name:'Set')}</b><span class="muted small">${tiles.length} Karten · Sammelordner</span></div><div class="binder-page"></div><div class="binder-nav"><button type="button" class="bprev">‹</button><span class="bpg"></span><button type="button" class="bnext">›</button></div>`;
 const P=wrap.querySelector('.binder-page');
 const show=(n,dir)=>{pg=Math.max(0,Math.min(pages-1,n));P.classList.remove('flipL','flipR');void P.offsetWidth;if(dir)P.classList.add(dir>0?'flipL':'flipR');
  P.innerHTML='';tiles.slice(pg*per,pg*per+per).forEach(t=>P.append(t));wrap.querySelector('.bpg').textContent=`Seite ${pg+1} / ${pages}`};
 wrap.querySelector('.bprev').onclick=()=>show(pg-1,-1);wrap.querySelector('.bnext').onclick=()=>show(pg+1,1);
 let sx=null;P.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});P.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)show(pg+(dx<0?1:-1),dx<0?1:-1);sx=null});
 R.innerHTML='';R.append(wrap);show(0)}
// Mikro-Interaktion: Tipp-Ripple
document.addEventListener('pointerdown',e=>{const b=e.target.closest('button,.chip,.set');if(!b||RM)return;b.classList.remove('tap');void b.offsetWidth;b.classList.add('tap')},{passive:true});
return{reveal,count,binder,gyro,TC}})();
