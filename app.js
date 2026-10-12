'use strict';
const API='https://api.pokemontcg.io/v2';
const K='kartenapp_v1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const USD=1.08; // grober Umrechnungskurs EUR->USD
let S=load(); S.snapshots??=[];S.wishlist??=[];S.settings??={cur:'EUR',tf:30};S.trade??={give:[],get:[]};
const money=n=>{if(n==null||isNaN(n))return'–';const u=S.settings.cur==='USD';return (u?n*USD:n).toLocaleString('de-DE',{style:'currency',currency:u?'USD':'EUR'})};
const pct=n=>n==null||!isFinite(n)?'':(n>=0?'▲ +':'▼ ')+n.toFixed(1).replace('.',',')+' %';
const cls=n=>n==null?'muted':n>=0?'pos':'neg';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function load(){try{const d=JSON.parse(localStorage.getItem(K));if(d)return d}catch(e){}
 return {collection:[{uid:'ex1',manual:true,name:'Glurak (30th Celebration, JP)',set:'30th Celebration (JP)',number:'',lang:'JP',cond:'NM',qty:1,buy:0,price:140,note:'≈ 23.120 ¥',img:''}],
  wishlist:[{uid:'ex2',apiId:'me55-152',name:'Mew ex',set:'30th Celebration',number:'152',lang:'DE',target:60,price:null,img:'https://images.scrydex.com/pokemon/me55-152/small'}],snapshots:[]}}
function save(){localStorage.setItem(K,JSON.stringify(S))}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const today=()=>new Date().toISOString().slice(0,10);
async function api(url,tries=4){for(let i=0;i<tries;i++){try{const r=await fetch(url);if(r.ok)return await r.json()}catch(e){}await new Promise(r=>setTimeout(r,800*(i+1)))}throw new Error('API nicht erreichbar')}
function cmPrice(c){const p=c.cardmarket&&c.cardmarket.prices;if(!p)return null;return p.trendPrice||p.avg30||p.averageSellPrice||p.lowPrice||null}
function cmInfo(c){const p=c.cardmarket&&c.cardmarket.prices;if(!p)return null;return{trend:p.trendPrice,avg1:p.avg1,avg7:p.avg7,avg30:p.avg30,low:p.lowPrice,sell:p.averageSellPrice,url:c.cardmarket.url}}
const DE={glurak:'Charizard',nachtara:'Umbreon',mewtu:'Mewtwo',evoli:'Eevee',bisaflor:'Venusaur',turtok:'Blastoise',gengar:'Gengar',glaziola:'Glaceon',folipurba:'Leafeon',psiana:'Espeon',aquana:'Vaporeon',blitza:'Jolteon',flamara:'Flareon',feelinara:'Sylveon',dragoran:'Dragonite',relaxo:'Snorlax',lugia:'Lugia',piepi:'Clefairy',gewaldro:'Sceptile',lohgock:'Blaziken',sumpex:'Swampert',garados:'Gyarados',simsala:'Alakazam',bisasam:'Bulbasaur',glumanda:'Charmander',schiggy:'Squirtle',rayquaza:'Rayquaza',suicune:'Suicune',lucario:'Lucario',pummeluff:'Jigglypuff',enton:'Psyduck',knogga:'Marowak',arkani:'Arcanine',lapras:'Lapras',ditto:'Ditto',zapdos:'Zapdos',lavados:'Moltres',arktos:'Articuno'};
function deName(n){return n.replace(/^(\S+)/,w=>DE[w.toLowerCase()]||w)}
function clean(s){return s.replace(/["\\]/g,'').trim()}

// Preisänderung je Artikel für Zeitraum (Tage)
function itemChange(it,days){
 const h=it.ph||[];if(h.length>=2){const cut=days?new Date(Date.now()-days*864e5).toISOString().slice(0,10):'0';const base=h.find(x=>x.d>=cut)||h[0];if(base&&base.p&&it.price&&base.d!==today())return (it.price-base.p)/base.p*100}
 const c=it.cm;if(!c||!it.price)return null;const ref=days<=1?c.avg1:days<=7?c.avg7:c.avg30;
 if(!ref)return null;return (it.price-ref)/ref*100}
function trackPrice(it){if(it.price==null)return;it.ph??=[];const d=today();it.ph=it.ph.filter(x=>x.d!==d);it.ph.push({d,p:it.price});if(it.ph.length>400)it.ph.shift()}

// Navigation
function go(v){if(v!=='v-scan')stopLive();else setTimeout(()=>window.warmOCR&&warmOCR(),0);$$('nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));$$('.view').forEach(s=>s.classList.toggle('active',s.id===v));render();window.scrollTo(0,0)}
$$('nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
$('#cur').value=S.settings.cur;$('#cur').onchange=e=>{S.settings.cur=e.target.value;save();render()};
$$('#tf button').forEach(b=>{b.classList.toggle('on',+b.dataset.d===S.settings.tf);b.onclick=()=>{S.settings.tf=+b.dataset.d;$$('#tf button').forEach(x=>x.classList.toggle('on',x===b));save();render()}});
let filt='all';$$('#filt button').forEach(b=>b.onclick=()=>{filt=b.dataset.f;$$('#filt button').forEach(x=>x.classList.toggle('on',x===b));render()});
$('#sort').onchange=render;

// Suche
$('#searchForm').onsubmit=e=>{e.preventDefault();if(window.pendingScan&&$('#qName').value!==pendingScan.name)window.pendingScan=null;search($('#qName').value,$('#qNum').value,$('#qSet').value)};
let lastResults=[];
function manualAdd(x){window.scanLang=x.lang||window.scanLang||'';addDialog(null,'coll');const f=$('#dlgForm');
 if(f.name)f.name.value=x.name||'';if(f.number)f.number.value=x.number||'';if(f.set)f.set.value=x.set||'';if(f.lang&&x.lang)f.lang.value=x.lang}
function bindMan(name,num,set){const ps=window.pendingScan||{};const x={name:ps.jp?`${ps.name} (${ps.jp})`:(ps.name||name),number:ps.number||num,set:ps.set||set,lang:ps.lang};
 ['#manScan','#manScan2'].forEach(id=>{const b=$(id);if(b)b.onclick=()=>manualAdd(x)})}
async function search(name,num,set,setId){const q=[];name=deName(clean(name||''));num=clean(num||'').split('/')[0].replace(/^0+(?=\d)/,'');set=clean(set||'');
 if(name)q.push(name.includes(' ')?`name:"${name}"`:`name:${name}*`);if(num)q.push(`number:${num}`);if(set)q.push(`set.name:"${set}*"`);if(setId)q.push(`set.id:${setId}`);
 if(!q.length)return;const R=$('#results');R.innerHTML='<p class="muted">Suche…</p>';
 try{const d=await api(`${API}/cards?q=${encodeURIComponent(q.join(' '))}&pageSize=60&select=id,name,number,set,images,cardmarket,rarity,types,supertype`);
  const ps=window.pendingScan,jpB=ps&&ps.lang&&ps.lang!=='EN'?`<div class="scanpick"><b>${ps.lang==='JP'?'🇯🇵 Japanische Karte':'Karte ('+ps.lang+')'}: ${esc(ps.name||'')} ${esc(ps.number||'')}</b><p class="muted small">${ps.lang==='JP'?'Japanische Sets sind nicht in der Preisdatenbank.':'Preise gibt es nur für die englische Version.'} Lege sie direkt an, den Preis trägst du selbst ein.</p><button type="button" class="primary big" id="manScan">➕ Manuell hinzufügen</button></div>`:'';
  if(!d.data.length){R.innerHTML=jpB+'<p class="muted">Nichts gefunden.'+(jpB?'':' <button type="button" id="manScan2">➕ Manuell hinzufügen</button>')+'</p>';bindMan(name,num,set);return}
  d.data.sort((a,b)=>setId?(parseInt(a.number)||0)-(parseInt(b.number)||0):(b.set.releaseDate||'').localeCompare(a.set.releaseDate||''));lastResults=d.data;
  R.innerHTML='';R.classList.toggle('binder-src',!!setId);for(const c of d.data){const p=cmPrice(c);const ci=cmInfo(c);const ch=ci&&ci.avg7&&p?(p-ci.avg7)/ci.avg7*100:null;
   const el=tile({type:c.types&&c.types[0],img:c.images.small,name:c.name,sub:`${c.set.name} · ${c.number}/${c.set.printedTotal}`,price:p,chg:ch,badge:c.rarity&&/Special|Hyper|Secret|Illustration/i.test(c.rarity)?'SAR/SIR':''});
   el.onclick=()=>detail({api:c});
   const a=document.createElement('div');a.className='acts';a.innerHTML='<button>+ Sammlung</button><button>☆</button>';
   a.children[0].onclick=e=>{e.stopPropagation();addDialog(c,'coll')};a.children[1].onclick=e=>{e.stopPropagation();addDialog(c,'wish')};el.append(a);R.append(el)}
  if(setId&&window.FX)FX.binder(R,SETS.find(s=>s.id===setId));if(jpB){R.insertAdjacentHTML('afterbegin',jpB);bindMan(name,num,set)}
 }catch(e){R.innerHTML=`<p class="neg">${e.message}. Bitte später erneut versuchen.</p>`}}

// Sets
let SETS=[];async function loadSets(){try{const d=await api(`${API}/sets?orderBy=-releaseDate&pageSize=250&select=id,name,series,releaseDate,images,total`);SETS=d.data;renderSets()}catch(e){$('#setList').innerHTML='<p class="muted small">Sets nicht ladbar.</p>'}}
function renderSets(){const f=$('#setFilter').value.toLowerCase();$('#setList').innerHTML='';
 for(const s of SETS.filter(s=>!f||(s.name+s.series).toLowerCase().includes(f)).slice(0,60)){const d=document.createElement('div');d.className='set';
  d.innerHTML=`<img loading="lazy" src="${s.images.logo}" alt=""><b>${esc(s.name)}</b><br><span class="muted">${esc(s.series)} · ${s.total} Karten · ${(s.releaseDate||'').slice(0,4)}</span>`;
  d.onclick=()=>{window.pendingScan=null;$('#qName').value='';$('#qNum').value='';search('','','',s.id);window.scrollTo(0,0)};$('#setList').append(d)}}
$('#setFilter').oninput=renderSets;

function addDialog(c,mode,sealed){const manual=!c;const f=$('#dlgForm');const p=c?cmPrice(c):null;
 f.innerHTML=`<h3>${mode==='wish'?'Zur Wunschliste':sealed?'Sealed-Produkt hinzufügen':'Zur Sammlung'}</h3>
 ${manual?`<label>Name<input name="name" required placeholder="${sealed?'z.B. 30 Jahre Booster Bundle':''}"></label><label>Set<input name="set"></label>${sealed?'':'<label>Nummer<input name="number"></label>'}<label>Bild-URL (optional)<input name="img"></label>`:`<p><b>${esc(c.name)}</b> – ${esc(c.set.name)} ${c.number}<br>Cardmarket-Trend: ${money(p)}</p>`}
 <label>Sprache<select name="lang">${LANGS.map(l=>`<option${l===(window.scanLang||'DE')?' selected':''}>${l}</option>`).join('')}</select></label>${window.scanLang?'<p class="muted small">Sprache per Scan erkannt: '+window.scanLang+'</p>':''}
 ${mode==='wish'?`<label>Zielpreis (€)<input name="target" type="number" step="0.01" required></label>`:
 `${sealed?'<input type="hidden" name="cond" value="Sealed">':`<label>Zustand<select name="cond"><option>NM</option><option>EX</option><option>GD</option><option>LP</option><option>PL</option><option>PSA 10</option><option>PSA 9</option><option>CGC 10</option><option>BGS 9.5</option><option>PSA/Graded</option></select></label>`}
 <label>Anzahl<input name="qty" type="number" value="1" min="1"></label><label>Kaufpreis pro Stück (€)<input name="buy" type="number" step="0.01" value="0"></label>`}
 <label>${manual?'Aktueller Wert (€)':'Eigener Preis (€, leer = Cardmarket)'}<input name="price" type="number" step="0.01" ${manual?'required':''}></label>
 <div class="row"><button value="ok">Speichern</button><button value="cancel" formnovalidate>Abbrechen</button></div>`;
 const dlg=$('#dlg');dlg.returnValue='';dlg.showModal();dlg.onclose=()=>{if(dlg.returnValue!=='ok')return;const v=Object.fromEntries(new FormData(f));
  const base=manual?{manual:true,name:v.name,set:v.set,number:v.number||'',img:v.img}:{apiId:c.id,name:c.name,set:c.set.name,number:c.number,img:c.images.small,apiPrice:p,cm:cmInfo(c),types:c.types||[]};
  if(sealed)base.type='sealed';const own=v.price?parseFloat(v.price):null;
  if(mode==='wish')S.wishlist.push({uid:uid(),...base,lang:v.lang,target:parseFloat(v.target),price:own??p,ownPrice:own});
  else{const it={uid:uid(),...base,lang:v.lang,cond:v.cond,qty:parseInt(v.qty)||1,buy:parseFloat(v.buy)||0,price:own??p,ownPrice:own,added:today()};trackPrice(it);S.collection.push(it);window.FX&&FX.reveal(it)}
  save();snapshot();render()}}
$('#manualBtn').onclick=()=>addDialog(null,'coll');$('#sealedBtn').onclick=()=>addDialog(null,'coll',true);

// Detail / Preisguide
const GRADE={'PSA 10':[3.5,'grobe Schätzung'],'PSA 9':[1.6,''],'CGC 10':[2.5,''],'BGS 9.5':[2,'']};
function detail({api:c,item,list}){const f=$('#dlgForm');const it=item||{};const ci=c?cmInfo(c):it.cm;const price=item?item.price:cmPrice(c);
 const img=c?c.images.large||c.images.small:(it.img||'').replace('/small','/large');const name=c?c.name:it.name;
 const rows=ci?[['Trend',ci.trend],['Ø 1 Tag',ci.avg1],['Ø 7 Tage',ci.avg7],['Ø 30 Tage',ci.avg30],['Ab-Preis',ci.low],['Ø Verkauf',ci.sell]].filter(r=>r[1]!=null):[];
 const raw=price||0;
 const ty=((c?c.types:it.types)||[])[0];f.innerHTML=`<div class="detail" data-type="${esc((ty||'none').toLowerCase())}">${img?`<div class="dcard tiltable"><img src="${esc(img)}" alt=""><i class="holo"></i></div><button type="button" class="chip gyroBtn" onclick="FX.gyro()">📱 Bewegungssensor</button>`:''}<h3>${esc(name)}</h3><p class="muted small">${esc(c?c.set.name:it.set)} ${esc(c?c.number:it.number)}${item?` · ${esc(it.lang)} · ${esc(it.cond)} · ${it.qty}×`:''}</p>
 <div class="big" style="font-size:1.8rem">${money(price)}</div>${item?`<div class="${cls(itemChange(it,S.settings.tf))}">${pct(itemChange(it,S.settings.tf))||'Noch keine Änderung'}</div>`:''}
 <h3>Preisguide (Cardmarket)</h3><table class="ptable">${rows.map(r=>`<tr><td>${r[0]}</td><td>${money(r[1])}</td></tr>`).join('')||'<tr><td colspan=2 class="muted">Keine Cardmarket-Daten (manuell/JP)</td></tr>'}</table>
 ${raw?`<h3>Graded (Schätzung)</h3><table class="ptable">${Object.entries(GRADE).map(([g,[k]])=>`<tr><td>${g}</td><td>≈ ${money(raw*k)}</td></tr>`).join('')}</table><p class="muted small">Faktor-Schätzung auf Raw-Preis, keine echten Graded-Verkäufe/Pop-Reports.</p>`:''}
 ${item&&it.buy?`<p>Einstand ${money(it.buy*it.qty)} · <span class="${cls(raw-it.buy)}">${raw-it.buy>=0?'+':''}${money((raw-it.buy)*it.qty)}</span></p>`:''}
 ${it.note?`<p class="muted small">${esc(it.note)}</p>`:''}${ci&&ci.url?`<p><a href="${ci.url}" target="_blank" rel="noopener" style="color:#a78bfa">Auf Cardmarket ansehen ↗</a></p>`:''}</div>
 <div class="row">${item?'<button value="edit">Preis ändern</button><button value="del" class="danger">Entfernen</button>':`<button value="add">+ Sammlung</button><button value="wish">☆ Wunsch</button>`}<button value="cancel">Schließen</button></div>`;
 const dlg=$('#dlg');dlg.returnValue='';dlg.showModal();dlg.onclose=()=>{const r=dlg.returnValue;
  if(r==='add')setTimeout(()=>addDialog(c,'coll'));if(r==='wish')setTimeout(()=>addDialog(c,'wish'));
  if(r==='edit'){const p=prompt(`Neuer Preis (€) für ${it.name}:`,it.price??'');if(p&&p.trim()){it.price=parseFloat(p.replace(',','.'));it.ownPrice=it.price;trackPrice(it);save();snapshot();render()}}
  if(r==='del'&&confirm('Wirklich entfernen?')){S[list]=S[list].filter(x=>x.uid!==it.uid);save();snapshot();render()}}}

// Preise aktualisieren
async function refreshPrices(){const btn=$('#refresh');btn.textContent='…';const items=[...S.collection,...S.wishlist].filter(x=>x.apiId);
 const ids=[...new Set(items.map(x=>x.apiId))];
 for(let i=0;i<ids.length;i+=20){const chunk=ids.slice(i,i+20);
  try{const d=await api(`${API}/cards?q=${encodeURIComponent(chunk.map(id=>'id:'+id).join(' OR '))}&select=id,cardmarket,types`);
   for(const c of d.data){const p=cmPrice(c);items.filter(x=>x.apiId===c.id).forEach(x=>{x.cm=cmInfo(c);if(c.types)x.types=c.types;if(p!=null&&x.ownPrice==null)x.price=p})}}catch(e){console.warn(e)}}
 S.collection.forEach(trackPrice);btn.textContent='⟳';save();snapshot();render()}
$('#refresh').onclick=refreshPrices;

function totals(){let v=0,b=0,n=0;for(const c of S.collection){v+=(c.price||0)*c.qty;b+=(c.buy||0)*c.qty;n+=c.qty}return{v,b,n,g:v-b}}
function snapshot(){const d=today();const t=totals();S.snapshots=S.snapshots.filter(s=>s.d!==d);S.snapshots.push({d,v:+t.v.toFixed(2)});S.snapshots.sort((a,b)=>a.d.localeCompare(b.d));save()}

function tile({img,name,sub,price,chg,badge,qty,hit,type}){const el=document.createElement('div');el.className='tile'+(hit?' hit':'');el.dataset.type=(type||'none').toLowerCase();
 el.innerHTML=`<div class="im" style="${img?`background-image:url('${esc(img)}')`:''}">${img?'':'<svg viewBox="0 0 24 24" width="40" height="40"><rect x="5" y="3" width="14" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>'}<i class="holo"></i></div>${badge?`<span class="badge">${esc(badge)}</span>`:''}${qty>1?`<span class="qty">${qty}×</span>`:''}
 <div class="n">${esc(name)}</div><div class="s">${esc(sub)}</div><div class="p"><b>${money(price)}</b><span class="${cls(chg)}">${pct(chg)}</span></div>`;return el}

function render(){const t=totals();const tf=S.settings.tf;$('#tfLbl').textContent=({1:'1T',7:'7T',30:'30T',90:'3M',365:'1J',0:'Alle'})[tf];
 window.FX?FX.count($('#sumVal'),t.v):($('#sumVal').textContent=money(t.v));$('#sumBuy').textContent=money(t.b);const g=$('#sumGain');g.textContent=(t.g>=0?'+':'')+money(t.g);g.className=cls(t.g);$('#sumCnt').textContent=t.n;
 const pts=series(tf);const ch=pts.length>=2?pts.at(-1).v-pts[0].v:0;const chp=pts.length>=2&&pts[0].v?ch/pts[0].v*100:0;
 const sc=$('#sumChg');sc.className='chg '+cls(ch);sc.textContent=`${ch>=0?'▲ +':'▼ '}${money(Math.abs(ch))} (${chp.toFixed(1).replace('.',',')} %)`;
 const C=S.collection.map(c=>({c,ch:itemChange(c,tf)}));
 const mk=(x,list)=>{const c=x.c;const el=tile({type:c.types&&c.types[0],img:c.img,name:c.name,sub:`${c.set||''} ${c.number||''} · ${c.lang}`,price:c.price,chg:x.ch,badge:c.type==='sealed'?'SEALED':/PSA|CGC|BGS|Graded/.test(c.cond)?c.cond:c.lang==='JP'?'JP':'',qty:c.qty});el.onclick=()=>detail({item:c,list});return el};
 const top=$('#topList');top.innerHTML='';[...C].sort((a,b)=>(b.c.price||0)-(a.c.price||0)).slice(0,8).forEach(x=>top.append(mk(x,'collection')));
 const tr=$('#trendList');tr.innerHTML='';const T=C.filter(x=>x.ch!=null).sort((a,b)=>Math.abs(b.ch)-Math.abs(a.ch)).slice(0,8);
 if(!T.length)tr.innerHTML='<p class="muted small">Noch keine Preisbewegungen – ab dem nächsten Preis-Update sichtbar.</p>';T.forEach(x=>tr.append(mk(x,'collection')));
 const s=$('#sort').value;let L=C.filter(x=>filt==='all'||(filt==='sealed')===(x.c.type==='sealed'));
 L.sort(s==='chg'?(a,b)=>(b.ch??-1e9)-(a.ch??-1e9):s==='name'?(a,b)=>a.c.name.localeCompare(b.c.name):s==='new'?(a,b)=>S.collection.indexOf(b.c)-S.collection.indexOf(a.c):(a,b)=>(b.c.price||0)*b.c.qty-(a.c.price||0)*a.c.qty);
 const G=$('#collGrid');G.innerHTML='';if(!L.length)G.innerHTML='<p class="muted">Noch nichts hier – über Suche oder Scan hinzufügen.</p>';L.forEach(x=>G.append(mk(x,'collection')));
 const W=$('#wishGrid');W.innerHTML='';for(const w of S.wishlist){const hit=w.price!=null&&w.price<=w.target;
  const el=tile({type:w.types&&w.types[0],img:w.img,name:w.name,sub:`Ziel ${money(w.target)} · ${w.lang}`,price:w.price,chg:itemChange(w,tf),hit,badge:hit?'✓ ZIEL':''});
  if(w.price==null)el.querySelector('.p b').textContent='keine Daten';el.onclick=()=>detail({item:w,list:'wishlist'});W.append(el)}
 renderTrade();drawChart(pts)}

function series(tf){const s=S.snapshots;if(!tf)return s;const cut=new Date(Date.now()-tf*864e5).toISOString().slice(0,10);const r=s.filter(p=>p.d>=cut);
 if(r.length<2&&s.length>=2){const prev=[...s].reverse().find(p=>p.d<cut);if(prev)return[prev,...r]}return r}
function drawChart(s){const cv=$('#chart');if(!cv.offsetParent)return;const dpr=window.devicePixelRatio||1;const W=cv.clientWidth,H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;const x=cv.getContext('2d');x.scale(dpr,dpr);
 let pts=s.map(p=>p.v);if(pts.length<2)pts=[pts[0]||0,pts[0]||0];const up=pts.at(-1)>=pts[0];const col=up?'#22c55e':'#ef4444';
 const mn=Math.min(...pts),mx=Math.max(...pts),r=(mx-mn)||1,px=i=>i*W/(pts.length-1),py=v=>H-14-(v-mn)/r*(H-34);
 x.beginPath();pts.forEach((v,i)=>i?x.lineTo(px(i),py(v)):x.moveTo(px(i),py(v)));x.strokeStyle=col;x.lineWidth=2.5;x.lineJoin='round';x.stroke();
 x.lineTo(W,H);x.lineTo(0,H);x.closePath();const gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,up?'rgba(34,197,94,.35)':'rgba(239,68,68,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fill();
 if(s.length<2){x.fillStyle='#8a93a6';x.font='12px system-ui';x.textAlign='center';x.fillText('Wertverlauf ab dem 2. Tag sichtbar',W/2,H/2-10)}}
window.addEventListener('resize',()=>render());

// Trade-Analyse
function renderTrade(){const T=S.trade;const sum=a=>a.reduce((s,x)=>s+x.v,0);const g=sum(T.give),r=sum(T.get);
 const li=(a,k)=>a.map((x,i)=>`<div class="ti"><span>${esc(x.n)}</span><span>${money(x.v)} <a data-k="${k}" data-i="${i}" style="cursor:pointer">✕</a></span></div>`).join('');
 $('#tGive').innerHTML=li(T.give,'give');$('#tGet').innerHTML=li(T.get,'get');$('#tGiveSum').textContent=money(g);$('#tGetSum').textContent=money(r);
 $$('.trade a').forEach(a=>a.onclick=()=>{T[a.dataset.k].splice(+a.dataset.i,1);save();renderTrade()});
 const tot=g+r;const share=tot?r/tot*100:50;$('#meterBar').style.width=share+'%';$('#meterBar').style.background=share>=45&&share<=55?'#7c5cff':share>55?'#22c55e':'#ef4444';
 $('#meterTxt').textContent=!tot?'Füge Karten hinzu, um einen Trade zu bewerten.':Math.abs(r-g)/tot<.1?'⚖️ Fairer Trade':r>g?`👍 Zu deinen Gunsten (+${money(r-g)})`:`👎 Zu deinen Ungunsten (${money(r-g)})`}
$('#tGiveAdd').onclick=()=>{const opts=S.collection.map((c,i)=>`${i+1}: ${c.name} (${money(c.price)})`).join('\n');const n=prompt('Nummer der Karte:\n'+opts);const c=S.collection[parseInt(n)-1];if(c){S.trade.give.push({n:c.name,v:c.price||0});save();renderTrade()}};
$('#tGetAdd').onclick=()=>{const n=prompt('Name der Karte:');if(!n)return;const v=parseFloat((prompt('Wert in €:')||'').replace(',','.'));if(!isNaN(v)){S.trade.get.push({n,v});save();renderTrade()}};

// Scan / OCR
const LANGS=['DE','EN','JP','FR','IT','ES','PT','KR','CN'];
function detectLang(t){if(/[\u3040-\u30ff]/.test(t))return'JP';if(/[\uac00-\ud7af]/.test(t))return'KR';if(/[\u4e00-\u9fff]/.test(t))return'CN';
 const T=t.toLowerCase(),k={DE:/schw[aä]che|r[uü]ckzug|resistenz|f[aä]higkeit|entwickelt/,FR:/faiblesse|retraite|r[ée]sistance|talent/,IT:/debolezza|ritirata|resistenza|abilit/,ES:/debilidad|retirada|resistencia|habilidad/,PT:/fraqueza|recuo|habilidade/,EN:/weakness|retreat|resistance|ability|evolves/};
 for(const[l,r]of Object.entries(k))if(r.test(T))return l;return''}
function applyScan(r,lang){window.scanLang=lang||'';window.pendingScan={name:r.name,jp:r.jp,number:r.full||r.number,set:r.set,lang};$('#scanStatus').textContent=`Scan erkannt: ${r.name||'?'} ${r.number?'· Nr. '+r.number:''}${lang?' · Sprache '+lang:''}`;
 $('#qName').value=r.name||'';$('#qNum').value=r.number||'';go('v-search');search(r.name,r.number,'')}
const JPN={'ミュウツー':'Mewtwo','ミュウ':'Mew','リザードン':'Charizard','リザード':'Charmeleon','ヒトカゲ':'Charmander','ピカチュウ':'Pikachu','ライチュウ':'Raichu','ピチュー':'Pichu','ゲンガー':'Gengar','ゴースト':'Haunter','ゴース':'Gastly','ブラッキー':'Umbreon','イーブイ':'Eevee','エーフィ':'Espeon','シャワーズ':'Vaporeon','サンダース':'Jolteon','ブースター':'Flareon','リーフィア':'Leafeon','グレイシア':'Glaceon','ニンフィア':'Sylveon','フシギバナ':'Venusaur','フシギダネ':'Bulbasaur','カメックス':'Blastoise','ゼニガメ':'Squirtle','カイリュー':'Dragonite','カビゴン':'Snorlax','ルギア':'Lugia','ホウオウ':'Ho-Oh','レックウザ':'Rayquaza','ルカリオ':'Lucario','ギャラドス':'Gyarados','フーディン':'Alakazam','ピッピ':'Clefairy','プリン':'Jigglypuff','ラプラス':'Lapras','メタモン':'Ditto','サンダー':'Zapdos','ファイヤー':'Moltres','フリーザー':'Articuno','スイクン':'Suicune','セレビィ':'Celebi','ジラーチ':'Jirachi','ダークライ':'Darkrai','アルセウス':'Arceus','ゲッコウガ':'Greninja','ミミッキュ':'Mimikyu','サーナイト':'Gardevoir','ガブリアス':'Garchomp','バンギラス':'Tyranitar','ウインディ':'Arcanine','コダック':'Psyduck','ニャース':'Meowth','ポッチャマ':'Piplup','ヒノアラシ':'Cyndaquil','ワニノコ':'Totodile','チコリータ':'Chikorita','ミロカロス':'Milotic','パルキア':'Palkia','ディアルガ':'Dialga','ギラティナ':'Giratina','ザシアン':'Zacian','テラパゴス':'Terapagos','マリル':'Marill','ヤドン':'Slowpoke','ガルーラ':'Kangaskhan','カイロス':'Pinsir','ストライク':'Scyther','エンテイ':'Entei','ライコウ':'Raikou','グラードン':'Groudon','カイオーガ':'Kyogre'};
const dv=t=>t.normalize('NFD').replace(/[\u3099\u309a]/g,'').normalize('NFC');const JPD={};for(const k in JPN)JPD[dv(k)]=k;const JPK=Object.keys(JPD).sort((a,b)=>b.length-a.length);
function jpName(t){const n=dv(t||'').replace(/[\s・]/g,'').replace(/[ｰ―‐-]/g,'ー');for(const k of JPK){let i=-1;while((i=n.indexOf(k,i+1))>=0){if(n.substr(i+k.length,2)!=='から')return{jp:JPD[k],en:JPN[JPD[k]]}}}
 // Toleranz: 1 Zeichen falsch bei Namen ab 4 Zeichen
 for(const k of JPK){if(k.length<5)continue;for(let i=0;i+k.length<=n.length;i++){let d=0;for(let j=0;j<k.length&&d<2;j++)if(n[i+j]!==k[j])d++;if(d<2&&n.substr(i+k.length,2)!=='から'&&n.substr(i+k.length-1,2)!=='から')return{jp:JPD[k],en:JPN[JPD[k]]}}}return null}
const ocrW={};function getW(l){if(!ocrW[l])ocrW[l]=(async()=>{const w=await Tesseract.createWorker(l==='num'||l==='dig'?'eng':l);
 if(l==='num')await w.setParameters({tessedit_pageseg_mode:'6'});if(l==='dig')await w.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'0123456789/'});return w})();return ocrW[l]}
// Nummer aus hochaufgelöstem Bild: unterer ~12%-Streifen, 3-4x hochskaliert, binarisiert, nur Ziffern (psm 7), mehrere Schwellen
function binC(src,x,y,w,h,scale,th){const W=src.width,H=src.height;const c=document.createElement('canvas');c.width=Math.round(W*w*scale);c.height=Math.round(H*h*scale);
 const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingQuality='high';g.drawImage(src,W*x,H*y,W*w,H*h,0,0,c.width,c.height);
 const im=g.getImageData(0,0,c.width,c.height),d=im.data;for(let i=0;i<d.length;i+=4){const v=Math.max(d[i],d[i+1],d[i+2])<th?0:255;d[i]=d[i+1]=d[i+2]=v}g.putImageData(im,0,0);return c}
async function readNumberHi(src){const w=await getW('dig');const re=/(\d{1,3})\/(\d{2,3})/;window.hiDbg=[];
 const sc=Math.max(3,Math.min(4,1600/(src.width*.45)));
 for(const [x,y,ww,h] of [[0,.88,.45,.12],[.05,.91,.4,.08]])for(const th of [80,115,150]){
  const t=((await w.recognize(binC(src,x,y,ww,h,sc,th))).data.text||'').replace(/\s/g,'');window.hiDbg.push(th+':'+t);const m=t.match(re);
  if(m&&m[1].length===m[2].length&&+m[1]>0)return m[1].replace(/^0+(?=\d)/,'')+'/'+m[2]}
 return ''}
// Set-Code (z.B. s8a, sv2a) aus OCR-Text
function setCode(t){const m=(t||'').match(/\b(s[v]?\d{1,2}[a-z]?|SV\d{1,2}[a-z]?|M\d[a-z]?)\b/);return m?m[1].toLowerCase():''}
function getWorker(){return getW('deu+eng')}
function cropC(src,x,y,w,h,scale,mode){const W=src.width||src.videoWidth,H=src.height||src.videoHeight;const c=document.createElement('canvas');
 c.width=Math.round(W*w*scale);c.height=Math.round(H*h*scale);const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingQuality='high';
 if(!mode)g.filter='grayscale(1) contrast(1.3)';g.drawImage(src,W*x,H*y,W*w,H*h,0,0,c.width,c.height);
 if(mode){// dunkle Schrift isolieren (Holo-Glitzer & farbiger Hintergrund werden weiß)
  const im=g.getImageData(0,0,c.width,c.height),d=im.data;let hist=new Uint32Array(256);
  for(let i=0;i<d.length;i+=4){const m=Math.max(d[i],d[i+1],d[i+2]);d[i+3]=m;hist[m]++}
  let acc=0,tot=d.length/4,th=60;for(let v=0;v<256;v++){acc+=hist[v];if(acc>tot*(mode==='dark2'?.12:.07)){th=Math.min(120,Math.max(45,v+15));break}}
  for(let i=0;i<d.length;i+=4){const v=d[i+3]<th?0:255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}g.putImageData(im,0,0)}
 return c}
// Kartenumriss finden (helle/farbige Karte vor dunklem Hintergrund)
function cardCrop(src){const W=src.width,H=src.height,k=200/Math.max(W,H),w=Math.round(W*k),h=Math.round(H*k);const t=document.createElement('canvas');t.width=w;t.height=h;
 const g=t.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0,w,h);const d=g.getImageData(0,0,w,h).data;const R=new Float32Array(h),C=new Float32Array(w);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);if(mx>140&&mx-mn>50){R[y]++;C[x]++}}
 const span=(A,n,f)=>{let a=0,b=n-1;while(a<n&&A[a]<f)a++;while(b>a&&A[b]<f)b--;return[a,b]};const [y0,y1]=span(R,h,w*.35),[x0,x1]=span(C,w,h*.35);
 const cw=(x1-x0+1)/k,ch=(y1-y0+1)/k,ar=cw/ch;if(x1<=x0||y1<=y0||ar<.55||ar>.9||cw*ch<W*H*.15||cw*ch>W*H*.95)return src;
 const o=document.createElement('canvas');o.width=Math.round(cw);o.height=Math.round(ch);o.getContext('2d').drawImage(src,x0/k,y0/k,cw,ch,0,0,o.width,o.height);window.cropDbg=[x0/k,y0/k,cw,ch].map(Math.round);return o}
async function toCanvas(file,max=1600){window.warmOCR&&warmOCR();let bm;try{bm=await createImageBitmap(file)}catch(e){bm=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Bild nicht lesbar'));i.src=URL.createObjectURL(file)})}
 const W=bm.width,H=bm.height,k=Math.min(1,max/Math.max(W,H));const c=document.createElement('canvas');c.width=Math.round(W*k);c.height=Math.round(H*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return c}
async function readNumber(src){const w=await getW('num');const re=/(\d{1,3})\s*\/\s*(\d{2,3})/g;window.numDbg=[];let weak='';
 for(const [x,y,ww,h,k,m] of [[.12,.93,.3,.07,8,'dark'],[.08,.92,.36,.08,6,'dark2'],[0,.935,.42,.06,6,'dark'],[0,.935,.42,.06,6,'dark2'],[0,.91,.45,.08,5,'dark'],[0,.86,.5,.14,4,'dark'],[.5,.9,.5,.1,4,'dark'],[0,.75,1,.25,3,'dark']]){
  const {data}=await w.recognize(cropC(src,x,y,ww,h,k,m));window.numDbg.push(data.text);
  for(const mm of (data.text||'').matchAll(re)){const v=mm[1]+'/'+mm[2];if(mm[1].length===mm[2].length)return mm[1].replace(/^0+(?=\d)/,'')+'/'+mm[2];weak||=v}}
 return weak?{weak}:''}
// Gesamtanalyse: Text (DE/EN), bei Kana/schwacher Erkennung Japanisch, Nummer aus unterem Streifen
async function analyze(src,st=()=>{}){const t0=performance.now();src=cardCrop(src);st('Name & Nummer werden gelesen…');
 // parallel: Name-Streifen oben (JP + DE/EN) und Nummer-Streifen unten – keine Ganzkarten-OCR, solange das reicht
 const top=cropC(src,.15,.04,.65,.12,3,'dark'),topG=cropC(src,0,.02,1,.12,2);
 const pJ=getW('jpn').then(w=>w.recognize(top)).then(r=>r.data.text||'');
 const pE=getW('deu+eng').then(w=>w.recognize(topG)).then(r=>r.data);
 const pN=readNumber(src);
 const [tTop,rE,num0]=await Promise.all([pJ,pE,pN]);window.topDbg=tTop;
 let number=num0,numWeak=false;if(number&&number.weak){number=number.weak;numWeak=true}
 let jp=jpName(tTop),text=tTop+'\n'+(rE.text||''),kana=/[\u3040-\u30ff]{2,}/.test(tTop.replace(/\s/g,'')),lang=jp?'JP':'';
 let r1=rE,conf=rE.confidence;
 if(!jp){// Fallback: ganze Karte (Sprache über Wörter wie Schwäche/Weakness)
  st('Ganze Karte wird gelesen…');const [a,b]=await Promise.all([getW('deu+eng').then(w=>w.recognize(cropC(src,0,0,1,1,1))),getW('jpn').then(w=>w.recognize(cropC(src,0,0,1,1,1)))]);
  r1=a.data;conf=r1.confidence;text+='\n'+r1.text+(b?'\n'+b.data.text:'');jp=jpName(text);lang=detectLang(r1.text||'');if(jp||(b&&/[\u3040-\u30ff]{2,}/.test(b.data.text.replace(/\s/g,'')))){kana=true;lang='JP'}}
 const p=parseOCR(r1.text||'');if(!number){const m=text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);if(m)number=m[1].replace(/^0+(?=\d)/,'')+'/'+m[2]}
 if((!number||numWeak)&&src.width>=500){st('Kartennummer wird genau gelesen…');const n2=await readNumberHi(src);if(n2){number=n2;numWeak=false}}
 let name=jp?jp.en:'',confident=!!jp&&!numWeak;
 if(!jp&&!kana&&p.name&&conf>=65&&p.name.length>=4){name=p.name;confident=!!number}
 if(!name&&p.name&&!kana)name=p.name;window.scanMs=Math.round(performance.now()-t0);
 return{name,jp:jp&&jp.jp,number:(number||'').split('/')[0],full:number,lang,confident,set:setCode(text+'\n'+(window.numDbg||[]).join('\n')),raw:text,conf:Math.round(conf),ms:window.scanMs}}
// Worker vorwärmen, sobald der Scan-Tab geöffnet wird
function warmOCR(){if(!window.Tesseract||window._warm)return;window._warm=1;['deu+eng','jpn','num','dig'].forEach(l=>getW(l).catch(()=>{delete ocrW[l];window._warm=0}))}
function scanPick(r){const P=$('#scanPick');P.hidden=false;const noNum=r.name&&!r.number;
 P.innerHTML=`<b>${r.confident&&r.number?'✅ Erkannt: '+esc(r.name)+(r.jp?' ('+esc(r.jp)+')':'')+' · '+esc(r.full||r.number):noNum?'✅ Erkannt: '+esc(r.name)+(r.jp?' ('+esc(r.jp)+')':'')+' – Nummer fehlt':'⚠️ Nicht sicher erkannt'}</b><p class="muted small">${noNum?'Die Nummer konnte nicht gelesen werden. Bitte eintippen oder ohne Nummer suchen.':'Bitte prüfen oder ergänzen – es wird nichts automatisch übernommen.'}</p>
 <label>Name<input id="spName" value="${esc(r.name||'')}" placeholder="z.B. Glurak / Charizard"></label><label>Nummer<input id="spNum" value="${esc(r.full||r.number||'')}" placeholder="Nummer unten links, z.B. 137/103" inputmode="numeric"></label>
 <label>Set-Code (optional)<input id="spSet" value="${esc(r.set||'')}" placeholder="z.B. s8a"></label>
 <label>Sprache<select id="spLang">${LANGS.map(l=>`<option${l===(r.lang||'DE')?' selected':''}>${l}</option>`).join('')}</select></label>
 <div class="row wrap"><button type="button" class="primary" id="spGo">Suchen</button><button type="button" id="spNoNum">Ohne Nummer suchen</button><button type="button" id="spMan"${r.lang==='JP'?' class="primary"':''}>Manuell hinzufügen</button><button type="button" id="spX">Verwerfen</button></div>
 ${r.lang==='JP'?'<p class="muted small">Japanische Sets sind nicht in der Preisdatenbank – „Manuell hinzufügen“ legt die Karte mit Name, Nummer, Set &amp; Sprache an, den Preis trägst du selbst ein.</p>':''}`;
 const v=()=>({name:$('#spName').value,number:$('#spNum').value,set:$('#spSet').value,lang:$('#spLang').value});
 $('#spGo').onclick=()=>{const x=v();P.hidden=true;applyScan({name:x.name,jp:r.jp,number:x.number.split('/')[0],full:x.number,set:x.set},x.lang)};
 $('#spNoNum').onclick=()=>{const x=v();P.hidden=true;applyScan({name:x.name,jp:r.jp,number:'',set:x.set},x.lang);window.pendingScan.number=x.number};
 $('#spMan').onclick=()=>{const x=v();manualAdd({...x,name:r.jp&&x.name===r.name?`${x.name} (${r.jp})`:x.name})};
 $('#spX').onclick=()=>P.hidden=true;
 if(noNum)setTimeout(()=>{const n=$('#spNum');n.focus();n.scrollIntoView({block:'center'})},50)}
function scanResult(r){window.lastScan=r;const st=$('#scanStatus2');
 st.textContent=`Erkannt: ${r.name||'?'}${r.jp?' ('+r.jp+')':''} · Nr. ${r.full||r.number||'?'}${r.lang?' · '+r.lang:''}`;
 if(r.confident&&r.number&&r.lang!=='JP'){$('#scanPick').hidden=true;applyScan(r,r.lang)}else scanPick(r)}
async function handleFile(f){const st=$('#scanStatus2');$('#scanPick').hidden=true;
 if(!f){st.textContent='Kein Bild ausgewählt.';return}
 if(!window.Tesseract){st.textContent='❌ Texterkennung nicht geladen – Internet prüfen und neu laden.';return}
 $('#scanbox').classList.add('busy');
 try{const c=await toCanvas(f);const r=await analyze(c,m=>st.textContent='⏳ '+m);scanResult(r)}
 catch(err){st.textContent='❌ Fehler bei der Erkennung: '+(err&&err.message||err)}finally{$('#scanbox').classList.remove('busy')}}
$('#scanBtn').addEventListener('click',()=>{stopLive();$('#scanStatus2').textContent='Kamera wird geöffnet…'});
$('#livePhoto').addEventListener('click',()=>stopLive());$('#uploadBtn').addEventListener('click',()=>{stopLive();$('#scanStatus2').textContent='Bildauswahl wird geöffnet…'});
['#scanFile','#uploadFile'].forEach(id=>$(id).addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];handleFile(f).finally(()=>{e.target.value=''})}));
// Live-Scan
let live={stream:null,timer:null,busy:false,last:null,torch:false,nameOnly:0,nameKey:''};
async function startLive(){const st=$('#scanStatus2');$('#scanPick').hidden=true;if(!navigator.mediaDevices?.getUserMedia){st.textContent='Kamera wird von diesem Browser nicht unterstützt (HTTPS nötig).';return}
 if(!window.Tesseract){st.textContent='OCR-Bibliothek nicht geladen (Internet?).';return}
 try{live.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:2560},height:{ideal:1440}},audio:false})}catch(e){st.textContent='Kein Kamerazugriff: '+e.message;return}
 const v=$('#liveVideo');v.srcObject=live.stream;await v.play().catch(()=>{});$('#scanbox').classList.add('live');$('#liveText').textContent='';st.textContent='Kamera startet, Texterkennung wird geladen…';
 const tr=live.stream.getVideoTracks()[0];const caps=tr.getCapabilities?.()||{};$('#torchBtn').hidden=!caps.torch;
 if((caps.focusMode||[]).includes('continuous'))tr.applyConstraints({advanced:[{focusMode:'continuous'}]}).catch(()=>{});
 try{live.ic=window.ImageCapture?new ImageCapture(tr):null}catch(e){live.ic=null}
 $('.frame span').textContent='Näher ran – Karte füllt den Rahmen · Tippen = scharfstellen';
 live.last=null;live.nameOnly=0;live.nameKey='';getWorker().catch(()=>{});getW('num').catch(()=>{});live.timer=setInterval(liveTick,1500)}
function stopLive(){clearInterval(live.timer);live.timer=null;if(live.stream){live.stream.getTracks().forEach(t=>t.stop());live.stream=null}
 const v=$('#liveVideo');if(v)v.srcObject=null;$('#scanbox')?.classList.remove('live');live.torch=false;live.ic=null;const fs=$('.frame span');if(fs)fs.textContent='Karte im Rahmen platzieren'}
async function liveTick(){if(live.busy||!live.stream)return;const v=$('#liveVideo');if(!v.videoWidth)return;live.busy=true;
 try{const fr=$('.frame').getBoundingClientRect(),vr=v.getBoundingClientRect();
  const sc=Math.max(vr.width/v.videoWidth,vr.height/v.videoHeight),ox=(v.videoWidth*sc-vr.width)/2,oy=(v.videoHeight*sc-vr.height)/2;
  let sx=(fr.left-vr.left+ox)/sc,sy=(fr.top-vr.top+oy)/sc,sw=fr.width/sc,sh=fr.height/sc;
  sx=Math.max(0,sx);sy=Math.max(0,sy);sw=Math.min(sw,v.videoWidth-sx);sh=Math.min(sh,v.videoHeight-sy);
  const c=$('#liveCanvas');c.width=Math.round(sw);c.height=Math.round(sh);c.getContext('2d').drawImage(v,sx,sy,sw,sh,0,0,c.width,c.height);
  const r=await analyze(c,m=>$('#scanStatus2').textContent=m);if(!live.stream)return;
  $('#liveText').textContent=`→ ${r.name||'?'}${r.jp?' ('+r.jp+')':''} · ${r.full||'?'}${r.lang?' · '+r.lang:''}${r.confident&&r.number?'':' · nicht sicher'}`;
  if(r.name&&!r.number&&(r.jp||r.conf>=65)){// Name sicher, Nummer fehlt → scharfes Foto in voller Auflösung
   const k=r.name;live.nameOnly=live.nameKey===k?live.nameOnly+1:1;live.nameKey=k;$('#scanStatus2').textContent=`Name erkannt (${live.nameOnly}/3) – scharfes Foto für die Nummer…`;
   const hi=await grabStill(v);if(!live.stream)return;if(hi){const n=await readNumberHi(cardCrop(hi));if(!live.stream)return;if(n){r.full=n;r.number=n.split('/')[0];r.confident=true;navigator.vibrate?.(200);stopLive();scanResult(r);return}}
   if(live.nameOnly>=3){navigator.vibrate?.([80,60,80]);stopLive();$('#scanStatus2').textContent=`Erkannt: ${r.name}${r.jp?' ('+r.jp+')':''}${r.lang?' · '+r.lang:''} – Nummer bitte eintippen`;window.lastScan=r;scanPick(r);return}
   $('#scanStatus2').textContent='Nummer noch nicht lesbar – näher ran, Karte füllt den Rahmen';return}
  live.nameOnly=0;
  if(r.confident&&r.number){const key=(r.name+'|'+r.number).toLowerCase();
   if(live.last===key){navigator.vibrate?.(200);stopLive();scanResult(r);return}
   live.last=key;$('#scanStatus2').textContent='Fast erkannt – Karte ruhig halten…'}else{live.last=null;$('#scanStatus2').textContent='Noch nicht sicher – Karte näher, gerade und gut beleuchtet halten'}}
 catch(e){$('#scanStatus2').textContent='Fehler: '+e.message}finally{live.busy=false}}
async function grabStill(v){try{if(live.ic){const b=await live.ic.takePhoto();return await toCanvas(b,3000)}}catch(e){}
 if(!v.videoWidth)return null;const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);return c}
$('#liveVideo').addEventListener('click',async e=>{const tr=live.stream?.getVideoTracks()[0];if(!tr)return;const caps=tr.getCapabilities?.()||{};const r=e.currentTarget.getBoundingClientRect();
 const adv={};if(caps.pointsOfInterest)adv.pointsOfInterest=[{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}];
 const fm=caps.focusMode||[];if(fm.includes('single-shot'))adv.focusMode='single-shot';else if(fm.includes('continuous'))adv.focusMode='continuous';
 $('#scanStatus2').textContent='Scharfstellen…';try{await tr.applyConstraints({advanced:[adv]});if(adv.focusMode==='single-shot'&&fm.includes('continuous'))setTimeout(()=>tr.applyConstraints({advanced:[{focusMode:'continuous'}]}).catch(()=>{}),1500)}catch(x){}});
$('.frame')?.addEventListener('click',e=>{$('#liveVideo').dispatchEvent(new MouseEvent('click',{clientX:e.clientX,clientY:e.clientY}))});
$('#liveBtn').onclick=startLive;$('#liveCancel').onclick=()=>{stopLive();$('#scanStatus2').textContent='Live-Scan abgebrochen.'};
$('#torchBtn').onclick=async()=>{const tr=live.stream?.getVideoTracks()[0];if(!tr)return;live.torch=!live.torch;try{await tr.applyConstraints({advanced:[{torch:live.torch}]})}catch(e){}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLive()});
window.detectLang=detectLang;
function parseOCR(t){const m=t.match(/(\d{1,3})\s*\/\s*(\d{2,3})/)||t.match(/\b([A-Z]{2,5}(?:-[A-Z]{1,2})?\d{0,2})\s*[-–]?\s*(\d{2,3})\b/);const lines=t.split('\n').map(l=>l.trim()).filter(Boolean);
 let name='';for(const l of lines.slice(0,6)){const w=l.replace(/[^A-Za-zÄÖÜäöüßé\- ]/g,' ').split(/\s+/).filter(x=>x.length>=3&&!/^(BASIS|BASIC|STAGE|PHASE|KP|HP|PV|PS|Entwickelt)$/i.test(x));
  if(w.length){name=w.slice(0,2).join(' ');if(/\bex\b/i.test(l))name=w[0]+' ex';break}}
 const number=m?(/^\d/.test(m[1])?m[1].replace(/^0+(?=\d)/,''):m[2].replace(/^0+(?=\d)/,'')):'';
 return{name,number}}
window.parseOCR=parseOCR;

// Export / Import
$('#exportBtn').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='kartenapp-'+today()+'.json';a.click()};
$('#importFile').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!d.collection)throw 0;S=d;S.snapshots??=[];S.wishlist??=[];S.settings??={cur:'EUR',tf:30};S.trade??={give:[],get:[]};save();render();alert('Import erfolgreich')}catch(x){alert('Ungültige Datei')}};
$('#resetBtn').onclick=()=>{if(confirm('Wirklich alle Daten löschen?')){localStorage.removeItem(K);S=load();S.settings={cur:'EUR',tf:30};S.trade={give:[],get:[]};save();render()}};

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
S.collection.forEach(trackPrice);snapshot();render();refreshPrices();loadSets();
