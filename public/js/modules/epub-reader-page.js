// js/modules/epub-reader-page.js

function bootEpubReader() {
  initEpubReader().catch((err) => {
    console.error('[EPUB Reader] init gagal:', err);
    const loadingEl = document.getElementById('ep-loading');
    if (loadingEl) {
      loadingEl.classList.remove('hidden');
      loadingEl.innerHTML = `
        <i class="ti ti-alert-circle" style="font-size:28px;color:var(--ep-accent);" aria-hidden="true"></i>
        <span style="text-align:center;max-width:280px;">Gagal membuka reader: ${err.message}</span>
        <a href="/pages/epub-library.html"
           style="color:var(--ep-accent);font-size:13px;margin-top:4px;">
          ← Balik ke Library
        </a>`;
    }
  });
}

if (window.authReady) {
  bootEpubReader();
} else {
  document.addEventListener('auth-ready', bootEpubReader, { once: true });
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout (${Math.round(ms / 1000)}s)`)), ms);
    }),
  ]);
}

function parseSupabaseStorageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/?]+)\/([^?]+)/);
  if (!match) return null;
  return {
    bucket: decodeURIComponent(match[1]),
    path: decodeURIComponent(match[2]),
  };
}

async function loadEpubBuffer(epubUrl) {
  const DOWNLOAD_TIMEOUT_MS = 20000;
  let arrayBuffer = null;
  let loadMethod = '';

  // Strategi 1: Fetch public URL (bucket inkpad-media public read — cepat & tanpa parse)
  try {
    console.log('[EPUB Reader] Strategi 1: Fetch public URL');
    const response = await withTimeout(
      fetch(epubUrl, { mode: 'cors', credentials: 'omit', cache: 'no-store' }),
      DOWNLOAD_TIMEOUT_MS,
      'Fetch EPUB'
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) throw new Error('File kosong');
    loadMethod = 'fetch';
    console.log('[EPUB Reader] Fetch berhasil:', arrayBuffer.byteLength, 'bytes');
    return { arrayBuffer, loadMethod };
  } catch (fetchErr) {
    console.warn('[EPUB Reader] Strategi 1 gagal:', fetchErr.message);
    arrayBuffer = null;
  }

  // Strategi 2: Download via Supabase SDK (auth token, bypass CORS)
  const storageRef = parseSupabaseStorageUrl(epubUrl);
  if (typeof supabaseClient !== 'undefined' && supabaseClient.storage && storageRef) {
    try {
      console.log('[EPUB Reader] Strategi 2: Supabase SDK', storageRef);
      const { data: blob, error: downloadError } = await withTimeout(
        supabaseClient.storage.from(storageRef.bucket).download(storageRef.path),
        DOWNLOAD_TIMEOUT_MS,
        'Supabase download'
      );
      if (downloadError) throw downloadError;
      if (!blob) throw new Error('Supabase mengembalikan blob kosong');

      arrayBuffer = await blob.arrayBuffer();
      if (arrayBuffer.byteLength === 0) throw new Error('ArrayBuffer kosong');
      loadMethod = 'supabase-sdk';
      console.log('[EPUB Reader] Supabase SDK berhasil:', arrayBuffer.byteLength, 'bytes');
      return { arrayBuffer, loadMethod };
    } catch (downloadErr) {
      console.warn('[EPUB Reader] Strategi 2 gagal:', downloadErr.message);
      arrayBuffer = null;
    }
  } else if (!storageRef) {
    console.warn('[EPUB Reader] URL bukan format Supabase Storage yang dikenali');
  }

  // Strategi 3: kasih URL langsung ke epub.js
  console.log('[EPUB Reader] Strategi 3: URL langsung ke epub.js');
  return { arrayBuffer: null, loadMethod: 'url' };
}

async function initEpubReader() {
  const params  = new URLSearchParams(window.location.search);
  const bookId  = params.get('id');
  const loadingEl  = document.getElementById('ep-loading');
  const loadingMsg = document.getElementById('ep-loading-msg');

  function setMsg(msg)  { if (loadingMsg) loadingMsg.textContent = msg; }
  function showLoading() { loadingEl?.classList.remove('hidden'); }
  function hideLoading() { loadingEl?.classList.add('hidden'); }
  function showError(msg) {
    showLoading();
    if (loadingEl) {
      loadingEl.innerHTML = `
        <i class="ti ti-alert-circle" style="font-size:28px;color:var(--ep-accent);" aria-hidden="true"></i>
        <span style="text-align:center;max-width:280px;">${msg}</span>
        <a href="/pages/epub-library.html"
           style="color:var(--ep-accent);font-size:13px;margin-top:4px;">
          ← Balik ke Library
        </a>`;
    }
  }

  if (!bookId) { showError('ID buku tidak ditemukan.'); return; }

  // Initialize global theme system
  if (window.InkpadTheme) {
    window.InkpadTheme.init();
  }

  // ── prefs ──
  const PREF_KEY    = 'inkpad:epub-prefs';
  const FONT_SIZES  = [12, 14, 16, 18, 20];
  const FLOWS       = ['paginated', 'scrolled'];

  let prefs = { 
    fontIdx: 2, 
    flowIdx: 0,
    lineHeight: 1.6,
    paraSpacing: 1.0,
    textAlign: 'justify',
    paraIndent: 1.5
  };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (_) {}

  const progressKey = `inkpad:epub-progress:${bookId}`;

  // ── refs ──
  const backBtn        = document.getElementById('back-btn');
  const tocBtn         = document.getElementById('toc-btn');
  const tocEl          = document.getElementById('ep-toc');
  const tocList        = document.getElementById('ep-toc-list');
  const epTitle        = document.getElementById('ep-title');
  const fontSm         = document.getElementById('font-sm');
  const fontLg         = document.getElementById('font-lg');
  const flowBtn        = document.getElementById('flow-btn');
  const themeBtn       = document.getElementById('theme-btn');
  const formatBtn      = document.getElementById('format-btn');
  const formatPanel    = document.getElementById('ep-format-panel');
  const formatResetBtn = document.getElementById('format-reset-btn');
  const tapPrev        = document.getElementById('tap-prev');
  const tapNext        = document.getElementById('tap-next');
  const progressFill   = document.getElementById('ep-progress-fill');
  const viewerWrap     = document.getElementById('ep-viewer-wrap');

  let book        = null;
  let rendition   = null;
  let _currentCfi = null;

  // FIX: Tutup TOC by default supaya viewer punya ruang penuh
  tocEl.classList.add('collapsed');
  // Tutup format panel by default
  formatPanel.classList.add('collapsed');

  applyAllStyles();
  updateFlowBtn();
  updateThemeBtn();
  updateFormatUI();

  // ── controls ──
  backBtn.addEventListener('click', () => { window.location.href = '/pages/epub-library.html'; });
  tocBtn.addEventListener('click', () => tocEl.classList.toggle('collapsed'));
  formatBtn.addEventListener('click', () => formatPanel.classList.toggle('collapsed'));

  fontSm.addEventListener('click', () => {
    prefs.fontIdx = Math.max(0, prefs.fontIdx - 1);
    applyAllStyles(); savePrefs();
  });
  fontLg.addEventListener('click', () => {
    prefs.fontIdx = Math.min(FONT_SIZES.length - 1, prefs.fontIdx + 1);
    applyAllStyles(); savePrefs();
  });
  flowBtn.addEventListener('click', async () => {
    prefs.flowIdx = (prefs.flowIdx + 1) % FLOWS.length;
    savePrefs(); updateFlowBtn();
    if (rendition) {
      const cfi = _currentCfi;
      rendition.destroy();
      rendition = null;
      await startRendition(book, cfi);
    }
  });
  themeBtn.addEventListener('click', () => {
    if (window.InkpadTheme) {
      window.InkpadTheme.toggle();
      applyAllStyles();
      updateThemeBtn();
    }
  });

  // ── format controls ──
  formatPanel.querySelectorAll('[data-line-height]').forEach((btn) => {
    btn.addEventListener('click', () => {
      prefs.lineHeight = parseFloat(btn.dataset.lineHeight);
      applyAllStyles(); updateFormatUI(); savePrefs();
    });
  });
  formatPanel.querySelectorAll('[data-para-spacing]').forEach((btn) => {
    btn.addEventListener('click', () => {
      prefs.paraSpacing = parseFloat(btn.dataset.paraSpacing);
      applyAllStyles(); updateFormatUI(); savePrefs();
    });
  });
  formatPanel.querySelectorAll('[data-text-align]').forEach((btn) => {
    btn.addEventListener('click', () => {
      prefs.textAlign = btn.dataset.textAlign;
      applyAllStyles(); updateFormatUI(); savePrefs();
    });
  });
  formatPanel.querySelectorAll('[data-para-indent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      prefs.paraIndent = parseFloat(btn.dataset.paraIndent);
      applyAllStyles(); updateFormatUI(); savePrefs();
    });
  });
  formatResetBtn.addEventListener('click', () => {
    prefs.lineHeight = 1.6;
    prefs.paraSpacing = 1.0;
    prefs.textAlign = 'justify';
    prefs.paraIndent = 1.5;
    applyAllStyles(); updateFormatUI(); savePrefs();
  });

  tapPrev.addEventListener('click', () => rendition?.prev());
  tapNext.addEventListener('click', () => rendition?.next());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); rendition?.prev(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); rendition?.next(); }
  });

  // swipe
  let _touchX = 0;
  document.addEventListener('touchstart', (e) => { _touchX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - _touchX;
    if (Math.abs(dx) > 50) { dx < 0 ? rendition?.next() : rendition?.prev(); }
  }, { passive: true });

  // ── load ──
  try {
    setMsg('Mencari buku…');
    const books = await EpubBooksAPI.list();
    const bookData = books.find((b) => b.id === bookId);
    if (!bookData) { showError('Buku tidak ditemukan di library.'); return; }

    epTitle.textContent = bookData.title;
    document.title = `${bookData.title} — Inkpad`;

    setMsg('Mengunduh buku…');

    if (!bookData.epub_url || typeof bookData.epub_url !== 'string') {
      throw new Error('URL EPUB tidak valid di database.');
    }
    console.log('[EPUB Reader] EPUB URL:', bookData.epub_url);

    const { arrayBuffer, loadMethod } = await loadEpubBuffer(bookData.epub_url);

    setMsg('Memproses buku…');
    console.log('[EPUB Reader] Metode load:', loadMethod, '| ArrayBuffer:', arrayBuffer?.byteLength ?? 'N/A');

    // PENTING: jangan kasih ArrayBuffer langsung ke ePub(source).
    // epub.js akan salah mengenali argumen non-string sebagai "options",
    // bukan sebagai isi buku. Solusinya: bikin Book kosong dulu, lalu
    // panggil book.open() eksplisit.
    try {
      console.log('[EPUB Reader] Membuat Book kosong...');
      book = ePub();

      console.log('[EPUB Reader] Memanggil book.open()...');
      // FIX: epub.js v0.3.x butuh JSZip untuk meng-unarchive EPUB saat dibuka
      // dari ArrayBuffer (binary). Pastikan JSZip sudah dimuat di halaman,
      // kalau tidak konten tidak akan pernah tampil.
      if (loadMethod !== 'url' && typeof JSZip === 'undefined') {
        throw new Error('JSZip tidak tersedia. Pastikan script JSZip dimuat sebelum epub.js.');
      }

      // Pass argumen kedua "binary" secara eksplisit untuk ArrayBuffer agar
      // epub.js memilih jalur openEpub()/unarchive() dengan benar.
      const openPromise = loadMethod === 'url'
        ? book.open(bookData.epub_url)
        : book.open(arrayBuffer, 'binary');


      await Promise.race([
        openPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: buku terlalu lama diproses (>30 detik).')), 30000)
        ),
      ]);
      console.log('[EPUB Reader] book.open() resolved');
    } catch (ePubErr) {
      console.error('[EPUB Reader] Gagal membuka EPUB:', ePubErr);
      throw new Error(`Gagal inisialisasi EPUB: ${ePubErr.message}`);
    }

    buildTOC();

    // FIX: Jangan await locations.generate() sebelum startRendition().
    // generate() bisa memakan waktu sangat lama (puluhan detik untuk buku besar)
    // dan akan memblokir rendering sehingga halaman stuck di "Memproses buku…".
    // Jalankan startRendition() dulu, lalu generate locations di background.
    await startRendition(book, loadProgress());

    // Generate locations di background setelah konten sudah tampil
    book.locations.generate(1024).catch((e) =>
      console.warn('[EPUB Reader] Background locations.generate gagal:', e.message)
    );

  } catch (err) {
    console.error('[EPUB Reader]', err);
    showError(`Gagal membuka buku: ${err.message}`);
  }

  // ── rendition ──
  async function startRendition(epubBook, restoreCfi) {
    showLoading();
    setMsg('Merender halaman…');

    if (rendition) { try { rendition.destroy(); } catch (_) {} rendition = null; }

    rendition = epubBook.renderTo(viewerWrap, {
      width:               '100%',
      height:              '100%',
      flow:                FLOWS[prefs.flowIdx],
      spread:              'none',
      allowPopups:         false,
      allowScriptedContent: false,
    });

    applyAllStyles();

    try {
      await (restoreCfi ? rendition.display(restoreCfi) : rendition.display());
    } catch (_) {
      // CFI mungkin sudah tidak valid (misal file berubah) — fallback ke awal
      try {
        await rendition.display();
      } catch (e2) {
        showError(`Gagal menampilkan konten: ${e2.message}`);
        return;
      }
    }

    hideLoading();

    rendition.on('relocated', (location) => {
      const cfi = location?.start?.cfi;
      if (cfi) { _currentCfi = cfi; saveProgress(cfi); }
      updateProgress(location);
      updateTOCActive(location);
    });

    // forward keyboard event dari dalam iframe epub.js
    rendition.on('keydown', (e) => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, bubbles: true }));
    });
  }

  // ── TOC ──
  function buildTOC() {
    book.loaded.navigation.then((nav) => {
      tocList.innerHTML = '';
      if (!nav?.toc?.length) {
        tocList.innerHTML = '<p style="padding:10px; font-size:12px; color:var(--ep-muted);">Tidak ada daftar isi.</p>';
        return;
      }
      renderTOCItems(nav.toc, 0);
    }).catch(() => {});
  }

  function renderTOCItems(items, depth) {
    items.forEach((item) => {
      const el = document.createElement('div');
      el.className = `ep-toc-item${depth > 0 ? ` indent-${Math.min(depth, 2)}` : ''}`;
      el.textContent = item.label?.trim() || '—';
      el.dataset.href = item.href || '';
      el.addEventListener('click', () => {
        rendition?.display(item.href);
        if (window.innerWidth < 700) tocEl.classList.add('collapsed');
      });
      tocList.appendChild(el);
      if (item.subitems?.length) renderTOCItems(item.subitems, depth + 1);
    });
  }

  function updateTOCActive(location) {
    const href = location?.start?.href || '';
    if (!href) return;
    tocList.querySelectorAll('.ep-toc-item').forEach((el) => {
      const itemHref = el.dataset.href || '';
      el.classList.toggle('active',
        href.endsWith(itemHref) || itemHref.endsWith(href) || href.includes(itemHref)
      );
    });
  }

  // ── progress ──
  function updateProgress(location) {
    try {
      // book.locations baru valid setelah generate() dipanggil
      if (!book.locations || !book.locations.length || !book.locations.length()) return;
      const pct = book.locations.percentageFromCfi(location?.start?.cfi || '') * 100;
      if (isFinite(pct)) {
        progressFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
      }
    } catch (_) {}
  }

  function saveProgress(cfi) {
    try { localStorage.setItem(progressKey, cfi); } catch (_) {}
  }

  function loadProgress() {
    try { return localStorage.getItem(progressKey) || null; } catch (_) { return null; }
  }

  // ── theme / font / flow ──
  // FIX: Combine all style applications into ONE function to prevent
  // rendition.themes.default() from overwriting previous styles.
  // Each call to .default() replaces all previous styles, so we must
  // apply theme colors + formatting + font size in a single operation.
  function applyAllStyles() {
    if (!window.InkpadTheme) return;
    
    // Update body theme class
    const currentTheme = window.InkpadTheme.getCurrent();
    const epThemeMap = {
      'inkpad': 'ep-light',
      'dark': 'ep-dark',
      'sepia': 'ep-sepia',
      'forest': 'ep-dark'
    };
    
    const epThemes = ['ep-dark', 'ep-sepia', 'ep-light'];
    epThemes.forEach((t) => document.body.classList.remove(t));
    
    const epTheme = epThemeMap[currentTheme] || 'ep-light';
    document.body.classList.add(epTheme);

    // Apply all styles to rendition
    if (!rendition) return;
    
    const bgColors  = { 'ep-dark': '#1b1a17', 'ep-sepia': '#f5f0e8', 'ep-light': '#ffffff' };
    const txtColors = { 'ep-dark': '#f4f1ea',  'ep-sepia': '#3d2b1f',  'ep-light': '#1a1a1a' };
    
    try {
      // IMPORTANT: Apply ALL styles in ONE call to prevent overwrites
      rendition.themes.default({
        'body': {
          'background': bgColors[epTheme] + ' !important',
          'color': txtColors[epTheme] + ' !important',
        },
        'p, div, span, li': {
          'line-height': prefs.lineHeight + ' !important',
          'text-align': prefs.textAlign + ' !important',
        },
        'p': {
          'margin-bottom': prefs.paraSpacing + 'em !important',
          'text-indent': prefs.paraIndent + 'em !important',
        }
      });
      
      // Font size uses separate API
      rendition.themes.fontSize(FONT_SIZES[prefs.fontIdx] + 'px');
    } catch (e) {
      console.warn('[EPUB Reader] Gagal apply styles:', e);
    }
  }

  function updateFormatUI() {
    // Update line height buttons
    formatPanel.querySelectorAll('[data-line-height]').forEach((btn) => {
      btn.classList.toggle('active', parseFloat(btn.dataset.lineHeight) === prefs.lineHeight);
    });
    // Update paragraph spacing buttons
    formatPanel.querySelectorAll('[data-para-spacing]').forEach((btn) => {
      btn.classList.toggle('active', parseFloat(btn.dataset.paraSpacing) === prefs.paraSpacing);
    });
    // Update text alignment buttons
    formatPanel.querySelectorAll('[data-text-align]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.textAlign === prefs.textAlign);
    });
    // Update paragraph indent buttons
    formatPanel.querySelectorAll('[data-para-indent]').forEach((btn) => {
      btn.classList.toggle('active', parseFloat(btn.dataset.paraIndent) === prefs.paraIndent);
    });
  }

  function updateThemeBtn() {
    if (!window.InkpadTheme || !themeBtn) return;
    
    const currentTheme = window.InkpadTheme.getCurrent();
    const themes = window.InkpadTheme.getThemes();
    const currentIdx = themes.findIndex(t => t.id === currentTheme);
    const nextIdx = (currentIdx + 1) % themes.length;
    const nextTheme = themes[nextIdx];
    
    // Update button icon to show what theme will be NEXT
    const icon = themeBtn.querySelector('i');
    if (icon) {
      icon.className = nextTheme.icon;
    }
    
    themeBtn.title = `Ganti tema ke ${nextTheme.label}`;
  }
  function updateFlowBtn()  {
    flowBtn.textContent = prefs.flowIdx === 0 ? '⇄' : '↕';
    flowBtn.title = prefs.flowIdx === 0
      ? 'Mode: Halaman — klik ganti ke Scroll'
      : 'Mode: Scroll — klik ganti ke Halaman';
  }

  function savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (_) {}
  }
}
