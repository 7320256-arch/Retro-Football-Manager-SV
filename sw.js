/* Retro Football Manager SV — PWA Service Worker
   Robust version for GitHub Pages + PWABuilder.
   Important: this SW never fails installation just because an optional file is missing. */

const CACHE_VERSION = 'rfm-sv-pwa-v11';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.png'
];

const OPTIONAL_ASSETS = [
  './icon-192.png',
  './menu.mp3',
  './menu2.mp3',
  './menu3.mp3',
  './menu4.mp3',
  './menu5.mp3',
  './menu.ogg',
  './menu2.ogg'
];

async function safeCacheAdd(cache, url) {
  try {
    const response = await fetch(url, { cache: 'reload' });
    if (response && response.ok) {
      await cache.put(url, response.clone());
    }
  } catch (err) {
    // Do not fail install if GitHub Pages has not published a file yet.
    console.warn('[SW] Could not cache:', url, err);
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.all([...CORE_ASSETS, ...OPTIONAL_ASSETS].map(url => safeCacheAdd(cache, url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_NOW') {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.all([...CORE_ASSETS, ...OPTIONAL_ASSETS].map(url => safeCacheAdd(cache, url)));
    })());
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);

  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;

    const fallback = await cache.match('./index.html') || await cache.match('./');
    if (fallback) return fallback;

    return new Response('Retro Football Manager SV no está disponible sin conexión todavía. Abre el juego una vez con internet para guardarlo offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  const freshPromise = fetch(request)
    .then(response => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  return cached || freshPromise || new Response('', { status: 204 });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const accept = request.headers.get('accept') || '';
  const isNavigation = request.mode === 'navigate' || accept.includes('text/html');

  if (isNavigation) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
