// js/core/pwa-register.js
// Daftarin service worker buat caching app shell (offline-first).
// Catatan: service worker cuma jalan di localhost atau HTTPS, nggak jalan
// kalau dibuka langsung via file:// — pastikan tes lewat Live Server / Vercel.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('Service worker gagal didaftarin:', err.message);
    });
  });
}
