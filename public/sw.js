// Service Worker for Teacher Resource Hub
const CACHE_NAME = 'teacher-hub-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching assets skipped in dev mode:', err);
      });
    })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Navigation fallback to index.html for SPA offline routing
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Network-first strategy with cache fallback for requests
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses for assets
        if (
          event.request.method === 'GET' &&
          response.status === 200 &&
          (event.request.url.includes('/assets/') ||
           event.request.url.includes('.css') ||
           event.request.url.includes('.js') ||
           event.request.url.includes('.svg') ||
           event.request.url.includes('.png'))
        ) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // Offline fallback for media/images if requested
        if (event.request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }

        return new Response('Offline content unavailable', {
          status: 503,
          statusText: 'Service Unavailable (Offline)',
        });
      })
  );
});
