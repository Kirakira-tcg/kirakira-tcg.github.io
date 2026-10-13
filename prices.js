'use strict';
// Zweite Preisquelle: TCGdex (mehrsprachig, Cardmarket EUR, TCGplayer USD).
// Fremdwährungen (USD, JPY) werden nach EUR umgerechnet und als "umgerechnet" markiert.
// Eigener Cache-Schlüssel – 'kartenapp_v1' wird nie angefasst.
(function(root){
const BASE='https://api.tcgdex.net/v2';
const KEY='kartenapp_prices_v1';
const TTL=12*3600e3, FX_TTL=24*3600e3;
const FX_FALLBACK={EUR:1,USD:0.92,JPY:0.0057}; // EUR je Einheit
const LANGS=['de','en','fr','es','it','pt-br','pt-pt','ja','zh-tw','id','th','ko','nl','pl','ru','zh-cn'];
const mem=new Map();let store=null;
const ls=()=>{try{return root.localStorage||null}catch(e){return null}};
function load(){if(store)return store;try{store=JSON.parse(ls()?.getItem(KEY)||'{}')}catch(e){store={}}store.c??={};return store}
function save(){try{ls()?.setItem(KEY,JSON.stringify(store))}catch(e){/* voll: Cache leeren */try{store.c={};ls()?.setItem(KEY,JSON.stringify(store))}catch(_){}}}
function cget(k,ttl){const m=mem.get(k);if(m&&Date.now()-m.t<ttl)return m.v;const s=load().c[k];if(s&&Date.now()-s.t<ttl){mem.set(k,s);return s.v}return undefined}
function cset(k,v){const e={t:Date.now(),v};mem.set(k,e);load().c[k]=e;save()}
async function getJSON(u){const r=await fetch(u,{signal:AbortSignal.timeout(8000)});if(r.status===404)return null;if(!r.ok)throw new Error('TCGdex '+r.status);return r.json()}
const normLang=l=>{l=(l||'de').toLowerCase();if(l==='jp')l='ja';return LANGS.includes(l)?l:'en'};
// pokemontcg.io-Set-IDs -> TCGdex (sv1->sv01, sv3pt5->sv03.5, swsh12pt5->swsh12.5, swsh45->swsh4.5, me1->me01, me55->30th)
// v105: Sonder-IDs gegen beide Set-Listen geprüft (api.pokemontcg.io/v2/sets vs api.tcgdex.net/v2/en/sets)
const TDX_SET={me55:'30th',me55c:'30th-c',base6:'lc',hsp:'hgssp',bp:'bog',fut20:'fut2020',pgo:'swsh10.5',cel25c:'cel25cc',swsh45sv:'swsh4.5sv',swsh12pt5gg:'swsh12.5gg',zsv10pt5:'sv10.5b',rsv10pt5:'sv10.5w',sm35:'sm3.5',sm75:'sm7.5',swsh35:'swsh3.5',swsh45:'swsh4.5',tk1a:'tk-ex-latia',tk1b:'tk-ex-latio',tk2a:'tk-ex-p',tk2b:'tk-ex-m',mcd11:'2011bw',mcd12:'2012bw',mcd14:'2014xy',mcd15:'2015xy',mcd16:'2016xy',mcd17:'2017sm',mcd18:'2018sm',mcd19:'2019sm',mcd21:'2021swsh',mcd22:'2022swsh'};
const tdxSet=s=>{s=String(s||'');if(TDX_SET[s])return TDX_SET[s];let m;if((m=s.match(/^(sv|me)(\d)(pt5)?$/)))return m[1]+'0'+m[2]+(m[3]?'.5':'');if((m=s.match(/^(sv|me)(\d\d)pt5$/)))return m[1]+m[2]+'.5';if((m=s.match(/^(swsh|sm|xy|bw)(\d+)pt5$/)))return m[1]+m[2]+'.5';return s};
// TCGdex schreibt Nummern bei SV/ME/30th dreistellig (sv01-086, 30th-005, 30th-c-001), sonst ungepolstert (swsh1-1)
const tdxPad=s=>/^(sv|me|30th|swsh(9|10|11|12)(\.5)?$)/.test(s);
// v111: Classic-Collection-Sets nummerieren bei pokemontcg.io nach Originalkarte (cel25c-4_A, me55c-11g), bei TCGdex fortlaufend (cel25cc-CC002, 30th-c-001)
// -> feste Zuordnung pro Karte (per Name gegen beide APIs geprüft). [TCGdex-Nr., Originalnummer für eBay]
const CLS={cel25c:{pre:'cel25cc-CC',m:{'2_A':[1,'2/102'],'4_A':[2,'4/102'],'15_A1':[3,'15/102'],'73_A':[4,'73/102'],'8_A':[5,'8/82'],'15_A2':[6,'15/82'],'15_A3':[7,'15/132'],'24_A':[8,'24'],'20_A':[9,'20/111'],'66_A':[10,'66/64'],'9_A':[11,'9/95'],'86_A':[12,'86/109'],'88_A':[13,'88/92'],'93_A':[14,'93/101'],'17_A':[15,'17/17'],'15_A4':[16,'15/106'],'109_A':[17,'109/111'],'145_A':[18,'145/147'],'107_A':[19,'107/123'],'113_A':[20,'113/114'],'114_A':[21,'114/114'],'54_A':[22,'54/99'],'97_A':[23,'97/146'],'76_A':[24,'76/108'],'60_A':[25,'60/145']}},
 me55c:{pre:'30th-c-',m:{'4':[1,'4/102'],'5':[2,'5/109'],'11':[3,'11/113'],'11g':[4,'11/101'],'18':[5,'18/132'],'19':[6,'19/109'],'25':[7,'25/111'],'33':[8,'33/181'],'41':[9,'41/122'],'43':[10,'43/146'],'47':[11,'47/127'],'50':[12,'50/185'],'57':[13,'57/111'],'58':[14,'58/102'],'69':[15,'69/132'],'85':[16,'85/124'],'89':[17,'89/149'],'94':[18,'94/102'],'99':[19,'99/102'],'100':[20,'100/102'],'101':[21,'101/101'],'106p':[22,'106/106'],'106m':[23,'106/160'],'106':[24,'106/105'],'108':[25,'108/115'],'114':[26,'114/264'],'123':[27,'123/172'],'138':[28,'138/202'],'149':[29,'149/147'],'203':[30,'203/193']}}};
const clsId=(s,n)=>{const c=CLS[s],e=c&&c.m[n];return e?c.pre+String(e[0]).padStart(3,'0'):null};
// Vor v111 wurde me55c-4 zu 30th-c-004 (Genesect) – gespeicherte IDs per Kartenname reparieren
const C30=['Charizard','Delcatty','Metagross','Genesect','Misty','Dark Tyranitar','Sneasel','Pikachu & Zekrom','Greninja','Uxie','Crobat','Raikou','Buzzwole','Pikachu','Erika','Rayquaza','Solgaleo','Gengar','Darkrai','Darkrai','N','Palkia','M Gardevoir','Shining Celebi','Scizor','Mew VMAX','Arceus','Zacian','Lugia','Magikarp'];
const cnm=x=>String(x||'').toLowerCase().replace(/[^a-z&]/g,'');
const clsFix=(id,name)=>{const m=String(id||'').match(/^30th-c-0*(\d+)$/);if(!m||!name)return id;const q=cnm(name),ok=i=>q.startsWith(cnm(C30[i]))&&!(C30[i]==='Pikachu'&&q.includes('zekrom'));if(ok(+m[1]-1))return id;const i=C30.findIndex((x,k)=>ok(k));return i<0?id:'30th-c-'+String(i+1).padStart(3,'0')};
const clsNum=id=>{const m=String(id||'').match(/^(cel25c|me55c)-(.+)$/);const e=m&&CLS[m[1]].m[m[2]];return e&&e[1]||null};
const tdxId=id=>{const m=String(id||'').match(/^(.*)-([^-]+)$/);if(!m)return id;let s=m[1],n=m[2];if(CLS[s])return clsId(s,n)||(s==='cel25c'?'cel25cc-?':'30th-c-?')+n;const t=tdxSet(s);if(tdxPad(t)&&/^\d+$/.test(n))n=n.padStart(3,'0');return t+'-'+n};
const pad3=n=>String(n).replace(/^0+/,'').padStart(3,'0');

async function rate(cur){cur=(cur||'EUR').toUpperCase();if(cur==='EUR')return{rate:1,fallback:false};
 const k='fx:'+cur;const c=cget(k,FX_TTL);if(c)return c;
 for(const u of [`https://api.frankfurter.dev/v1/latest?base=${cur}&symbols=EUR`,`https://open.er-api.com/v6/latest/${cur}`]){
  try{const j=await (await fetch(u)).json();const r=j?.rates?.EUR;if(r>0){const v={rate:r,fallback:false,date:j.date||j.time_last_update_utc||null};cset(k,v);return v}}catch(e){}}
 return{rate:FX_FALLBACK[cur]??null,fallback:true};}
async function toEUR(amount,cur){if(amount==null)return null;const r=await rate(cur);return r.rate==null?null:{eur:+(amount*r.rate).toFixed(2),rate:r.rate,fallback:r.fallback,umgerechnet:cur.toUpperCase()!=='EUR'}}

// v82: JP-Set-IDs (Großbuchstaben, z.B. SV4a, S8b, SM9) gibt es nur in /ja, internationale (klein, z.B. swsh4, dp7) nicht in /ja -> keine sinnlosen 404
const idLangOk=(id,lang)=>{id=String(id||'');if(id.startsWith('jp:'))return false;const set=id.replace(/-[^-]+$/,'');const up=/[A-Z]/.test(set);if(lang==='ja')return up||/^(neo[1-4]|web1|sm2\+)$/.test(set);return !up||/^(P-A|A\d|B\d)/.test(set)};
const NEG=new Map();
async function getCard(id,lang){lang=normLang(lang);if(!String(id).startsWith('jp:'))id=tdxId(id);const k=`card:${lang}:${id}`;if(!idLangOk(id,lang))return null;if(NEG.has(k)&&Date.now()-NEG.get(k)<6*3600e3)return null;const c=cget(k,TTL);if(c!==undefined)return c;
 let d=null;try{d=await getJSON(`${BASE}/${lang}/cards/${encodeURIComponent(id)}`)}catch(e){d=null}if(!d)NEG.set(k,Date.now());cset(k,d?slim(d):null);return d?slim(d):null}
const slim=d=>({id:d.id,localId:d.localId,name:d.name,image:d.image||null,rarity:d.rarity||null,set:d.set?{id:d.set.id,name:d.set.name}:null,pricing:d.pricing||null});
async function search(name,lang){lang=normLang(lang);const k=`s:${lang}:${name.toLowerCase()}`;const c=cget(k,TTL);if(c!==undefined)return c;
 const d=await getJSON(`${BASE}/${lang}/cards?name=${encodeURIComponent(name)}`)||[];cset(k,d);return d}

// Rohdaten -> einheitliches Preisobjekt
// v112: TCGdex hängt an cel25cc-CC020/CC021 (Reshiram 113/114, Zekrom 114/114) die Preise der Celebrations-Hauptset-Karten cel25-2/cel25-10 (gleiche idProduct 576747/576755, TCGplayer ebenso) -> verwerfen, lieber '–'
const BADP={'cel25cc-CC020':1,'cel25cc-CC021':1};
async function normalize(card,lang){const p=BADP[card?.id]?{}:(card?.pricing||{});const out={id:card.id,name:card.name,lang,set:card.set,localId:card.localId,image:card.image?card.image+'/high.webp':null,prices:[],best:null};
 const cm=p.cardmarket;if(cm){let pick=cm.trend||cm.avg30||cm.avg||cm.low||cm['trend-holo']||cm['avg30-holo']||null,fixed=null;if(cm.trend&&cm.avg7&&cm.avg30&&cm.trend<.25*cm.avg7&&cm.trend<.25*cm.avg30){pick=cm.avg7;fixed='Ø 7 Tage'}else if(cm.trend&&!cm.avg7&&cm.avg30&&cm.trend<.25*cm.avg30){pick=cm.avg30;fixed='Ø 30 Tage'}const cur=(cm.unit||'EUR').toUpperCase();const conv=await toEUR(pick,cur);
  out.prices.push({source:fixed?`Cardmarket (TCGdex, ${fixed} – Trend unplausibel)`:'Cardmarket (TCGdex)',currency:cur,value:pick,eur:conv?.eur??null,umgerechnet:!!conv?.umgerechnet,fxFallback:!!conv?.fallback,
   trend:cm.trend,avg:cm.avg,low:cm.low,avg1:cm.avg1,avg7:cm.avg7,avg30:cm.avg30,holo:{trend:cm['trend-holo'],avg:cm['avg-holo'],low:cm['low-holo'],avg30:cm['avg30-holo']},
   idProduct:cm.idProduct,url:cm.idProduct?`https://www.cardmarket.com/de/Pokemon/Products?idProduct=${cm.idProduct}`:null,updated:cm.updated});}
 const tp=p.tcgplayer;if(tp){const cur=(tp.unit||'USD').toUpperCase();for(const [v,o] of Object.entries(tp)){if(!o||typeof o!=='object')continue;const val=o.marketPrice??o.midPrice??o.lowPrice??null;const conv=await toEUR(val,cur);
  out.prices.push({source:'TCGplayer (TCGdex)',variant:v,currency:cur,value:val,eur:conv?.eur??null,umgerechnet:!!conv?.umgerechnet,fxFallback:!!conv?.fallback,low:o.lowPrice,mid:o.midPrice,high:o.highPrice,market:o.marketPrice,updated:tp.updated})}}
 // v114: TCGdex ohne Preis -> Cardmarket-Werte derselben Karte aus pokemontcg.io (mit Datum, da teils alt)
 if(!out.prices.length&&lang!=='ja'&&!String(card.id).startsWith('jp:')){try{const cm=await ptcgCM(card.id);if(cm){const v=cm.prices.trendPrice||cm.prices.avg30||cm.prices.averageSellPrice||null;if(v){const d=String(cm.updatedAt||'').split('/').reverse().join('.');
  out.prices.push({source:`Cardmarket (pokemontcg.io${d?', Stand '+d:''})`,currency:'EUR',value:v,eur:v,umgerechnet:false,fxFallback:false,trend:cm.prices.trendPrice,avg:cm.prices.averageSellPrice,low:cm.prices.lowPrice,avg1:cm.prices.avg1,avg7:cm.prices.avg7,avg30:cm.prices.avg30,url:`https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`,updated:cm.updatedAt})}}}catch(e){}}
 out.best=out.prices.find(x=>x.eur!=null)||null;
 if(out.best)out.label=`${out.best.eur.toFixed(2).replace('.',',')} € · ${out.best.source}${out.best.umgerechnet?` · umgerechnet aus ${out.best.currency}${out.best.fxFallback?' (Schätzkurs)':''}`:''}`;
 else out.label='kein Preis bei TCGdex';
 return lang==='ja'?jpm(out):out}
// JP-Marktpreis (pokeca-souba, Yen) aus statischer jpprices.json (tools/build_jpprices.py) – getrennt von Cardmarket/eBay
let jppP=null;function jppLoad(){if(jppP)return jppP;const u=(typeof document!=='undefined'&&document.baseURI)?new URL('jpprices.json',document.baseURI).href:'jpprices.json';
 jppP=fetch(u).then(r=>r.ok?r.json():null).then(d=>d&&d.p?d:{p:{}}).catch(()=>{jppP=null;return{p:{}}});return jppP}
async function jpm(out){if(!out||out.best)return out;try{const d=await jppLoad(),sid=out.set&&out.set.id||String(out.id).replace(/^jp:/,'').replace(/-[^-]*$/,''),e=d.p[sid+'-'+nz(out.localId)];
 if(!e||!e.y)return out;const c=await toEUR(e.y,'JPY');if(!c)return out;
 out.jpMarket={source:'pokeca-souba (JP-Markt)',currency:'JPY',value:e.y,eur:c.eur,umgerechnet:true,fxFallback:!!c.fallback,updated:d.date,url:d.url};out.best=out.jpMarket;
 out.label=`${c.eur.toFixed(2).replace('.',',')} € · pokeca-souba (JP-Markt) · ¥${e.y.toLocaleString('de-DE')}${c.fallback?' (Schätzkurs)':''}`}catch(e){}return out}


// Japanische Sets, die TCGdex fehlen: statische jpcards.json (tools/build_jp.py)
let jpP=null,jpLogos={};
function jpLoad(){if(jpP)return jpP;const u=(typeof document!=='undefined'&&document.baseURI)?new URL('jpcards.json',document.baseURI).href:'jpcards.json';
 jpP=fetch(u).then(r=>r.ok?r.json():null).then(d=>{if(!d||!Array.isArray(d.c))return[];if(d.covers)for(const[k,v]of Object.entries(d.covers))jpLogos[k]=/assets\.tcgdex\.net/.test(v)&&!/\.\w{3,4}$/.test(v)?v+'/low.webp':v;return d.c.map(([set,localId,total,name,img])=>({id:'jp:'+set+'-'+(localId||img.replace(/^.*\/|\.\w+$/g,'')),set,localId,total,name,image:(u=>/pokemon-card\.com|snkrdunk\.com|tcgplayer\.com|serebii\.net|pokeca\.net/i.test(u)?'':u)(/^https?:\/\//.test(img||'')?img:(d.base&&img?d.base+img:'')),setName:(d.sets||{})[set]||set}))}).catch(()=>{jpP=null;return[]});return jpP}
const jpNorm=c=>({id:c.id,name:c.name,lang:'ja',set:{id:c.set,name:c.setName&&c.setName!==c.set&&!c.setName.includes(c.set)?`${c.setName} (${c.set})`:c.setName},localId:c.localId,total:c.total,image:c.image,prices:[],best:null,label:'kein Preis – siehe Cardmarket',source:'pokemon-card.com'});
const nz=x=>String(x??'').split('/')[0].trim().replace(/^0+(?=\d)/,'');
const numN=n=>{if(n==null)return null;const v=String(n).split('/')[0].trim();return v||null};
const snrm=x=>String(x||'').toLowerCase().replace(/[\s・_\-:'’.&]/g,'');
// Set-Code oder Set-Name (z.B. „30th CELEBRATION“) -> jpcards-Set-Code
async function jpSetCode(s){if(!s)return null;const L=await jpLoad(),q=snrm(s);const hit=L.find(x=>snrm(x.set)===q)||L.find(x=>snrm(x.setName)===q);return hit?hit.set:null}
// Name in beliebiger Sprache -> mögliche JP-Namen (PNAMES: [en,de,ja])
function jaNames(n){n=String(n||'').replace(/\s*\(([^)]*)\)\s*$/,(m,g)=>{jaNames._p=g;return''}).trim();const extra=jaNames._p;jaNames._p=null;const out=new Set([n]);if(extra)out.add(extra.trim());
 for(const x of [...out]){const k=snrm(x);for(const r of [].concat(root.PNAMES||[],root.TNAMES||[]))if(r.some(y=>y&&snrm(y)===k)&&r[2])out.add(r[2])}return[...out].filter(Boolean)}
async function jpLookup(name,setId,number){const L=await jpLoad();if(!L.length)return null;let c=null;number=numN(number);setId=(await jpSetCode(setId))||setId;
 if(setId&&number!=null)c=L.find(x=>x.set.toLowerCase()===String(setId).toLowerCase()&&nz(x.localId)===nz(number));
 if(!c&&name){const ns=jaNames(name).map(snrm);const byN=L.filter(x=>ns.includes(snrm(x.name)));c=(number!=null&&byN.find(x=>nz(x.localId)===nz(number)))||(setId&&byN.find(x=>x.set.toLowerCase()===String(setId).toLowerCase()))||(number==null&&!setId?byN[0]:null)}
 return c?jpm(jpNorm(c)):null}
async function jpSuggest(q,limit){const L=await jpLoad();const ql=q.replace(/\s/g,'');if(!ql)return[];
 return L.filter(x=>x.name.replace(/\s/g,'').includes(ql)).slice(0,limit).map(x=>({id:x.id,name:x.name,localId:x.localId||'',set:{id:x.set,name:x.setName},img:x.image,lang:'ja'}))}

// lookup(name, lang='de', setId?, number?) -> Preisobjekt oder null
async function lookup(name,lang,setId,number){lang=normLang(lang);number=numN(number);let r=null;
 if(lang==='ja'){const jc=await jpSetCode(setId);if(jc||String(setId||'').startsWith('jp:')){const j=await jpLookup(name,jc||setId,number);if(j)return j}}
 try{r=await lookupT(name,lang,setId,number)}catch(e){if(lang!=='ja')throw e}
 if(r&&lang==='ja'){const ns=jaNames(name).map(snrm),ok=(!name||ns.some(n=>snrm(r.name).startsWith(n)))&&(number==null||nz(r.localId)===nz(number));if(!ok)r=null}
 if(!r&&lang==='ja')r=await jpLookup(name,setId,number);return r}
async function lookupT(name,lang,setId,number){
 if(setId)setId=tdxSet(setId);
 const cls=setId==='cel25cc'||setId==='30th-c';if(cls)number=null;
 if(setId&&number!=null){const ids=[...new Set([`${setId}-${number}`,`${setId}-${pad3(number)}`,`${setId}-${String(number).replace(/^0+/,'')}`])];const r=await Promise.all(ids.map(id=>getCard(id,lang).catch(()=>null)));const c=r.find(Boolean);if(c)return normalize(c,lang)}
 if(!name)return null;let list=await search(name,lang);
 if(setId)list=list.filter(c=>c.id.toLowerCase().startsWith(setId.toLowerCase()+'-'));
 if(number!=null)list=list.filter(c=>c.localId.replace(/^0+/,'')===String(number).replace(/^0+/,''));
 const exact=list.filter(c=>c.name.toLowerCase()===name.toLowerCase());const cand=(exact.length?exact:list).slice(0,5);
 for(const s of cand){const c=await getCard(s.id,lang);if(c&&c.pricing&&(c.pricing.cardmarket||c.pricing.tcgplayer))return normalize(c,lang)}
 return cand[0]?normalize(await getCard(cand[0].id,lang),lang):null}

// Type-ahead: suggest(query, lang='de', limit=24) -> [{id,name,localId,set:{id,name},img}]
const SET_TTL=7*24*3600e3;
async function setNames(lang){const k='sets:'+lang;const c=cget(k,SET_TTL);if(c)return c;
 try{const d=await getJSON(`${BASE}/${lang}/sets`)||[];const m={};for(const s of d)m[s.id]=s.name;cset(k,m);return m}catch(e){return{}}}
const setIdOf=c=>{const suf='-'+c.localId;return c.id.endsWith(suf)?c.id.slice(0,-suf.length):c.id.replace(/-[^-]*$/,'')};
async function suggestLang(q,lang,limit){let list;try{list=await search(q,lang)}catch(e){return[]}
 if(!Array.isArray(list)||!list.length)return[];const ql=q.toLowerCase(),names=await setNames(lang);
 const rank=c=>{const n=(c.name||'').toLowerCase();return (n===ql?0:n.startsWith(ql)?1:n.split(/[\s-]/).some(w=>w.startsWith(ql))?2:3)+(c.image?0:4)};
 return list.filter(c=>c&&c.id&&c.name).map((c,i)=>({c,i,r:rank(c)})).sort((a,b)=>a.r-b.r||a.i-b.i).slice(0,limit).map(({c})=>{const sid=setIdOf(c);
  return{id:c.id,name:c.name,localId:c.localId||'',set:{id:sid,name:names[sid]||sid},img:c.image?c.image+'/low.webp':null,lang}})}
function nameRows(q){const ql=q.toLowerCase(),rows=[].concat(root.PNAMES||[],root.TNAMES||[]),ex=[],pre=[];
 for(const r of rows){const m=r.map(x=>(x||'').toLowerCase());if(m.includes(ql))ex.push(r);else if(pre.length<3&&m.some(x=>x&&x.startsWith(ql)))pre.push(r)}return ex.length?ex.slice(0,2):pre}
async function suggest(query,lang='de',limit=24){const q=String(query||'').trim();if(q.length<2)return[];lang=normLang(lang);limit=Math.max(1,Math.min(+limit||24,100));
 const L=['de','en','ja'],qs={de:new Set(),en:new Set(),ja:new Set()};qs[lang].add(q);
 for(const r of nameRows(q)){if(r[0])qs.en.add(r[0]);if(r[1])qs.de.add(r[1]);if(r[2])qs.ja.add(r[2])}
 if(qs[lang].size===1&&!nameRows(q).length&&lang!=='en')qs.en.add(q);
 const per=await Promise.all(L.map(async lg=>{const o=[];for(const x of qs[lg]){if(lg==='ja')o.push(...await jpSuggest(x,Math.ceil(limit/2)));o.push(...await suggestLang(x,lg,limit))}return o}));
 const first=per.splice(L.indexOf(lang),1)[0];per.unshift(first);const seen=new Set(),r=[];
 for(let i=0;r.length<limit&&per.some(a=>i<a.length);i++)for(const a of per){const c=a[i];if(c&&!seen.has(c.lang+c.id)&&r.length<limit){seen.add(c.lang+c.id);r.push(c)}}
 return r}

// Set-Browser JP: jpSets() -> [{id,name,count,src,logo}], neueste zuerst; jpSetCards(id) -> [{id,localId,name,img,set,lang}]
async function jpSets(){let t=cget('jpsets:ja',SET_TTL);if(!t){try{const d=await getJSON(`${BASE}/ja/sets`)||[];t=d.map(s=>({id:s.id,name:s.name,count:s.cardCount?.total||0,logo:s.logo||s.symbol||null,src:'tcgdex'}));if(t.length)cset('jpsets:ja',t)}catch(e){t=[]}}
 const L=await jpLoad(),m=new Map();for(const c of L){const e=m.get(c.set)||{id:c.set,name:c.setName,count:0,logo:null,src:'jp'};e.count++;m.set(c.set,e)}
 const have=new Set(t.map(s=>s.id));t=t.map(s=>({...s,logo:jpLogos[s.id]||null}));for(const e of m.values())e.logo=jpLogos[e.id]||null;const jn=[...m.values()].filter(s=>!have.has(s.id)).sort((a,b)=>(a.id==='ENE')-(b.id==='ENE')||(b.id==='M6a')-(a.id==='M6a'));return[...jn.filter(s=>s.id!=='ENE'),...t.slice().reverse(),...jn.filter(s=>s.id==='ENE')]}
async function jpSetCards(id){if(String(id).startsWith('jp:'))id=id.slice(3);const L=await jpLoad(),j=L.filter(c=>c.set===id);
 if(j.length)return j.map(c=>({id:c.id,localId:c.localId||'',name:c.name,img:c.image,set:{id:c.set,name:c.setName},lang:'ja'}));
 const k='jpset:'+id;let d=cget(k,SET_TTL);if(d===undefined){d=await getJSON(`${BASE}/ja/sets/${encodeURIComponent(id)}`);d=d?{name:d.name,cards:(d.cards||[]).map(c=>({id:c.id,localId:c.localId,name:c.name,image:c.image||null}))}:null;cset(k,d)}
 if(!d)return[];return d.cards.map(c=>({id:c.id,localId:c.localId,name:c.name,img:c.image?c.image+'/low.webp':null,set:{id,name:d.name},lang:'ja'}))}

async function jpImgFallback(url){return null;try{const d=await jppLoad(),L=await jpLoad(),c=L.find(x=>x.image===url);const e=c&&d.p[c.set+'-'+nz(c.localId)];return e&&e.i||null}catch(e){return null}}
// TCGdex-Set-ID -> pokemontcg.io-Set-ID (nur für Bild-Fallback)
const PT_REV=Object.fromEntries(Object.entries(TDX_SET).map(([k,v])=>[v,k]));
const ptcgSet=t=>{t=String(t||'');if(PT_REV[t])return PT_REV[t];if(/[A-Z]/.test(t)||/^(30th|cel25cc)/.test(t))return null;let m;if((m=t.match(/^(sv|me)0?(\d+)(\.5)?$/)))return m[1]+m[2]+(m[3]?'pt5':'');if((m=t.match(/^(swsh|sm|xy|bw)(\d+)\.5$/)))return m[1]+m[2]+'pt5';return t};
async function ptcgCM(tid){const m=String(tid||'').match(/^(.*)-([^-]+)$/);if(!m)return null;const ps=ptcgSet(m[1]);if(!ps)return null;const id=ps+'-'+(/^\d+$/.test(m[2])?String(+m[2]):m[2]);const k='ptcm:'+id;const c=cget(k,TTL);if(c!==undefined)return c;
 // pokemontcg.io antwortet oft mit 5xx (ohne CORS-Header -> 'Failed to fetch') -> bis zu 4 Versuche mit Backoff
 let v=null,okR=false;for(let i=0;i<4&&!okR;i++){if(i)await new Promise(z=>setTimeout(z,700*i));try{const r=await fetch(`https://api.pokemontcg.io/v2/cards/${encodeURIComponent(id)}?select=id,name,cardmarket`,{signal:AbortSignal.timeout(10000)});if(r.status===404){cset(k,null);return null}if(!r.ok)continue;const j=await r.json();v=j&&j.data&&j.data.cardmarket&&j.data.cardmarket.prices?j.data.cardmarket:null;okR=true}catch(e){}}if(!okR)return null;cset(k,v);return v}
root.Prices={tdxSet,tdxId,ptcgSet,clsNum,clsFix,jpImgFallback,jpSets,jpSetCards,lookup,suggest,byId:async(id,lang)=>{lang=normLang(lang);if(String(id).startsWith('jp:')){const L=await jpLoad();const c=L.find(x=>x.id===id);return c?jpm(jpNorm(c)):null}const c=await getCard(id,lang);return c?normalize(c,lang):null},search,toEUR,rate,
 clearCache(){mem.clear();store={c:{}};save()},CACHE_KEY:KEY,LANGS};
})(typeof window!=='undefined'?window:globalThis);
