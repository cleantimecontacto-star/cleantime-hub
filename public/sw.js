const CACHE_NAME = 'cleantime-v6';
const urlsToCache = ['/', '/icon/icon-192.png', '/icon/icon-512.png'];

self.addEventListener('install', (event) =>
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
);
self.addEventListener('activate', (event) =>
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  )
);
self.addEventListener('fetch', (event) =>
  event.respondWith(
    caches.match(event.request).then((r) => r || fetch(event.request))
  )
);
