// service-worker.js
// Cuma nge-cache APP SHELL (HTML/CSS/JS/icon) biar app bisa kebuka offline.
// Data (Supabase) sengaja nggak disentuh di sini — itu urusan offline-queue.js,
// biar nggak ada cache basi yang nimpa data asli pas online lagi.

const CACHE_NAME = 'inkpad-shell-v33';


const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/pages/manuscript.html',
  '/pages/characters.html',
  '/pages/worldbuilding.html',
  '/pages/plot.html',
  '/pages/notes.html',
  '/pages/reader.html',
  '/pages/epub-library.html',
  '/pages/epub-reader.html',
  '/css/reader.css',
  '/css/epub-reader.css',

  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/manuscript.css',
  '/css/splash.css',
  '/js/core/supabase-client.js',
  '/js/core/auth-guard.js',
  '/js/core/project-context.js',
  '/js/core/offline-queue.js',
  '/js/core/pwa-register.js',
  '/js/core/splash.js',
  '/js/core/storage.js',
  '/js/core/nav.js',
  '/js/core/pageInit.js',
  '/js/utils/debounce.js',
  '/js/utils/format.js',
  '/js/utils/markdown-lite.js',
  '/js/utils/markdown-render.js',
  '/js/utils/cross-link.js',
  '/js/utils/cross-link-suggest.js',
  '/js/modules/projects.js',
  '/js/modules/chapters.js',
  '/js/modules/characters.js',
  '/js/modules/characters-page.js',
  '/js/modules/manuscript.js',
  '/js/modules/reader.js',
  '/js/modules/worldbuilding.js',
  '/js/modules/worldbuilding-page.js',
  '/js/modules/plot.js',
  '/js/modules/plot-page.js',
  '/js/modules/notes.js',
  '/js/modules/notes-page.js',
  '/js/modules/illustrations.js',
  '/js/modules/hub.js',
  '/js/modules/epub-books.js',
  '/js/modules/epub-library-page.js',
  '/js/modules/epub-reader-page.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/splash/splash.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cuma urusin request ke origin sendiri. Request ke Supabase/CDN biar lewat normal.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  // Stale-while-revalidate: tampilkan cache dulu kalau ada, lalu update diam-diam dari network.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
