// Service worker del sitio (Estoico + Entreno): hace que ambas abran sin conexión.
// Estrategia "red primero" para la app: con internet siempre trae la última versión
// publicada; sin internet usa la copia guardada. Las fuentes de Google se guardan
// aparte para que la tipografía también funcione sin conexión.
// Subí la versión si cambiás la lista de archivos.
const CACHE_NAME = 'estoico-v5';
const FONT_CACHE = 'estoico-fuentes-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/shared.css',
  '/shared.js',
  '/estoico.css',
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
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keep = [CACHE_NAME, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fuentes: primero la copia guardada; si no está, se descarga y se guarda
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(req).then((hit) => hit || fetch(req).then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); event.waitUntil(caches.open(CACHE_NAME).then((c) => c.put(req, copy))); }
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
