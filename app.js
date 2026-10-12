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
  const ps=window.pendingScan,jpB=ps&&ps.lang&&ps.lang!=='EN'?`<div class="scanpick"><b>${ps.lang==='JP'?'🇯🇵 Japanische Karte':'Karte ('+ps.lang+')'}: ${esc(ps.name||'')} ${esc(ps.number||'')}</b><p class="muted small"><span id="tdxHint">Suche in TCGdex nach der ${ps.lang}-Version…</span></p><button type="button" class="primary big" id="manScan">➕ Manuell hinzufügen</button></div>`:'';
  const tl=((ps&&ps.lang)||window.scanLang||'').toUpperCase(),useT=window.Prices&&!setId&&name&&(tl&&tl!=='EN');
  if(!d.data.length&&setId&&name)return search(name,num,set);
  if(!d.data.length){R.innerHTML=jpB+'<p class="muted" id="noHit">Nichts in der englischen Datenbank gefunden.'+(jpB?'':' <button type="button" id="manScan2">➕ Manuell hinzufügen</button>')+'</p>';bindMan(name,num,set);if(window.Prices&&!setId&&name)tdxResults(R,name,num,tl||'DE');return}
  d.data.sort((a,b)=>setId?(parseInt(a.number)||0)-(parseInt(b.number)||0):(b.set.releaseDate||'').localeCompare(a.set.releaseDate||''));lastResults=d.data;
  R.innerHTML='';R.classList.toggle('binder-src',!!setId);for(const c of d.data){const p=cmPrice(c);const ci=cmInfo(c);const ch=ci&&ci.avg7&&p?(p-ci.avg7)/ci.avg7*100:null;
   const el=tile({type:c.types&&c.types[0],img:c.images.small,name:c.name,sub:`${c.set.name} · ${c.number}/${c.set.printedTotal}`,price:p,chg:ch,badge:c.rarity&&/Special|Hyper|Secret|Illustration/i.test(c.rarity)?'SAR/SIR':''});
   el.onclick=()=>detail({api:c});
   const a=document.createElement('div');a.className='acts';a.innerHTML='<button>+ Sammlung</button><button>☆</button>';
   a.children[0].onclick=e=>{e.stopPropagation();addDialog(c,'coll')};a.children[1].onclick=e=>{e.stopPropagation();addDialog(c,'wish')};el.append(a);R.append(el)}
  if(setId&&window.FX)FX.binder(R,SETS.find(s=>s.id===setId));if(jpB){R.insertAdjacentHTML('afterbegin',jpB);bindMan(name,num,set)}if(useT)tdxResults(R,name,num,tl,true)
 }catch(e){R.innerHTML=`<p class="neg">${e.message}. Bitte später erneut versuchen.</p>`}}

// TCGdex-Fallback für die Suche (andere Sprachen / nicht in pokemontcg.io)
function tdxNames(name,lang){const n=name.toLowerCase(),out=new Set([name]),i=lang==='de'?1:lang==='ja'?2:0;
 for(const r of [...(window.PNAMES||[]),...(window.TNAMES||[])])if(r.some(x=>x&&x.toLowerCase()===n)){if(r[i])out.add(r[i]);if(r[0])out.add(r[0])}return[...out]}
async function tdxFind(name,num,lang){lang=(lang||'de').toLowerCase();if(lang==='jp')lang='ja';const nn=num?String(num).replace(/^0+(?=\d)/,''):'';const seen=new Set();let all=[];
 for(const lg of lang==='en'?['en']:[lang,'en'])for(const q of tdxNames(name,lg)){let L=[];try{L=await Prices.suggest(q,lg,100)||[]}catch(e){}
  for(const c of L)if(c.lang===lg&&!seen.has(lg+c.id)){seen.add(lg+c.id);all.push(c)}}
 const hit=nn?all.filter(c=>String(c.localId||'').replace(/^0+(?=\d)/,'')===nn):[];
 const pref=a=>a.filter(c=>c.lang===lang).length?a.filter(c=>c.lang===lang):a;
 return{list:hit.length?pref(hit):pref(all).slice(0,40),exact:!!hit.length,lang}}
async function tdxResults(R,name,num,lang,append){const box=document.createElement('div');box.className='tdxRes';box.innerHTML='<p class="muted small">TCGdex wird durchsucht…</p>';
 if(append)R.append(box);else R.append(box);let r;try{r=await tdxFind(name,num,lang)}catch(e){r={list:[]}}
 if(!box.isConnected)return;const h=$('#tdxHint'),nh=$('#noHit');
 if(!r.list.length){box.innerHTML='';if(h)h.textContent='Auch bei TCGdex nicht gefunden. Lege die Karte manuell an, den Preis trägst du selbst ein.';return}
 if(h)h.textContent=`Treffer bei TCGdex (${r.list[0].lang.toUpperCase()})${r.exact?'':', Nummer nicht gefunden: alle Treffer zum Namen'}. Antippen zum Hinzufügen.`;
 if(nh)nh.innerHTML='Nichts in der englischen Datenbank, aber Treffer bei TCGdex:';
 for(const id of ['manScan','manScan2']){const b=$('#'+id);if(b){b.classList.remove('primary','big');b.classList.add('chip');b.textContent='Nicht dabei? Manuell hinzufügen'}}
 box.innerHTML=`<h3 class="small">TCGdex${r.exact?'':' (alle Treffer zum Namen)'}</h3>`;const grid=document.createElement('div');grid.className='grid';grid.style.cssText='display:contents';box.append(grid);
 r.list.forEach((c,i)=>{const el=tile({img:c.img,name:c.name,sub:`${c.set.name} · ${c.localId} · ${c.lang.toUpperCase()}`,price:null});const pb=el.querySelector('.p b');if(pb)pb.textContent='…';
  let pr=null;const ld=()=>pr||(pr=Prices.byId(c.id,c.lang).catch(()=>null));
  if(i<16)ld().then(x=>{if(!pb)return;pb.textContent=x&&x.best?x.label:'kein Preis bei TCGdex'});else if(pb)pb.textContent='';
  el.onclick=async()=>{const x=await ld();const lg=c.lang==='ja'?'JP':c.lang.toUpperCase();
   manualAdd({name:c.name,number:c.localId,set:c.set.name,lang:lg});const f=$('#dlgForm');
   if(f.img)f.img.value=(x&&x.image)||(c.img||'').replace(/\/low\.webp$/,'/high.webp');
   const pe=x&&x.best?x.best.eur:null;if(f.price&&pe!=null){f.price.value=pe;f.price.required=false}
   window.tdxPick={id:c.id,setId:c.set.id,price:pe,tdx:x&&x.best?{label:x.label,id:x.id,src:x.best.source,conv:x.best.umgerechnet,url:x.best.url}:{label:'kein Preis bei TCGdex',id:c.id}}};
  R.append(el)})}
// Sets
let SETS=[];async function loadSets(){try{const d=await api(`${API}/sets?orderBy=-releaseDate&pageSize=250&select=id,name,series,releaseDate,images,total,printedTotal,ptcgoCode`);SETS=d.data;renderSets()}catch(e){$('#setList').innerHTML='<p class="muted small">Sets nicht ladbar.</p>'}}
function renderSets(){const f=$('#setFilter').value.toLowerCase();$('#setList').innerHTML='';
 for(const s of SETS.filter(s=>!f||(s.name+s.series).toLowerCase().includes(f)).slice(0,60)){const d=document.createElement('div');d.className='set';
  d.innerHTML=`<img loading="lazy" src="${s.images.logo}" alt=""><b>${esc(s.name)}</b><br><span class="muted">${esc(s.series)} · ${s.total} Karten · ${(s.releaseDate||'').slice(0,4)}</span>`;
  d.onclick=()=>{window.pendingScan=null;$('#qName').value='';$('#qNum').value='';search('','','',s.id);window.scrollTo(0,0)};$('#setList').append(d)}}
$('#setFilter').oninput=renderSets;

// Zweite Preisquelle (prices.js / TCGdex): Fallback bei fehlendem Preis oder nicht-englischer Karte
const tdxNeed=x=>x.ownPrice==null&&(x.price==null||(x.lang&&x.lang!=='EN'));
async function tdxFill(x){if(!window.Prices||x.ownPrice!=null)return false;const lang=(x.lang||'DE').toLowerCase(),name=(x.name||'').replace(/\s*\(.*\)\s*$/,'').trim(),num=String(x.number||'').split('/')[0]||null;
 let r=null;try{const same=n=>{const p=nrm(n),q=nrm(name);if(!p||!q)return true;let d=q;try{d=nrm(deName(name))}catch(e){}return p===q||p===d||p.startsWith(q)||q.startsWith(p)||p.startsWith(d)||d.startsWith(p)};r=await Prices.lookup(name,lang,x.setId||null,num);if(r&&!same(r.name))r=await Prices.lookup(name,lang,null,num);if(r&&!same(r.name))r=null;if(!(r&&r.best)&&lang!=='en'){r=await Prices.lookup(name,'en',null,num);if(r&&!same(r.name))r=null}}catch(e){console.warn(e)}
 if(!(r&&r.best))return false;x.price=r.best.eur;x.tdx={label:r.label,id:r.id,src:r.best.source,conv:r.best.umgerechnet,url:r.best.url};return true}
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
const sugMain=attachSuggest($('#qName'),c=>{$('#qName').value=c.name;$('#qNum').value=c.localId.replace(/^0+(?=\d)/,'');window.pendingScan=null;search(c.name,$('#qNum').value,'')},()=>(window.scanLang||'DE').toLowerCase(),$('#searchForm'));
$('#searchForm').addEventListener('submit',()=>sugMain&&sugMain.hide());
function addDialog(c,mode,sealed){const manual=!c;window.tdxPick=null;const f=$('#dlgForm');const p=c?cmPrice(c):null;
 f.innerHTML=`<h3>${mode==='wish'?'Zur Wunschliste':sealed?'Sealed-Produkt hinzufügen':'Zur Sammlung'}</h3>
 ${manual?`<label>Name<input name="name" required placeholder="${sealed?'z.B. 30 Jahre Booster Bundle':''}"></label><label>Set<input name="set"></label>${sealed?'':'<label>Nummer<input name="number"></label>'}<label>Bild-URL (optional)<input name="img"></label>`:`<p><b>${esc(c.name)}</b> – ${esc(c.set.name)} ${c.number}<br>Cardmarket-Trend: ${money(p)}<br><span class="muted small" id="tdxLbl"></span></p>`}
 <label>Sprache<select name="lang">${LANGS.map(l=>`<option${l===(window.scanLang||'DE')?' selected':''}>${l}</option>`).join('')}</select></label>${window.scanLang?'<p class="muted small">Sprache per Scan erkannt: '+window.scanLang+'</p>':''}
 ${mode==='wish'?`<label>Zielpreis (€)<input name="target" type="number" step="0.01" required></label>`:
 `${sealed?'<input type="hidden" name="cond" value="Sealed">':`<label>Zustand<select name="cond"><option>NM</option><option>EX</option><option>GD</option><option>LP</option><option>PL</option><option>PSA 10</option><option>PSA 9</option><option>CGC 10</option><option>BGS 9.5</option><option>PSA/Graded</option></select></label>`}
 <label>Anzahl<input name="qty" type="number" value="1" min="1"></label><label>Kaufpreis pro Stück (€)<input name="buy" type="number" step="0.01" value="0"></label>`}
 <label>${manual?'Aktueller Wert (€)':'Eigener Preis (€, leer = Cardmarket)'}<input name="price" type="number" step="0.01" ${manual?'required':''}></label>
 <div class="row"><button value="ok">Speichern</button><button value="cancel" formnovalidate>Abbrechen</button></div>`;
 if(manual&&!sealed&&f.name)attachSuggest(f.name,c=>{f.name.value=c.name;if(f.set)f.set.value=c.set.name;if(f.number)f.number.value=c.localId;if(f.img&&c.img)f.img.value=c.img.replace(/\/low\.webp$/,'/high.webp')},()=>(f.lang&&f.lang.value||'DE').toLowerCase(),f.name.closest('label'));
 const dlg=$('#dlg');dlg.returnValue='';dlg.showModal();dlg.onclose=()=>{if(dlg.returnValue!=='ok')return;const v=Object.fromEntries(new FormData(f));
  const base=manual?{manual:true,name:v.name,set:v.set,number:v.number||'',img:v.img}:{apiId:c.id,name:c.name,set:c.set.name,number:c.number,img:c.images.small,apiPrice:p,cm:cmInfo(c),types:c.types||[]};
  if(sealed)base.type='sealed';let own=v.price?parseFloat(v.price):null;const tp=manual?window.tdxPick:null;window.tdxPick=null;let tpp=null;if(tp){base.tdx=tp.tdx;base.tdxId=tp.id;base.setId=tp.setId;if(tp.price!=null&&(own==null||own===tp.price)){own=null;tpp=tp.price}}
  if(mode==='wish')S.wishlist.push({uid:uid(),...base,lang:v.lang,target:parseFloat(v.target),price:own??tpp??p,ownPrice:own});
  else{const it={uid:uid(),...base,lang:v.lang,cond:v.cond,qty:parseInt(v.qty)||1,buy:parseFloat(v.buy)||0,price:own??tpp??p,ownPrice:own,added:today()};trackPrice(it);S.collection.push(it);window.FX&&FX.reveal(it)}
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
 if(!id){try{const r=await Prices.lookup((name||'').replace(/\s*\(.*\)\s*$/,'').trim(),own||'en',null,num);id=r&&r.id}catch(e){}}
 if(!id||!box.isConnected)return;const imgs={},recs={};
 await Promise.all(L.map(async([l])=>{try{const r=await Prices.byId(id,l);if(r&&r.image){imgs[l]=r.image;recs[l]=r}}catch(e){}}));
 const mark=a=>box.querySelectorAll('button').forEach(b=>{const ok=!!imgs[b.dataset.l];b.disabled=!ok;b.style.opacity=ok?(b.dataset.l===a?'1':'.55'):'.2';b.style.outline=b.dataset.l===a?'2px solid #a78bfa':'none'});
 const CML={de:3,en:1},cmOf=r=>r&&r.prices&&r.prices.find(p=>p.source==='Cardmarket (TCGdex)');
 const showP=l=>{const pe=f.querySelector('#lflP');if(!pe)return;const r=recs[l],cm=cmOf(r),cd=cmOf(recs.de),ce=cmOf(recs.en);
  if(!r||!r.best){pe.textContent=`${l.toUpperCase()}: kein Preis bei TCGdex`;return}
  const shared=l!=='ja'&&cm&&cm.idProduct&&cd&&ce&&cd.idProduct===ce.idProduct;
  if(shared){const u=cm.url?cm.url+'&language='+CML[l]:null;pe.innerHTML=`Cardmarket: ${esc(money(cm.eur))} · gilt für alle Sprachen (Sprachfilter auf Cardmarket)${u?` · <a href="${esc(u)}" target="_blank" rel="noopener" style="color:#a78bfa">${l.toUpperCase()}-Angebote ↗</a>`:''}`}
  else pe.textContent=`${l.toUpperCase()}: ${r.label}`};
 const set=l=>{if(!imgs[l])return;im.src=imgs[l];mark(l);showP(l)};
 box.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.preventDefault();set(b.dataset.l)});
 if(own&&imgs[own])set(own);else mark(null)}
function detail({api:c,item,list}){const f=$('#dlgForm');const it=item||{};const ci=c?cmInfo(c):it.cm;const price=item?item.price:cmPrice(c);
 const img=c?c.images.large||c.images.small:(it.img||'').replace('/small','/large');const name=c?c.name:it.name;
 const rows=ci?[['Trend',ci.trend],['Ø 1 Tag',ci.avg1],['Ø 7 Tage',ci.avg7],['Ø 30 Tage',ci.avg30],['Ab-Preis',ci.low],['Ø Verkauf',ci.sell]].filter(r=>r[1]!=null):[];
 const raw=price||0;
 const ty=((c?c.types:it.types)||[])[0];f.innerHTML=`<div class="detail" data-type="${esc((ty||'none').toLowerCase())}">${img?`<div class="dcard tiltable"><img src="${esc(img)}" alt=""><i class="holo"></i></div><div class="langFlags" id="lfl" style="display:flex;gap:.4rem;justify-content:center;margin:.35rem 0"></div><p class="muted small" id="lflP" style="text-align:center;margin:0"></p><button type="button" class="chip gyroBtn" onclick="FX.gyro()">📱 Bewegungssensor</button>`:''}<h3>${esc(name)}</h3><p class="muted small">${esc(c?c.set.name:it.set)} ${esc(c?c.number:it.number)}${item?` · ${esc(it.lang)} · ${esc(it.cond)} · ${it.qty}×`:''}</p>
 ${price!=null&&!isNaN(price)?`<div class="big" style="font-size:1.8rem">${money(price)}</div>`:`<p class="muted" style="margin:.4rem 0">Noch kein Preis in der Datenquelle · <a href="https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(name)}" target="_blank" rel="noopener" style="color:#a78bfa">auf Cardmarket ansehen ↗</a></p>`}${(()=>{const n=String((c?c.number:it.number)||'');const tot=c&&c.set&&c.set.printedTotal;const nn=n.includes('/')||!tot?n:n+'/'+tot;const q=['Pokemon',name,nn,c?c.set.name:it.set].filter(Boolean).join(' ');const cmu=(ci&&ci.url)||(it.tdx&&it.tdx.url);return `<p class="row" style="gap:.5rem;flex-wrap:wrap"><a class="chip" href="https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">Auf eBay vergleichen ↗</a>${cmu?`<a class="chip" href="${esc(cmu)}" target="_blank" rel="noopener">Cardmarket ↗</a>`:''}</p>`})()}${item?`<div class="${cls(itemChange(it,S.settings.tf))}">${pct(itemChange(it,S.settings.tf))||'Noch keine Änderung'}</div>`:''}
 <h3>Preisguide (Cardmarket)</h3><table class="ptable">${rows.map(r=>`<tr><td>${r[0]}</td><td>${money(r[1])}</td></tr>`).join('')||'<tr><td colspan=2 class="muted">Keine Cardmarket-Daten in dieser Quelle (siehe TCGdex-Zeile unten)</td></tr>'}</table>
 ${raw?`<h3>Graded (Schätzung)</h3><table class="ptable">${Object.entries(GRADE).map(([g,[k]])=>`<tr><td>${g}</td><td>≈ ${money(raw*k)}</td></tr>`).join('')}</table><p class="muted small">Faktor-Schätzung auf Raw-Preis, keine echten Graded-Verkäufe/Pop-Reports.</p>`:''}
 ${item&&it.buy?`<p>Einstand ${money(it.buy*it.qty)} · <span class="${cls(raw-it.buy)}">${raw-it.buy>=0?'+':''}${money((raw-it.buy)*it.qty)}</span></p>`:''}
 ${it.tdx?`<p class="muted small">Preis: ${esc(it.tdx.label)}${it.tdx.url?` · <a href="${esc(it.tdx.url)}" target="_blank" rel="noopener" style="color:#a78bfa">Cardmarket ↗</a>`:''}</p>`:''}<p class="muted small" id="tdxDet"></p>${it.note?`<p class="muted small">${esc(it.note)}</p>`:''}${ci&&ci.url?`<p><a href="${ci.url}" target="_blank" rel="noopener" style="color:#a78bfa">Auf Cardmarket ansehen ↗</a></p>`:''}</div>
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
 $('#qName').value=r.name||'';$('#qNum').value=r.energy?'':(r.number||'');go('v-search');search(r.name,r.energy?'':r.number,'',r.setId||'')}
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
// Luminanz-Binarisierung mit adaptiver Schwelle (Perzentil) – für dunkle Schrift auf farbigem Grund
function binL(src,x,y,w,h,scale,pct){const W=src.width,H=src.height;const c=document.createElement('canvas');c.width=Math.round(W*w*scale);c.height=Math.round(H*h*scale);
 const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingQuality='high';g.drawImage(src,W*x,H*y,W*w,H*h,0,0,c.width,c.height);
 const im=g.getImageData(0,0,c.width,c.height),d=im.data,hist=new Uint32Array(256);for(let i=0;i<d.length;i+=4){const L=(d[i]*299+d[i+1]*587+d[i+2]*114)/1000|0;d[i+3]=L;hist[L]++}
 let acc=0,th=100;for(let v=0;v<256;v++){acc+=hist[v];if(acc>d.length/4*pct){th=v+8;break}}for(let i=0;i<d.length;i+=4){const v=d[i+3]<th?0:255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}g.putImageData(im,0,0);return c}
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
async function analyze(src,st=()=>{}){const t0=performance.now();src=cardCrop(src);window.energyHue=hueType(src);st('Name & Nummer werden gelesen…');
 // parallel: Name-Streifen oben (JP + DE/EN) und Nummer-Streifen unten – keine Ganzkarten-OCR, solange das reicht
 const top=cropC(src,.15,.04,.65,.12,3,'dark'),topG=cropC(src,0,.02,1,.12,2);
 const pJ=getW('jpn').then(w=>w.recognize(top)).then(r=>r.data.text||'');
 const pE=getW('deu+eng').then(w=>w.recognize(topG)).then(r=>r.data);
 const pN=readNumber(src);
 const [tTop,rE,num0]=await Promise.all([pJ,pE,pN]);window.topDbg=tTop;
 let number=num0,numWeak=false;if(number&&number.weak){number=number.weak;numWeak=true}
 const tL=rE.text||'';window.latDbg=tL;let latW=(tL.match(/[A-Za-zÄÖÜäöüß]{3,}/g)||[]),latin=latW.length>=1&&(rE.confidence>=45||latW.some(w=>/^(basis|phase|energie|basic|stage|energy)$/i.test(w)));
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
 if(!sc&&number)sc=findSet(text+'\n'+numTxt,number);if(sc&&sc.total&&number&&number.includes('/')){const[a0,t0]=number.split('/');if(+t0!==sc.total&&d1(t0,sc.total))number=a0+'/'+sc.total}
 let name=jp?jp.en:'',confident=!!jp&&!numWeak;
 if(energy){name='Basic '+energy+' Energy';confident=true}
 else if(!jp&&!kana&&p.name&&p.name.length>=3&&(latin||conf>=65)){name=deName(p.name);confident=!!number&&!numWeak&&(conf>=55||name!==p.name||latin)}
 if(!name&&p.name&&!kana)name=deName(p.name);window.scanMs=Math.round(performance.now()-t0);
 return{name,jp:jp&&jp.jp,number:(number||'').split('/')[0],full:number,lang,confident,energy:!!energy,setId:sc&&sc.id||'',set:sc?(sc.tdx||sc.name):setCode(text+'\n'+numTxt),raw:text,conf:Math.round(conf),ms:window.scanMs}}
// Sprache bei lateinischer Schrift (nie JP)
function langLatin(t){const l=detectLang(t.replace(/[\u3040-\u9fff\uac00-\ud7af]/g,''));if(l)return l;if(/\b(BASIS|PHASE|ENERGIE|Energie|Entwickelt|KP)\b/.test(t))return'DE';if(/\b(BASIC|STAGE|ENERGY|Energy|HP)\b/.test(t))return'EN';return'DE'}
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
 return !SETS.length||Object.values(SETCODES).some(x=>x.total===b)||SETS.some(x=>x.printedTotal===b)}
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
 P.innerHTML=`<b>${!r.name&&!r.energy?'⚠️ Name nicht erkannt':r.confident&&r.number?'✅ Erkannt: '+esc(r.name)+(r.jp?' ('+esc(r.jp)+')':'')+' · '+esc(r.full||r.number):noNum?'✅ Erkannt: '+esc(r.name)+(r.jp?' ('+esc(r.jp)+')':'')+' – Nummer fehlt':'⚠️ Nicht sicher erkannt'}</b><p class="muted small">${noNum?'Die Nummer konnte nicht gelesen werden. Bitte eintippen oder ohne Nummer suchen.':'Bitte prüfen oder ergänzen – es wird nichts automatisch übernommen.'}</p>
 <label>Name<input id="spName" value="${esc(r.name||'')}" placeholder="z.B. Glurak / Charizard"></label><label>Nummer<input id="spNum" value="${esc(r.full||r.number||'')}" placeholder="Nummer unten links, z.B. 137/103" inputmode="numeric"></label>
 <label>Set-Code (optional)<input id="spSet" value="${esc(r.set||'')}" placeholder="z.B. s8a"></label>
 <label>Sprache<select id="spLang">${LANGS.map(l=>`<option${l===(r.lang||'DE')?' selected':''}>${l}</option>`).join('')}</select></label>
 <div class="row wrap"><button type="button" class="primary" id="spGo">Suchen</button><button type="button" id="spNoNum">Ohne Nummer suchen</button><button type="button" id="spMan"${r.lang==='JP'?' class="primary"':''}>Manuell hinzufügen</button><button type="button" id="spX">Verwerfen</button></div>
 <div id="spGrid" class="spgrid"></div>
 ${r.lang==='JP'?'<p class="muted small">Japanische Sets sind nicht in der Preisdatenbank – „Manuell hinzufügen“ legt die Karte mit Name, Nummer, Set &amp; Sprache an, den Preis trägst du selbst ein.</p>':''}`;
 const v=()=>({name:$('#spName').value,number:$('#spNum').value,set:$('#spSet').value,lang:$('#spLang').value});
 $('#spGo').onclick=()=>{const x=v();P.hidden=true;applyScan({name:x.name,jp:r.jp,number:x.number.split('/')[0],full:x.number,set:x.set,setId:ptcgId(x.set)},x.lang)};
 const G=$('#spGrid');let gT=0,gN=0;
 async function grid(){const n=++gN,name=$('#spName').value.trim();if(name.length<3||!window.Prices){G.innerHTML='';return}G.innerHTML='<p class="muted small">Lädt Karten…</p>';
  let lang=($('#spLang').value||'DE').toLowerCase();if(lang==='jp')lang='ja';let L=[];
  const get=async(q,lg)=>Prices.suggest?(await Prices.suggest(q,lg,60)||[]).map(c=>({id:c.id,localId:c.localId,name:c.name,image:(c.img||'').replace(/\/(low|high)\.webp$/,'')})).filter(c=>c.image):(await Prices.search(q,lg)||[]).filter(c=>c.image);
  try{L=await get(name,lang);if(!L.length&&lang!=='en'&&!Prices.suggest)L=await get(name,'en');if(!L.length&&name.length>2)L=await get(name.slice(0,2),lang)}catch(e){}
  if(n!==gN)return;if(!L.length){G.innerHTML='<p class="muted small">Keine Bilder gefunden</p>';return}
  const SR=['me','sv','swsh','sm','xy','bw','hgss','pl','dp','ex','ecard','neo','gym','base'],sr=c=>{const i=SR.indexOf((c.image.match(/\/[a-z]{2}\/([^/]+)\//)||[])[1]);return i<0?SR.length:i};L=L.map((c,i)=>[c,i]).sort((x,y)=>sr(x[0])-sr(y[0])||y[1]-x[1]).map(x=>x[0]).slice(0,40);G.innerHTML='';
  for(const c of L){const sid=c.id.slice(0,c.id.lastIndexOf('-')),b=document.createElement('button');b.type='button';b.className='spThumb';
   b.innerHTML=`<img loading="lazy" src="${esc(c.image)}/low.webp" alt=""><span>${esc(sid)} · ${esc(c.localId)}</span>`;
   b.onclick=()=>{$('#spNum').value=c.localId;$('#spSet').value=sid;$('#spGo').click()};G.append(b)}}
 if(r.name&&(!r.number||!r.confident))grid();
 $('#spName').addEventListener('input',()=>{clearTimeout(gT);gT=setTimeout(grid,400)});
 $('#spNoNum').onclick=()=>{const x=v();P.hidden=true;applyScan({name:x.name,jp:r.jp,number:'',set:x.set},x.lang);window.pendingScan.number=x.number};
 $('#spMan').onclick=()=>{const x=v();manualAdd({...x,name:r.jp&&x.name===r.name?`${x.name} (${r.jp})`:x.name})};
 $('#spX').onclick=()=>P.hidden=true;
 if(noNum)setTimeout(()=>{const n=$('#spNum');n.focus();n.scrollIntoView({block:'center'})},50)}
function scanResult(r){window.lastScan=r;const st=$('#scanStatus2');
 st.textContent=`Erkannt: ${r.name||'?'}${r.jp?' ('+r.jp+')':''} · Nr. ${r.full||r.number||'?'}${r.lang?' · '+r.lang:''}`;
 if(r.confident&&(r.number||r.energy)&&r.lang!=='JP'){$('#scanPick').hidden=true;applyScan(r,r.lang)}else scanPick(r)}
async function handleFile(f){window.scanLang='';window.pendingScan=null;const st=$('#scanStatus2');$('#scanPick').hidden=true;
 if(!f){st.textContent='Kein Bild ausgewählt.';return}
 if(!window.Tesseract){st.textContent='❌ Texterkennung nicht geladen – Internet prüfen und neu laden.';return}
 $('#scanbox').classList.add('busy');
 try{const c=await toCanvas(f);const r=await analyze(c,m=>st.textContent='⏳ '+m);scanResult(r)}
 catch(err){st.textContent='❌ Fehler bei der Erkennung: '+(err&&err.message||err)}finally{$('#scanbox').classList.remove('busy')}}
$('#scanBtn').addEventListener('click',()=>{stopLive();$('#scanStatus2').textContent='Kamera wird geöffnet…'});
$('#livePhoto').addEventListener('click',e=>{e.preventDefault();if(!live.stream)return;navigator.vibrate?.(30);lStat('📸 Foto wird gelesen…');liveTick(true)});$('#uploadBtn').addEventListener('click',()=>{stopLive();$('#scanStatus2').textContent='Bildauswahl wird geöffnet…'});
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
 window.scanLang='';window.pendingScan=null;live.last=null;live.nameOnly=0;live.nameKey='';live.tries=0;live.best=null;live.nm=null;live.nb=null;if(window.Tesseract){try{getWorker().catch(()=>{});getW('num').catch(()=>{})}catch(e){}}live.timer=setInterval(liveTick,1500);liveTick()}
function stopLive(){live.switched=false;clearInterval(live.timer);live.timer=null;if(live.stream){live.stream.getTracks().forEach(t=>t.stop());live.stream=null}
 const v=$('#liveVideo');if(v)v.srcObject=null;$('#scanbox')?.classList.remove('live');live.torch=false;live.ic=null;const fs=$('.frame span');if(fs)fs.textContent='Karte im Rahmen platzieren'}
const wto=(p,ms,m)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error(m||'Zeitüberschreitung')),ms))]);
function lStat(t){$('#scanStatus2').textContent=t;const s=$('.frame span');if(s)s.textContent=t}
function needOCR(){if(window.Tesseract)return true;if(!window._tLoad){window._tLoad=1;const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=()=>{window._tLoad=0};s.onerror=()=>{window._tLoad=0};document.head.append(s)}return false}
async function liveTick(shot){if(live.busy){if(shot)live.shot=true;return}if(!live.stream)return;if(live.shot){shot=true;live.shot=false}$('#livePhoto')?.classList.remove('pulse');const v=$('#liveVideo');
 if(!needOCR()){lStat('⏳ Texterkennung lädt…');return}if(!v.videoWidth){lStat('Kamera startet…');return}live.busy=true;
 try{if(!live.ocrReady){lStat('⏳ Texterkennung lädt…');await wto(Promise.all([getWorker(),getW('num')]),60000,'Texterkennung lädt nicht (Internet?)');live.ocrReady=true}
  if(!live.stream)return;lStat('🔍 Lese Karte…');
  // Exakt wie Foto-Button: Vollbild-Standbild → Blob → toCanvas() → analyze()
  const hi=await grabStill(v);if(!live.stream||!hi)return;
  const blob=await new Promise(res=>hi.toBlob(res,'image/jpeg',0.95));const c=blob?await toCanvas(blob):hi;
  const r=await wto(analyze(c,m=>$('#scanStatus2').textContent='⏳ '+m),45000,'Erkennung dauert zu lange');if(!live.stream)return;live.tries=(live.tries||0)+1;
  $('#liveText').textContent=`→ ${r.name||'?'}${r.jp?' ('+r.jp+')':''} · ${r.full||'?'}${r.lang?' · '+r.lang:''}${r.confident&&(r.number||r.energy)?'':' · nicht sicher'}`;
  const sc=(r.name?2:0)+(r.number?1:0)+(r.confident?1:0);if(!live.best||sc>live.best.sc)live.best={r,sc};
  if(r.name&&!live.nm)live.nm=r;if(r.number&&numOK(r.full))live.nb=r;
  let q=r;if(!(r.confident&&r.name&&(r.number||r.energy))&&live.nm&&live.nb){const m=live.nm,n=live.nb;q={...m,number:n.number,full:n.full,set:n.set||m.set,setId:n.setId||m.setId,confident:true}}
  if(q.confident&&q.name&&(q.number||q.energy)){navigator.vibrate?.(200);stopLive();scanResult(q);return}
  if(live.tries>=3||shot){const b=live.best.r;navigator.vibrate?.([80,60,80]);stopLive();$('#scanStatus2').textContent=b.name?`Erkannt: ${b.name}${b.lang?' · '+b.lang:''} – bitte prüfen / Karte antippen`:'Nicht sicher erkannt – bitte Name eintippen';window.lastScan=b;scanPick(b);return}
  lStat(`❌ Nicht erkannt – näher ran / mehr Licht, oder Foto drücken (Versuch ${live.tries}/3)`);$('#livePhoto')?.classList.add('pulse')}
 catch(e){console.warn('liveTick',e);lStat('❌ '+(e&&e.message||e)+' – näher ran / mehr Licht');if(/Texterkennung/.test(e&&e.message||'')){delete ocrW['deu+eng'];delete ocrW.num}}finally{live.busy=false}}
async function grabStill(v){await focusPass();if(!live.stream)return null;
 if(live.ic&&!live.icBad){try{const b=await wto(live.ic.takePhoto(),3000,'takePhoto');if(b&&b.size)return await toCanvas(b,4000)}catch(e){console.warn('takePhoto',e);live.icBad=true}}
 if(!v.videoWidth)return null;const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0,c.width,c.height);return c}
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
  try{const w=(caps.width&&caps.width.max)||0;await tr.applyConstraints({width:{ideal:w>=3840?3840:1920},height:{ideal:w>=3840?2160:1080}})}catch(e){}}
 return false}
async function camOpen(id){try{const s=await navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:id},width:{ideal:1920},height:{ideal:1080}},audio:false});
 if(live.stream)live.stream.getTracks().forEach(t=>t.stop());live.stream=s;return true}catch(e){console.warn('camOpen',e);return false}}
async function camNext(){const cams=live.cams||await backCams();if(cams.length<2||!live.stream)return;const cur=live.stream.getVideoTracks()[0].getSettings?.().deviceId;
 const i=cams.findIndex(c=>c.deviceId===cur),n=cams[(i+1)%cams.length];live.switched=true;
 if(await camOpen(n.deviceId)){try{localStorage.setItem(CAMKEY,n.deviceId)}catch(e){}lStat('📷 Kamera: '+(n.label||'Kamera '+((i+1)%cams.length+1)));clearInterval(live.timer);await startLive2()}}
async function doFocus(x,y,wait){const tr=live.stream?.getVideoTracks()[0];if(!tr)return;let caps={};try{caps=tr.getCapabilities?.()||{}}catch(e){}const fm=caps.focusMode||[];const adv={};
 if(caps.pointsOfInterest&&x!=null)adv.pointsOfInterest=[{x,y}];
 if(fm.includes('single-shot'))adv.focusMode='single-shot';else if(fm.includes('manual')&&caps.focusDistance){adv.focusMode='manual';adv.focusDistance=Math.min(caps.focusDistance.max,Math.max(caps.focusDistance.min,0.12))}else if(fm.includes('continuous'))adv.focusMode='continuous';
 if(!Object.keys(adv).length)return;try{await tr.applyConstraints({advanced:[adv]})}catch(e){console.warn('focus',e)}
 if(wait)await new Promise(r=>setTimeout(r,wait));
 if(adv.focusMode!=='continuous'&&fm.includes('continuous'))setTimeout(()=>{const t=live.stream?.getVideoTracks()[0];t&&t.applyConstraints({advanced:[{focusMode:'continuous'}]}).catch(()=>{})},wait?300:1500)}
function focusPass(){return doFocus(.5,.5,600)}
function focusRing(px,py){const w=$('#scanbox .camwrap');if(!w)return;const r=w.getBoundingClientRect(),d=document.createElement('div');d.className='focusring';d.style.left=(px-r.left)+'px';d.style.top=(py-r.top)+'px';w.append(d);setTimeout(()=>d.remove(),900)}
$('#liveVideo').addEventListener('click',e=>{if(!live.stream)return;const r=e.currentTarget.getBoundingClientRect();focusRing(e.clientX,e.clientY);$('#scanStatus2').textContent='Scharfstellen…';doFocus((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,0)});
$('#camSwitch')?.addEventListener('click',e=>{e.preventDefault();camNext()});
$('.frame')?.addEventListener('click',e=>{$('#liveVideo').dispatchEvent(new MouseEvent('click',{clientX:e.clientX,clientY:e.clientY}))});
$('#liveBtn').onclick=e=>{e.preventDefault();startLive()};$('#liveCancel').onclick=()=>{stopLive();$('#scanStatus2').textContent='Live-Scan abgebrochen.'};
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
