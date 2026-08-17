const CACHE='growth-compass-preview2-e2-v2';
const CORE=[
  '/experience/2/',
  '/experience/2/css/foundation.css',
  '/experience/2/css/surfaces.css',
  '/experience/2/css/shell.css',
  '/experience/2/css/today.css',
  '/experience/2/css/plan.css',
  '/experience/2/js/app.js',
  '/experience/2/js/core/api.js',
  '/experience/2/js/core/preferences.js',
  '/experience/2/js/views/foundation.js',
  '/experience/2/js/views/today.js',
  '/experience/2/js/views/plan.js',
  '/experience/2/manifest.webmanifest'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('growth-compass-preview2-e2-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)));});
