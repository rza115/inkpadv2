"use client";

import { useEffect, useRef } from "react";

export default function EpubLibraryPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Set body attributes that nav.js and pageInit.js expect
    document.body.dataset.layout = "project";
    document.body.dataset.page = "epub-library";
    document.body.dataset.title = "Perpustakaan";

    // Load scripts in order
    const scriptUrls = [
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
      "/js/core/supabase-client.js",
      "/js/core/auth-guard.js",
      "/js/core/project-context.js",
      "/js/core/offline-queue.js",
      "/js/core/pwa-register.js",
      "/js/core/storage.js",
      "/js/core/nav.js",
      "/js/core/pageInit.js",
      "/js/modules/epub-books.js",
      "/js/modules/epub-library-page.js",
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
        <div className="epub-library-shell">
          <div className="epub-library-toolbar">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 600, margin: 0, flex: 1 }}>EPUB Library</h2>
            <label className="ghost" id="upload-label" htmlFor="epub-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
              <i className="ti ti-upload" aria-hidden="true"></i> Upload EPUB
            </label>
            <input type="file" id="epub-upload" accept=".epub,application/epub+zip" hidden multiple />
          </div>
          <div className="epub-grid" id="epub-grid"></div>
        </div>
      </main>

      {/* Upload overlay */}
      <div className="epub-uploading-overlay" id="uploading-overlay" style={{ display: 'none' }}>
        <span id="uploading-label">Mengupload…</span>
        <div className="epub-progress-bar-track">
          <div className="epub-progress-bar-fill" id="upload-progress"></div>
        </div>
        <span id="uploading-file" style={{ fontSize: '12px', opacity: 0.6 }}></span>
      </div>
    </>
  );
}
