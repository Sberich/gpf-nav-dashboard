const CACHE_NAME = 'gpf-nav-cache-v1';
const URLS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon.png',
  './config.js',
  'https://cdn.jsdelivr.net/npm/apexcharts@3.46.0/dist/apexcharts.min.js',
  'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        URLS_TO_CACHE.map(url =>
          fetch(new Request(url, { cache: 'reload' }))
            .then(r => { if (r.ok) return cache.put(url, r); })
            .catch(err => console.warn('Cache failed:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.map(c => c !== CACHE_NAME ? caches.delete(c) : undefined))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && (response.status === 200 || response.type === 'opaque')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
