/* Retro Football Manager SV — offline cache for GitHub Pages / WebView APK */
const CACHE_VERSION = 'rfm-sv-offline-v7';
const CORE_ASSETS = [
  './',
  './manager.html'
];
const OPTIONAL_ASSETS = [
  './music/menu.mp3',
  './music/menu2.mp3',
  './music/menu3.mp3',
  './music/menu4.mp3',
  './music/menu5.mp3',
  './music/menu.ogg',
  './music/menu2.ogg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_ASSETS.map(url => new Request(url, { cache: 'reload' }))).then(() => Promise.all(OPTIONAL_ASSETS.map(u => fetch(u).then(r => r.ok && cache.put(u, r)).catch(() => null)))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CACHE_NOW') {
    event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE_ASSETS).then(() => Promise.all(OPTIONAL_ASSETS.map(u => fetch(u).then(r => r.ok && cache.put(u, r)).catch(() => null))))));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const fallback = await cache.match('./manager.html');
    if (fallback) return fallback;
    throw e;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const freshPromise = fetch(request).then(response => {
    if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || freshPromise || fetch(request);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const accept = req.headers.get('accept') || '';
  const isNavigation = req.mode === 'navigate' || accept.includes('text/html');

  if (isNavigation) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});
