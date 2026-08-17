/* Faro — offline cache. After a disaster, connectivity is patchy: once the app
 * has loaded on a phone, it must keep opening with no network. Cache-first for
 * the app shell; bump VERSION on every deploy to invalidate. */
const VERSION = 'faro-v5';
const ASSETS = [
  './',
  'index.html',
  'css/styles.css',
  'vendor/leaflet/leaflet.css',
  'vendor/leaflet/leaflet.js',
  'js/config.js',
  'js/strings.js',
  'js/seed.js',
  'js/store.js',
  'js/basemap.js',
  'js/map-view.js',
  'js/needs-view.js',
  'js/trends-view.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
];

self.addEventListener('install', (e) => {
  // Cache each asset individually: a missing optional file (e.g. the vendored
  // Leaflet copy, when the CDN fallback is in use) must not break offline mode.
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
