const CACHE_NAME = 'weatherapp-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/forecast.html',
  '/maps.html',
  '/settings.html',
  '/about.html',
  '/styles.css',
  '/script.js',
  '/images/sun.png',
  '/images/cloud.png',
  '/images/rain.png',
  '/images/snow.png',
  '/images/favicon.ico',
  '/images/apple-touch-icon.png',
  '/images/favicon-32x32.png',
  '/images/favicon-16x16.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});