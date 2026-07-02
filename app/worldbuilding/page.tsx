"use client";

import { useEffect, useRef } from "react";

export default function WorldbuildingPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Set body attributes that nav.js and pageInit.js expect
    document.body.dataset.layout = "project";
    document.body.dataset.page = "world";
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
      "/js/core/project-context.js",
      "/js/core/offline-queue.js",
      "/js/core/pwa-register.js",
      "/js/core/nav.js",
      "/js/core/pageInit.js",
      "/js/utils/cross-link.js",
      "/js/modules/projects.js",
      "/js/modules/characters.js",
      "/js/modules/worldbuilding.js",
      "/js/modules/worldbuilding-page.js",
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
        <div className="world-toolbar">
          <button className="ghost" id="new-entry-btn"><i className="ti ti-plus" aria-hidden="true"></i> Entry baru</button>
        </div>
        <div className="world-groups" id="world-groups"></div>
      </main>

      <div className="modal-overlay" id="entry-modal">
        <div className="modal-card">
          <h2 id="modal-title">Entry baru</h2>
          <form id="entry-form">
            <div className="field">
              <label htmlFor="entry-title">Judul</label>
              <input type="text" id="entry-title" required />
            </div>
            <div className="field">
              <label htmlFor="entry-category">Kategori</label>
              <input type="text" id="entry-category" list="category-suggestions" placeholder="Lokasi, Sistem Power, Sejarah, dst" />
              <datalist id="category-suggestions"></datalist>
            </div>
            <div className="field">
              <label htmlFor="entry-content">Isi</label>
              <textarea id="entry-content" rows={7} placeholder="Tulis detail di sini. Pakai [[Nama]] buat nyambungin ke karakter atau entry lain."></textarea>
              <p className="field-hint">Contoh: &quot;Dijaga oleh [[Kapten Reza]] sejak Perang [[Aelmoor]].&quot;</p>
            </div>
            <div className="field">
              <label>Preview cross-link</label>
              <div className="xlink-preview" id="xlink-preview"></div>
            </div>
            <p className="error" id="entry-error" style={{ display: 'none', color: 'var(--danger)', fontSize: '13px' }}></p>
            <div className="modal-actions">
              <button type="button" className="ghost" id="entry-delete-btn" style={{ display: 'none' }}>Hapus</button>
              <button type="button" className="ghost" id="modal-close">Batal</button>
              <button type="submit" className="primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
