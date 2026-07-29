/* Retro Football Manager SV — minimal PWABuilder-safe Service Worker */
const CACHE_VERSION = 'rfm-sv-pwabuilder-safe-v1';
const APP_SHELL = [
  '/Retro-Football-Manager-SV/',
  '/Retro-Football-Manager-SV/index.html',
  '/Retro-Football-Manager-SV/manifest.json',
  '/Retro-Football-Manager-SV/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => Promise.all(APP_SHELL.map(url => fetch(url).then(r => r.ok ? cache.put(url, r.clone()) : null).catch(() => null))))
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

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/Retro-Football-Manager-SV/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => new Response('', { status: 204 })))
  );
});
