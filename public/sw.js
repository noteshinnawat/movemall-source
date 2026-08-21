// Movemall Service Worker (PWA) — Network First Live Sync
const CACHE_NAME = 'movemall-cache-v5';
const STATIC_ASSETS = [
  '/manifest.th.json',
  '/manifest.en.json',
  '/manifest.my.json',
  '/favicon.svg',
  '/locales/th/common.json',
  '/locales/th/navigation.json',
  '/locales/en/common.json',
  '/locales/en/navigation.json',
  '/locales/my/common.json',
  '/locales/my/navigation.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip Vite dev endpoints, APIs, and non-http schemes
  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@fs') ||
    url.pathname.startsWith('/src') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('hot-update') ||
    !url.protocol.startsWith('http')
  ) {
    return;
  }

  // Stale-while-revalidate for translation catalogs: serve the cached copy
  // instantly (buyers should never wait on a locale fetch) while a fresh
  // copy updates the cache in the background for next time.
  if (url.pathname.startsWith('/locales/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Network-First for HTML navigation and JS chunks
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        return new Response('Network error or resource unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
