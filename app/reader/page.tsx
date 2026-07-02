"use client";

import { useEffect, useRef } from "react";

export default function ReaderPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Set body attributes that nav.js and pageInit.js expect
    document.body.dataset.page = "reader";

    // Load CSS files
    const cssFiles = [
      '/css/base.css',
      '/css/layout.css',
      '/css/components.css',
      '/css/reader.css'
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
      "/js/core/pwa-register.js",
      "/js/core/pageInit.js",
      "/js/utils/markdown-render.js",
      "/js/modules/projects.js",
      "/js/modules/chapters.js",
      "/js/modules/characters.js",
      "/js/modules/worldbuilding.js",
      "/js/modules/illustrations.js",
      "/js/modules/theme.js",
      "/js/modules/reader.js",
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
      <header className="r-topbar">
        <button className="r-topbar-btn" id="back-btn"><i className="ti ti-arrow-left" aria-hidden="true"></i> Editor</button>
        <button className="r-topbar-btn" id="toc-btn"><i className="ti ti-layout-sidebar" aria-hidden="true"></i> <span className="toc-label">Daftar Isi</span></button>
        <span className="r-topbar-title" id="topbar-title"></span>
        <div className="r-controls">
          <select className="r-font-select" id="font-family-select" title="Pilih font">
            <option value="literata">Literata</option>
            <option value="lora">Lora</option>
            <option value="inter">Inter</option>
            <option value="nunito">Nunito Sans</option>
          </select>
          <button className="r-ctrl-btn" id="font-sm" title="Kecilkan font">A<sup>-</sup></button>
          <button className="r-ctrl-btn" id="font-lg" title="Besarkan font">A<sup>+</sup></button>
          <div className="r-align-group" role="group" aria-label="Perataan teks">
            <button className="r-ctrl-btn" id="align-left" data-text-align="left" title="Rata kiri"><i className="ti ti-align-left" aria-hidden="true"></i></button>
            <button className="r-ctrl-btn" id="align-right" data-text-align="right" title="Rata kanan"><i className="ti ti-align-right" aria-hidden="true"></i></button>
            <button className="r-ctrl-btn" id="align-justify" data-text-align="justify" title="Rata kanan-kiri"><i className="ti ti-align-justified" aria-hidden="true"></i></button>
          </div>
          <button className="r-ctrl-btn r-theme-btn" id="width-btn" title="Lebar kolom">⇔</button>
          <button className="r-ctrl-btn r-theme-btn" id="theme-btn" title="Ganti tema"><i className="ti ti-sun" aria-hidden="true"></i></button>
        </div>
      </header>

      <div className="r-body">
        <aside className="r-toc" id="r-toc">
          <div className="r-cover-box">
            <div className="r-cover-img" id="r-cover"></div>
            <p className="r-project-title" id="r-project-title">Memuat…</p>
          </div>
          <nav className="r-toc-list" id="r-toc-list"></nav>
        </aside>

        <main className="r-pane" id="r-pane">
          <div className="r-column" id="r-column">
            <p className="r-loading">Memuat novel…</p>
          </div>
        </main>
      </div>
    </>
  );
}
