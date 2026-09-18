const CACHE_NAME = 'acadesys-cache-v4';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

// 1. Precarga forzada en instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] No se pudo precargar:', asset, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// 2. Limpieza de cachés viejas y toma de control inmediata
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 3. Interceptación de peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Manejo de navegación / recargas completas (F5)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Si no hay red, busca la URL pedida; si no, entrega index.html raíz
          const cachedMatch = await caches.match(request);
          if (cachedMatch) return cachedMatch;

          const rootIndex = await caches.match('/index.html');
          if (rootIndex) return rootIndex;

          const slashMatch = await caches.match('/');
          if (slashMatch) return slashMatch;

          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // Recursos estáticos (JS, CSS, imágenes): Cache-First con guardado automático
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      });
    })
  );
});