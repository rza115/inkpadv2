# Fix: Service worker crash - "Failed to convert value to 'Response'"

## File
`public/service-worker.js`

## Root cause
Di fetch handler (baris ~60-74), pola stale-while-revalidate:

```js
const networkFetch = fetch(event.request)
  .then((response) => { ... return response; })
  .catch(() => cached);

return cached || networkFetch;
```

Kalau request TIDAK ada di cache (`cached` = `undefined`) DAN `fetch()` reject
di level network (request di-abort saat navigasi, gambar ilustrasi di-cancel
pas scroll cepat, dsb) — `.catch()` balikin `undefined`. `networkFetch` lalu
resolve ke `undefined`, dan `event.respondWith(undefined)` bikin browser throw
`TypeError: Failed to convert value to 'Response'` karena Service Worker API
mewajibkan `respondWith` selalu dikasih Response yang valid.

## Fix
Ganti isi listener `fetch` di `public/service-worker.js` jadi:

```js
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Selalu balikin Response yang valid, jangan pernah undefined
          return (
            cached ||
            new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' },
            })
          );
        });

      return cached || networkFetch;
    })
  );
});
```

Juga naikkan `CACHE_NAME` ke versi baru (misal `inkpad-shell-v39-nextjs`) supaya
service worker lama yang masih error ke-replace paksa di semua client.

## Verifikasi
- Buka reader page, scroll cepat biar beberapa request gambar sempat ter-abort,
  pastikan tidak ada lagi `Uncaught (in promise) TypeError` di Console terkait
  service worker.
- Test offline (matikan network di DevTools) untuk memastikan halaman yang sudah
  pernah dibuka tetap ke-load dari cache tanpa error.
