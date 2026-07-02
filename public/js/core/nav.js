// js/core/nav.js
// Inject shell (topbar + sidebar) ke tiap halaman, berdasarkan body[data-layout] & body[data-page].
//
// Pattern HTML yang dibutuhkan:
// <body data-layout="hub|project" data-page="hub|manuscript|characters|world|plot|notes" data-title="Judul awal">
//   <main id="page-main">...konten halaman...</main>
//   ...scripts (urutan: supabase-client, auth-guard, project-context, nav, pageInit, modules)...
// </body>
//
// layout "hub"     → cuma topbar (dipakai di Project Hub, lintas-project)
// layout "project" → topbar + sidebar ikon (dipakai di halaman dalam satu project)
//
// Setelah load, panggil window.InkpadNav.setTitle(text) buat update judul topbar
// (misal setelah fetch data project dari Supabase).

(function () {
  const SIDEBAR_ITEMS = [
    { key: 'manuscript', icon: 'ti-file-text', label: 'Manuscript', href: '/manuscript' },
    { key: 'characters', icon: 'ti-users', label: 'Karakter', href: '/characters' },
    { key: 'world', icon: 'ti-world', label: 'Worldbuilding', href: '/worldbuilding' },
    { key: 'plot', icon: 'ti-list-details', label: 'Plot & foreshadow', href: '/plot' },
    { key: 'notes', icon: 'ti-notes', label: 'Quick notes', href: '/notes' },
    { key: 'epub-library', icon: 'ti-books', label: 'Perpustakaan EPUB', href: '/epub-library' },
  ];

  function buildSidebar(activePage) {
    const projectId = window.InkpadProject ? window.InkpadProject.getActiveProjectId() : null;

    const items = SIDEBAR_ITEMS.map((item) => {
      if (!item.href) {
        return `<span class="nav-icon disabled" title="${item.label} — segera hadir"><i class="ti ${item.icon}" aria-hidden="true"></i></span>`;
      }
      const isActive = item.key === activePage;
      const href = projectId ? `${item.href}?project=${projectId}` : item.href;
      return `<a class="nav-icon${isActive ? ' active' : ''}" href="${href}" title="${item.label}"><i class="ti ${item.icon}" aria-hidden="true"></i></a>`;
    }).join('');

    return `
      <nav class="sidebar">
        <a class="nav-icon" href="/" title="Project Hub"><i class="ti ti-home" aria-hidden="true"></i></a>
        ${items}
      </nav>`;
  }

  function buildTopbar(title) {
    return `
      <header class="topbar">
        <h1>${title}</h1>
        <div class="topbar-right">
          <span id="sync-status" class="sync-status"></span>
          <span id="user-email"></span>
          <button class="ghost" id="signout-btn">Keluar</button>
        </div>
      </header>`;
  }

  function setTitle(text) {
    const titleEl = document.querySelector('.topbar h1');
    if (titleEl) titleEl.textContent = text;
  }

  function init() {
    const body = document.body;
    const layout = body.dataset.layout || 'hub';
    const activePage = body.dataset.page || '';
    const title = body.dataset.title || 'Inkpad';
    const pageMain = document.getElementById('page-main');

    const shell = document.createElement('div');
    shell.className = `app-shell layout-${layout}`;

    if (layout === 'project') {
      shell.insertAdjacentHTML('beforeend', buildSidebar(activePage));
    }

    const contentArea = document.createElement('div');
    contentArea.className = 'content-area';
    contentArea.insertAdjacentHTML('beforeend', buildTopbar(title));
    if (pageMain) contentArea.appendChild(pageMain);

    shell.appendChild(contentArea);
    body.prepend(shell);

    document.getElementById('signout-btn').addEventListener('click', signOut);

    document.addEventListener('auth-ready', (e) => {
      const emailEl = document.getElementById('user-email');
      if (emailEl && e.detail.user) emailEl.textContent = e.detail.user.email;
    });

    updateSyncStatus();
    window.addEventListener('online', updateSyncStatus);
    window.addEventListener('offline', updateSyncStatus);
    document.addEventListener('offline-queue-flushed', updateSyncStatus);
  }

  function updateSyncStatus() {
    const el = document.getElementById('sync-status');
    if (!el) return;

    if (!navigator.onLine) {
      el.textContent = 'Offline';
      el.classList.add('offline');
      el.style.display = 'inline-flex';
      return;
    }

    if (window.OfflineQueue) {
      window.OfflineQueue.count().then((c) => {
        if (c > 0) {
          el.textContent = `Sync ${c}…`;
          el.classList.remove('offline');
          el.style.display = 'inline-flex';
        } else {
          el.style.display = 'none';
        }
      });
    } else {
      el.style.display = 'none';
    }
  }

  init();

  window.InkpadNav = { setTitle };
})();
