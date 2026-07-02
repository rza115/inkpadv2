"use client";

import { useEffect, useRef } from "react";

export default function PlotPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Set body attributes that nav.js and pageInit.js expect
    document.body.dataset.layout = "project";
    document.body.dataset.page = "plot";
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
      "/js/modules/projects.js",
      "/js/modules/chapters.js",
      "/js/modules/plot.js",
      "/js/modules/plot-page.js",
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
        <div className="plot-shell">
          {/* Arc Tracker */}
          <div className="section-header">
            <h1 className="section-title">Arc</h1>
            <button className="ghost" id="new-arc-btn"><i className="ti ti-plus" aria-hidden="true"></i> Arc baru</button>
          </div>
          <div className="arc-grid" id="arc-grid"></div>

          {/* Foreshadow Log */}
          <div className="section-divider">
            <div className="section-header">
              <h1 className="section-title">Foreshadow Log</h1>
              <button className="ghost" id="new-foreshadow-btn"><i className="ti ti-plus" aria-hidden="true"></i> Tambah</button>
            </div>
            <div className="foreshadow-list" id="foreshadow-list"></div>
          </div>
        </div>
      </main>

      {/* Modal: Arc */}
      <div className="modal-overlay" id="arc-modal">
        <div className="modal-card">
          <h2 id="arc-modal-title">Arc baru</h2>
          <form id="arc-form">
            <div className="field">
              <label htmlFor="arc-title">Judul arc</label>
              <input type="text" id="arc-title" required />
            </div>
            <div className="field">
              <label htmlFor="arc-status">Status</label>
              <select id="arc-status">
                <option value="planning">Planning</option>
                <option value="ongoing">Ongoing</option>
                <option value="complete">Selesai</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="arc-start">Mulai dari bab</label>
              <select id="arc-start"><option value="">— Belum ditentukan —</option></select>
            </div>
            <div className="field">
              <label htmlFor="arc-end">Sampai bab</label>
              <select id="arc-end"><option value="">— Belum ditentukan —</option></select>
            </div>
            <div className="field">
              <label htmlFor="arc-summary">Ringkasan</label>
              <textarea id="arc-summary" rows={3} placeholder="Apa yang terjadi di arc ini…"></textarea>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--danger)', display: 'none' }} id="arc-error"></p>
            <div className="modal-actions">
              <button type="button" className="ghost" id="arc-delete-btn" style={{ display: 'none' }}>Hapus</button>
              <button type="button" className="ghost" id="arc-close">Batal</button>
              <button type="submit" className="primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: Foreshadow */}
      <div className="modal-overlay" id="foreshadow-modal">
        <div className="modal-card">
          <h2 id="foreshadow-modal-title">Foreshadow baru</h2>
          <form id="foreshadow-form">
            <div className="field">
              <label htmlFor="f-note">Apa yang ditanam</label>
              <textarea id="f-note" rows={3} required placeholder="Contoh: Mahkota yang retak di meja Amelia"></textarea>
            </div>
            <div className="field">
              <label htmlFor="f-planted">Ditanam di bab</label>
              <select id="f-planted"><option value="">— Belum dipilih —</option></select>
            </div>
            <div className="field">
              <label htmlFor="f-payoff">Dibayar di bab (opsional)</label>
              <select id="f-payoff"><option value="">— Belum dibayar —</option></select>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--danger)', display: 'none' }} id="foreshadow-error"></p>
            <div className="modal-actions">
              <button type="button" className="ghost" id="foreshadow-delete-btn-modal" style={{ display: 'none' }}>Hapus</button>
              <button type="button" className="ghost" id="foreshadow-close">Batal</button>
              <button type="submit" className="primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
