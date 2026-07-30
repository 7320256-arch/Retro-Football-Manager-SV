/* Retro Football Manager SV — PWABuilder-safe Service Worker with audio range support */
const CACHE_VERSION = 'rfm-sv-pwabuilder-safe-v4';
const MUSIC_CACHE = 'rfm-music-offline-v4';
const SCOPE_PATH = '/Retro-Football-Manager-SV/';

const APP_SHELL = [
  SCOPE_PATH,
  SCOPE_PATH + 'index.html',
  SCOPE_PATH + 'manifest.json',
  SCOPE_PATH + 'icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => Promise.all(APP_SHELL.map(url => fetch(url).then(r => r.ok ? cache.put(url, r.clone()) : null).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k !== CACHE_VERSION && k !== MUSIC_CACHE)
      .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isAudioRequest(request) {
  const url = new URL(request.url);
  return /\.(mp3|ogg|m4a|wav|aac)$/i.test(url.pathname);
}

async function makeRangeResponse(request, response) {
  const range = request.headers.get('range');
  if (!range) return response;

  const blob = await response.blob();
  const size = blob.size;
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  if (!match) return response;

  let start = match[1] ? Number(match[1]) : 0;
  let end = match[2] ? Number(match[2]) : size - 1;

  if (Number.isNaN(start) || start < 0) start = 0;
  if (Number.isNaN(end) || end >= size) end = size - 1;
  if (start > end) {
    return new Response(null, {
      status: 416,
      headers: {
        'Content-Range': `bytes */${size}`,
        'Accept-Ranges': 'bytes'
      }
    });
  }

  const sliced = blob.slice(start, end + 1);
  return new Response(sliced, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Length': String(sliced.size),
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}

async function handleAudio(request) {
  const cache = await caches.open(MUSIC_CACHE);
  const cached = await caches.match(request, { ignoreSearch: true });
  const range = request.headers.get('range');

  // If we have the complete song cached, serve proper 206 range responses offline/online.
  if (cached && range) return makeRangeResponse(request, cached.clone());
  if (cached && !navigator.onLine) return cached;

  try {
    const fresh = await fetch(request);
    // Cache only complete audio responses. Do not cache 206 partial responses.
    if (fresh && fresh.ok && fresh.status === 200) {
      cache.put(new URL(request.url).origin + new URL(request.url).pathname, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    if (cached) {
      if (range) return makeRangeResponse(request, cached.clone());
      return cached;
    }
    return new Response('', { status: 503, statusText: 'Audio unavailable offline' });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const fallback = await cache.match(SCOPE_PATH + 'index.html') || await cache.match(SCOPE_PATH);
    if (fallback) return fallback;
    return new Response('Retro Football Manager SV no está disponible sin conexión todavía.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (isAudioRequest(request)) {
    event.respondWith(handleAudio(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).catch(() => new Response('', { status: 204 })))
  );
});
