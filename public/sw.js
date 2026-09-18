const CACHE_NAME = 'acadesys-cache-v2';

// 1. Precarga los recursos base que nunca cambian de nombre
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/vite.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Solo procesamos solicitudes GET locales o del CDN de estilos
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  const isLocal = url.startsWith(self.location.origin);
  const isTailwind = url.includes('cdn.tailwindcss.com');

  if (!isLocal && !isTailwind) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si el archivo ya está en caché, entrégalo de inmediato (funciona 100% offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no está, búscalo en la red y guárdalo automáticamente en la caché
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback exclusivamente para navegación si el usuario entra a una subruta offline
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});