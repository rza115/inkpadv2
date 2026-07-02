// js/core/splash.js
// Splash screen PWA — gambar 9:16 dari /assets/splash/splash.png
// Hanya saat cold start dari ikon PWA (standalone). Tidak untuk hard refresh,
// tab browser baru, atau navigasi internal antar halaman.

(function initInkpadSplash() {
  const SPLASH_SEEN_KEY = 'inkpad-splash-shown';
  const SPLASH_SRC = '/assets/splash/splash.png';
  const MIN_VISIBLE_MS = 1500;
  const MAX_VISIBLE_MS = 4500;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true;

  function shouldShowSplash() {
    if (!isStandalone) return false;
    if (sessionStorage.getItem(SPLASH_SEEN_KEY)) return false;

    const nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.type !== 'navigate') return false;

    return true;
  }

  if (!shouldShowSplash()) return;

  function mountSplash() {
    if (document.getElementById('inkpad-splash')) return;

    const splash = document.createElement('div');
    splash.id = 'inkpad-splash';
    splash.className = 'inkpad-splash';
    splash.setAttribute('role', 'img');
    splash.setAttribute('aria-label', 'Inkpad');

    const img = document.createElement('img');
    img.className = 'inkpad-splash__img';
    img.src = SPLASH_SRC;
    img.alt = '';
    img.decoding = 'sync';
    img.fetchPriority = 'high';

    splash.appendChild(img);
    document.documentElement.classList.add('inkpad-splash-active');
    document.body.prepend(splash);
    return splash;
  }

  function hideSplash(splash) {
    if (!splash || splash.dataset.hiding === '1') return;
    splash.dataset.hiding = '1';
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
    document.documentElement.classList.remove('inkpad-splash-active');

    splash.classList.add('is-hiding');
    splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    setTimeout(() => splash.remove(), 500);
  }

  function scheduleHide(splash) {
    const shownAt = Date.now();
    let hidden = false;

    function dismiss() {
      if (hidden) return;
      hidden = true;
      const elapsed = Date.now() - shownAt;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(() => hideSplash(splash), wait);
    }

    if (document.readyState === 'complete') dismiss();
    else window.addEventListener('load', dismiss, { once: true });

    setTimeout(dismiss, MAX_VISIBLE_MS);
  }

  function start() {
    const splash = mountSplash();
    if (!splash) return;
    scheduleHide(splash);
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
