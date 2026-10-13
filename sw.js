const C='kartenapp-v113',A=['./','index.html','style.css','app.js','fx.js','prices.js','jpcards.json','names.js','trainers.js','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A.map(u=>new Request(u,{cache:'reload'})))).catch(()=>{}).then(()=>caches.keys()).then(ks=>{/* Alte Clients (< v81) kennen das Update-Banner nicht → sofort aktivieren */if(ks.some(k=>{const m=k.match(/^kartenapp-v(\d+)$/);return m&&+m[1]<81}))self.skipWaiting()}).catch(()=>{}))});
self.addEventListener('message',e=>{const d=e.data||{};if(d==='SKIP_WAITING'||d.type==='SKIP_WAITING')self.skipWaiting();if(d.type==='VERSION'&&e.ports&&e.ports[0])e.ports[0].postMessage({version:C})});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>/^kartenapp-v\d+$/.test(k)&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
if(u.hostname==='assets.tcgdex.net'){e.respondWith(caches.open('kartenapp-img').then(c=>c.match(e.request).then(h=>h||fetch(e.request).then(r=>{if(r.ok||r.type==='opaque')c.put(e.request,r.clone());return r}))));return}
if(/(^|\.)(tcgdex\.net|frankfurter\.(dev|app)|er-api\.com)$/.test(u.hostname)){e.respondWith(fetch(e.request));return}
if(u.origin!==location.origin)return;
e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)))});
