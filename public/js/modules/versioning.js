// js/modules/versioning.js
// Revision History / Versioning — panel untuk menyimpan, melihat,
// dan mengembalikan snapshot chapter.

const VERSIONING_STORAGE_KEY = 'inkpad:versioning:lastOpen';

// ── State ──
let currentChapterId = null;
let versions = [];
let isOpen = false;

// ── Init ──
function initVersioning() {
  const panel = document.getElementById('versioning-panel');
  if (!panel) return;

  // Close button
  const closeBtn = document.getElementById('versioning-close');
  closeBtn?.addEventListener('click', closeVersioning);

  // Save version button
  const saveBtn = document.getElementById('versioning-save');
  saveBtn?.addEventListener('click', () => {
    const labelInput = document.getElementById('versioning-label-input');
    const label = labelInput?.value.trim() || '';
    saveCurrentVersion(label);
    if (labelInput) labelInput.value = '';
  });

  // Save with label on Enter
  const labelInput = document.getElementById('versioning-label-input');
  labelInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBtn?.click();
    }
  });

  // Click outside to close
  panel.addEventListener('click', (e) => {
    if (e.target === panel) closeVersioning();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeVersioning();
  });
}

function openVersioning(chapterId) {
  currentChapterId = chapterId;
  isOpen = true;

  const panel = document.getElementById('versioning-panel');
  const overlay = document.getElementById('versioning-overlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('open');

  document.body.style.overflow = 'hidden';
  loadVersions(chapterId);
}

function closeVersioning() {
  isOpen = false;
  const panel = document.getElementById('versioning-panel');
  const overlay = document.getElementById('versioning-overlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');

  document.body.style.overflow = '';
  currentChapterId = null;
}

async function loadVersions(chapterId) {
  const list = document.getElementById('versioning-list');
  if (!list) return;

  list.innerHTML = '<div class="versioning-loading">Memuat riwayat versi…</div>';

  try {
    versions = await ChaptersAPI.listVersions(chapterId);
    renderVersions();
  } catch (err) {
    console.error('Gagal memuat versi:', err);
    list.innerHTML = `<div class="versioning-error">Gagal memuat: ${escapeVersioningHtml(err.message)}</div>`;
  }
}

function renderVersions() {
  const list = document.getElementById('versioning-list');
  if (!list) return;

  if (!versions || versions.length === 0) {
    list.innerHTML = `
      <div class="versioning-empty">
        <i class="ti ti-history" aria-hidden="true" style="font-size:32px; opacity:0.3;"></i>
        <p>Belum ada versi tersimpan.</p>
        <p style="font-size:12px; color:var(--text-muted);">Simpan versi sebelum melakukan revisi besar agar bisa kembali.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = versions.map((v) => `
    <div class="versioning-item" data-id="${v.id}">
      <div class="versioning-item-header">
        <span class="versioning-number">v${v.version_number}</span>
        <span class="versioning-date">${formatVersionDate(v.created_at)}</span>
      </div>
      <div class="versioning-item-body">
        <span class="versioning-item-title">${escapeVersioningHtml(v.title)}</span>
        ${v.label ? `<span class="versioning-label">${escapeVersioningHtml(v.label)}</span>` : ''}
        <span class="versioning-words">${(v.word_count || 0).toLocaleString('id-ID')} kata</span>
      </div>
      <div class="versioning-item-actions">
        <button class="versioning-btn versioning-btn-preview" data-action="preview" title="Lihat konten versi ini">
          <i class="ti ti-eye" aria-hidden="true"></i> Lihat
        </button>
        <button class="versioning-btn versioning-btn-restore" data-action="restore" title="Kembalikan ke versi ini">
          <i class="ti ti-history" aria-hidden="true"></i> Restore
        </button>
        <button class="versioning-btn versioning-btn-delete" data-action="delete" title="Hapus versi ini">
          <i class="ti ti-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `).join('');

  // Wire actions
  list.querySelectorAll('.versioning-item').forEach((item) => {
    const id = item.dataset.id;
    item.querySelector('[data-action="preview"]')?.addEventListener('click', () => previewVersion(id));
    item.querySelector('[data-action="restore"]')?.addEventListener('click', () => restoreVersion(id));
    item.querySelector('[data-action="delete"]')?.addEventListener('click', () => deleteVersion(id));
  });
}

async function saveCurrentVersion(label) {
  if (!currentChapterId) return;

  const saveBtn = document.getElementById('versioning-save');
  const origText = saveBtn?.innerHTML || '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="ti ti-loader" aria-hidden="true"></i> Menyimpan…';
  }

  try {
    await ChaptersAPI.saveVersion(currentChapterId, label || undefined);
    showVersioningToast('Versi tersimpan!');
    await loadVersions(currentChapterId);
  } catch (err) {
    console.error('Gagal menyimpan versi:', err);
    showVersioningToast('Gagal menyimpan: ' + err.message, true);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = origText;
    }
  }
}

async function previewVersion(versionId) {
  try {
    const version = await ChaptersAPI.getVersion(versionId);
    showVersioningPreview(version);
  } catch (err) {
    console.error('Gagal memuat preview:', err);
    showVersioningToast('Gagal memuat preview', true);
  }
}

function showVersioningPreview(version) {
  // Hapus preview lama jika ada
  const existing = document.getElementById('versioning-preview-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'versioning-preview-modal';
  modal.className = 'versioning-preview-modal';
  modal.innerHTML = `
    <div class="versioning-preview-backdrop"></div>
    <div class="versioning-preview-content">
      <div class="versioning-preview-header">
        <h3>v${version.version_number}: ${escapeVersioningHtml(version.title)}</h3>
        <span class="versioning-preview-meta">
          ${formatVersionDate(version.created_at)} · ${(version.word_count || 0).toLocaleString('id-ID')} kata
          ${version.label ? ` · <span class="versioning-label">${escapeVersioningHtml(version.label)}</span>` : ''}
        </span>
        <button class="versioning-preview-close" id="preview-close-btn">
          <i class="ti ti-x" aria-hidden="true"></i>
        </button>
      </div>
      <div class="versioning-preview-body">
        <pre class="versioning-preview-text">${escapeVersioningHtml(version.content || '(kosong)')}</pre>
      </div>
      <div class="versioning-preview-footer">
        <button class="versioning-btn versioning-btn-restore" id="preview-restore-btn">
          <i class="ti ti-history" aria-hidden="true"></i> Kembalikan ke versi ini
        </button>
        <button class="versioning-btn" id="preview-close-btn2">Tutup</button>
      </div>
    </div>
  `;

  function cleanupPreview() {
    modal.remove();
    document.removeEventListener('keydown', closePreviewOnEsc);
  }

  // Wire events
  modal.querySelector('.versioning-preview-backdrop')?.addEventListener('click', cleanupPreview);
  modal.querySelector('#preview-close-btn')?.addEventListener('click', cleanupPreview);
  modal.querySelector('#preview-close-btn2')?.addEventListener('click', cleanupPreview);
  modal.querySelector('#preview-restore-btn')?.addEventListener('click', () => {
    cleanupPreview();
    restoreVersion(version.id);
  });
  function closePreviewOnEsc(e) {
    if (e.key === 'Escape') cleanupPreview();
  }
  document.addEventListener('keydown', closePreviewOnEsc);
  document.body.appendChild(modal);
}

async function restoreVersion(versionId) {
  if (!currentChapterId) return;

  if (!confirm('Yakin ingin mengembalikan ke versi ini? Konten saat ini akan diganti.')) return;

  try {
    const data = await ChaptersAPI.restoreVersion(currentChapterId, versionId);
    showVersioningToast('Berhasil dikembalikan ke versi sebelumnya!');

    // Trigger update editor via custom event
    document.dispatchEvent(new CustomEvent('versioning:restored', {
      detail: { chapterId: currentChapterId, title: data.title, content: data.content }
    }));

    closeVersioning();
  } catch (err) {
    console.error('Gagal restore:', err);
    showVersioningToast('Gagal restore: ' + err.message, true);
  }
}

async function deleteVersion(versionId) {
  if (!confirm('Hapus versi ini? Tindakan ini tidak bisa dibatalkan.')) return;

  try {
    await ChaptersAPI.deleteVersion(versionId);
    showVersioningToast('Versi dihapus');
    versions = versions.filter((v) => v.id !== versionId);
    renderVersions();
  } catch (err) {
    console.error('Gagal hapus versi:', err);
    showVersioningToast('Gagal menghapus: ' + err.message, true);
  }
}

// ── Toast notification ──
function showVersioningToast(msg, isError) {
  const existing = document.querySelector('.versioning-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'versioning-toast' + (isError ? ' versioning-toast-error' : '');
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Helpers ──
function formatVersionDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (_) {
    return dateStr;
  }
}

function escapeVersioningHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── Expose globally ──
window.InkpadVersioning = {
  init: initVersioning,
  open: openVersioning,
  close: closeVersioning,
};