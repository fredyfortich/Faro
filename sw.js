/* Faro — offline cache (flat single-file deployment). */
const VERSION = 'faro-flat-v1';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const origin = new URL(e.request.url).origin;
  const cacheable = origin === location.origin || origin === 'https://unpkg.com';
  if (e.request.method !== 'GET' || !cacheable) return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    }))
  );
});
