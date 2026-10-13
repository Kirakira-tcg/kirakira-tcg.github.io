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
function load(){try{const d=JSON.parse(localStorage.getItem(K));if(d)return d}catch(e){}
 return {collection:[{uid:'ex1',manual:true,name:'Glurak (30th Celebration, JP)',set:'30th Celebration (JP)',number:'',lang:'JP',cond:'NM',qty:1,buy:0,price:140,note:'≈ 23.120 ¥',img:''}],
  wishlist:[{uid:'ex2',apiId:'me55-152',name:'Mew ex',set:'30th Celebration',number:'152',lang:'DE',target:60,price:null,img:'https://images.scrydex.com/pokemon/me55-152/small'}],snapshots:[]}}
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
// JP-Bilder (pokemon-card.com): bei Fehler ohne Referrer neu laden, dann snkrdunk-Bild aus jpprices.json
document.addEventListener('error',async e=>{const im=e.target;if(!(im instanceof HTMLImageElement))return;const u=im.dataset.orig||im.src;if(!/pokemon-card\.com/.test(u))return;
 const n=+(im.dataset.fb||0);im.dataset.fb=n+1;im.dataset.orig=u;if(n===0){im.referrerPolicy='no-referrer';im.src=u+(u.includes('?')?'&':'?')+'r=1';return}
 if(n===1&&window.Prices&&Prices.jpImgFallback){const f=await Prices.jpImgFallback(u);if(f)im.src=f}},true);
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
async function setCards(setId,q,sel){let all=[],page=1,tot=1;while(all.length<tot&&page<6){const d=await api(`${API}/cards?q=${encodeURIComponent(q.join(' '))}&pageSize=250&page=${page}${sel}`,2,8000);all=all.concat(d.data||[]);tot=d.totalCount||all.length;page++;if(!(d.data||[]).length)break}return{data:all}}
// Set-Fallback über TCGdex (gleiche Set-IDs bei älteren Sets)
async function tdxSetView(R,setId,my){try{const r=await fetch('https://api.tcgdex.net/v2/en/sets/'+encodeURIComponent(setId),{signal:AbortSignal.timeout(8000)});if(!r.ok)return false;const j=await r.json();if(my!==SEARCHN)return true;
 const cs=(j.cards||[]).sort((a,b)=>numCmp(a.localId,b.localId));if(!cs.length)return false;
 R.classList.remove('binder-src');R.innerHTML=`<h3 class="small" style="grid-column:1/-1">${esc(j.name)} · ${cs.length} Karten <span class="muted">(TCGdex)</span></h3>`;
 cs.forEach(c=>{const id=c.id,el=tile({img:c.image?c.image+'/low.webp':'',name:`${owned(id)?'✓ ':''}#${c.localId} ${c.name}`,sub:`#${c.localId}/${j.cardCount&&j.cardCount.official||''}`,price:null,badge:owned(id)?'✓ BESITZ':''});const pb=el.querySelector('.p b');if(pb)pb.textContent='';el.onclick=()=>tdxDetail({id,lang:'en',name:c.name,localId:c.localId,set:{id:j.id,name:j.name},img:c.image?c.image+'/low.webp':''});R.append(el)});window.scrollTo(0,0);return true}catch(e){return false}}
const LNAME={de:'🇩🇪 Deutsch',en:'🇬🇧 Englisch',ja:'🇯🇵 Japanisch'};
// Suchergebnisse: EN-Datenbank (Cardmarket-Preise) + TCGdex nach Sprache gruppiert, progressiv
async function searchRender(R,data,apiErr,tdxP,o){R.classList.remove('binder-src');R.innerHTML='';const head=document.createElement('p');head.className='muted small';head.style.gridColumn='1/-1';head.id='noHit';R.append(head);
 data.sort((a,b)=>(b.set.releaseDate||'').localeCompare(a.set.releaseDate||'')||numCmp(a.number,b.number));lastResults=data;
 const ps=window.pendingScan;if(ps&&ps.lang&&(ps.lang!=='EN'||(ps.name&&ps.number))){head.insertAdjacentHTML('beforebegin',`<div class="scanpick" style="grid-column:1/-1"><b>${ps.lang==='JP'?'🇯🇵 Japanische Karte':'Karte ('+ps.lang+')'}: ${esc(ps.name||'')} ${esc(ps.number||'')}</b><p class="muted small"><span id="tdxHint">Suche in TCGdex…</span></p><button type="button" class="chip" id="manScan">➕ Manuell hinzufügen</button></div>`)}
 if(data.length){R.insertAdjacentHTML('beforeend',`<h3 class="small" style="grid-column:1/-1">🇬🇧 Englisch · Cardmarket-Preise (${data.length})</h3>`);for(const c of data)R.append(enTile(c))}
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
  box.insertAdjacentHTML('beforeend',`<h3 class="small" style="grid-column:1/-1">${LNAME[lg]||lg} (${G.length})${r.exact?'':''}</h3>`);G.forEach((c,i)=>box.append(tdxTile(c,i<12)))}}
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
let SETS=[];async function loadSets(){try{const d=await api(`${API}/sets?orderBy=-releaseDate&pageSize=250&select=id,name,series,releaseDate,images,total,printedTotal,ptcgoCode`);SETS=d.data.map(s=>s.name==='Base'?{...s,name:'Base Set'}:s);if(SETTAB!=='ja')renderSets()}catch(e){try{const j=await (await fetch('https://api.tcgdex.net/v2/en/sets',{signal:AbortSignal.timeout(8000)})).json();SETS=j.reverse().filter(x=>!isPocket(x.id)).map(x=>({id:x.id,name:x.name,series:'',releaseDate:'',total:x.cardCount&&x.cardCount.total||'',printedTotal:x.cardCount&&x.cardCount.official||'',images:{logo:x.logo?x.logo+'.png':''}}));if(SETTAB!=='ja')renderSets()}catch(_){$('#setList').innerHTML='<p class="muted small">Sets nicht ladbar.</p>'}}}
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
async function fedInit(f,c){try{const id=String(c.id).replace(/^jp:.*/,'');if(!id)return;const lg=(c._lang||'EN').toLowerCase()==='jp'?'ja':(c._lang||'EN').toLowerCase();
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
 let r=null;try{const same=n=>{const p=nrm(n),q=nrm(name);if(!p||!q)return true;let d=q;try{d=nrm(deName(name))}catch(e){}return p===q||p===d||p.startsWith(q)||q.startsWith(p)||p.startsWith(d)||d.startsWith(p)};r=await Prices.lookup(name,lang,x.setId||null,num);if(r&&!same(r.name))r=await Prices.lookup(name,lang,null,num);if(r&&!same(r.name))r=null;if(!(r&&r.best)&&lang!=='en'&&lang!=='jp'&&lang!=='ja'){r=await Prices.lookup(name,'en',null,num);if(r&&!same(r.name))r=null}}catch(e){console.warn(e)}
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
   box.innerHTML=L.map((c,i)=>`<button type="button" class="sugItem" data-i="${i}">${c.img?`<img src="${esc(c.img)}" alt="" loading="lazy">`:'<div class="sugNo">?</div>'}<b>${esc(c.name)}</b><span>${esc(c.set.name)} ${esc(c.localId)}</span></button>`).join('');box.hidden=false;
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
 const dlg=$('#dlg');dlg.returnValue='';{const pf=window._dlgPrefill;window._dlgPrefill=false;const ok=f.querySelector('button[value=ok]');if(ok)ok.autofocus=!!pf}dlg.showModal();dlg.onclose=()=>{if(dlg.returnValue!=='ok')return;const v=Object.fromEntries(new FormData(f));
  const base=manual?{manual:true,setId:v.setSel&&v.setSel!=='__other'?v.setSel:undefined,name:v.name,set:v.set,number:v.number||'',img:v.img}:tx?{manual:true,tdxId:c.id,setId:c.set.id,name:c.name,set:c.set.name,number:c.number,img:c.images.large||c.images.small,types:[],tdx:tx.best?{label:tx.label,id:tx.id,src:tx.best.source,conv:tx.best.umgerechnet,url:tx.best.url}:{label:'kein Preis',id:c.id}}:{apiId:c.id,name:c.name,set:c.set.name,number:c.number,img:c.images.small,apiPrice:p,cm:cmInfo(c),types:c.types||[]};
  if(sealed)base.type='sealed';let own=v.price?parseFloat(v.price):null;const tp=manual?window.tdxPick:null;window.tdxPick=null;let tpp=null;{const au=f.price&&f.price.dataset.auto;if(au&&own===+au){own=null;tpp=+au;base.tdx={label:f.price.dataset.lbl||'',id:f.price.dataset.aid||''}}}if(tp){base.tdx=tp.tdx;base.tdxId=tp.id;base.setId=tp.setId;if(tp.price!=null&&(own==null||own===tp.price)){own=null;tpp=tp.price}}
  if(mode==='wish')S.wishlist.push({uid:uid(),...base,lang:v.lang,target:parseFloat(v.target),price:own??tpp??p,ownPrice:own});
  else{const it={uid:uid(),...base,lang:v.lang,cond:v.cond,qty:parseInt(v.qty)||1,buy:(n=>Number.isNaN(n)?null:n)(parseEur(v.buy)),price:own??tpp??p,ownPrice:own,added:today()};if(v.first){it.variant='1st';if(window._first&&window._firstPrice!=null&&own==null){it.price=window._firstPrice;it.priceNote='';it.tdx={label:money(window._firstPrice)+' · TCGplayer (TCGdex) · 1st Edition',id:c&&c.id,src:'TCGplayer 1st',url:null}}else it.priceNote='Preis gilt nicht für 1st Edition';}window._first=false;if(it.price==null)it.noPrice=true;trackPrice(it);S.collection.push(it);if(v.first&&!(it.tdx&&/1st/.test(it.tdx.src||'')))firstEd(it);window.FX&&FX.reveal(it)}
  save();snapshot();render();const nw=mode==='wish'?S.wishlist[S.wishlist.length-1]:S.collection[S.collection.length-1];
  if(nw&&tdxNeed(nw))tdxFill(nw).then(ok=>{if(ok){trackPrice(nw);save();snapshot();render()}})};
 if(c&&window.Prices){const l=$('#tdxLbl');Prices.lookup(c.name,(window.scanLang||'DE').toLowerCase(),null,c.number).then(r=>{if(l&&r&&r.best)l.textContent='TCGdex: '+r.label}).catch(()=>{})}}
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
 ${price!=null&&!isNaN(price)?`<div class="big" style="font-size:1.8rem">${money(price)}</div><div class="psrcw">${pSrc(item?(it.estimate?'Schätzung':it.ownPrice!=null?'eigen':(it.tdx&&it.tdx.src)||''):(c&&c._tdx&&c._tdx.best&&!cmPrice(c)?c._tdx.best.source:(c&&cmFix(c).fixed?'Ø 7':'')))}</div>${c&&cmFix(c).fixed?`<p class="small" style="color:#fbbf24;margin:.1rem 0">⚠️ Trend (${money(c.cardmarket.prices.trendPrice)}) unplausibel – zeige ${cmFix(c).fixed}</p>`:''}`:`<div class="big" style="font-size:1.8rem">–</div><p class="muted small" style="margin:.2rem 0">Noch kein Preis · <a class="plink" href="https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(name)}" target="_blank" rel="noopener">auf Cardmarket ansehen ↗</a></p>`}${(()=>{const n=String((c?c.number:it.number)||'');const tot=c&&c.set&&c.set.printedTotal;const nn=n.includes('/')||!tot?n:n+'/'+tot;const q=['Pokemon',name,nn,c?c.set.name:it.set].filter(Boolean).join(' ');
 const cmu=(ci&&ci.url)||(it.tdx&&it.tdx.url&&/cardmarket/.test(it.tdx.url)?it.tdx.url:null)||`https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(name.replace(/\s*\(.*\)\s*$/,''))}`;
 const cmv=(ci&&ci.trend)||(item&&it.tdx&&/Cardmarket/.test(it.tdx.src||'')?it.price:null),jpv=(c&&c._tdx&&c._tdx.jpMarket)||(item&&it.tdx&&/JP-Markt/.test(it.tdx.src||'')?{eur:it.price,value:null}:null);
 return `<div class="pcmp"><div><span class="muted small">Cardmarket</span><b>${cmv!=null?money(cmv):'–'}</b><a class="plink" href="${esc(cmu)}" target="_blank" rel="noopener">Cardmarket ↗</a></div><div><span class="muted small">eBay (verkauft)</span><b>–</b><span class="muted small">kein eBay-Preis verfügbar</span><a class="plink" href="https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">eBay ↗</a></div>${jpv?`<div><span class="muted small">JP-Markt</span><b>${money(jpv.eur)}</b><span class="muted small">${jpv.value?'¥'+jpv.value.toLocaleString('de-DE')+' · ':''}pokeca-souba</span></div>`:''}</div>`})()}${item?`<div class="${cls(itemChange(it,S.settings.tf))}">${pct(itemChange(it,S.settings.tf))||'Noch keine Änderung'}</div>`:''}
 <h3>Preisguide (Cardmarket)</h3><table class="ptable">${rows.map(r=>`<tr><td>${r[0]}</td><td>${money(r[1])}</td></tr>`).join('')||'<tr><td colspan=2 class="muted">Keine Cardmarket-Daten in dieser Quelle (siehe TCGdex-Zeile unten)</td></tr>'}</table>
 ${raw?`<h3>Graded (Schätzung)</h3><table class="ptable">${Object.entries(GRADE).map(([g,[k]])=>`<tr><td>${g}</td><td>≈ ${money(raw*k)}</td></tr>`).join('')}</table><p class="muted small">Faktor-Schätzung auf Raw-Preis, keine echten Graded-Verkäufe/Pop-Reports.</p>`:''}
 ${item&&it.buy?`<p>Einstand ${money(it.buy*it.qty)} · <span class="${cls(raw-it.buy)}">${raw-it.buy>=0?'+':''}${money((raw-it.buy)*it.qty)}</span></p>`:''}
 ${it.tdx?`<p class="muted small">Preis: ${esc(it.tdx.label)}${it.tdx.url?` · <a href="${esc(it.tdx.url)}" target="_blank" rel="noopener" class="plink">Cardmarket ↗</a>`:''}</p>`:''}<p class="muted small" id="tdxDet"></p>${it.note?`<p class="muted small">${esc(it.note)}</p>`:''}${it.priceNote?`<p class="small" style="color:#fbbf24">⚠️ ${esc(it.priceNote)}</p>`:''}${ci&&ci.url?`<p><a href="${ci.url}" target="_blank" rel="noopener" class="plink">Auf Cardmarket ansehen ↗</a></p>`:''}</div>
 <div class="row">${item?(list!=='wishlist'?'<button value="buy">Kaufpreis</button>':'')+(it.price==null||it.estimate?'<button value="est">Wert schätzen</button>':'')+'<button value="del" class="danger">Entfernen</button>':`<button value="add">+ Sammlung</button><button value="wish">☆ Wunsch</button>`}<button value="cancel">Schließen</button></div>`;
 const dlg=$('#dlg');dlg.returnValue='';dlg.showModal();
 langFlags(f,{name,number:c?c.number:it.number,lang:item?it.lang:(window.scanLang||''),tid:it.tdx&&it.tdx.id});window._first=false;if(c)fedInit(f,c);
 if(window.Prices&&!it.tdx&&(price==null||(item&&it.lang&&it.lang!=='EN'))){const q=item?{...it,ownPrice:null,price:null}:{name:c.name,number:c.number,lang:window.scanLang||'EN'};tdxFill(q).then(ok=>{const l=$('#tdxDet');if(ok&&l)l.textContent='TCGdex: '+q.tdx.label})}
 dlg.onclose=()=>{const r=dlg.returnValue;
  if(r==='add')setTimeout(()=>addDialog(c,'coll'));if(r==='wish')setTimeout(()=>addDialog(c,'wish'));
  if(r==='buy')setTimeout(()=>numSheet(it,'buy'));if(r==='est')setTimeout(()=>numSheet(it,'est'));
  if(r==='del'&&confirm('Wirklich entfernen?')){S[list]=S[list].filter(x=>x.uid!==it.uid);save();snapshot();render()}}}

// Preise aktualisieren
async function refreshPrices(){const btn=$('#refresh');btn.textContent='…';const items=[...S.collection,...S.wishlist].filter(x=>x.apiId);
 const ids=[...new Set(items.map(x=>x.apiId))];
 for(let i=0;i<ids.length;i+=20){const chunk=ids.slice(i,i+20);
  try{const d=await api(`${API}/cards?q=${encodeURIComponent(chunk.map(id=>'id:'+id).join(' OR '))}&select=id,cardmarket,types`);
   for(const c of d.data){const p=cmPrice(c);items.filter(x=>x.apiId===c.id).forEach(x=>{x.cm=cmInfo(c);if(c.types)x.types=c.types;if(p!=null&&x.ownPrice==null){x.price=p;delete x.estimate}})}}catch(e){console.warn(e)}}
 await Promise.all(items.map(async x=>{const c={id:x.apiId};if(await cmSync(c)){x.cm=cmInfo(c);const p=cmPrice(c);if(p!=null&&x.ownPrice==null){x.price=p;delete x.estimate}}}));
 for(const x of [...S.collection,...S.wishlist])if(x.type!=='sealed'&&tdxNeed(x))await tdxFill(x);
 S.collection.forEach(trackPrice);btn.textContent='⟳';save();snapshot();render()}
$('#refresh').onclick=refreshPrices;

// Gewinn/Verlust nur für Karten mit Kaufpreis (>0); ohne Kaufpreis zählt nur der Wert
function totals(){let v=0,b=0,n=0,vb=0;for(const c of S.collection){const w=(c.price||0)*c.qty;v+=w;n+=c.qty;if(c.buy>0){b+=c.buy*c.qty;vb+=w}}return{v,b,n,g:vb-b}}
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
const imgForget=u=>tdxCands(u).forEach(c=>IMGOK.delete(c));
// <img>-Fehler (Detail, Thumbs): nächste TCGdex-Variante versuchen, bevor der Platzhalter kommt
function tdxNext(im){const cs=im.getAttribute('src')||'';if(im.dataset.tdxo&&im.dataset.tdxs&&cs!==im.dataset.tdxs){delete im.dataset.tdxo;im.dataset.tdxi=0;delete im.dataset.tdxr}const o=im.dataset.tdxo||cs;if(!/assets\.tcgdex\.net\//.test(o))return false;im.dataset.tdxo=o;const L=tdxCands(o),i=+(im.dataset.tdxi||0)+1;if(i>=L.length){if(!im.dataset.tdxr){im.dataset.tdxr=1;setTimeout(()=>{if(im.isConnected){im.dataset.tdxi=0;im.style.visibility='';im.dataset.tdxs=o;im.src=o}},20000);if(!im.hasAttribute('onerror'))im.style.visibility='hidden';return true}if(!im.hasAttribute('onerror')){const d=document.createElement('div');d.className='dph phbox';d.innerHTML=phCard(im.dataset.phn||'',im.dataset.phnum||'');im.replaceWith(d);return true}return false}im.dataset.tdxi=i;im.dataset.tdxs=L[i];im.src=L[i];if(tdxIsEn(L[i],o)&&!(im.parentElement&&im.parentElement.querySelector('.imgnote')))im.insertAdjacentHTML('afterend','<div class="imgnote">Bild: englische Version</div>');return true}
document.addEventListener('error',e=>{const t=e.target;if(t&&t.tagName==='IMG'&&!t.hasAttribute('onerror'))tdxNext(t)},true);

function render(){{const real=S.collection,es=$('#emptyStart');if(es){es.hidden=real.length>0;const ch=$('#chart'),tf=$('#tf');if(ch)ch.style.display=real.length?'':'none';if(tf)tf.style.display=real.length?'':'none'}}const t=totals();const tf=S.settings.tf;$('#tfLbl').textContent=({1:'1T',7:'7T',30:'30T',90:'3M',365:'1J',0:'Alle'})[tf];
 window.FX?FX.count($('#sumVal'),t.v):($('#sumVal').textContent=money(t.v));$('#sumBuy').textContent=money(t.b);const g=$('#sumGain');g.textContent=(t.g>=0?'+':'')+money(t.g);g.className=cls(t.g);$('#sumCnt').textContent=t.n;
 const pts=series(tf);const ch=pts.length>=2?pts.at(-1).v-pts[0].v:0;const chp=pts.length>=2&&pts[0].v?ch/pts[0].v*100:0;
 const sc=$('#sumChg');sc.className='chg '+cls(ch);sc.textContent=`${ch>=0?'▲ +':'▼ '}${money(Math.abs(ch))} (${chp.toFixed(1).replace('.',',')} %)`;
 const C=S.collection.map(c=>({c,ch:itemChange(c,tf)}));
 const mk=(x,list)=>{const c=x.c;const el=tile({src:c.estimate?'Schätzung':c.ownPrice!=null?'eigen':(c.tdx&&c.tdx.src)||'',type:c.types&&c.types[0],img:c.img,name:c.name,sub:`${c.set||''} ${c.number||''} · ${c.lang}`,price:c.price,chg:x.ch,badge:c.type==='sealed'?'SEALED':/PSA|CGC|BGS|Graded/.test(c.cond)?c.cond:c.lang==='JP'?'JP':'',qty:c.qty});el.onclick=()=>detail({item:c,list});if(!c.img&&(c.tdxId||c.apiId)&&!c._imgTry){c._imgTry=1;const lg0=String(c.lang||'de').toLowerCase(),id0=c.tdxId||c.apiId;Prices.byId(id0,lg0).then(async x=>{let en=false;if(!(x&&x.image)&&lg0!=='en'&&!String(id0).startsWith('jp:')){x=await Prices.byId(id0,'en').catch(()=>null);en=true}if(x&&x.image){c.img=x.image;if(en)c.imgEn=true;delete c._imgTry;save();const im=el.querySelector('.im');if(im){im.style.backgroundImage=`url('${x.image}')`;const sv=im.querySelector('svg');sv&&sv.remove();if(en&&!el.querySelector('.imgnote'))im.insertAdjacentHTML('afterend','<div class="imgnote">Bild: englische Version</div>')}}}).catch(()=>{})}if(c.imgEn&&!el.querySelector('.imgnote')){const im=el.querySelector('.im');im&&im.insertAdjacentHTML('afterend','<div class="imgnote">Bild: englische Version</div>')}return el};
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
function detectLang(t){const kn=(t.match(/[\u3040-\u30ff]/g)||[]).length;if(kn>=3&&!(detectLatin(t)>=2))return'JP';t=kn?t.replace(/[\u3040-\u30ff]/g,' '):t;if(/[\uac00-\ud7af]/.test(t))return'KR';if(/[\u4e00-\u9fff]/.test(t))return'CN';
 const T=t.toLowerCase(),k={DE:/schw[aä]che|r[uü]ckzug|resistenz|f[aä]higkeit|entwickelt|basis-pok|\bkp\b|angriff|illustr|verhindere|w[aä]hrend|m[uü]nze|schaden|\bwirf|gegner|n[aä]chsten|\bbasis\b/g,EN:/weakness|retreat( cost)?|\bresistance\b|ability|evolves|basic pok|\bhp\b|damage|pok[ée]mon power|illus\.|illus\b(?!tr)/g,FR:/faiblesse|retraite|r[ée]sistance|talent|[ée]volue|\bpv\b|d[ée]g[aâ]ts|pok[ée]mon de base/g,IT:/debolezza|ritirata|resistenza|abilit|\bps\b|si evolve/g,ES:/debilidad|retirada|resistencia|habilidad|evoluciona/g,PT:/fraqueza|recuo|habilidade|evolui/g};
 // Treffer zählen; 'resistance' zählt nicht für FR (nur mit Akzent oder weiteren FR-Wörtern)
 const sc={};for(const[l,r]of Object.entries(k))sc[l]=(T.match(r)||[]).length;sc.FR-=(T.match(/\bresistance\b/g)||[]).length;
 let best='',bv=0;for(const l of ['DE','EN','FR','IT','ES','PT'])if(sc[l]>bv){bv=sc[l];best=l}return best}
function applyScan(r,lang){window.scanLang=lang||'';window.pendingScan={name:r.name,jp:r.jp,number:r.full||r.number,set:r.set,lang};$('#scanStatus').textContent=`Scan erkannt: ${r.name||'?'} ${r.number?'· Nr. '+r.number:''}${lang?' · Sprache '+lang:''}`;
 $('#qName').value=r.name||'';$('#qNum').value=r.energy?'':(r.number||'');go('v-search');search(r.name,r.energy?'':r.number,'','');scanBoxPrice(r,lang);nextScanBtn()}
// Preis der best passenden Kachel in die 'Karte (XX)'-Box übernehmen (gleicher Wert wie die Kachel)
function scanBoxPrice(r,lang){let n=0;const num=String(r.number||'').replace(/^0+/,''),nm=nrm(r.name),fl={DE:'🇩🇪',EN:'🇬🇧',JP:'🇯🇵'}[lang]||'';clearInterval(window._sbp);window._sbp=setInterval(()=>{if(++n>400)return clearInterval(window._sbp);const R=$('#results');const box=R&&R.querySelector('.scanpick b');if(!box)return;
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
const ocrW={};function getW(l){if(!ocrW[l])ocrW[l]=(async()=>{const w=await Tesseract.createWorker(l==='num'||l==='dig'?'eng':l);
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
function cardCropA(src){const W=src.width,H=src.height,k=200/Math.max(W,H),w=Math.round(W*k),h=Math.round(H*k);const t=document.createElement('canvas');t.width=w;t.height=h;
 const g=t.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0,w,h);const d=g.getImageData(0,0,w,h).data;const R=new Float32Array(h),C=new Float32Array(w);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);if(mx>140&&mx-mn>50){R[y]++;C[x]++}}
 const span=(A,n,f)=>{let a=0,b=n-1;while(a<n&&A[a]<f)a++;while(b>a&&A[b]<f)b--;return[a,b]};const [y0,y1]=span(R,h,w*.35),[x0,x1]=span(C,w,h*.35);
 const cw=(x1-x0+1)/k,ch=(y1-y0+1)/k,ar=cw/ch;if(x1<=x0||y1<=y0||ar<.55||ar>.9||cw*ch<W*H*.15||cw*ch>W*H*.95)return src;
 const o=document.createElement('canvas');o.width=Math.round(cw);o.height=Math.round(ch);o.getContext('2d').drawImage(src,x0/k,y0/k,cw,ch,0,0,o.width,o.height);window.cropDbg=[x0/k,y0/k,cw,ch].map(Math.round);return o}
async function toCanvas(file,max=1600){window.warmOCR&&warmOCR();let bm;try{bm=await createImageBitmap(file)}catch(e){bm=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Bild nicht lesbar'));i.src=URL.createObjectURL(file)})}
 const W=bm.width,H=bm.height,k=Math.min(1,max/Math.max(W,H));const c=document.createElement('canvas');c.width=Math.round(W*k);c.height=Math.round(H*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return c}
async function readNumber(src){const w=await getW('num');const re=/(\d{1,3})\s*\/\s*(\d{2,3})/g;window.numDbg=[];let weak='';
 for(const [x,y,ww,h,k,m] of [[.12,.93,.3,.07,8,'dark'],[.08,.92,.36,.08,6,'dark2'],[.7,.935,.3,.065,6,'dark'],[.5,.9,.5,.1,4,'dark'],[0,.935,.42,.06,6,'dark'],[0,.935,.42,.06,6,'dark2'],[0,.91,.45,.08,5,'dark'],[0,.86,.5,.14,4,'dark'],[.5,.9,.5,.1,4,'dark'],[0,.75,1,.25,3,'dark'],[0,.5,1,.5,3,'dark2']]){
  const {data}=await w.recognize(cropC(src,x,y,ww,h,k,m));window.numDbg.push(data.text);
  for(const mm of (data.text||'').matchAll(re)){const v=mm[1]+'/'+mm[2];if(mm[1].length===mm[2].length||(+mm[1]>0&&numOK(v)))return mm[1].replace(/^0+(?=\d)/,'')+'/'+mm[2];weak||=v}}
 return weak?{weak}:''}
// Gesamtanalyse: Text (DE/EN), bei Kana/schwacher Erkennung Japanisch, Nummer aus unterem Streifen
// Karten mit gleicher Nummer + Gesamtzahl holen; Name nehmen, wenn sein Grundname im OCR-Text steht
async function setNameCheck(num,lang,txt,name){const[a0,t0]=num.split('/');const tot=+t0,n=String(+a0);let sets=(SETS||[]).filter(s=>+s.printedTotal===tot).slice(0,8);if(!sets.length){try{window._tdxSets=window._tdxSets||fetch('https://api.tcgdex.net/v2/en/sets',{signal:AbortSignal.timeout(8000)}).then(r=>r.json()).catch(()=>{window._tdxSets=null;return[]});const j=await window._tdxSets;sets=(j||[]).filter(x=>x.cardCount&&+x.cardCount.official===tot).slice(0,8).map(x=>({id:x.id,name:x.name,printedTotal:tot}))}catch(e){}}for(const c in SETCODES){const x=SETCODES[c];if(x.total===tot&&x.tdx&&!sets.some(s=>s.id===x.tdx))sets.push({id:x.tdx,name:x.name,printedTotal:tot})}if(!sets.length)return null;
 const T=nrm(txt),lg=(lang||'DE').toLowerCase().replace('jp','ja');const C=[];
 await Promise.all(sets.map(async s=>{for(const L of [lg,'en']){try{const c=await wto(Prices.lookup('',L,s.id,n),6000,'t');if(c&&c.name){C.push({name:c.name,setId:s.id,setName:s.name,lg:L});break}}catch(e){}}}));
 window.setChkDbg=C.map(c=>c.setId+':'+c.name);if(!C.length)return null;
 const base=x=>nrm(String(x).replace(/[-\s]*(VMAX|VSTAR|V-UNION|V|GX|EX|ex|BREAK)$/,''));
 const hit=C.find(c=>base(c.name)===base(name))||C.find(c=>base(c.name).length>=4&&T.includes(base(c.name)))||(C.length===1&&(!name||!T.includes(base(name)))?C[0]:null)||(()=>{let bst=null,bd=9;for(const c of C){const b=base(c.name),L=b.length;if(L<4)continue;for(let i=0;i+L<=T.length;i++){const d=lev(T.substr(i,L),b);if(d<bd){bd=d;bst=c}}}return bst&&bd<=Math.max(1,Math.floor(base(bst.name).length*.3))?bst:null})();
 if(!hit)return null;let nm=hit.name;if(hit.lg==='en'&&lg!=='en'){try{nm=deName(nm)||nm}catch(e){}}return{...hit,name:nm}}
async function analyze(src,st0=()=>{}){const t0=performance.now();window.stDbg=[];const st=m=>{window.stDbg.push(Math.round(performance.now()-t0)+':'+m);st0(m)};const orig=src;src=cardCrop(src);let jpSet='';window.energyHue=hueType(src);st('Name & Nummer werden gelesen…');
 // parallel: Name-Streifen oben (JP + DE/EN) und Nummer-Streifen unten – keine Ganzkarten-OCR, solange das reicht
 const top=cropC(src,.15,.04,.65,.12,3,'dark'),topG=cropC(src,0,.02,1,.12,2);
 const pJ=getW('jpn').then(w=>w.recognize(top)).then(r=>r.data.text||'');
 const pE=getW('deu+eng').then(w=>w.recognize(topG)).then(r=>r.data);
 const pN=readNumber(src);
 const [tTop,rE,num0]=await Promise.all([pJ,pE,pN]);window.topDbg=tTop;
 let number=num0,numWeak=false;if(number&&number.weak){number=number.weak;numWeak=true}
 const tL=rE.text||'';window.latDbg=tL;let latW=(tL.match(/[A-Za-zÄÖÜäöüß]{3,}/g)||[]),latin=latW.length>=1&&(rE.confidence>=45||latW.some(w=>/^(basis|phase|energie|basic|stage|energy)$/i.test(w)));if(latin&&/[\u3040-\u30ff]{3,}/.test(tTop.replace(/\s/g,''))&&jpName(tTop)&&!latW.some(w=>/^(basis|phase|energie|basic|stage|energy|trainer|item)$/i.test(w))&&rE.confidence<70)latin=false;
 const pT=parseTop(tL),numTxt=(window.numDbg||[]).join('\n');
 let jp=latin?null:jpName(tTop),text=tTop+'\n'+tL,kana=!latin&&/[\u3040-\u30ff]{2,}/.test(tTop.replace(/\s/g,'')),lang=jp?'JP':'';
 let r1=rE,conf=rE.confidence,energy=pT.energy;
 if(latin){lang=langLatin(tL+'\n'+numTxt)}
 // Schnellpfad: Set-Code (z.B. 30C) unten gelesen → Name aus Titelzeile gegen Set-Liste, Nummer aus der Liste (spart Vollbild-OCR + Nummernpässe)
 let fast=false;window.fastDbg=[src.width,!!energy,tTop.slice(0,20),(numTxt.match(/30C/)||[''])[0],numTxt.length];const m30=(numTxt+'\n'+tL).match(/(30C|3OC|30c)/);if(!energy&&(m30||!/[\u3040-\u30ff]{3,}/.test(tTop.replace(/\s/g,'')))){try{const m=m30;const sx=m&&SETCODES['30C'];const tot=number&&number.includes('/')?+number.split('/')[1]:0;const sy=sx||(tot?Object.values(SETCODES).find(x=>x.total===tot&&x.tdx):null);
  if(sy&&sy.tdx){window.stDbg&&st('Name wird mit Set-Liste abgeglichen…');let tT='';try{const w=await getW('deu+eng');tT=(await w.recognize(cropC(src,.1,.02,.6,.07,2))).data.text||''}catch(e){}window.titleDbg=tT;window.fastDbg.push('T:'+tT);const f=await setListFix(sy.tdx,lang||'DE',tTop+'\n'+tL+'\n'+tT,number?String(number).split('/')[0]:'',pT.name||'');if(f){number=String(+f.localId||f.localId)+'/'+sy.total;numWeak=false;fast={name:f.name,sy};window.fastDbg.push('HIT');latin=true;jp=null;kana=false;if(!lang||lang==='JP')lang=langLatin(tL+'\n'+numTxt)}}}catch(e){console.warn('fast',e);window.fastDbg.push('ERR '+e.message)}}
 if(!fast&&!jp&&!(latin&&pT.name&&(number||energy))){// Fallback: ganze Karte (Sprache über Wörter wie Schwäche/Weakness)
  st('Ganze Karte wird gelesen…');const [a,b]=await Promise.all([getW('deu+eng').then(w=>w.recognize(cropC(src,0,0,1,1,1))),latin?null:getW('jpn').then(w=>w.recognize(cropC(src,0,0,1,1,1)))]);
  r1=a.data;conf=Math.max(conf,r1.confidence);text+='\n'+r1.text+(b?'\n'+b.data.text:'');
  const fullLatin=latin||(r1.text.match(/[A-Za-zÄÖÜäöüß]{4,}/g)||[]).length>=6;
  if(fullLatin){latin=true;lang=langLatin(tL+'\n'+r1.text+'\n'+numTxt);kana=false;jp=null}
  else{jp=jpName(text);lang=detectLang(r1.text||'');if(jp||(b&&/[\u3040-\u30ff]{2,}/.test(b.data.text.replace(/\s/g,'')))){kana=true;lang='JP'}}
  if(!energy)energy=parseTop(r1.text).energy}
 const p=pT.name?pT:parseOCR(r1.text||'');if(!number){const m=text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);if(m)number=m[1].replace(/^0+(?=\d)/,'')+'/'+m[2]}
 let sc=fast?fast.sy:findSet(text+'\n'+numTxt,number);window.scanPart={name:(jp&&jp.name)||p.name||'',number:number||''};scanPrefetch(window.scanPart,lang);
 if(!number&&!energy){const m=(numTxt+'\n'+text).match(/\b(?:30C|3OC)\s*[^\d\n]{0,3}(\d{3})\b/i);if(m){number=m[1].replace(/^0+(?=\d)/,'');numWeak=true}}
 if(energy){if(!number){const m=(numTxt+'\n'+text).match(/\b(\d{3})\b/);if(m)number=m[1]}if(lang===''||lang==='JP'&&latin)lang='DE'}
 if((!number||numWeak)&&!energy&&(jp||kana)){st('Kartennummer wird gesucht…');let bn=null;try{bn=(orig!==src&&await readNumberBands(orig))||await readNumberBands(src)}catch(e){}if(bn){number=bn.num;numWeak=false;if(bn.set)jpSet=bn.set}}
 if((!number||numWeak)&&!energy&&src.width>=380){st('Kartennummer wird genau gelesen…');const n2=await readNumberHi(src);if(n2){number=n2;numWeak=false}}
 if(number&&number.includes('/')&&!energy&&!jp&&!numOK(number)){st('Kartennummer wird genau gelesen…');const n2=src.width>=380?await readNumberHi(src):'';if(n2&&numOK(n2)){number=n2;numWeak=false}else{number='';numWeak=false}}
 if((!number||numWeak)&&!energy&&!jp){st('Kartennummer: zweiter Versuch (vergrößert)…');let s3=null;try{s3=findSet(text+'\n'+(window.numDbg||[]).join('\n'),'')}catch(e){}if(!s3&&/30th|celebration/i.test(text))s3=SETCODES['30C'];let n3='';try{n3=await readNumberHi2(src,s3&&s3.total||0)}catch(e){console.warn(e)}if(n3&&numOK(n3)){number=n3;numWeak=false}}
 if(!number&&!energy){st('Kartennummer wird gesucht…');let bn=null;try{bn=await readNumberBands(src);if(!bn&&orig!==src)bn=await readNumberBands(orig)}catch(e){console.warn(e)}if(bn&&(jp||kana||numOK(bn.num))){number=bn.num;numWeak=false;if(bn.set)jpSet=bn.set}}
 if((jp||kana)&&number&&number.includes('/')){let tt=+number.split('/')[1];const m=(text+'\n'+numTxt).match(/\b(M\d{1,2}[a-z]?)\b/i);let cs=jpSet||(m&&m[1])||'';cs=cs.replace(/^m/,'M').replace(/A$/,'a');if(!Object.values(JPSETS).includes(tt)){const nb=Object.values(JPSETS).find(v=>lev(String(v),String(tt))===1);if(nb){number=number.split('/')[0]+'/'+nb;tt=nb}}if(JPSETS[cs]!==+number.split('/')[1]){const f=Object.entries(JPSETS).find(([k,v])=>v===tt);if(f&&(!cs||/^M/i.test(cs)))cs=f[0]}jpSet=cs}
 if(!sc&&number)sc=findSet(text+'\n'+numTxt,number);if(sc&&sc.total&&number&&number.includes('/')){const[a0,t0]=number.split('/');if(+t0!==sc.total&&d1(t0,sc.total))number=a0+'/'+sc.total}
 let name=jp?(jp.de||jp.en):'',confident=!!jp&&!numWeak,weak=false;
 if(energy){name='Basic '+energy+' Energy';confident=true}
 else if(!jp&&!kana&&p.name&&p.name.length>=3&&(latin||conf>=65)){name=deName(p.name);confident=!!number&&!numWeak&&(conf>=55||name!==p.name||latin);if(nrm(name).length<=5&&!(conf>=75&&nrm(p.name)===nrm(name))&&!/energ/i.test(name)&&conf<45){confident=false;weak=true}}
 if(!name&&p.name&&!kana)name=deName(p.name);
 // Name gegen Set mit passender Gesamtzahl prüfen (z.B. 44/185 → Farbenschock: Pikachu VMAX)
 if(jp&&number&&window.Prices&&number.includes('/')&&!Object.values(JPSETS).includes(+number.split('/')[1])&&numOK(number)){try{let l2=detectLang(text)||'DE';if(l2==='JP')l2='DE';const sn=await setNameCheck(number,l2,text+'\n'+numTxt,'');if(sn){jp=null;kana=false;lang=l2;name=sn.name}}catch(e){}}
 window.scanPart={name:name||(window.scanPart||{}).name||'',number:number||''};scanPrefetch(window.scanPart,lang);
 let listFix=!!fast;if(fast){name=fast.name;confident=true;weak=false}if(!energy&&!jp&&lang!=='JP'&&number&&number.includes('/')){const tot=+number.split('/')[1];const sx=(sc&&sc.tdx&&+sc.total===tot)?sc:Object.values(SETCODES).find(x=>x.total===tot&&x.tdx);if(sx){try{st('Name wird mit Set-Liste abgeglichen…');const f=await setListFix(sx.tdx,lang,tTop+'\n'+text+'\n'+numTxt,number.split('/')[0],name);if(f){name=f.name;number=String(+f.localId||f.localId)+'/'+tot;sc=sc&&sc.tdx===sx.tdx?sc:sx;confident=true;numWeak=false;weak=false;listFix=true}}catch(e){console.warn('setListFix',e)}}}
 if(!listFix&&!energy&&!jp&&lang!=='JP'&&number&&number.includes('/')&&window.Prices){try{st('Name wird mit Set abgeglichen…');const sn=await setNameCheck(number,lang,text+'\n'+numTxt,name);if(sn){name=sn.name;if(!sc)sc={id:sn.setId,name:sn.setName,tdx:sn.setId,total:+number.split('/')[1]};confident=true;numWeak=false;weak=false}}catch(e){console.warn('setNameCheck',e)}}
 if(name&&!/\b(VMAX|VSTAR|V|GX|EX|ex)$/.test(name)){const tt=text.replace(/\n/g,' ');if(/\bv[mn]?[a-z]?ax\b/i.test(tt)&&/vmax|vinax|vmnax|v-max/i.test(tt))name+=' VMAX';else if(/\bvstar\b/i.test(tt))name+=' VSTAR'}
 window.scanMs=Math.round(performance.now()-t0);
 if((jp||kana)&&lang!=='JP')lang='JP';
 return{name,en:jp&&jp.en,jp:jp&&jp.jp,weak,number:(number||'').split('/')[0],full:number,lang,confident,energy:!!energy,setId:lang==='JP'?'':(sc&&sc.id||''),set:lang==='JP'?(jpSet||setCode(text+'\n'+numTxt)):sc?(sc.tdx||sc.name):setCode(text+'\n'+numTxt),raw:text,conf:Math.round(conf),ms:window.scanMs}}
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
function warmOCR(){if(!window.Tesseract||window._warm)return;window._warm=1;['deu+eng','jpn','num','dig'].forEach(l=>getW(l).catch(()=>{delete ocrW[l];window._warm=0}))}
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
  const swg=setWant($('#spSet').value),setL=[];if(swg.length){for(const sid of swg)for(const lg of [lang,'en']){try{const j=await (await fetch('https://api.tcgdex.net/v2/'+lg+'/sets/'+encodeURIComponent(sid))).json();const q=nrm(name);(j.cards||[]).forEach(c=>{const nn=nrm(c.name);if(c.image&&q&&(nn.startsWith(q)||q.startsWith(nn))&&!setL.some(x=>x.id===c.id))setL.push({id:c.id,localId:c.localId,name:c.name,image:c.image})})}catch(e){}if(setL.length)break}}
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
function scanResult(r){if(window.scanAbandon)return;scanPrefetch({name:r.name,number:r.energy?'':r.number},r.lang);msOff();window.lastScan=r;if(batchOn()&&r.confident&&r.name&&r.number&&r.lang!=='JP'&&!r.energy){$('#scanPick').hidden=true;$('#scanbox')?.classList.add('hasres');trayAdd(r,r.lang);return}$('#scanbox')?.classList.add('hasres');const st=$('#scanStatus2');
 st.textContent=`Erkannt: ${r.name||'?'}${r.jp?' ('+r.jp+')':''} · Nr. ${r.full||r.number||'?'}${r.lang?' · '+r.lang:''}`;
 if(r.confident&&(r.number||r.energy)&&r.lang!=='JP'){$('#scanPick').hidden=true;applyScan(r,r.lang)}else if(r.lang==='JP'&&r.name){const t=st.textContent;st.textContent='⏳ Suche japanische Karte…';jpHit(r).then(h=>{r.hit=h;st.textContent=t;scanPick(r)})}else scanPick(r)}
async function handleFile(f){$('#scanbox')?.classList.remove('hasres');window.scanLang='';window.pendingScan=null;window.lastScan=null;const st=$('#scanStatus2');$('#scanPick').hidden=true;$('#scanPick').innerHTML='';st.textContent='';const lt=$('#liveText');if(lt)lt.textContent='';const ss=$('#scanStatus');if(ss)ss.textContent='';
 if(!f){st.textContent='Kein Bild ausgewählt.';return}
 if(!window.Tesseract){st.textContent='❌ Texterkennung nicht geladen – Internet prüfen und neu laden.';return}
 $('#scanbox').classList.add('busy');msArm();
 try{const c=await toCanvas(f);const r=await analyze(c,m=>st.textContent='⏳ '+m);scanResult(r)}
 catch(err){if(!window.scanAbandon)st.textContent='❌ Fehler bei der Erkennung: '+(err&&err.message||err)}finally{msOff();$('#scanbox').classList.remove('busy')}}
$('#scanBtn').addEventListener('click',e=>{e.preventDefault();stopLive();$('#scanStatus2').textContent='';const i=$('#scanFile');i.value='';i.click()});
$('#livePhoto').addEventListener('click',e=>{e.preventDefault();if(!live.stream)return;liveShoot()});$('#uploadBtn').addEventListener('click',e=>{e.preventDefault();stopLive();$('#scanStatus2').textContent='';const i=$('#uploadFile');i.value='';i.click()});
['#scanFile','#uploadFile'].forEach(id=>$(id).addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];handleFile(f).finally(()=>{e.target.value=''})}));
// Live-Scan
let live={stream:null,timer:null,busy:false,last:null,torch:false,nameOnly:0,nameKey:''};
function camErr(msg){const st=$('#scanStatus2');st.innerHTML='';const d=document.createElement('div');d.className='camerr';d.textContent='⚠️ '+msg;st.appendChild(d)}
function camMsg(e){const n=e&&e.name||'';if(n==='NotAllowedError'||n==='SecurityError')return 'Kamera-Zugriff verweigert. Bitte in Chrome auf das Schloss-Symbol neben der Adresse tippen → Berechtigungen → Kamera erlauben, dann neu laden. Alternativ „Bild hochladen“.';
 if(n==='NotFoundError'||n==='OverconstrainedError')return 'Keine passende Kamera gefunden.';if(n==='NotReadableError'||n==='AbortError')return 'Kamera ist von einer anderen App belegt. Andere Kamera-Apps schließen und erneut versuchen.';return 'Kamera konnte nicht gestartet werden: '+(e&&e.message||e)}
function startLive(){const st=$('#scanStatus2');const sp=$('#scanPick');if(sp)sp.hidden=true;
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
function stopLive(){live.switched=false;clearInterval(live.timer);live.timer=null;if(live.stream){live.stream.getTracks().forEach(t=>t.stop());live.stream=null}
 const v=$('#liveVideo');if(v)v.srcObject=null;$('#scanbox')?.classList.remove('live');live.torch=false;live.ic=null;const fs=$('.frame span');if(fs)fs.textContent='Karte im Rahmen platzieren'}
const wto=(p,ms,m)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error(m||'Zeitüberschreitung')),ms))]);
function lStat(t){$('#scanStatus2').textContent=t}
function needOCR(){if(window.Tesseract)return true;if(!window._tLoad){window._tLoad=1;const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=()=>{window._tLoad=0};s.onerror=()=>{window._tLoad=0};document.head.append(s)}return false}
// Kamera = nur Sucher; nur '📸 Foto' löst aus
async function liveTick(){return liveShoot()}
async function liveShoot(){const btn=$('#livePhoto');if(!live.stream||live.shooting)return;const v=$('#liveVideo');live.shooting=true;const my=live.shotId=(live.shotId||0)+1;
 if(btn){btn.disabled=true;btn.classList.remove('pulse')}camFlash();navigator.vibrate?.(30);lStat('📸 Foto aufgenommen – lese Karte…');
 try{let hi=null;try{hi=await wto(grabStill(v),4500,'Foto-Zeitüberschreitung')}catch(e){console.warn(e)}
  if(!hi&&v.videoWidth){hi=document.createElement('canvas');hi.width=v.videoWidth;hi.height=v.videoHeight;hi.getContext('2d').drawImage(v,0,0,hi.width,hi.height)}
  if(!hi)throw new Error('Kein Kamerabild – bitte kurz warten und erneut drücken');
  const blob=await new Promise(res=>{try{hi.toBlob(res,'image/jpeg',0.95)}catch(e){res(null)}});const c=blob?await toCanvas(blob):hi;
  if(!needOCR()){lStat('⏳ Texterkennung lädt…');for(let i=0;i<60&&!window.Tesseract;i++)await new Promise(r=>setTimeout(r,500));if(!window.Tesseract)throw new Error('Texterkennung lädt nicht (Internet?)')}
  lStat('🔍 Foto aufgenommen – lese Karte…');msArm();
  const r=await wto(analyze(c,m=>{if(!window.scanAbandon)$('#scanStatus2').textContent='⏳ '+m}),60000,'Erkennung dauert zu lange');msOff();if(my!==live.shotId||window.scanAbandon)return;
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
 const upd=w=>{if(!w||!navigator.serviceWorker.controller)return;let b=$('#updBanner');if(!b){b=document.createElement('button');b.type='button';b.id='updBanner';b.textContent='🔄 Neue Version verfügbar – tippen zum Aktualisieren';document.body.append(b)}b.hidden=false;b.onclick=()=>{want=true;b.textContent='⏳ Aktualisiere…';try{w.postMessage({type:'SKIP_WAITING'})}catch(e){location.reload()}setTimeout(()=>{if(!rl)location.reload()},4000)}};
 navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{window.swReg=r;if(r.waiting)upd(r.waiting);r.addEventListener('updatefound',()=>{const w=r.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed')upd(r.waiting||w)})});
  const chk=()=>r.update().catch(()=>{});chk();document.addEventListener('visibilitychange',()=>{if(!document.hidden)chk()});addEventListener('focus',chk);setInterval(chk,30*60*1000)}).catch(()=>{});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(want&&!rl){rl=true;location.reload()}})}
// Version sichtbar (aus sw.js gelesen)
(async()=>{let v='';try{const t=await (await fetch('sw.js',{cache:'no-store'})).text();v=(t.match(/kartenapp-(v\d+)/)||[])[1]||''}catch(e){}
 if(!v&&window.caches){try{v=((await caches.keys()).find(k=>/^kartenapp-v\d+$/.test(k))||'').replace('kartenapp-','')}catch(e){}}
 if(v){const el=document.createElement('div');el.id='appVer';el.textContent='Kartenapp '+v;el.className='appver';const ft=document.querySelector('.appfoot');(ft||document.body).append(el);setTimeout(()=>sessionStorage.removeItem('swrl'),5000)}})();
S.collection.forEach(trackPrice);snapshot();render();refreshPrices();loadSets();

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
 T.innerHTML=`<div class="trayhead"><b>🗂️ Scan-Liste (${TRAY.length})</b><span>${money(sum)}</span></div>`+TRAY.map(x=>`<div class="trayrow" data-u="${x.uid}">${phImg(x.img&&imgU(x.img,'low'),x.name,x.number,'phtray')}<div class="trayinfo"><b>${esc(x.name)}</b><span class="muted small">${esc(x.set||'Set ?')} · ${esc(x.number||'?')} · ${esc(x.lang)}</span><span class="trayp">${x.best?esc(money(+x.best.eur)):'kein Preis'}</span><label class="traybuy">Kaufpreis (€)<input type="text" inputmode="decimal" placeholder="optional, z.B. 2,75" value="${esc(x.buy||'')}" autocomplete="off"></label></div><div class="traybtns"><button type="button" class="tAlt">🔄 Andere Version wählen</button><button type="button" class="tDel" aria-label="Entfernen">✕ Entfernen</button></div><div class="trayalt" hidden></div></div>`).join('')+`<button type="button" class="primary trayall" id="trayAll">➕ Alle ${TRAY.length} hinzufügen</button>`;
 T.querySelectorAll('.trayrow').forEach(row=>{const x=TRAY.find(t=>t.uid===row.dataset.u);row.querySelector('.traybuy input').oninput=e=>{x.buy=e.target.value.trim()};row.querySelector('.tDel').onclick=()=>{TRAY.splice(TRAY.indexOf(x),1);trayRender()};row.querySelector('.tAlt').onclick=()=>trayAlt(x,row.querySelector('.trayalt'))});
 $('#trayAll').onclick=trayCommit}
async function trayAlt(x,box){if(!box.hidden){box.hidden=true;return}box.hidden=false;box.innerHTML='<p class="muted small">Lädt Versionen…</p>';let L=[];const lg=x.lang.toLowerCase();
 try{L=(await Prices.suggest(x.r.name||x.name,lg==='jp'?'ja':lg,40))||[]}catch(e){}const num=String(x.number||'').replace(/^0+/,'');L.sort((a,b)=>(String(b.localId).replace(/^0+/,'')===num)-(String(a.localId).replace(/^0+/,'')===num));
 if(!L.length){box.innerHTML='<p class="muted small">Keine anderen Versionen gefunden</p>';return}box.innerHTML='';
 for(const c of L.slice(0,24)){const b=document.createElement('button');b.type='button';b.className='spThumb';b.innerHTML=`${phImg(c.img&&imgU(c.img.replace(/\/(low|high)\.webp$/,'')),c.name,c.localId,'phthumb')}<span>${esc(c.set&&c.set.name||sidOf(c.id))} · ${esc(c.localId)}</span>`;
  b.onclick=async()=>{box.innerHTML='<p class="muted small">Preis wird geladen…</p>';let d=null;try{d=await Prices.byId(c.id,lg==='jp'?'ja':lg)}catch(e){}const n=trayItem(x.r,x.lang,d||{id:c.id,name:c.name,set:c.set,localId:c.localId,image:c.img});n.uid=x.uid;TRAY[TRAY.indexOf(x)]=n;trayRender()};box.append(b)}}
function trayCommit(){const n=TRAY.length,buys=[];for(const x of TRAY){const b=x.best;const it={uid:uid(),manual:true,tdxId:x.id||undefined,setId:x.setId||undefined,name:x.name,set:x.set,number:x.number,img:x.img,types:[],lang:x.lang,cond:'NM',qty:1,buy:null,price:b?+b.eur:null,ownPrice:null,added:today()};
  if(x.id)it.tdx=b?{label:x.label,id:x.id,src:b.source,conv:b.umgerechnet,url:b.url}:{label:'kein Preis',id:x.id};if(it.price==null)it.noPrice=true;trackPrice(it);S.collection.push(it);if(x.buy)buys.push([it.uid,x.buy])}
 buys.forEach(([u,v])=>{try{window.setBuyPrice&&setBuyPrice(u,v)}catch(e){}});TRAY.length=0;save();snapshot();render();trayRender();$('#scanStatus2').textContent=`✅ ${n} Karte${n===1?'':'n'} zur Sammlung hinzugefügt`}
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
 if(k==='ok'&&t!=='✋ Ruhig halten…'){if(autoOn()&&live.autoArm!==false&&!live.shooting){const left=1000-(now-live.okSince);if(left<=0){live.autoArm=false;live.okSince=0;t='📸 Auto-Foto…';liveShoot()}else t='✓ Karte erkannt – ruhig halten…'}else t='✓ Karte erkannt – 📸 Foto drücken'}
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
function setNavH(){const n=document.querySelector('nav');if(n)document.documentElement.style.setProperty('--navh',n.offsetHeight+'px')}setNavH();addEventListener('resize',setNavH);
async function camGranted(){try{const p=await navigator.permissions.query({name:'camera'});return p.state==='granted'}catch(e){return false}}
const _goScan=go;go=function(v,...a){const r=_goScan.call(this,v,...a);if(v==='v-scan'){setTimeout(async()=>{const sb=$('#scanbox');if(live.stream||live.starting||!sb||sb.classList.contains('busy')||sb.classList.contains('hasres')||window.scanTray&&scanTray.length&&!batchOn())return;if(await camGranted()&&document.querySelector('#v-scan.active')&&!live.stream)startLive()},60)}return r};

// Scan-Bilder: fehlendes/kaputtes Bild → Platzhalter mit Name + Nr. (.cardph)
function phImg(url,name,num,cls){const ph=`<div class="${cls} phbox">${phCard(name,num)}</div>`;if(!url)return ph;return `<img loading="lazy" src="${esc(url)}" alt="" data-phn="${esc(name||'')}" data-phnum="${esc(num||'')}" data-phc="${cls}" onerror="phSwap(this)">`}
window.phSwap=function(im){if(tdxNext(im))return;if(/pokemon-card\.com/.test(im.dataset.orig||im.src)&&+(im.dataset.fb||0)<2)return;const d=document.createElement('div');d.className=(im.dataset.phc||'phthumb')+' phbox';d.innerHTML=phCard(im.dataset.phn,im.dataset.phnum);im.replaceWith(d)};

// Name per Fuzzy-Abgleich gegen die Kartenliste des Sets (z.B. 30C/128 → TCGdex '30th'); korrigiert auch Ziffernfehler der Nummer
async function setListFix(tdx,lang,txt,num,name){const lg=(lang||'DE').toLowerCase();let cards=[];for(const L of [...new Set([lg==='jp'?'ja':lg,'de','en'])]){try{const j=await wto(fetch('https://api.tcgdex.net/v2/'+L+'/sets/'+encodeURIComponent(tdx)).then(r=>r.ok?r.json():null),7000,'t');if(j&&j.cards&&j.cards.length){cards=j.cards;break}}catch(e){}}window.setListDbg=tdx+':'+cards.length;if(!cards.length)return null;
 const T=nrm(txt),n0=String(num||'').replace(/^0+/,''),base=x=>nrm(String(x).replace(/[-\s]*(VMAX|VSTAR|V-UNION|V|GX|EX|ex|BREAK)$/,''));let best=null,bs=1e9;
 for(const c of cards){const b=base(c.name),L=b.length;if(L<4)continue;let d=9;if(T.includes(b))d=0;else for(let i=0;i+L<=T.length;i++){const x=lev(T.substr(i,L),b);if(x<d){d=x;if(!d)break}}const lim=L<6?0:Math.max(1,Math.floor(L*.3));if(d>lim)continue;const li=String(c.localId).replace(/^0+/,'');const s=d/L-(li===n0?.5:0)-(n0&&lev(li,n0)<=1?.2:0)-(name&&base(name)===b?.3:0)-L*.005;if(s<bs){bs=s;best=c}}
 window.setListDbg+=' → '+(best?best.name+' '+best.localId:'-');return best?{name:best.name,localId:best.localId}:null}

// OCR + Set-Listen im Leerlauf nach dem Laden vorwärmen (erster Scan nicht langsamer)
(function idleWarm(n=0){const go2=()=>{if(window.Tesseract){try{warmOCR()}catch(e){}try{scanWarmSets()}catch(e){}}else if(n<40)setTimeout(()=>idleWarm(n+1),500)};if(document.readyState!=='complete')return addEventListener('load',()=>setTimeout(()=>idleWarm(n),300),{once:true});(window.requestIdleCallback||(f=>setTimeout(f,800)))(go2,{timeout:2500})})();

function retakePrompt(msg){const P=$('#scanPick'),st=$('#scanStatus2');if(st)st.textContent='⚠️ '+msg;const b=document.createElement('div');b.className='retake';b.innerHTML=`<p><b>⚠️ ${esc(msg)}</b></p><button type="button" class="primary bigbtn" id="retakeBtn">📸 Neu aufnehmen</button>`;if(P){P.hidden=false;P.prepend(b)}else $('#scanbox').append(b);$('#retakeBtn').onclick=()=>{b.remove();if(P)P.hidden=true;$('#scanbox')?.classList.remove('hasres');startLive()};b.scrollIntoView({block:'center'})}
// v78: Sammlung teilen – Bild (1080x1350) per Canvas, Web Share mit Datei, sonst PNG-Download
async function shareImgLoad(u){for(const c of (u&&/assets\.tcgdex\.net\//.test(u)?tdxCands(u).filter(x=>/assets\.tcgdex\.net\//.test(x)):[]))try{const r=await fetch(imgFull(c).replace('/high.webp','/low.webp'),{mode:'cors',signal:AbortSignal.timeout(6000)});if(!r.ok)continue;return await createImageBitmap(await r.blob())}catch(e){}return null}
async function shareRender(){const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');const F='system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
 const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#2a1766');bg.addColorStop(1,'#0f1530');g.fillStyle=bg;g.fillRect(0,0,W,H);
 const t=totals(),cards=S.collection.filter(c=>c.type!=='sealed');const txt=(s,x,y,sz,col,w='700',al='left')=>{g.font=`${w} ${sz}px ${F}`;g.fillStyle=col;g.textAlign=al;g.fillText(s,x,y)};
 txt('Meine Sammlung',80,140,56,'#ffffff','800');
 txt(money(t.v),80,270,112,'#ffd84d','900');txt('Gesamtwert',80,320,34,'#c9c3e6','600');
 let y=400;if(t.b>0){const pc=t.g/t.b*100,sg=t.g>=0?'+':'−';txt(`${sg}${money(Math.abs(t.g))} (${sg}${Math.abs(pc).toFixed(1).replace('.',',')} %) seit Kauf`,80,y,44,t.g>=0?'#7ee2a8':'#e6e1f5','700');txt(`bezogen auf Karten mit Kaufpreis (Einstand ${money(t.b)})`,80,y+44,28,'#a49dc6','500');y+=110}
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
