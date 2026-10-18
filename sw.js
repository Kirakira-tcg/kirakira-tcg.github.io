const C='kartenapp-v156',A=['./','index.html','style.css','app.js','fx.js','prices.js','names.js','trainers.js','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A.map(u=>new Request(u,{cache:'reload'})))).catch(()=>{}).then(()=>caches.keys()).then(ks=>{/* Alte Clients (< v81) kennen das Update-Banner nicht → sofort aktivieren */if(ks.some(k=>{const m=k.match(/^kartenapp-v(\d+)$/);return m&&+m[1]<81}))self.skipWaiting()}).catch(()=>{}))});
self.addEventListener('message',e=>{const d=e.data||{};if(d==='SKIP_WAITING'||d.type==='SKIP_WAITING')self.skipWaiting();if(d.type==='VERSION'&&e.ports&&e.ports[0])e.ports[0].postMessage({version:C})});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>/^kartenapp-v\d+$/.test(k)&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// v147: Cache-Fehler nie als „Uncaught (in promise)“ – bei vollem Speicher (QuotaExceededError, z. B. Inkognito) ältere Bild-Einträge löschen und still überspringen
const IMG='kartenapp-img';
async function evict(name,frac){try{const c=await caches.open(name),ks=await c.keys();const n=Math.max(1,Math.ceil(ks.length*frac));await Promise.all(ks.slice(0,n).map(k=>c.delete(k)))}catch(e){}}
function put(name,req,res){return caches.open(name).then(c=>c.put(req,res)).catch(err=>{if(err&&err.name==='QuotaExceededError')return evict(IMG,name===IMG?.5:1)}).catch(()=>{})}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
// Kartenbilder: nur <img>-Abrufe (no-cors) zwischenspeichern; CORS-Abrufe (Scan/Teilen-Bild) macht der Browser selbst – TCGdex schickt dort teils einen doppelten CORS-Header
if(u.hostname==='assets.tcgdex.net'){if(e.request.mode!=='no-cors'||e.request.method!=='GET')return;e.respondWith(caches.open(IMG).then(c=>c.match(e.request)).catch(()=>null).then(h=>h||fetch(e.request).then(r=>{if(r.ok||r.type==='opaque')put(IMG,e.request,r.clone());return r})).catch(()=>Response.error()));return}
if(u.origin!==location.origin)return;
e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok&&e.request.method==='GET')put(C,e.request,r.clone());return r}).catch(()=>caches.match(e.request).then(h=>h||Response.error())))});
