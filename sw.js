/* 青魚工具箱 — Service Worker */
const CACHE_NAME = 'aoyu-toolbox-v2';
const APP_SHELL = [
  './',
  './index.html',
  './player.html',
  './timer.html',
  './notes.html',
  './store.html',
  './tool-pomodoro.html',
  './tool-noise.html',
  './tool-dice.html',
  './tool-password.html',
  './tool-unit.html',
  './tool-bmi.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/db.js',
  './js/player.js',
  './js/timer.js',
  './js/notes.js',
  './js/store.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // 只快取同源的 App 外殼檔案；使用者匯入的影音檔存在 IndexedDB，不經過網路。
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => {
          if (request.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});
