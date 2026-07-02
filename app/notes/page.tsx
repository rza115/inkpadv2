"use client";

import { useEffect, useRef } from "react";

export default function NotesPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Set body attributes that nav.js and pageInit.js expect
    document.body.dataset.layout = "project";
    document.body.dataset.page = "notes";
    document.body.dataset.title = "Memuat…";

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
      "/js/modules/projects.js",
      "/js/modules/chapters.js",
      "/js/modules/characters.js",
      "/js/modules/worldbuilding.js",
      "/js/modules/notes.js",
      "/js/modules/notes-page.js",
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
        <div className="notes-shell">
          <div className="notes-toolbar">
            <button className="ghost" id="new-note-btn"><i className="ti ti-plus" aria-hidden="true"></i> Catatan baru</button>
          </div>
          <div className="notes-list" id="notes-list"></div>
        </div>
      </main>

      <div className="modal-overlay" id="note-modal">
        <div className="modal-card">
          <h2 id="note-modal-title">Catatan baru</h2>
          <form id="note-form">
            <div className="field">
              <label htmlFor="note-content">Isi catatan</label>
              <textarea id="note-content" rows={5} required placeholder="Tulis ide, reminders, atau apapun…"></textarea>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Assign ke (opsional, pilih salah satu)</p>
            <div className="assign-row">
              <div className="field">
                <label htmlFor="note-chapter">Bab</label>
                <select id="note-chapter"><option value="">—</option></select>
              </div>
              <div className="field">
                <label htmlFor="note-character">Karakter</label>
                <select id="note-character"><option value="">—</option></select>
              </div>
            </div>
            <div className="field" style={{ marginTop: '8px' }}>
              <label htmlFor="note-world">World entry</label>
              <select id="note-world"><option value="">—</option></select>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--danger)', display: 'none' }} id="note-error"></p>
            <div className="modal-actions">
              <button type="button" className="ghost" id="note-delete-btn" style={{ display: 'none' }}>Hapus</button>
              <button type="button" className="ghost" id="note-close">Batal</button>
              <button type="submit" className="primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
