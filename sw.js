const C='kartenapp-v186',A=['./','index.html','style.css','app.js','fx.js','prices.js','names.js','trainers.js','manifest.json','icon-192.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png'];
/* v183 (offline): Daten fürs Starten einzeln (ein Fehler bricht die Installation nicht ab) */const X=['sets.json','setxref.json?v=156','jpsetnames.json?v=130','jpsetdates.json?v=184','jpcards.json','imgmap.json','cmprices.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A.map(u=>new Request(u,{cache:'reload'}))).then(()=>Promise.all(X.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{}))))).catch(()=>{}).then(()=>caches.keys()).then(ks=>{/* Alte Clients (< v81) kennen das Update-Banner nicht → sofort aktivieren */if(ks.some(k=>{const m=k.match(/^kartenapp-v(\d+)$/);return m&&+m[1]<81}))self.skipWaiting()}).catch(()=>{}))});
self.addEventListener('message',e=>{const d=e.data||{};if(d==='SKIP_WAITING'||d.type==='SKIP_WAITING')self.skipWaiting();if(d.type==='VERSION'&&e.ports&&e.ports[0])e.ports[0].postMessage({version:C})});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(/^kartenapp-v\d+$/.test(k)&&k!==C)||k===IMG).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// v147: Cache-Fehler nie als „Uncaught (in promise)“ – bei vollem Speicher (QuotaExceededError, z. B. Inkognito) ältere Bild-Einträge löschen und still überspringen
const IMG='kartenapp-img';
async function evict(name,frac){try{const c=await caches.open(name),ks=await c.keys();const n=Math.max(1,Math.ceil(ks.length*frac));await Promise.all(ks.slice(0,n).map(k=>c.delete(k)))}catch(e){}}
function put(name,req,res){return caches.open(name).then(c=>c.put(req,res)).catch(err=>{if(err&&err.name==='QuotaExceededError')return evict(IMG,name===IMG?.5:1)}).catch(()=>{})}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
/* v157: Kartenbilder nicht mehr über den Service Worker – <img>-Abrufe sind „opaque“: der Status ist unsichtbar, also wurden auch Fehlantworten (404/429/5xx) dauerhaft zwischengespeichert und immer wieder ausgeliefert, und Chrome rechnet jeden opaque-Eintrag mit ~7 MB an (183 Bilder ≈ 1,3 GB → Speicher voll). Der Browser-HTTP-Cache übernimmt das. */
if(u.origin!==location.origin)return;
if(e.request.method!=='GET')return;
/* v183 (offline, installierte App): Netz zuerst; ohne Netz aus dem Cache dieser Version – auch mit ?v= (Vorab-Cache liegt ohne Abfrage), Seitenaufruf fällt auf index.html zurück. Seitenaufruf wartet höchstens 4 s aufs Netz (schwaches Netz), danach Cache */
const nav=e.request.mode==='navigate';
const fromCache=()=>caches.open(C).then(c=>c.match(e.request).then(h=>h||c.match(e.request,{ignoreSearch:true})).then(h=>h||(nav?c.match('index.html').then(x=>x||c.match('./')):null))).then(h=>h||caches.match(e.request)).then(h=>h||Response.error());
const net=fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok)put(C,e.request,r.clone());return r});
if(!nav){e.respondWith(net.catch(fromCache));return}
e.respondWith(new Promise(res=>{let done=false;const t=setTimeout(()=>{fromCache().then(h=>{if(!done&&h&&h.type!=='error'){done=true;res(h)}})},4000);net.then(r=>{if(!done){done=true;clearTimeout(t);res(r)}},()=>{clearTimeout(t);fromCache().then(h=>{if(!done){done=true;res(h)}})})}))});
