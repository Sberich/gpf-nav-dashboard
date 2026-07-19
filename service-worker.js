const CACHE_NAME = 'gpf-app-cache-v5';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './gpfnav69.html',
  './gpfrobo.html',
  './manifest.json',
  './manifest-port.json',
  './manifest-robo-v2.json',
  './icon.png',
  './icon-port.svg',
  './config.js',
  'https://cdn.jsdelivr.net/npm/apexcharts@3.46.0/dist/apexcharts.min.js',
  'https://cdn.jsdelivr.net/npm/flatpickr',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css',
  'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap'
];

// ติดตั้ง Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // ใช้ Promise.allSettled หรือแคชทีละไฟล์ เพื่อไม่ให้ล้มเหลวทั้งหมดถ้าพังแค่ไฟล์เดียว
      return Promise.allSettled(
        URLS_TO_CACHE.map(url => {
          return fetch(new Request(url, { cache: 'reload' }))
            .then(response => {
              if (response.ok) return cache.put(url, response);
            })
            .catch(err => console.warn('Cache failed for:', url, err));
        })
      );
    })
  );
  self.skipWaiting();
});

// เคลียร์ Cache เก่าทิ้งเมื่อมีการอัปเดต
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
  self.clients.claim();
});

// ระบบ Network First: พยายามดึงจากเน็ตก่อน ถ้าล้มเหลว (ไม่มีเน็ต) ให้ดึงจาก Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // ถ้าโหลดจากเน็ตสำเร็จ ให้เซฟลง Cache อัปเดตของใหม่ด้วย
        // ยอมรับ response.status 200 หรือแบบ opaque (CDN) 
        if (response && (response.status === 200 || response.type === 'opaque')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // ถ้าดึงจากเน็ตไม่ได้ (ออฟไลน์) ให้เรียกของเก่าจาก Cache
        return caches.match(event.request);
      })
  );
});