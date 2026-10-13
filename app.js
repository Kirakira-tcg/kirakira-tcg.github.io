// Scan-Prefetch: kurzlebiger GET-Cache für TCGdex-Anfragen (nur Transport, Preislogik unverändert)
(()=>{const C=new Map(),f0=window.fetch.bind(window),TTL=6e5;window.fetch=(u,o)=>{const s=typeof u==='string'?u:(u&&u.url)||'';if(!/^https:\/\/api\.tcgdex\.net\/v2\//.test(s)||(o&&o.method&&o.method!=='GET')||(typeof u!=='string'&&u&&u.method&&u.method!=='GET'))return f0(u,o);
 const e=C.get(s);if(e&&Date.now()-e.t<TTL)return e.p.then(r=>r.clone());const p=f0(s,o&&o.headers?{headers:o.headers}:undefined).then(r=>{if(!r.ok)C.delete(s);return r},err=>{C.delete(s);throw err});C.set(s,{p,t:Date.now()});if(C.size>400)C.delete(C.keys().next().value);
 const sg=o&&o.signal;const out=p.then(r=>r.clone());return sg?Promise.race([out,new Promise((_,j)=>{if(sg.aborted)j(sg.reason);sg.addEventListener('abort',()=>j(sg.reason||new DOMException('Aborted','AbortError')))})]):out}})();
'use strict';
const API='https://api.pokemontcg.io/v2';
const K='kartenapp_v1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const USD=1.08; // grober Umrechnungskurs EUR->USD
let S=load(); S.snapshots??=[];S.wishlist??=[];S.settings??={cur:'EUR',tf:30};S.trade??={give:[],get:[]};
// v71: alte manuelle Überschreibungen -> nur noch „eigene Schätzung“ (Fallback), Marktwert kommt aus den Quellen
for(const x of [...(S.collection||[]),...(S.wishlist||[])])if(x.ownPrice!=null){x.ownPriceOld??=x.ownPrice;x.price=x.ownPrice;x.estimate=true;x.ownPrice=null}
const money=n=>{if(n==null||isNaN(n))return'–';const u=S.settings.cur==='USD';return (u?n*USD:n).toLocaleString('de-DE',{style:'currency',currency:u?'USD':'EUR'})};
const pct=n=>n==null||!isFinite(n)?'':(n>=0?'▲ +':'▼ ')+n.toFixed(1).replace('.',',')+' %';
const cls=n=>n==null?'muted':n>=0?'pos':'neg';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// v105: pokemontcg.io-IDs ohne ptcg-Daten (me*, z.B. me55-152) auf TCGdex-IDs umstellen (30th-152), sonst 404 bei TCGdex
function normIds(it){try{const P=window.Prices;if(!P||!P.tdxId)return;if(it.tdxId)it.tdxId=P.tdxId(it.tdxId);if(it.tdx&&/^cel25cc-CC02[01]$/.test(it.tdx.id||'')&&it.ownPrice==null&&/TCGdex/.test(it.tdx.src||'')){delete it.tdx;it.price=null;it.noPrice=true}if(P.clsFix&&it.tdxId&&/^30th-c-/.test(it.tdxId)){const f=P.clsFix(it.tdxId,it.name);if(f!==it.tdxId){it.tdxId=f;if(it.tdx&&it.ownPrice==null){delete it.tdx;it.price=null;it.noPrice=true}}}if(it.tdx&&it.tdx.id)it.tdx.id=P.tdxId(it.tdx.id);if(it.setId)it.setId=P.tdxSet(it.setId);if(it.apiId&&/^(cel25c|me55c)-/.test(it.apiId)&&it.tdx&&it.tdx.id&&it.tdx.id!==P.tdxId(it.apiId)){delete it.tdx;if(it.ownPrice==null){it.price=null;it.noPrice=true}}if(it.apiId&&/^me\d/.test(it.apiId)&&!/^me55c-/.test(it.apiId)){const t=P.tdxId(it.apiId);if(!it.tdxId)it.tdxId=t;delete it.apiId}}catch(e){}}
function load(){try{const d=JSON.parse(localStorage.getItem(K));if(d){const bad=/^https?:\/\/([^/]*\.)?(pokemon-card\.com|snkrdunk\.com|tcgplayer\.com|serebii\.net|pokeca\.net)\//i;for(const k of ['collection','wishlist'])for(const it of d[k]||[]){if(it&&bad.test(it.img||''))it.img='';if(it)normIds(it)}return d}}catch(e){}
 return {collection:[{uid:'ex1',manual:true,name:'Glurak (30th Celebration, JP)',set:'30th Celebration (JP)',number:'',lang:'JP',cond:'NM',qty:1,buy:0,price:140,note:'≈ 23.120 ¥',img:''}],
  wishlist:[{uid:'ex2',tdxId:'30th-152',name:'Mew ex',set:'30th Celebration',number:'152',lang:'DE',target:60,price:null,img:''}],snapshots:[]}}
function save(){localStorage.setItem(K,JSON.stringify(S))}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const today=()=>new Date().toISOString().slice(0,10);
async function api(url,tries=4,ms=7000){for(let i=0;i<tries;i++){try{const r=await fetch(url,{signal:AbortSignal.timeout(ms)});if(r.ok)return await r.json()}catch(e){}if(i<tries-1)await new Promise(r=>setTimeout(r,500*(i+1)))}throw new Error('API nicht erreichbar')}
// Trend unplausibel (< 25 % von Ø7 und Ø30) -> Ø7 (bzw. Ø30) verwenden
function trendFix(t,a7,a30){if(t&&a7&&a30&&t<.25*a7&&t<.25*a30)return{v:a7,fixed:'Ø 7 Tage'};if(t&&!a7&&a30&&t<.25*a30)return{v:a30,fixed:'Ø 30 Tage'};return{v:t,fixed:null}}
function cmFix(c){const p=c&&c.cardmarket&&c.cardmarket.prices;if(!p)return{v:null,fixed:null};const f=trendFix(p.trendPrice,p.avg7,p.avg30);return f.v?f:{v:p.avg30||p.averageSellPrice||p.lowPrice||null,fixed:null}}
function cmPrice(c){return cmFix(c).v}
function cmInfo(c){const p=c.cardmarket&&c.cardmarket.prices;if(!p)return null;return{trend:p.trendPrice,avg1:p.avg1,avg7:p.avg7,avg30:p.avg30,low:p.lowPrice,sell:p.averageSellPrice,url:c.cardmarket.url}}
const DE={glurak:'Charizard',nachtara:'Umbreon',mewtu:'Mewtwo',evoli:'Eevee',bisaflor:'Venusaur',turtok:'Blastoise',gengar:'Gengar',glaziola:'Glaceon',folipurba:'Leafeon',psiana:'Espeon',aquana:'Vaporeon',blitza:'Jolteon',flamara:'Flareon',feelinara:'Sylveon',dragoran:'Dragonite',relaxo:'Snorlax',lugia:'Lugia',piepi:'Clefairy',gewaldro:'Sceptile',lohgock:'Blaziken',sumpex:'Swampert',garados:'Gyarados',simsala:'Alakazam',bisasam:'Bulbasaur',glumanda:'Charmander',schiggy:'Squirtle',rayquaza:'Rayquaza',suicune:'Suicune',lucario:'Lucario',pummeluff:'Jigglypuff',enton:'Psyduck',knogga:'Marowak',arkani:'Arcanine',lapras:'Lapras',ditto:'Ditto',zapdos:'Zapdos',lavados:'Moltres',arktos:'Articuno','ho-oh':'Ho-Oh',hooh:'Ho-Oh',pikachu:'Pikachu',raichu:'Raichu',mew:'Mew',celebi:'Celebi',victini:'Victini',reshiram:'Reshiram',zekrom:'Zekrom',kyogre:'Kyogre',groudon:'Groudon',entei:'Entei',raikou:'Raikou',arceus:'Arceus',darkrai:'Darkrai',dialga:'Dialga',palkia:'Palkia',giratina:'Giratina',vulpix:'Vulpix',vulnona:'Ninetales',owei:'Exeggcute',kokowei:'Exeggutor',volbeat:'Volbeat',illumise:'Illumise',tropius:'Tropius',kikugi:'Cherubi',kinoso:'Cherrim',vivillon:'Vivillon',flegmon:'Slowpoke',krokel:'Fuecoco',glutexo:'Charmeleon',pikachu:'Pikachu',quajutsu:'Greninja',mimigma:'Mimikyu',guardevoir:'Gardevoir',knakrack:'Garchomp',despotar:'Tyranitar',karpador:'Magikarp',zacian:'Zacian',terapagos:'Terapagos',marill:'Marill',kangama:'Kangaskhan',pinsir:'Pinsir',sichlor:'Scyther',endivie:'Chikorita',feurigel:'Cyndaquil',karnimani:'Totodile',plinfa:'Piplup',psiana:'Espeon',mauzi:'Meowth',jirachi:'Jirachi',milotic:'Milotic'};
const ENERGY={pflanzen:'Grass',feuer:'Fire',wasser:'Water',elektro:'Lightning',psycho:'Psychic',kampf:'Fighting',finsternis:'Darkness',unlicht:'Darkness',metall:'Metal',grass:'Grass',fire:'Fire',water:'Water',lightning:'Lightning',psychic:'Psychic',fighting:'Fighting',darkness:'Darkness',metal:'Metal'};
const SETCODES={'30C':{id:'me55',name:'30th Celebration',tdx:'30th',total:128}};
function deName(n){const e=n.match(/basis[- ]?(\w+)[- ]?energie/i);if(e&&ENERGY[e[1].toLowerCase()])return'Basic '+ENERGY[e[1].toLowerCase()]+' Energy';const sm=n.match(SUF),b=sm?n.slice(0,sm.index):n,r=(window.PNAMES||[]).find(x=>x[1]&&x[1].toLowerCase()===b.toLowerCase());if(r)return r[0]+(sm?' '+sm[1]:'');return n.replace(/^(\S+)/,w=>DE[w.toLowerCase()]||w)}
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
// Neue manuelle Eingabe: alten Scan-Zustand (Hinweis, Nummer, Sprache) verwerfen
$('#qNum').addEventListener('input',e=>{if(e.isTrusted)$('#qNum').dataset.src='user'});
$('#qName').addEventListener('input',e=>{if(!e.isTrusted)return;const u=$('#qNum'),m=parseQ($('#qName').value);if(m){u.value=m.num;u.dataset.src='auto';window._qTotal=m.tot}else{window._qTotal='';if(u.dataset.src!=='user')u.value='';u.dataset.src=u.dataset.src==='user'?'user-old':''}});
$('#qName').addEventListener('input',e=>{if(!e.isTrusted||!window.pendingScan)return;window.pendingScan=null;window.scanLang='';const st=$('#scanStatus');if(st)st.textContent='';$('#qNum').value=''});
['#qName','#qNum'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();$('#searchForm').requestSubmit?$('#searchForm').requestSubmit():$('#searchForm').onsubmit(new Event('submit'))}}));
// Name + Nummer aus einem Feld: „Glurak 4/102“, „Pikachu 44“, „リザードン 137“
function parseQ(t){const m=String(t||'').trim().match(/^(.*\S)\s+#?((?:[A-Za-z]{1,4}-?)?\d{1,4}[a-z]?)(?:\s*\/\s*[A-Za-z]{0,4}(\d{1,4}))?$/);return m&&!/^(ex|gx|v|vmax|vstar)$/i.test(m[2])?{name:m[1],num:m[2],tot:m[3]||''}:null}
function splitQuery(){const n=$('#qName'),u=$('#qNum'),m=parseQ(n.value);if(m){n.value=m.name;u.value=m.num;u.dataset.src='auto';window._qTotal=m.tot}else if(!u.value.trim())window._qTotal=''}
// Set-Gesamtzahlen (für „4/102“ -> Base Set vor Base Set 2)
const SETTOT={};fetch('https://api.tcgdex.net/v2/en/sets',{signal:AbortSignal.timeout(8000)}).then(r=>r.json()).then(L=>{for(const x of L||[])if(x.cardCount)SETTOT[String(x.id).toLowerCase()]=x.cardCount.official||x.cardCount.total}).catch(()=>{});
$('#searchForm').onsubmit=e=>{e.preventDefault();splitQuery();if(window.pendingScan&&$('#qName').value!==pendingScan.name)window.pendingScan=null;if(!window.pendingScan)window.scanLang='';search($('#qName').value,$('#qNum').value,$('#qSet').value)};
let lastResults=[];
// Bild-Hosts der Pokémon Company & Co. (seit v66 gesperrt): nie laden. Jedes <img> mit so einer URL wird sofort zum Platzhalter.
(()=>{const bad=u=>/^https?:\/\/([^/]*\.)?(pokemon-card\.com|snkrdunk\.com|tcgplayer\.com|serebii\.net|pokeca\.net)\//i.test(u||'');const fix=im=>{if(!(im instanceof HTMLImageElement)||!bad(im.getAttribute('src')))return;im.removeAttribute('src');if(window.phSwap&&im.dataset.phc)phSwap(im);else im.replaceWith(Object.assign(document.createElement('div'),{className:(im.className||'phthumb')+' phbox'}))};
 const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');if(d&&d.set)Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){if(bad(String(v)))return;d.set.call(this,v)}});
 const sa=Element.prototype.setAttribute;Element.prototype.setAttribute=function(n,v){if(this instanceof HTMLImageElement&&String(n).toLowerCase()==='src'&&bad(String(v)))return;return sa.call(this,n,v)};
 new MutationObserver(M=>{for(const m of M)for(const n of m.addedNodes){if(n.nodeType!==1)continue;fix(n);n.querySelectorAll&&n.querySelectorAll('img').forEach(fix)}}).observe(document.documentElement,{childList:true,subtree:true});
 document.querySelectorAll('img').forEach(fix)})();
// Set-Auswahl im Dialog „Zur Sammlung“ (manuell): Dropdown je Sprache, neueste zuerst, „Anderes Set…“ als Freitext
const SETSEL={};async function setListFor(lg){lg=lg==='jp'?'ja':lg;if(SETSEL[lg])return SETSEL[lg];let L=[];
 try{if(lg==='ja'){L=(await Prices.jpSets()).map(x=>({id:x.id,name:x.name}))}else{const r=await fetch(`https://api.tcgdex.net/v2/${lg}/sets`,{signal:AbortSignal.timeout(8000)});L=(await r.json()).filter(x=>!isPocket(x.id)&&!/^tcgp/i.test(x.id)).map(x=>({id:x.id,name:x.name})).reverse();
  try{const O=(await setOrd(lg))||{};if(Object.keys(O).length)L.sort((a,b)=>(O[String(b.id).toLowerCase()]??-1)-(O[String(a.id).toLowerCase()]??-1))}catch(e){}}}catch(e){L=[]}
 if(L.length)SETSEL[lg]=L;return L}
function setSelInit(f){const sel=f.setSel,flt=$('#setFlt'),oth=$('#setOtherL');let all=[];
 const want=()=>String(f.set.value||'').trim();
 const fill=(keep)=>{const q=String(flt.value||'').toLowerCase();const cur=keep??sel.value;const L=all.filter(x=>!q||(x.name+' '+x.id).toLowerCase().includes(q));
  sel.innerHTML='<option value="">– Set wählen –</option>'+L.map(x=>`<option value="${esc(x.id)}">${esc(x.name)} (${esc(x.id)})</option>`).join('')+'<option value="__other">Anderes Set…</option>';if(cur&&[...sel.options].some(o=>o.value===cur))sel.value=cur};
 const pick=()=>{const w=want().toLowerCase();if(!w)return'';const code=(w.match(/\(([^)]+)\)\s*$/)||[])[1];const jc=w.replace(/\s*\(jp\)\s*$/,'');
  const x=all.find(x=>[code,w,jc].includes(String(x.id).toLowerCase()))||all.find(x=>x.name.toLowerCase()===w.replace(/\s*\(.*\)\s*$/,'').replace(/\s*\(jp\)$/,''));return x?x.id:'__other'};
 const load=async()=>{const lg=String(f.lang&&f.lang.value||'DE').toLowerCase();sel.innerHTML='<option value="">Lade Sets…</option>';all=await setListFor(lg);
  if(!all.length){sel.innerHTML='<option value="__other">Anderes Set…</option>';sel.value='__other';oth.hidden=false;flt.hidden=true;return}flt.hidden=all.length<15;const p=pick();fill(p);if(p)sel.value=p;sync(false)};
 const sync=(user)=>{const v=sel.value;oth.hidden=v!=='__other';if(v&&v!=='__other'){const x=all.find(x=>x.id===v);if(x)f.set.value=x.name}else if(user&&v==='__other'){f.set.value='';f.set.focus()}};
 sel.onchange=()=>sync(true);flt.oninput=()=>fill();if(f.lang)f.lang.addEventListener('change',load);setTimeout(load,0)}
function manualAdd(x){window._dlgLang=x.lang||'';window._dlgPrefill=!!x.prefill;addDialog(null,'coll');const f=$('#dlgForm');
 if(window.Prices&&x.name&&f.price&&!x.noLookup){const lg=(x.lang||'DE').toLowerCase(),nm=String(x.name).replace(/\s*\(.*\)\s*$/,'').trim();Prices.lookup(lg==='jp'||lg==='ja'?String(x.name):nm,lg,x.set||null,x.number||null).then(r=>{if(r&&f.img&&!f.img.value&&r.image&&$('#dlg').open)f.img.value=r.image;if(r&&!r.best&&f.price&&$('#dlg').open){const l=f.price.closest('label');if(l&&!l.querySelector('.apl'))l.insertAdjacentHTML('beforeend','<span class="muted small apl">Noch kein Preis in den Datenbanken – wird später automatisch nachgeladen</span>')}if(r&&r.best&&f.price&&!f.price.value&&$('#dlg').open){f.price.value=r.best.eur;f.price.dataset.auto=r.best.eur;f.price.dataset.lbl=r.label;f.price.dataset.aid=r.id;const l=f.price.closest('label');if(l&&!l.querySelector('.apl'))l.insertAdjacentHTML('beforeend',`<span class="muted small apl">${esc(r.label)}</span>`)}}).catch(()=>{})}
 if(f.name)f.name.value=x.name||'';if(f.number)f.number.value=x.number||'';if(f.set)f.set.value=x.set||'';if(f.lang&&x.lang)f.lang.value=x.lang;if(f.img&&x.img)f.img.value=x.img}
function bindMan(name,num,set,hit){const ps=window.pendingScan||{};const nr=String(ps.number||num||'');const x={name:ps.jp?`${ps.name} (${ps.jp})`:(ps.name||name),number:nr.split('/')[0].replace(/^0+(?=\d)/,''),set:ps.set||set,lang:ps.lang,prefill:!!ps.name};
 ['#manScan','#manScan2'].forEach(id=>{const b=$(id);if(b)b.onclick=()=>hit?addFromTdx(hit):manualAdd(x)})}
// TCGdex-Treffer direkt in den Dialog: Name, Nummer, Set, Sprache, Bild, Preis-Referenz
async function addFromTdx(c){const lg=c.lang==='ja'?'JP':String(c.lang||'de').toUpperCase();let x=null;try{x=await Prices.byId(c.id,c.lang)}catch(e){}
 manualAdd({name:c.name,number:c.localId,set:c.set&&c.set.id?`${c.set.name||c.set.id} (${c.set.id})`:'',lang:lg,prefill:true,noLookup:true});const f=$('#dlgForm');
 if(f.img)f.img.value=(x&&x.image)||(c.img||'').replace(/\/low\.webp$/,'/high.webp');
 const pe=x&&x.best?x.best.eur:null;if(f.price&&pe!=null){f.price.value=pe;f.price.required=false;const l=f.price.closest('label');if(l&&!l.querySelector('.apl'))l.insertAdjacentHTML('beforeend',`<span class="muted small apl">${esc(x.label)}</span>`)}
 else if(f.price){const l=f.price.closest('label');if(l&&!l.querySelector('.apl'))l.insertAdjacentHTML('beforeend','<span class="muted small apl">Noch kein Preis in den Datenbanken – wird später automatisch nachgeladen</span>')}
 window.tdxPick={id:c.id,setId:c.set&&c.set.id,price:pe,tdx:x&&x.best?{label:x.label,id:x.id,src:x.best.source,conv:x.best.umgerechnet,url:x.best.url}:{label:'kein Preis bei TCGdex',id:c.id}}}
async function search(name,num,set,setId){const q=[];const raw=clean(name||''),isJ=/[\u3040-\u30ff\u4e00-\u9fff]/.test(raw);let nm=raw;
 if(isJ){const sm=raw.match(/\s*(ex|EX|GX|V|VMAX|VSTAR)$/),b0=sm?raw.slice(0,sm.index):raw,r=(window.PNAMES||[]).find(x=>x[2]&&x[2].replace(/\s/g,'')===b0.replace(/\s/g,''));if(r&&r[0])nm=r[0]+(sm?' '+sm[1]:'')}
 name=isJ?nm:deName(raw);const tdxName=isJ?raw:name,ascii=/^[\x00-\x7f]*$/.test(name);num=clean(num||'').split('/')[0].replace(/^0+(?=\d)/,'');set=clean(set||'');
 if(name)q.push(name.includes(' ')?`name:"${name}"`:`name:${name}*`);if(num)q.push(`number:${num}`);if(set)q.push(`set.name:"${set}*"`);if(setId)q.push(`set.id:${setId}`);
 if(!q.length)return;try{sugMain&&sugMain.hide()}catch(e){}const R=$('#results'),my=++SEARCHN;R.innerHTML='<p class="muted">Suche…</p>';
 const tlE=isJ?'JP':((window.pendingScan&&window.pendingScan.lang)||'').toUpperCase();
 // TCGdex (DE/EN/JP) parallel zur englischen Datenbank starten
 const tdxP=window.Prices&&raw?tdxFind(tdxName,num,tlE||'DE').catch(()=>({list:[]})):null;
 try{let d={data:[]},apiErr=false;const sel='&select=id,name,number,set,images,cardmarket,rarity,types,supertype';
  if(setId){try{d=await setCards(setId,q,sel)}catch(e){apiErr=true}}
  else if(ascii&&!tdxP){try{d=await api(`${API}/cards?q=${encodeURIComponent(q.join(' '))}&pageSize=60${sel}`,1,4500)}catch(e){apiErr=true}}
  if(my!==SEARCHN)return;
  if(setId&&!raw&&(apiErr||!d.data.length)&&window.Prices){if(await tdxSetView(R,setId,my))return}
  if(tdxP&&(!setId||apiErr||!d.data.length))return searchRender(R,setId?[]:(d.data||[]),apiErr,tdxP,{name,num,set,tdxName,my,setId});
  if(apiErr&&!(window.Prices&&!setId&&raw))throw new Error('API nicht erreichbar');
  const ps=window.pendingScan,jpB=ps&&ps.lang&&ps.lang!=='EN'?`<div class="scanpick"><b>${ps.lang==='JP'?'🇯🇵 Japanische Karte':'Karte ('+ps.lang+')'}: ${esc(ps.name||'')} ${esc(ps.number||'')}</b><p class="muted small"><span id="tdxHint">Suche in TCGdex nach der ${ps.lang}-Version…</span></p><button type="button" class="primary big" id="manScan">➕ Manuell hinzufügen</button></div>`:'';
  const tl=isJ?'JP':((ps&&ps.lang)||window.scanLang||'').toUpperCase(),useT=window.Prices&&!setId&&name&&(tl&&tl!=='EN');
  if(!d.data.length&&setId&&name)return search(name,num,set);
  if(!d.data.length){R.innerHTML=jpB+'<p class="muted" id="noHit">'+(apiErr?'Englische Datenbank gerade nicht erreichbar – suche bei TCGdex…':'Nichts in der englischen Datenbank gefunden.')+(jpB?'':' <button type="button" id="manScan2">➕ Manuell hinzufügen</button>')+'</p>';bindMan(tdxName,num,set);if(window.Prices&&!setId&&raw)tdxResults(R,tdxName,num,tl||'DE');return}
  d.data.sort((a,b)=>setId?numCmp(a.number,b.number):(b.set.releaseDate||'').localeCompare(a.set.releaseDate||''));lastResults=d.data;
  R.innerHTML='';R.classList.toggle('binder-src',!!setId);for(const c of d.data){const p=cmPrice(c);const ci=cmInfo(c);const ch=ci&&ci.avg7&&p?(p-ci.avg7)/ci.avg7*100:null;
   const own=owned(c.id),el=tile({type:c.types&&c.types[0],img:c.images.small,name:setId?`${own?'✓ ':''}#${c.number} ${c.name}`:c.name,sub:`${c.set.name} · ${c.number}/${c.set.printedTotal}`,price:p,chg:ch,badge:own?'✓ BESITZ':c.rarity&&/Special|Hyper|Secret|Illustration/i.test(c.rarity)?'SAR/SIR':''});
   if(setId&&own)el.classList.add('owned');cmSync(c).then(ok=>{if(!ok)return;const pb=el.querySelector('.p b');if(pb)pb.textContent=money(cmPrice(c))});el.onclick=()=>detail({api:c});
   const a=document.createElement('div');a.className='acts';a.innerHTML='<button>+ Sammlung</button><button>☆</button>';
   a.children[0].onclick=e=>{e.stopPropagation();addDialog(c,'coll')};a.children[1].onclick=e=>{e.stopPropagation();addDialog(c,'wish')};el.append(a);R.append(el)}
  if(setId&&window.FX)FX.binder(R,SETS.find(s=>s.id===setId));if(setId){R.insertAdjacentHTML('afterbegin',`<h3 class="small" style="grid-column:1/-1">${esc((SETS.find(s=>s.id===setId)||{}).name||setId)} · ${d.data.length} Karten</h3>`);window.scrollTo(0,0)}if(jpB){R.insertAdjacentHTML('afterbegin',jpB);bindMan(name,num,set)}if(useT)tdxResults(R,tdxName,num,tl,true)
 }catch(e){R.innerHTML=`<p class="neg">${e.message}. Bitte später erneut versuchen.</p>`}}

const NPRE={'':0,RC:1,TG:2,GG:3,SV:4,SWSH:5,SM:5,XY:5,BW:5,DP:5,HGSS:5,SVP:5};
const numKey=n=>{n=String(n||'').trim();let m=n.match(/^(\d+)([a-z]*)$/i);if(m)return[0,+m[1],m[2]];m=n.match(/^([A-Za-z]+)[-_ ]?(\d+)/);if(m)return[NPRE[m[1].toUpperCase()]??6,+m[2],m[1]];return[9,0,n]};
const numCmp=(a,b)=>{const x=numKey(a),y=numKey(b);return x[0]-y[0]||x[1]-y[1]||String(x[2]).localeCompare(String(y[2]))};
// Request-Pool (max 6 parallel, Timeout je Auftrag)
const POOL={n:0,q:[]};function pool(fn,ms=7000){return new Promise(res=>{POOL.q.push(async()=>{let t;try{res(await Promise.race([fn(),new Promise((_,rj)=>t=setTimeout(()=>rj(new Error('timeout')),ms))]))}catch(e){res(null)}finally{clearTimeout(t);POOL.n--;poolNext()}});poolNext()})}
function poolNext(){while(POOL.n<6&&POOL.q.length){POOL.n++;POOL.q.shift()()}}
// pokemontcg.io-Karte: Cardmarket-Werte aus TCGdex (gleiche Quelle wie Detail/Scan), sonst pokemontcg.io
const CMS=new Map();function cmSync(c){if(!window.Prices||!c||c._tdx)return Promise.resolve(false);if(c._sy)return c._sy;
 c._sy=(CMS.has(c.id)?Promise.resolve(CMS.get(c.id)):pool(()=>Prices.byId(c.id,'en')).then(r=>{CMS.set(c.id,r);return r})).then(r=>{const cm=r&&r.prices&&r.prices.find(p=>/^Cardmarket/.test(p.source));if(!cm)return false;
  c.cardmarket={url:cm.url||(c.cardmarket&&c.cardmarket.url),prices:{trendPrice:cm.trend,avg1:cm.avg1,avg7:cm.avg7,avg30:cm.avg30,lowPrice:cm.low,averageSellPrice:cm.avg}};return true}).catch(()=>false);return c._sy}
// Set-Reihenfolge (TCGdex en/sets ist chronologisch); Promo-Sets ans Ende
let SETORD={};const isPocket=id=>/^(a\d+[a-z]?|b\d+[a-z]?|p-[ab])$/i.test(String(id||''));
// Set-Rang nach Erscheinungsdatum (größer = neuer); JP: TCGdex ja + jpcards-Sets (Prices.jpSets, neueste zuerst)
const setOrd=lg=>SETORD[lg]||(SETORD[lg]=(async()=>{const m={};try{const L=await (await fetch(`https://api.tcgdex.net/v2/${lg==='ja'?'ja':'en'}/sets?sort:field=releaseDate&sort:order=DESC`,{signal:AbortSignal.timeout(8000)})).json();L.forEach((x,i)=>m[x.id.toLowerCase()]=1e4-i*10)}catch(e){}
 if(lg==='ja'&&window.Prices&&Prices.jpSets){try{const J=await Prices.jpSets();J.forEach((x,i)=>{const k=String(x.id).toLowerCase();if(m[k]==null){const nb=J.slice(0,i).reverse().find(y=>m[String(y.id).toLowerCase()]!=null);m[k]=nb?m[String(nb.id).toLowerCase()]-5:2e4-i}})}catch(e){}}return m})());
const isPromo=id=>/(^|[^a-z])(svp|swshp|smp|xyp|bwp|dpp|np|hgssp|mep|basep|wp)$|promo|-p$/i.test(String(id||''));
// Preisquelle -> kurzes Label + Erklärung
function priceInfo(src){src=String(src||'');if(/sch[äa]tz/i.test(src))return['eigene Schätzung','Von dir geschätzt, weil keine Quelle einen Preis hat. Wird automatisch durch den Marktpreis ersetzt, sobald einer verfügbar ist.'];if(/eigen|own/i.test(src))return['Eigener Preis','Von dir eingetragener Wert.'];
 if(/JP-Markt|pokeca/i.test(src))return['JP-Markt','Preis vom japanischen Markt (pokeca-souba, Mittelwert der Angebote), in Euro umgerechnet.'];
 if(/TCGplayer/i.test(src))return['TCGplayer-Markt','Marktpreis aus den USA (TCGplayer), in Euro umgerechnet – Cardmarket hatte keinen Wert.'];
 if(/1st/i.test(src))return['1st Edition','Preis für die 1st-Edition-Variante (TCGplayer, umgerechnet).'];
 if(/Ø 7|Ø 30|unplausibel/.test(src))return[/Ø 30/.test(src)?'Ø 30 Tage':'Ø 7 Tage','Der Cardmarket-Trend war unplausibel niedrig, daher der Durchschnitt der letzten Verkäufe.'];
 return['Cardmarket-Trend (alle Sprachen)','Typischer aktueller Verkaufspreis auf Cardmarket – nicht der billigste Angebotspreis. Cardmarket führt einen gemeinsamen Preis für DE, EN, FR, IT usw.; die Sprache der Karte ändert ihn hier nicht. Japanische Karten haben eigene Preise vom japanischen Markt.']}
const pSrc=src=>`<span class="psrc">${esc(priceInfo(src)[0])}<button type="button" class="qhelp" aria-label="Was bedeutet das?" data-h="${esc(priceInfo(src)[1])}">?</button></span>`;
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.qhelp');if(!b)return;e.preventDefault();e.stopPropagation();const p=b.closest('.psrcw')||b.parentNode;let h=p.querySelector('.phelp');if(h){h.remove();return}h=document.createElement('span');h.className='phelp';h.textContent=b.dataset.h;p.append(h)},true);
let SEARCHN=0;$('#results').addEventListener('click',e=>{if(e.target.closest('.bprev,.bnext'))$('#results').scrollIntoView({block:'start'})});
const owned=id=>S.collection.some(x=>x.apiId===id||x.tdxId===id||(x.tdx&&x.tdx.id===id));
// alle Karten eines Sets (pokemontcg.io, mit Seiten)
async function setCards(setId,q,sel){let all=[],page=1,tot=1;while(all.length<tot&&page<6){const d=await api(`${API}/cards?q=${encodeURIComponent(q.join(' '))}&pageSize=250&page=${page}${sel}`,3,8000);all=all.concat(d.data||[]);tot=d.totalCount||all.length;page++;if(!(d.data||[]).length)break}return{data:all}}
// Set-Fallback über TCGdex (gleiche Set-IDs bei älteren Sets)
async function fetchRetry(u,ms=8000,retries=2){let r=null;for(let i=0;i<=retries;i++){try{r=await fetch(u,{signal:AbortSignal.timeout(ms)});if(r.ok||r.status===404)return r}catch(e){if(i===retries)throw e}if(i<retries)await new Promise(z=>setTimeout(z,1000*2**i))}return r}
async function tdxSetView(R,setId,my){try{const r=await fetchRetry('https://api.tcgdex.net/v2/en/sets/'+encodeURIComponent(setId));if(!r.ok)return false;const j=await r.json();if(my!==SEARCHN)return true;
 const cs=(j.cards||[]).sort((a,b)=>numCmp(a.localId,b.localId));if(!cs.length)return false;
 R.classList.remove('binder-src');R.innerHTML=`<h3 class="small" style="grid-column:1/-1">${esc(j.name)} · ${cs.length} Karten <span class="muted">(TCGdex)</span></h3>`;
 cs.forEach(c=>{const id=c.id,el=tile({img:c.image?c.image+'/low.webp':'',name:`${owned(id)?'✓ ':''}#${c.localId} ${c.name}`,sub:`#${c.localId}/${j.cardCount&&j.cardCount.official||''}`,price:null,badge:owned(id)?'✓ BESITZ':''});const pb=el.querySelector('.p b');if(pb)pb.textContent='';el.onclick=()=>tdxDetail({id,lang:'en',name:c.name,localId:c.localId,set:{id:j.id,name:j.name},img:c.image?c.image+'/low.webp':''});R.append(el)});window.scrollTo(0,0);return true}catch(e){return false}}
const LNAME={de:'🇩🇪 Deutsch',en:'🇬🇧 Englisch',ja:'🇯🇵 Japanisch'};
// Suchergebnisse: EN-Datenbank (Cardmarket-Preise) + TCGdex nach Sprache gruppiert, progressiv
async function searchRender(R,data,apiErr,tdxP,o){R.classList.remove('binder-src');R.innerHTML='';const head=document.createElement('p');head.className='muted small';head.style.gridColumn='1/-1';head.id='noHit';R.append(head);
 data.sort((a,b)=>(b.set.releaseDate||'').localeCompare(a.set.releaseDate||'')||numCmp(a.number,b.number));lastResults=data;
 const ps=window.pendingScan;if(ps&&ps.lang&&(ps.lang!=='EN'||(ps.name&&ps.number))){head.insertAdjacentHTML('beforebegin',`<div class="scanpick" style="grid-column:1/-1"><b>${ps.lang==='JP'?'🇯🇵 Japanische Karte':'Karte ('+ps.lang+')'}: ${esc(ps.name||'')} ${esc(ps.number||'')}</b><p class="muted small"><span id="tdxHint">Suche in TCGdex…</span></p><button type="button" class="chip" id="manScan">➕ Manuell hinzufügen</button></div>`)}
 if(data.length){R.insertAdjacentHTML('beforeend',`<h3 class="small" data-lang="en" style="grid-column:1/-1">🇬🇧 Englisch · Cardmarket-Preise (${data.length})</h3>`);for(const c of data){const t=enTile(c);t.dataset.lang='en';R.append(t)}R.lastElementChild&&0}
 head.textContent='';
 const box=document.createElement('div');box.style.cssText='display:contents';box.innerHTML='<p class="muted small" style="grid-column:1/-1" id="tdxWait">Weitere Sprachen werden geladen…</p>';R.append(box);
 const r=await tdxP;if(o.my!==SEARCHN||!box.isConnected)return;box.innerHTML='';
 let L=(r.list||[]).filter(c=>!isPocket(c.set&&c.set.id));if(data.length)L=L.filter(c=>c.lang!=='en');
 const h=$('#tdxHint');if(h)h.textContent=L.length?`Treffer bei TCGdex${r.exact?'':' (Nummer nicht gefunden, alle Treffer zum Namen)'}.`:'Auch bei TCGdex nicht gefunden – manuell hinzufügen.';
 if(!L.length&&!data.length){head.innerHTML='Keine Karte gefunden. <button type="button" id="manScan2" class="chip">➕ Manuell hinzufügen</button>';bindMan(o.tdxName,o.num,o.set);return}
 bindMan(o.tdxName,o.num,o.set,r.exact?(L.find(c=>c.lang===r.lang)||L[0]):null);
 const SOS={de:await setOrd('en'),en:await setOrd('en'),ja:await setOrd('ja')};if(o.my!==SEARCHN)return;const ord=[(r.lang||'de'),'de','en','ja'].filter((x,i,a)=>a.indexOf(x)===i);
 for(const lg of ord){const SO=SOS[lg]||{};const qn=String(($('#qName')||{}).value||'').trim(),qu=String(($('#qNum')||{}).value||'').trim().replace(/^0+(?=\d)/,'').toLowerCase();const NS=new Set([qn,...(()=>{try{return tdxNames(qn,lg==='ja'?'ja':lg).concat(tdxNames(qn,'de'),tdxNames(qn,'en'))}catch(e){return[]}})()].map(x=>String(x).toLowerCase()));
 const RK=c=>{const en=NS.has(String(c.name||'').toLowerCase()),num=String(c.localId||'').replace(/^0+(?=\d)/,'').toLowerCase();const tt=String(window._qTotal||'').replace(/^0+/,''),st=String((c.set&&(c.set.printedTotal||(c.set.cardCount&&c.set.cardCount.official)))||SETTOT[String(c.set&&c.set.id||'').toLowerCase()]||''),tm=tt&&st===tt?0:1;return (en&&qu&&num===qu?0:en?2:4)+tm};
 const G=L.filter(c=>c.lang===lg).sort((a,b)=>{const rr=qn||window._qTotal?RK(a)-RK(b):0;if(rr)return rr;const sa=String(a.set.id).toLowerCase(),sb=String(b.set.id).toLowerCase(),oa=SO[sa]??-1,ob=SO[sb]??-1;return (o.setId?(sb===String(o.setId).toLowerCase())-(sa===String(o.setId).toLowerCase()):0)||(isPromo(sa)-isPromo(sb))||(ob-oa)||sa.localeCompare(sb)||numCmp(a.localId,b.localId)});if(!G.length)continue;
  box.insertAdjacentHTML('beforeend',`<h3 class="small" data-lang="${lg}" style="grid-column:1/-1">${LNAME[lg]||lg} (${G.length})${r.exact?'':''}</h3>`);G.forEach((c,i)=>{const t=tdxTile(c,i<12);t.dataset.lang=lg;box.append(t)})}
 langChips(R)}
// v82: Sprachfilter über den Suchergebnissen
function langChips(R){R.querySelector('.langChips')?.remove();const ls=[...new Set([...R.querySelectorAll('[data-lang]')].map(e=>e.dataset.lang))];if(ls.length<2)return;const LB={de:'🇩🇪 DE',en:'🇬🇧 EN',ja:'🇯🇵 JP',fr:'🇫🇷 FR',it:'🇮🇹 IT',es:'🇪🇸 ES'};
 const row=document.createElement('div');row.className='langChips';row.innerHTML=['all',...ls].map(l=>`<button type="button" data-l="${l}" class="${l==='all'?'on':''}">${l==='all'?'Alle':(LB[l]||l.toUpperCase())}</button>`).join('');
 row.onclick=e=>{const b=e.target.closest('button');if(!b)return;row.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));const l=b.dataset.l;R.querySelectorAll('[data-lang]').forEach(el=>{el.style.display=l==='all'||el.dataset.lang===l?'':'none'})};
 const first=R.querySelector('[data-lang]');(first?first:R.lastChild)?.before?first.before(row):R.append(row)}
function enTile(c){const p=cmPrice(c);const ci=cmInfo(c);const ch=ci&&ci.avg7&&p?(p-ci.avg7)/ci.avg7*100:null;
 const el=tile({type:c.types&&c.types[0],img:c.images.small,name:c.name,sub:`${c.set.name} · ${c.number}/${c.set.printedTotal}`,price:p,chg:ch,badge:owned(c.id)?'✓ BESITZ':c.rarity&&/Special|Hyper|Secret|Illustration/i.test(c.rarity)?'SAR/SIR':''});
 cmSync(c).then(ok=>{if(!ok)return;const pb=el.querySelector('.p b');if(pb)pb.textContent=money(cmPrice(c))});el.onclick=()=>detail({api:c});const a=document.createElement('div');a.className='acts';a.innerHTML='<button>+ Sammlung</button><button>☆</button>';
 a.children[0].onclick=e=>{e.stopPropagation();addDialog(c,'coll')};a.children[1].onclick=e=>{e.stopPropagation();addDialog(c,'wish')};el.append(a);return el}
const PIO=('IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){PIO.unobserve(e.target);e.target._ld&&e.target._ld()}}),{rootMargin:'200px'}):null;
function tdxTile(c,load){const el=tile({img:c.img,name:c.name,sub:`${c.set.name}${c.lang==='ja'&&c.set.id&&c.set.id!==c.set.name?' ('+c.set.id+')':''} · ${c.localId} · ${c.lang==='ja'?'JP':c.lang.toUpperCase()}`,price:null,badge:owned(c.id)?'✓ BESITZ':''});
 let pb=el.querySelector('.p b');if(!pb){const pd=document.createElement('div');pd.className='p';pd.innerHTML='<b></b>';el.append(pd);pb=pd.querySelector('b')}pb.textContent='…';
 const cmL=`<a class="plink" style="font-size:.7rem;padding:.05rem .4rem" href="https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(c.name)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">CM ↗</a>`;
 el._ld=()=>pool(()=>Prices.byId(c.id,c.lang)).then(async x=>{pb.innerHTML=x&&x.best?x.best.eur.toFixed(2).replace('.',',')+' €':'– '+cmL;if(x&&x.best&&!el.querySelector('.tsrc'))el.insertAdjacentHTML('beforeend',`<div class="tsrc">${esc(priceInfo(x.best.source)[0])}</div>`);if(!c.img&&c.lang!=='en'&&!String(c.id).startsWith('jp:')){const e=await pool(()=>Prices.byId(c.id,'en'));const u=(x&&x.image)||(e&&e.image);if(u){const im=el.querySelector('.im');if(im&&!(x&&x.image)&&!el.querySelector('.imgnote'))im.insertAdjacentHTML('afterend','<div class="imgnote">Bild: englische Version</div>');if(im){im.style.backgroundImage=`url('${u.replace(/\/high\.webp$/,'/low.webp')}')`;const sv=im.querySelector('svg');sv&&sv.remove()}c.img=u.replace(/\/high\.webp$/,'/low.webp')}}});
 let done=false;const go=()=>{if(done)return;done=true;el._ld0()};el._ld0=el._ld;el._ld=go;if(PIO)PIO.observe(el);setTimeout(()=>{if(el.isConnected)go()},400);
 el.onclick=()=>tdxDetail(c);return el}
// TCGdex-Karte -> Detailansicht (Cardmarket/eBay), danach + Sammlung
async function tdxDetail(c){let x=null;try{x=await Prices.byId(c.id,c.lang)}catch(e){}if(x&&!x.image&&c.lang!=='en'&&!String(c.id).startsWith('jp:')){try{const e=await Prices.byId(c.id,'en');if(e&&e.image){x.image=e.image;x._imgEn=true}}catch(_){}}const cm=x&&x.prices&&x.prices.find(p=>/^Cardmarket/.test(p.source));
 const pc={id:c.id,_tdx:x,_lang:c.lang==='ja'?'JP':c.lang.toUpperCase(),name:c.name,number:c.localId,rarity:null,types:[],set:{id:c.set.id,name:c.set.name,printedTotal:(x&&x.total)||''},
  images:{small:c.img||(x&&x.image)||'',large:(x&&x.image)||(c.img||'').replace(/\/low\.webp$/,'/high.webp')},
  cardmarket:cm?{url:cm.url,prices:{trendPrice:cm.eur,avg1:cm.avg1,avg7:cm.avg7,avg30:cm.avg30,lowPrice:cm.low}}:null};
 detail({api:pc})}
// TCGdex-Fallback für die Suche (andere Sprachen / nicht in pokemontcg.io)
function tdxNames(name,lang){const n=name.toLowerCase(),out=new Set([name]),i=lang==='de'?1:lang==='ja'?2:0;
 for(const r of [...(window.PNAMES||[]),...(window.TNAMES||[])])if(r.some(x=>x&&x.toLowerCase()===n)){if(r[i])out.add(r[i]);if(r[0])out.add(r[0])}return[...out]}
async function tdxFind(name,num,lang){lang=(lang||'de').toLowerCase();if(lang==='jp')lang='ja';const nn=num?String(num).replace(/^0+(?=\d)/,''):'';const seen=new Set();let all=[];
 const jobs=[];for(const lg of lang==='en'?['en']:[lang,'en'])for(const q of tdxNames(name,lg))jobs.push(Prices.suggest(q,lg,100).catch(()=>[]));
 // Name+Nummer direkt bei TCGdex filtern (suggest ist auf 100 Treffer begrenzt, bei „Pikachu“ fehlen sonst die Nr.-Treffer)
 if(nn&&!/[^\x00-\x7f]/.test(name)||nn&&lang!=='ja')for(const lg of lang==='en'?['en']:[lang,'en'])if(lg!=='ja')for(const q of tdxNames(name,lg))jobs.push((async()=>{try{const r=await fetch(`https://api.tcgdex.net/v2/${lg}/cards?name=${encodeURIComponent(q)}&localId=${encodeURIComponent(nn)}`,{signal:AbortSignal.timeout(6000)});if(!r.ok)return[];const L=(await r.json()).slice(0,12);
   return (await Promise.all(L.map(async x=>{try{const d=await (await fetch(`https://api.tcgdex.net/v2/${lg}/cards/${encodeURIComponent(x.id)}`,{signal:AbortSignal.timeout(6000)})).json();return{id:d.id,name:d.name,localId:d.localId,set:{id:d.set&&d.set.id,name:d.set&&d.set.name},img:d.image?d.image+'/high.webp':'',lang:lg}}catch(e){return{id:x.id,name:x.name,localId:x.localId,set:{id:x.id.split('-')[0],name:x.id.split('-')[0]},img:x.image?x.image+'/high.webp':'',lang:lg}}}))).filter(Boolean)}catch(e){return[]}})());
 for(const L of await Promise.all(jobs))for(const c of L||[])if(!seen.has(c.lang+c.id)){seen.add(c.lang+c.id);all.push(c)}
 const ns=new Set(tdxNames(name,'de').concat(tdxNames(name,'en'),tdxNames(name,'ja'),[name]).map(x=>String(x).toLowerCase().replace(/\s+/g,' ').trim()));const rk=c=>{const n=String(c.name||'').toLowerCase().replace(/\s+/g,' ').trim();return ns.has(n)?0:[...ns].some(x=>n.startsWith(x))?1:2};
 // exakter Treffer nur bei gleicher Nummer UND gleichem Namen (sonst wäre „ヤドン&コダックGX 096“ ein Treffer für „Flegmon 96“)
 const hit=nn?all.filter(c=>String(c.localId||'').replace(/^0+(?=\d)/,'')===nn&&rk(c)===0):[];all.sort((x,y)=>rk(x)-rk(y))
 const pref=a=>a.filter(c=>c.lang===lang).length?a.filter(c=>c.lang===lang):a;
 return{list:hit.length?hit:all.slice(0,300),exact:!!hit.length,lang}}
async function tdxResults(R,name,num,lang,append){const box=document.createElement('div');box.className='tdxRes';box.innerHTML='<p class="muted small">TCGdex wird durchsucht…</p>';
 if(append)R.append(box);else R.append(box);let r;try{r=await tdxFind(name,num,lang)}catch(e){r={list:[]}}
 if(!box.isConnected)return;const h=$('#tdxHint'),nh=$('#noHit');
 if(!r.list.length){box.innerHTML='';if(nh){nh.innerHTML='Keine Karte gefunden. <button type="button" id="manScan2">➕ Manuell hinzufügen</button>';bindMan(name,num,'')}if(h)h.textContent='Auch bei TCGdex nicht gefunden. Lege die Karte manuell an, den Preis trägst du selbst ein.';return}
 if(h)h.textContent=`Treffer bei TCGdex (${r.list[0].lang.toUpperCase()})${r.exact?'':', Nummer nicht gefunden: alle Treffer zum Namen'}. Antippen zum Hinzufügen.`;
 if(nh)nh.innerHTML='Nichts in der englischen Datenbank, aber Treffer bei TCGdex:';
 for(const id of ['manScan','manScan2']){const b=$('#'+id);if(b){b.classList.remove('primary','big');b.classList.add('chip');b.textContent='Nicht dabei? Manuell hinzufügen'}}
 box.innerHTML=`<h3 class="small">TCGdex${r.exact?'':' (alle Treffer zum Namen)'}</h3>`;const grid=document.createElement('div');grid.className='grid';grid.style.cssText='display:contents';box.append(grid);
 r.list.forEach((c,i)=>{const el=tile({img:c.img,name:c.name,sub:`${c.set.name} · ${c.localId} · ${c.lang.toUpperCase()}`,price:null});const pb=el.querySelector('.p b');if(pb)pb.textContent='…';
  let pr=null;const ld=()=>pr||(pr=Prices.byId(c.id,c.lang).catch(()=>null));
  if(i<16)ld().then(x=>{if(!pb)return;pb.textContent=x&&x.best?x.label:'kein Preis bei TCGdex'});else if(pb)pb.textContent='';
  el.onclick=()=>tdxDetail(c);el.onclickOld=async()=>{const x=await ld();const lg=c.lang==='ja'?'JP':c.lang.toUpperCase();
   manualAdd({name:c.name,number:c.localId,set:c.set.name,lang:lg});const f=$('#dlgForm');
   if(f.img)f.img.value=(x&&x.image)||(c.img||'').replace(/\/low\.webp$/,'/high.webp');
   const pe=x&&x.best?x.best.eur:null;if(f.price&&pe!=null){f.price.value=pe;f.price.required=false}
   window.tdxPick={id:c.id,setId:c.set.id,price:pe,tdx:x&&x.best?{label:x.label,id:x.id,src:x.best.source,conv:x.best.umgerechnet,url:x.best.url}:{label:'kein Preis bei TCGdex',id:c.id}}};
  R.append(el)})}
// Sets
let SETS=[];async function loadSets(){try{const d=await api(`${API}/sets?orderBy=-releaseDate&pageSize=250&select=id,name,series,releaseDate,images,total,printedTotal,ptcgoCode`);SETS=d.data.map(s=>s.name==='Base'?{...s,name:'Base Set'}:s);if(SETTAB!=='ja')renderSets()}catch(e){try{const j=await (await fetchRetry('https://api.tcgdex.net/v2/en/sets')).json();SETS=j.reverse().filter(x=>!isPocket(x.id)).map(x=>({id:x.id,name:x.name,series:'',releaseDate:'',total:x.cardCount&&x.cardCount.total||'',printedTotal:x.cardCount&&x.cardCount.official||'',images:{logo:x.logo?x.logo+'.png':''}}));if(SETTAB!=='ja')renderSets()}catch(_){$('#setList').innerHTML='<p class="muted small">Sets nicht ladbar.</p>'}}}
function renderSets(){const f=$('#setFilter').value.toLowerCase();$('#setList').innerHTML='';
 for(const s of SETS.filter(s=>!f||(s.name+' '+s.series+' '+s.id+' '+(s.ptcgoCode||'')).toLowerCase().includes(f))){const d=document.createElement('div');d.className='set';
  d.innerHTML=`<img loading="lazy" src="${s.images.logo}" alt=""><b>${esc(s.name)}</b><br><span class="muted">${esc(s.series)} · ${s.total} Karten · ${(s.releaseDate||'').slice(0,4)}</span>`;
  d.onclick=()=>{window.pendingScan=null;window.scanLang='';$('#qName').value='';$('#qNum').value='';search('','','',s.id);window.scrollTo(0,0)};$('#setList').append(d)}}
let SETTAB='en',JPSETL=null;
async function renderJpSets(){const L=$('#setList');if(!window.Prices||!Prices.jpSets){L.innerHTML='<p class="muted small">Nicht verfügbar.</p>';return}
 if(!JPSETL){L.innerHTML='<p class="muted small">Lade japanische Sets…</p>';try{JPSETL=await Prices.jpSets()}catch(e){JPSETL=[]}if(SETTAB!=='ja')return}
 const f=$('#setFilter').value.toLowerCase();L.innerHTML='';const fl=JPSETL.filter(s=>!f||(s.id+' '+s.name).toLowerCase().includes(f));
 if(!fl.length){L.innerHTML='<p class="muted small">Keine Sets gefunden.</p>';return}
 for(const s of fl.slice(0,80)){const d=document.createElement('div');d.className='set';
  d.innerHTML=`${s.logo?`<img class="jpcover" loading="lazy" src="${esc(s.logo)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'jpbadge',textContent:this.dataset.c}))" data-c="${esc(s.id)}">`:`<span class="jpbadge" data-s="${esc((s.id.match(/^[A-Za-z]+/)||[''])[0].toUpperCase())}">${esc(s.id)}</span>`}<b>${esc(s.id)}</b> ${esc(s.name)}<br><span class="muted">${s.count} Karten${s.src==='jp'?' · neu (pokemon-card.com)':''}</span>`;
  d.onclick=()=>jpSetCardsView(s);L.append(d)}}
async function jpSetCardsView(s){window.pendingScan=null;const R=$('#results');R.classList.remove('binder-src');R.innerHTML='<p class="muted">Lade Karten…</p>';window.scrollTo(0,0);
 let cs=[];try{cs=await Prices.jpSetCards(s.id)}catch(e){}
 if(!cs.length){R.innerHTML='<p class="muted">Keine Karten gefunden.</p>';return}
 cs.sort((a,b)=>(parseInt(a.localId)||9999)-(parseInt(b.localId)||9999));
 R.innerHTML=`<h3 class="small" style="grid-column:1/-1">🇯🇵 ${esc(s.id)} · ${esc(s.name)} · ${cs.length} Karten</h3>`;
 cs.forEach((c,i)=>{const el=tile({img:c.img,name:c.name,sub:`${s.id} · ${c.localId}`,price:null});const pb=el.querySelector('.p b');if(pb)pb.textContent=c.id.startsWith('jp:')?'–':'';
  let pr=null;const ld=()=>pr||(pr=Prices.byId(c.id,'ja').catch(()=>null));
  if(!c.id.startsWith('jp:')&&i<24)ld().then(x=>{if(pb)pb.textContent=x&&x.best?x.best.eur.toFixed(2).replace('.',',')+' €':'–'});
  el.onclick=async()=>{const x=await ld();manualAdd({name:c.name,number:c.localId,set:c.set.name||s.name,lang:'JP'});const f=$('#dlgForm');
   if(f.img)f.img.value=(x&&x.image)||(c.img||'').replace(/\/low\.webp$/,'/high.webp');
   const pe=x&&x.best?x.best.eur:null;if(f.price&&pe!=null){f.price.value=pe;f.price.required=false}
   window.tdxPick={id:c.id,setId:s.id,price:pe,tdx:x&&x.best?{label:x.label,id:x.id,src:x.best.source,conv:x.best.umgerechnet,url:x.best.url}:{label:(x&&x.label)||'kein Preis bei TCGdex',id:c.id}}};
  R.append(el)})}
function setTab(t){SETTAB=t;document.querySelectorAll('#setTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));t==='ja'?renderJpSets():renderSets()}
document.querySelectorAll('#setTabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.t));
$('#setFilter').oninput=()=>SETTAB==='ja'?renderJpSets():renderSets();

// Zweite Preisquelle (prices.js / TCGdex): Fallback bei fehlendem Preis oder nicht-englischer Karte
// 1st Edition im Detail: nur wenn TCGdex variants.firstEdition
async function fedInit(f,c){try{let id=String(c.id).replace(/^jp:.*/,'');if(!id)return;if(window.Prices&&Prices.tdxId)id=Prices.tdxId(id);const lg=(c._lang||'EN').toLowerCase()==='jp'?'ja':(c._lang||'EN').toLowerCase();
 let d=null;for(const l of [...new Set([lg,'en'])]){const r=await fetch(`https://api.tcgdex.net/v2/${l}/cards/${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(8000)});if(r.ok){d=await r.json();break}}
 if(!d||!d.variants||!d.variants.firstEdition||!f.isConnected)return;
 const tp=(d.pricing&&d.pricing.tcgplayer)||{},k=Object.keys(tp).find(x=>/1st/i.test(x)),o=k&&tp[k],val=o&&(o.marketPrice??o.midPrice??o.lowPrice);let eur=null;
 if(val!=null){const cv=await Prices.toEUR(val,tp.unit||'USD');eur=cv&&cv.eur}
 const big=f.querySelector('.detail .big');const box=document.createElement('div');box.className='fedBox';
 box.innerHTML=`<label class="fedChip" for="fedT"><input type="checkbox" id="fedT"> 1st Edition</label><p class="small" id="fedP" style="text-align:center;margin:.1rem 0"></p>`;
 (big||f.querySelector('.detail')).insertAdjacentElement('afterend',box);const orig=big&&big.innerHTML;
 box.querySelector('#fedT').onchange=e=>{window._first=e.target.checked;const P=box.querySelector('#fedP');
  if(!e.target.checked){if(big)big.innerHTML=orig;P.textContent='';return}
  if(eur!=null){if(big)big.innerHTML=money(eur);P.innerHTML=`<span class="muted">1st Edition · TCGplayer (TCGdex), umgerechnet</span>`;window._firstPrice=eur}
  else{window._firstPrice=null;P.innerHTML='<span style="color:#fbbf24">⚠️ Kein 1st-Edition-Preis in den Datenbanken – angezeigter Preis gilt nicht für 1st Edition</span>'}}}catch(e){}}
// 1st Edition: TCGdex-Variantenpreis (TCGplayer 1st-edition*) wenn vorhanden, sonst Hinweis
async function firstEd(it){if(!window.Prices)return;try{const nm=(it.name||'').replace(/\s*\(.*\)\s*$/,'').trim(),num=String(it.number||'').split('/')[0]||null;let r=it.tdxId?await Prices.byId(it.tdxId,'en'):null;if(!r)r=await Prices.lookup(deName(nm),'en',null,num);
 const v=r&&r.prices&&r.prices.find(x=>/1st/i.test(x.variant||'')&&x.eur!=null);if(v&&it.ownPrice==null){it.price=v.eur;it.priceNote='';it.tdx={label:`${v.eur.toFixed(2).replace('.',',')} € · ${v.source} · 1st Edition`,id:r.id,src:v.source+' 1st',url:null};trackPrice(it);save();snapshot();render()}}catch(e){}}
const tdxNeed=x=>x.ownPrice==null&&(x.price==null||x.estimate||(x.lang&&x.lang!=='EN'));
async function tdxFill(x){if(!window.Prices||x.ownPrice!=null||(x.variant==='1st'&&x.tdx&&/1st/.test(x.tdx.src||'')))return false;const lang=(x.lang||'DE').toLowerCase(),name=(x.name||'').replace(/\s*\(.*\)\s*$/,'').trim(),num=String(x.number||'').split('/')[0]||null;
 let r=null;const cid=[x.apiId,x.tdxId].find(v=>/^(cel25c|me55c)-/.test(v||''));if(cid){try{r=await Prices.byId(cid,lang);if(!(r&&r.best)&&lang!=='en')r=await Prices.byId(cid,'en')}catch(e){r=null}if(!(r&&r.best)){if(x.tdx&&x.tdx.id!==Prices.tdxId(cid)&&x.ownPrice==null){delete x.tdx;x.price=null}return false}}else try{const same=n=>{const p=nrm(n),q=nrm(name);if(!p||!q)return true;let d=q;try{d=nrm(deName(name))}catch(e){}return p===q||p===d||p.startsWith(q)||q.startsWith(p)||p.startsWith(d)||d.startsWith(p)};r=await Prices.lookup(name,lang,x.setId||null,num);if(r&&!same(r.name))r=await Prices.lookup(name,lang,null,num);if(r&&!same(r.name))r=null;if(!(r&&r.best)&&lang!=='en'&&lang!=='jp'&&lang!=='ja'){r=await Prices.lookup(name,'en',null,num);if(r&&!same(r.name))r=null}}catch(e){console.warn(e)}
 if(!(r&&r.best))return false;x.price=r.best.eur;delete x.noPrice;delete x.estimate;x.tdx={label:r.label,id:r.id,src:r.best.source,conv:r.best.umgerechnet,url:r.best.url};return true}
// Euro-Eingabe: „4,50“, „1.234,50“, „4.5“, „4 €“ -> Zahl; leer -> null; ungültig -> NaN
function parseEur(v){v=String(v??'').trim().replace(/\s|€/g,'');if(!v)return null;if(/,/.test(v))v=v.replace(/\./g,'').replace(',','.');const n=Number(v);return isFinite(n)&&n>=0?Math.round(n*100)/100:NaN}
// Für andere Module (z.B. Scan-Liste): Kaufpreis pro Stück setzen. Feld: item.buy (Zahl in € oder null)
window.setBuyPrice=(uid,value)=>{const it=S.collection.find(x=>x.uid===uid);if(!it)return false;const n=typeof value==='number'?value:parseEur(value);if(Number.isNaN(n))return false;it.buy=n;save();snapshot();render();return true};window.parseEur=parseEur;
// v71: Kaufpreis / Schätzung als In-App-Sheet (kein prompt), Komma erlaubt
function numSheet(it,kind){const f=$('#dlgForm'),buy=kind==='buy',cur=buy?it.buy:(it.estimate?it.price:null);
 f.innerHTML=`<h3>${buy?'Kaufpreis':'Wert schätzen'} · ${esc(it.name)}</h3><p class="muted small">${buy?'Was hast du pro Stück bezahlt? Fließt in Einstand und Gewinn/Verlust.':'Keine Quelle hat einen Preis für diese Karte. Deine Schätzung wird als „eigene Schätzung“ markiert und automatisch ersetzt, sobald ein Marktpreis da ist.'}</p>
 <label>${buy?'Kaufpreis pro Stück (€)':'Geschätzter Wert (€)'}<input name="nv" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" placeholder="z.B. 4,50" value="${cur!=null?String(cur).replace('.',','):''}" style="font-size:1.4rem;min-height:52px"></label><p class="small" id="nvErr" style="color:#f87171;margin:.2rem 0" hidden>Bitte eine Zahl eingeben, z.B. 4,50</p>
 <div class="row"><button value="ok">Speichern</button>${cur!=null?'<button value="clr" formnovalidate class="danger">Löschen</button>':''}<button value="cancel" formnovalidate>Abbrechen</button></div>`;
 const dlg=$('#dlg');dlg.returnValue='';dlg.showModal();const inp=f.nv;setTimeout(()=>{inp.focus();inp.select()},50);
 const parse=v=>{v=String(v||'').trim().replace(/\s|€/g,'');if(!v)return null;if(/,/.test(v))v=v.replace(/\./g,'').replace(',','.');const n=parseFloat(v);return isFinite(n)&&n>=0?Math.round(n*100)/100:NaN};
 f.onsubmit=e=>{if(e.submitter&&e.submitter.value==='ok'&&Number.isNaN(parse(inp.value))){e.preventDefault();$('#nvErr').hidden=false}};
 dlg.onclose=()=>{f.onsubmit=null;const r=dlg.returnValue;if(r!=='ok'&&r!=='clr')return;const n=r==='clr'?null:parse(inp.value);if(Number.isNaN(n))return;
  if(buy)it.buy=n;else if(n==null){if(it.estimate){it.price=null;delete it.estimate;it.noPrice=true}}else if(it.price==null||it.estimate){it.price=n;it.estimate=true;delete it.noPrice}
  trackPrice(it);save();snapshot();render()}}
// Type-ahead mit Bildvorschlägen (Prices.suggest / TCGdex)
function attachSuggest(inp,onPick,getLang,anchor){if(!inp||!window.Prices||!Prices.suggest)return;const box=document.createElement('div');box.className='sugBox';box.hidden=true;(anchor||inp).insertAdjacentElement('afterend',box);
 let t=0,seq=0;const hide=()=>{clearTimeout(t);seq++;box.hidden=true;box.innerHTML=''};
 inp.setAttribute('autocomplete','off');
 inp.addEventListener('input',()=>{clearTimeout(t);const q=inp.value.trim();if(q.length<2){seq++;hide();return}
  t=setTimeout(async()=>{const my=++seq;let L=[];try{L=await Prices.suggest(q,(getLang&&getLang())||'de',24)}catch(e){}
   if(my!==seq)return;L=L.filter(c=>!isPocket(c.set&&c.set.id));if(!L.length){hide();return}
   box.innerHTML=L.map((c,i)=>`<button type="button" class="sugItem" data-i="${i}">${safeImg(c.img)?`<img src="${esc(safeImg(c.img))}" alt="" loading="lazy">`:'<div class="sugNo">?</div>'}<b>${esc(c.name)}</b><span>${esc(c.set.name)} ${esc(c.localId)}</span></button>`).join('');box.hidden=false;
   box.querySelectorAll('.sugItem').forEach(b=>b.onclick=()=>{const c=L[+b.dataset.i];hide();onPick(c)})},300)});
 inp.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});return{hide}}
const sugMain=attachSuggest($('#qName'),c=>{$('#qName').value=c.name;$('#qNum').value=c.localId.replace(/^0+(?=\d)/,'');window.pendingScan=null;window.scanLang='';tdxDetail(c);search(c.name,$('#qNum').value,'')},()=>(window.scanLang||'DE').toLowerCase(),$('#searchForm'));
$('#searchForm').addEventListener('submit',()=>sugMain&&sugMain.hide());
function addDialog(c,mode,sealed){const manual=!c;window.tdxPick=null;const f=$('#dlgForm');const tx=c&&c._tdx;const p=c?(cmPrice(c)??(tx&&tx.best?tx.best.eur:null)):null;const dLang=(c&&c._lang)||window._dlgLang||window.scanLang||'DE';window._dlgLang='';
 f.innerHTML=`<h3>${mode==='wish'?'Zur Wunschliste':sealed?'Sealed-Produkt hinzufügen':'Zur Sammlung'}</h3>
 ${manual?`<label>Name<input name="name" required placeholder="${sealed?'z.B. 30 Jahre Booster Bundle':''}"></label><label>Set<input type="search" id="setFlt" placeholder="Set filtern…" autocomplete="off" style="margin-bottom:.3rem"><select name="setSel" id="setSel"><option value="">Lade Sets…</option></select></label><label id="setOtherL" hidden>Anderes Set (Name oder Code)<input name="set"></label>${sealed?'':'<label>Nummer<input name="number"></label>'}<label>Bild-URL (optional)<input name="img"></label>`:`<p><b>${esc(c.name)}</b> – ${esc(c.set.name)} ${c.number}<br>${tx?esc(tx.best?tx.label:'Noch kein Preis – wird später nachgeladen'):'Cardmarket-Trend: '+money(p)}<br><span class="muted small" id="tdxLbl"></span></p>`}
 <label>Sprache<select name="lang">${LANGS.map(l=>`<option${l===dLang?' selected':''}>${l}</option>`).join('')}</select></label>${window.scanLang&&!(c&&c._tdx)?'<p class="muted small">Sprache per Scan erkannt: '+window.scanLang+'</p>':''}
 ${mode==='wish'?`<label>Zielpreis (€)<input name="target" type="number" step="0.01" required></label>`:
 `${sealed?'<input type="hidden" name="cond" value="Sealed">':`<label>Zustand<select name="cond"><option>NM</option><option>EX</option><option>GD</option><option>LP</option><option>PL</option><option>PSA 10</option><option>PSA 9</option><option>CGC 10</option><option>BGS 9.5</option><option>PSA/Graded</option></select></label>`}
 ${sealed?'':'<label class="row" style="gap:.4rem;align-items:center"><input type="checkbox" name="first" style="width:auto"'+(window._first?' checked':'')+'> 1st Edition</label>'}<label>Anzahl<input name="qty" type="number" value="1" min="1"></label><label>Kaufpreis (€, optional)<input name="buy" type="text" inputmode="decimal" autocomplete="off" placeholder="z.B. 4,50 · leer = nicht in Gewinn/Verlust"></label>`}
 <input type="hidden" name="price">
 <div class="row"><button value="ok">Speichern</button><button value="cancel" formnovalidate>Abbrechen</button></div>`;
 if(manual&&!sealed&&f.name)attachSuggest(f.name,c=>{f.name.value=c.name;if(f.set)f.set.value=c.set.name;if(f.number)f.number.value=c.localId;if(f.img&&c.img)f.img.value=c.img.replace(/\/low\.webp$/,'/high.webp')},()=>(f.lang&&f.lang.value||'DE').toLowerCase(),f.name.closest('label'));
 if(manual&&f.setSel)setSelInit(f);
 const dlg=$('#dlg');dlg.returnValue='';f.querySelectorAll('button[value=ok]').forEach(b=>b.addEventListener('click',e=>{if(b.dataset.busy){e.preventDefault();return}b.dataset.busy=1}));{const pf=window._dlgPrefill;window._dlgPrefill=false;const ok=f.querySelector('button[value=ok]');if(ok)ok.autofocus=!!pf}dlg.showModal();dlg.onclose=()=>{if(dlg.returnValue!=='ok')return;const v=Object.fromEntries(new FormData(f));
  const base=manual?{manual:true,setId:v.setSel&&v.setSel!=='__other'?v.setSel:undefined,name:v.name,set:v.set,number:v.number||'',img:v.img}:tx?{manual:true,tdxId:c.id,setId:c.set.id,name:c.name,set:c.set.name,number:c.number,img:c.images.large||c.images.small,types:[],tdx:tx.best?{label:tx.label,id:tx.id,src:tx.best.source,conv:tx.best.umgerechnet,url:tx.best.url}:{label:'kein Preis',id:c.id}}:{apiId:c.id,name:c.name,set:c.set.name,number:c.number,img:c.images.small,apiPrice:p,cm:cmInfo(c),types:c.types||[]};
  if(sealed)base.type='sealed';let own=v.price?parseFloat(v.price):null;const tp=manual?window.tdxPick:null;window.tdxPick=null;let tpp=null;{const au=f.price&&f.price.dataset.auto;if(au&&own===+au){own=null;tpp=+au;base.tdx={label:f.price.dataset.lbl||'',id:f.price.dataset.aid||''}}}if(tp){base.tdx=tp.tdx;base.tdxId=tp.id;base.setId=tp.setId;if(tp.price!=null&&(own==null||own===tp.price)){own=null;tpp=tp.price}}
  if(mode==='wish')S.wishlist.push({uid:uid(),...base,lang:v.lang,target:parseFloat(v.target),price:own??tpp??p,ownPrice:own});
  else{const it={uid:uid(),...base,lang:v.lang,cond:v.cond,qty:parseInt(v.qty)||1,buy:(n=>Number.isNaN(n)?null:n)(parseEur(v.buy)),price:own??tpp??p,ownPrice:own,added:today()};if(v.first){it.variant='1st';if(window._first&&window._firstPrice!=null&&own==null){it.price=window._firstPrice;it.priceNote='';it.tdx={label:money(window._firstPrice)+' · TCGplayer (TCGdex) · 1st Edition',id:c&&c.id,src:'TCGplayer 1st',url:null}}else it.priceNote='Preis gilt nicht für 1st Edition';}window._first=false;if(it.price==null)it.noPrice=true;trackPrice(it);S.collection.push(it);setTimeout(()=>showAddedToast(it.uid),50);if(v.first&&!(it.tdx&&/1st/.test(it.tdx.src||'')))firstEd(it);window.FX&&FX.reveal(it)}
  save();snapshot();render();const nw=mode==='wish'?S.wishlist[S.wishlist.length-1]:S.collection[S.collection.length-1];
  if(nw&&tdxNeed(nw))tdxFill(nw).then(ok=>{if(ok){trackPrice(nw);save();snapshot();render()}})};
 if(c&&window.Prices&&!/^(cel25c|me55c)-/.test(c.id||'')){const l=$('#tdxLbl');Prices.lookup(c.name,(window.scanLang||'DE').toLowerCase(),null,c.number).then(r=>{if(l&&r&&r.best)l.textContent='TCGdex: '+r.label}).catch(()=>{})}}
$('#manualBtn').onclick=()=>addDialog(null,'coll');$('#sealedBtn').onclick=()=>addDialog(null,'coll',true);

// Detail / Preisguide
const GRADE={'PSA 10':[3.5,'grobe Schätzung'],'PSA 9':[1.6,''],'CGC 10':[2.5,''],'BGS 9.5':[2,'']};
// Sprach-Flaggen im Detail: tauscht nur img.src (kompatibel mit Tilt/Holo)
async function langFlags(f,{name,number,lang,tid}){const box=f.querySelector('#lfl'),im=f.querySelector('.dcard img');if(!box||!im||!window.Prices)return;
 const L=[['de','🇩🇪'],['en','🇬🇧'],['ja','🇯🇵']],own=({DE:'de',EN:'en',JP:'ja',JA:'ja'})[(lang||'').toUpperCase()]||null;
 box.innerHTML=L.map(([l,e])=>`<button type="button" class="chip" data-l="${l}" disabled style="opacity:.3;font-size:1.2rem;padding:.15rem .5rem">${e}</button>`).join('');
 const num=String(number||'').split('/')[0]||null;let id=tid;
 if(!id){const nm=(name||'').replace(/\s*\(.*\)\s*$/,'').trim();for(const lg of [...new Set([own||'en','en','de','ja'])]){try{const r=await Prices.lookup(nm,lg,null,num);id=r&&r.id}catch(e){}if(id)break}}
 if(!id||!box.isConnected)return;const imgs={},recs={};
 await Promise.all(L.map(async([l])=>{try{const r=await Prices.byId(id,l);if(r&&r.image){imgs[l]=r.image;recs[l]=r}}catch(e){}}));
 const mark=a=>box.querySelectorAll('button').forEach(b=>{const ok=!!imgs[b.dataset.l];b.disabled=!ok;b.style.opacity=ok?(b.dataset.l===a?'1':'.55'):'.2';b.style.outline=b.dataset.l===a?'2px solid #a78bfa':'none'});
 const CML={de:3,en:1},cmOf=r=>r&&r.prices&&r.prices.find(p=>/^Cardmarket \(TCGdex/.test(p.source));
 const showP=l=>{const pe=f.querySelector('#lflP');if(!pe)return;const r=recs[l],cm=cmOf(r),cd=cmOf(recs.de),ce=cmOf(recs.en);
  if(!r||!r.best){pe.textContent=`${l.toUpperCase()}: kein Preis bei TCGdex`;return}
  const shared=l!=='ja'&&cm&&cm.idProduct&&cd&&ce&&cd.idProduct===ce.idProduct;
  if(shared){const u=cm.url?cm.url+'&language='+CML[l]:null;pe.innerHTML=`Cardmarket: ${esc(money(cm.eur))} · gilt für alle Sprachen (Sprachfilter auf Cardmarket)${u?` · <a href="${esc(u)}" target="_blank" rel="noopener" class="plink">${l.toUpperCase()}-Angebote ↗</a>`:''}`}
  else pe.textContent=`${l.toUpperCase()}: ${r.label}`};
 const set=l=>{if(!imgs[l])return;im.src=imgs[l];mark(l);showP(l)};
 box.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.preventDefault();set(b.dataset.l)});
 if(own&&imgs[own])set(own);else mark(null)}
function detail({api:c,item,list}){if(c&&!c._tdx&&!c._syd&&window.Prices){c._syd=1;Promise.race([cmSync(c),new Promise(r=>setTimeout(r,3000))]).finally(()=>detail({api:c,item,list}));return}const f=$('#dlgForm');const it=item||{};const ci=c?cmInfo(c):it.cm;const price=item?item.price:(cmPrice(c)??(c._tdx&&c._tdx.best?c._tdx.best.eur:null));
 const img=safeImg(c?c.images.large||c.images.small:(it.img||'').replace('/small','/large'));const name=c?c.name:it.name;
 const rows=ci?[['Trend',ci.trend],['Ø 1 Tag',ci.avg1],['Ø 7 Tage',ci.avg7],['Ø 30 Tage',ci.avg30],['Ab-Preis',ci.low],['Ø Verkauf',ci.sell]].filter(r=>r[1]!=null):[];
 const raw=price||0;
 const ty=((c?c.types:it.types)||[])[0];f.innerHTML=`<div class="detail" data-type="${esc((ty||'none').toLowerCase())}">${img?`<div class="dcard tiltable"><img src="${esc(img)}" alt=""><i class="holo"></i></div><div class="langFlags" id="lfl" style="display:flex;gap:.4rem;justify-content:center;margin:.35rem 0"></div>${it.imgEn?'<p class="imgnote" style="text-align:center">Bild: englische Version</p>':''}<p class="muted small" id="lflP" style="text-align:center;margin:0"></p>${c&&c._tdx&&c._tdx._imgEn?'<p class="imgnote" style="text-align:center">Bild: englische Version (kein deutsches Bild verfügbar)</p>':''}<button type="button" class="chip gyroBtn" onclick="FX.gyro()" title="Karte neigt sich mit deinem Handy">📱 Bewegungssensor</button><p class="muted small" style="text-align:center;margin:.2rem 0 0">Karte neigt sich mit deinem Handy</p>`:`<div class="dph">${phCard(name,c?c.number:it.number)}</div>`}<h3>${esc(name)}</h3><p class="muted small">${esc(c?c.set.name:it.set)} ${esc(c?c.number:it.number)}${item?` · ${esc(it.lang)} · ${esc(it.cond)} · ${it.qty}×`:''}</p>
 ${price!=null&&!isNaN(price)?`<div class="big" style="font-size:1.8rem">${money(price)}</div><div class="psrcw">${pSrc(item?(it.estimate?'Schätzung':it.ownPrice!=null?'eigen':(it.tdx&&it.tdx.src)||''):(c&&c._tdx&&c._tdx.best&&!cmPrice(c)?c._tdx.best.source:(c&&cmFix(c).fixed?'Ø 7':'')))}</div>${c&&cmFix(c).fixed?`<p class="small" style="color:#fbbf24;margin:.1rem 0">⚠️ Trend (${money(c.cardmarket.prices.trendPrice)}) unplausibel – zeige ${cmFix(c).fixed}</p>`:''}`:`<div class="big" style="font-size:1.8rem">–</div><p class="muted small" style="margin:.2rem 0">Noch kein Preis · <a class="plink" href="https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(name)}" target="_blank" rel="noopener">auf Cardmarket ansehen ↗</a></p>`}${(()=>{const n=String((c?c.number:it.number)||'');const tot=c&&c.set&&c.set.printedTotal;const cn=window.Prices&&Prices.clsNum?Prices.clsNum(c?c.id:it.apiId):null,ccl=/^(cel25c|me55c)-/.test((c?c.id:it.apiId)||'');const nn=cn||(n.includes('/')||!tot||ccl?n:n+'/'+tot);const q=['Pokemon',name,nn,c?c.set.name:it.set].filter(Boolean).join(' ');
 const cmu=(ci&&ci.url)||(it.tdx&&it.tdx.url&&/cardmarket/.test(it.tdx.url)?it.tdx.url:null)||`https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(name.replace(/\s*\(.*\)\s*$/,'')+(cn?' '+cn:''))}`;
 const cmv=(ci&&ci.trend)||(item&&it.tdx&&/Cardmarket/.test(it.tdx.src||'')?it.price:null),jpv=(c&&c._tdx&&c._tdx.jpMarket)||(item&&it.tdx&&/JP-Markt/.test(it.tdx.src||'')?{eur:it.price,value:null}:null);
 return `<div class="pcmp"><div><span class="muted small">Cardmarket</span><b>${cmv!=null?money(cmv):'–'}</b><a class="plink" href="${esc(cmu)}" target="_blank" rel="noopener">Cardmarket ↗</a></div><div><span class="muted small">eBay (verkauft)</span><b>–</b><span class="muted small">kein eBay-Preis verfügbar</span><a class="plink" href="https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">eBay ↗</a></div>${jpv?`<div><span class="muted small">JP-Markt</span><b>${money(jpv.eur)}</b><span class="muted small">${jpv.value?'¥'+jpv.value.toLocaleString('de-DE')+' · ':''}pokeca-souba</span></div>`:''}</div>`})()}${item?`<div class="${cls(itemChange(it,S.settings.tf))}">${pct(itemChange(it,S.settings.tf))||'Noch keine Änderung'}</div>`:''}
 <h3>Preisguide (Cardmarket)</h3><table class="ptable">${rows.map(r=>`<tr><td>${r[0]}</td><td>${money(r[1])}</td></tr>`).join('')||'<tr><td colspan=2 class="muted">Keine Cardmarket-Daten in dieser Quelle (siehe TCGdex-Zeile unten)</td></tr>'}</table>
 ${raw?`<h3>Graded (Schätzung)</h3><table class="ptable">${Object.entries(GRADE).map(([g,[k]])=>`<tr><td>${g}</td><td>≈ ${money(raw*k)}</td></tr>`).join('')}</table><p class="muted small">Faktor-Schätzung auf Raw-Preis, keine echten Graded-Verkäufe/Pop-Reports.</p>`:''}
 ${item&&it.buy?`<p>Einstand ${money(it.buy*it.qty)} · <span class="${cls(raw-it.buy)}">${raw-it.buy>=0?'+':''}${money((raw-it.buy)*it.qty)}</span></p>`:''}
 ${it.tdx?`<p class="muted small">Preis: ${esc(it.tdx.label)}${it.tdx.url?` · <a href="${esc(it.tdx.url)}" target="_blank" rel="noopener" class="plink">Cardmarket ↗</a>`:''}</p>`:''}<p class="muted small" id="tdxDet"></p>${it.note?`<p class="muted small">${esc(it.note)}</p>`:''}${it.priceNote?`<p class="small" style="color:#fbbf24">⚠️ ${esc(it.priceNote)}</p>`:''}${ci&&ci.url?`<p><a href="${ci.url}" target="_blank" rel="noopener" class="plink">Auf Cardmarket ansehen ↗</a></p>`:''}</div>
 <div class="row">${item?(list!=='wishlist'?'<button value="buy">Kaufpreis</button>':'')+(it.price==null||it.estimate?'<button value="est">Wert schätzen</button>':'')+'<button value="del" class="danger">Entfernen</button>':`<button value="add">+ Sammlung</button><button value="wish">☆ Wunsch</button>`}<button value="cancel">Schließen</button></div>`;
 const dlg=$('#dlg');dlg.returnValue='';dlg.showModal();
 langFlags(f,{name,number:c?c.number:it.number,lang:item?it.lang:(window.scanLang||''),tid:it.tdx&&it.tdx.id});window._first=false;if(c)fedInit(f,c);
 if(window.Prices&&!it.tdx&&(price==null||(item&&it.lang&&it.lang!=='EN'))){const q=item?{...it,ownPrice:null,price:null}:{apiId:c.id,name:c.name,number:c.number,lang:window.scanLang||'EN'};tdxFill(q).then(ok=>{const l=$('#tdxDet');if(ok&&l)l.textContent='TCGdex: '+q.tdx.label})}
 dlg.onclose=()=>{const r=dlg.returnValue;
  if(r==='add')setTimeout(()=>addDialog(c,'coll'));if(r==='wish')setTimeout(()=>addDialog(c,'wish'));
  if(r==='buy')setTimeout(()=>numSheet(it,'buy'));if(r==='est')setTimeout(()=>numSheet(it,'est'));
  if(r==='del'&&confirm('Wirklich entfernen?')){S[list]=S[list].filter(x=>x.uid!==it.uid);save();snapshot();render()}}}

// Preise aktualisieren
// pokemontcg.io kennt nur eigene IDs (klein, z.B. base1-4, sv3pt5-6); TCGdex-only (me*, 30th*, JP mit Großbuchstaben, jp:) nicht abfragen. Fehler (auch CORS/Netz) 6 h merken.
const PTNEGK='ka_ptneg',PTNEGT=6*3600e3;const ptNeg=()=>{try{return JSON.parse(localStorage.getItem(PTNEGK)||'{}')}catch(e){return{}}};
const ptNegSet=ids=>{try{const n=ptNeg(),t=Date.now();ids.forEach(i=>n[i]=t);for(const k in n)if(t-n[k]>PTNEGT)delete n[k];localStorage.setItem(PTNEGK,JSON.stringify(n))}catch(e){}};
const ptcgOk=id=>{id=String(id||'');const m=id.match(/^([a-z0-9]+)-([a-z0-9]+)$/i);if(!m||/[A-Z]/.test(m[1]))return false;return !/^(me\d|30th)/.test(m[1])};
async function refreshPrices(){const btn=$('#refresh');btn.textContent='…';const items=[...S.collection,...S.wishlist].filter(x=>x.apiId);
 const NG=ptNeg(),ids=[...new Set(items.map(x=>x.apiId))].filter(id=>ptcgOk(id)&&!(NG[id]&&Date.now()-NG[id]<PTNEGT));
 for(let i=0;i<ids.length;i+=20){const chunk=ids.slice(i,i+20);
  try{const d=await api(`${API}/cards?q=${encodeURIComponent(chunk.map(id=>'id:'+id).join(' OR '))}&select=id,cardmarket,types`,2);const got=new Set((d.data||[]).map(c=>c.id));ptNegSet(chunk.filter(id=>!got.has(id)));
   for(const c of d.data||[]){const p=cmPrice(c);items.filter(x=>x.apiId===c.id).forEach(x=>{x.cm=cmInfo(c);if(c.types)x.types=c.types;if(p!=null&&x.ownPrice==null){x.price=p;delete x.estimate}})}}catch(e){ptNegSet(chunk);console.warn('pokemontcg.io',e.message)}}
 await Promise.all(items.map(async x=>{const c={id:x.apiId};if(await cmSync(c)){x.cm=cmInfo(c);const p=cmPrice(c);if(p!=null&&x.ownPrice==null){x.price=p;delete x.estimate}}}));
 for(const x of [...S.collection,...S.wishlist])if(x.type!=='sealed'&&tdxNeed(x))await tdxFill(x);
 S.collection.forEach(trackPrice);btn.textContent='⟳';window._pLoad=false;save();snapshot();render()}
$('#refresh').onclick=refreshPrices;

// Gewinn/Verlust nur für Karten mit Kaufpreis (>0); ohne Kaufpreis zählt nur der Wert
function totals(){let v=0,b=0,n=0,vb=0,nb=0;for(const c of S.collection){const w=(c.price||0)*c.qty;v+=w;n+=c.qty;if(c.buy>0){b+=c.buy*c.qty;vb+=w;nb+=c.qty}}return{v,b,n,g:vb-b,vb,nb}}
function snapshot(){const d=today();const t=totals();S.snapshots=S.snapshots.filter(s=>s.d!==d);S.snapshots.push({d,v:+t.v.toFixed(2)});S.snapshots.sort((a,b)=>a.d.localeCompare(b.d));save()}

// Keine Bilder von riskanten Hosts (Rechteinhaber/Marktplätze/Fanseiten) – stattdessen Platzhalter mit Name + Nummer
const BADIMG=/^https?:\/\/([^/]*\.)?(pokemon-card\.com|snkrdunk\.com|tcgplayer\.com|serebii\.net|pokeca\.net)\//i;const safeImg=u=>u&&!BADIMG.test(u)?u:'';
const phCard=(name,num)=>`<div class="cardph" role="img" aria-label="${esc(name||'Karte')}: kein Bild"><b>${esc(String(name||'').replace(/^✓\s*/,'').replace(/^#\S+\s+/,''))}</b>${num?`<span>Nr. ${esc(num)}</span>`:''}<small>kein Bild</small></div>`;
function tile({img,name,sub,price,chg,badge,qty,hit,type,src}){img=safeImg(img);const num=img?'':(String(sub||'').split('·').map(x=>x.trim()).filter((x,i,a)=>i>0||a.length===1).reverse().map(x=>(x.match(/^#?([A-Za-z]{0,4}-?\d{1,4}[a-z]?(?:\/[A-Za-z]{0,4}\d+)?)$/)||[])[1]).find(Boolean)||'');const el=document.createElement('div');el.className='tile'+(hit?' hit':'');el.dataset.type=(type||'none').toLowerCase();
 el.innerHTML=`<div class="im" style="${img?`background-image:url('${esc(img)}')`:''}">${img?'':phCard(name,num)}<i class="holo"></i></div>${badge?`<span class="badge">${esc(badge)}</span>`:''}${qty>1?`<span class="qty">${qty}×</span>`:''}
 <div class="n">${esc(name)}</div><div class="s">${esc(sub)}</div><div class="p"><b>${money(price)}</b><span class="${cls(chg)}">${pct(chg)}</span></div>${price!=null?`<div class="tsrc">${esc(priceInfo(src)[0])}</div>`:''}`;
 if(img&&/assets\.tcgdex\.net\//.test(img))imgTry(img).then(u=>{if(u===img)return;const im=el.querySelector('.im');if(!im)return;if(u){im.style.backgroundImage=`url('${u}')`;if(tdxIsEn(u,img)&&!el.querySelector('.imgnote'))im.insertAdjacentHTML('afterend','<div class="imgnote">Bild: englische Version</div>')}else{im.style.backgroundImage='';const n2=(String(sub||'').match(/(\d{1,4}[a-z]?(?:\/\d+)?)/)||[])[1]||'';im.insertAdjacentHTML('afterbegin',phCard(name,n2));setTimeout(()=>{if(!el.isConnected)return;imgForget(img);imgTry(img).then(u2=>{if(!u2)return;im.style.backgroundImage=`url('${u2}')`;const sv=im.querySelector('svg');sv&&sv.remove();if(tdxIsEn(u2,img)&&!el.querySelector('.imgnote'))im.insertAdjacentHTML('afterend','<div class="imgnote">Bild: englische Version</div>')})},20000)}});return el}
// TCGdex-Bild robust: Original -> Nummer ohne führende Null -> englische Version derselben Karte
function tdxCands(u){const out=[u];const m=String(u).match(/^(https:\/\/assets\.tcgdex\.net\/)([a-z-]+)(\/[^/]+\/[^/]+\/)([^/.]+)(\/[a-z]+\.(?:webp|png|jpg))?$/i);if(!m)return out;const [,h,lg,mid,id,suf='']=m,id2=/^0+\d/.test(id)?id.replace(/^0+(?=\d)/,''):id;
 if(id2!==id)out.push(h+lg+mid+id2+suf);if(lg!=='en'&&lg!=='ja'){out.push(h+'en'+mid+id+suf);if(id2!==id)out.push(h+'en'+mid+id2+suf)}
 if(lg!=='ja'){const set=mid.split('/').filter(Boolean)[1];if(set&&/^[a-z0-9]+$/i.test(set))out.push(`https://images.pokemontcg.io/${set}/${id2}${/high/.test(suf)?'_hires':''}.png`)}return out}
const tdxIsEn=(u,orig)=>(/assets\.tcgdex\.net\/en\//.test(u)||/images\.pokemontcg\.io\//.test(u))&&!/assets\.tcgdex\.net\/en\//.test(orig);
const IMGOK=new Map();function imgProbe(u){if(IMGOK.has(u))return IMGOK.get(u);const p=new Promise(r=>{const i=new Image();i.onload=()=>r(true);i.onerror=()=>r(false);i.src=imgFull(u)});IMGOK.set(u,p);return p}
const imgFull=u=>/\/(low|high)\.webp$|\.(png|jpg)$/.test(u)?u:u+'/low.webp';async function imgTry(u){for(const c of tdxCands(u))if(await imgProbe(c))return c===u?u:imgFull(c);return ''}
// getSetCards(setId, lang) -> Promise<[{id,localId,name,image}]> (für Set-Binder). Nie reject: bei Fehler [].
(function(){const MEM=new Map(),NEGK='ka_setneg',LSK='ka_setc:',TTL=7*24*3600e3,NTTL=6*3600e3;
 const nl=l=>{l=String(l||'de').toLowerCase();if(l==='jp')l='ja';return ['de','en','ja'].includes(l)?l:'en'};
 const langOk=(s,l)=>{const up=/[A-Z]/.test(s);return l==='ja'?(up||/^(neo[1-4]|web1|sm2\+)$/.test(s)):(!up||/^(P-A|A\d|B\d)/.test(s))};
 const neg=()=>{try{return JSON.parse(localStorage.getItem(NEGK)||'{}')}catch(e){return{}}};
 const negSet=k=>{try{const n=neg();n[k]=Date.now();for(const x in n)if(Date.now()-n[x]>NTTL)delete n[x];localStorage.setItem(NEGK,JSON.stringify(n))}catch(e){}};
 const isNeg=k=>{const t=neg()[k];return t&&Date.now()-t<NTTL};
 async function tdxSet(l,s){const k=l+':'+s;if(isNeg(k))return null;try{const r=await fetch(`https://api.tcgdex.net/v2/${l}/sets/${encodeURIComponent(s)}`,{signal:AbortSignal.timeout(10000)});if(r.status===404){negSet(k);return null}if(!r.ok)return null;const j=await r.json();if(!j||!j.cards||!j.cards.length){negSet(k);return null}return j}catch(e){return null}}
 const nz=x=>String(x||'').replace(/^0+(?=\d)/,'').toLowerCase();
 const numKey=x=>{const m=String(x).match(/\d+/);return m?+m[0]:1e9};
 async function load(setId,lang){const s=String(setId||'').trim();if(!s||!langOk(s,lang))return [];
  const j=await tdxSet(lang,s);if(!j)return [];let en=null,enTried=false;
  const out=[];for(const c of j.cards){let img=c.image?imgFull(c.image):null;
   if(!img&&lang!=='en'&&lang!=='ja'){if(!enTried){enTried=true;en=await tdxSet('en',s)}const e=en&&en.cards.find(x=>nz(x.localId)===nz(c.localId));if(e&&e.image)img=imgFull(e.image)}
   if(!img&&lang!=='ja'&&/^[a-z0-9]+$/i.test(s)){const u=`https://images.pokemontcg.io/${s}/${nz(c.localId)}.png`;if(await imgProbe(u))img=u}
   img=safeImg(img)||null;const fb=img?[...new Set(tdxCands(img.replace(/\/(low|high)\.webp$/,'')).map(imgFull))].filter(u=>u!==img&&safeImg(u)):[];out.push({id:c.id,localId:String(c.localId??''),name:c.name||'',image:img,fallbacks:fb})}
  out.sort((a,b)=>numKey(a.localId)-numKey(b.localId)||a.localId.localeCompare(b.localId,undefined,{numeric:true}));return out}
 // searchSets(query, lang?) -> Promise<[{id,name,lang,total}]>, getSetInfo(setId, lang) -> Promise<{id,name,total}|null>. Nie reject.
(function(){const SL={},TT=7*24*3600e3,K='ka_sets3:';let JPEN=null;
 const nl=l=>{l=String(l||'').toLowerCase();if(l==='jp')l='ja';return ['de','en','ja'].includes(l)?l:''};
 const fold=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 function list(l){if(SL[l])return SL[l];SL[l]=(async()=>{try{const c=JSON.parse(localStorage.getItem(K+l)||'null');if(c&&Date.now()-c.t<TT&&c.v.length)return c.v}catch(e){}
  try{const r=await fetch(`https://api.tcgdex.net/v2/${l}/sets`,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw 0;const d=await r.json();const v=(d||[]).map(s=>({id:s.id,name:s.name||s.id,lang:l,total:(s.cardCount&&Math.max(s.cardCount.official||0,s.cardCount.total||0))||null}));if(v.length)try{localStorage.setItem(K+l,JSON.stringify({t:Date.now(),v}))}catch(e){}return v}catch(e){delete SL[l];return []}})();return SL[l]}
 let JPN=null,JPP=null;function jpEn(){return JPP||(JPP=(async()=>{try{const j=await (await fetch('jpcards.json',{signal:AbortSignal.timeout(8000)})).json();JPEN=j&&j.sets||{}}catch(e){JPEN={}}try{const j=await (await fetch('jpsetnames.json?v=95',{signal:AbortSignal.timeout(8000)})).json();JPN=j&&j.sets||{};for(const k in JPN)JPEN[k]=JPN[k].en}catch(e){JPN=JPN||{}}return JPEN})())}
 const jpRec=id=>{if(!JPN)return null;if(JPN[id])return JPN[id];const k=Object.keys(JPN).find(x=>x.toLowerCase()===String(id).toLowerCase());return k?JPN[k]:null};
 window.searchSets=async function(q,lang){try{const L=nl(lang),langs=[...new Set([L,'de','en','ja'].filter(Boolean))],fq=fold(q);if(!fq)return [];const en=await jpEn();const out=[];
  for(const l of langs){for(const s of await list(l)){const alt=l==='ja'&&en[s.id]&&en[s.id]!==s.id?en[s.id]:'';const id=s.id.toLowerCase(),ql=String(q).trim().toLowerCase();
   const jr=l==='ja'&&jpRec(s.id),jn=jr?jr.ja:s.name;const nm=jn;const sc=id===ql?0:fold(jn)===fq||fold(alt)===fq?1:id.startsWith(ql)?2:fold(jn).startsWith(fq)||fold(alt).startsWith(fq)?3:(fold(jn).includes(fq)||fold(alt).includes(fq)||fold(id).includes(fq))?4:-1;
   if(sc>=0)out.push({sc,r:jr?{id:s.id,name:jr.en,nameJa:jn,lang:l,total:s.total}:{id:s.id,name:alt&&!fold(s.name).includes(fq)?`${s.name} (${alt})`:s.name,lang:l,total:s.total}})}}
  return out.sort((a,b)=>a.sc-b.sc||(a.r.lang===L?0:1)-(b.r.lang===L?0:1)).map(x=>x.r).slice(0,50)}catch(e){return []}};
 window.getSetInfo=async function(setId,lang){try{let id=String(setId||'');await jpEn();for(const l of [...new Set([nl(lang)||'en','en','de','ja'])]){const L=await list(l);const s=L.find(x=>x.id===id)||(l==='ja'&&L.find(x=>x.id.toLowerCase()===id.toLowerCase()&&jpRec(x.id)));if(s){const jr=l==='ja'&&jpRec(s.id);return jr?{id:s.id,name:jr.en,nameJa:jr.ja,total:s.total}:{id:s.id,name:s.name,total:s.total}}}
  const r=await fetch(`https://api.tcgdex.net/v2/${nl(lang)||'en'}/sets/${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(10000)});if(!r.ok)return null;const j=await r.json();if(!j||!j.id)return null;const jr=jpRec(j.id);const t=(j.cardCount&&Math.max(j.cardCount.official||0,j.cardCount.total||0))||null;return jr?{id:j.id,name:jr.en,nameJa:jr.ja,total:t}:{id:j.id,name:j.name||j.id,total:t}}catch(e){return null}}})();
 window.attachImgFallback=function(im,card){if(!im||!card)return im;const key=(card.id||'')+'|'+(card.image||'');if(im._kaFb&&im._kaFb.key===key)return im;if(im._kaFb){const o=im._kaFb;im.removeEventListener('error',o.h);im.removeEventListener('load',o.ok);clearTimeout(o.t);clearTimeout(o.rt);o.ph&&o.ph.remove();im.style.display=''}
  const L=[card.image,...(card.fallbacks||[])].filter(u=>u&&safeImg(u)),TO=6000;const st={key,i:Math.max(0,L.indexOf(im.getAttribute('src'))),retried:false,ph:null,t:0,rt:0};
  const showPh=()=>{if(st.ph)return;const d=document.createElement('div');d.className='phthumb phbox';d.dataset.kaPh='1';d.innerHTML=phCard(card.name,card.localId);st.ph=d;if(im.parentNode)im.before(d);im.style.display='none'};
  const arm=()=>{clearTimeout(st.t);st.t=setTimeout(()=>{if(!im.complete||!im.naturalWidth)st.h()},TO)};
  const set=u=>{im.src=u;arm()};
  st.ok=()=>{clearTimeout(st.t);if(im.naturalWidth){if(st.ph){st.ph.remove();st.ph=null}im.style.display=''}};
  const retry=()=>{st.rt=setTimeout(async()=>{if(!im.isConnected&&!(st.ph&&st.ph.isConnected))return;for(const u of L){const ok=await new Promise(r=>{const x=new Image(),t=setTimeout(()=>{x.src='';r(false)},TO);x.onload=()=>{clearTimeout(t);r(!!x.naturalWidth)};x.onerror=()=>{clearTimeout(t);r(false)};x.src=u});if(ok){st.i=L.indexOf(u);im.src=u;return}}},20000)};
  st.h=()=>{clearTimeout(st.t);if(st.ph)return;st.i++;if(st.i<L.length){set(L[st.i]);return}showPh();if(!st.retried){st.retried=true;retry()}};
  im._kaFb=st;im.addEventListener('error',st.h);im.addEventListener('load',st.ok);
  if(!L.length)showPh();else if(!im.getAttribute('src'))set(L[0]);else if(im.complete&&im.naturalWidth===0)st.h();else if(!im.complete)arm();return im};
 window.getSetCards=function(setId,lang){lang=nl(lang);const k=lang+':'+setId;if(MEM.has(k))return MEM.get(k);
  try{const c=JSON.parse(localStorage.getItem(LSK+k)||'null');if(c&&Date.now()-c.t<TTL&&c.v.length){const p=Promise.resolve(c.v);MEM.set(k,p);return p}}catch(e){}
  const p=load(setId,lang).catch(()=>[]).then(v=>{if(v.length){try{localStorage.setItem(LSK+k,JSON.stringify({t:Date.now(),v}))}catch(e){}}else MEM.delete(k);return v});MEM.set(k,p);return p}})();
const imgForget=u=>tdxCands(u).forEach(c=>IMGOK.delete(c));
// <img>-Fehler (Detail, Thumbs): nächste TCGdex-Variante versuchen, bevor der Platzhalter kommt
function tdxNext(im){const cs=im.getAttribute('src')||'';if(im.dataset.tdxo&&im.dataset.tdxs&&cs!==im.dataset.tdxs){delete im.dataset.tdxo;im.dataset.tdxi=0;delete im.dataset.tdxr}const o=im.dataset.tdxo||cs;if(!/assets\.tcgdex\.net\//.test(o))return false;im.dataset.tdxo=o;const L=tdxCands(o),i=+(im.dataset.tdxi||0)+1;if(i>=L.length){if(!im.dataset.tdxr){im.dataset.tdxr=1;setTimeout(()=>{if(im.isConnected){im.dataset.tdxi=0;im.style.visibility='';im.dataset.tdxs=o;im.src=o}},20000);if(!im.hasAttribute('onerror'))im.style.visibility='hidden';return true}if(!im.hasAttribute('onerror')){const d=document.createElement('div');d.className='dph phbox';d.innerHTML=phCard(im.dataset.phn||'',im.dataset.phnum||'');im.replaceWith(d);return true}return false}im.dataset.tdxi=i;im.dataset.tdxs=L[i];im.src=L[i];if(tdxIsEn(L[i],o)&&!(im.parentElement&&im.parentElement.querySelector('.imgnote')))im.insertAdjacentHTML('afterend','<div class="imgnote">Bild: englische Version</div>');return true}
document.addEventListener('error',e=>{const t=e.target;if(t&&t.tagName==='IMG'&&!t.hasAttribute('onerror'))tdxNext(t)},true);

function render(){{const real=S.collection,es=$('#emptyStart');if(es){es.hidden=real.length>0;const ch=$('#chart'),tf=$('#tf');if(ch)ch.style.display=real.length?'':'none';if(tf)tf.style.display=real.length?'':'none'}}const t=totals();const tf=S.settings.tf;$('#tfLbl').textContent=({1:'1T',7:'7T',30:'30T',90:'3M',365:'1J',0:'Alle'})[tf];
 if(window._pLoad&&S.collection.length){$('#sumVal').textContent='Preise laden…';$('#sumVal').classList.add('loading')}else{$('#sumVal').classList.remove('loading');window.FX?FX.count($('#sumVal'),t.v):($('#sumVal').textContent=money(t.v))}$('#sumBuy').textContent=t.nb?money(t.b):'–';{const lb=t.nb?` (${t.nb} von ${t.n} Karten mit Kaufpreis)`:' (noch kein Kaufpreis)';const a=$('#sumBuyL'),b2=$('#sumGainL');if(a)a.textContent='Einstand'+lb;if(b2)b2.textContent='Gewinn/Verlust'+lb}const g=$('#sumGain');g.textContent=window._pLoad?'…':!t.nb?'–':(t.g>=0?'+':'')+money(t.g);g.className=window._pLoad||!t.nb?'':cls(t.g);$('#sumCnt').textContent=t.n;
 const pts=series(tf);const ch=pts.length>=2?pts.at(-1).v-pts[0].v:0;const chp=pts.length>=2&&pts[0].v?ch/pts[0].v*100:0;
 const sc=$('#sumChg');sc.className='chg '+cls(ch);sc.textContent=`${ch>=0?'▲ +':'▼ '}${money(Math.abs(ch))} (${chp.toFixed(1).replace('.',',')} %)`;if(window._pLoad){sc.textContent='…';sc.className='chg'}
 const C=S.collection.map(c=>({c,ch:itemChange(c,tf)}));
 const mk=(x,list)=>{const c=x.c;const el=tile({src:c.estimate?'Schätzung':c.ownPrice!=null?'eigen':(c.tdx&&c.tdx.src)||'',type:c.types&&c.types[0],img:c.img,name:c.name,sub:`${c.set||''} ${c.number||''} · ${c.lang}`,price:c.price,chg:x.ch,badge:c.type==='sealed'?'SEALED':/PSA|CGC|BGS|Graded/.test(c.cond)?c.cond:c.lang==='JP'?'JP':'',qty:c.qty});el.onclick=()=>detail({item:c,list});if(!c.img&&(c.tdxId||c.apiId)&&!c._imgTry){c._imgTry=1;const lg0=String(c.lang||'de').toLowerCase(),id0=c.tdxId||c.apiId;Prices.byId(id0,lg0).then(async x=>{let en=false;if(!(x&&x.image)&&lg0!=='en'&&!String(id0).startsWith('jp:')){x=await Prices.byId(id0,'en').catch(()=>null);en=true}if(x&&x.image){c.img=x.image;if(en)c.imgEn=true;delete c._imgTry;save();const im=el.querySelector('.im');if(im){im.style.backgroundImage=`url('${x.image}')`;const sv=im.querySelector('svg');sv&&sv.remove();if(en&&!el.querySelector('.imgnote'))im.insertAdjacentHTML('afterend','<div class="imgnote">Bild: englische Version</div>')}}}).catch(()=>{})}if(c.imgEn&&!el.querySelector('.imgnote')){const im=el.querySelector('.im');im&&im.insertAdjacentHTML('afterend','<div class="imgnote">Bild: englische Version</div>')}return el};
 const top=$('#topList');top.innerHTML='';{const G=new Map();for(const x of C){const c=x.c,k=[c.tdxId||c.apiId||'',c.name,c.set,c.number,c.lang,c.cond||'',c.variant||''].join('|');const e=G.get(k);if(e){e.n+=c.qty||1}else G.set(k,{x,n:c.qty||1})}
 [...G.values()].sort((a,b)=>(b.x.c.price||0)-(a.x.c.price||0)).slice(0,8).forEach(({x,n})=>{const el=mk(x,'collection');if(n>1){el.querySelector('.qty')?.remove();el.insertAdjacentHTML('beforeend',`<span class="qty">×${n}</span>`)}top.append(el)})}
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
function detectLang(t){const kn=(t.match(/[\u3040-\u30ff]/g)||[]).length;if(kn>=3&&!(detectLatin(t)>=2))return'JP';t=kn?t.replace(/[\u3040-\u30ff]/g,' '):t;if(/[\uac00-\ud7af]/.test(t))return'KR';if(/[\u4e00-\u9fff]/.test(t))return'CN';
 const T=t.toLowerCase(),k={DE:/preiskarte|dein gegner|dieses pok[ée]mon|kampfunf[aä]hig|\bwirf eine m|schw[aä]che|r[uü]ckzug|resistenz|f[aä]higkeit|entwickelt|basis-pok|\bkp\b|angriff|illustr|verhindere|w[aä]hrend|m[uü]nze|schaden|\bwirf|gegner|n[aä]chsten|\bbasis\b/g,EN:/weakness|retreat( cost)?|\bresistance\b|ability|evolves|basic pok|\bhp\b|damage|pok[ée]mon power|illus\.|illus\b(?!tr)|\bstage ?[12]\b|\bbasic\b|your opponent|\bopponent\b|prize cards?|\battach|this pok[ée]mon|\bflip a coin|knocked out|\brule\b/g,FR:/faiblesse|retraite|r[ée]sistance|talent|[ée]volue|\bpv\b|d[ée]g[aâ]ts|pok[ée]mon de base/g,IT:/debolezza|ritirata|resistenza|abilit|\bps\b|si evolve/g,ES:/debilidad|retirada|resistencia|habilidad|evoluciona/g,PT:/fraqueza|recuo|habilidade|evolui/g};
 // Treffer zählen; 'resistance' zählt nicht für FR (nur mit Akzent oder weiteren FR-Wörtern)
 const sc={};for(const[l,r]of Object.entries(k))sc[l]=(T.match(r)||[]).length;sc.FR-=(T.match(/\bresistance\b/g)||[]).length;
 let best='',bv=0;for(const l of ['DE','EN','FR','IT','ES','PT'])if(sc[l]>bv){bv=sc[l];best=l}return best}
function applyScan(r,lang){window.scanLang=lang||'';window.pendingScan={name:r.name,jp:r.jp,number:r.full||r.number,set:r.set,lang};$('#scanStatus').textContent=`Scan erkannt: ${r.name||'?'} ${r.number?'· Nr. '+r.number:''}${lang?' · Sprache '+lang:''}`;
 $('#qName').value=r.name||'';$('#qNum').value=r.energy?'':(r.number||'');go('v-search');search(r.name,r.energy?'':r.number,'','');scanBoxPrice(r,lang);nextScanBtn()}
// Preis der best passenden Kachel in die 'Karte (XX)'-Box übernehmen (gleicher Wert wie die Kachel)
// v100: Set-Name + Set-Code in der Ergebnis-Box, z. B. '30th Celebration (M6a) · 137/103'
async function scanSetLine(r,lang){const sid=r.setId||r.set||'';if(!sid&&!r.full)return;let nm='',code='';const lg=(lang||'DE').toLowerCase()==='jp'?'ja':(lang||'DE').toLowerCase();
 if(sid&&typeof window.getSetInfo==='function'){try{const i=await window.getSetInfo(sid,lg);if(i&&i.name)nm=i.name}catch(e){}}
 if(!nm&&sid){const s=(typeof SETS!=='undefined'?SETS:[]).find(x=>x.id===sid);if(s)nm=s.name}
 try{for(const k in SETCODES)if(SETCODES[k].tdx===sid){code=k;break}}catch(e){}if(!code&&sid)code=lg==='ja'?sid:(((typeof SETS!=='undefined'?SETS:[]).find(x=>x.id===sid)||{}).ptcgoCode||'');
 const lab=[nm?(nm+(code&&!nm.includes('('+code+')')?` (${code})`:'')):(code||sid),r.full||r.number].filter(Boolean).join(' · ');if(!lab)return;
 for(let i=0;i<40;i++){const box=$('#results .scanpick');if(box){let l=box.querySelector('.scanset');if(!l){l=document.createElement('div');l.className='scanset';box.querySelector('b')?.after(l)}l.textContent='🗂️ '+lab;return}await new Promise(r=>setTimeout(r,150))}}
function scanBoxPrice(r,lang){scanSetLine(r,lang);let n=0;const num=String(r.number||'').replace(/^0+/,''),nm=nrm(r.name),fl={DE:'🇩🇪',EN:'🇬🇧',JP:'🇯🇵'}[lang]||'';clearInterval(window._sbp);window._sbp=setInterval(()=>{if(++n>400)return clearInterval(window._sbp);const R=$('#results');const box=R&&R.querySelector('.scanpick b');if(!box)return;
 const T=[...R.querySelectorAll('.tile')].map(t=>{const pb=t.querySelector('.p b'),txt=t.innerText||'';const pr=pb&&/\d.*€|€.*\d|\$\s*\d/.test(pb.textContent)?pb.textContent.trim():'';let s=0;{const tn=nrm(t.querySelector('.n')?.textContent);let alt='';try{alt=nrm(deName(r.name))}catch(e){}if(tn.includes(nm.slice(0,6))||(alt&&tn.includes(alt.slice(0,6))))s+=2}if(num&&new RegExp('(^|\\D)0*'+num+'(\\D|$)').test(t.querySelector('.s')?.textContent||txt))s+=2;let g=t.parentElement;while(g&&g!==R){if(fl&&(g.previousElementSibling?.textContent||'').includes(fl))s+=1;g=g.parentElement}if(fl&&txt.includes(' · '+lang))s+=1;return{pr,s}}).filter(x=>x.pr).sort((a,b)=>b.s-a.s);
 if(T.length&&T[0].s>=4){let sp=box.querySelector('.sbprice');if(!sp){sp=document.createElement('span');sp.className='sbprice';box.append(' ',sp)}const v='· '+T[0].pr;if(sp.textContent!==v)sp.textContent=v}},150)}
const JPN={'ミュウツー':'Mewtwo','ミュウ':'Mew','リザードン':'Charizard','リザード':'Charmeleon','ヒトカゲ':'Charmander','ピカチュウ':'Pikachu','ライチュウ':'Raichu','ピチュー':'Pichu','ゲンガー':'Gengar','ゴースト':'Haunter','ゴース':'Gastly','ブラッキー':'Umbreon','イーブイ':'Eevee','エーフィ':'Espeon','シャワーズ':'Vaporeon','サンダース':'Jolteon','ブースター':'Flareon','リーフィア':'Leafeon','グレイシア':'Glaceon','ニンフィア':'Sylveon','フシギバナ':'Venusaur','フシギダネ':'Bulbasaur','カメックス':'Blastoise','ゼニガメ':'Squirtle','カイリュー':'Dragonite','カビゴン':'Snorlax','ルギア':'Lugia','ホウオウ':'Ho-Oh','レックウザ':'Rayquaza','ルカリオ':'Lucario','ギャラドス':'Gyarados','フーディン':'Alakazam','ピッピ':'Clefairy','プリン':'Jigglypuff','ラプラス':'Lapras','メタモン':'Ditto','サンダー':'Zapdos','ファイヤー':'Moltres','フリーザー':'Articuno','スイクン':'Suicune','セレビィ':'Celebi','ジラーチ':'Jirachi','ダークライ':'Darkrai','アルセウス':'Arceus','ゲッコウガ':'Greninja','ミミッキュ':'Mimikyu','サーナイト':'Gardevoir','ガブリアス':'Garchomp','バンギラス':'Tyranitar','ウインディ':'Arcanine','コダック':'Psyduck','ニャース':'Meowth','ポッチャマ':'Piplup','ヒノアラシ':'Cyndaquil','ワニノコ':'Totodile','チコリータ':'Chikorita','ミロカロス':'Milotic','パルキア':'Palkia','ディアルガ':'Dialga','ギラティナ':'Giratina','ザシアン':'Zacian','テラパゴス':'Terapagos','マリル':'Marill','ヤドン':'Slowpoke','ガルーラ':'Kangaskhan','カイロス':'Pinsir','ストライク':'Scyther','エンテイ':'Entei','ライコウ':'Raikou','グラードン':'Groudon','カイオーガ':'Kyogre'};
const dv=t=>t.normalize('NFD').replace(/[\u3099\u309a]/g,'').normalize('NFC');const JPD={};for(const k in JPN)JPD[dv(k)]=k;const JPK=Object.keys(JPD).sort((a,b)=>b.length-a.length);
let JPALL=null;function jpAll(){if(!JPALL){JPALL=new Map();for(const k in JPN)JPALL.set(dv(k),{jp:k,en:JPN[k]});for(const r of (window.PNAMES||[]))if(r[2]&&!JPALL.has(dv(r[2])))JPALL.set(dv(r[2]),{jp:r[2],en:r[0]})}return JPALL}
function levS(a,b){let p=Array.from({length:b.length+1},(_,j)=>j);for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[b.length]}
function jpName(t){const M=jpAll(),lines=dv(t||'').split(/\n+/).map(l=>l.replace(/[\s・.,…、。:：]/g,'').replace(/[ｰ―‐-]/g,'ー')).filter(l=>/[\u30a0-\u30ff]{2}/.test(l));const C=[];
 for(const[k,v]of M){if(k.length<2)continue;for(const n of lines){let d=9,i=n.indexOf(k);if(i>=0&&n.substr(i+k.length,2)!=='から')d=0;
  else if(k.length>=4&&n.length>=k.length-1){for(let L=k.length-1;L<=k.length+1&&d>1;L++)for(let s=0;s+L<=n.length&&d>1;s++){const sub=n.substr(s,L);if(sub[0]!==k[0]&&sub[1]!==k[1])continue;const dd=levS(sub,k);if(dd<=1&&n.substr(s+L,2)!=='から')d=Math.min(d,dd)}}
  if(d<=1){C.push({k,v,d});break}}}
 if(!C.length)return null;C.sort((x,y)=>x.d-y.d||y.k.length-x.k.length);let b=C[0];
 const ev=C.filter(c=>c!==b&&c.k.length>b.k.length&&c.k.startsWith(b.k.slice(0,Math.max(3,b.k.length-1)))).sort((x,y)=>x.d-y.d||y.k.length-x.k.length)[0];if(ev)b=ev;
 if(b.k.length<=3&&b.d>0)return null;const de=(window.PNAMES||[]).find(r=>r[0]===b.v.en);return{jp:b.v.jp,en:b.v.en,de:de?de[1]:b.v.en}}
const ocrW={};function getW(l){if(!ocrW[l])ocrW[l]=(async()=>{const w=await Tesseract.createWorker(l==='num'||l==='dig'?'eng':l==='nm'?'deu+eng':l);if(l==='nm')try{await w.setParameters({tessedit_pageseg_mode:'11'})}catch(e){}{const R0=w.recognize.bind(w);w.recognize=(im,...x)=>{try{const rc=x[0]&&x[0].rectangle;if((im&&im.width!=null&&(im.width<12||im.height<12))||(rc&&(rc.width<12||rc.height<12)))return Promise.resolve({data:{text:'',confidence:0,words:[]}})}catch(e){}return R0(im,...x)}}
 if(l==='num')await w.setParameters({tessedit_pageseg_mode:'6'});if(l==='dig')await w.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'0123456789/'});return w})();return ocrW[l]}
// Nummer aus hochaufgelöstem Bild: unterer ~12%-Streifen, 3-4x hochskaliert, binarisiert, nur Ziffern (psm 7), mehrere Schwellen
function binC(src,x,y,w,h,scale,th){const W=src.width,H=src.height;const c=document.createElement('canvas');c.width=Math.round(W*w*scale);c.height=Math.round(H*h*scale);
 const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingQuality='high';g.drawImage(src,W*x,H*y,W*w,H*h,0,0,c.width,c.height);
 const im=g.getImageData(0,0,c.width,c.height),d=im.data;for(let i=0;i<d.length;i+=4){const v=Math.max(d[i],d[i+1],d[i+2])<th?0:255;d[i]=d[i+1]=d[i+2]=v}g.putImageData(im,0,0);return c}
// Luminanz-Binarisierung mit adaptiver Schwelle (Perzentil) – für dunkle Schrift auf farbigem Grund
function binL(src,x,y,w,h,scale,pct){const W=src.width,H=src.height;const c=document.createElement('canvas');c.width=Math.round(W*w*scale);c.height=Math.round(H*h*scale);
 const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingQuality='high';g.drawImage(src,W*x,H*y,W*w,H*h,0,0,c.width,c.height);
 const im=g.getImageData(0,0,c.width,c.height),d=im.data,hist=new Uint32Array(256);for(let i=0;i<d.length;i+=4){const L=(d[i]*299+d[i+1]*587+d[i+2]*114)/1000|0;d[i+3]=L;hist[L]++}
 let acc=0,th=100;for(let v=0;v<256;v++){acc+=hist[v];if(acc>d.length/4*pct){th=v+8;break}}for(let i=0;i<d.length;i+=4){const v=d[i+3]<th?0:255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}g.putImageData(im,0,0);return c}
function setWant(s){s=(s||'').trim().toLowerCase();if(!s)return[];const o=new Set([s]);for(const c in SETCODES){const x=SETCODES[c];const ks=[c,x.id,x.tdx,x.name].map(v=>String(v||'').toLowerCase());if(ks.includes(s))ks.forEach(k=>k&&o.add(k))}return[...o]}
// Otsu-Binarisierung, stark hochskaliert (für kleine 'nnn/128'-Nummern unten links)
function binO(src,x,y,w,h,scale,inv){const W=src.width,H=src.height,c=document.createElement('canvas');c.width=Math.round(W*w*scale);c.height=Math.round(H*h*scale);const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingQuality='high';g.filter='grayscale(1) contrast(1.4)';
 g.drawImage(src,W*x,H*y,W*w,H*h,0,0,c.width,c.height);const im=g.getImageData(0,0,c.width,c.height),d=im.data,hi=new Float64Array(256),n=d.length/4;for(let i=0;i<d.length;i+=4)hi[d[i]]++;
 let sum=0;for(let t=0;t<256;t++)sum+=t*hi[t];let sB=0,wB=0,best=0,th=128;for(let t=0;t<256;t++){wB+=hi[t];if(!wB)continue;const wF=n-wB;if(!wF)break;sB+=t*hi[t];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)**2;if(v>best){best=v;th=t}}
 for(let i=0;i<d.length;i+=4){let v=d[i]<th?0:255;if(inv)v=255-v;d[i]=d[i+1]=d[i+2]=v}g.putImageData(im,0,0);return c}
async function readNumberHi2(src,total){const w=await getW('dig');window.hi2Dbg=[];const T=total?String(total):'';
 for(const [x,y,ww,h] of [[0,.9,.36,.1],[.02,.925,.3,.065],[0,.87,.45,.13]])for(const sc of [8,6])for(const inv of [false,true]){
  const k=Math.min(sc,2400/(src.width*ww));const t=((await w.recognize(binO(src,x,y,ww,h,k,inv))).data.text||'').replace(/\s/g,'');window.hi2Dbg.push(t);
  let m=t.match(/(\d{1,3})\/(\d{2,3})/);if(m&&+m[1]>0&&(!T||m[2]===T||numOK(m[1]+'/'+m[2])))return m[1].replace(/^0+(?=\d)/,'')+'/'+(T&&m[2]!==T&&!numOK(m[1]+'/'+m[2])?T:m[2]);
  if(T){m=t.match(new RegExp('(\\d{1,3})[/|1lI7]?'+T+'(?!\\d)'));if(m&&+m[1]>0&&+m[1]<=total*1.6)return m[1].replace(/^0+(?=\d)/,'')+'/'+T}}
 return ''}
const JPSETS={'M6a':103};
async function readNumberBands(src){const w=await getW('num');const re=/(\d{1,3})\s*\/\s*(\d{2,3})/;window.bandDbg=[];
 for(const y of [.80,.72,.84,.76,.88,.92,.68,.64,.60,.56,.52])for(const m of ['dark2','dark']){const t=((await w.recognize(cropC(src,0,y,.55,.08,Math.min(4,2400/(src.width*.55)),m))).data.text||'');window.bandDbg.push(y.toFixed(2)+m+':'+t.replace(/\s+/g,' '));
  const mm=t.match(re);if(mm&&mm[1].length===mm[2].length&&+mm[1]>0&&+mm[1]<=+mm[2]*1.6){const sc=(t.match(/\b([MS][Vv]?\d{1,2}[a-zA-Z]?)\b/)||[])[1]||'';return{num:mm[1].replace(/^0+(?=\d)/,'')+'/'+mm[2],set:sc,text:t}}}
 return null}
async function readNumberHi(src){const w=await getW('dig');const re=/(\d{1,3})\/(\d{2,3})/;window.hiDbg=[];
 const sc0=Math.max(3,Math.min(5,1400/(src.width*.4)));
 for(const pct of [.12,.2]){const t=((await w.recognize(binL(src,.1,.885,.42,.065,sc0,pct))).data.text||'').replace(/\s+/g,' ').trim();window.hiDbg.push('L'+pct+':'+t);
  const m=t.replace(/ /g,'').match(re)||t.match(/\b(\d{3}) ?(\d{3})\b/);if(m&&m[1].length===m[2].length&&+m[1]>0&&+m[1]<=+m[2]+120)return m[1].replace(/^0+(?=\d)/,'')+'/'+m[2]}
 const sc=Math.max(3,Math.min(4,1600/(src.width*.45)));
 for(const [x,y,ww,h] of [[0,.88,.45,.12],[.05,.91,.4,.08]])for(const th of [80,115,150]){
  const t=((await w.recognize(binC(src,x,y,ww,h,sc,th))).data.text||'').replace(/\s/g,'');window.hiDbg.push(th+':'+t);const m=t.match(re);
  if(m&&m[1].length===m[2].length&&+m[1]>0)return m[1].replace(/^0+(?=\d)/,'')+'/'+m[2]}
 return ''}
// Set-Code (z.B. s8a, sv2a) aus OCR-Text
function setCode(t){const m=(t||'').match(/\b(s[v]?\d{1,2}[a-z]?|SV\d{1,2}[a-z]?|M\d[a-z]?)\b/);return m?m[1].toLowerCase():''}
function getWorker(){return getW('deu+eng')}
function cropC(src,x,y,w,h,scale,mode){const W=src.width||src.videoWidth,H=src.height||src.videoHeight;scale=Math.min(scale,1500/(W*w));const c=document.createElement('canvas');
 c.width=Math.round(W*w*scale);c.height=Math.round(H*h*scale);const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingQuality='high';
 if(!mode)g.filter='grayscale(1) contrast(1.3)';g.drawImage(src,W*x,H*y,W*w,H*h,0,0,c.width,c.height);
 if(mode){// dunkle Schrift isolieren (Holo-Glitzer & farbiger Hintergrund werden weiß)
  const im=g.getImageData(0,0,c.width,c.height),d=im.data;let hist=new Uint32Array(256);
  for(let i=0;i<d.length;i+=4){const m=Math.max(d[i],d[i+1],d[i+2]);d[i+3]=m;hist[m]++}
  let acc=0,tot=d.length/4,th=60;for(let v=0;v<256;v++){acc+=hist[v];if(acc>tot*(mode==='dark2'?.12:.07)){th=Math.min(120,Math.max(45,v+15));break}}
  for(let i=0;i<d.length;i+=4){const v=d[i+3]<th?0:255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}g.putImageData(im,0,0)}
 return c}
// Kartenumriss finden (helle/farbige Karte vor dunklem Hintergrund)
// Kartenumriss über lange gerade Kanten (für bunte Hintergründe/Screenshots), Fallback zu cardCrop
function cardCropEdge(src){const W=src.width,H=src.height,k=320/Math.max(W,H),w=Math.round(W*k),h=Math.round(H*k);const t=document.createElement('canvas');t.width=w;t.height=h;
 const g=t.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0,w,h);const d=g.getImageData(0,0,w,h).data,I=new Float32Array(w*h);for(let i=0;i<w*h;i++)I[i]=(d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11);
 const GH=new Float32Array(w*h),GV=new Float32Array(w*h);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;GH[i]=Math.abs(I[i+w]-I[i-w])>28?1:0;GV[i]=Math.abs(I[i+1]-I[i-1])>28?1:0}
 // Zeilen-/Spalten-Präfixsummen für Segment-Kantenstärke
 const RP=new Float32Array((w+1)*h),CP=new Float32Array((h+1)*w);for(let y=0;y<h;y++)for(let x=0;x<w;x++)RP[y*(w+1)+x+1]=RP[y*(w+1)+x]+Math.max(GH[y*w+x],y>0?GH[(y-1)*w+x]:0,y<h-1?GH[(y+1)*w+x]:0);
 for(let x=0;x<w;x++)for(let y=0;y<h;y++)CP[x*(h+1)+y+1]=CP[x*(h+1)+y]+Math.max(GV[y*w+x],x>0?GV[y*w+x-1]:0,x<w-1?GV[y*w+x+1]:0);
 const rs=(y,x0,x1)=>(RP[y*(w+1)+x1]-RP[y*(w+1)+x0])/(x1-x0),cs=(x,y0,y1)=>(CP[x*(h+1)+y1]-CP[x*(h+1)+y0])/(y1-y0);
 const peaks=(n,f)=>{const v=[];for(let i=2;i<n-2;i++)v.push([f(i),i]);v.sort((a,b)=>b[0]-a[0]);const o=[];for(const[s,i]of v){if(o.length>=14)break;if(o.every(j=>Math.abs(j-i)>4))o.push(i)}return o};
 const ry=peaks(h,y=>rs(y,Math.round(w*.15),Math.round(w*.85))),cx=peaks(w,x=>cs(x,Math.round(h*.15),Math.round(h*.85)));let best=null;
 for(const y0 of ry)for(const y1 of ry){if(y1-y0<h*.25)continue;for(const x0 of cx)for(const x1 of cx){if(x1-x0<w*.25)continue;const ar=(x1-x0)/(y1-y0);if(ar<.66||ar>.77)continue;
  const s=rs(y0,x0,x1)+rs(y1,x0,x1)+cs(x0,y0,y1)+cs(x1,y0,y1);if(Math.min(rs(y0,x0,x1),rs(y1,x0,x1),cs(x0,y0,y1),cs(x1,y0,y1))<.45)continue;const sc=s+((x1-x0)*(y1-y0))/(w*h);if(!best||sc>best.sc)best={sc,x0,y0,x1,y1}}}
 if(!best)return null;const X=best.x0/k,Y=best.y0/k,CW=(best.x1-best.x0)/k,CH=(best.y1-best.y0)/k;const o=document.createElement('canvas');o.width=Math.round(CW);o.height=Math.round(CH);o.getContext('2d').drawImage(src,X,Y,CW,CH,0,0,o.width,o.height);window.cropDbg=['edge',X,Y,CW,CH].map(v=>typeof v==='number'?Math.round(v):v);return o}
// Karte als Viereck finden (Hough-Linien → 2 Paare ~senkrecht, Seitenverhältnis 63:88) und perspektivisch entzerren
function cardCropQuad(src){const W=src.width,H=src.height,k=Math.min(1,380/Math.max(W,H)),w=Math.round(W*k),h=Math.round(H*k);const t=document.createElement('canvas');t.width=w;t.height=h;
 const g=t.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0,w,h);const d=g.getImageData(0,0,w,h).data,I=new Float32Array(w*h);for(let i=0;i<w*h;i++)I[i]=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11;
 const M=new Float32Array(w*h),A=new Float32Array(w*h);const hist=new Uint32Array(256);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;const gx=(I[i-w+1]+2*I[i+1]+I[i+w+1])-(I[i-w-1]+2*I[i-1]+I[i+w-1]),gy=(I[i+w-1]+2*I[i+w]+I[i+w+1])-(I[i-w-1]+2*I[i-w]+I[i-w+1]);const m=Math.hypot(gx,gy);M[i]=m;A[i]=Math.atan2(gy,gx);hist[Math.min(255,m/4|0)]++}
 let acc=0,th=0;const tot=(w-2)*(h-2);for(let v=255;v>=0;v--){acc+=hist[v];if(acc>tot*.09){th=v*4;break}}th=Math.max(th,40);
 const E=new Uint8Array(w*h);for(let i=0;i<w*h;i++)if(M[i]>=th)E[i]=1;
 // Hough mit Gradientenrichtung (±6°)
 const NT=180,diag=Math.ceil(Math.hypot(w,h)),NR=2*diag+1,HV=new Float32Array(NT*NR),CS=[],SN=[];for(let a=0;a<NT;a++){CS.push(Math.cos(a*Math.PI/NT));SN.push(Math.sin(a*Math.PI/NT))}
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(!E[i])continue;let a0=Math.round(((A[i]+Math.PI)%Math.PI)/Math.PI*NT)%NT;for(let da=-6;da<=6;da++){const a=(a0+da+NT)%NT;const r=Math.round(x*CS[a]+y*SN[a])+diag;HV[a*NR+r]+=1}}
 const pk=[];for(let a=0;a<NT;a++)for(let r=1;r<NR-1;r++){const v=HV[a*NR+r];if(v<Math.min(w,h)*.18)continue;pk.push([v,a,r-diag])}pk.sort((p,q)=>q[0]-p[0]);
 const L=[];for(const p of pk){if(L.length>=40)break;if(L.every(q=>{const da=Math.min(Math.abs(q[1]-p[1]),NT-Math.abs(q[1]-p[1]));return da>4||Math.abs(q[2]-p[2])>8}))L.push(p)}
 const ix=(l1,l2)=>{const a1=CS[l1[1]],b1=SN[l1[1]],a2=CS[l2[1]],b2=SN[l2[1]],D=a1*b2-a2*b1;if(Math.abs(D)<1e-6)return null;return[(l1[2]*b2-l2[2]*b1)/D,(a1*l2[2]-a2*l1[2])/D]};
 const near=(x,y)=>{x=Math.round(x);y=Math.round(y);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&E[yy*w+xx])return 1}return 0};
 const sup=(p,q)=>{let s=0;const n=50;for(let j=1;j<n;j++){const u=j/n;s+=near(p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u)}return s/(n-1)};
 const P=[];for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const da=Math.min(Math.abs(L[i][1]-L[j][1]),NT-Math.abs(L[i][1]-L[j][1]));if(da>10)continue;if(Math.abs(L[i][2]-L[j][2])<Math.min(w,h)*.2&&da<3)continue;P.push([L[i],L[j]])}
 let best=null;for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const[a1,a2]=P[i],[b1,b2]=P[j];const dd=Math.abs(((a1[1]-b1[1])%NT+NT)%NT-90);if(dd>14)continue;
  const c=[ix(a1,b1),ix(b1,a2),ix(a2,b2),ix(b2,a1)];if(c.some(p=>!p||p[0]<-w*.03||p[1]<-h*.03||p[0]>w*1.03||p[1]>h*1.03))continue;
  const sl=[0,1,2,3].map(q=>Math.hypot(c[(q+1)%4][0]-c[q][0],c[(q+1)%4][1]-c[q][1]));const s1=(sl[0]+sl[2])/2,s2=(sl[1]+sl[3])/2,ar=Math.min(s1,s2)/Math.max(s1,s2);if(ar<.62||ar>.82)continue;
  const xs=c.map(p=>p[0]),ys=c.map(p=>p[1]);if(Math.max(...xs)-Math.min(...xs)>(Math.max(...ys)-Math.min(...ys))*.95)continue;const area=s1*s2/(w*h);if(area<.08||area>.97)continue;const su=[0,1,2,3].map(q=>sup(c[q],c[(q+1)%4]));if(Math.min(...su)<.3)continue;
  const sc=su.reduce((x,y)=>x+y,0)/4+.5*area-3*Math.abs(ar-.716);if(!best||sc>best.sc)best={sc,c,ar,area}}
 if(!best)return null;
 // Ecken ordnen: oben-links, oben-rechts, unten-rechts, unten-links (Hochformat)
 let c=best.c.map(p=>[p[0]/k,p[1]/k]);const cx=c.reduce((s,p)=>s+p[0],0)/4,cy=c.reduce((s,p)=>s+p[1],0)/4;c.sort((p,q)=>Math.atan2(p[1]-cy,p[0]-cx)-Math.atan2(q[1]-cy,q[0]-cx));// ab links-oben im Uhrzeigersinn (y nach unten)
 let st=0,mn=1e9;c.forEach((p,i)=>{if(p[0]+p[1]<mn){mn=p[0]+p[1];st=i}});c=[0,1,2,3].map(i=>c[(st+i)%4]);
 const top=Math.hypot(c[1][0]-c[0][0],c[1][1]-c[0][1]),left=Math.hypot(c[3][0]-c[0][0],c[3][1]-c[0][1]);if(top>left)c=[c[3],c[0],c[1],c[2]];// Querformat → drehen
 const OW=Math.round(Math.min(1100,Math.max(500,Math.hypot(c[1][0]-c[0][0],c[1][1]-c[0][1])))),OH=Math.round(OW*88/63);
 // Homographie Ziel→Quelle
 const dst=[[0,0],[OW,0],[OW,OH],[0,OH]],Mx=[],bv=[];for(let i=0;i<4;i++){const[x,y]=dst[i],[u,v]=c[i];Mx.push([x,y,1,0,0,0,-u*x,-u*y]);bv.push(u);Mx.push([0,0,0,x,y,1,-v*x,-v*y]);bv.push(v)}
 const n=8;for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(Mx[r][i])>Math.abs(Mx[p][i]))p=r;[Mx[i],Mx[p]]=[Mx[p],Mx[i]];[bv[i],bv[p]]=[bv[p],bv[i]];for(let r=0;r<n;r++){if(r===i)continue;const f=Mx[r][i]/Mx[i][i];for(let q=i;q<n;q++)Mx[r][q]-=f*Mx[i][q];bv[r]-=f*bv[i]}}
 const hh=bv.map((v,i)=>v/Mx[i][i]);const sc2=document.createElement('canvas');sc2.width=W;sc2.height=H;const sg=sc2.getContext('2d',{willReadFrequently:true});sg.drawImage(src,0,0);const sd=sg.getImageData(0,0,W,H).data;
 const o=document.createElement('canvas');o.width=OW;o.height=OH;const og=o.getContext('2d');const od=og.createImageData(OW,OH),D=od.data;
 for(let y=0;y<OH;y++)for(let x=0;x<OW;x++){const z=hh[6]*x+hh[7]*y+1,u=(hh[0]*x+hh[1]*y+hh[2])/z,v=(hh[3]*x+hh[4]*y+hh[5])/z;const ui=u|0,vi=v|0;const j=(y*OW+x)*4;if(ui<0||vi<0||ui>=W-1||vi>=H-1){D[j+3]=255;continue}
  const fu=u-ui,fv=v-vi,i00=(vi*W+ui)*4,i10=i00+4,i01=i00+W*4,i11=i01+4;for(let ch=0;ch<3;ch++)D[j+ch]=(sd[i00+ch]*(1-fu)+sd[i10+ch]*fu)*(1-fv)+(sd[i01+ch]*(1-fu)+sd[i11+ch]*fu)*fv;D[j+3]=255}
 og.putImageData(od,0,0);window.cropDbg=['quad',best.sc.toFixed(2),best.ar.toFixed(2),...c.flat().map(Math.round)];return o}
function cardCrop(src){const c0=cardCropA(src);if(c0!==src){const d0=window.cropDbg;try{const qd=cardCropQuad(src),qs=String(window.cropDbg||'').split(',');if(qd&&qs[0]==='quad'&&+qs[1]>=1&&qd.width*qd.height>=c0.width*c0.height*1.08)return qd}catch(e){}window.cropDbg=d0;return c0}if(Math.abs(src.width/src.height-.716)<.025)return src;try{const qd=cardCropQuad(src);if(qd)return qd}catch(e){console.warn('quad',e)}try{const e=cardCropEdge(src);if(e)return e}catch(e){console.warn(e)}return src}
// v104: Zuschnitt verfeinern, solange das Seitenverhältnis nicht kartenartig ist (z.B. gelber App-Rahmen/Kamera-Vorschau um die Karte)
function cardCrop2(src){let c=cardCrop(src);const ar=x=>Math.abs(x.width/x.height-.716);for(let i=0;i<2&&ar(c)>.03;i++){let c2=null;try{c2=cardCropA(c);if(c2===c)c2=null}catch(e){}if(!c2){try{c2=cardCropQuad(c)}catch(e){}}if(!c2){try{c2=cardCropEdge(c)}catch(e){}}if(c2&&c2!==c&&c2.width*c2.height>=c.width*c.height*.5&&ar(c2)<ar(c))c=c2;else break}// Karte im Rahmen (Kamera-Vorschau/gelber Rahmen): Rand 3 % abschneiden und innen erneut suchen
 if(c!==src)try{const m=.03,W=c.width,H=c.height,s=document.createElement('canvas');s.width=Math.round(W*(1-2*m));s.height=Math.round(H*(1-2*m));s.getContext('2d').drawImage(c,W*m,H*m,s.width,s.height,0,0,s.width,s.height);const c3=cardCropA(s);if(c3!==s){const r=c3.width*c3.height/(W*H);if(r>=.35&&r<=.9&&ar(c3)<.04){const cx=window.cropDbg;// mit ~1,5 % Rand aus dem Original schneiden
   const [x0,y0,cw,ch]=cx,px=cw*.015,py=ch*.015,o=document.createElement('canvas');o.width=Math.round(cw+2*px);o.height=Math.round(ch+2*py);o.getContext('2d').drawImage(c,W*m+x0-px,H*m+y0-py,o.width,o.height,0,0,o.width,o.height);c=o}}}catch(e){}
 window.crop2Dbg=[c.width,c.height];return c}
// v107: schneller Namens-Durchgang – obere ~16 % (Original + Zuschnitte), einzeilig, DE/EN, eigener Worker
async function fastName(L,tok){window.fnPend=true;try{return await fastName0(L,tok)}finally{if(tok===window.fnTok)window.fnPend=false}}
async function fastName0(L,tok){const t0=performance.now(),w=await getW('nm');const [o,c]=L;const P=[[o,0,0,1,.25],[o,0,.05,.8,.2],[c,0,0,1,.25]];const seen=new Set();for(const [s0,...g] of P){{const k=L.indexOf(s0)+':'+g;if(!s0||seen.has(k))continue;seen.add(k)}if(tok!==window.fnTok)return null;if(performance.now()-t0>4500)break;let t='',s=null;try{s=cropC(s0,...g,2.5);if(s.width<12||s.height<12)continue;t=(await wto(w.recognize(s),2500,'t')).data.text||''}catch(e){continue}for(const wd of (t.match(/[A-Za-zÄÖÜäöüßé][A-Za-zÄÖÜäöüßé'-]{2,}/g)||[])){if(/^(phase|basis|stage|basic|entwickelt|evolves|trainer|ruhig|karte|rahmen|kartenapp)/i.test(wd)||wd.length<3)continue;const n=fuzzyName(wd);if(n&&nrm(wd).length>=4&&lev(nrm(wd),nrm(n))<=(nrm(n).length>=7?1:0)){if(tok!==window.fnTok)return null;window.fastNmMs=Math.round(performance.now()-t0);return n}}}return null}
// v108: austauschbarer Bild-Matcher (App kann z.B. ein Embedding-Modell einsetzen: window.setCardMatcher({match,ready,name}))
let FPIX=null;const fpIdx=()=>FPIX||(FPIX=fetch(new URL('fp/index.json',document.baseURI).href).then(r=>r.ok?r.json():{}).catch(()=>{FPIX=null;return{}}));
// Set-IDs auf die richtige Fingerabdruck-Familie verteilen (JP-Codes wie SV8a/SM4A → fp/ja, sonst fp/intl); unbekannte IDs nicht anfragen (keine 404)
async function fpMatch(c,o={}){if(typeof window.matchCardImage!=='function')return[];const S=(o.setIds||[]).filter(Boolean);if(!S.length)return window.matchCardImage(c,o);const X=await fpIdx(),ci=(m,s)=>{if(!m)return null;if(m[s]!=null)return s;const k=Object.keys(m).find(k=>k.toLowerCase()===String(s).toLowerCase());return k||null};
 const ja=[...new Set(S.map(s=>ci(X.ja,s)).filter(Boolean))],it=[...new Set(S.map(s=>ci(X.intl,s)).filter(Boolean))];const P=[];if(it.length&&o.lang!=='ja')P.push(window.matchCardImage(c,{...o,setIds:it,lang:undefined}).catch(()=>[]));if(ja.length)P.push(window.matchCardImage(c,{...o,setIds:ja,lang:'ja'}).catch(()=>[]));
 return (await Promise.all(P)).flat().sort((x,y)=>y.score-x.score).slice(0,o.limit||5)}
const sameArt=(a,b)=>{try{if(typeof window.artGroup==='function'){const g=window.artGroup(a);return !!g&&g===window.artGroup(b)}}catch(e){}return false};
window.CardMatcher=window.CardMatcher||{name:'fingerprint',match:fpMatch,ready:l=>typeof window.matchCardImageReady==='function'?window.matchCardImageReady(l):Promise.resolve(false)};
window.setCardMatcher=m=>{if(m&&typeof m.match==='function')window.CardMatcher=Object.assign({ready:()=>Promise.resolve(true),name:'custom'},m);return window.CardMatcher};
// OCR-Annahme nur, wenn die OCR-Karte im Bild-Top-5 ist oder per Set-Abgleich ≥0,45 ähnlich ist (sonst Auswahl statt stiller Falschtreffer)
async function ocrGuard(r){if(r&&r.confident&&r.lang!=='JP'&&window.ambLang&&!window.kanaQ){const nr=nrm(String(r.name||'').split(/[\s-]/)[0]),rw=nrm(String(r.raw||'')+' '+(window.latDbg||'')+' '+(window.fastNm||''));if(!(nr.length>=3&&rw.includes(nr))){r.confident=false;r.ocrUnsure=true;r.conflict=true;return r}}if(r&&r.confident&&r.lang!=='JP'&&window.kanaQ){r.confident=false;r.ocrUnsure=true;r.conflict=true;return r}if(!r||!r.confident||r.imgHit||r.timeout||r.energy||!r.number||!r.setId||!window.mSrcBest)return r;const sid=tdxSid(r.setId),n=String(+r.number||r.number);const same=m=>{const s=String(m.cardId).replace(/-[^-]+$/,''),l=String(m.cardId).split('-').pop();return s.toLowerCase()===String(sid).toLowerCase()&&String(+l||l)===n};
 if((window.imgM||[]).some(same))return r;let M=[];try{M=await wto(CardMatcher.match(window.mSrcBest,{setIds:[sid],limit:300,lang:r.lang==='JP'?'ja':undefined}),2000,'t')}catch(e){return r}if(!M||!M.length)return r;const h=M.find(same);if(h&&h.score>=.45)return r;const nr=nrm(String(r.name||'').split(/[\s-]/)[0]);const rawN=nrm(String(r.raw||'')+' '+(window.fastNm||''));if(nr.length>=3&&rawN.includes(nr))return r;
 r.confident=false;r.ocrUnsure=true;r.conflict=true;return r}
// v108: Bestätigungskarte nach Auto-Übernahme (Bild + 'Falsch? Ändern' → Kandidaten-Sheet)
async function showConfirm(r){let el=$('#scanConfirm');if(el)el.remove();el=document.createElement('div');el.id='scanConfirm';el.setAttribute('role','status');
 let img=r.image||(r.hit&&r.hit.image)||'';const id=r.imgHit&&r.imgHit.cardId;
 el.innerHTML=`<div class="scimg">${img?`<img alt="" src="${esc(imgU(img))}">`:''}</div><div class="sctx"><b>✓ ${esc(r.name)}</b><span>${esc(r.set||r.setId||'')} · ${esc(r.full||r.number||'')}${r.lang?' · '+esc(r.lang):''}</span><button type="button" class="bigbtn scfix">Falsch? Ändern</button></div><button type="button" class="chip scx" aria-label="Schließen">✕</button>`;
 document.body.append(el);const close=()=>{el.remove();clearTimeout(el._t)};el.querySelector('.scx').onclick=close;
 el.querySelector('.scfix').onclick=()=>{close();try{if(batchOn()&&window.TRAY&&TRAY.length){const L=TRAY[TRAY.length-1];if(L&&L.name===r.name){TRAY.pop();trayRender()}}}catch(e){}noMatchSheet(Object.assign({},r,{imgMatch:r.imgMatch||window.imgM||[],confident:false}))};
 el._t=setTimeout(close,7000);
 if(!img){try{const lg=r.lang==='JP'?'ja':String(r.lang||'de').toLowerCase();const d=id?await wto(Prices.byId(id,lg),5000,'t'):null;if(d&&d.image&&el.isConnected){el.querySelector('.scimg').innerHTML=`<img alt="" src="${esc(imgU(d.image))}">`}}catch(e){}}}
window.showConfirm=showConfirm;
// gemeinsame Annahmeregel für Bildtreffer: ≥0,62 und ≥0,12 Abstand; gleiche Artwork-Gruppe (Reprint) → nie ohne Nummer
async function imgAccept(M,lgq,extra){const b0=M&&M[0];if(!b0||b0.score<.62)return null;if(M[1]&&(b0.score-M[1].score<.12||sameArt(b0.cardId,M[1].cardId)))return null;
 const ja=lgq==='JP';let d=null;for(const L of ja?['ja']:[...new Set([String(lgq||'DE').toLowerCase(),'en'])]){try{d=await wto(Prices.byId(b0.cardId,L),5000,'t')}catch(e){}if(d&&d.name)break}if(!d||!d.name)return null;
 const sid=String(b0.cardId).replace(/-[^-]+$/,''),li=String(b0.cardId).split('-').pop(),nmb=String(+li||li);let tot='';if(!ja)try{const s=(await tdxSetList('en')).find(x=>x.id===sid);if(s&&s.total)tot=String(s.total)}catch(e){}
 return Object.assign({imgMatch:M,imgHit:b0,name:d.name,en:null,jp:ja?d.name:null,weak:false,number:nmb,full:tot?nmb+'/'+tot:nmb,lang:ja?'JP':lgq,confident:true,energy:false,setId:sid,set:sid,raw:'',conf:Math.round(b0.score*100),image:d.image,hit:ja?d:undefined},extra||{})}
// Kartenkanten (Hough-Viereck) → perspektivisch entzerrt → 716×1000
function warpStd(c){let q=null;try{window.cropDbg=null;q=cardCropQuad(c);const cd=String(window.cropDbg||'').split(',');if(!q||cd[0]!=='quad')return null}catch(e){return null}const o=document.createElement('canvas');o.width=716;o.height=1000;o.getContext('2d').drawImage(q,0,0,716,1000);return o}
window.warpStd=warpStd;
function innerCrop(c,m,mt,mb){mt=mt??m;mb=mb??m;const W=c.width,H=c.height,s=document.createElement('canvas');s.width=Math.round(W*(1-2*m));s.height=Math.round(H*(1-mt-mb));s.getContext('2d').drawImage(c,W*m,H*mt,s.width,s.height,0,0,s.width,s.height);const c3=cardCropA(s);if(c3===s)return null;const [x0,y0,cw,ch]=window.cropDbg,px=cw*.015,py=ch*.015,o=document.createElement('canvas');o.width=Math.round(cw+2*px);o.height=Math.round(ch+2*py);o.getContext('2d').drawImage(c,W*m+x0-px,H*mt+y0-py,o.width,o.height,0,0,o.width,o.height);return o}
function cardCropA(src){const W=src.width,H=src.height,k=200/Math.max(W,H),w=Math.round(W*k),h=Math.round(H*k);const t=document.createElement('canvas');t.width=w;t.height=h;
 const g=t.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0,w,h);const d=g.getImageData(0,0,w,h).data;const R=new Float32Array(h),C=new Float32Array(w);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);if(mx>140&&mx-mn>50){R[y]++;C[x]++}}
 const span=(A,n,f)=>{let a=0,b=n-1;while(a<n&&A[a]<f)a++;while(b>a&&A[b]<f)b--;return[a,b]};const [y0,y1]=span(R,h,w*.35),[x0,x1]=span(C,w,h*.35);
 const cw=(x1-x0+1)/k,ch=(y1-y0+1)/k,ar=cw/ch;if(x1<=x0||y1<=y0||ar<.55||ar>.9||cw*ch<W*H*.15||cw*ch>W*H*.95)return src;
 const o=document.createElement('canvas');o.width=Math.round(cw);o.height=Math.round(ch);o.getContext('2d').drawImage(src,x0/k,y0/k,cw,ch,0,0,o.width,o.height);window.cropDbg=[x0/k,y0/k,cw,ch].map(Math.round);return o}
async function toCanvas(file,max=1600){window.warmOCR&&warmOCR();let bm;try{bm=await createImageBitmap(file)}catch(e){bm=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Bild nicht lesbar'));i.src=URL.createObjectURL(file)})}
 const W=bm.width,H=bm.height,k=Math.min(1,max/Math.max(W,H));const c=document.createElement('canvas');c.width=Math.round(W*k);c.height=Math.round(H*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return c}
// v100: OCR-Verwechsler in Ziffern-Tokens (O/o→0, I/l/|→1, S→5, B→8), fehlender Schrägstrich, gegen Set-Gesamtzahlen prüfen
function numNorm(t){return String(t||'').replace(/[0-9OoIl|SB\/]{3,}/g,s=>/\d/.test(s)?s.replace(/[Oo]/g,'0').replace(/[Il|]/g,'1').replace(/S/g,'5').replace(/B/g,'8'):s)}
function numParse(t){const T=numNorm(t);for(const m of T.matchAll(/(?<![\d])(\d{1,3})\s*\/\s*(\d{2,3})(?!\d)/g)){const v=m[1].replace(/^0+(?=\d)/,'')+'/'+m[2];if(numOK(v))return v}
 for(const m of T.matchAll(/(?<![\d])(\d{2,3})\s*[\/|Il1]?\s*(\d{3})(?!\d)/g)){const v=m[1].replace(/^0+(?=\d)/,'')+'/'+m[2];if(numOK(v)&&+m[2]>=50)return v}return ''}
// Nummernzeile 3,5x hochskaliert + geschärft, nur 0-9/ (psm 7)
function sharpC(src,x,y,w,h,scale){const c=cropC(src,x,y,w,h,scale);const g=c.getContext('2d',{willReadFrequently:true}),im=g.getImageData(0,0,c.width,c.height),d=im.data,W=c.width,H=c.height,o=new Uint8ClampedArray(d.length);
 for(let yy=1;yy<H-1;yy++)for(let xx=1;xx<W-1;xx++){const i=(yy*W+xx)*4;const v=5*d[i]-d[i-4]-d[i+4]-d[i-W*4]-d[i+W*4];o[i]=o[i+1]=o[i+2]=v;o[i+3]=255}
 let s=0,n=0;for(let i=0;i<o.length;i+=4){s+=o[i];n++}const th=s/n*.85;for(let i=0;i<o.length;i+=4){const v=o[i]<th?0:255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}g.putImageData(im,0,0);return c}
async function readNumberSharp(src){const w=await getW('dig');for(const [x,y,ww,h] of [[0,.93,.45,.065],[.55,.93,.45,.065],[0,.9,.5,.08],[.5,.9,.5,.08]]){try{const {data}=await w.recognize(sharpC(src,x,y,ww,h,3.5));(window.numDbg=window.numDbg||[]).push('#'+data.text);const v=numParse(data.text);if(v)return v}catch(e){}}return ''}
async function readNumber(src){const w=await getW('num');const re=/(\d{1,3})\s*\/\s*(\d{2,3})/g;window.numDbg=[];let weak='';
 for(const [x,y,ww,h,k,m] of [[.12,.93,.3,.07,8,'dark'],[.08,.92,.36,.08,6,'dark2'],[.7,.935,.3,.065,6,'dark'],[.5,.9,.5,.1,4,'dark'],[0,.935,.42,.06,6,'dark'],[0,.935,.42,.06,6,'dark2'],[0,.91,.45,.08,5,'dark'],[0,.86,.5,.14,4,'dark'],[.5,.9,.5,.1,4,'dark'],[0,.75,1,.25,3,'dark'],[0,.5,1,.5,3,'dark2']]){
  const {data}=await w.recognize(cropC(src,x,y,ww,h,k,m));window.numDbg.push(data.text);
  for(const mm of (data.text||'').matchAll(re)){const v=mm[1]+'/'+mm[2];if(mm[1].length===mm[2].length||(+mm[1]>0&&numOK(v)))return mm[1].replace(/^0+(?=\d)/,'')+'/'+mm[2];weak||=v}}
 const np=numParse(window.numDbg.join('\n'));if(np)return np;return weak?{weak}:''}
// Gesamtanalyse: Text (DE/EN), bei Kana/schwacher Erkennung Japanisch, Nummer aus unterem Streifen
// Karten mit gleicher Nummer + Gesamtzahl holen; Name nehmen, wenn sein Grundname im OCR-Text steht
// pokemontcg.io-ID → TCGdex-ID (sv1→sv01, sv3pt5→sv03.5, swsh12pt5→swsh12.5)
function tdxSid(id){id=String(id||'');try{if(window.Prices&&Prices.tdxSet)return Prices.tdxSet(id)}catch(e){}let m=id.match(/^sv(\d)(pt5)?$/);if(m)return 'sv0'+m[1]+(m[2]?'.5':'');m=id.match(/^sv(\d\d)(pt5)?$/);if(m)return 'sv'+m[1]+(m[2]?'.5':'');return id.replace(/pt(\d)$/,'.$1')}window.tdxSid=tdxSid;
async function setNameCheck(num,lang,txt,name){const[a0,t0]=num.split('/');const tot=+t0,n=String(+a0);const ts=s=>window.Prices&&Prices.tdxSet?Prices.tdxSet(s):s;let sets=(SETS||[]).filter(s=>+s.printedTotal===tot).slice(0,8).map(s=>({...s,id:ts(s.id)}));if(!sets.length){try{window._tdxSets=window._tdxSets||fetch('https://api.tcgdex.net/v2/en/sets',{signal:AbortSignal.timeout(8000)}).then(r=>r.json()).catch(()=>{window._tdxSets=null;return[]});const j=await window._tdxSets;sets=(j||[]).filter(x=>x.cardCount&&+x.cardCount.official===tot).slice(0,8).map(x=>({id:x.id,name:x.name,printedTotal:tot}))}catch(e){}}for(const c in SETCODES){const x=SETCODES[c];if(x.total===tot&&x.tdx&&!sets.some(s=>s.id===x.tdx))sets.push({id:x.tdx,name:x.name,printedTotal:tot})}if(!sets.length)return null;
 const T=nrm(txt),lg=(lang||'DE').toLowerCase().replace('jp','ja');const C=[];
 window._sncC=window._sncC||{};await Promise.all(sets.map(async s=>{const r=await Promise.all([...new Set([lg,'en'])].map(L=>{const k=L+'|'+s.id+'|'+n;return(window._sncC[k]=window._sncC[k]||wto(Prices.lookup('',L,s.id,n),3500,'t').catch(()=>{delete window._sncC[k];return null})).then(c=>c&&c.name?{name:c.name,setId:s.id,setName:s.name,lg:L}:null)}));const h=r.find(Boolean);if(h)C.push(h)}));
 window.setChkDbg=C.map(c=>c.setId+':'+c.name);if(!C.length)return null;
 const base=x=>nrm(String(x).replace(/[-\s]*(VMAX|VSTAR|V-UNION|V|GX|EX|ex|BREAK)$/,''));
 const NV=name?[name,...tdxNames(name,'en'),...tdxNames(name,'de')].map(base).filter(x=>x.length>=3):[];
 let hit=C.find(c=>base(c.name)===base(name)||NV.includes(base(c.name)))||C.find(c=>base(c.name).length>=4&&T.includes(base(c.name)))||(C.length===1&&!(name&&base(name).length>=3)?C[0]:null)||(()=>{let bst=null,bd=9;for(const c of C){const b=base(c.name),L=b.length;if(L<4)continue;for(let i=0;i+L<=T.length;i++){const d=lev(T.substr(i,L),b);if(d<bd){bd=d;bst=c}}}return bst&&bd<=Math.max(1,Math.floor(base(bst.name).length*.3))?bst:null})();
 if(!hit&&C.length&&!(name&&base(name).length>=3)){const ord=x=>{const i=sets.findIndex(s=>s.id===x.setId);return /^sv|^me/.test(x.setId)?1000+i:i};hit=[...C].sort((a,b)=>ord(b)-ord(a))[0]}
 if(!hit)return null;let nm=hit.name;if(hit.lg==='en'&&lg!=='en'){try{nm=deName(nm)||nm}catch(e){}}return{...hit,name:nm}}
// v104: harte Zeitgrenze – nach ~5 s mit dem bisherigen Stand (Bildabgleich) zum Kandidaten-Sheet
async function analyze(src,st0=()=>{}){const tA=performance.now();window.imgM=null;window.kanaQ=false;window.ambLang=false;window.fastNm=null;window.fastNmMs=null;window.anaCut=false;let done=false;const p=analyze0(src,st0).finally(()=>{done=true});const myA=window.anaId=(window.anaId||0)+1;const redT=()=>{if(myA!==window.anaId)return;if(!done||window.fnPend){setTimeout(redT,1500);return}const f=$('#nmSheet'),h=f&&f.querySelector('.nmbg');if(h&&!f.name.value.trim()){h.classList.add('nmfail');h.innerHTML='Name nicht erkannt – bitte eintippen'}else if(h)h.remove()};setTimeout(redT,15000);p.then(r2=>{if(!window.anaCut||!r2||myA!==window.anaId)return;const ls=window.lastScan;if(ls&&ls.timeout){if(r2.name&&!ls.name)ls.name=r2.name;if(r2.full&&!ls.full)ls.full=r2.full;ls.lang=r2.lang||ls.lang}const f=$('#nmSheet');if(!f)return;const hb=f.querySelector('.nmbg');if(!r2.name&&!(r2.full||r2.number)&&!f.name.value.trim()){if(window.fnPend)return;if(hb){hb.classList.add('nmfail');hb.innerHTML='Name nicht erkannt – bitte eintippen'}return}hb?.remove();let ch=false;if(r2.name&&!f.name.value.trim()){f.name.value=r2.name;ch=true}if((r2.full||r2.number)&&!f.num.value.trim()){f.num.value=r2.full||r2.number;ch=true}if(ch){f.dispatchEvent(new Event('submit',{cancelable:true}))}}).catch(()=>{const h=$('#nmSheet .nmbg');if(h){h.classList.add('nmfail');h.innerHTML='Name nicht erkannt – bitte eintippen'}});const cap=new Promise(res=>setTimeout(async()=>{if(done)return;const M0=window.imgM||[];let ra=null;try{if(!window.ambLang)ra=await wto(imgAccept(M0,window.kanaQ?'JP':'DE',{timeout:false,capAccept:true}),2500,'t')}catch(e){}if(ra&&!done){window.anaCut=true;window.fnTok=(window.fnTok||0)+1;ra.ms=Math.round(performance.now()-tA);return res(ra)}if(done)return;window.anaCut=true;const M=window.imgM||[];res({name:window.fastNm||'',number:'',full:'',lang:'DE',imgMatch:M,timeout:true,confident:false,weak:true,energy:false,raw:'',ms:5000})},5000));let r=await Promise.race([p,cap]);try{r=await ocrGuard(r)}catch(e){}if(r&&!r.name&&window.fastNm&&!r.timeout)r.name=window.fastNm;if(!r.timeout)window.anaCut=false;return r}
async function analyze0(src,st0=()=>{}){const t0=performance.now();window.stDbg=[];const st=m=>{window.stDbg.push(Math.round(performance.now()-t0)+':'+m);st0(m)};const orig=src;src=cardCrop(src);let jpSet='';const hasM=typeof window.matchCardImage==='function';// mehrere Zuschnitte vergleichen (Original, einfacher und verfeinerter Zuschnitt) – der mit dem besten Bildtreffer gewinnt
 const mSrc=[src];try{const c1=cardCrop(orig);if(c1!==src)mSrc.push(c1);if(orig!==src&&orig!==c1&&Math.abs(orig.width/orig.height-.716)<.07)mSrc.push(orig)}catch(e){}const mExtra=()=>{try{const b=mSrc[mSrc.length-1]===orig?mSrc[1]||src:mSrc[mSrc.length-1];for(const v of [warpStd(orig),cardCrop2(orig),cardCropQuad(src),cardCropQuad(b),innerCrop(src,.03,.12),innerCrop(src,.03,.03,.12)])if(v&&v!==src&&!mSrc.includes(v)&&Math.abs(v.width/v.height-.716)<.06)mSrc.push(v)}catch(e){}};window.mSrcBest=src;
 const pM=hasM?CardMatcher.match(mSrc[0],{limit:5}).catch(()=>[]).then(async R0=>{if(R0[0]&&R0[0].score>=.6)return[R0];const R=[R0];await new Promise(z=>setTimeout(z,0));mExtra();for(const c of mSrc.slice(1)){const x=await CardMatcher.match(c,{limit:5}).catch(()=>[]);R.push(x);if(x[0]&&x[0].score>=.62)break}return R}).then(R=>{let bi=0;R.forEach((x,i)=>{if((x[0]&&x[0].score||0)>((R[bi][0]&&R[bi][0].score)||0))bi=i});window.mSrcBest=mSrc[bi];window.imgM=R[bi];window.imgVar=bi+'/'+mSrc.length;return R[bi]}):null;window.imgDbg=null;window.energyHue=hueType(src);st('Name & Nummer werden gelesen…');
 // parallel: Name-Streifen oben (JP + DE/EN) und Nummer-Streifen unten – keine Ganzkarten-OCR, solange das reicht
 const top=cropC(src,.15,.04,.65,.12,3,'dark'),topG=cropC(src,0,.02,1,.12,2);
 const pJ=getW('jpn').then(w=>w.recognize(top)).then(r=>r.data.text||'');
 const pE=getW('deu+eng').then(w=>w.recognize(topG)).then(r=>r.data);
 const pN=readNumber(src);const fTok=window.fnTok=(window.fnTok||0)+1;Promise.all([pJ,pE]).catch(()=>{}).then(()=>fTok===window.fnTok?fastName([orig,...mSrc],fTok):null).then(n=>{if(!n||fTok!==window.fnTok)return;window.fastNm=n;const f=$('#nmSheet');if(f&&window.anaCut&&!f.name.value.trim()){f.querySelector('.nmbg')?.remove();f.name.value=n;f.dispatchEvent(new Event('submit',{cancelable:true}))}}).catch(()=>{});
 const [tTop0,rE0]=await Promise.all([pJ,pE]);
 // v103: sehr sicherer Bildtreffer (≥0,62, Zweitbeste liegen < 0,46) → sofort übernehmen, ohne auf die Nummern-OCR zu warten
 const latN=((rE0.text||'').match(/[A-Za-zÄÖÜäöüß]{4,}/g)||[]).length,latEv=latN>=2;let jpN=null;try{jpN=jpName(tTop0)}catch(e){}
 const kanaQ=!!jpN&&/[\u3041-\u3096\u30a1-\u30fa]{2,}/.test(String(tTop0||'').replace(/\s/g,''))&&latN<3;window.kanaQ=kanaQ;let skipI=false;window.jpDbg={latN,jpN,kanaQ};window.latN=latN;
 // JP-Fingerabdrücke nur ohne lateinischen Text abfragen; gleich gutes JP-Artwork ohne Kana-Beleg = Sprache unklar → keine Auto-Übernahme
 if(pM&&!latEv){try{const [Mi,Mj]=await Promise.all([pM,wto(CardMatcher.match(window.mSrcBest||src,{lang:'ja',limit:5}),4000,'t').catch(()=>[])]);
  window.jpDbg.mj=(Mj||[]).slice(0,2).map(x=>x.cardId+':'+x.score.toFixed(2)).join(' ');window.jpDbg.mi=(Mi||[]).slice(0,1).map(x=>x.cardId+':'+x.score.toFixed(2)).join(' ');
  if(kanaQ&&Mj&&Mj.length){window.imgM=Mj;skipI=true;const r=await imgAccept(Mj,'JP',{raw:tTop0});if(r){window.scanMs=Math.round(performance.now()-t0);r.ms=window.scanMs;st('Per Bildabgleich erkannt (JP)');return r}}
  else if(Mj&&Mj[0]&&Mj[0].score>=.5&&(!Mi||!Mi[0]||Mj[0].score>=Mi[0].score-.06)){window.ambLang=true;skipI=true;window.imgM=[...(Mi||[]),...Mj].sort((x,y)=>y.score-x.score).slice(0,5)}}catch(e){}}
 if(pM&&!skipI&&!window.ambLang){try{const M0=await pM;const b0=M0&&M0[0];if(b0&&M0[1]&&sameArt(b0.cardId,M0[1].cardId))throw 0;window.imgDbg=M0&&M0.slice(0,3).map(x=>x.cardId+':'+x.score);if(b0&&b0.score>=.62&&(!M0[1]||b0.score-M0[1].score>=.12)){const tL0=rE0.text||'';const lgq=((tL0.match(/[A-Za-zÄÖÜäöüß]{3,}/g)||[]).length?langLatin(tL0):'DE');let d=null;for(const L of [lgq.toLowerCase(),'en']){try{d=await wto(Prices.byId(b0.cardId,L),5000,'t')}catch(e){}if(d&&d.name)break}
  if(d&&d.name){const sid=String(b0.cardId).replace(/-[^-]+$/,''),li=String(b0.cardId).split('-').pop(),nmb=String(+li||li);let tot2='';try{const s=(await tdxSetList('en')).find(x=>x.id===sid);if(s&&s.total)tot2=String(s.total)}catch(e){}window.scanMs=Math.round(performance.now()-t0);st('Per Bildabgleich erkannt');
   return{imgMatch:M0,imgHit:b0,name:d.name,en:null,jp:null,weak:false,number:nmb,full:tot2?nmb+'/'+tot2:nmb,lang:lgq,confident:true,energy:false,setId:sid,set:sid,raw:tTop0+'\n'+tL0,conf:Math.round(b0.score*100),ms:window.scanMs}}}}catch(e){}}
 const [tTop,rE,num0]=[tTop0,rE0,await pN];window.topDbg=tTop;
 let number=num0,numWeak=false;if(number&&number.weak){number=number.weak;numWeak=true}
 const tL=rE.text||'';window.latDbg=tL;let latW=(tL.match(/[A-Za-zÄÖÜäöüß]{3,}/g)||[]),latin=latW.length>=1&&(rE.confidence>=45||latW.some(w=>/^(basis|phase|energie|basic|stage|energy)$/i.test(w)));if(latin&&/[\u3040-\u30ff]{3,}/.test(tTop.replace(/\s/g,''))&&jpName(tTop)&&!latW.some(w=>/^(basis|phase|energie|basic|stage|energy|trainer|item)$/i.test(w))&&rE.confidence<70)latin=false;
 const pT=parseTop(tL),numTxt=(window.numDbg||[]).join('\n');
 if(!number||numWeak){try{const sn=await readNumberSharp(src);if(sn){number=sn;numWeak=false}}catch(e){}}
 {const m=numTxt.match(/\b(\d{3})\s*[-–—~]\s*(\d{3})/);window.dashDbg=[number,m&&m[0]];const nb=String(number||'').split('/');if(m&&(!number||numWeak||!numOK(number)||(nb[0]!==m[1].replace(/^0+(?=\d)/,'')&&m[1].endsWith(nb[0])&&String(nb[1]||'').length<3))){number=m[1].replace(/^0+(?=\d)/,'')+'/'+m[2];numWeak=true}}
 // v103: Bildabgleich (parallel gestartet) – bei Nummer mit Set-Gesamtzahl auf passende Sets einschränken
 let M=null,narrow=false;if(pM){try{M=await pM;const tot=number&&String(number).includes('/')?+String(number).split('/')[1]:0;if(tot){const ids=[];for(const l of ['en','de'])for(const s of await tdxSetList(l))if(+s.total===tot&&!ids.includes(s.id))ids.push(s.id);try{for(const c in SETCODES)if(SETCODES[c].total===tot&&SETCODES[c].tdx&&!ids.includes(SETCODES[c].tdx))ids.push(SETCODES[c].tdx)}catch(e){}if(ids.length){const M2=await CardMatcher.match(window.mSrcBest||src,{setIds:ids,limit:5}).catch(()=>[]);if(M2&&M2.length&&(!M||!M.length||M2[0].score>=M[0].score-.05)){M=M2;narrow=true}}}
   else{// keine Nummer: Set-Code (z.B. 30C) oder Kandidaten zum gelesenen Namen → setIds
    const ids=[];try{const sc0=findSet(tL+'\n'+numTxt,'');if(sc0&&(sc0.tdx||sc0.id))ids.push(tdxSid(sc0.tdx||sc0.id));if(/\b(30C|3OC)\b/i.test(numTxt+'\n'+tL)&&!ids.includes('30th'))ids.push('30th')}catch(e){}
    if(!ids.length&&pT.name&&okName(pT.name)){try{const R=await wto(tdxFind(pT.name,null,latin?langLatin(tL+'\n'+numTxt):'de'),3500,'t');for(const c of (R.list||[]).slice(0,60)){const s=String(c.id).replace(/-[^-]+$/,'');if(!ids.includes(s))ids.push(s)}}catch(e){}}
    if(ids.length){const M2=await CardMatcher.match(window.mSrcBest||src,{setIds:ids,limit:5}).catch(()=>[]);if(M2&&M2.length&&(!M||!M.length||M2[0].score>=M[0].score-.08)){M=M2;narrow=true}}}}catch(e){M=null}
  const best=M&&M[0];window.imgDbg=M&&M.slice(0,3).map(x=>x.cardId+':'+x.score);if(best){const li=String(best.cardId).split('-').pop(),nn=number?String(number).split('/')[0]:'';const agree=!!nn&&numN(li)===numN(nn),conflict=!!nn&&!agree;
   if((best.score>=.5&&agree)||(best.score>=(narrow?.5:.6)&&!conflict)){const lg0=latin?langLatin(tL+'\n'+numTxt):'DE';const lgq=lg0.toLowerCase();let d=null;try{d=await wto(Prices.byId(best.cardId,lgq),6000,'t')}catch(e){}if(!d||!d.name){try{d=await wto(Prices.byId(best.cardId,'en'),6000,'t')}catch(e){}}
    if(d&&d.name){const sid=String(best.cardId).replace(/-[^-]+$/,'');let tot2=number&&String(number).includes('/')?String(number).split('/')[1]:'';if(!tot2){try{const s=(await tdxSetList('en')).find(x=>x.id===sid);if(s&&s.total)tot2=String(s.total)}catch(e){}}const nmb=String(+li||li);window.scanMs=Math.round(performance.now()-t0);
     return{imgMatch:M,imgHit:best,name:d.name,en:null,jp:null,weak:false,number:nmb,full:tot2?nmb+'/'+tot2:nmb,lang:lg0,confident:true,energy:false,setId:sid,set:sid,raw:tTop+'\n'+tL,conf:Math.round(best.score*100),ms:window.scanMs}}}}}
 // v99: JP nur bei echter Kana-Folge (≥3 zusammenhängend); OCR-Müll aus Holo-/Full-Art-Hintergrund ('パケ バル ー') → Ganzkarten-OCR entscheidet
 const kanaRun=Math.max(0,...(tTop.match(/[\u3040-\u30ff\u4e00-\u9fff]+/g)||['']).map(s=>s.length));const jpWeak=kanaRun<3;window.jpWeakDbg=kanaRun;
 let jp=latin||jpWeak?null:jpName(tTop),text=tTop+'\n'+tL,kana=!latin&&/[\u3040-\u30ff]{2,}/.test(tTop.replace(/\s/g,'')),lang=jp?'JP':'';
 let r1=rE,conf=rE.confidence,energy=pT.energy;
 if(latin){lang=langLatin(tL+'\n'+numTxt)}
 // Schnellpfad: Set-Code (z.B. 30C) unten gelesen → Name aus Titelzeile gegen Set-Liste, Nummer aus der Liste (spart Vollbild-OCR + Nummernpässe)
 let fast=false;window.fastDbg=[src.width,!!energy,tTop.slice(0,20),(numTxt.match(/30C/)||[''])[0],numTxt.length];const m30=(numTxt+'\n'+tL).match(/(30C|3OC|30c)/);if(!energy&&(m30||!/[\u3040-\u30ff]{3,}/.test(tTop.replace(/\s/g,'')))){try{const m=m30;const sx=m&&SETCODES['30C'];const tot=number&&number.includes('/')?+number.split('/')[1]:0;const sy=sx||(tot?Object.values(SETCODES).find(x=>x.total===tot&&x.tdx):null);
  if(sy&&sy.tdx){window.stDbg&&st('Name wird mit Set-Liste abgeglichen…');let tT='';try{const w=await getW('deu+eng');tT=(await w.recognize(cropC(src,.1,.02,.6,.07,2))).data.text||''}catch(e){}window.titleDbg=tT;window.fastDbg.push('T:'+tT);const dm=numTxt.match(/\b(\d{3})\s*[-–—~\/]\s*\d{3}/g)||[];const f=await setListFix(sy.tdx,lang||'DE',tTop+'\n'+tL+'\n'+tT,[number?String(number).split('/')[0]:'',...dm.map(x=>x.slice(0,3))].join('|'),pT.name||'');if(f){number=String(+f.localId||f.localId)+'/'+sy.total;numWeak=false;fast={name:f.name,sy};window.fastDbg.push('HIT');latin=true;jp=null;kana=false;if(!lang||lang==='JP')lang=langLatin(tL+'\n'+numTxt)}}}catch(e){console.warn('fast',e);window.fastDbg.push('ERR '+e.message)}}
 if(!fast&&!jp&&!(latin&&pT.name&&(number||energy))){// Fallback: ganze Karte (Sprache über Wörter wie Schwäche/Weakness)
  st('Ganze Karte wird gelesen…');const [a,b]=await Promise.all([getW('deu+eng').then(w=>w.recognize(cropC(src,0,0,1,1,1))),latin?null:getW('jpn').then(w=>w.recognize(cropC(src,0,0,1,1,1)))]);
  r1=a.data;conf=Math.max(conf,r1.confidence);text+='\n'+r1.text+(b?'\n'+b.data.text:'');
  const fullLatin=latin||(r1.text.match(/[A-Za-zÄÖÜäöüß]{4,}/g)||[]).length>=6;
  if(fullLatin){latin=true;lang=langLatin(tL+'\n'+r1.text+'\n'+numTxt);kana=false;jp=null}
  else{jp=jpName(text);lang=detectLang(r1.text||'');if(jp||(b&&/[\u3040-\u30ff]{3,}/.test(b.data.text))){kana=true;lang='JP'}}
  if(!energy)energy=parseTop(r1.text).energy}
 const p=pT.name?pT:parseOCR(r1.text||'');if(!number){const m=text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);if(m)number=m[1].replace(/^0+(?=\d)/,'')+'/'+m[2]}
 let sc=fast?fast.sy:findSet(text+'\n'+numTxt,number);window.scanPart={name:(jp&&jp.name)||p.name||'',number:number||''};scanPrefetch(window.scanPart,lang);
 if(!number&&!energy){const m=(numTxt+'\n'+text).match(/\b(?:30C|3OC)\s*[^\d\n]{0,3}(\d{3})\b/i);if(m){number=m[1].replace(/^0+(?=\d)/,'');numWeak=true}}
 if(energy){if(!number){const m=(numTxt+'\n'+text).match(/\b(\d{3})\b/);if(m)number=m[1]}if(lang===''||lang==='JP'&&latin)lang='DE'}
 if((!number||numWeak)&&!energy&&(jp||kana)){st('Kartennummer wird gesucht…');let bn=null;try{bn=(orig!==src&&await readNumberBands(orig))||await readNumberBands(src)}catch(e){}if(bn){number=bn.num;numWeak=false;if(bn.set)jpSet=bn.set}}
 if((!number||numWeak)&&!energy&&src.width>=380){st('Kartennummer wird genau gelesen…');const n2=await readNumberHi(src);if(n2){number=n2;numWeak=false}}
 if(!fast&&number&&number.includes('/')&&!energy&&!jp&&!numOK(number)){st('Kartennummer wird genau gelesen…');const n2=src.width>=380?await readNumberHi(src):'';if(n2&&numOK(n2)){number=n2;numWeak=false}else{number='';numWeak=false}}
 if((!number||numWeak)&&!energy&&!jp){st('Kartennummer: zweiter Versuch (vergrößert)…');let s3=null;try{s3=findSet(text+'\n'+(window.numDbg||[]).join('\n'),'')}catch(e){}if(!s3&&/30th|celebration/i.test(text))s3=SETCODES['30C'];let n3='';try{n3=await readNumberHi2(src,s3&&s3.total||0)}catch(e){console.warn(e)}if(n3&&numOK(n3)){number=n3;numWeak=false}}
 if(!number&&!energy&&performance.now()-t0<7000){st('Kartennummer wird gesucht…');let bn=null;try{bn=await readNumberBands(src);if(!bn&&orig!==src)bn=await readNumberBands(orig)}catch(e){console.warn(e)}if(bn&&(jp||kana||numOK(bn.num))){number=bn.num;numWeak=false;if(bn.set)jpSet=bn.set}}
 if((jp||kana)&&number&&number.includes('/')){let tt=+number.split('/')[1];const m=(text+'\n'+numTxt).match(/\b(M\d{1,2}[a-z]?)\b/i);let cs=jpSet||(m&&m[1])||'';cs=cs.replace(/^m/,'M').replace(/A$/,'a');if(!Object.values(JPSETS).includes(tt)){const nb=Object.values(JPSETS).find(v=>lev(String(v),String(tt))===1);if(nb){number=number.split('/')[0]+'/'+nb;tt=nb}}if(JPSETS[cs]!==+number.split('/')[1]){const f=Object.entries(JPSETS).find(([k,v])=>v===tt);if(f&&(!cs||/^M/i.test(cs)))cs=f[0]}jpSet=cs}
 if(!sc&&number)sc=findSet(text+'\n'+numTxt,number);if(sc&&sc.total&&number&&number.includes('/')){const[a0,t0]=number.split('/');if(+t0!==sc.total&&d1(t0,sc.total))number=a0+'/'+sc.total}
 let name=jp?(jp.de||jp.en):'',confident=!!jp&&!numWeak,weak=false;
 if(energy){name='Basic '+energy+' Energy';confident=true}
 else if(!jp&&!kana&&p.name&&p.name.length>=3&&(latin||conf>=65)){name=deName(p.name);confident=!!number&&!numWeak&&(conf>=55||name!==p.name||latin);if(nrm(name).length<=5&&!(conf>=75&&nrm(p.name)===nrm(name))&&!/energ/i.test(name)&&conf<45){confident=false;weak=true}}
 if(!name&&p.name&&!kana)name=deName(p.name);
 // Name gegen Set mit passender Gesamtzahl prüfen (z.B. 44/185 → Farbenschock: Pikachu VMAX)
 if(jp&&number&&window.Prices&&number.includes('/')&&!Object.values(JPSETS).includes(+number.split('/')[1])&&numOK(number)){try{let l2=detectLang(text)||'DE';if(l2==='JP')l2='DE';const sn=await setNameCheck(number,l2,text+'\n'+numTxt,'');if(sn){jp=null;kana=false;lang=l2;name=sn.name}}catch(e){}}
 window.scanPart={name:name||(window.scanPart||{}).name||'',number:number||''};scanPrefetch(window.scanPart,lang);
 let listFix=!!fast,nameConflict=false;if(fast){name=fast.name;confident=true;weak=false}if(!fast&&!energy&&!jp&&lang!=='JP'&&number&&number.includes('/')){const tot=+number.split('/')[1];const sx=(sc&&sc.tdx&&+sc.total===tot)?sc:Object.values(SETCODES).find(x=>x.total===tot&&x.tdx);if(sx){try{st('Name wird mit Set-Liste abgeglichen…');const f=await setListFix(sx.tdx,lang,tTop+'\n'+text+'\n'+numTxt,number.split('/')[0],name);if(f){name=f.name;number=String(+f.localId||f.localId)+'/'+tot;sc=sc&&sc.tdx===sx.tdx?sc:sx;confident=true;numWeak=false;weak=false;listFix=true}}catch(e){console.warn('setListFix',e)}}}
 if(!listFix&&!energy&&!jp&&lang!=='JP'&&number&&number.includes('/')&&window.Prices){try{st('Name wird mit Set abgeglichen…');const sn=await setNameCheck(number,lang,text+'\n'+numTxt,name);if(sn){name=sn.name;if(!sc)sc={id:sn.setId,name:sn.setName,tdx:sn.setId,total:+number.split('/')[1]};confident=true;numWeak=false;weak=false}else if(name&&numOK(number)){nameConflict=true;confident=false}}catch(e){console.warn('setNameCheck',e)}}
 if(name&&!/\b(VMAX|VSTAR|V|GX|EX|ex)$/.test(name)){const tt=text.replace(/\n/g,' ');if(/\bv[mn]?[a-z]?ax\b/i.test(tt)&&/vmax|vinax|vmnax|v-max/i.test(tt))name+=' VMAX';else if(/\bvstar\b/i.test(tt))name+=' VSTAR'}
 window.scanMs=Math.round(performance.now()-t0);
 if((jp||kana)&&lang!=='JP')lang='JP';
 // v100: nichts erkannt (Karte angeschnitten/Zuschnitt falsch) → ganzes Originalfoto lesen
 if(!name&&!number&&!energy){try{st('Ganzes Foto wird gelesen…');const w=await getW('deu+eng');const t2=(await w.recognize(cropC(orig,0,0,1,1,1))).data.text||'';text+='\n'+t2;const p2=parseOCR(t2);if(p2&&p2.name&&okName(p2.name)){name=p2.name;const lw=(t2.match(/[A-Za-zÄÖÜäöüß]{4,}/g)||[]).length;if(lw>=4){jp=null;kana=false;lang=langLatin(t2)}}const n2=numParse(t2);if(n2){number=n2}}catch(e){console.warn('orig',e)}}
 // v100: OCR ohne Nummer → Bildabgleich (App: matchCardImage), falls vorhanden
 let imgMatch=M&&M.length?M:null;if(!imgMatch&&!number&&!energy&&typeof window.matchCardImage==='function'){try{st('Bild wird mit Karten verglichen…');const o={lang:lang||'',limit:5};if(sc&&(sc.tdx||sc.id))o.setIds=[sc.tdx||sc.id];imgMatch=await wto(window.matchCardImage(src,o),9000,'t')}catch(e){imgMatch=null}}
 return{conflict:nameConflict,imgMatch,name,en:jp&&jp.en,jp:jp&&jp.jp,weak,number:(number||'').split('/')[0],full:number,lang,confident,energy:!!energy,setId:lang==='JP'?'':(sc&&sc.id||''),set:lang==='JP'?(jpSet||setCode(text+'\n'+numTxt)):sc?(sc.tdx||sc.name):setCode(text+'\n'+numTxt),raw:text,conf:Math.round(conf),ms:window.scanMs}}
function detectLatin(t){const T=t.toLowerCase();return (T.match(/schw[aä]che|r[uü]ckzug|resistenz|\bkp\b|illustr|weakness|retreat|resistance|\bhp\b|faiblesse|debolezza|ritirata/g)||[]).length}
// Sprache bei lateinischer Schrift (nie JP)
function langLatin(t){if(/\b\d{2,3}\s*HP\b|\bHP\s*\d{2,3}\b/.test(t)&&!/\bKP\b/.test(t)&&!/schw[aä]che|r[uü]ckzug|faiblesse|debolezza|debilidad/i.test(t))return'EN';const l=detectLang(t.replace(/[\u3040-\u9fff\uac00-\ud7af]/g,''));if(l)return l;if(/\b(BASIS|PHASE|ENERGIE|Energie|Entwickelt|KP)\b/.test(t))return'DE';if(/\b(BASIC|STAGE|ENERGY|Energy|HP)\b/.test(t))return'EN';return'DE'}
// Müll-Namen (z.B. 'dhs') verwerfen
function okName(x){const l=(x.match(/[A-Za-zÄÖÜäöüßé]/g)||[]).length;if(l<3||!/[aeiouyäöüé]/i.test(x))return false;if(x===x.toLowerCase()&&l<4)return false;return true}
// Fuzzy-Korrektur gegen DE/EN-Namensliste (OCR-Verwechsler kosten weniger)
const OCRC=['ou0qd','nhmr','il1jt','ce','b8','s5','g9'];const ocrSim=(a,b)=>OCRC.some(g=>g.includes(a)&&g.includes(b));
function lev(a,b){let p=Array.from({length:b.length+1},(_,j)=>j);for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:ocrSim(a[i-1],b[j-1])?.5:1));p=c}return p[b.length]}
const nrm=x=>(x||'').toLowerCase().replace(/[^a-zäöüß]/g,'');let NAMES=null;
const SUF=/\s*\b(ex|EX|V|VMAX|VSTAR|V-UNION|GX|BREAK|LV\.?X)\s*$/;
function nameMap(){if(!NAMES){NAMES=new Map();for(const r of (window.PNAMES||[]))for(const n of r.slice(0,2))if(n)NAMES.set(nrm(n),n);for(const[k,v]of Object.entries(DE)){if(!NAMES.has(nrm(k)))NAMES.set(nrm(k),k.charAt(0).toUpperCase()+k.slice(1));NAMES.set(nrm(v),v)}}return NAMES}
function fuzzyName(x){x=String(x||'');const sm=x.match(SUF);if(sm){const b=fuzzyName(x.slice(0,sm.index));return b?b+' '+sm[1]:null}
 const mg=x.match(/^\s*mega[\s-]+/i);if(mg){const b=fuzzyName(x.slice(mg[0].length));return b?'Mega-'+b:null}
 const q=nrm(x);if(q.length<3)return null;nameMap();
 if(NAMES.has(q))return NAMES.get(q);let best=null,bd=1e9;for(const[k,v]of NAMES){if(Math.abs(k.length-q.length)>2)continue;const d=lev(q,k);if(d<bd){bd=d;best=v}}
 const L=Math.max(q.length,nrm(best||'').length);return best&&q.length>=4&&bd<=(L<=4?1.5:L===5?2:0.3*L)?best:null}
window.fuzzyName=fuzzyName;
// Trainer-/Energie-Namen (trainers.js), mehrteilig; gleiche strenge Schwelle, Pokémon haben Vorrang
let TMAP=null;function tMap(){if(!TMAP){TMAP=new Map();for(const r of (window.TNAMES||[]))for(const n of r.slice(0,2))if(n&&nrm(n).length>=4&&!TMAP.has(nrm(n)))TMAP.set(nrm(n),n);
 const ET={Pflanzen:'Grass',Feuer:'Fire',Wasser:'Water',Elektro:'Lightning',Psycho:'Psychic',Kampf:'Fighting',Finsternis:'Darkness',Metall:'Metal',Fee:'Fairy'};
 for(const[d,e]of Object.entries(ET)){for(const n of[d+'-Energie','Basis-'+d+'-Energie'])TMAP.set(nrm(n),n);for(const n of[e+' Energy','Basic '+e+' Energy'])if(!TMAP.has(nrm(n)))TMAP.set(nrm(n),n)}}return TMAP}
function trainerName(l){const w=String(l||'').replace(/[^A-Za-zÄÖÜäöüßé'’.\- ]/g,' ').trim().split(/\s+/).filter(Boolean);tMap();let best=null,bd=1e9,bL=0;
 for(let n=Math.min(5,w.length);n>=1;n--){const q=nrm(w.slice(0,n).join(' '));if(q.length<4)continue;if(TMAP.has(q))return TMAP.get(q);
  for(const[k,v]of TMAP){if(Math.abs(k.length-q.length)>2||k[0]!==q[0]&&!ocrSim(k[0],q[0]))continue;const d=lev(q,k);if(d<bd){bd=d;best=v;bL=Math.max(q.length,k.length)}}}
 return best&&bd<=(bL<=4?1:bL===5?2:Math.min(3,0.2*bL))?best:null}
const anyName=l=>{const w=String(l||'').replace(/[^A-Za-zÄÖÜäöüßé\- ]/g,' ').trim().split(/\s+/).filter(x=>x&&!/^(BASIS|BASIC|STAGE|PHASE|KP|HP|TRAINER|ITEM|ARTEFAKT|UNTERST[ÜU]TZER|SUPPORTER|STADION|STADIUM|ENERGIE|ENERGY)$/.test(x));
 const ex=x=>{const q=nrm(x);return q.length>=3&&nameMap().get(q)};const j=w.length>1&&w[0].length<=3&&w[1].length<=3?w[0]+w[1]:'';
 let p=w.map(ex).find(Boolean);if(p)return addSfx(p,l);const tq=nrm(w.join(' '));tMap();for(let n=Math.min(5,w.length);n>=1;n--){const k=nrm(w.slice(0,n).join(' '));if(TMAP.has(k))return TMAP.get(k)}
 p=(j&&fuzzyName(j))||w.map(fuzzyName).find(Boolean);if(p)return addSfx(p,l);return window._trn===false?null:trainerName(w.join(' '))};
window.trainerName=trainerName;
function addSfx(n,l){if(SUF.test(n))return n;const m=(l||'').match(/\b(VMAX|VSTAR|V-UNION|GX|ex|EX|V)\b/);return m?n+' '+m[1]:n}
const knownName=x=>!!DE[x.toLowerCase()]||Object.values(DE).some(v=>v.toLowerCase()===x.toLowerCase());
// Name aus dem Namensstreifen oben links (nach BASIS/PHASE), Energie-Karten erkennen
function parseTop(t){t=t||'';window._trn=/\b(TRAINER|UNTERSTÜTZER|UNTERSTUTZER|ARTEFAKT|ITEM|STADION|STADIUM|SUPPORTER|WERKZEUG|TOOL|ENERGIE|ENERGY)\b/.test(t);const e=t.match(/basis[^\n]{0,4}?([A-Za-zäöü]{4,})?[^\n]{0,4}?energie/i)||t.match(/basic\s+(\w+)\s+energy/i);
 if(e||/basis-?\s*energie/i.test(t)||/ENERGIE\b/.test(t)&&!/\bKP\b|\d{2,3}\s*$/m.test(t)){let ty=e&&e[1]&&ENERGY[e[1].toLowerCase()];if(!ty)ty=window.energyHue||'';if(ty)return{name:'',energy:ty};if(/basis.{0,6}energie/i.test(t))return{name:'',energy:window.energyHue||'Psychic',guess:1}}
 const lines=t.split('\n').map(l=>l.trim()).filter(Boolean);
 for(const l of lines.slice(0,4)){const w=l.replace(/[^A-Za-zÄÖÜäöüßé\- ]/g,' ').split(/\s+/).map(x=>x.replace(/^-+|-+$/g,'')).filter(x=>x.length>=3&&/[a-zäöü]/.test(x)&&okName(x)&&!/^(BASIS|BASIC|STAGE|PHASE|KP|HP|PV|PS|Entwickelt|Evolves|aus|from)$/i.test(x));
  const fz=anyName(l);if(fz)return{name:fz,energy:''};
  if(w.length){const k=w.map(fuzzyName).find(Boolean);if(k)return{name:addSfx(k,l),energy:''}}}
 return{name:'',energy:''}}
// Set über Set-Code (z.B. 30C) + Gesamtzahl
const d1=(a,b)=>{a=String(a);b=String(b);return a.length===b.length&&[...a].filter((x,i)=>x!==b[i]).length===1};// eine Ziffer verlesen (8↔6)
// Plausibilität: Nummer ≤ Gesamtzahl (Secret Rares bis ×1,6 bei ≥50), Gesamtzahl muss ein bekanntes Set sein
function numOK(num){const[a,b]=String(num||'').split('/').map(x=>parseInt(x,10));if(!(a>0&&b>0))return false;if(!(a<=b||b>=50&&a<=b*1.6))return false;
 return !SETS.length||Object.values(JPSETS).includes(b)||Object.values(SETCODES).some(x=>x.total===b)||SETS.some(x=>x.printedTotal===b)}
function findSet(t,num){const tot=(num||'').split('/')[1];const codes=Object.assign({},SETCODES);for(const s of SETS)if(s.ptcgoCode&&!codes[s.ptcgoCode])codes[s.ptcgoCode]={id:s.id,name:s.name,total:s.printedTotal};
 for(const m of (t||'').matchAll(/\b([0-9A-Z]{2,4})\b/g)){const c=m[1].replace(/^3O/,'30');const s=codes[c];if(s&&/\d/.test(c)&&/[A-Z]/.test(c)&&(!tot||!s.total||+tot===s.total||d1(tot,s.total)))return s}
 if(tot)for(const c in SETCODES)if(SETCODES[c].total===+tot)return SETCODES[c];return null}
// Energietyp grob über Farbton der Kartenmitte
function hueType(src){try{const W=src.width,H=src.height,c=document.createElement('canvas');c.width=40;c.height=40;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,W*.2,H*.25,W*.6,H*.45,0,0,40,40);
 const d=g.getImageData(0,0,40,40).data;let r=0,gg=0,b=0;for(let i=0;i<d.length;i+=4){r+=d[i];gg+=d[i+1];b+=d[i+2]}const n=d.length/4;r/=n;gg/=n;b/=n;const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);
 if(mx-mn<20)return mx<90?'Darkness':'Metal';let h;if(mx===r)h=((gg-b)/(mx-mn)+6)%6;else if(mx===gg)h=(b-r)/(mx-mn)+2;else h=(r-gg)/(mx-mn)+4;h*=60;
 return h<20||h>=345?'Fire':h<45?'Fighting':h<70?'Lightning':h<160?'Grass':h<250?'Water':'Psychic'}catch(e){return''}}
// Worker vorwärmen, sobald der Scan-Tab geöffnet wird
function fpWarm(){try{if(typeof window.matchCardImageReady==='function'&&!fpWarm.d){fpWarm.d=1;window.matchCardImageReady('').catch(()=>{fpWarm.d=0})}}catch(e){}}
function warmOCR(){fpWarm();if(!window.Tesseract||window._warm)return;window._warm=1;['nm','deu+eng','jpn','num','dig'].forEach(l=>getW(l).catch(()=>{delete ocrW[l];window._warm=0}))}
function ptcgId(code){code=(code||'').trim();if(!code)return'';for(const c in SETCODES){const s=SETCODES[c];if(s.tdx===code||s.id===code||c===code||s.name===code)return s.id}const s=(window.SETS||SETS||[]).find(x=>x.id===code||x.ptcgoCode===code);return s?s.id:''}
function scanPick(r){const P=$('#scanPick');P.hidden=false;const noNum=r.name&&!r.number;
 const jpNF=r.lang==='JP'&&r.name;const q=[r.name,r.full||r.number,r.set].filter(Boolean).join(' ');
 const H=r.hit;P.innerHTML=jpNF?`<b>✅ ${esc(r.name)}${r.jp?' ('+esc(r.jp)+')':''}${r.set||r.full?' · '+esc([r.set,r.full].filter(Boolean).join(' ')):''} · JP${H?'':' – nicht in der Datenbank'}</b>${H?`<div class="jphit">${phImg(H.image&&imgU(H.image,'high'),H.name||r.name,H.localId||r.full||r.number,'dph')}<div><b>${esc(H.name)}</b><br><span class="muted small">${esc((H.set&&(H.set.name||H.set.id))||'')} · ${esc(H.localId||'')}</span><br><span class="muted small">${H.best?esc(H.label):'Noch kein Preis'}</span></div></div>`:''}<p class="muted small">${r.full?'':'Nummer fehlt – bitte eintippen. '}${H?(H.image?'Offizielles Kartenbild gefunden':'Karte gefunden (noch kein Bild)')+' – „Hinzufügen“ übernimmt Name, Nummer, Set, Sprache &amp; Bild.':'Japanische Karte: über „Manuell hinzufügen“ anlegen (Felder sind vorausgefüllt).'} Preise vergleichen: <a href="https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(q)}" target="_blank" rel="noopener">Cardmarket ↗</a> · <a href="https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(q+' japanisch')}" target="_blank" rel="noopener">eBay ↗</a>. Unten EN/DE-Karten zum Bildvergleich.</p>
 `+`<label>Name<input id="spName" value="${esc(r.name||'')}"></label><label>Nummer<input id="spNum" value="${esc(r.full||r.number||'')}" placeholder="z.B. 137/103" inputmode="numeric"></label><label>Set-Code (optional)<input id="spSet" value="${esc(r.set||'')}"></label><label>Sprache<select id="spLang">${LANGS.map(l=>`<option${l==='JP'?' selected':''}>${l}</option>`).join('')}</select></label><div class="row wrap"><button type="button" class="primary" id="spMan">${H?'＋ Hinzufügen':'Manuell hinzufügen'}</button><button type="button" id="spGo">Suchen</button><button type="button" id="spNoNum">Ohne Nummer suchen</button><button type="button" id="spX">Verwerfen</button></div><div id="spGrid" class="spgrid"></div>`:`<b>${r.weak&&r.name?'⚠️ Unsicher: „'+esc(r.name)+'“ – bitte unten das richtige Bild antippen':!r.name&&!r.energy?'⚠️ Name nicht erkannt':r.confident&&r.number?'✅ Erkannt: '+esc(r.name)+(r.jp?' ('+esc(r.jp)+')':'')+' · '+esc(r.full||r.number):noNum?'✅ Erkannt: '+esc(r.name)+(r.jp?' ('+esc(r.jp)+')':'')+' – Nummer fehlt':'⚠️ Nicht sicher erkannt'}</b><p class="muted small">${noNum?'Die Nummer konnte nicht gelesen werden. Bitte eintippen oder ohne Nummer suchen.':'Bitte prüfen oder ergänzen – es wird nichts automatisch übernommen.'}</p>
 <label>Name<input id="spName" value="${esc(r.name||'')}" placeholder="z.B. Glurak / Charizard"></label><label>Nummer<input id="spNum" value="${esc(r.full||r.number||'')}" placeholder="Nummer unten links, z.B. 137/103" inputmode="numeric"></label>
 <label>Set-Code (optional)<input id="spSet" value="${esc(r.set||'')}" placeholder="z.B. s8a"></label>
 <label>Sprache<select id="spLang">${LANGS.map(l=>`<option${l===(r.lang||'DE')?' selected':''}>${l}</option>`).join('')}</select></label>
 <div class="row wrap"><button type="button" class="primary" id="spGo">Suchen</button><button type="button" id="spNoNum">Ohne Nummer suchen</button><button type="button" id="spMan"${r.lang==='JP'?' class="primary"':''}>Manuell hinzufügen</button><button type="button" id="spX">Verwerfen</button></div>
 <div id="spGrid" class="spgrid"></div>
 ${r.lang==='JP'?'<p class="muted small">Japanische Sets sind nicht in der Preisdatenbank – „Manuell hinzufügen“ legt die Karte mit Name, Nummer, Set &amp; Sprache an, den Preis trägst du selbst ein.</p>':''}`;
 const v=()=>({name:$('#spName').value,number:$('#spNum').value,set:$('#spSet').value,lang:$('#spLang').value});
 $('#spGo').onclick=()=>{const x=v();P.hidden=true;applyScan({name:x.name,jp:r.jp,number:x.number.split('/')[0],full:x.number,set:x.set,setId:ptcgId(x.set)},x.lang)};
 const G=$('#spGrid');let gT=0,gN=0;
 async function grid(user){const n=++gN,name=$('#spName').value.trim();if(name.length<3||!window.Prices){G.innerHTML='';return}G.innerHTML='<p class="muted small">Lädt Karten…</p>';
  let lang=($('#spLang').value||'DE').toLowerCase();if(lang==='jp')lang='ja';let L=[];
  const get=async(q,lg)=>Prices.suggest?(await Prices.suggest(q,lg,60)||[]).map(c=>({id:c.id,localId:c.localId,name:c.name,image:(c.img||'').replace(/\/(low|high)\.webp$/,'')})).filter(c=>c.image||String(c.id).startsWith('jp:')):(await Prices.search(q,lg)||[]).filter(c=>c.image);
  const swg=setWant($('#spSet').value),setL=[];if(swg.length){{const LS=await tdxSetList('en').catch(()=>[]);for(let i=swg.length-1;i>=0;i--){if(/\s/.test(swg[i])){const q=swg[i].toLowerCase(),s=(LS||[]).find(x=>(x.name||'').toLowerCase()===q||(x.name||'').toLowerCase().includes(q));if(s)swg[i]=s.id;else swg.splice(i,1)}}}for(const sid of swg)for(const lg of [lang,'en']){try{const j=await (await fetch('https://api.tcgdex.net/v2/'+lg+'/sets/'+encodeURIComponent(sid))).json();const q=nrm(name);(j.cards||[]).forEach(c=>{const nn=nrm(c.name);if(c.image&&q&&(nn.startsWith(q)||q.startsWith(nn))&&!setL.some(x=>x.id===c.id))setL.push({id:c.id,localId:c.localId,name:c.name,image:c.image})})}catch(e){}if(setL.length)break}}
  try{L=await get(name,lang);if(!L.length&&lang!=='en'&&!Prices.suggest)L=await get(name,'en');if(!L.length&&name.length>2)L=await get(name.slice(0,2),lang)}catch(e){}
  L=setL.concat(L.filter(c=>!setL.some(x=>x.id===c.id)));if(n!==gN)return;if(!L.length){G.innerHTML=user?'<p class="muted small">Keine Bilder gefunden</p>':'';return}
  const SR=['me','sv','swsh','sm','xy','bw','hgss','pl','dp','ex','ecard','neo','gym','base'],sr=c=>{const i=SR.indexOf((c.image.match(/\/[a-z]{2}\/([^/]+)\//)||[])[1]);return i<0?SR.length:i};const sw=setWant($('#spSet').value),inS=c=>{const sid=sidOf(c.id).toLowerCase();return sw.length&&sw.includes(sid)?0:1};L=L.map((c,i)=>[c,i]).sort((x,y)=>inS(x[0])-inS(y[0])||sr(x[0])-sr(y[0])||y[1]-x[1]).map(x=>x[0]).slice(0,40);G.innerHTML=swg.length&&!setL.length&&!L.some(c=>inS(c)===0)?`<p class="muted small" style="grid-column:1/-1">Im Set „${esc($('#spSet').value)}“ ist keine Karte „${esc(name)}“ in der Datenbank – ähnliche Karten:</p>`:'';
  for(const c of L){const sid=sidOf(c.id),b=document.createElement('button');b.type='button';b.className='spThumb';
   b.innerHTML=`${phImg(c.image&&imgU(c.image),c.name,c.localId,'phthumb')}<span>${esc(sid)} · ${esc(c.localId)}</span>`;
   b.onclick=()=>{$('#spNum').value=c.localId;$('#spSet').value=sid;$('#spGo').click()};G.append(b)}}
 if(r.name&&(!r.number||!r.confident||jpNF))grid();
 $('#spName').addEventListener('input',()=>{clearTimeout(gT);gT=setTimeout(()=>grid(true),400)});$('#spSet').addEventListener('input',()=>{clearTimeout(gT);gT=setTimeout(()=>grid(true),400)});
 $('#spNoNum').onclick=()=>{const x=v();P.hidden=true;applyScan({name:x.name,jp:r.jp,number:'',set:x.set},x.lang);window.pendingScan.number=x.number};
 $('#spMan').onclick=()=>{const x=v();manualAdd({...x,name:r.jp&&x.name===r.name?`${x.name} (${r.jp})`:x.name,img:r.hit?imgU(r.hit.image,'high'):''})};
 $('#spX').onclick=()=>P.hidden=true;
 if(noNum)setTimeout(()=>{const n=$('#spNum');n.focus();n.scrollIntoView({block:'center'})},50)}
const imgU=(u,sz='low')=>!u?'':/\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(u)?u:u+'/'+sz+'.webp';const sidOf=id=>{const s=String(id||'').replace(/^jp:/,'');return s.slice(0,s.lastIndexOf('-'))};
async function jpHit(r){if(!window.Prices||r.lang!=='JP')return null;const num=String(r.number||'').replace(/^0+/,'')||null;
 for(const n of [r.jp,r.name,r.en].filter(Boolean)){try{const c=await Prices.lookup(n,'ja',r.set||null,num);if(c&&c.id&&(!num||String(c.localId||'').replace(/^0+/,'')===num))return c}catch(e){}}
 try{const L=await Prices.suggest(r.jp||r.name,'ja',60)||[];const c=L.find(c=>String(c.id).startsWith('jp:')&&(!r.set||sidOf(c.id).toLowerCase()===String(r.set).toLowerCase())&&(!num||String(c.localId||'').replace(/^0+/,'')===num));if(c)return{id:c.id,name:c.name,localId:c.localId,set:c.set,image:c.img}}catch(e){}return null}
function scanResult(r){if(window.scanAbandon)return;try{if(r&&r.confident&&!r.conflict&&r.name&&(r.number||r.energy))showConfirm(r)}catch(e){}scanPrefetch({name:r.name,number:r.energy?'':r.number},r.lang);msOff();window.lastScan=r;if(batchOn()&&r.confident&&r.name&&r.number&&r.lang!=='JP'&&!r.energy){$('#scanPick').hidden=true;$('#scanbox')?.classList.add('hasres');trayAdd(r,r.lang);return}$('#scanbox')?.classList.add('hasres');const st=$('#scanStatus2');
 st.textContent=`Erkannt: ${r.name||'?'}${r.jp?' ('+r.jp+')':''} · Nr. ${r.full||r.number||'?'}${r.lang?' · '+r.lang:''}`;
 if(r.conflict||(!r.number&&!r.energy&&!(r.lang==='JP'&&r.name&&r.jp))){scanPick(r);noMatchSheet(r);return}if(r.confident&&(r.number||r.energy)&&r.lang!=='JP'){$('#scanPick').hidden=true;applyScan(r,r.lang)}else if(r.lang==='JP'&&r.name){const t=st.textContent;st.textContent='⏳ Suche japanische Karte…';jpHit(r).then(h=>{r.hit=h;st.textContent=t;scanPick(r)})}else scanPick(r)}
function clearScanUI(){try{['#qName','#qNum'].forEach(s=>{const i=$(s);if(i)i.value=''});$('#nmSheet')?.remove();document.querySelectorAll('.retake,.nextscan').forEach(x=>x.remove());const R=$('#results');if(R&&R.querySelector('.scanpick'))R.innerHTML='';window.pendingScan=null;window.lastScan=null;window.scanPart=null;document.body.classList.remove('hassb');clearInterval(window._sbp)}catch(e){}}
async function handleFile(f){clearScanUI();$('#scanbox')?.classList.remove('hasres');window.scanLang='';window.pendingScan=null;window.lastScan=null;const st=$('#scanStatus2');$('#scanPick').hidden=true;$('#scanPick').innerHTML='';st.textContent='';const lt=$('#liveText');if(lt)lt.textContent='';const ss=$('#scanStatus');if(ss)ss.textContent='';
 if(!f){st.textContent='Kein Bild ausgewählt.';return}
 if(!window.Tesseract){st.textContent='❌ Texterkennung nicht geladen – Internet prüfen und neu laden.';return}
 $('#scanbox').classList.add('busy');msArm();
 try{const c=await toCanvas(f);const r=await analyze(c,m=>{if(!window.anaCut)st.textContent='⏳ '+m});scanResult(r)}
 catch(err){if(!window.scanAbandon)st.textContent='❌ Fehler bei der Erkennung: '+(err&&err.message||err)}finally{msOff();$('#scanbox').classList.remove('busy')}}
$('#scanBtn').addEventListener('click',e=>{e.preventDefault();stopLive();$('#scanStatus2').textContent='';const i=$('#scanFile');i.value='';i.click()});
$('#livePhoto').addEventListener('click',e=>{e.preventDefault();if(!live.stream)return;liveShoot()});$('#uploadBtn').addEventListener('click',e=>{e.preventDefault();stopLive();$('#scanStatus2').textContent='';const i=$('#uploadFile');i.value='';i.click()});
['#scanFile','#uploadFile'].forEach(id=>$(id).addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];handleFile(f).finally(()=>{e.target.value=''})}));
// Live-Scan
let live={stream:null,timer:null,busy:false,last:null,torch:false,nameOnly:0,nameKey:''};
function camErr(msg){const st=$('#scanStatus2');st.innerHTML='';const d=document.createElement('div');d.className='camerr';d.textContent='⚠️ '+msg;st.appendChild(d)}
function camMsg(e){const n=e&&e.name||'';if(n==='NotAllowedError'||n==='SecurityError')return 'Kamera-Zugriff verweigert. Bitte in Chrome auf das Schloss-Symbol neben der Adresse tippen → Berechtigungen → Kamera erlauben, dann neu laden. Alternativ „Bild hochladen“.';
 if(n==='NotFoundError'||n==='OverconstrainedError')return 'Keine passende Kamera gefunden.';if(n==='NotReadableError'||n==='AbortError')return 'Kamera ist von einer anderen App belegt. Andere Kamera-Apps schließen und erneut versuchen.';return 'Kamera konnte nicht gestartet werden: '+(e&&e.message||e)}
function startLive(){fpWarm();const st=$('#scanStatus2');const sp=$('#scanPick');if(sp)sp.hidden=true;
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){camErr('Kamera wird von diesem Browser nicht unterstützt (HTTPS nötig).');return Promise.resolve()}
 if(live.stream||live.starting)return Promise.resolve();live.starting=true;st.textContent='Kamera wird geöffnet…';
 // getUserMedia direkt im Klick-Handler (kein await davor), Fallback auf einfachere Constraints
 const gum=c=>navigator.mediaDevices.getUserMedia(c);
 let sv='';try{sv=localStorage.getItem(CAMKEY)||''}catch(e){}
 const p=(sv?gum({video:{deviceId:{exact:sv},width:{ideal:1920},height:{ideal:1080}},audio:false}).catch(e=>{if(e&&(e.name==='NotAllowedError'||e.name==='SecurityError'))throw e;try{localStorage.removeItem(CAMKEY)}catch(x){}return Promise.reject(e)}):Promise.reject(0))
  .catch(e=>{if(e&&(e.name==='NotAllowedError'||e.name==='SecurityError'))throw e;return gum({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false})})
  .catch(e=>{if(e&&(e.name==='NotAllowedError'||e.name==='SecurityError'))throw e;return gum({video:{facingMode:'environment'},audio:false})})
  .catch(e=>{if(e&&(e.name==='NotAllowedError'||e.name==='SecurityError'))throw e;return gum({video:true,audio:false})});
 return p.then(s=>{live.starting=false;live.stream=s;return startLive2()},e=>{live.starting=false;console.warn('getUserMedia',e);camErr(camMsg(e))})}
async function startLive2(){const st=$('#scanStatus2');
 const v=$('#liveVideo');v.muted=true;v.setAttribute('playsinline','');v.setAttribute('autoplay','');v.srcObject=live.stream;$('#scanbox').classList.add('live');try{await v.play()}catch(e){console.warn('play',e)}$('#scanbox').classList.add('live');$('#liveText').textContent='';st.textContent=window.Tesseract?'Kamera läuft, Texterkennung wird geladen…':'Kamera läuft – Texterkennung lädt noch (Internet?)…';
 const tr=live.stream.getVideoTracks()[0];let caps={};try{caps=tr.getCapabilities?.()||{}}catch(e){}$('#torchBtn').hidden=!caps.torch;
 if(await camSetup(tr,caps))return startLive2();
 try{live.ic=window.ImageCapture?new ImageCapture(tr):null}catch(e){live.ic=null}live.icBad=false;
 $('.frame span').textContent='Näher ran – Karte füllt den Rahmen · Tippen = scharfstellen';
 window.scanLang='';window.pendingScan=null;live.last=null;live.nameOnly=0;live.nameKey='';live.tries=0;live.best=null;live.nm=null;live.nb=null;if(window.Tesseract){try{getWorker().catch(()=>{});getW('num').catch(()=>{})}catch(e){}}lStat('Karte in den Rahmen legen und 📸 Foto drücken');live.shooting=false;const pb=$('#livePhoto');if(pb)pb.disabled=false}
function stopLive(){live.switched=false;try{LV.hist=[];LV.t0=0}catch(e){}clearInterval(live.timer);live.timer=null;if(live.stream){live.stream.getTracks().forEach(t=>t.stop());live.stream=null}
 const v=$('#liveVideo');if(v)v.srcObject=null;$('#scanbox')?.classList.remove('live');live.torch=false;live.ic=null;const fs=$('.frame span');if(fs)fs.textContent='Karte im Rahmen platzieren'}
const wto=(p,ms,m)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error(m||'Zeitüberschreitung')),ms))]);
function lStat(t){$('#scanStatus2').textContent=t}
function needOCR(){if(window.Tesseract)return true;if(!window._tLoad){window._tLoad=1;const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=()=>{window._tLoad=0};s.onerror=()=>{window._tLoad=0};document.head.append(s)}return false}
// Kamera = nur Sucher; nur '📸 Foto' löst aus
async function liveTick(){return liveShoot()}
async function liveShoot(){clearScanUI();const btn=$('#livePhoto');if(!live.stream||live.shooting)return;const v=$('#liveVideo');live.shooting=true;const my=live.shotId=(live.shotId||0)+1;
 if(btn){btn.disabled=true;btn.classList.remove('pulse')}camFlash();navigator.vibrate?.(30);lStat('📸 Foto aufgenommen – lese Karte…');
 try{let hi=null;try{hi=await wto(grabStill(v),2500,'Foto-Zeitüberschreitung')}catch(e){console.warn(e)}
  if(!hi&&v.videoWidth){hi=document.createElement('canvas');hi.width=v.videoWidth;hi.height=v.videoHeight;hi.getContext('2d').drawImage(v,0,0,hi.width,hi.height)}
  if(!hi)throw new Error('Kein Kamerabild – bitte kurz warten und erneut drücken');
  const blob=await new Promise(res=>{try{hi.toBlob(res,'image/jpeg',0.95)}catch(e){res(null)}});const c=blob?await toCanvas(blob):hi;
  if(!needOCR()){lStat('⏳ Texterkennung lädt…');for(let i=0;i<60&&!window.Tesseract;i++)await new Promise(r=>setTimeout(r,500));if(!window.Tesseract)throw new Error('Texterkennung lädt nicht (Internet?)')}
  lStat('🔍 Foto aufgenommen – lese Karte…');msArm();
  const r=await wto(analyze(c,m=>{if(!window.scanAbandon&&!window.anaCut)$('#scanStatus2').textContent='⏳ '+m}),60000,'Erkennung dauert zu lange');msOff();if(my!==live.shotId||window.scanAbandon)return;
  if(batchOn()&&r.confident&&r.name&&r.number&&r.lang!=='JP'){scanResult(r);live.shooting=false;lStat($('#scanStatus2').textContent);return}stopLive();if(!r.number&&!r.energy){navigator.vibrate?.([80,60,80]);scanResult(r);retakePrompt('Nummer unten links nicht lesbar – bitte ganze Karte in den Rahmen und neu aufnehmen.');return}window.lastScan=r;
  if(r.confident&&r.name&&(r.number||r.energy)){navigator.vibrate?.(200);scanResult(r)}
  else{navigator.vibrate?.([80,60,80]);scanResult(r)}}
 catch(e){console.warn('shoot',e);lStat('❌ '+(e&&e.message||e)+' – näher ran / mehr Licht, dann erneut 📸 Foto');if(btn)btn.classList.add('pulse');if(/Texterkennung/.test(e&&e.message||'')){delete ocrW['deu+eng'];delete ocrW.num}}
 finally{live.shooting=false;if(btn)btn.disabled=false}}
function camFlash(){const w=$('#scanbox .camwrap');if(!w)return;const f=document.createElement('div');f.className='camflash';w.append(f);setTimeout(()=>f.remove(),450)}
// Standbild: bevorzugt Canvas aus dem laufenden Video (stört den Stream nicht); takePhoto nur bei kleinem Videobild; Magenta/Schwarz-Frames verwerfen
function frameBad(c){try{const k=document.createElement('canvas');k.width=32;k.height=32;const g=k.getContext('2d',{willReadFrequently:true});g.drawImage(c,0,0,32,32);const d=g.getImageData(0,0,32,32).data;let r=0,G=0,b=0;for(let i=0;i<d.length;i+=4){r+=d[i];G+=d[i+1];b+=d[i+2]}const n=d.length/4;r/=n;G/=n;b/=n;
 window.frameDbg=[r,G,b].map(Math.round);if(r+G+b<36)return 'dunkel';if(r>60&&b>60&&G<.6*Math.min(r,b))return 'magenta';return ''}catch(e){return ''}}
function vidFrame(v){if(!v.videoWidth)return null;const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0,c.width,c.height);return c}
async function grabStill(v){try{await wto(focusPass(),1200,'focus')}catch(e){}if(!live.stream)return null;
 let c=null;for(let i=0;i<4;i++){c=vidFrame(v);if(c&&!frameBad(c))break;await new Promise(r=>setTimeout(r,250))}
 if(c&&!frameBad(c)&&c.width>=1000)return c;
 if(live.ic&&!live.icBad){try{const b=await wto(live.ic.takePhoto(),3000,'takePhoto');if(b&&b.size){const p=await toCanvas(b,1920);if(!frameBad(p))return p}}catch(e){console.warn('takePhoto',e)}live.icBad=true}
 return c}
const CAMKEY='kartenapp_cam';
const isBackLbl=l=>/back|rear|rück|environment|facing back|\b0\b/i.test(l),isBadLbl=l=>/ultra|wide|weit|tele|macro|makro|depth|tiefe|front|user/i.test(l);
async function backCams(){try{const d=(await navigator.mediaDevices.enumerateDevices()).filter(x=>x.kind==='videoinput');const b=d.filter(x=>!/front|user|selfie/i.test(x.label));
 return (b.length?b:d).sort((x,y)=>((isBadLbl(x.label)?2:0)-(isBackLbl(x.label)?1:0))-((isBadLbl(y.label)?2:0)-(isBackLbl(y.label)?1:0)))}catch(e){return[]}}
// true = Stream wurde gewechselt (startLive2 erneut)
async function camSetup(tr,caps){const fm=caps.focusMode||[];live.fm=fm;live.caps=caps;
 if(fm.includes('continuous')){try{await tr.applyConstraints({advanced:[{focusMode:'continuous'}]})}catch(e){}}
 const cams=await backCams();live.cams=cams;const sw=$('#camSwitch');if(sw)sw.hidden=cams.length<2;
 if(!fm.length&&!live.switched){live.switched=true;let sv='';try{sv=localStorage.getItem(CAMKEY)||''}catch(e){}
  const cur=tr.getSettings?.().deviceId,lbl=tr.label||'',best=cams[0];
  if(!sv&&best&&best.deviceId&&best.deviceId!==cur&&(isBadLbl(lbl)||!isBackLbl(lbl))){if(await camOpen(best.deviceId))return true}
}
 return false}
async function camOpen(id){try{const s=await navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:id},width:{ideal:1920},height:{ideal:1080}},audio:false});
 if(live.stream)live.stream.getTracks().forEach(t=>t.stop());live.stream=s;return true}catch(e){console.warn('camOpen',e);return false}}
async function camNext(){const cams=live.cams||await backCams();if(cams.length<2||!live.stream)return;const cur=live.stream.getVideoTracks()[0].getSettings?.().deviceId;
 const i=cams.findIndex(c=>c.deviceId===cur),n=cams[(i+1)%cams.length];live.switched=true;
 if(await camOpen(n.deviceId)){try{localStorage.setItem(CAMKEY,n.deviceId)}catch(e){}lStat('📷 Kamera: '+(n.label||'Kamera '+((i+1)%cams.length+1)));clearInterval(live.timer);await startLive2()}}
async function doFocus(x,y,wait){const tr=live.stream?.getVideoTracks()[0];if(!tr)return;let caps={};try{caps=tr.getCapabilities?.()||{}}catch(e){}const fm=caps.focusMode||[];const adv={};
 if(caps.pointsOfInterest&&x!=null)adv.pointsOfInterest=[{x,y}];
 if(fm.includes('single-shot'))adv.focusMode='single-shot';else if(fm.includes('continuous'))adv.focusMode='continuous';
 if(!adv.focusMode)return;try{await tr.applyConstraints({advanced:[adv]})}catch(e){console.warn('focus',e)}
 if(wait)await new Promise(r=>setTimeout(r,wait));
 if(adv.focusMode!=='continuous'&&fm.includes('continuous'))setTimeout(()=>{const t=live.stream?.getVideoTracks()[0];t&&t.applyConstraints({advanced:[{focusMode:'continuous'}]}).catch(()=>{})},wait?300:1500)}
function focusPass(){const tr=live.stream?.getVideoTracks()[0];let fm=[];try{fm=tr.getCapabilities?.().focusMode||[]}catch(e){}return fm.includes('single-shot')?doFocus(null,null,600):Promise.resolve()}
function focusRing(px,py){const w=$('#scanbox .camwrap');if(!w)return;const r=w.getBoundingClientRect(),d=document.createElement('div');d.className='focusring';d.style.left=(px-r.left)+'px';d.style.top=(py-r.top)+'px';w.append(d);setTimeout(()=>d.remove(),900)}
$('#liveVideo').addEventListener('click',e=>{if(!live.stream)return;const r=e.currentTarget.getBoundingClientRect();focusRing(e.clientX,e.clientY);$('#scanStatus2').textContent='Scharfstellen…';doFocus((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,0)});
$('#camSwitch')?.addEventListener('click',e=>{e.preventDefault();camNext()});
$('.frame')?.addEventListener('click',e=>{$('#liveVideo').dispatchEvent(new MouseEvent('click',{clientX:e.clientX,clientY:e.clientY}))});
$('#liveBtn').onclick=e=>{e.preventDefault();startLive()};$('#liveCancel').onclick=()=>{live.shotId=(live.shotId||0)+1;stopLive();$('#scanStatus2').textContent='Live-Scan abgebrochen.'};
$('#torchBtn').onclick=async()=>{const tr=live.stream?.getVideoTracks()[0];if(!tr)return;live.torch=!live.torch;try{await tr.applyConstraints({advanced:[{torch:live.torch}]})}catch(e){}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLive()});
window.detectLang=detectLang;
function parseOCR(t){const m=t.match(/(\d{1,3})\s*\/\s*(\d{2,3})/)||t.match(/\b([A-Z]{2,5}(?:-[A-Z]{1,2})?\d{0,2})\s*[-–]?\s*(\d{2,3})\b/);const lines=t.split('\n').map(l=>l.trim()).filter(Boolean);
 let name='';for(const l of lines.slice(0,6)){const w=l.replace(/[^A-Za-zÄÖÜäöüßé\- ]/g,' ').split(/\s+/).filter(x=>x.length>=3&&okName(x)&&!/^(BASIS|BASIC|STAGE|PHASE|KP|HP|PV|PS|Entwickelt)$/i.test(x));
  {const fz=anyName(l);if(fz){name=fz;break}}
  if(w.length){const kn=w.map(fuzzyName).find(Boolean);if(kn){name=addSfx(kn,l);break}}}
 const number=m?(/^\d/.test(m[1])?m[1].replace(/^0+(?=\d)/,''):m[2].replace(/^0+(?=\d)/,'')):'';
 return{name,number}}
window.parseOCR=parseOCR;

// Export / Import
$('#exportBtn').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='kartenapp-'+today()+'.json';a.click()};
$('#importFile').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!d.collection)throw 0;S=d;S.snapshots??=[];S.wishlist??=[];S.settings??={cur:'EUR',tf:30};S.trade??={give:[],get:[]};save();render();alert('Import erfolgreich')}catch(x){alert('Ungültige Datei')}};
$('#resetBtn').onclick=()=>{if(confirm('Wirklich alle Daten löschen?')){localStorage.removeItem(K);S=load();S.settings={cur:'EUR',tf:30};S.trade={give:[],get:[]};save();render()}};

if('serviceWorker' in navigator){let rl=false,want=false;
 const APPV=(()=>{const s=[...document.scripts].find(x=>/app\.js\?v=\d+/.test(x.src));return s?'kartenapp-v'+s.src.match(/v=(\d+)/)[1]:''})();window.APPV=APPV;
 const swVer=w=>new Promise(res=>{try{const ch=new MessageChannel();const t=setTimeout(()=>res(''),2500);ch.port1.onmessage=e=>{clearTimeout(t);res(e.data&&e.data.version||'')};w.postMessage({type:'VERSION'},[ch.port2])}catch(e){res('')}});
 const upd=async w=>{if(!w||!navigator.serviceWorker.controller)return;const v=await swVer(w);window.swWaitVer=v;if(v&&v===APPV){/* gleiche Version (nur Nicht-Versions-Änderung) → still aktivieren */try{w.postMessage({type:'SKIP_WAITING'})}catch(e){}return}try{if(sessionStorage.getItem('updX')===(v||'?'))return}catch(e){}let b=$('#updBanner');if(!b){b=document.createElement('div');b.id='updBanner';b.setAttribute('role','status');b.innerHTML='<button type="button" class="updgo">🔄 Neue Version verfügbar – tippen zum Aktualisieren</button><button type="button" class="updx" aria-label="Ausblenden">✕</button>';document.body.append(b)}b.hidden=false;document.body.classList.add('hasupd');
  b.querySelector('.updx').onclick=()=>{b.hidden=true;document.body.classList.remove('hasupd');try{sessionStorage.setItem('updX',window.swWaitVer||'?')}catch(e){}};
  b.querySelector('.updgo').onclick=()=>{want=true;b.querySelector('.updgo').textContent='⏳ Aktualisiere…';try{w.postMessage({type:'SKIP_WAITING'})}catch(e){location.reload()}setTimeout(()=>{if(!rl)location.reload()},4000)}};;
 navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{window.swReg=r;if(r.waiting)upd(r.waiting);r.addEventListener('updatefound',()=>{const w=r.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed')upd(r.waiting||w)})});
  const chk=()=>r.update().catch(()=>{});chk();document.addEventListener('visibilitychange',()=>{if(!document.hidden)chk()});addEventListener('focus',chk);setInterval(chk,30*60*1000)}).catch(()=>{});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(want&&!rl){rl=true;location.reload()}})}
// Version sichtbar (aus sw.js gelesen)
(async()=>{let v='';try{const t=await (await fetch('sw.js',{cache:'no-store'})).text();v=(t.match(/kartenapp-(v\d+)/)||[])[1]||''}catch(e){}
 if(!v&&window.caches){try{v=((await caches.keys()).find(k=>/^kartenapp-v\d+$/.test(k))||'').replace('kartenapp-','')}catch(e){}}
 if(v){const el=document.createElement('div');el.id='appVer';el.textContent='Kartenapp '+v;el.className='appver';const ft=document.querySelector('.appfoot');(ft||document.body).append(el);setTimeout(()=>sessionStorage.removeItem('swrl'),5000)}})();
window._pLoad=S.collection.length>0;setTimeout(()=>{if(window._pLoad){window._pLoad=false;render()}},20000);S.collection.forEach(trackPrice);render();refreshPrices().finally(()=>{if(window._pLoad){window._pLoad=false;render()}});loadSets();

// ===== Scan-Status groß oben + im Kamerarahmen =====
function bannerEls(){let b=$('#scanBanner');if(!b){b=document.createElement('div');b.id='scanBanner';b.hidden=true;b.innerHTML='<i class="spin"></i><span></span>';document.body.append(b)}
 let o=$('#liveStat');if(!o){o=document.createElement('div');o.id='liveStat';o.innerHTML='<i class="spin"></i><span></span>';$('#scanbox .camwrap')?.append(o)}return[b,o]}
let bT=0;function bannerSet(t){t=(t||'').trim();const [b,o]=bannerEls();const busy=/^[⏳🔍📸]|…$|lädt|wird/.test(t)&&!/^❌|^✅|^Erkannt/.test(t),bad=/^❌|^⚠️|Nicht/.test(t);
 const h=$('header');b.style.top=(h?h.getBoundingClientRect().bottom:0)+6+'px';
 for(const e of [b,o]){e.querySelector('span').textContent=t;e.classList.toggle('busy',busy);e.classList.toggle('bad',bad);e.classList.toggle('ok',/^✅|^Erkannt/.test(t))}o.hidden=true;
 const onScan=$('#v-scan')?.classList.contains('active');b.hidden=!t||!onScan;clearTimeout(bT);if(t&&!busy)bT=setTimeout(()=>{b.hidden=true},bad?9000:5000)}
(()=>{const s=$('#scanStatus2');if(!s)return;new MutationObserver(()=>bannerSet(s.textContent)).observe(s,{childList:true,characterData:true,subtree:true});
 $$('nav button').forEach(x=>x.addEventListener('click',()=>{if(x.dataset.v!=='v-scan'){const b=$('#scanBanner');if(b)b.hidden=true}}))})();

// Start-Buttons (leere Sammlung)
document.querySelectorAll('#emptyStart [data-go]').forEach(b=>b.onclick=()=>{const g=b.dataset.go;if(g==='sets'){go('v-search');setTimeout(()=>{const l=document.getElementById('setList');l&&l.scrollIntoView({behavior:'smooth',block:'start'})},150)}else{go(g);if(g==='v-search')setTimeout(()=>$('#qName').focus(),100)}});
// Barrierefreiheit: Große Schrift / Hoher Kontrast (eigener Speicher-Key)
(()=>{const K2='kartenapp_ui';let u={};try{u=JSON.parse(localStorage.getItem(K2)||'{}')}catch(e){}
 const ap=()=>{document.documentElement.classList.toggle('ui-big',!!u.big);document.documentElement.classList.toggle('ui-hc',!!u.hc)};ap();
 [['#uiBig','big'],['#uiHc','hc']].forEach(([id,k])=>{const el=$(id);if(!el)return;el.checked=!!u[k];el.onchange=()=>{u[k]=el.checked;try{localStorage.setItem(K2,JSON.stringify(u))}catch(e){}ap()}})})();
// === Scan-Liste (Batch), Live-Hinweis, Manuell-suchen-Button ===
const TRAY=window.scanTray=[];
const batchOn=()=>!!$('#batchMode')?.checked;
function trayItem(r,lang,c){const n=String(r.full||r.number||'');return{uid:uid(),r,lang:lang||'DE',id:c&&c.id||'',name:c&&c.name||r.name||'?',set:c&&c.set&&c.set.name||r.set||'',setId:c&&c.set&&c.set.id||'',number:c&&c.localId||n.split('/')[0],img:c&&c.image||'',best:c&&c.best||null,label:c&&c.label||''}}
async function trayLook(r,lang){const lg=(lang||'DE').toLowerCase(),num=String(r.number||'').replace(/^0+/,'')||null;for(const L of [lg,'en']){try{const c=await wto(Prices.lookup(r.name,L,r.setId||null,num),9000,'t');if(c&&c.id)return c}catch(e){}}return null}
async function trayAdd(r,lang){const st=$('#scanStatus2');st.textContent='⏳ '+(r.name||'Karte')+' wird zur Scan-Liste hinzugefügt…';const c=window.Prices?await trayLook(r,lang):null;const it=trayItem(r,lang,c);TRAY.push(it);trayRender();navigator.vibrate?.(120);
 st.textContent=`✓ ${it.name} ${it.number?'· Nr. '+it.number:''} in der Scan-Liste (${TRAY.length}) – nächste Karte scannen`}
function trayRender(){const T=$('#scanTray');if(!T)return;T.hidden=!TRAY.length;if(!TRAY.length){T.innerHTML='';return}
 const sum=TRAY.reduce((s,x)=>s+(x.best?+x.best.eur||0:0),0);
 T.innerHTML=`<div class="trayhead"><b>🗂️ Scan-Liste (${TRAY.length})</b><span>${money(sum)}</span></div>`+TRAY.map(x=>`<div class="trayrow" data-u="${x.uid}">${phImg(x.img&&imgU(x.img,'low'),x.name,x.number,'phtray')}<div class="trayinfo"><b>${esc(x.name)}</b><span class="muted small">${esc(x.set||'Set ?')} · ${esc(x.number||'?')} · ${esc(x.lang)}</span><span class="trayp">${x.best?esc(money(+x.best.eur)):'kein Preis'}</span><label class="traybuy">📒 Ordner<select class="traybnd"><option value="">–</option>${binderList().map(b=>`<option value="${b.id}"${x.bnd===b.id?' selected':''}>${esc(b.name)}</option>`).join('')}<option value="__new">＋ Neuer Ordner…</option></select></label><label class="traybuy">Kaufpreis (€)<input type="text" inputmode="decimal" placeholder="optional, z.B. 2,75" value="${esc(x.buy||'')}" autocomplete="off"></label></div><div class="traybtns"><button type="button" class="tAlt">🔄 Andere Version wählen</button><button type="button" class="tDel" aria-label="Entfernen">✕ Entfernen</button></div><div class="trayalt" hidden></div></div>`).join('')+`<button type="button" class="primary trayall" id="trayAll">➕ Alle ${TRAY.length} hinzufügen</button>`;
 T.querySelectorAll('.trayrow').forEach(row=>{const x=TRAY.find(t=>t.uid===row.dataset.u);row.querySelector('.traybnd').onchange=e=>{if(e.target.value==='__new'){const b=binderNew();x.bnd=b?b.id:'';trayRender();return}x.bnd=e.target.value};row.querySelector('.traybuy input').oninput=e=>{x.buy=e.target.value.trim()};row.querySelector('.tDel').onclick=()=>{TRAY.splice(TRAY.indexOf(x),1);trayRender()};row.querySelector('.tAlt').onclick=()=>trayAlt(x,row.querySelector('.trayalt'))});
 $('#trayAll').onclick=trayCommit}
async function trayAlt(x,box){if(!box.hidden){box.hidden=true;return}box.hidden=false;box.innerHTML='<p class="muted small">Lädt Versionen…</p>';let L=[];const lg=x.lang.toLowerCase();
 try{L=(await Prices.suggest(x.r.name||x.name,lg==='jp'?'ja':lg,40))||[]}catch(e){}const num=String(x.number||'').replace(/^0+/,'');L.sort((a,b)=>(String(b.localId).replace(/^0+/,'')===num)-(String(a.localId).replace(/^0+/,'')===num));
 if(!L.length){box.innerHTML='<p class="muted small">Keine anderen Versionen gefunden</p>';return}box.innerHTML='';
 for(const c of L.slice(0,24)){const b=document.createElement('button');b.type='button';b.className='spThumb';b.innerHTML=`${phImg(c.img&&imgU(c.img.replace(/\/(low|high)\.webp$/,'')),c.name,c.localId,'phthumb')}<span>${esc(c.set&&c.set.name||sidOf(c.id))} · ${esc(c.localId)}</span>`;
  b.onclick=async()=>{box.innerHTML='<p class="muted small">Preis wird geladen…</p>';let d=null;try{d=await Prices.byId(c.id,lg==='jp'?'ja':lg)}catch(e){}const n=trayItem(x.r,x.lang,d||{id:c.id,name:c.name,set:c.set,localId:c.localId,image:c.img});n.uid=x.uid;TRAY[TRAY.indexOf(x)]=n;trayRender()};box.append(b)}}
function trayCommit(){const n=TRAY.length,buys=[];for(const x of TRAY){const b=x.best;const it={uid:uid(),manual:true,tdxId:x.id||undefined,setId:x.setId||undefined,name:x.name,set:x.set,number:x.number,img:x.img,types:[],lang:x.lang,cond:'NM',qty:1,buy:null,price:b?+b.eur:null,ownPrice:null,added:today()};
  if(x.id)it.tdx=b?{label:x.label,id:x.id,src:b.source,conv:b.umgerechnet,url:b.url}:{label:'kein Preis',id:x.id};if(it.price==null)it.noPrice=true;trackPrice(it);S.collection.push(it);if(x.bnd)it.binders=[x.bnd];if(x.buy)buys.push([it.uid,x.buy])}
 buys.forEach(([u,v])=>{try{window.setBuyPrice&&setBuyPrice(u,v)}catch(e){}});const added=S.collection.slice(-n).map(x=>x.uid);TRAY.length=0;save();snapshot();render();trayRender();$('#scanStatus2').textContent=`✅ ${n} Karte${n===1?'':'n'} zur Sammlung hinzugefügt`;if(window.showAddedToast)showAddedToast(added);else kaToast(`✓ ${n} Karte${n===1?'':'n'} hinzugefügt`,()=>{undoAdd(added);$('#scanStatus2').textContent='↩️ Rückgängig gemacht'})}
// Manuell suchen nach >3 s
let _msT=0;function msArm(){msOff();window.scanAbandon=false;window.scanPart=null;_msT=setTimeout(()=>{const b=$('#scanManual');if(b)b.hidden=false},3000)}
function msOff(){clearTimeout(_msT);const b=$('#scanManual');if(b)b.hidden=true}
$('#scanManual')?.addEventListener('click',()=>{const p=window.scanPart||{};window.scanAbandon=true;msOff();stopLive();$('#scanbox')?.classList.remove('busy');$('#scanStatus2').textContent='';$('#qName').value=p.name||'';$('#qNum').value=p.number||'';go('v-search');setTimeout(()=>$('#qName').focus(),50);if(p.name)search(p.name,p.number||'','')});
// Live-Hinweis im Kamerabild + Auto-Foto nur bei ganzer Karte im Rahmen
function frameInCanvas(v,W,H){const f=$('.frame')?.getBoundingClientRect(),r=v.getBoundingClientRect();if(!f||!r.width||!f.width)return{x:0,y:0,w:W,h:H};const vw=v.videoWidth,vh=v.videoHeight,s=Math.max(r.width/vw,r.height/vh),ox=(r.width-vw*s)/2,oy=(r.height-vh*s)/2,k=W/vw;
 const x=(f.left-r.left-ox)/s*k,y=(f.top-r.top-oy)/s*k,w=f.width/s*k,h=f.height/s*k;const x0=Math.max(0,x),y0=Math.max(0,y);return{x:x0,y:y0,w:Math.min(W,x+w)-x0,h:Math.min(H,y+h)-y0}}
function liveAssess(c,F){const W=c.width,H=c.height;F=F||{x:0,y:0,w:W,h:H};const g=c.getContext('2d',{willReadFrequently:true});const d=g.getImageData(0,0,W,H).data;let s=0;for(let i=0;i<d.length;i+=16)s+=d[i]+d[i+1]+d[i+2];const br=s/(d.length/16)/3;
 if(br<55)return{k:'dark',t:'💡 Mehr Licht'};const far={k:'far',t:'↔️ Weiter weg – ganze Karte in den Rahmen'},near={k:'near',t:'🔍 Näher ran'};
 let q=null;try{window.cropDbg=null;const o=cardCropQuad(c);const cd=String(window.cropDbg||'').split(',');if(o&&cd[0]==='quad'){const P=[[+cd[3],+cd[4]],[+cd[5],+cd[6]],[+cd[7],+cd[8]],[+cd[9],+cd[10]]];const L=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);const wd=(L(P[0],P[1])+L(P[3],P[2]))/2,ht=(L(P[0],P[3])+L(P[1],P[2]))/2;q={P,ar:Math.min(wd,ht)/Math.max(wd,ht),sc:+cd[1],area:wd*ht}}}catch(e){}
 if(!q){let o=null;try{window.cropDbg=null;o=cardCropA(c);if(o===c)o=null}catch(e){}if(o){const cd=String(window.cropDbg||'').split(',').map(Number);if(cd.length>=4&&!isNaN(cd[0])){const [x,y,w,h]=cd;const m=W*.02;if(x<=m||y<=m||x+w>=W-m||y+h>=H-m||w*h>F.w*F.h*.8)return far}}return near}
 if(Math.abs(q.ar-.716)>.07)return far;
 const mg=Math.min(F.w,F.h)*.02,inF=q.P.every(([x,y])=>x>=F.x-mg*3&&y>=F.y-mg*3&&x<=F.x+F.w+mg*3&&y<=F.y+F.h+mg*3),inImg=q.P.every(([x,y])=>x>W*.015&&y>H*.015&&x<W*.985&&y<H*.985);
 if(!inImg||!inF)return far;if(q.area<F.w*F.h*.45)return near;return{k:'ok',t:'✓ Karte erkannt',P:q.P}}
setInterval(()=>{const h=$('#liveHint'),v=$('#liveVideo');if(!h)return;if(!live.stream||!v.videoWidth||live.shooting){h.textContent='';h.className='livehint';return}
 const W=240,H=Math.round(240*v.videoHeight/v.videoWidth),c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d',{willReadFrequently:true}).drawImage(v,0,0,W,H);
 const A=liveAssess(c,frameInCanvas(v,W,H));let k=A.k,t=A.t;const now=Date.now();
 if(k==='ok'){const pp=live.lastP;const mv=pp?Math.max(...A.P.map((p,i)=>Math.hypot(p[0]-pp[i][0],p[1]-pp[i][1])))/W:1;live.lastP=A.P;if(mv>.035){live.okSince=now;t='✋ Ruhig halten…'}else live.okSince=live.okSince||now}else{live.okSince=0;live.lastP=null;live.autoArm=true}
 if(k==='ok'&&t!=='✋ Ruhig halten…'){if(autoOn()&&live.autoArm!==false&&!live.shooting){const left=(typeof LV!=='undefined'&&LV.hist.some(Boolean)?2500:1500)-(now-live.okSince);if(left<=0){live.autoArm=false;live.okSince=0;t='📸 Auto-Foto…';liveShoot()}else t='✓ Karte erkannt – ruhig halten…'}else t='✓ Karte erkannt – 📸 Foto drücken'}
 h.textContent=t;h.className='livehint '+(k==='far'?'dark':k)},350);

// Karten-/Preisabfrage schon während der Erkennung anstoßen (gleiche URLs wie die Suche → Cache-Treffer)
const _pf=new Set();function scanPrefetch(p,lang){try{if(!p||!p.name||String(p.name).length<3||/[\u3040-\u30ff\u4e00-\u9fff]/.test(p.name))return;const num=String(p.number||'').split('/')[0].replace(/^0+(?=\d)/,'');const lg=String(lang||'').toLowerCase();
 const nm=clean?clean(p.name):p.name;let de='';try{const b0=nm.replace(/\s+(VMAX|VSTAR|V|GX|EX|ex)$/,''),sf=nm.slice(b0.length),row=(window.PNAMES||[]).find(x=>x[0]===b0||x[1]===b0);de=row&&row[1]?row[1]+sf:deName(nm)}catch(e){}const k=nm+'|'+num+'|'+lg;if(_pf.has(k))return;_pf.add(k);const A='https://api.tcgdex.net/v2/',E=encodeURIComponent,g=u=>fetch(u).catch(()=>{});
 const langs=[...new Set(['en','de',lg==='jp'?'ja':lg].filter(x=>x&&x.length===2))];
 for(const L of langs){const n2=L==='de'&&de?de:nm;g(A+L+'/cards?name='+E(n2));if(num)g(A+L+'/cards?name='+E(n2)+'&localId='+E(num))}
 if(window.Prices&&num)for(const L of langs.slice(0,2)){try{Prices.lookup(L==='de'&&de?de:nm,L,null,num).catch(()=>{})}catch(e){}}}catch(e){}}
// Set-Listen beim Öffnen des Scan-Tabs vorwärmen
function scanWarmSets(){if(window._swS)return;window._swS=1;const A='https://api.tcgdex.net/v2/';Object.values(SETCODES).forEach(x=>x.tdx&&['de','en'].forEach(L=>fetch(A+L+'/sets/'+x.tdx).catch(()=>{})));['en','de','ja'].forEach(L=>{fetch(A+L+'/sets').catch(()=>{});fetch(A+L+'/sets?sort:field=releaseDate&sort:order=DESC').catch(()=>{})})}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-v="v-scan"],[data-go="v-scan"],#liveBtn,#uploadBtn,#scanBtn'))scanWarmSets()},true);
// 'Nächste Karte scannen' im Ergebnis-Kasten auf dem Such-Tab
window.scanMode='upload';[['#liveBtn','cam'],['#scanBtn','photo'],['#uploadBtn','upload']].forEach(([id,m])=>$(id)?.addEventListener('click',()=>{window.scanMode=m},true));
function nextScanBtn(){let n=0;clearInterval(window._nsb);window._nsb=setInterval(()=>{if(++n>120)return clearInterval(window._nsb);const box=$('#results')?.querySelector('.scanpick');if(!box||box.querySelector('.nextscan'))return;
 const b=document.createElement('button');b.type='button';b.className='primary nextscan';b.textContent='📷 Nächste Karte scannen';b.onclick=e=>{e.preventDefault();const m=window.scanMode;go('v-scan');window.scrollTo(0,0);
  if(m==='cam')$('#liveBtn').click();else{const i=$(m==='photo'?'#scanFile':'#uploadFile');i.value='';i.click()}};box.prepend(b)},300)}

// Mobile: Auto-Foto-Schalter, Nav-Höhe für Sticky-Leisten, Scan-Tab öffnet Kamera direkt
const AUTOK='ka_autoshot';const autoOn=()=>!!$('#autoShot')?.checked;
(()=>{const c=$('#autoShot');if(c){let v='1';try{v=localStorage.getItem(AUTOK)??'1'}catch(e){}c.checked=v==='1';c.onchange=()=>{try{localStorage.setItem(AUTOK,c.checked?'1':'0')}catch(e){}live.okSince=0}}})();
function setNavH(){const n=document.querySelector('nav'),h=document.querySelector('header');if(n)document.documentElement.style.setProperty('--navh',n.offsetHeight+'px');if(h){const r=h.getBoundingClientRect();document.documentElement.style.setProperty('--hdrh',Math.round(r.bottom>0?r.bottom:h.offsetHeight)+'px')}}setNavH();addEventListener('resize',setNavH);
async function camGranted(){try{const p=await navigator.permissions.query({name:'camera'});return p.state==='granted'}catch(e){return false}}
const _goScan=go;go=function(v,...a){const r=_goScan.call(this,v,...a);if(v==='v-scan'){setTimeout(async()=>{const sb=$('#scanbox');if(live.stream||live.starting||!sb||sb.classList.contains('busy')||sb.classList.contains('hasres')||window.scanTray&&scanTray.length&&!batchOn())return;if(await camGranted()&&document.querySelector('#v-scan.active')&&!live.stream)startLive()},60)}return r};

// Scan-Bilder: fehlendes/kaputtes Bild → Platzhalter mit Name + Nr. (.cardph)
function phImg(url,name,num,cls){url=safeImg(url);const ph=`<div class="${cls} phbox">${phCard(name,num)}</div>`;if(!url)return ph;return `<img loading="lazy" src="${esc(url)}" alt="" data-phn="${esc(name||'')}" data-phnum="${esc(num||'')}" data-phc="${cls}" onerror="phSwap(this)">`}
window.phSwap=function(im){if(tdxNext(im))return;const d=document.createElement('div');d.className=(im.dataset.phc||'phthumb')+' phbox';d.innerHTML=phCard(im.dataset.phn,im.dataset.phnum);im.replaceWith(d)};

// Name per Fuzzy-Abgleich gegen die Kartenliste des Sets (z.B. 30C/128 → TCGdex '30th'); korrigiert auch Ziffernfehler der Nummer
async function setListFix(tdx,lang,txt,num,name){if(!tdx||/\s/.test(tdx))return null;try{const LS=await tdxSetList('en');if(LS&&LS.length&&!LS.some(x=>x.id===tdx))return null}catch(e){}const lg=(lang||'DE').toLowerCase();let cards=[];for(const L of [...new Set([lg==='jp'?'ja':lg,'de','en'])]){try{const j=await wto(fetch('https://api.tcgdex.net/v2/'+L+'/sets/'+encodeURIComponent(tdx)).then(r=>r.ok?r.json():null),7000,'t');if(j&&j.cards&&j.cards.length){cards=j.cards;break}}catch(e){}}window.setListDbg=tdx+':'+cards.length;if(!cards.length)return null;
 const T=nrm(txt),N0=String(num||'').split('|').map(x=>x.replace(/^0+(?=\d)/,'')).filter(Boolean),n0=N0[0]||'',base=x=>nrm(String(x).replace(/[-\s]*(VMAX|VSTAR|V-UNION|V|GX|EX|ex|BREAK)$/,''));let best=null,bs=1e9;
 for(const c of cards){const b=base(c.name),L=b.length;if(L<4)continue;let d=9;if(T.includes(b))d=0;else for(let i=0;i+L<=T.length;i++){const x=lev(T.substr(i,L),b);if(x<d){d=x;if(!d)break}}const lim=L<6?0:Math.max(1,Math.floor(L*.3));if(d>lim)continue;const li=String(c.localId).replace(/^0+/,'');const s=d/L-(N0.includes(li)?.5:0)-(N0.some(x=>lev(li,x)<=1)?.2:0)-(name&&base(name)===b?.3:0)-L*.005;if(s<bs){bs=s;best=c}}
 window.setListDbg+=' → '+(best?best.name+' '+best.localId:'-');return best?{name:best.name,localId:best.localId}:null}

// OCR + Set-Listen im Leerlauf nach dem Laden vorwärmen (erster Scan nicht langsamer)
(function idleWarm(n=0){const go2=()=>{if(window.Tesseract){try{warmOCR()}catch(e){}try{scanWarmSets()}catch(e){}}else if(n<40)setTimeout(()=>idleWarm(n+1),500)};if(document.readyState!=='complete')return addEventListener('load',()=>setTimeout(()=>idleWarm(n),300),{once:true});(window.requestIdleCallback||(f=>setTimeout(f,800)))(go2,{timeout:2500})})();


// ===== v99: Kein Treffer → Sheet: Nummer/Name/Sprache, Kandidaten-Bilder, 1 Tipp = Scan-Liste =====
async function nmCands(name,numRaw,lang){const lg=(lang||'DE').toLowerCase()==='jp'?'ja':(lang||'DE').toLowerCase();const m=String(numRaw||'').match(/([A-Za-z]{0,4}\d{1,3}[a-z]?)\s*(?:\/\s*([A-Za-z]{0,3}\d{1,3}))?/);const n=m?m[1]:'',tot=m&&m[2]?String(+String(m[2]).replace(/\D/g,'')):'';const out=[],seen=new Set();
 const add=c=>{if(!c||!c.id||seen.has(c.id))return;seen.add(c.id);out.push(c)};
 if(name&&name.trim().length>=2){try{const r=await wto(tdxFind(name.trim(),n||null,lg),12000,'t');(r.list||[]).slice(0,30).forEach(add)}catch(e){}}
 if(n&&tot){let sets=[];for(const l of [lg,'en'].filter((x,i,A)=>A.indexOf(x)===i)){const L=await tdxSetList(l);sets=sets.concat(L.filter(s=>String(s.total)===tot||String(s.official)===tot).map(s=>({...s,lang:l})))}
  const nk=numN(n),nmL=String(name||'').trim().toLowerCase();
  await Promise.all(sets.slice(0,8).map(async s=>{const C=await binderSetCards({setId:s.id,lang:s.lang==='ja'?'jp':s.lang});const c=C.find(c=>numN(c.localId)===nk);if(c)add({...c,lang:s.lang,set:{id:s.id,name:s.name}})}));
  if(nmL)out.sort((x,y)=>(String(y.name||'').toLowerCase().includes(nmL))-(String(x.name||'').toLowerCase().includes(nmL)))}
 return out.slice(0,24)}
function noMatchSheet(r){r=r||{};let f=$('#nmSheet');if(f)f.remove();f=document.createElement('form');f.id='nmSheet';f.className='sbform nmsheet';const L0=r.jp?'JP':(r.lang&&!/^JP$/i.test(r.lang)?String(r.lang).toUpperCase():'DE');
 f.innerHTML=`<div class="nmhead"><b>🔎 Karte nicht erkannt – selbst finden</b><button type="button" class="chip nmx" aria-label="Schließen">✕</button></div>
 <label>Nummer eintippen, z. B. 023/128<input name="num" inputmode="text" autocomplete="off" placeholder="023/128" value="${esc(r.full||r.number||'')}"></label>
 <label>Name (optional)<input name="name" autocomplete="off" placeholder="z. B. Pikachu" value="${esc(r.name||'')}"></label>
 <div class="nmlang" role="radiogroup">${['DE','EN','JP'].map(l=>`<button type="button" class="chip${l===L0?' on':''}" data-l="${l}">${l}</button>`).join('')}</div>
 <div class="nmbtns"><button type="submit" class="primary bigbtn">Suchen</button><button type="button" class="bigbtn nmdrop">Verwerfen</button></div><p class="muted small nmst"></p><div class="nmgrid"></div>`;
 document.body.append(f);document.body.classList.add('hassb');if(r.timeout&&window.anaCut)f.querySelector('.nmgrid').insertAdjacentHTML('beforebegin','<p class="nmbg" role="status"><span class="nmspin"></span>Name/Nummer werden noch gelesen – Treffer werden gleich aktualisiert…</p>');let lang=L0;const close=()=>{f.remove();document.body.classList.remove('hassb')};f.querySelector('.nmx').onclick=close;f.querySelector('.nmdrop').onclick=()=>{close();window.lastScan=null;const P=$('#scanPick');if(P)P.hidden=true;$('#scanbox')?.classList.remove('hasres');const s2=$('#scanStatus2');if(s2)s2.textContent='Verworfen.'};
 f.querySelector('.nmlang').onclick=e=>{const b=e.target.closest('[data-l]');if(!b)return;lang=b.dataset.l;f.querySelectorAll('.nmlang .chip').forEach(x=>x.classList.toggle('on',x===b));go()};
 f.querySelectorAll('input').forEach(i=>i.addEventListener('focus',()=>setTimeout(()=>i.scrollIntoView({block:'center'}),250)));
 const G=f.querySelector('.nmgrid'),st=f.querySelector('.nmst');let tok=0;
 const go=async()=>{const t=++tok,nm=f.name.value,nu=f.num.value;if(r.imgMatch&&r.imgMatch.length&&!go.didImg&&!(nm.trim()&&((r.imgMatch[0]||{}).score||0)<.45)){go.didImg=1;st.textContent='⏳ Bildabgleich…';const C=[];for(const m of r.imgMatch.slice(0,5)){try{const lg=lang==='JP'?'ja':lang.toLowerCase();const d=await wto(Prices.byId(m.cardId,lg),7000,'t')||await wto(Prices.byId(m.cardId,'en'),7000,'t');if(d)C.push({id:d.id||m.cardId,name:d.name,localId:d.localId,image:d.image,set:d.set})}catch(e){}}if(t!==tok)return;go.img=C}if(!nm.trim()&&!/\d/.test(nu)){if(go.img&&go.img.length){const bs=(r.imgMatch[0]||{}).score||0;show(go.img,bs<.45?'unsichere Bildtreffer – bitte Name/Nummer prüfen':'Bildabgleich',bs<.45);return}st.textContent='Nummer oder Name eingeben.';G.innerHTML='';return}st.textContent='⏳ Suche…';G.innerHTML='';const C0=await nmCands(nm,nu,lang);if(t!==tok)return;const C=[...(go.img||[])];C0.forEach(c=>{if(!C.some(x=>x.id===c.id))C.push(c)});const SC={};(r.imgMatch||[]).forEach(m=>SC[m.cardId]=m.score);
  // v104: alle Kandidaten per Bildabgleich (auf ihre Sets beschränkt) bewerten; ohne Score ans Ende
  const srcI=r.imgSrc||window.mSrcBest;if(srcI&&typeof window.matchCardImage==='function'&&C.length){st.textContent='⏳ Bildabgleich der Treffer…';try{const ids=[...new Set(C.map(c=>sidOf(c.id)).filter(Boolean))].slice(0,30);const M=await wto(CardMatcher.match(srcI,{setIds:ids,limit:400}),4000,'t');(M||[]).forEach(m=>{if(SC[m.cardId]==null||m.score>SC[m.cardId])SC[m.cardId]=m.score})}catch(e){}if(t!==tok)return}
  const T0=new Set(C0.map(c=>c.id)),byN=!!nm.trim()&&C0.length>0;if(byN)for(let i=C.length-1;i>=0;i--){const c=C[i];if(!T0.has(c.id)&&!((SC[c.id]||0)>=.45))C.splice(i,1)}const sk=c=>(byN&&T0.has(c.id)?10:0)+(SC[c.id]!=null?SC[c.id]:(c.image?-1:-2));C.sort((x,y)=>sk(y)-sk(x));C.forEach(c=>c._sc=SC[c.id]);show(C,go.img&&go.img.length?'inkl. Bildabgleich':'')};
 const show=(C,src,weak)=>{G.innerHTML='';G.classList.toggle('nmweak',!!weak);st.textContent=C.length?`${C.length} Treffer${src?' ('+src+')':''} – richtige Karte antippen:`:'Nichts gefunden – Nummer/Name prüfen oder Sprache wechseln.';
  C.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='spThumb';b.innerHTML=`${phImg(c.image&&imgU(c.image),c.name,c.localId,'phthumb')}<span>${esc(c.name)} · ${esc(c.set&&c.set.name||sidOf(c.id))} · ${esc(c.localId)}</span>`;
   const im=b.querySelector('img');if(im&&typeof window.attachImgFallback==='function')try{window.attachImgFallback(im,c)}catch(e){}
   b.onclick=async()=>{if(!b.classList.contains('nmsel')){G.querySelectorAll('.nmsel').forEach(x=>{x.classList.remove('nmsel');x.querySelector('.nmok')?.remove()});b.classList.add('nmsel');b.insertAdjacentHTML('beforeend','<em class="nmok">✓ Nochmal tippen zum Hinzufügen</em>');return}b.disabled=true;st.textContent='⏳ '+c.name+' wird zur Scan-Liste hinzugefügt…';const lg=lang==='JP'?'ja':lang.toLowerCase();let d=null;try{d=await wto(Prices.byId(c.id,lg),9000,'t')}catch(e){}
    const it=trayItem({name:c.name,number:c.localId},lang,d&&d.id?d:{id:c.id,name:c.name,set:c.set,localId:c.localId,image:c.image});TRAY.push(it);trayRender();navigator.vibrate?.(120);close();
    const s2=$('#scanStatus2');if(s2)s2.textContent=`✓ ${it.name} · Nr. ${it.number} in der Scan-Liste (${TRAY.length})`;$('#scanTray')?.scrollIntoView({block:'center'})};G.append(b)})};
 f.onsubmit=e=>{e.preventDefault();go()};if(f.name.value.trim()||/\d/.test(f.num.value)||(r.imgMatch&&r.imgMatch.length))go();else f.num.focus();return f}
window.noMatchSheet=noMatchSheet;
function retakePrompt(msg){const P=$('#scanPick'),st=$('#scanStatus2');if(st)st.textContent='⚠️ '+msg;const b=document.createElement('div');b.className='retake';b.innerHTML=`<p><b>⚠️ ${esc(msg)}</b></p><button type="button" class="primary bigbtn" id="retakeBtn">📸 Neu aufnehmen</button><button type="button" class="bigbtn" id="nmBtn">🔎 Nummer/Name eingeben</button>`;if(P){P.hidden=false;P.prepend(b)}else $('#scanbox').append(b);$('#nmBtn').onclick=()=>noMatchSheet(window.lastScan||{});$('#retakeBtn').onclick=()=>{b.remove();if(P)P.hidden=true;$('#scanbox')?.classList.remove('hasres');startLive()};b.scrollIntoView({block:'center'})}
// v78: Sammlung teilen – Bild (1080x1350) per Canvas, Web Share mit Datei, sonst PNG-Download
async function shareImgLoad(u){for(const c of (u&&/assets\.tcgdex\.net\//.test(u)?tdxCands(u).filter(x=>/assets\.tcgdex\.net\//.test(x)):[]))try{const r=await fetch(imgFull(c).replace('/high.webp','/low.webp'),{mode:'cors',signal:AbortSignal.timeout(6000)});if(!r.ok)continue;return await createImageBitmap(await r.blob())}catch(e){}return null}
async function shareRender(){const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');const F='system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
 const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#2a1766');bg.addColorStop(1,'#0f1530');g.fillStyle=bg;g.fillRect(0,0,W,H);
 const t=totals(),cards=S.collection.filter(c=>c.type!=='sealed');const txt=(s,x,y,sz,col,w='700',al='left')=>{g.font=`${w} ${sz}px ${F}`;g.fillStyle=col;g.textAlign=al;g.fillText(s,x,y)};
 txt('Meine Sammlung',80,140,56,'#ffffff','800');
 txt(money(t.v),80,270,112,'#ffd84d','900');txt('Gesamtwert',80,320,34,'#c9c3e6','600');
 let y=400;if(t.b>0){const pc=t.g/t.b*100,sg=t.g>=0?'+':'−';txt(`${sg}${money(Math.abs(t.g))} (${sg}${Math.abs(pc).toFixed(1).replace('.',',')} %) seit Kauf`,80,y,44,t.g>=0?'#7ee2a8':'#e6e1f5','700');txt(`${t.nb} von ${t.n} Karten mit Kaufpreis · Einstand ${money(t.b)} · Wert ${money(t.vb)}`,80,y+44,28,'#a49dc6','500');y+=110}
 txt(`${t.n} ${t.n===1?'Karte':'Karten'}`,80,y,44,'#ffffff','700');y+=70;
 const top=[...S.collection].filter(c=>c.price!=null).sort((a,b)=>b.price-a.price).slice(0,3);
 if(top.length){txt('Top '+top.length,80,y,36,'#c9c3e6','700');y+=30;const cw=280,ch=390,gap=(W-160-3*cw)/2;
  for(let i=0;i<top.length;i++){const c=top[i],x=80+i*(cw+gap);g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.roundRect(x,y,cw,ch,18);g.fill();
   const bm=await shareImgLoad(safeImg(c.img));if(bm){const r=Math.min(cw/bm.width,ch/bm.height),w=bm.width*r,h=bm.height*r;g.save();g.beginPath();g.roundRect(x,y,cw,ch,18);g.clip();g.drawImage(bm,x+(cw-w)/2,y+(ch-h)/2,w,h);g.restore()}
   else{g.font=`800 34px ${F}`;g.fillStyle='#fff';g.textAlign='center';const words=String(c.name).split(/\s+/);let line='',ly=y+ch/2-30;for(const wd of words){if(g.measureText(line+' '+wd).width>cw-30&&line){g.fillText(line,x+cw/2,ly);ly+=42;line=wd}else line=(line?line+' ':'')+wd}g.fillText(line,x+cw/2,ly);g.font=`500 26px ${F}`;g.fillStyle='#c9c3e6';g.fillText(`${c.set||''} ${c.number||''}`.trim().slice(0,22),x+cw/2,ly+44)}
   txt(String(c.name).slice(0,20),x+cw/2,y+ch+44,30,'#ffffff','700','center');txt(money(c.price),x+cw/2,y+ch+86,34,'#ffd84d','800','center')}}
 txt('Kartenapp',80,H-150,44,'#ffffff','900');txt('jayezhdtwitch.github.io/kartenapp',80,H-108,28,'#c9c3e6','500');
 txt('Inoffizielles Fanprojekt, keine Verbindung zu Nintendo/The Pokémon Company · Preise ohne Gewähr',W/2,H-46,19,'#8f88b5','500','center');txt('Pokémon und zugehörige Namen/Bilder © Nintendo, Creatures, GAME FREAK, The Pokémon Company',W/2,H-20,19,'#8f88b5','500','center');
 return await new Promise(r=>cv.toBlob(r,'image/png'))}
window.shareRender=shareRender;
{const b=$('#shareBtn');if(b){const upd=()=>{b.hidden=!S.collection.length};upd();const r0=render;render=function(){const x=r0.apply(this,arguments);upd();return x};
 b.onclick=async()=>{const old=b.textContent;b.textContent='Bild wird erstellt…';b.disabled=true;try{const blob=await shareRender();const file=new File([blob],'kartenapp-sammlung.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Meine Sammlung',text:'Meine Pokémon-Sammlung – Kartenapp'})}catch(e){}}
  else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}}catch(e){console.warn(e);alert('Bild konnte nicht erstellt werden.')}finally{b.textContent=old;b.disabled=false}}}}

// v82: „Hinzugefügt · Rückgängig“ (5 s) – entfernt genau dieses Item. Für andere Module: window.showAddedToast(uid oder [uids])
let _toastT=null;function showAddedToast(ids){ids=[].concat(ids).filter(Boolean);if(!ids.length)return;let t=$('#addToast');if(!t){t=document.createElement('div');t.id='addToast';t.className='addToast';t.setAttribute('role','status');document.body.append(t)}
 const it=S.collection.find(x=>x.uid===ids[0]);t.innerHTML=`<span>${ids.length>1?ids.length+' Karten hinzugefügt':'Hinzugefügt'+(it?': '+esc(it.name):'')}</span><button type="button">Rückgängig</button>`;t.hidden=false;
 t.querySelector('button').onclick=()=>{S.collection=S.collection.filter(x=>!ids.includes(x.uid));save();snapshot();render();t.hidden=true;clearTimeout(_toastT)};clearTimeout(_toastT);_toastT=setTimeout(()=>{t.hidden=true},5000)}
window.showAddedToast=showAddedToast;
// ===== Ordner (Binder): S.binders=[{id,name}], item.binders=[ids] =====
S.binders??=[];
const BND={sel:'all',pg:0};
const binderList=()=>S.binders||(S.binders=[]);
function binderNew(){const n=(prompt('Name des Ordners (z.B. Glurak, Japan):')||'').trim();if(!n)return null;const b={id:'b'+uid(),name:n.slice(0,40)};binderList().push(b);save();return b}
const numN=n=>String(n||'').split('/')[0].replace(/^0+(?=\w)/,'').toLowerCase();
const inSet=(it,b)=>{const s=b.setId,ids=[it.tdxId,it.apiId,it.tdx&&it.tdx.id].filter(Boolean);return ids.some(x=>x.startsWith(s+'-'))||it.setId===s};
function binderItems(id){const b=id!=='all'&&binderList().find(x=>x.id===id);return S.collection.filter(it=>id==='all'||(it.binders||[]).includes(id)||(b&&b.setId&&inSet(it,b)))}
// Set-Karten: App's getSetCards (falls vorhanden), sonst TCGdex
const SETC={};async function binderSetCards(b){const k=b.setId+'|'+b.lang;if(SETC[k])return SETC[k];let L=null;
 if(typeof window.getSetCards==='function'){try{L=await window.getSetCards(b.setId,b.lang)}catch(e){L=null}}
 if(!L||!L.length){for(const lg of [b.lang==='jp'?'ja':b.lang,'en'].filter((x,i,A)=>x&&A.indexOf(x)===i)){try{const j=await (await fetch(`https://api.tcgdex.net/v2/${lg}/sets/${encodeURIComponent(b.setId)}`,{signal:AbortSignal.timeout(10000)})).json();if(j&&j.cards&&j.cards.length){L=j.cards;if(j.name&&isIdTitle(b)&&!b.titleCustom){b.oldTdxName=j.name;b.name=('Set: '+j.name).slice(0,40);save()}break}}catch(e){}}}
 L=(L||[]).map(c=>({...c,id:c.id,localId:String(c.localId??''),name:c.name||'',image:c.image||''}));if(L.length)SETC[k]=L;return L}
// Bild-Fallbacks: App's attachImgFallback, sonst TCGdex EN → pokemontcg.io → Platzhalter
function binderImgs(view,C){view.querySelectorAll('img[data-cid]').forEach(img=>{const c=(C||[]).find(x=>x.id===img.dataset.cid)||{id:img.dataset.cid,localId:img.dataset.phnum||'',name:img.dataset.phn||''};
 if(typeof window.attachImgFallback==='function'){try{img.removeAttribute('onerror');window.attachImgFallback(img,c);return}catch(e){}}
 const m=String(c.id||'').match(/^(.+)-([^-]+)$/),ser=(c.id||'').replace(/^([a-z]+).*/,'$1');const alt=[];
 if(m){alt.push(`https://assets.tcgdex.net/en/${ser==='sv'?'sv':ser}/${m[1]}/${m[2]}/low.webp`);alt.push(`https://images.pokemontcg.io/${m[1].replace('.','pt')}/${m[2]}.png`)}
 (c.fallbacks||[]).forEach(u=>alt.unshift(u));let i=0;img.onerror=()=>{const u=alt[i++];if(u&&u!==img.src)img.src=u;else if(img.dataset.phn&&typeof phSwap==='function')phSwap(img);else img.remove()}})}
// Set-Suche: App's searchSets (falls vorhanden), sonst SETS + TCGdex-Setlisten (de/en/ja)
const LGN={de:'DE',en:'EN',ja:'JP',jp:'JP'};const SLIST={};
async function tdxSetList(lg){if(SLIST[lg])return SLIST[lg];try{const j=await (await fetch(`https://api.tcgdex.net/v2/${lg}/sets`,{signal:AbortSignal.timeout(8000)})).json();SLIST[lg]=(j||[]).map(s=>({id:s.id,name:s.name,lang:lg,total:s.cardCount&&(s.cardCount.official||s.cardCount.total)||null}))}catch(e){SLIST[lg]=[]}return SLIST[lg]}
async function setSearch(q,lang){q=String(q||'').trim();const lg=lang==='jp'?'ja':lang||'de';
 if(typeof window.searchSets==='function'){try{const r=await window.searchSets(q,lg);if(Array.isArray(r)&&r.length)return r.slice(0,10)}catch(e){}}
 const ql=q.toLowerCase(),seen=new Set(),out=[];const add=s=>{const k=s.id+'|'+s.lang;if(seen.has(k))return;seen.add(k);out.push(s)};
 const m=s=>!ql||String(s.name||'').toLowerCase().includes(ql)||String(s.id).toLowerCase().startsWith(ql);
 (typeof SETS!=='undefined'?SETS:[]).filter(m).forEach(s=>add({id:s.id,name:s.name,lang:'en',total:s.printedTotal||s.total||null}));
 for(const l of [lg,'en','ja'].filter((x,i,A)=>A.indexOf(x)===i))(await tdxSetList(l)).filter(m).forEach(add);
 out.sort((a,b)=>(b.lang===lg)-(a.lang===lg)||(String(b.id).toLowerCase()===ql)-(String(a.id).toLowerCase()===ql));return out.slice(0,10)}
const isIdTitle=b=>!b.name||b.name==='Set: '+b.setId||b.name===b.setId||b.name.toLowerCase()==='set: '+String(b.setId).toLowerCase();
// Titel/Total nachziehen (auch Migration alter Set-Binder mit ID-Titel)
// Meta-Status nur im Speicher (nie mit dem Binder speichern; v92–v97 hatten _meta persistiert → Migration lief nie)
const SBM=new Map();
const autoTitle=(b,i)=>{if(b.titleCustom)return false;const n=String(b.name||'').replace(/^Set:\s*/,'').trim().toLowerCase();if(!n)return true;
 const known=[b.setId,i&&i.nameJa,b.oldTdxName,...(b.oldNames||[])].filter(Boolean).map(x=>String(x).toLowerCase());return !b.customName||known.includes(n)||/[\u3040-\u30ff\u4e00-\u9fff]/.test(n)};
async function setBinderMeta(b,force){const st=SBM.get(b.id)||{n:0};if(st.busy||(st.ok&&!force))return;st.busy=true;SBM.set(b.id,st);delete b._meta;
 let info=null;if(typeof window.getSetInfo==='function'){try{info=await window.getSetInfo(b.setId,b.lang==='jp'?'ja':b.lang)}catch(e){}}
 let hit=info?{...info,lang:b.lang}:null;if(!hit){try{const L=await setSearch(b.setId,b.lang);hit=L.find(s=>String(s.id).toLowerCase()===String(b.setId).toLowerCase())||null}catch(e){}}
 let ch=false;
 if(hit&&hit.total&&+hit.total!==b.infoTotal){b.infoTotal=+hit.total;b.total=+hit.total;ch=true}
 if(hit&&hit.name&&autoTitle(b,hit)){const nn=('Set: '+hit.name).slice(0,40);if(nn!==b.name){b.name=nn;ch=true}}
 if(!b.total||b.have==null){const C=await binderSetCards(b);if(C.length&&!b.total){b.total=C.length;ch=true}if(C.length){const hv=new Set();binderItems(b.id).forEach(it=>{const ids=[it.tdxId,it.apiId,it.tdx&&it.tdx.id].filter(Boolean);const c=C.find(c=>ids.includes(c.id))||C.find(c=>numN(c.localId)===numN(it.number));if(c)hv.add(c.id)});if(hv.size!==b.have){b.have=hv.size;ch=true}}}
 st.busy=false;st.n++;st.ok=!!info||st.n>=4;if(!st.ok)setTimeout(()=>setBinderMeta(b),2500*st.n);
 if(ch){save();if($('#binderBar'))binderUI()}}
function setBinderNew(){let f=$('#sbForm');if(f){f.remove();document.body.classList.remove('hassb');return}f=document.createElement('form');f.id='sbForm';f.className='sbform';
 f.innerHTML=`<b>🗂️ Set-Binder anlegen</b><label>Set (Name oder ID, z.B. Shiny Treasure, 30th, sv03.5)<input name="set" required autocomplete="off" placeholder="Set suchen…"></label><div class="sbsug" role="listbox" hidden></div><label>Sprache<select name="lang"><option value="de">Deutsch</option><option value="en">Englisch</option><option value="jp">Japanisch</option></select></label><div class="sbacts"><button type="submit" class="primary">Erstellen</button><button type="button" class="chip sbx">Abbrechen</button></div>`;
 document.body.append(f);document.body.classList.add('hassb');const close=()=>{f.remove();document.body.classList.remove('hassb')};f.querySelector('.sbx').onclick=close;
 const inp=f.set,sug=f.querySelector('.sbsug');let cur=[],selS=null,tok=0,dT=null;
 const draw=async()=>{const t=++tok;const L=await setSearch(inp.value,f.lang.value);if(t!==tok)return;cur=L;sug.innerHTML=L.map((s,i)=>`<button type="button" role="option" data-i="${i}">${esc(s.name)}${s.nameJa&&s.nameJa!==s.name?' · '+esc(s.nameJa):''} <small>${esc(s.id)} · ${esc(LGN[s.lang]||s.lang||'')}${s.total?' · '+esc(s.total)+' Karten':''}</small></button>`).join('');sug.hidden=!L.length};
 const later=()=>{selS=null;clearTimeout(dT);dT=setTimeout(draw,250)};inp.addEventListener('input',later);f.lang.addEventListener('change',later);
 inp.addEventListener('focus',()=>{later();setTimeout(()=>inp.scrollIntoView({block:'center'}),250)});inp.addEventListener('blur',()=>setTimeout(()=>sug.hidden=true,150));
 const pick=e=>{const o=e.target.closest('[data-i]');if(!o)return;e.preventDefault();e.stopPropagation();selS=cur[+o.dataset.i];inp.value=`${selS.name} (${selS.id})`;const l=selS.lang==='ja'?'jp':selS.lang;if([...f.lang.options].some(x=>x.value===l))f.lang.value=l;sug.hidden=true};sug.addEventListener('pointerdown',pick);sug.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation()});sug.addEventListener('click',e=>{e.preventDefault();e.stopPropagation()});
 inp.focus();
 f.onsubmit=async e=>{e.preventDefault();const raw=f.set.value.trim();if(!raw)return;let s=selS;
  if(!s){const id=(raw.match(/\(([^()]+)\)\s*$/)||[])[1];const q=id||raw;const L=await setSearch(q,f.lang.value);s=L.find(x=>String(x.id).toLowerCase()===q.toLowerCase())||L.find(x=>String(x.name).toLowerCase()===raw.toLowerCase())||(id?null:L[0])||{id:q,name:''}}
  const b={id:'b'+uid(),name:('Set: '+(s.name||s.id)).slice(0,40),setId:s.id,lang:f.lang.value,total:s.total?+s.total:undefined};binderList().push(b);save();close();BND.sel=b.id;BND.pg=0;binderUI()}}
function binderPicker(sel,onChange){const w=document.createElement('div');w.className='bpick';let arm=null,armT=null;const L=()=>binderList().filter(b=>!b.setId);
 const draw=()=>{const on=L().filter(b=>sel.includes(b.id));w.innerHTML=(on.length?`<div class="binbadge">✓ in Binder: ${on.map(b=>esc(b.name)).join(', ')}</div>`:'')+'<span class="muted small">📒 Ordner</span>'+L().map(b=>{const s=sel.includes(b.id);return `<button type="button" class="chip${s?' on':''}${arm===b.id?' arm':''}" data-b="${b.id}" aria-pressed="${s}">${arm===b.id?'Nochmal tippen = entfernen':(s?'✓ ':'')+esc(b.name)}</button>`}).join('')+'<button type="button" class="chip bnew">＋ Neuer Ordner</button>'};draw();
 w.addEventListener('click',e=>{const c=e.target.closest('button');if(!c)return;e.preventDefault();if(c.classList.contains('bnew')){const b=binderNew();if(b){sel.push(b.id);onChange&&onChange(sel)}arm=null;draw();return}const id=c.dataset.b,i=sel.indexOf(id);clearTimeout(armT);
  if(i<0){sel.push(id);arm=null}else if(arm!==id){arm=id;armT=setTimeout(()=>{arm=null;draw()},3000)}else{sel.splice(i,1);arm=null}onChange&&onChange(sel);draw()});return w}
async function setBinderPage(view,b){const tok=view._tok=Math.random();if(!SETC[b.setId+'|'+b.lang])view.innerHTML=`<div class="bhead"><b>🗂️ ${esc(b.name)}</b></div><p class="muted small">Setliste wird geladen…</p>`;const C=await binderSetCards(b);if(view._tok!==tok||BND.sel!==b.id)return;
 const own=binderItems(b.id),byN={};own.forEach(it=>{const ids=[it.tdxId,it.apiId,it.tdx&&it.tdx.id].filter(Boolean);const c=C.find(c=>ids.includes(c.id))||C.find(c=>numN(c.localId)===numN(it.number));if(c)(byN[c.id]||(byN[c.id]=[])).push(it)});
 const have=C.filter(c=>byN[c.id]).length,ex=own.reduce((s,it)=>s+(it.qty||1),0);b.have=have;b.total=b.infoTotal||C.length||b.total;const val=own.reduce((s,it)=>s+(+it.price||0)*(it.qty||1),0);const per=9,pages=Math.max(1,Math.ceil(C.length/per));BND.pg=Math.max(0,Math.min(pages-1,BND.pg));
 const cells=C.length?C.slice(BND.pg*per,BND.pg*per+per).map(c=>{const it=(byN[c.id]||[])[0];if(it)return `<button type="button" class="bslot" data-u="${it.uid}">${safeImg(it.img)||c.image?`<img loading="lazy" src="${esc(safeImg(it.img)||imgU(c.image))}" alt="" data-cid="${esc(c.id)}" data-phn="${esc(it.name)}" data-phnum="${esc(c.localId)}" data-phc="phthumb" onerror="phSwap(this)">`:`<div class="phthumb phbox">${phCard(it.name,c.localId)}</div>`}<span class="bn">${esc(it.name)}</span><b>${it.price!=null?money(it.price):'–'}</b></button>`;
  return `<div class="bslot miss" title="Fehlt"><div class="phthumb phbox">${c.image||c.id?`<img loading="lazy" src="${esc(c.image?imgU(c.image):'data:,')}" alt="" data-cid="${esc(c.id)}" data-phnum="${esc(c.localId)}" onerror="this.remove()">`:''}<span class="mnum">#${esc(c.localId)}</span></div><span class="bn">${esc(c.name)}</span><b class="muted">fehlt</b></div>`}).join('')+Array.from({length:Math.max(0,per-Math.min(per,C.length-BND.pg*per))},()=>'<div class="bslot empty"><span>Freier Platz</span></div>').join(''):'';
 view.innerHTML=`<div class="bhead"><div><b>🗂️ ${esc(b.name)} <i class="lpill">${LGN[b.lang]||esc(b.lang||'')}</i></b><span class="muted small">${have} / ${b.total||C.length||'?'} gesammelt · ${ex} Exemplar${ex===1?'':'e'}</span></div><div class="bval">${own.some(it=>it.price!=null&&+it.price>0)?money(val):'–'}</div></div>${C.length?`<div class="setprog"><i style="width:${C.length?Math.round(have/C.length*100):0}%"></i></div><div class="bpage">${cells}</div><div class="bnav"><button type="button" class="bprev2" aria-label="Vorige Seite"${BND.pg?'':' disabled'}>‹</button><span>Seite ${BND.pg+1} / ${pages}</span><button type="button" class="bnext2" aria-label="Nächste Seite"${BND.pg<pages-1?'':' disabled'}>›</button></div>`:`<p class="muted small">Set „${esc(b.setId)}“ nicht gefunden (TCGdex). ID prüfen oder später erneut versuchen.</p>`}<div class="bacts"><button type="button" class="chip bren">✏️ Umbenennen</button><button type="button" class="chip bdel">🗑️ Binder löschen</button></div>`;
 const q=s=>view.querySelector(s);if(q('.bprev2')){q('.bprev2').onclick=()=>{BND.pg--;binderPage(view)};q('.bnext2').onclick=()=>{BND.pg++;binderPage(view)};
  const P=q('.bpage');let sx=null;P.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});P.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>50){const n=BND.pg+(dx<0?1:-1);if(n>=0&&n<pages){BND.pg=n;binderPage(view)}}})}
 view.querySelectorAll('.bslot[data-u]').forEach(s=>s.onclick=()=>{const it=S.collection.find(x=>x.uid===s.dataset.u);if(it)detail({item:it,list:'coll'})});
 binderImgs(view,C);const chip=$(`#binderBar [data-b="${b.id}"] small`);if(chip)chip.textContent=`${have}/${b.total||C.length||'?'}`;
 q('.bren').onclick=()=>{const n=(prompt('Neuer Name:',b.name)||'').trim();if(n){b.name=n.slice(0,40);b.titleCustom=true;save();binderUI()}};
 q('.bdel').onclick=()=>{if(!confirm(`Binder „${b.name}“ löschen? Die Karten bleiben in der Sammlung.`))return;S.binders=binderList().filter(x=>x!==b);BND.sel='all';save();binderUI()}}
// Portfolio: Ordner-Leiste + 3x3-Seiten
function binderUI(){const grid=$('#collGrid');if(!grid)return;let bar=$('#binderBar'),view=$('#binderView');
 if(!bar){bar=document.createElement('div');bar.id='binderBar';bar.className='chips binderbar';grid.before(bar);view=document.createElement('div');view.id='binderView';view.className='binderv';view.hidden=true;grid.before(view)}
 if(BND.sel!=='all'&&!binderList().some(b=>b.id===BND.sel))BND.sel='all';binderList().forEach(b=>{if(b.setId&&SETC[b.setId+'|'+b.lang]){const C=SETC[b.setId+'|'+b.lang],hv=new Set();binderItems(b.id).forEach(it=>{const ids=[it.tdxId,it.apiId,it.tdx&&it.tdx.id].filter(Boolean);const c=C.find(c=>ids.includes(c.id))||C.find(c=>numN(c.localId)===numN(it.number));if(c)hv.add(c.id)});b.have=hv.size}if(b.setId)setBinderMeta(b)});
 bar.innerHTML=`<button type="button" class="chip${BND.sel==='all'?' on':''}" data-b="all">📚 Alle Karten</button>`+binderList().map(b=>`<button type="button" class="chip${BND.sel===b.id?' on':''}" data-b="${b.id}">📒 ${esc(b.name)}${b.setId?` <i class="lpill">${LGN[b.lang]||esc(b.lang||'')}</i>`:''} <small>${b.setId?(b.have??'…')+'/'+(b.total||'?'):binderItems(b.id).reduce((s,it)=>s+(it.qty||1),0)}</small></button>`).join('')+'<button type="button" class="chip bnew">＋ Ordner</button><button type="button" class="chip bset">＋ Set-Binder</button>';
 bar.onclick=e=>{const c=e.target.closest('button');if(!c)return;if(c.classList.contains('bset')){setBinderNew();return}if(c.classList.contains('bnew')){const b=binderNew();if(b){BND.sel=b.id;BND.pg=0}}else{BND.sel=c.dataset.b;BND.pg=0}binderUI()};
 if(BND.sel==='all'){view.hidden=true;grid.hidden=false;return}grid.hidden=true;view.hidden=false;binderPage(view)}
function binderPage(view){const b=binderList().find(x=>x.id===BND.sel);if(b&&b.setId)return setBinderPage(view,b);const L=binderItems(BND.sel);const per=9,pages=Math.max(1,Math.ceil(L.length/per));BND.pg=Math.max(0,Math.min(pages-1,BND.pg));
 const val=L.reduce((s,it)=>s+(+it.price||0)*(it.qty||1),0),cnt=L.reduce((s,it)=>s+(it.qty||1),0);
 const cells=L.slice(BND.pg*per,BND.pg*per+per).map(it=>`<button type="button" class="bslot" data-u="${it.uid}">${safeImg(it.img)?`<img loading="lazy" src="${esc(safeImg(it.img))}" alt="" data-cid="${esc(it.tdxId||it.apiId||'')}" data-phn="${esc(it.name)}" data-phnum="${esc(it.number||'')}" data-phc="phthumb" onerror="phSwap(this)">`:`<div class="phthumb phbox">${phCard(it.name,it.number)}</div>`}<span class="bn">${esc(it.name)}</span><b>${it.price!=null?money(it.price):'–'}</b></button>`).join('')+Array.from({length:Math.max(0,per-Math.min(per,L.length-BND.pg*per))},()=>'<div class="bslot empty"><span>Freier Platz</span></div>').join('');
 view.innerHTML=`<div class="bhead"><div><b>📒 ${esc(b?b.name:'')}</b><span class="muted small">${cnt} Karte${cnt===1?'':'n'}</span></div><div class="bval">${L.some(it=>it.price!=null&&+it.price>0)?money(val):'–'}</div></div><div class="bpage">${cells}</div><div class="bnav"><button type="button" class="bprev2" aria-label="Vorige Seite"${BND.pg?'':' disabled'}>‹</button><span>Seite ${BND.pg+1} / ${pages}</span><button type="button" class="bnext2" aria-label="Nächste Seite"${BND.pg<pages-1?'':' disabled'}>›</button></div><div class="bacts"><button type="button" class="chip bren">✏️ Umbenennen</button><button type="button" class="chip bdel">🗑️ Ordner löschen</button></div>${L.length?'':'<p class="muted small">Noch leer – Karten über die Kartendetails, „Zur Sammlung“ oder die Scan-Liste zuordnen.</p>'}`;
 view.querySelectorAll('img[data-cid=""]').forEach(i=>i.removeAttribute('data-cid'));binderImgs(view,null);view.querySelector('.bprev2').onclick=()=>{BND.pg--;binderPage(view)};view.querySelector('.bnext2').onclick=()=>{BND.pg++;binderPage(view)};
 view.querySelectorAll('.bslot[data-u]').forEach(s=>s.onclick=()=>{const it=S.collection.find(x=>x.uid===s.dataset.u);if(it)detail({item:it,list:'coll'})});
 view.querySelector('.bren').onclick=()=>{const n=(prompt('Neuer Name:',b.name)||'').trim();if(n){b.name=n.slice(0,40);b.titleCustom=true;save();binderUI()}};
 view.querySelector('.bdel').onclick=()=>{if(!confirm(`Ordner „${b.name}“ löschen? Die Karten bleiben in der Sammlung.`))return;S.binders=binderList().filter(x=>x.id!==b.id);S.collection.forEach(it=>{if(it.binders)it.binders=it.binders.filter(x=>x!==b.id)});BND.sel='all';save();binderUI()};
 const P=view.querySelector('.bpage');let sx=null;P.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});P.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>50){const n=BND.pg+(dx<0?1:-1);if(n>=0&&n<pages){BND.pg=n;binderPage(view)}}})}
{const _rn=render;render=function(){const r=_rn.apply(this,arguments);try{binderUI()}catch(e){console.warn('binder',e)}return r}}
// Kartendetail: Ordner-Zuordnung
{const _dt=detail;detail=function(o){window._detItem=o&&o.item&&S.collection.includes(o.item)?o.item:null;return _dt.apply(this,arguments)}}
new MutationObserver(()=>{const f=$('#dlgForm'),it=window._detItem;if(!f||!it||!f.querySelector('.detail')||f.querySelector('.bpick'))return;const sel=it.binders?[...it.binders]:[];const p=binderPicker(sel,s=>{it.binders=[...s];save();try{binderUI()}catch(e){}});f.querySelector('.detail').append(p)}).observe(document.getElementById('dlgForm')||document.body,{childList:true,subtree:true});
// 'Zur Sammlung'-Dialog: Ordner wählen
{const _ad=addDialog;addDialog=function(c,mode,sealed){window._detItem=null;const n0=S.collection.length;const r=_ad.apply(this,arguments);if(mode==='coll'||!mode){const f=$('#dlgForm'),sel=BND.sel!=='all'?[BND.sel]:[];const row=f&&f.querySelector('.row:last-of-type');if(f&&!f.querySelector('.bpick')){const p=binderPicker(sel);row?row.before(p):f.append(p)}
  $('#dlg').addEventListener('close',()=>setTimeout(()=>{if(S.collection.length>n0&&sel.length){S.collection.slice(n0).forEach(it=>{it.binders=[...new Set([...(it.binders||[]),...sel])]});save();render()}},0),{once:true})}return r}}
// ===== FX 'NEUE KARTE' nur ab 20 € und nicht bei Serien-Hinzufügen; sonst Toast =====
const ADDLOG=[];window._bulkAdd=false;
function kaToast(msg,undo){let t=$('#kaToast');if(!t){t=document.createElement('div');t.id='kaToast';t.setAttribute('role','status');document.body.append(t)}t.innerHTML=`<span>${esc(msg)}</span>${undo?'<button type="button">Rückgängig</button>':''}`;t.hidden=false;t.classList.add('on');if(undo)t.querySelector('button').onclick=()=>{undo();t.classList.remove('on');t.hidden=true};clearTimeout(t._tm);t._tm=setTimeout(()=>{t.classList.remove('on');t.hidden=true},4500)}
window.showToast=window.showToast||kaToast;
function undoAdd(uids){S.collection=S.collection.filter(x=>!uids.includes(x.uid));save();snapshot();render()}
if(window.FX&&FX.reveal){const _rv=FX.reveal;FX.reveal=function(it){const now=Date.now();ADDLOG.push(now);while(ADDLOG.length&&now-ADDLOG[0]>30000)ADDLOG.shift();const p=+(it&&it.price)||0;
 if(!window._bulkAdd&&ADDLOG.length<=1&&p>=20)return _rv.apply(this,arguments);const u=it&&it.uid;if(window.showAddedToast&&u){showAddedToast(u);return}kaToast(`✓ Hinzugefügt: ${it&&it.name||'Karte'}${p?' · '+money(p):''}`,u?()=>undoAdd([u]):null)}}
// ── Bild-Vergleich für den Scan (Fingerabdrücke aus tools/build_fingerprints.py, nur Hashes – keine Bilder) ──
// window.matchCardImage(canvas, {setIds?, lang?, limit=5}) -> Promise<[{cardId, score}]>
//   canvas: Karte bereits gerade gezogen + zugeschnitten (Seitenverhältnis ~0,716, Hochformat), beliebige Größe
//   setIds: optional Liste von Set-IDs (z.B. ['sv01'] / ['SV4a']) -> nur diese Shards (fp/<intl|ja>/<set>.json)
//           ohne setIds: globaler Index fp/all-<intl|ja>.txt (1,8 MB / 0,35 MB, gzip ~0,9 MB, einmal geladen, dann im Speicher)
//   lang: 'ja'|'jp' -> japanische Karten (IDs wie SV4a-115); sonst DE/EN (IDs wie sv01-086, 30th-023, wie getSetCards)
//   Ergebnis (v2, Felder siehe unten bei matchCardImage): bestes zuerst, score 0..1 (1 = identisch). Test (verzerrte Handyfotos): richtige Treffer meist 0,55–0,87, Fremdkarten meist < 0,45.
//   Reprints mit gleichem Artwork (z.B. sv01-086 / sv04.5-029) haben fast gleiche Scores -> Nummer/Set zum Entscheiden nutzen.
//   Verglichen wird nur der Artwork-Bereich: x 8–92 %, y 11–53 % (Standardkarten; bei Full-Arts ist das ebenfalls Artwork).
// window.matchCardImageReady(lang?, setIds?) -> Promise<boolean>: lädt die Daten vorab (z.B. beim Öffnen der Kamera).
(()=>{const FPV=2,CROP=[0.08,0.11,0.92,0.53],WCROP=[0.04,0.03,0.96,0.97],N=32,SH=[[0,0],[.03,0],[-.03,0],[0,.03],[0,-.03]];
 const fpBase=()=>new URL('fp/',document.baseURI).href;const LS={};
 const fam=l=>/^(ja|jp)$/i.test(String(l||''))?'ja':'intl';
 // Farbe normalisiert (je Kanal Mittel abziehen, durch Streuung teilen) -> unabhängig von Weißabgleich/Belichtung/Kontrast
 const cnorm=c=>{const o=new Float32Array(48);for(let k=0;k<3;k++){let m=0;for(let i=k;i<48;i+=3)m+=c[i];m/=16;let v=0;for(let i=k;i<48;i+=3)v+=(c[i]-m)**2;const sd=Math.sqrt(v/16)+1.5;for(let i=k;i<48;i+=3)o[i]=(c[i]-m)/sd}return o};
 const parse=h=>{const a=new Uint32Array(4);for(let i=0;i<4;i++)a[i]=parseInt(h.substr(i*8,8),16)>>>0;const c=new Uint8Array(48);for(let i=0;i<48;i++)c[i]=parseInt(h[32+i],16);let w=null;if(h.length>=112){w=new Uint32Array(4);for(let i=0;i<4;i++)w[i]=parseInt(h.substr(80+i*8,8),16)>>>0}return{a,c,n:cnorm(c),w}};
 const SAME={};const sameLoad=f=>{const k='same-'+f;if(!LS[k])LS[k]=fetch(fpBase()+k+'.json?v='+FPV).then(r=>r.ok?r.json():[]).then(L=>{for(const g of L)for(const i of g)SAME[i]=g;return 1}).catch(()=>{delete LS[k];return 0});return LS[k]};
 async function shard(f,sid){const k=f+'/'+sid;if(!LS[k])LS[k]=fetch(fpBase()+f+'/'+encodeURIComponent(sid)+'.json?v='+FPV).then(r=>r.ok?r.json():null).then(d=>d?d.c.map(([l,h])=>({id:sid+'-'+l,...parse(h)})):[]).catch(()=>{delete LS[k];return[]});return LS[k]}
 async function all(f){const k='*'+f;if(!LS[k])LS[k]=fetch(fpBase()+'all-'+f+'.txt?v='+FPV).then(r=>r.ok?r.text():'').then(t=>t.split('\n').filter(Boolean).map(x=>{const i=x.indexOf(' ');return{id:x.slice(0,i),...parse(x.slice(i+1))}})).catch(()=>{delete LS[k];return[]});return LS[k]}
 async function cands(o){const f=fam(o.lang);sameLoad(f);const S=(o.setIds||[]).filter(Boolean);if(!S.length)return all(f);
  // Set-IDs ohne Groß/Klein-Gefahr: intl-Shards sind klein geschrieben wie TCGdex de/en
  return (await Promise.all(S.map(s=>shard(f,String(s))))).flat()}
 const DCT=(()=>{const m=new Float64Array(8*N);for(let u=0;u<8;u++)for(let x=0;x<N;x++)m[u*N+x]=Math.cos(Math.PI*(2*x+1)*u/(2*N));return m})();
 function fpOf(cv,cr=CROP){const W=cv.width,H=cv.height,sx=Math.round(Math.max(0,cr[0])*W),sy=Math.round(Math.max(0,cr[1])*H),sw=Math.round(Math.min(1,cr[2])*W)-sx,sh=Math.round(Math.min(1,cr[3])*H)-sy;
  // erst auf 128x128 (geglättet), dann exaktes 4x4-Flächenmittel auf 32x32 (wie PIL BOX)
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  if(sw>512||sh>512){const t=document.createElement('canvas');t.width=256;t.height=256;const tg=t.getContext('2d');tg.imageSmoothingQuality='high';tg.drawImage(cv,sx,sy,sw,sh,0,0,256,256);g.drawImage(t,0,0,256,256,0,0,128,128)}else g.drawImage(cv,sx,sy,sw,sh,0,0,128,128);
  const d=g.getImageData(0,0,128,128).data,R=new Float64Array(N*N),G=new Float64Array(N*N),B=new Float64Array(N*N);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,j=(y>>2)*N+(x>>2);R[j]+=d[i];G[j]+=d[i+1];B[j]+=d[i+2]}
  const gr=new Float64Array(N*N);for(let j=0;j<N*N;j++){R[j]/=16;G[j]/=16;B[j]/=16;gr[j]=R[j]*0.299+G[j]*0.587+B[j]*0.114}
  // pHash
  const tmp=new Float64Array(8*N);for(let u=0;u<8;u++)for(let x=0;x<N;x++){let s=0;for(let y=0;y<N;y++)s+=DCT[u*N+y]*gr[y*N+x];tmp[u*N+x]=s}
  const co=[];for(let u=0;u<8;u++)for(let v=0;v<8;v++){let s=0;for(let x=0;x<N;x++)s+=tmp[u*N+x]*DCT[v*N+x];co.push(s)}
  const srt=co.slice(1).sort((a,b)=>a-b),med=(srt[31]+srt[32])/2;
  const a=new Uint32Array(4);const setb=(k,b)=>{if(b)a[k>>5]|=(1<<(31-(k&31)))>>>0};co.forEach((v,k)=>setb(k,v>med));
  // dHash auf 8x8-Blockmitteln
  const m=new Float64Array(64);for(let y=0;y<N;y++)for(let x=0;x<N;x++)m[(y>>2)*8+(x>>2)]+=gr[y*N+x]/16;
  for(let y=0;y<8;y++)for(let x=0;x<8;x++)setb(64+y*8+x,m[y*8+x]>m[y*8+((x+1)&7)]);
  const cc=new Uint8Array(48);for(let by=0;by<4;by++)for(let bx=0;bx<4;bx++){let r=0,gg=0,b=0;for(let y=by*8;y<by*8+8;y++)for(let x=bx*8;x<bx*8+8;x++){const j=y*N+x;r+=R[j];gg+=G[j];b+=B[j]}const k=(by*4+bx)*3;cc[k]=Math.min(255,r/64)>>4;cc[k+1]=Math.min(255,gg/64)>>4;cc[k+2]=Math.min(255,b/64)>>4}
  return{a,c:cc,n:cnorm(cc)}}
 const pc=x=>{x-=(x>>>1)&0x55555555;x=(x&0x33333333)+((x>>>2)&0x33333333);return(((x+(x>>>4))&0x0f0f0f0f)*0x01010101)>>>24};
 // v2: Artwork-Score (Farbgewicht 0,15, Farbe normalisiert) über 5 Zuschnitte (±3 %) -> bester; dazu ganze Karte (pHash+dHash)
 function artScore(q,t){const ph=pc(q.a[0]^t.a[0])+pc(q.a[1]^t.a[1]),dh=pc(q.a[2]^t.a[2])+pc(q.a[3]^t.a[3]);let cd=0;for(let i=0;i<48;i++)cd+=Math.abs(q.n[i]-t.n[i]);cd/=48;
  return Math.max(0,Math.min(1,1-(0.85*(0.6*ph/32+0.4*dh/32)+0.15*Math.min(1,cd/1.2))))}
 function cardScore(w,t){if(!t.w)return null;let h=0;for(let i=0;i<4;i++)h+=pc(w[i]^t.w[i]);return Math.max(0,1-h/64)}
 // window.matchCardImage v2 – Ergebnisfelder: {cardId, score, art, card, sameArt:[cardIds mit gleichem Artwork], gap}
 //   score = 0,65·art + 0,35·card (ohne Ganzkarten-Abdruck: art). gap = score − bester Score einer Karte mit ANDEREM Artwork (Reprints zählen nicht als Konkurrenz).
 //   Empfehlung Übernahme: score ≥ 0,62 und gap ≥ 0,12; bei sameArt.length>0 Set/Nummer zum Entscheiden nutzen.
 window.matchCardImage=async function(canvas,o={}){const limit=o.limit||5;const C=await cands(o);if(!C.length||!canvas||!canvas.width)return[];await sameLoad(fam(o.lang));
  const Q=SH.map(([dx,dy])=>fpOf(canvas,[CROP[0]+dx,CROP[1]+dy,CROP[2]+dx,CROP[3]+dy])),wq=fpOf(canvas,WCROP).a;
  const K=Math.max(limit,5)+8,top=[];for(const t of C){let ar=0;for(const q of Q){const s=artScore(q,t);if(s>ar)ar=s}const cs=cardScore(wq,t),s=cs==null?ar:0.65*ar+0.35*cs;
   if(top.length<K||s>top[top.length-1].score){top.push({cardId:t.id,score:s,art:ar,card:cs});top.sort((x,y)=>y.score-x.score);if(top.length>K)top.pop()}}
  const r=top.map(x=>{const g=SAME[x.cardId]||[x.cardId];const o2=top.find(y=>!g.includes(y.cardId));return{cardId:x.cardId,score:+x.score.toFixed(4),art:+x.art.toFixed(4),card:x.card==null?null:+x.card.toFixed(4),sameArt:g.filter(i=>i!==x.cardId),gap:+(x.score-(o2?o2.score:0)).toFixed(4)}});return r.slice(0,limit)};
 window.matchCardImageReady=async(lang,setIds)=>(await cands({lang,setIds})).length>0;
 // window.artGroup(cardId) -> Gruppenschlüssel (erste ID der sameArt-Gruppe) oder null; synchron, Daten kommen mit dem ersten matchCardImage/Ready
 window.artGroup=id=>{const g=SAME[id];return g?g[0]:null};
 window._fpOf=fpOf})();
// v108: Live-Erkennung per Mehrfach-Bild-Abstimmung – ~4 Bilder/s, entzerren (Kanten/Viereck → 716×1000), Matcher; gleiche Karte 3× in Folge Top-1 mit ≥0,55 → übernehmen. OCR bleibt Fallback (Foto-Knopf/Auto-Foto).
const LV={busy:false,hist:[],last:'',lastT:0,n:0,ms:0};window.liveVote=LV;
async function liveVoteHit(id,sc,M,img){const lg=(window.scanLang||'DE').toLowerCase()==='jp'?'ja':(window.scanLang||'DE').toLowerCase();let d=null;for(const L of [...new Set([lg,'de','en'])]){try{d=await wto(Prices.byId(id,L),7000,'t')}catch(e){}if(d&&d.name)break}
 if(!d||!d.name)return false;const sid=String(id).replace(/-[^-]+$/,''),li=String(id).split('-').pop(),nmb=String(+li||li);let tot='';try{const s=(await tdxSetList('en')).find(x=>x.id===sid);if(s&&s.total)tot=String(s.total)}catch(e){}
 const r={imgMatch:M,imgHit:{cardId:id,score:sc},imgSrc:img,name:d.name,en:null,jp:null,weak:false,number:nmb,full:tot?nmb+'/'+tot:nmb,lang:lg==='ja'?'JP':lg.toUpperCase(),confident:true,energy:false,setId:sid,set:sid,raw:'',conf:Math.round(sc*100),live:true,ms:LV.ms};
 window.lastScan=r;navigator.vibrate?.(200);if(batchOn()){scanResult(r);lStat('✓ '+d.name+' · Nr. '+r.full+' – nächste Karte');return true}stopLive();scanResult(r);return true}
window.LIVEVOTE=window.LIVEVOTE??true;
setInterval(async()=>{const v=$('#liveVideo');if(!window.LIVEVOTE||LV.busy||!live.stream||!v||!v.videoWidth||live.shooting||!autoOn()||document.hidden)return;LV.busy=true;const t0=performance.now();
 try{if(!LV.t0)LV.t0=t0;const W=Math.min(960,v.videoWidth),H=Math.round(W*v.videoHeight/v.videoWidth),c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(v,0,0,W,H);
  let s=null,M=[];for(const f of [()=>warpStd(c),()=>cardCrop2(c),()=>c]){let x=null;try{x=f()}catch(e){}if(!x||x===s)continue;const m=await wto(CardMatcher.match(x,{limit:3}),1500,'t').catch(()=>[]);if(m&&m[0]&&(!M[0]||m[0].score>M[0].score)){M=m;s=x}if(M[0]&&M[0].score>=.6)break}const b=M&&M[0];LV.n++;
  const id=b&&b.score>=.55&&(!M[1]||(b.score-M[1].score>=.04&&!sameArt(b.cardId,M[1].cardId)))?b.cardId:null;LV.hist.push(id);if(LV.hist.length>3)LV.hist.shift();window.liveVoteDbg=LV.hist.join(',')+' '+(b?b.cardId+':'+b.score.toFixed(2):'');
  const same=id&&LV.hist.length===3&&LV.hist.every(x=>x===id);const h=$('#liveHint');
  if(id&&!same&&h){const k=LV.hist.filter(x=>x===id).length;h.textContent='🔍 Karte wird erkannt… ('+k+'/3)';h.className='livehint ok'}
  if(same&&!(id===LV.last&&Date.now()-LV.lastT<8000)){LV.last=id;LV.lastT=Date.now();LV.hist=[];LV.ms=Math.round(performance.now()-LV.t0);live.shooting=true;
   try{let amb=false;try{const Mj=await wto(CardMatcher.match(s,{lang:'ja',limit:2}),1500,'t');amb=!!(Mj&&Mj[0]&&Mj[0].score>=b.score-.06)}catch(e){}if(amb){lStat('Karte erkannt, Sprache unklar – 📸 Foto drücken');return}const ok=await liveVoteHit(id,b.score,M,s);if(!ok){LV.last='';lStat('Karte erkannt, Daten laden nicht – 📸 Foto drücken')}}finally{live.shooting=false}LV.t0=0}}
 catch(e){console.warn('liveVote',e)}finally{LV.busy=false}},250);
