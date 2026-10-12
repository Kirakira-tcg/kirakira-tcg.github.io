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
function go(v){$$('nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));$$('.view').forEach(s=>s.classList.toggle('active',s.id===v));render();window.scrollTo(0,0)}
$$('nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
$('#cur').value=S.settings.cur;$('#cur').onchange=e=>{S.settings.cur=e.target.value;save();render()};
$$('#tf button').forEach(b=>{b.classList.toggle('on',+b.dataset.d===S.settings.tf);b.onclick=()=>{S.settings.tf=+b.dataset.d;$$('#tf button').forEach(x=>x.classList.toggle('on',x===b));save();render()}});
let filt='all';$$('#filt button').forEach(b=>b.onclick=()=>{filt=b.dataset.f;$$('#filt button').forEach(x=>x.classList.toggle('on',x===b));render()});
$('#sort').onchange=render;

// Suche
$('#searchForm').onsubmit=e=>{e.preventDefault();search($('#qName').value,$('#qNum').value,$('#qSet').value)};
let lastResults=[];
async function search(name,num,set,setId){const q=[];name=deName(clean(name||''));num=clean(num||'').split('/')[0].replace(/^0+(?=\d)/,'');set=clean(set||'');
 if(name)q.push(name.includes(' ')?`name:"${name}"`:`name:${name}*`);if(num)q.push(`number:${num}`);if(set)q.push(`set.name:"${set}*"`);if(setId)q.push(`set.id:${setId}`);
 if(!q.length)return;const R=$('#results');R.innerHTML='<p class="muted">Suche…</p>';
 try{const d=await api(`${API}/cards?q=${encodeURIComponent(q.join(' '))}&pageSize=60&select=id,name,number,set,images,cardmarket,rarity`);
  if(!d.data.length){R.innerHTML='<p class="muted">Nichts gefunden. Japanische/deutsche Sonderkarten bitte manuell eintragen.</p>';return}
  d.data.sort((a,b)=>setId?(parseInt(a.number)||0)-(parseInt(b.number)||0):(b.set.releaseDate||'').localeCompare(a.set.releaseDate||''));lastResults=d.data;
  R.innerHTML='';for(const c of d.data){const p=cmPrice(c);const ci=cmInfo(c);const ch=ci&&ci.avg7&&p?(p-ci.avg7)/ci.avg7*100:null;
   const el=tile({img:c.images.small,name:c.name,sub:`${c.set.name} · ${c.number}/${c.set.printedTotal}`,price:p,chg:ch,badge:c.rarity&&/Special|Hyper|Secret|Illustration/i.test(c.rarity)?'SAR/SIR':''});
   el.onclick=()=>detail({api:c});
   const a=document.createElement('div');a.className='acts';a.innerHTML='<button>+ Sammlung</button><button>☆</button>';
   a.children[0].onclick=e=>{e.stopPropagation();addDialog(c,'coll')};a.children[1].onclick=e=>{e.stopPropagation();addDialog(c,'wish')};el.append(a);R.append(el)}
 }catch(e){R.innerHTML=`<p class="neg">${e.message}. Bitte später erneut versuchen.</p>`}}

// Sets
let SETS=[];async function loadSets(){try{const d=await api(`${API}/sets?orderBy=-releaseDate&pageSize=250&select=id,name,series,releaseDate,images,total`);SETS=d.data;renderSets()}catch(e){$('#setList').innerHTML='<p class="muted small">Sets nicht ladbar.</p>'}}
function renderSets(){const f=$('#setFilter').value.toLowerCase();$('#setList').innerHTML='';
 for(const s of SETS.filter(s=>!f||(s.name+s.series).toLowerCase().includes(f)).slice(0,60)){const d=document.createElement('div');d.className='set';
  d.innerHTML=`<img loading="lazy" src="${s.images.logo}" alt=""><b>${esc(s.name)}</b><br><span class="muted">${esc(s.series)} · ${s.total} Karten · ${(s.releaseDate||'').slice(0,4)}</span>`;
  d.onclick=()=>{$('#qName').value='';$('#qNum').value='';search('','','',s.id);window.scrollTo(0,0)};$('#setList').append(d)}}
$('#setFilter').oninput=renderSets;

function addDialog(c,mode,sealed){const manual=!c;const f=$('#dlgForm');const p=c?cmPrice(c):null;
 f.innerHTML=`<h3>${mode==='wish'?'Zur Wunschliste':sealed?'Sealed-Produkt hinzufügen':'Zur Sammlung'}</h3>
 ${manual?`<label>Name<input name="name" required placeholder="${sealed?'z.B. 30 Jahre Booster Bundle':''}"></label><label>Set<input name="set"></label>${sealed?'':'<label>Nummer<input name="number"></label>'}<label>Bild-URL (optional)<input name="img"></label>`:`<p><b>${esc(c.name)}</b> – ${esc(c.set.name)} ${c.number}<br>Cardmarket-Trend: ${money(p)}</p>`}
 <label>Sprache<select name="lang"><option>DE</option><option>EN</option><option>JP</option></select></label>
 ${mode==='wish'?`<label>Zielpreis (€)<input name="target" type="number" step="0.01" required></label>`:
 `${sealed?'<input type="hidden" name="cond" value="Sealed">':`<label>Zustand<select name="cond"><option>NM</option><option>EX</option><option>GD</option><option>LP</option><option>PL</option><option>PSA 10</option><option>PSA 9</option><option>CGC 10</option><option>BGS 9.5</option><option>PSA/Graded</option></select></label>`}
 <label>Anzahl<input name="qty" type="number" value="1" min="1"></label><label>Kaufpreis pro Stück (€)<input name="buy" type="number" step="0.01" value="0"></label>`}
 <label>${manual?'Aktueller Wert (€)':'Eigener Preis (€, leer = Cardmarket)'}<input name="price" type="number" step="0.01" ${manual?'required':''}></label>
 <div class="row"><button value="ok">Speichern</button><button value="cancel" formnovalidate>Abbrechen</button></div>`;
 const dlg=$('#dlg');dlg.returnValue='';dlg.showModal();dlg.onclose=()=>{if(dlg.returnValue!=='ok')return;const v=Object.fromEntries(new FormData(f));
  const base=manual?{manual:true,name:v.name,set:v.set,number:v.number||'',img:v.img}:{apiId:c.id,name:c.name,set:c.set.name,number:c.number,img:c.images.small,apiPrice:p,cm:cmInfo(c)};
  if(sealed)base.type='sealed';const own=v.price?parseFloat(v.price):null;
  if(mode==='wish')S.wishlist.push({uid:uid(),...base,lang:v.lang,target:parseFloat(v.target),price:own??p,ownPrice:own});
  else{const it={uid:uid(),...base,lang:v.lang,cond:v.cond,qty:parseInt(v.qty)||1,buy:parseFloat(v.buy)||0,price:own??p,ownPrice:own,added:today()};trackPrice(it);S.collection.push(it)}
  save();snapshot();render()}}
$('#manualBtn').onclick=()=>addDialog(null,'coll');$('#sealedBtn').onclick=()=>addDialog(null,'coll',true);

// Detail / Preisguide
const GRADE={'PSA 10':[3.5,'grobe Schätzung'],'PSA 9':[1.6,''],'CGC 10':[2.5,''],'BGS 9.5':[2,'']};
function detail({api:c,item,list}){const f=$('#dlgForm');const it=item||{};const ci=c?cmInfo(c):it.cm;const price=item?item.price:cmPrice(c);
 const img=c?c.images.large||c.images.small:(it.img||'').replace('/small','/large');const name=c?c.name:it.name;
 const rows=ci?[['Trend',ci.trend],['Ø 1 Tag',ci.avg1],['Ø 7 Tage',ci.avg7],['Ø 30 Tage',ci.avg30],['Ab-Preis',ci.low],['Ø Verkauf',ci.sell]].filter(r=>r[1]!=null):[];
 const raw=price||0;
 f.innerHTML=`<div class="detail">${img?`<img src="${esc(img)}" alt="">`:''}<h3>${esc(name)}</h3><p class="muted small">${esc(c?c.set.name:it.set)} ${esc(c?c.number:it.number)}${item?` · ${esc(it.lang)} · ${esc(it.cond)} · ${it.qty}×`:''}</p>
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
  try{const d=await api(`${API}/cards?q=${encodeURIComponent(chunk.map(id=>'id:'+id).join(' OR '))}&select=id,cardmarket`);
   for(const c of d.data){const p=cmPrice(c);items.filter(x=>x.apiId===c.id).forEach(x=>{x.cm=cmInfo(c);if(p!=null&&x.ownPrice==null)x.price=p})}}catch(e){console.warn(e)}}
 S.collection.forEach(trackPrice);btn.textContent='⟳';save();snapshot();render()}
$('#refresh').onclick=refreshPrices;

function totals(){let v=0,b=0,n=0;for(const c of S.collection){v+=(c.price||0)*c.qty;b+=(c.buy||0)*c.qty;n+=c.qty}return{v,b,n,g:v-b}}
function snapshot(){const d=today();const t=totals();S.snapshots=S.snapshots.filter(s=>s.d!==d);S.snapshots.push({d,v:+t.v.toFixed(2)});S.snapshots.sort((a,b)=>a.d.localeCompare(b.d));save()}

function tile({img,name,sub,price,chg,badge,qty,hit}){const el=document.createElement('div');el.className='tile'+(hit?' hit':'');
 el.innerHTML=`<div class="im" style="${img?`background-image:url('${esc(img)}')`:''}">${img?'':'🃏'}</div>${badge?`<span class="badge">${esc(badge)}</span>`:''}${qty>1?`<span class="qty">${qty}×</span>`:''}
 <div class="n">${esc(name)}</div><div class="s">${esc(sub)}</div><div class="p"><b>${money(price)}</b><span class="${cls(chg)}">${pct(chg)}</span></div>`;return el}

function render(){const t=totals();const tf=S.settings.tf;$('#tfLbl').textContent=({1:'1T',7:'7T',30:'30T',90:'3M',365:'1J',0:'Alle'})[tf];
 $('#sumVal').textContent=money(t.v);$('#sumBuy').textContent=money(t.b);const g=$('#sumGain');g.textContent=(t.g>=0?'+':'')+money(t.g);g.className=cls(t.g);$('#sumCnt').textContent=t.n;
 const pts=series(tf);const ch=pts.length>=2?pts.at(-1).v-pts[0].v:0;const chp=pts.length>=2&&pts[0].v?ch/pts[0].v*100:0;
 const sc=$('#sumChg');sc.className='chg '+cls(ch);sc.textContent=`${ch>=0?'▲ +':'▼ '}${money(Math.abs(ch))} (${chp.toFixed(1).replace('.',',')} %)`;
 const C=S.collection.map(c=>({c,ch:itemChange(c,tf)}));
 const mk=(x,list)=>{const c=x.c;const el=tile({img:c.img,name:c.name,sub:`${c.set||''} ${c.number||''} · ${c.lang}`,price:c.price,chg:x.ch,badge:c.type==='sealed'?'SEALED':/PSA|CGC|BGS|Graded/.test(c.cond)?c.cond:c.lang==='JP'?'JP':'',qty:c.qty});el.onclick=()=>detail({item:c,list});return el};
 const top=$('#topList');top.innerHTML='';[...C].sort((a,b)=>(b.c.price||0)-(a.c.price||0)).slice(0,8).forEach(x=>top.append(mk(x,'collection')));
 const tr=$('#trendList');tr.innerHTML='';const T=C.filter(x=>x.ch!=null).sort((a,b)=>Math.abs(b.ch)-Math.abs(a.ch)).slice(0,8);
 if(!T.length)tr.innerHTML='<p class="muted small">Noch keine Preisbewegungen – ab dem nächsten Preis-Update sichtbar.</p>';T.forEach(x=>tr.append(mk(x,'collection')));
 const s=$('#sort').value;let L=C.filter(x=>filt==='all'||(filt==='sealed')===(x.c.type==='sealed'));
 L.sort(s==='chg'?(a,b)=>(b.ch??-1e9)-(a.ch??-1e9):s==='name'?(a,b)=>a.c.name.localeCompare(b.c.name):s==='new'?(a,b)=>S.collection.indexOf(b.c)-S.collection.indexOf(a.c):(a,b)=>(b.c.price||0)*b.c.qty-(a.c.price||0)*a.c.qty);
 const G=$('#collGrid');G.innerHTML='';if(!L.length)G.innerHTML='<p class="muted">Noch nichts hier – über Suche oder Scan hinzufügen.</p>';L.forEach(x=>G.append(mk(x,'collection')));
 const W=$('#wishGrid');W.innerHTML='';for(const w of S.wishlist){const hit=w.price!=null&&w.price<=w.target;
  const el=tile({img:w.img,name:w.name,sub:`Ziel ${money(w.target)} · ${w.lang}`,price:w.price,chg:itemChange(w,tf),hit,badge:hit?'✓ ZIEL':''});
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
$('#scanBtn').onclick=()=>$('#scanFile').click();
$('#scanFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;const st=$('#scanStatus2');
 if(!window.Tesseract){st.textContent='OCR-Bibliothek nicht geladen (Internet?).';return}
 st.textContent='Texterkennung läuft… (beim ersten Mal ~10–20 s)';
 try{const {data}=await Tesseract.recognize(f,'deu+eng',{logger:m=>{if(m.status==='recognizing text')st.textContent='Erkenne Text… '+Math.round(m.progress*100)+'%'}});
  const r=parseOCR(data.text);st.textContent='';$('#scanStatus').textContent=`Scan erkannt: ${r.name||'?'} ${r.number?'· Nr. '+r.number:''}`;
  $('#qName').value=r.name||'';$('#qNum').value=r.number||'';go('v-search');search(r.name,r.number,'')}catch(err){st.textContent='Fehler bei der Erkennung: '+err.message}
 e.target.value=''};
function parseOCR(t){const m=t.match(/(\d{1,3})\s*\/\s*(\d{2,3})/);const lines=t.split('\n').map(l=>l.trim()).filter(Boolean);
 let name='';for(const l of lines.slice(0,6)){const w=l.replace(/[^A-Za-zÄÖÜäöüßé\- ]/g,' ').split(/\s+/).filter(x=>x.length>=3&&!/^(BASIS|BASIC|STAGE|PHASE|KP|HP|Entwickelt)$/i.test(x));
  if(w.length){name=w.slice(0,2).join(' ');if(/\bex\b/i.test(l))name=w[0]+' ex';break}}
 return{name,number:m?m[1].replace(/^0+(?=\d)/,''):''}}
window.parseOCR=parseOCR;

// Export / Import
$('#exportBtn').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='kartenapp-'+today()+'.json';a.click()};
$('#importFile').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!d.collection)throw 0;S=d;S.snapshots??=[];S.wishlist??=[];S.settings??={cur:'EUR',tf:30};S.trade??={give:[],get:[]};save();render();alert('Import erfolgreich')}catch(x){alert('Ungültige Datei')}};
$('#resetBtn').onclick=()=>{if(confirm('Wirklich alle Daten löschen?')){localStorage.removeItem(K);S=load();S.settings={cur:'EUR',tf:30};S.trade={give:[],get:[]};save();render()}};

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
S.collection.forEach(trackPrice);snapshot();render();refreshPrices();loadSets();
