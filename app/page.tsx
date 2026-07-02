"use client";

import { useEffect, useRef } from "react";

export default function HubPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Set body attributes that nav.js and pageInit.js expect
    document.body.dataset.layout = "hub";
    document.body.dataset.page = "hub";
    document.body.dataset.title = "Inkpad";

    // Load CSS files
    const cssFiles = [
      '/css/base.css',
      '/css/layout.css',
      '/css/components.css'
    ];
    cssFiles.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    // Load scripts in order — Supabase CDN first
    const scriptUrls = [
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
      "/js/core/supabase-client.js",
      "/js/core/auth-guard.js",
      "/js/core/project-context.js",
      "/js/core/offline-queue.js",
      "/js/core/pwa-register.js",
      "/js/core/nav.js",
      "/js/core/pageInit.js",
      "/js/core/storage.js",
      "/js/modules/projects.js",
      "/js/modules/hub.js",
    ];

    let idx = 0;
    function loadNext() {
      if (idx >= scriptUrls.length) return;
      const script = document.createElement("script");
      script.src = scriptUrls[idx];
      script.async = false;
      script.onload = () => {
        idx++;
        loadNext();
      };
      script.onerror = () => {
        idx++;
        loadNext();
      };
      document.body.appendChild(script);
    }
    loadNext();
  }, []);

  return (
    <>
      <main id="page-main">
        <div className="hub-shell">
          <div className="hub-toolbar">
            <label htmlFor="hub-sort">Urutkan</label>
            <select id="hub-sort" className="hub-sort-select">
              <option value="updated_desc">Terbaru diubah</option>
              <option value="title_asc">Judul (A–Z)</option>
              <option value="title_desc">Judul (Z–A)</option>
              <option value="genre_asc">Genre (A–Z)</option>
              <option value="genre_desc">Genre (Z–A)</option>
              <option value="status_asc">Status</option>
              <option value="created_desc">Terbaru dibuat</option>
              <option value="created_asc">Terlama dibuat</option>
            </select>
          </div>
          <div className="hub-grid" id="project-grid"></div>
        </div>
      </main>

      {/* Create/Edit modal */}
      <div className="modal-overlay" id="create-modal">
        <div className="modal-card">
          <h2 id="project-modal-title">Novel baru</h2>
          <form id="create-form">
            <div className="cover-upload-row">
              <label className="cover-preview" id="cover-preview" htmlFor="project-cover">
                <i className="ti ti-photo-plus" aria-hidden="true"></i>
                <span>Cover (opsional)</span>
              </label>
              <input type="file" id="project-cover" accept="image/*" hidden />
            </div>
            <div className="field">
              <label htmlFor="project-title">Judul</label>
              <input type="text" id="project-title" required />
            </div>
            <div className="field">
              <label htmlFor="project-genre">Genre (opsional)</label>
              <input type="text" id="project-genre" placeholder="Fantasi, Romance, dst" />
            </div>
            <div className="field">
              <label htmlFor="project-status">Status</label>
              <select id="project-status">
                <option value="ongoing">Ongoing</option>
                <option value="hiatus">Hiatus</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
            <p className="error" id="create-error" style={{ display: "none", color: "var(--danger)", fontSize: 13 }}></p>
            <div className="modal-actions">
              <button type="button" className="ghost" id="modal-close">
                Batal
              </button>
              <button type="submit" className="primary" id="project-submit-btn">
                Buat
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Cover edit modal */}
      <div className="modal-overlay" id="cover-modal">
        <div className="modal-card">
          <h2 id="cover-modal-title">Ubah cover</h2>
          <p className="cover-modal-hint" id="cover-modal-hint">
            Pilih gambar baru untuk cover novel.
          </p>
          <div className="cover-upload-row">
            <label className="cover-preview" id="edit-cover-preview" htmlFor="edit-cover-input">
              <i className="ti ti-photo-plus" aria-hidden="true"></i>
              <span>Pilih gambar</span>
            </label>
            <input type="file" id="edit-cover-input" accept="image/*" hidden />
          </div>
          <button type="button" className="cover-remove-btn" id="cover-remove-btn" disabled>
            Hapus cover
          </button>
          <p className="error" id="cover-error" style={{ display: "none", color: "var(--danger)", fontSize: 13, marginTop: 12 }}></p>
          <div className="modal-actions">
            <button type="button" className="ghost" id="cover-modal-close">
              Batal
            </button>
            <button type="button" className="primary" id="cover-save-btn" disabled>
              Simpan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}