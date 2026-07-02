"use client";

import { useEffect, useRef } from "react";

export default function CharactersPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Set body attributes that nav.js and pageInit.js expect
    document.body.dataset.layout = "project";
    document.body.dataset.page = "characters";
    document.body.dataset.title = "Memuat…";

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

    // Load scripts in order
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
      "/js/modules/characters.js",
      "/js/modules/characters-page.js",
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
        <div className="char-grid" id="character-grid"></div>
      </main>

      <div className="modal-overlay" id="character-modal">
        <div className="modal-card">
          <h2 id="modal-title">Karakter baru</h2>
          <form id="character-form">
            <div className="photo-upload-row">
              <label className="photo-preview" id="photo-preview" htmlFor="character-photo">
                <i className="ti ti-camera-plus" aria-hidden="true"></i>
              </label>
              <input type="file" id="character-photo" accept="image/*" hidden />
            </div>
            <div className="field">
              <label htmlFor="character-name">Nama</label>
              <input type="text" id="character-name" required />
            </div>
            <div className="field">
              <label htmlFor="character-aliases">Alias (opsional)</label>
              <input type="text" id="character-aliases" placeholder="Nama panggilan, julukan, dst" />
            </div>
            <div className="field">
              <label htmlFor="character-role">Peran</label>
              <select id="character-role">
                <option value="">— Pilih —</option>
                <option value="mc">Protagonis</option>
                <option value="supporting">Pendukung</option>
                <option value="antagonist">Antagonis</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="character-description">Deskripsi</label>
              <textarea id="character-description" rows={4} placeholder="Fisik, kepribadian, latar belakang..."></textarea>
            </div>
            <p className="error" id="character-error" style={{ display: 'none', color: 'var(--danger)', fontSize: '13px' }}></p>
            <div className="modal-actions">
              <button type="button" className="ghost" id="character-delete-btn" style={{ display: 'none' }}>Hapus</button>
              <button type="button" className="ghost" id="modal-close">Batal</button>
              <button type="submit" className="primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
