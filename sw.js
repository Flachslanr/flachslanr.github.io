// Service worker del sitio (Estoico + Entreno): hace que ambas abran sin conexión.
// Estrategia "red primero": con internet siempre trae la última versión publicada;
// sin internet usa la copia guardada. Subí la versión si cambiás la lista de archivos.
const CACHE_NAME = 'estoico-v3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/favicon.ico',
  '/entreno.html',
  '/entreno.css',
  '/entreno-app.js',
  '/entreno-programa.js',
  '/entreno-store.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => {
          if (hit) return hit;
          if (req.mode === 'navigate') return caches.match(url.pathname.startsWith('/entreno') ? '/entreno.html' : '/index.html');
          return Response.error();
        })
      )
  );
});
