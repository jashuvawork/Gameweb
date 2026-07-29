/* JASHUVA GAMES service worker — offline shell + background sync hook */
const CACHE = 'jashuva-v1';
const CORE = ['/', '/games', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((cached) =>
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => cached),
    ),
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'jg-cloud-save') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'JASHUVA GAMES', body: 'Play Forever.' };
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: '/icons/icon-192.png' }));
});
