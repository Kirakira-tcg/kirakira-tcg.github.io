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
async function api(url,tries=4,ms=7000){for(let i=0;i<tries;i++){try{const r=await fetch(url,{signal:AbortSignal.timeout(ms)});if(r.ok)return await r.json()}catch(e){}if(i<tries-1)await new Promise(r=>setTimeout(r,500*(i+1)))}throw new Error('API nicht erreichbar')}
function cmPrice(c){const p=c.cardmarket&&c.cardmarket.prices;if(!p)return null;return p.trendPrice||p.avg30||p.averageSellPrice||p.lowPrice||null}
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
$('#searchForm').onsubmit=e=>{e.preventDefault();if(window.pendingScan&&$('#qName').value!==pendingScan.name)window.pendingScan=null;if(!window.pendingScan)window.scanLang='';search($('#qName').value,$('#qNum').value,$('#qSet').value)};
let lastResults=[];
// JP-Bilder (pokemon-card.com): bei Fehler ohne Referrer neu laden, dann snkrdunk-Bild aus jpprices.json
document.addEventListener('error',async e=>{const im=e.target;if(!(im instanceof HTMLImageElement))return;const u=im.dataset.orig||im.src;if(!/pokemon-card\.com/.test(u))return;
 const n=+(im.dataset.fb||0);im.dataset.fb=n+1;im.dataset.orig=u;if(n===0){im.referrerPolicy='no-referrer';im.src=u+(u.includes('?')?'&':'?')+'r=1';return}
 if(n===1&&window.Prices&&Prices.jpImgFallback){const f=await Prices.jpImgFallback(u);if(f)im.src=f}},true);
function manualAdd(x){window._dlgLang=x.lang||'';addDialog(null,'coll');const f=$('#dlgForm');
 if(window.Prices&&x.name&&f.price){const lg=(x.lang||'DE').toLowerCase(),nm=String(x.name).replace(/\s*\(.*\)\s*$/,'').trim();Prices.lookup(lg==='jp'||lg==='ja'?String(x.name):nm,lg,x.set||null,x.number||null).then(r=>{if(r&&f.img&&!f.img.value&&r.image&&$('#dlg').open)f.img.value=r.image;if(r&&!r.best&&f.price&&$('#dlg').open){const l=f.price.closest('label');if(l&&!l.querySelector('.apl'))l.insertAdjacentHTML('beforeend','<span class="muted small apl">Noch kein Preis in den Datenbanken – wird später automatisch nachgeladen</span>')}if(r&&r.best&&f.price&&!f.price.value&&$('#dlg').open){f.price.value=r.best.eur;f.price.dataset.auto=r.best.eur;f.price.dataset.lbl=r.label;f.price.dataset.aid=r.id;const l=f.price.closest('label');if(l&&!l.querySelector('.apl'))l.insertAdjacentHTML('beforeend',`<span class="muted small apl">${esc(r.label)}</span>`)}}).catch(()=>{})}
 if(f.name)f.name.value=x.name||'';if(f.number)f.number.value=x.number||'';if(f.set)f.set.value=x.set||'';if(f.lang&&x.lang)f.lang.value=x.lang;if(f.img&&x.img)f.img.value=x.img}
function bindMan(name,num,set){const ps=window.pendingScan||{};const x={name:ps.jp?`${ps.name} (${ps.jp})`:(ps.name||name),number:ps.number||num,set:ps.set||set,lang:ps.lang};
 ['#manScan','#manScan2'].forEach(id=>{const b=$(id);if(b)b.onclick=()=>manualAdd(x)})}
async function search(name,num,set,setId){const q=[];const raw=clean(name||''),isJ=/[\u3040-\u30ff\u4e00-\u9fff]/.test(raw);let nm=raw;
 if(isJ){const sm=raw.match(/\s*(ex|EX|GX|V|VMAX|VSTAR)$/),b0=sm?raw.slice(0,sm.index):raw,r=(window.PNAMES||[]).find(x=>x[2]&&x[2].replace(/\s/g,'')===b0.replace(/\s/g,''));if(r&&r[0])nm=r[0]+(sm?' '+sm[1]:'')}
 name=isJ?nm:deName(raw);const tdxName=isJ?raw:name,ascii=/^[\x00-\x7f]*$/.test(name);num=clean(num||'').split('/')[0].replace(/^0+(?=\d)/,'');set=clean(set||'');
 if(name)q.push(name.includes(' ')?`name:"${name}"`:`name:${name}*`);if(num)q.push(`number:${num}`);if(set)q.push(`set.name:"${set}*"`);if(setId)q.push(`set.id:${setId}`);
 if(!q.length)return;const R=$('#results'),my=++SEARCHN;R.innerHTML='<p class="muted">Suche…</p>';
 const tlE=isJ?'JP':((window.pendingScan&&window.pendingScan.lang)||'').toUpperCase();
 // TCGdex (DE/EN/JP) parallel zur englischen Datenbank starten
 const tdxP=window.Prices&&!setId&&raw?tdxFind(tdxName,num,tlE||'DE').catch(()=>({list:[]})):null;
 try{let d={data:[]},apiErr=false;const sel='&select=id,name,number,set,images,cardmarket,rarity,types,supertype';
  if(setId){try{d=await setCards(setId,q,sel)}catch(e){apiErr=true}}
  else if(ascii){try{d=await api(`${API}/cards?q=${encodeURIComponent(q.join(' '))}&pageSize=60${sel}`,1,4500)}catch(e){apiErr=true}}
  if(my!==SEARCHN)return;
  if(setId&&(apiErr||!d.data.length)&&window.Prices){if(await tdxSetView(R,setId,my))return}
  if(!setId&&tdxP)return searchRender(R,d.data||[],apiErr,tdxP,{name,num,set,tdxName,my});
  if(apiErr&&!(window.Prices&&!setId&&raw))throw new Error('API nicht erreichbar');
  const ps=window.pendingScan,jpB=ps&&ps.lang&&ps.lang!=='EN'?`<div class="scanpick"><b>${ps.lang==='JP'?'🇯🇵 Japanische Karte':'Karte ('+ps.lang+')'}: ${esc(ps.name||'')} ${esc(ps.number||'')}</b><p class="muted small"><span id="tdxHint">Suche in TCGdex nach der ${ps.lang}-Version…</span></p><button type="button" class="primary big" id="manScan">➕ Manuell hinzufügen</button></div>`:'';
  const tl=isJ?'JP':((ps&&ps.lang)||window.scanLang||'').toUpperCase(),useT=window.Prices&&!setId&&name&&(tl&&tl!=='EN');
  if(!d.data.length&&setId&&name)return search(name,num,set);
  if(!d.data.length){R.innerHTML=jpB+'<p class="muted" id="noHit">'+(apiErr?'Englische Datenbank gerade nicht erreichbar – suche bei TCGdex…':'Nichts in der englischen Datenbank gefunden.')+(jpB?'':' <button type="button" id="manScan2">➕ Manuell hinzufügen</button>')+'</p>';bindMan(tdxName,num,set);if(window.Prices&&!setId&&raw)tdxResults(R,tdxName,num,tl||'DE');return}
  d.data.sort((a,b)=>setId?(parseInt(a.number)||0)-(parseInt(b.number)||0):(b.set.releaseDate||'').localeCompare(a.set.releaseDate||''));lastResults=d.data;
  R.innerHTML='';R.classList.toggle('binder-src',!!setId);for(const c of d.data){const p=cmPrice(c);const ci=cmInfo(c);const ch=ci&&ci.avg7&&p?(p-ci.avg7)/ci.avg7*100:null;
   const own=owned(c.id),el=tile({type:c.types&&c.types[0],img:c.images.small,name:setId?`${own?'✓ ':''}#${c.number} ${c.name}`:c.name,sub:`${c.set.name} · ${c.number}/${c.set.printedTotal}`,price:p,chg:ch,badge:own?'✓ BESITZ':c.rarity&&/Special|Hyper|Secret|Illustration/i.test(c.rarity)?'SAR/SIR':''});
   if(setId&&own)el.classList.add('owned');el.onclick=()=>detail({api:c});
   const a=document.createElement('div');a.className='acts';a.innerHTML='<button>+ Sammlung</button><button>☆</button>';
   a.children[0].onclick=e=>{e.stopPropagation();addDialog(c,'coll')};a.children[1].onclick=e=>{e.stopPropagation();addDialog(c,'wish')};el.append(a);R.append(el)}
  if(setId&&window.FX)FX.binder(R,SETS.find(s=>s.id===setId));if(setId){R.insertAdjacentHTML('afterbegin',`<h3 class="small" style="grid-column:1/-1">${esc((SETS.find(s=>s.id===setId)||{}).name||setId)} · ${d.data.length} Karten</h3>`);window.scrollTo(0,0)}if(jpB){R.insertAdjacentHTML('afterbegin',jpB);bindMan(name,num,set)}if(useT)tdxResults(R,tdxName,num,tl,true)
 }catch(e){R.innerHTML=`<p class="neg">${e.message}. Bitte später erneut versuchen.</p>`}}

let SEARCHN=0;$('#results').addEventListener('click',e=>{if(e.target.closest('.bprev,.bnext'))$('#results').scrollIntoView({block:'start'})});
const owned=id=>S.collection.some(x=>x.apiId===id||x.tdxId===id||(x.tdx&&x.tdx.id===id));
// alle Karten eines Sets (pokemontcg.io, mit Seiten)
async function setCards(setId,q,sel){let all=[],page=1,tot=1;while(all.length<tot&&page<6){const d=await api(`${API}/cards?q=${encodeURIComponent(q.join(' '))}&pageSize=250&page=${page}${sel}`,2,8000);all=all.concat(d.data||[]);tot=d.totalCount||all.length;page++;if(!(d.data||[]).length)break}return{data:all}}
// Set-Fallback über TCGdex (gleiche Set-IDs bei älteren Sets)
async function tdxSetView(R,setId,my){try{const r=await fetch('https://api.tcgdex.net/v2/en/sets/'+encodeURIComponent(setId),{signal:AbortSignal.timeout(8000)});if(!r.ok)return false;const j=await r.json();if(my!==SEARCHN)return true;
 const cs=(j.cards||[]).sort((a,b)=>(parseInt(a.localId)||9999)-(parseInt(b.localId)||9999)||String(a.localId).localeCompare(String(b.localId)));if(!cs.length)return false;
 R.classList.remove('binder-src');R.innerHTML=`<h3 class="small" style="grid-column:1/-1">${esc(j.name)} · ${cs.length} Karten <span class="muted">(TCGdex)</span></h3>`;
 cs.forEach(c=>{const id=c.id,el=tile({img:c.image?c.image+'/low.webp':'',name:`${owned(id)?'✓ ':''}#${c.localId} ${c.name}`,sub:`#${c.localId}/${j.cardCount&&j.cardCount.official||''}`,price:null,badge:owned(id)?'✓ BESITZ':''});const pb=el.querySelector('.p b');if(pb)pb.textContent='';el.onclick=()=>tdxDetail({id,lang:'en',name:c.name,localId:c.localId,set:{id:j.id,name:j.name},img:c.image?c.image+'/low.webp':''});R.append(el)});window.scrollTo(0,0);return true}catch(e){return false}}
const LNAME={de:'🇩🇪 Deutsch',en:'🇬🇧 Englisch',ja:'🇯🇵 Japanisch'};
// Suchergebnisse: EN-Datenbank (Cardmarket-Preise) + TCGdex nach Sprache gruppiert, progressiv
async function searchRender(R,data,apiErr,tdxP,o){R.classList.remove('binder-src');R.innerHTML='';const head=document.createElement('p');head.className='muted small';head.style.gridColumn='1/-1';head.id='noHit';R.append(head);
 data.sort((a,b)=>(b.set.releaseDate||'').localeCompare(a.set.releaseDate||'')||(parseInt(a.number)||0)-(parseInt(b.number)||0));lastResults=data;
 const ps=window.pendingScan;if(ps&&ps.lang&&ps.lang!=='EN'){head.insertAdjacentHTML('beforebegin',`<div class="scanpick" style="grid-column:1/-1"><b>${ps.lang==='JP'?'🇯🇵 Japanische Karte':'Karte ('+ps.lang+')'}: ${esc(ps.name||'')} ${esc(ps.number||'')}</b><p class="muted small"><span id="tdxHint">Suche in TCGdex…</span></p><button type="button" class="chip" id="manScan">➕ Manuell hinzufügen</button></div>`)}
 if(data.length){R.insertAdjacentHTML('beforeend',`<h3 class="small" style="grid-column:1/-1">🇬🇧 Englisch · Cardmarket-Preise (${data.length})</h3>`);for(const c of data)R.append(enTile(c))}
 head.textContent=apiErr?'Englische Datenbank gerade nicht erreichbar – zeige TCGdex.':'';
 const box=document.createElement('div');box.style.cssText='display:contents';box.innerHTML='<p class="muted small" style="grid-column:1/-1" id="tdxWait">Weitere Sprachen werden geladen…</p>';R.append(box);
 const r=await tdxP;if(o.my!==SEARCHN||!box.isConnected)return;box.innerHTML='';
 let L=r.list||[];if(data.length)L=L.filter(c=>c.lang!=='en');
 const h=$('#tdxHint');if(h)h.textContent=L.length?`Treffer bei TCGdex${r.exact?'':' (Nummer nicht gefunden, alle Treffer zum Namen)'}.`:'Auch bei TCGdex nicht gefunden – manuell hinzufügen.';
 if(!L.length&&!data.length){head.innerHTML='Keine Karte gefunden. <button type="button" id="manScan2" class="chip">➕ Manuell hinzufügen</button>';bindMan(o.tdxName,o.num,o.set);return}
 bindMan(o.tdxName,o.num,o.set);
 const ord=[(r.lang||'de'),'de','en','ja'].filter((x,i,a)=>a.indexOf(x)===i);
 for(const lg of ord){const G=L.filter(c=>c.lang===lg).sort((a,b)=>String(a.set.name).localeCompare(String(b.set.name))||(parseInt(a.localId)||0)-(parseInt(b.localId)||0));if(!G.length)continue;
  box.insertAdjacentHTML('beforeend',`<h3 class="small" style="grid-column:1/-1">${LNAME[lg]||lg} (${G.length})${r.exact?'':''}</h3>`);G.forEach((c,i)=>box.append(tdxTile(c,i<12)))}}
function enTile(c){const p=cmPrice(c);const ci=cmInfo(c);const ch=ci&&ci.avg7&&p?(p-ci.avg7)/ci.avg7*100:null;
 const el=tile({type:c.types&&c.types[0],img:c.images.small,name:c.name,sub:`${c.set.name} · ${c.number}/${c.set.printedTotal}`,price:p,chg:ch,badge:owned(c.id)?'✓ BESITZ':c.rarity&&/Special|Hyper|Secret|Illustration/i.test(c.rarity)?'SAR/SIR':''});
 el.onclick=()=>detail({api:c});const a=document.createElement('div');a.className='acts';a.innerHTML='<button>+ Sammlung</button><button>☆</button>';
 a.children[0].onclick=e=>{e.stopPropagation();addDialog(c,'coll')};a.children[1].onclick=e=>{e.stopPropagation();addDialog(c,'wish')};el.append(a);return el}
function tdxTile(c,load){const el=tile({img:c.img,name:c.name,sub:`${c.set.name} · ${c.localId} · ${c.lang==='ja'?'JP':c.lang.toUpperCase()}`,price:null,badge:owned(c.id)?'✓ BESITZ':''});const pb=el.querySelector('.p b');if(pb)pb.textContent=load?'…':'';
 if(load)Prices.byId(c.id,c.lang).then(x=>{if(pb)pb.textContent=x&&x.best?x.best.eur.toFixed(2).replace('.',',')+' €':'–'}).catch(()=>{if(pb)pb.textContent='–'});
 el.onclick=()=>tdxDetail(c);return el}
// TCGdex-Karte -> Detailansicht (Cardmarket/eBay), danach + Sammlung
async function tdxDetail(c){let x=null;try{x=await Prices.byId(c.id,c.lang)}catch(e){}const cm=x&&x.prices&&x.prices.find(p=>/^Cardmarket/.test(p.source));
 const pc={id:c.id,_tdx:x,_lang:c.lang==='ja'?'JP':c.lang.toUpperCase(),name:c.name,number:c.localId,rarity:null,types:[],set:{id:c.set.id,name:c.set.name,printedTotal:(x&&x.total)||''},
  images:{small:c.img||(x&&x.image)||'',large:(x&&x.image)||(c.img||'').replace(/\/low\.webp$/,'/high.webp')},
  cardmarket:cm?{url:cm.url,prices:{trendPrice:cm.eur,avg1:cm.avg1,avg7:cm.avg7,avg30:cm.avg30,lowPrice:cm.low}}:null};
 detail({api:pc})}
// TCGdex-Fallback für die Suche (andere Sprachen / nicht in pokemontcg.io)
function tdxNames(name,lang){const n=name.toLowerCase(),out=new Set([name]),i=lang==='de'?1:lang==='ja'?2:0;
 for(const r of [...(window.PNAMES||[]),...(window.TNAMES||[])])if(r.some(x=>x&&x.toLowerCase()===n)){if(r[i])out.add(r[i]);if(r[0])out.add(r[0])}return[...out]}
async function tdxFind(name,num,lang){lang=(lang||'de').toLowerCase();if(lang==='jp')lang='ja';const nn=num?String(num).replace(/^0+(?=\d)/,''):'';const seen=new Set();let all=[];
 const jobs=[];for(const lg of lang==='en'?['en']:[lang,'en'])for(const q of tdxNames(name,lg))jobs.push(Prices.suggest(q,lg,100).catch(()=>[]));
 for(const L of await Promise.all(jobs))for(const c of L||[])if(!seen.has(c.lang+c.id)){seen.add(c.lang+c.id);all.push(c)}
 const hit=nn?all.filter(c=>String(c.localId||'').replace(/^0+(?=\d)/,'')===nn):[];
 const pref=a=>a.filter(c=>c.lang===lang).length?a.filter(c=>c.lang===lang):a;
 return{list:hit.length?hit:all.slice(0,60),exact:!!hit.length,lang}}
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
let SETS=[];async function loadSets(){try{const d=await api(`${API}/sets?orderBy=-releaseDate&pageSize=250&select=id,name,series,releaseDate,images,total,printedTotal,ptcgoCode`);SETS=d.data.map(s=>s.name==='Base'?{...s,name:'Base Set'}:s);if(SETTAB!=='ja')renderSets()}catch(e){try{const j=await (await fetch('https://api.tcgdex.net/v2/en/sets',{signal:AbortSignal.timeout(8000)})).json();SETS=j.reverse().map(x=>({id:x.id,name:x.name,series:'',releaseDate:'',total:x.cardCount&&x.cardCount.total||'',printedTotal:x.cardCount&&x.cardCount.official||'',images:{logo:x.logo?x.logo+'.png':''}}));if(SETTAB!=='ja')renderSets()}catch(_){$('#setList').innerHTML='<p class="muted small">Sets nicht ladbar.</p>'}}}
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
// 1st Edition: TCGdex-Variantenpreis (TCGplayer 1st-edition*) wenn vorhanden, sonst Hinweis
async function firstEd(it){if(!window.Prices)return;try{const nm=(it.name||'').replace(/\s*\(.*\)\s*$/,'').trim(),num=String(it.number||'').split('/')[0]||null;let r=it.tdxId?await Prices.byId(it.tdxId,'en'):null;if(!r)r=await Prices.lookup(deName(nm),'en',null,num);
 const v=r&&r.prices&&r.prices.find(x=>/1st/i.test(x.variant||'')&&x.eur!=null);if(v&&it.ownPrice==null){it.price=v.eur;it.priceNote='';it.tdx={label:`${v.eur.toFixed(2).replace('.',',')} € · ${v.source} · 1st Edition`,id:r.id,src:v.source+' 1st',url:null};trackPrice(it);save();snapshot();render()}}catch(e){}}
const tdxNeed=x=>x.ownPrice==null&&(x.price==null||(x.lang&&x.lang!=='EN'));
async function tdxFill(x){if(!window.Prices||x.ownPrice!=null||(x.variant==='1st'&&x.tdx&&/1st/.test(x.tdx.src||'')))return false;const lang=(x.lang||'DE').toLowerCase(),name=(x.name||'').replace(/\s*\(.*\)\s*$/,'').trim(),num=String(x.number||'').split('/')[0]||null;
 let r=null;try{const same=n=>{const p=nrm(n),q=nrm(name);if(!p||!q)return true;let d=q;try{d=nrm(deName(name))}catch(e){}return p===q||p===d||p.startsWith(q)||q.startsWith(p)||p.startsWith(d)||d.startsWith(p)};r=await Prices.lookup(name,lang,x.setId||null,num);if(r&&!same(r.name))r=await Prices.lookup(name,lang,null,num);if(r&&!same(r.name))r=null;if(!(r&&r.best)&&lang!=='en'&&lang!=='jp'&&lang!=='ja'){r=await Prices.lookup(name,'en',null,num);if(r&&!same(r.name))r=null}}catch(e){console.warn(e)}
 if(!(r&&r.best))return false;x.price=r.best.eur;delete x.noPrice;x.tdx={label:r.label,id:r.id,src:r.best.source,conv:r.best.umgerechnet,url:r.best.url};return true}
// Type-ahead mit Bildvorschlägen (Prices.suggest / TCGdex)
function attachSuggest(inp,onPick,getLang,anchor){if(!inp||!window.Prices||!Prices.suggest)return;const box=document.createElement('div');box.className='sugBox';box.hidden=true;(anchor||inp).insertAdjacentElement('afterend',box);
 let t=0,seq=0;const hide=()=>{box.hidden=true;box.innerHTML=''};
 inp.setAttribute('autocomplete','off');
 inp.addEventListener('input',()=>{clearTimeout(t);const q=inp.value.trim();if(q.length<2){seq++;hide();return}
  t=setTimeout(async()=>{const my=++seq;let L=[];try{L=await Prices.suggest(q,(getLang&&getLang())||'de',24)}catch(e){}
   if(my!==seq)return;if(!L.length){hide();return}
   box.innerHTML=L.map((c,i)=>`<button type="button" class="sugItem" data-i="${i}">${c.img?`<img src="${esc(c.img)}" alt="" loading="lazy">`:'<div class="sugNo">?</div>'}<b>${esc(c.name)}</b><span>${esc(c.set.name)} ${esc(c.localId)}</span></button>`).join('');box.hidden=false;
   box.querySelectorAll('.sugItem').forEach(b=>b.onclick=()=>{const c=L[+b.dataset.i];hide();onPick(c)})},300)});
 inp.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});return{hide}}
const sugMain=attachSuggest($('#qName'),c=>{$('#qName').value=c.name;$('#qNum').value=c.localId.replace(/^0+(?=\d)/,'');window.pendingScan=null;window.scanLang='';tdxDetail(c);search(c.name,$('#qNum').value,'')},()=>(window.scanLang||'DE').toLowerCase(),$('#searchForm'));
$('#searchForm').addEventListener('submit',()=>sugMain&&sugMain.hide());
function addDialog(c,mode,sealed){const manual=!c;window.tdxPick=null;const f=$('#dlgForm');const tx=c&&c._tdx;const p=c?(cmPrice(c)??(tx&&tx.best?tx.best.eur:null)):null;const dLang=(c&&c._lang)||window._dlgLang||window.scanLang||'DE';window._dlgLang='';
 f.innerHTML=`<h3>${mode==='wish'?'Zur Wunschliste':sealed?'Sealed-Produkt hinzufügen':'Zur Sammlung'}</h3>
 ${manual?`<label>Name<input name="name" required placeholder="${sealed?'z.B. 30 Jahre Booster Bundle':''}"></label><label>Set<input name="set"></label>${sealed?'':'<label>Nummer<input name="number"></label>'}<label>Bild-URL (optional)<input name="img"></label>`:`<p><b>${esc(c.name)}</b> – ${esc(c.set.name)} ${c.number}<br>${tx?esc(tx.best?tx.label:'Noch kein Preis – wird später nachgeladen'):'Cardmarket-Trend: '+money(p)}<br><span class="muted small" id="tdxLbl"></span></p>`}
 <label>Sprache<select name="lang">${LANGS.map(l=>`<option${l===dLang?' selected':''}>${l}</option>`).join('')}</select></label>${window.scanLang&&!(c&&c._tdx)?'<p class="muted small">Sprache per Scan erkannt: '+window.scanLang+'</p>':''}
 ${mode==='wish'?`<label>Zielpreis (€)<input name="target" type="number" step="0.01" required></label>`:
 `${sealed?'<input type="hidden" name="cond" value="Sealed">':`<label>Zustand<select name="cond"><option>NM</option><option>EX</option><option>GD</option><option>LP</option><option>PL</option><option>PSA 10</option><option>PSA 9</option><option>CGC 10</option><option>BGS 9.5</option><option>PSA/Graded</option></select></label>`}
 ${sealed?'':'<label class="row" style="gap:.4rem;align-items:center"><input type="checkbox" name="first" style="width:auto"> 1st Edition</label>'}<label>Anzahl<input name="qty" type="number" value="1" min="1"></label><label>Kaufpreis pro Stück (€, optional)<input name="buy" type="number" step="0.01" placeholder="leer = nicht in Gewinn/Verlust"></label>`}
 <label>${manual?'Aktueller Wert (€, optional)':'Eigener Preis (€, leer = Cardmarket)'}<input name="price" type="number" step="0.01" placeholder="leer = automatisch aus Datenbanken"></label>
 <div class="row"><button value="ok">Speichern</button><button value="cancel" formnovalidate>Abbrechen</button></div>`;
 if(manual&&!sealed&&f.name)attachSuggest(f.name,c=>{f.name.value=c.name;if(f.set)f.set.value=c.set.name;if(f.number)f.number.value=c.localId;if(f.img&&c.img)f.img.value=c.img.replace(/\/low\.webp$/,'/high.webp')},()=>(f.lang&&f.lang.value||'DE').toLowerCase(),f.name.closest('label'));
 const dlg=$('#dlg');dlg.returnValue='';dlg.showModal();dlg.onclose=()=>{if(dlg.returnValue!=='ok')return;const v=Object.fromEntries(new FormData(f));
  const base=manual?{manual:true,name:v.name,set:v.set,number:v.number||'',img:v.img}:tx?{manual:true,tdxId:c.id,setId:c.set.id,name:c.name,set:c.set.name,number:c.number,img:c.images.large||c.images.small,types:[],tdx:tx.best?{label:tx.label,id:tx.id,src:tx.best.source,conv:tx.best.umgerechnet,url:tx.best.url}:{label:'kein Preis',id:c.id}}:{apiId:c.id,name:c.name,set:c.set.name,number:c.number,img:c.images.small,apiPrice:p,cm:cmInfo(c),types:c.types||[]};
  if(sealed)base.type='sealed';let own=v.price?parseFloat(v.price):null;const tp=manual?window.tdxPick:null;window.tdxPick=null;let tpp=null;{const au=f.price&&f.price.dataset.auto;if(au&&own===+au){own=null;tpp=+au;base.tdx={label:f.price.dataset.lbl||'',id:f.price.dataset.aid||''}}}if(tp){base.tdx=tp.tdx;base.tdxId=tp.id;base.setId=tp.setId;if(tp.price!=null&&(own==null||own===tp.price)){own=null;tpp=tp.price}}
  if(mode==='wish')S.wishlist.push({uid:uid(),...base,lang:v.lang,target:parseFloat(v.target),price:own??tpp??p,ownPrice:own});
  else{const it={uid:uid(),...base,lang:v.lang,cond:v.cond,qty:parseInt(v.qty)||1,buy:v.buy!==''&&v.buy!=null&&!isNaN(parseFloat(v.buy))?parseFloat(v.buy):null,price:own??tpp??p,ownPrice:own,added:today()};if(v.first){it.variant='1st';it.priceNote='Preis gilt nicht für 1st Edition';}if(it.price==null)it.noPrice=true;trackPrice(it);S.collection.push(it);if(v.first)firstEd(it);window.FX&&FX.reveal(it)}
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
 const CML={de:3,en:1},cmOf=r=>r&&r.prices&&r.prices.find(p=>p.source==='Cardmarket (TCGdex)');
 const showP=l=>{const pe=f.querySelector('#lflP');if(!pe)return;const r=recs[l],cm=cmOf(r),cd=cmOf(recs.de),ce=cmOf(recs.en);
  if(!r||!r.best){pe.textContent=`${l.toUpperCase()}: kein Preis bei TCGdex`;return}
  const shared=l!=='ja'&&cm&&cm.idProduct&&cd&&ce&&cd.idProduct===ce.idProduct;
  if(shared){const u=cm.url?cm.url+'&language='+CML[l]:null;pe.innerHTML=`Cardmarket: ${esc(money(cm.eur))} · gilt für alle Sprachen (Sprachfilter auf Cardmarket)${u?` · <a href="${esc(u)}" target="_blank" rel="noopener" class="plink">${l.toUpperCase()}-Angebote ↗</a>`:''}`}
  else pe.textContent=`${l.toUpperCase()}: ${r.label}`};
 const set=l=>{if(!imgs[l])return;im.src=imgs[l];mark(l);showP(l)};
 box.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.preventDefault();set(b.dataset.l)});
 if(own&&imgs[own])set(own);else mark(null)}
function detail({api:c,item,list}){const f=$('#dlgForm');const it=item||{};const ci=c?cmInfo(c):it.cm;const price=item?item.price:(cmPrice(c)??(c._tdx&&c._tdx.best?c._tdx.best.eur:null));
 const img=c?c.images.large||c.images.small:(it.img||'').replace('/small','/large');const name=c?c.name:it.name;
 const rows=ci?[['Trend',ci.trend],['Ø 1 Tag',ci.avg1],['Ø 7 Tage',ci.avg7],['Ø 30 Tage',ci.avg30],['Ab-Preis',ci.low],['Ø Verkauf',ci.sell]].filter(r=>r[1]!=null):[];
 const raw=price||0;
 const ty=((c?c.types:it.types)||[])[0];f.innerHTML=`<div class="detail" data-type="${esc((ty||'none').toLowerCase())}">${img?`<div class="dcard tiltable"><img src="${esc(img)}" alt=""><i class="holo"></i></div><div class="langFlags" id="lfl" style="display:flex;gap:.4rem;justify-content:center;margin:.35rem 0"></div><p class="muted small" id="lflP" style="text-align:center;margin:0"></p><button type="button" class="chip gyroBtn" onclick="FX.gyro()">📱 Bewegungssensor</button>`:''}<h3>${esc(name)}</h3><p class="muted small">${esc(c?c.set.name:it.set)} ${esc(c?c.number:it.number)}${item?` · ${esc(it.lang)} · ${esc(it.cond)} · ${it.qty}×`:''}</p>
 ${price!=null&&!isNaN(price)?`<div class="big" style="font-size:1.8rem">${money(price)}</div>`:`<div class="big" style="font-size:1.8rem">–</div><p class="muted small" style="margin:.2rem 0">Noch kein Preis · <a class="plink" href="https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(name)}" target="_blank" rel="noopener">auf Cardmarket ansehen ↗</a></p>`}${(()=>{const n=String((c?c.number:it.number)||'');const tot=c&&c.set&&c.set.printedTotal;const nn=n.includes('/')||!tot?n:n+'/'+tot;const q=['Pokemon',name,nn,c?c.set.name:it.set].filter(Boolean).join(' ');
 const cmu=(ci&&ci.url)||(it.tdx&&it.tdx.url&&/cardmarket/.test(it.tdx.url)?it.tdx.url:null)||`https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(name.replace(/\s*\(.*\)\s*$/,''))}`;
 const cmv=(ci&&ci.trend)||(item&&it.tdx&&/Cardmarket/.test(it.tdx.src||'')?it.price:null),jpv=(c&&c._tdx&&c._tdx.jpMarket)||(item&&it.tdx&&/JP-Markt/.test(it.tdx.src||'')?{eur:it.price,value:null}:null);
 return `<div class="pcmp"><div><span class="muted small">Cardmarket</span><b>${cmv!=null?money(cmv):'–'}</b><a class="plink" href="${esc(cmu)}" target="_blank" rel="noopener">Cardmarket ↗</a></div><div><span class="muted small">eBay (verkauft)</span><b>–</b><span class="muted small">kein eBay-Preis verfügbar</span><a class="plink" href="https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">eBay ↗</a></div>${jpv?`<div><span class="muted small">JP-Markt</span><b>${money(jpv.eur)}</b><span class="muted small">${jpv.value?'¥'+jpv.value.toLocaleString('de-DE')+' · ':''}pokeca-souba</span></div>`:''}</div>`})()}${item?`<div class="${cls(itemChange(it,S.settings.tf))}">${pct(itemChange(it,S.settings.tf))||'Noch keine Änderung'}</div>`:''}
 <h3>Preisguide (Cardmarket)</h3><table class="ptable">${rows.map(r=>`<tr><td>${r[0]}</td><td>${money(r[1])}</td></tr>`).join('')||'<tr><td colspan=2 class="muted">Keine Cardmarket-Daten in dieser Quelle (siehe TCGdex-Zeile unten)</td></tr>'}</table>
 ${raw?`<h3>Graded (Schätzung)</h3><table class="ptable">${Object.entries(GRADE).map(([g,[k]])=>`<tr><td>${g}</td><td>≈ ${money(raw*k)}</td></tr>`).join('')}</table><p class="muted small">Faktor-Schätzung auf Raw-Preis, keine echten Graded-Verkäufe/Pop-Reports.</p>`:''}
 ${item&&it.buy?`<p>Einstand ${money(it.buy*it.qty)} · <span class="${cls(raw-it.buy)}">${raw-it.buy>=0?'+':''}${money((raw-it.buy)*it.qty)}</span></p>`:''}
 ${it.tdx?`<p class="muted small">Preis: ${esc(it.tdx.label)}${it.tdx.url?` · <a href="${esc(it.tdx.url)}" target="_blank" rel="noopener" class="plink">Cardmarket ↗</a>`:''}</p>`:''}<p class="muted small" id="tdxDet"></p>${it.note?`<p class="muted small">${esc(it.note)}</p>`:''}${it.priceNote?`<p class="small" style="color:#fbbf24">⚠️ ${esc(it.priceNote)}</p>`:''}${ci&&ci.url?`<p><a href="${ci.url}" target="_blank" rel="noopener" class="plink">Auf Cardmarket ansehen ↗</a></p>`:''}</div>
 <div class="row">${item?'<button value="edit">Preis ändern</button><button value="del" class="danger">Entfernen</button>':`<button value="add">+ Sammlung</button><button value="wish">☆ Wunsch</button>`}<button value="cancel">Schließen</button></div>`;
 const dlg=$('#dlg');dlg.returnValue='';dlg.showModal();
 langFlags(f,{name,number:c?c.number:it.number,lang:item?it.lang:(window.scanLang||''),tid:it.tdx&&it.tdx.id});
 if(window.Prices&&!it.tdx&&(price==null||(item&&it.lang&&it.lang!=='EN'))){const q=item?{...it,ownPrice:null,price:null}:{name:c.name,number:c.number,lang:window.scanLang||'EN'};tdxFill(q).then(ok=>{const l=$('#tdxDet');if(ok&&l)l.textContent='TCGdex: '+q.tdx.label})}
 dlg.onclose=()=>{const r=dlg.returnValue;
  if(r==='add')setTimeout(()=>addDialog(c,'coll'));if(r==='wish')setTimeout(()=>addDialog(c,'wish'));
  if(r==='edit'){const p=prompt(`Neuer Preis (€) für ${it.name}:`,it.price??'');if(p&&p.trim()){it.price=parseFloat(p.replace(',','.'));it.ownPrice=it.price;trackPrice(it);save();snapshot();render()}}
  if(r==='del'&&confirm('Wirklich entfernen?')){S[list]=S[list].filter(x=>x.uid!==it.uid);save();snapshot();render()}}}

// Preise aktualisieren
async function refreshPrices(){const btn=$('#refresh');btn.textContent='…';const items=[...S.collection,...S.wishlist].filter(x=>x.apiId);
 const ids=[...new Set(items.map(x=>x.apiId))];
 for(let i=0;i<ids.length;i+=20){const chunk=ids.slice(i,i+20);
  try{const d=await api(`${API}/cards?q=${encodeURIComponent(chunk.map(id=>'id:'+id).join(' OR '))}&select=id,cardmarket,types`);
   for(const c of d.data){const p=cmPrice(c);items.filter(x=>x.apiId===c.id).forEach(x=>{x.cm=cmInfo(c);if(c.types)x.types=c.types;if(p!=null&&x.ownPrice==null)x.price=p})}}catch(e){console.warn(e)}}
 for(const x of [...S.collection,...S.wishlist])if(x.type!=='sealed'&&tdxNeed(x))await tdxFill(x);
 S.collection.forEach(trackPrice);btn.textContent='⟳';save();snapshot();render()}
$('#refresh').onclick=refreshPrices;

// Gewinn/Verlust nur für Karten mit Kaufpreis (>0); ohne Kaufpreis zählt nur der Wert
function totals(){let v=0,b=0,n=0,vb=0;for(const c of S.collection){const w=(c.price||0)*c.qty;v+=w;n+=c.qty;if(c.buy>0){b+=c.buy*c.qty;vb+=w}}return{v,b,n,g:vb-b}}
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
 const T=t.toLowerCase(),k={DE:/schw[aä]che|r[uü]ckzug|resistenz|f[aä]higkeit|entwickelt|basis-pok|\bkp\b|angriff/g,EN:/weakness|retreat( cost)?|\bresistance\b|ability|evolves|basic pok|\bhp\b|damage|pok[ée]mon power|illus/g,FR:/faiblesse|retraite|r[ée]sistance|talent|[ée]volue|\bpv\b|d[ée]g[aâ]ts|pok[ée]mon de base/g,IT:/debolezza|ritirata|resistenza|abilit|\bps\b|si evolve/g,ES:/debilidad|retirada|resistencia|habilidad|evoluciona/g,PT:/fraqueza|recuo|habilidade|evolui/g};
 // Treffer zählen; 'resistance' zählt nicht für FR (nur mit Akzent oder weiteren FR-Wörtern)
 const sc={};for(const[l,r]of Object.entries(k))sc[l]=(T.match(r)||[]).length;sc.FR-=(T.match(/\bresistance\b/g)||[]).length;
 let best='',bv=0;for(const l of ['DE','EN','FR','IT','ES','PT'])if(sc[l]>bv){bv=sc[l];best=l}return best}
function applyScan(r,lang){window.scanLang=lang||'';window.pendingScan={name:r.name,jp:r.jp,number:r.full||r.number,set:r.set,lang};$('#scanStatus').textContent=`Scan erkannt: ${r.name||'?'} ${r.number?'· Nr. '+r.number:''}${lang?' · Sprache '+lang:''}`;
 $('#qName').value=r.name||'';$('#qNum').value=r.energy?'':(r.number||'');go('v-search');search(r.name,r.energy?'':r.number,'',r.setId||'')}
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
 for(let y=.92;y>=.5;y-=.04)for(const m of ['dark2','dark']){const t=((await w.recognize(cropC(src,0,y,.55,.08,Math.min(4,2400/(src.width*.55)),m))).data.text||'');window.bandDbg.push(y.toFixed(2)+m+':'+t.replace(/\s+/g,' '));
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
 for(const [x,y,ww,h,k,m] of [[.12,.93,.3,.07,8,'dark'],[.08,.92,.36,.08,6,'dark2'],[0,.935,.42,.06,6,'dark'],[0,.935,.42,.06,6,'dark2'],[0,.91,.45,.08,5,'dark'],[0,.86,.5,.14,4,'dark'],[.5,.9,.5,.1,4,'dark'],[0,.75,1,.25,3,'dark'],[0,.5,1,.5,3,'dark2']]){
  const {data}=await w.recognize(cropC(src,x,y,ww,h,k,m));window.numDbg.push(data.text);
  for(const mm of (data.text||'').matchAll(re)){const v=mm[1]+'/'+mm[2];if(mm[1].length===mm[2].length)return mm[1].replace(/^0+(?=\d)/,'')+'/'+mm[2];weak||=v}}
 return weak?{weak}:''}
// Gesamtanalyse: Text (DE/EN), bei Kana/schwacher Erkennung Japanisch, Nummer aus unterem Streifen
// Karten mit gleicher Nummer + Gesamtzahl holen; Name nehmen, wenn sein Grundname im OCR-Text steht
async function setNameCheck(num,lang,txt,name){const[a0,t0]=num.split('/');const tot=+t0,n=String(+a0);const sets=(SETS||[]).filter(s=>s.printedTotal===tot).slice(0,8);if(!sets.length)return null;
 const T=nrm(txt),lg=(lang||'DE').toLowerCase().replace('jp','ja');const C=[];
 await Promise.all(sets.map(async s=>{for(const L of [lg,'en']){try{const c=await wto(Prices.lookup('',L,s.id,n),6000,'t');if(c&&c.name){C.push({name:c.name,setId:s.id,setName:s.name,lg:L});break}}catch(e){}}}));
 window.setChkDbg=C.map(c=>c.setId+':'+c.name);if(!C.length)return null;
 const base=x=>nrm(String(x).replace(/[-\s]*(VMAX|VSTAR|V-UNION|V|GX|EX|ex|BREAK)$/,''));
 const hit=C.find(c=>base(c.name)===base(name))||C.find(c=>base(c.name).length>=4&&T.includes(base(c.name)))||(C.length===1&&!name?C[0]:null);
 if(!hit)return null;let nm=hit.name;if(hit.lg==='en'&&lg!=='en'){try{nm=deName(nm)||nm}catch(e){}}return{...hit,name:nm}}
async function analyze(src,st=()=>{}){const t0=performance.now();const orig=src;src=cardCrop(src);let jpSet='';window.energyHue=hueType(src);st('Name & Nummer werden gelesen…');
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
 if(!jp&&!(latin&&pT.name&&(number||energy))){// Fallback: ganze Karte (Sprache über Wörter wie Schwäche/Weakness)
  st('Ganze Karte wird gelesen…');const [a,b]=await Promise.all([getW('deu+eng').then(w=>w.recognize(cropC(src,0,0,1,1,1))),latin?null:getW('jpn').then(w=>w.recognize(cropC(src,0,0,1,1,1)))]);
  r1=a.data;conf=Math.max(conf,r1.confidence);text+='\n'+r1.text+(b?'\n'+b.data.text:'');
  const fullLatin=latin||(r1.text.match(/[A-Za-zÄÖÜäöüß]{4,}/g)||[]).length>=6;
  if(fullLatin){latin=true;lang=langLatin(tL+'\n'+r1.text+'\n'+numTxt);kana=false;jp=null}
  else{jp=jpName(text);lang=detectLang(r1.text||'');if(jp||(b&&/[\u3040-\u30ff]{2,}/.test(b.data.text.replace(/\s/g,'')))){kana=true;lang='JP'}}
  if(!energy)energy=parseTop(r1.text).energy}
 const p=pT.name?pT:parseOCR(r1.text||'');if(!number){const m=text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);if(m)number=m[1].replace(/^0+(?=\d)/,'')+'/'+m[2]}
 let sc=findSet(text+'\n'+numTxt,number);
 if(!number&&!energy){const m=(numTxt+'\n'+text).match(/\b(?:30C|3OC)\s*[^\d\n]{0,3}(\d{3})\b/i);if(m){number=m[1].replace(/^0+(?=\d)/,'');numWeak=true}}
 if(energy){if(!number){const m=(numTxt+'\n'+text).match(/\b(\d{3})\b/);if(m)number=m[1]}if(lang===''||lang==='JP'&&latin)lang='DE'}
 if((!number||numWeak)&&!energy&&src.width>=380){st('Kartennummer wird genau gelesen…');const n2=await readNumberHi(src);if(n2){number=n2;numWeak=false}}
 if(number&&number.includes('/')&&!energy&&!jp&&!numOK(number)){st('Kartennummer wird genau gelesen…');const n2=src.width>=380?await readNumberHi(src):'';if(n2&&numOK(n2)){number=n2;numWeak=false}else{number='';numWeak=false}}
 if((!number||numWeak)&&!energy&&!jp){st('Kartennummer: zweiter Versuch (vergrößert)…');let s3=null;try{s3=findSet(text+'\n'+(window.numDbg||[]).join('\n'),'')}catch(e){}if(!s3&&/30th|celebration/i.test(text))s3=SETCODES['30C'];let n3='';try{n3=await readNumberHi2(src,s3&&s3.total||0)}catch(e){console.warn(e)}if(n3&&numOK(n3)){number=n3;numWeak=false}}
 if(!number&&!energy){st('Kartennummer wird gesucht…');let bn=null;try{bn=await readNumberBands(src);if(!bn&&orig!==src)bn=await readNumberBands(orig)}catch(e){console.warn(e)}if(bn&&(jp||kana||numOK(bn.num))){number=bn.num;numWeak=false;if(bn.set)jpSet=bn.set}}
 if((jp||kana)&&number&&number.includes('/')){const tt=+number.split('/')[1];const m=(text+'\n'+numTxt).match(/\b(M\d{1,2}[a-z]?)\b/i);let cs=jpSet||(m&&m[1])||'';cs=cs.replace(/^m/,'M').replace(/A$/,'a');if(JPSETS[cs]!==tt){const f=Object.entries(JPSETS).find(([k,v])=>v===tt);if(f&&(!cs||/^M/i.test(cs)))cs=f[0]}jpSet=cs}
 if(!sc&&number)sc=findSet(text+'\n'+numTxt,number);if(sc&&sc.total&&number&&number.includes('/')){const[a0,t0]=number.split('/');if(+t0!==sc.total&&d1(t0,sc.total))number=a0+'/'+sc.total}
 let name=jp?(jp.de||jp.en):'',confident=!!jp&&!numWeak,weak=false;
 if(energy){name='Basic '+energy+' Energy';confident=true}
 else if(!jp&&!kana&&p.name&&p.name.length>=3&&(latin||conf>=65)){name=deName(p.name);confident=!!number&&!numWeak&&(conf>=55||name!==p.name||latin);if(nrm(name).length<=5&&!(conf>=75&&nrm(p.name)===nrm(name))&&!/energ/i.test(name)&&conf<45){confident=false;weak=true}}
 if(!name&&p.name&&!kana)name=deName(p.name);
 // Name gegen Set mit passender Gesamtzahl prüfen (z.B. 44/185 → Farbenschock: Pikachu VMAX)
 if(!energy&&!jp&&lang!=='JP'&&number&&number.includes('/')&&window.Prices){try{st('Name wird mit Set abgeglichen…');const sn=await setNameCheck(number,lang,text+'\n'+numTxt,name);if(sn){name=sn.name;if(!sc)sc={id:sn.setId,name:sn.setName,tdx:sn.setId,total:+number.split('/')[1]};confident=true;numWeak=false;weak=false}}catch(e){console.warn('setNameCheck',e)}}
 if(name&&!/\b(VMAX|VSTAR|V|GX|EX|ex)$/.test(name)){const tt=text.replace(/\n/g,' ');if(/\bv[mn]?[a-z]?ax\b/i.test(tt)&&/vmax|vinax|vmnax|v-max/i.test(tt))name+=' VMAX';else if(/\bvstar\b/i.test(tt))name+=' VSTAR'}
 window.scanMs=Math.round(performance.now()-t0);
 if((jp||kana)&&lang!=='JP')lang='JP';
 return{name,en:jp&&jp.en,jp:jp&&jp.jp,weak,number:(number||'').split('/')[0],full:number,lang,confident,energy:!!energy,setId:lang==='JP'?'':(sc&&sc.id||''),set:lang==='JP'?(jpSet||setCode(text+'\n'+numTxt)):sc?(sc.tdx||sc.name):setCode(text+'\n'+numTxt),raw:text,conf:Math.round(conf),ms:window.scanMs}}
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
 const H=r.hit;P.innerHTML=jpNF?`<b>✅ ${esc(r.name)}${r.jp?' ('+esc(r.jp)+')':''}${r.set||r.full?' · '+esc([r.set,r.full].filter(Boolean).join(' ')):''} · JP${H?'':' – nicht in der Datenbank'}</b>${H?`<div class="jphit"><img src="${esc(imgU(H.image,'high'))}" alt=""><div><b>${esc(H.name)}</b><br><span class="muted small">${esc((H.set&&(H.set.name||H.set.id))||'')} · ${esc(H.localId||'')}</span><br><span class="muted small">${H.best?esc(H.label):'Noch kein Preis'}</span></div></div>`:''}<p class="muted small">${r.full?'':'Nummer fehlt – bitte eintippen. '}${H?'Offizielles Kartenbild gefunden – „Hinzufügen“ übernimmt Name, Nummer, Set, Sprache &amp; Bild.':'Japanische Karte: über „Manuell hinzufügen“ anlegen (Felder sind vorausgefüllt).'} Preise vergleichen: <a href="https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(q)}" target="_blank" rel="noopener">Cardmarket ↗</a> · <a href="https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(q+' japanisch')}" target="_blank" rel="noopener">eBay ↗</a>. Unten EN/DE-Karten zum Bildvergleich.</p>
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
  const get=async(q,lg)=>Prices.suggest?(await Prices.suggest(q,lg,60)||[]).map(c=>({id:c.id,localId:c.localId,name:c.name,image:(c.img||'').replace(/\/(low|high)\.webp$/,'')})).filter(c=>c.image):(await Prices.search(q,lg)||[]).filter(c=>c.image);
  const swg=setWant($('#spSet').value),setL=[];if(swg.length){for(const sid of swg)for(const lg of [lang,'en']){try{const j=await (await fetch('https://api.tcgdex.net/v2/'+lg+'/sets/'+encodeURIComponent(sid))).json();const q=nrm(name);(j.cards||[]).forEach(c=>{const nn=nrm(c.name);if(c.image&&q&&(nn.startsWith(q)||q.startsWith(nn))&&!setL.some(x=>x.id===c.id))setL.push({id:c.id,localId:c.localId,name:c.name,image:c.image})})}catch(e){}if(setL.length)break}}
  try{L=await get(name,lang);if(!L.length&&lang!=='en'&&!Prices.suggest)L=await get(name,'en');if(!L.length&&name.length>2)L=await get(name.slice(0,2),lang)}catch(e){}
  L=setL.concat(L.filter(c=>!setL.some(x=>x.id===c.id)));if(n!==gN)return;if(!L.length){G.innerHTML=user?'<p class="muted small">Keine Bilder gefunden</p>':'';return}
  const SR=['me','sv','swsh','sm','xy','bw','hgss','pl','dp','ex','ecard','neo','gym','base'],sr=c=>{const i=SR.indexOf((c.image.match(/\/[a-z]{2}\/([^/]+)\//)||[])[1]);return i<0?SR.length:i};const sw=setWant($('#spSet').value),inS=c=>{const sid=sidOf(c.id).toLowerCase();return sw.length&&sw.includes(sid)?0:1};L=L.map((c,i)=>[c,i]).sort((x,y)=>inS(x[0])-inS(y[0])||sr(x[0])-sr(y[0])||y[1]-x[1]).map(x=>x[0]).slice(0,40);G.innerHTML=swg.length&&!setL.length&&!L.some(c=>inS(c)===0)?`<p class="muted small" style="grid-column:1/-1">Im Set „${esc($('#spSet').value)}“ ist keine Karte „${esc(name)}“ in der Datenbank – ähnliche Karten:</p>`:'';
  for(const c of L){const sid=sidOf(c.id),b=document.createElement('button');b.type='button';b.className='spThumb';
   b.innerHTML=`<img loading="lazy" src="${esc(imgU(c.image))}" alt=""><span>${esc(sid)} · ${esc(c.localId)}</span>`;
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
function scanResult(r){window.lastScan=r;const st=$('#scanStatus2');
 st.textContent=`Erkannt: ${r.name||'?'}${r.jp?' ('+r.jp+')':''} · Nr. ${r.full||r.number||'?'}${r.lang?' · '+r.lang:''}`;
 if(r.confident&&(r.number||r.energy)&&r.lang!=='JP'){$('#scanPick').hidden=true;applyScan(r,r.lang)}else if(r.lang==='JP'&&r.name){const t=st.textContent;st.textContent='⏳ Suche japanische Karte…';jpHit(r).then(h=>{r.hit=h;st.textContent=t;scanPick(r)})}else scanPick(r)}
async function handleFile(f){window.scanLang='';window.pendingScan=null;const st=$('#scanStatus2');$('#scanPick').hidden=true;
 if(!f){st.textContent='Kein Bild ausgewählt.';return}
 if(!window.Tesseract){st.textContent='❌ Texterkennung nicht geladen – Internet prüfen und neu laden.';return}
 $('#scanbox').classList.add('busy');
 try{const c=await toCanvas(f);const r=await analyze(c,m=>st.textContent='⏳ '+m);scanResult(r)}
 catch(err){st.textContent='❌ Fehler bei der Erkennung: '+(err&&err.message||err)}finally{$('#scanbox').classList.remove('busy')}}
$('#scanBtn').addEventListener('click',()=>{stopLive();$('#scanStatus2').textContent='Kamera wird geöffnet…'});
$('#livePhoto').addEventListener('click',e=>{e.preventDefault();if(!live.stream)return;liveShoot()});$('#uploadBtn').addEventListener('click',()=>{stopLive();$('#scanStatus2').textContent='Bildauswahl wird geöffnet…'});
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
  lStat('🔍 Foto aufgenommen – lese Karte…');
  const r=await wto(analyze(c,m=>$('#scanStatus2').textContent='⏳ '+m),60000,'Erkennung dauert zu lange');if(my!==live.shotId)return;
  stopLive();window.lastScan=r;
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

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
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
