// service-worker.js
// Caches APP SHELL (CSS/JS/assets) for offline capability
// Data (Supabase) is handled by offline-queue, not cached here

const CACHE_NAME = 'inkpad-shell-v37-nextjs';

const SHELL_ASSETS = [
  '/',
  '/login',
  '/manuscript',
  '/characters',
  '/worldbuilding',
  '/plot',
  '/notes',
  '/reader',
  '/epub-library',
  '/epub-reader',
  '/favicon.ico',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/splash/splash.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.error('Cache addAll failed:', err);
        // Continue even if some assets fail to cache
      });
    })
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

  // Only handle requests to own origin
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  // Skip caching for Next.js data routes and API routes
  if (url.pathname.startsWith('/_next/') || 
      url.pathname.startsWith('/api/')) {
    return;
  }

  // Stale-while-revalidate: serve from cache, update in background
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
