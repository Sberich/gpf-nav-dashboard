const CACHE_NAME = 'gpf-app-cache-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './gpfnav69.html',
  './manifest.json',
  './manifest-port.json',
  './icon.png',
  './icon-port.svg'
];

// ติดตั้ง Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
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
        if (response && response.status === 200 && response.type === 'basic') {
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