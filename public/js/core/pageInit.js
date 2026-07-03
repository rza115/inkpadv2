// js/core/pageInit.js
// DEPRECATED: This file is obsolete with Next.js App Router
// New pages use Next.js routing and React hooks for initialization
// See /app/* for new page structure
//
// Registry pattern buat init logic per halaman.
//
// Tiap halaman manggil: pageInit.register('namaHalaman', initFunction)
// pageInit otomatis jalanin init function yang cocok pas event 'auth-ready' nyala
// (dispatch dari auth-guard.js, setelah session check beres) — biar nggak ada
// race condition antara cek auth dan fetch data yang butuh auth.

const pageInit = (() => {
  const registry = {};
  const initializedPages = new Set();

  function register(pageName, initFn) {
    registry[pageName] = initFn;
    if (window.authReady) {
      run();
    }
  }

  function run() {
    const pageName = document.body.dataset.page;
    const fn = registry[pageName];
    if (typeof fn === 'function') {
      if (initializedPages.has(pageName)) return;
      initializedPages.add(pageName);
      fn();
    } else {
      console.warn(`pageInit: belum ada init function buat halaman "${pageName}"`);
    }
  }

  return { register, run };
})();

document.addEventListener('auth-ready', () => {
  pageInit.run();
});
