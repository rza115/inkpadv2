// js/modules/reader.js
// Reader Mode — UI chrome jalan segera; konten novel nunggu auth-ready.

const READER_PREF_KEY = 'inkpad:reader-prefs';
const READER_FONT_STEPS = ['r-fs-sm', 'r-fs-md', 'r-fs-lg', 'r-fs-xl'];
const READER_FONT_FAMILIES = ['literata', 'lora', 'inter', 'nunito'];
const READER_TEXT_ALIGNS = ['left', 'right', 'justify'];
const READER_WIDTH_STEPS = ['narrow', '', 'wide'];

let readerPrefs = { fontIdx: 1, fontFamily: 'literata', textAlign: 'left', widthIdx: 1 };
try {
  Object.assign(readerPrefs, JSON.parse(localStorage.getItem(READER_PREF_KEY) || '{}'));
} catch (_) {}

// ── Reader Position State ──
function getReaderPositionKey(projectId) {
  return `inkpad:reader:lastPosition:${projectId}`;
}

function saveReaderPosition(projectId, chapterIndex, scrollY, chapterTitle) {
  try {
    localStorage.setItem(getReaderPositionKey(projectId), JSON.stringify({
      chapterIndex,
      scrollY,
      chapterTitle,
      timestamp: Date.now()
    }));
  } catch (_) {}
}

function loadReaderPosition(projectId) {
  try {
    const saved = localStorage.getItem(getReaderPositionKey(projectId));
    return saved ? JSON.parse(saved) : null;
  } catch (_) {
    return null;
  }
}

// Init theme global dulu agar tema tersimpan terbaca
if (window.InkpadTheme) {
  window.InkpadTheme.init();
}

normalizeReaderPrefs();
wireReaderChrome();

pageInit.register('reader', () => {
  initReader().catch(showReaderError);
});

function normalizeReaderPrefs() {
  readerPrefs.fontIdx = clampIndex(readerPrefs.fontIdx, READER_FONT_STEPS.length, 1);
  if (!READER_FONT_FAMILIES.includes(readerPrefs.fontFamily)) {
    readerPrefs.fontFamily = 'literata';
  }
  if (!READER_TEXT_ALIGNS.includes(readerPrefs.textAlign)) {
    readerPrefs.textAlign = 'left';
  }
  readerPrefs.widthIdx = clampIndex(readerPrefs.widthIdx, READER_WIDTH_STEPS.length, 1);
}

function clampIndex(value, len, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, 0), len - 1);
}

function wireReaderChrome() {
  const backBtn = document.getElementById('back-btn');
  const tocBtn = document.getElementById('toc-btn');
  const tocEl = document.getElementById('r-toc');
  const topbar = document.querySelector('.r-topbar');
  const fontFamilySelect = document.getElementById('font-family-select');
  const fontSm = document.getElementById('font-sm');
  const fontLg = document.getElementById('font-lg');
  const widthBtn = document.getElementById('width-btn');
  const themeBtn = document.getElementById('theme-btn');

  function syncReaderTopbarHeight() {
    if (!topbar) return;
    document.documentElement.style.setProperty('--r-topbar-h', `${topbar.offsetHeight}px`);
  }

  syncReaderTopbarHeight();
  window.addEventListener('resize', syncReaderTopbarHeight);
  if (topbar && window.ResizeObserver) {
    new ResizeObserver(syncReaderTopbarHeight).observe(topbar);
  }

  applyReaderPrefs(themeBtn, fontFamilySelect);

  backBtn?.addEventListener('click', () => {
    const projectId = window.InkpadProject?.getActiveProjectId();
    window.location.href = projectId
      ? `/pages/manuscript.html?project=${projectId}`
      : '/index.html';
  });

  function syncTocBackdrop() {
    const open = tocEl && !tocEl.classList.contains('collapsed');
    document.body.classList.toggle('r-toc-open', !!open);
  }

  if (window.innerWidth < 760) {
    tocEl?.classList.add('collapsed');
    syncTocBackdrop();
  }

  tocBtn?.addEventListener('click', () => {
    tocEl?.classList.toggle('collapsed');
    syncTocBackdrop();
  });

  fontFamilySelect?.addEventListener('change', () => {
    readerPrefs.fontFamily = fontFamilySelect.value;
    applyReaderPrefs(themeBtn, fontFamilySelect);
    saveReaderPrefs();
  });

  fontSm?.addEventListener('click', () => {
    readerPrefs.fontIdx = Math.max(0, readerPrefs.fontIdx - 1);
    applyReaderPrefs(themeBtn, fontFamilySelect);
    saveReaderPrefs();
  });

  fontLg?.addEventListener('click', () => {
    readerPrefs.fontIdx = Math.min(READER_FONT_STEPS.length - 1, readerPrefs.fontIdx + 1);
    applyReaderPrefs(themeBtn, fontFamilySelect);
    saveReaderPrefs();
  });

  widthBtn?.addEventListener('click', () => {
    readerPrefs.widthIdx = (readerPrefs.widthIdx + 1) % READER_WIDTH_STEPS.length;
    applyReaderPrefs(themeBtn, fontFamilySelect);
    saveReaderPrefs();
  });

  themeBtn?.addEventListener('click', () => {
    if (window.InkpadTheme) {
      window.InkpadTheme.toggle();
      updateThemeButton(themeBtn);
    }
  });

  document.querySelectorAll('[data-text-align]').forEach((btn) => {
    btn.addEventListener('click', () => {
      readerPrefs.textAlign = btn.dataset.textAlign;
      applyReaderPrefs(themeBtn, fontFamilySelect);
      saveReaderPrefs();
    });
  });
}

function applyReaderPrefs(themeBtn, fontFamilySelect) {
  normalizeReaderPrefs();

  // Update theme button to reflect current global theme
  updateThemeButton(themeBtn);

  const col = document.getElementById('r-column');
  if (col) {
    READER_FONT_STEPS.forEach((f) => col.classList.remove(f));
    col.classList.add(READER_FONT_STEPS[readerPrefs.fontIdx]);
    READER_FONT_FAMILIES.forEach((f) => col.classList.remove(`r-ff-${f}`));
    col.classList.add(`r-ff-${readerPrefs.fontFamily}`);
    READER_TEXT_ALIGNS.forEach((a) => col.classList.remove(`r-al-${a}`));
    col.classList.add(`r-al-${readerPrefs.textAlign}`);
    READER_WIDTH_STEPS.forEach((w) => { if (w) col.classList.remove(w); });
    const widthClass = READER_WIDTH_STEPS[readerPrefs.widthIdx];
    if (widthClass) col.classList.add(widthClass);
  }

  if (fontFamilySelect) fontFamilySelect.value = readerPrefs.fontFamily;

  document.querySelectorAll('[data-text-align]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.textAlign === readerPrefs.textAlign);
  });
}

function updateThemeButton(themeBtn) {
  if (!themeBtn || !window.InkpadTheme) return;
  
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

function saveReaderPrefs() {
  try { localStorage.setItem(READER_PREF_KEY, JSON.stringify(readerPrefs)); } catch (_) {}
}

function showReaderError(err) {
  console.error('Reader init gagal:', err);
  const column = document.getElementById('r-column');
  if (column) {
    column.innerHTML = `<p class="r-loading">Gagal memuat: ${escapeReaderHtml(err?.message || String(err))}</p>`;
  }
}

async function initReader() {
  const projectId = window.InkpadProject.getActiveProjectId();
  const column = document.getElementById('r-column');
  if (!column) return;

  if (!projectId) {
    column.innerHTML = '<p class="r-loading">Nggak ada novel yang dipilih. <a href="/index.html" style="color:var(--accent)">Balik ke Hub</a>.</p>';
    return;
  }

  let chapters = [];
  let characters = [];
  let worldEntries = [];
  let activeIdx = 0;

  const tocList = document.getElementById('r-toc-list');
  const rCover = document.getElementById('r-cover');
  const rProjectTitle = document.getElementById('r-project-title');
  const topbarTitle = document.getElementById('topbar-title');
  const tocEl = document.getElementById('r-toc');

  // Declare scroll tracking variables and function BEFORE they're used
  let scrollTimer = null;
  let scrollHandler = null;

  function setupScrollTracking() {
    const pane = document.getElementById('r-pane');
    if (!pane) return;
    
    // Cleanup existing listener
    if (scrollHandler) {
      pane.removeEventListener('scroll', scrollHandler);
    }
    clearTimeout(scrollTimer);
    
    scrollHandler = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const currentChapter = chapters[activeIdx];
        if (currentChapter) {
          saveReaderPosition(
            projectId,
            activeIdx,
            pane.scrollTop,
            currentChapter.title || 'Tanpa judul'
          );
        }
      }, 500); // Debounce 500ms
    };
    
    pane.addEventListener('scroll', scrollHandler);
  }

  try {
    const [project, chaps, chars, worlds] = await Promise.all([
      ProjectsAPI.getById(projectId),
      ChaptersAPI.listByProject(projectId),
      CharactersAPI.listByProject(projectId),
      WorldAPI.listByProject(projectId),
    ]);

    chapters = chaps;
    characters = chars;
    worldEntries = worlds;

    if (project.cover_url) {
      rCover.style.backgroundImage = `url('${project.cover_url}')`;
    } else {
      rCover.innerHTML = '<i class="ti ti-book-2" aria-hidden="true"></i>';
    }
    rProjectTitle.textContent = project.title;
    document.title = `${project.title} — Inkpad`;

    renderTOC();

    const params = new URLSearchParams(window.location.search);
    const urlChapterId = params.get('chapterId');
    const urlChapterIdx = parseInt(params.get('chapter') || '0', 10);
    
    // Determine initial chapter index from URL
    let initialIdx = 0;
    if (urlChapterId) {
      // New parameter: chapterId (more stable)
      const foundIdx = chapters.findIndex(c => c.id === urlChapterId);
      if (foundIdx !== -1) {
        initialIdx = foundIdx;
      }
    } else if (Number.isFinite(urlChapterIdx)) {
      // Old parameter: chapter index (for backward compatibility)
      initialIdx = Math.min(Math.max(urlChapterIdx, 0), chapters.length - 1);
    }
    
    // Check for saved reading position
    const savedPosition = loadReaderPosition(projectId);
    
    // Use saved position if available and valid, otherwise use URL parameter
    if (savedPosition && savedPosition.chapterIndex >= 0 && savedPosition.chapterIndex < chapters.length) {
      activeIdx = savedPosition.chapterIndex;
      if (chapters.length > 0) {
        await openChapter(activeIdx, savedPosition.scrollY);
      }
    } else {
      activeIdx = initialIdx;
      if (chapters.length > 0) {
        await openChapter(activeIdx);
      }
    }
    
    if (chapters.length === 0) {
      column.innerHTML = '<p class="r-loading">Novel ini belum punya bab.</p>';
    }
    
    // Setup scroll position tracking with debounce
    setupScrollTracking();
  } catch (err) {
    showReaderError(err);
    return;
  }

  function renderTOC() {
    tocList.innerHTML = '';
    chapters.forEach((ch, i) => {
      const item = document.createElement('div');
      item.className = 'r-toc-item' + (i === activeIdx ? ' active' : '');
      item.dataset.idx = i;
      item.innerHTML = `
        ${escapeReaderHtml(ch.title || 'Tanpa judul')}
        <span class="r-toc-wc">${(ch.word_count || 0).toLocaleString('id-ID')} kata</span>
      `;
      item.addEventListener('click', () => {
        activeIdx = i;
        openChapter(i);
        if (window.innerWidth < 760) {
          tocEl.classList.add('collapsed');
          document.body.classList.remove('r-toc-open');
        }
      });
      tocList.appendChild(item);
    });
  }

  function updateTOCActive() {
    tocList.querySelectorAll('.r-toc-item').forEach((el, i) => {
      el.classList.toggle('active', i === activeIdx);
    });
  }

  async function openChapter(idx, restoreScrollY) {
    activeIdx = idx;
    updateTOCActive();
    column.innerHTML = '<p class="r-loading">Memuat bab…</p>';
    
    // Only scroll to top if no restore position
    if (restoreScrollY === undefined) {
      scrollReaderPaneTop();
    }

    const ch = chapters[idx];
    if (!ch) return;
    topbarTitle.textContent = ch.title || 'Tanpa judul';
    updateReaderURL(idx);

    try {
      const illustrations = await IllustrationsAPI.listByChapter(ch.id);
      let html = buildChapterHTML(ch, illustrations, idx);
      
      // Replace placeholder dengan ilustrasi sebenarnya SEBELUM set ke DOM
      if (window._pendingIllustrations && Object.keys(window._pendingIllustrations).length > 0) {
        Object.keys(window._pendingIllustrations).forEach(placeholder => {
          // Replace di string HTML sebelum di-parse browser
          html = html.split(placeholder).join(window._pendingIllustrations[placeholder]);
        });
        window._pendingIllustrations = {};
      }
      
      // Set HTML yang sudah lengkap ke DOM
      column.innerHTML = html;
      
      wireXlinks();
      wireChapterNav();
      
      // Restore scroll position if provided
      if (restoreScrollY !== undefined && restoreScrollY > 0) {
        const pane = document.getElementById('r-pane');
        if (pane) {
          // Use requestAnimationFrame to ensure DOM is fully rendered
          requestAnimationFrame(() => {
            pane.scrollTop = restoreScrollY;
          });
        }
      }
      
    } catch (err) {
      column.innerHTML = `<p class="r-loading">Gagal memuat bab: ${escapeReaderHtml(err.message)}</p>`;
    }
  }

  function buildChapterHTML(ch, illustrations, idx) {
    const resolver = buildResolver();
    let html = `<h1 class="r-chapter-heading">${escapeReaderHtml(ch.title || 'Tanpa judul')}</h1>`;

    // Map ilustrasi berdasarkan index
    const illustrationsMap = new Map();
    illustrations.forEach((il, i) => {
      illustrationsMap.set(i, il);
    });

    // Render konten dengan replace marker ilustrasi
    let content = ch.content || '';
    const markerRegex = /\{\{illus:(\d+)\}\}/g;
    let lastIndex = 0;
    let contentWithIllustrations = '';
    let usedIndices = new Set();

    // Process content dan inject ilustrasi di posisi marker
    let match;
    while ((match = markerRegex.exec(content)) !== null) {
      const illusIndex = parseInt(match[1], 10);
      const illustration = illustrationsMap.get(illusIndex);
      
      // Tambah konten sebelum marker
      contentWithIllustrations += content.substring(lastIndex, match.index);
      
      // Inject ilustrasi jika valid
      if (illustration) {
        contentWithIllustrations += buildInlineIllustration(illustration);
        usedIndices.add(illusIndex);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Tambah sisa konten
    contentWithIllustrations += content.substring(lastIndex);

    // Ilustrasi yang tidak dipakai dengan marker, tampilkan di atas (default)
    const remainingIllustrations = illustrations.filter((_, i) => !usedIndices.has(i));
    if (remainingIllustrations.length > 0) {
      html += '<div class="r-illustrations">';
      remainingIllustrations.forEach((il) => {
        html += buildIllustrationHTML(il);
      });
      html += '</div>';
    }

    html += `<div class="r-content">${MarkdownRender.render(contentWithIllustrations, resolver)}</div>`;
    html += buildChapterNav(idx);
    return html;
  }

  function buildIllustrationHTML(il) {
    let html = '<div class="r-illustration">';
    if (il.video_url) {
      html += `<video src="${il.video_url}" autoplay muted loop playsinline></video>`;
    } else if (il.image_url) {
      html += `<img src="${il.image_url}" alt="${escapeReaderHtml(il.caption || '')}" loading="lazy" />`;
    }
    if (il.caption) html += `<p class="r-caption">${escapeReaderHtml(il.caption)}</p>`;
    html += '</div>';
    return html;
  }

  function buildInlineIllustration(il) {
    // Marker khusus yang akan di-replace setelah markdown render
    // Gunakan format plain text tanpa karakter HTML agar tidak di-escape oleh _esc()
    const uuid = Math.random().toString(36).substring(2, 11);
    const placeholder = `|||ILLUS_${uuid}|||`;
    
    // Store illustration HTML untuk di-inject nanti
    if (!window._pendingIllustrations) window._pendingIllustrations = {};
    window._pendingIllustrations[placeholder] = buildIllustrationHTML(il);
    
    return placeholder;
  }

  function buildChapterNav(idx) {
    const prev = chapters[idx - 1];
    const next = chapters[idx + 1];
    if (!prev && !next) return '';
    let nav = '<div class="r-chapter-nav">';
    if (prev) {
      nav += `<button class="r-nav-btn prev" data-idx="${idx - 1}">← ${escapeReaderHtml(prev.title || 'Bab sebelumnya')}</button>`;
    }
    if (next) {
      nav += `<button class="r-nav-btn next" data-idx="${idx + 1}">${escapeReaderHtml(next.title || 'Bab berikutnya')} →</button>`;
    }
    nav += '</div>';
    return nav;
  }

  function wireChapterNav() {
    column.querySelectorAll('.r-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => openChapter(parseInt(btn.dataset.idx, 10)));
    });
  }

  function wireXlinks() {
    column.querySelectorAll('.r-xlink').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const type = link.dataset.type;
        const id = link.dataset.id;
        if (type === 'character') {
          window.location.href = `/pages/characters.html?project=${projectId}&open=${id}`;
        } else if (type === 'world') {
          window.location.href = `/pages/worldbuilding.html?project=${projectId}&open=${id}`;
        }
      });
    });
  }

  function buildResolver() {
    return (name) => {
      const l = name.toLowerCase();
      const char = characters.find((c) =>
        c.name.toLowerCase() === l ||
        (c.aliases || '').split(/[,，]/).map((a) => a.trim().toLowerCase()).includes(l)
      );
      if (char) return { type: 'character', id: char.id };
      const world = worldEntries.find((w) => w.title.toLowerCase() === l);
      if (world) return { type: 'world', id: world.id };
      return null;
    };
  }

  function updateReaderURL(idx) {
    const url = new URL(window.location.href);
    url.searchParams.set('chapter', idx);
    window.history.replaceState(null, '', url);
  }
}

function scrollReaderPaneTop() {
  const pane = document.getElementById('r-pane');
  if (pane) pane.scrollTop = 0;
}

function escapeReaderHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}