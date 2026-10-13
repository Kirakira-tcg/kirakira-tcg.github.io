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
async function getJSON(u){const r=await fetch(u);if(r.status===404)return null;if(!r.ok)throw new Error('TCGdex '+r.status);return r.json()}
const normLang=l=>{l=(l||'de').toLowerCase();if(l==='jp')l='ja';return LANGS.includes(l)?l:'en'};
const pad3=n=>String(n).replace(/^0+/,'').padStart(3,'0');

async function rate(cur){cur=(cur||'EUR').toUpperCase();if(cur==='EUR')return{rate:1,fallback:false};
 const k='fx:'+cur;const c=cget(k,FX_TTL);if(c)return c;
 for(const u of [`https://api.frankfurter.dev/v1/latest?base=${cur}&symbols=EUR`,`https://open.er-api.com/v6/latest/${cur}`]){
  try{const j=await (await fetch(u)).json();const r=j?.rates?.EUR;if(r>0){const v={rate:r,fallback:false,date:j.date||j.time_last_update_utc||null};cset(k,v);return v}}catch(e){}}
 return{rate:FX_FALLBACK[cur]??null,fallback:true};}
async function toEUR(amount,cur){if(amount==null)return null;const r=await rate(cur);return r.rate==null?null:{eur:+(amount*r.rate).toFixed(2),rate:r.rate,fallback:r.fallback,umgerechnet:cur.toUpperCase()!=='EUR'}}

async function getCard(id,lang){lang=normLang(lang);const k=`card:${lang}:${id}`;const c=cget(k,TTL);if(c!==undefined)return c;
 const d=await getJSON(`${BASE}/${lang}/cards/${encodeURIComponent(id)}`);cset(k,d?slim(d):null);return d?slim(d):null}
const slim=d=>({id:d.id,localId:d.localId,name:d.name,image:d.image||null,rarity:d.rarity||null,set:d.set?{id:d.set.id,name:d.set.name}:null,pricing:d.pricing||null});
async function search(name,lang){lang=normLang(lang);const k=`s:${lang}:${name.toLowerCase()}`;const c=cget(k,TTL);if(c!==undefined)return c;
 const d=await getJSON(`${BASE}/${lang}/cards?name=${encodeURIComponent(name)}`)||[];cset(k,d);return d}

// Rohdaten -> einheitliches Preisobjekt
async function normalize(card,lang){const p=card?.pricing||{};const out={id:card.id,name:card.name,lang,set:card.set,localId:card.localId,image:card.image?card.image+'/high.webp':null,prices:[],best:null};
 const cm=p.cardmarket;if(cm){const pick=cm.trend||cm.avg30||cm.avg||cm.low||cm['trend-holo']||cm['avg30-holo']||null;const cur=(cm.unit||'EUR').toUpperCase();const conv=await toEUR(pick,cur);
  out.prices.push({source:'Cardmarket (TCGdex)',currency:cur,value:pick,eur:conv?.eur??null,umgerechnet:!!conv?.umgerechnet,fxFallback:!!conv?.fallback,
   trend:cm.trend,avg:cm.avg,low:cm.low,avg1:cm.avg1,avg7:cm.avg7,avg30:cm.avg30,holo:{trend:cm['trend-holo'],avg:cm['avg-holo'],low:cm['low-holo'],avg30:cm['avg30-holo']},
   idProduct:cm.idProduct,url:cm.idProduct?`https://www.cardmarket.com/de/Pokemon/Products?idProduct=${cm.idProduct}`:null,updated:cm.updated});}
 const tp=p.tcgplayer;if(tp){const cur=(tp.unit||'USD').toUpperCase();for(const [v,o] of Object.entries(tp)){if(!o||typeof o!=='object')continue;const val=o.marketPrice??o.midPrice??o.lowPrice??null;const conv=await toEUR(val,cur);
  out.prices.push({source:'TCGplayer (TCGdex)',variant:v,currency:cur,value:val,eur:conv?.eur??null,umgerechnet:!!conv?.umgerechnet,fxFallback:!!conv?.fallback,low:o.lowPrice,mid:o.midPrice,high:o.highPrice,market:o.marketPrice,updated:tp.updated})}}
 out.best=out.prices.find(x=>x.eur!=null)||null;
 if(out.best)out.label=`${out.best.eur.toFixed(2).replace('.',',')} € · ${out.best.source}${out.best.umgerechnet?` · umgerechnet aus ${out.best.currency}${out.best.fxFallback?' (Schätzkurs)':''}`:''}`;
 else out.label='kein Preis bei TCGdex';
 return out}


// Japanische Sets, die TCGdex fehlen: statische jpcards.json (tools/build_jp.py)
let jpP=null;
function jpLoad(){if(jpP)return jpP;const u=(typeof document!=='undefined'&&document.baseURI)?new URL('jpcards.json',document.baseURI).href:'jpcards.json';
 jpP=fetch(u).then(r=>r.ok?r.json():null).then(d=>{if(!d||!Array.isArray(d.c))return[];return d.c.map(([set,localId,total,name,img])=>({id:'jp:'+set+'-'+(localId||img.replace(/^.*\/|\.\w+$/g,'')),set,localId,total,name,image:d.base+img,setName:(d.sets||{})[set]||set}))}).catch(()=>{jpP=null;return[]});return jpP}
const jpNorm=c=>({id:c.id,name:c.name,lang:'ja',set:{id:c.set,name:c.setName},localId:c.localId,total:c.total,image:c.image,prices:[],best:null,label:'kein Preis – siehe Cardmarket',source:'pokemon-card.com'});
const nz=x=>String(x??'').replace(/^0+/,'');
async function jpLookup(name,setId,number){const L=await jpLoad();if(!L.length)return null;let c=null;
 if(setId&&number!=null)c=L.find(x=>x.set.toLowerCase()===String(setId).toLowerCase()&&nz(x.localId)===nz(number));
 if(!c&&name){const n=name.trim();const byN=L.filter(x=>x.name===n||x.name.replace(/\s/g,'')===n.replace(/\s/g,''));c=(number!=null&&byN.find(x=>nz(x.localId)===nz(number)))||(setId&&byN.find(x=>x.set.toLowerCase()===String(setId).toLowerCase()))||(number==null&&!setId?byN[0]:null)}
 return c?jpNorm(c):null}
async function jpSuggest(q,limit){const L=await jpLoad();const ql=q.replace(/\s/g,'');if(!ql)return[];
 return L.filter(x=>x.name.replace(/\s/g,'').includes(ql)).slice(0,limit).map(x=>({id:x.id,name:x.name,localId:x.localId||'',set:{id:x.set,name:x.setName},img:x.image,lang:'ja'}))}

// lookup(name, lang='de', setId?, number?) -> Preisobjekt oder null
async function lookup(name,lang,setId,number){lang=normLang(lang);let r=null;try{r=await lookupT(name,lang,setId,number)}catch(e){if(lang!=='ja')throw e}
 if(!r&&lang==='ja')r=await jpLookup(name,setId,number);return r}
async function lookupT(name,lang,setId,number){
 if(setId&&number!=null){for(const id of [`${setId}-${number}`,`${setId}-${pad3(number)}`,`${setId}-${String(number).replace(/^0+/,'')}`]){const c=await getCard(id,lang);if(c)return normalize(c,lang)}}
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

root.Prices={lookup,suggest,byId:async(id,lang)=>{lang=normLang(lang);if(String(id).startsWith('jp:')){const L=await jpLoad();const c=L.find(x=>x.id===id);return c?jpNorm(c):null}const c=await getCard(id,lang);return c?normalize(c,lang):null},search,toEUR,rate,
 clearCache(){mem.clear();store={c:{}};save()},CACHE_KEY:KEY,LANGS};
})(typeof window!=='undefined'?window:globalThis);
