"use client";

import { useEffect, useRef } from "react";

export default function EpubReaderPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Set body class
    document.body.className = "epub-reader-body ep-dark";

    // Add inline styles to head
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      
      .ep-pane { position: relative; }
      
      .ep-loading {
        position: absolute;
        inset: 0;
        z-index: 10;
        background: var(--ep-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 12px;
        font-size: 14px;
        color: var(--ep-muted);
        transition: opacity 0.2s;
      }
      .ep-loading.hidden {
        opacity: 0;
        pointer-events: none;
      }
      
      #ep-viewer-wrap {
        position: absolute;
        inset: 0;
        bottom: 3px;
        overflow: hidden;
      }
      #ep-viewer-wrap iframe {
        border: none;
        width: 100%;
        height: 100%;
        display: block;
      }
      
      .ep-progressbar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
      }
      
      .ep-tap-zone {
        z-index: 5;
      }
    `;
    document.head.appendChild(styleEl);

    // Load CSS files
    const cssFiles = [
      '/css/base.css',
      '/css/layout.css',
      '/css/components.css',
      '/css/epub-reader.css'
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
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
      "https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js",
      "/js/core/supabase-client.js",
      "/js/core/auth-guard.js",
      "/js/core/project-context.js",
      "/js/core/pwa-register.js",
      "/js/modules/theme.js",
      "/js/modules/epub-books.js",
      "/js/modules/epub-reader-page.js",
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

    return () => {
      // Cleanup: remove the style element when component unmounts
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, []);

  return (
    <>
      <header className="ep-topbar">
        <button className="ep-topbar-btn" id="back-btn"><i className="ti ti-arrow-left" aria-hidden="true"></i> Library</button>
        <button className="ep-topbar-btn" id="toc-btn"><i className="ti ti-layout-sidebar" aria-hidden="true"></i></button>
        <span className="ep-title" id="ep-title">Memuat…</span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button className="ep-ctrl-btn" id="font-sm" title="Font kecil">A<sup>-</sup></button>
          <button className="ep-ctrl-btn" id="font-lg" title="Font besar">A<sup>+</sup></button>
          <button className="ep-ctrl-btn wide" id="flow-btn" title="Ganti mode scroll/halaman">⇄</button>
          <button className="ep-ctrl-btn wide" id="theme-btn" title="Ganti tema"><i className="ti ti-sun" aria-hidden="true"></i></button>
          <button className="ep-ctrl-btn wide" id="format-btn" title="Pengaturan format"><i className="ti ti-settings" aria-hidden="true"></i></button>
        </div>
      </header>

      <div className="ep-body">
        <aside className="ep-toc" id="ep-toc">
          <div className="ep-toc-header"><p>Daftar Isi</p></div>
          <nav className="ep-toc-list" id="ep-toc-list"></nav>
        </aside>

        <aside className="ep-format-panel collapsed" id="ep-format-panel">
          <div className="ep-format-header">
            <p>Pengaturan Format</p>
          </div>
          <div className="ep-format-body">
            {/* Line Height */}
            <div className="ep-format-group">
              <label className="ep-format-label">Tinggi Baris</label>
              <div className="ep-format-controls">
                <button className="ep-format-btn" data-line-height="1.4">Padat</button>
                <button className="ep-format-btn active" data-line-height="1.6">Normal</button>
                <button className="ep-format-btn" data-line-height="1.8">Lapang</button>
                <button className="ep-format-btn" data-line-height="2.0">Luas</button>
              </div>
            </div>

            {/* Paragraph Spacing */}
            <div className="ep-format-group">
              <label className="ep-format-label">Spasi Paragraf</label>
              <div className="ep-format-controls">
                <button className="ep-format-btn" data-para-spacing="0.5">Kecil</button>
                <button className="ep-format-btn active" data-para-spacing="1.0">Normal</button>
                <button className="ep-format-btn" data-para-spacing="1.5">Besar</button>
              </div>
            </div>

            {/* Text Alignment */}
            <div className="ep-format-group">
              <label className="ep-format-label">Perataan Teks</label>
              <div className="ep-format-controls">
                <button className="ep-format-btn icon" data-text-align="left" title="Rata kiri">
                  <i className="ti ti-align-left" aria-hidden="true"></i>
                </button>
                <button className="ep-format-btn icon" data-text-align="center" title="Rata tengah">
                  <i className="ti ti-align-center" aria-hidden="true"></i>
                </button>
                <button className="ep-format-btn icon" data-text-align="right" title="Rata kanan">
                  <i className="ti ti-align-right" aria-hidden="true"></i>
                </button>
                <button className="ep-format-btn icon active" data-text-align="justify" title="Rata kanan-kiri">
                  <i className="ti ti-align-justified" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            {/* Paragraph Indent */}
            <div className="ep-format-group">
              <label className="ep-format-label">Indentasi Paragraf</label>
              <div className="ep-format-controls">
                <button className="ep-format-btn" data-para-indent="0">Tidak Ada</button>
                <button className="ep-format-btn active" data-para-indent="1.5">Kecil</button>
                <button className="ep-format-btn" data-para-indent="3.0">Sedang</button>
              </div>
            </div>

            {/* Reset Button */}
            <div className="ep-format-group">
              <button className="ep-format-reset-btn" id="format-reset-btn">
                <i className="ti ti-refresh" aria-hidden="true"></i> Reset ke Default
              </button>
            </div>
          </div>
        </aside>

        <div className="ep-pane" id="ep-pane">
          {/* Viewer HARUS ada dan visible dari awal — epub.js butuh dimensi nyata */}
          <div id="ep-viewer-wrap"></div>

          {/* Loading overlay di ATAS viewer, bukan gantiin viewer */}
          <div className="ep-loading" id="ep-loading">
            <i className="ti ti-loader" style={{ fontSize: '28px', animation: 'spin 1s linear infinite' }} aria-hidden="true"></i>
            <span id="ep-loading-msg">Mengunduh buku…</span>
          </div>

          <div className="ep-tap-zone ep-tap-prev" id="tap-prev"><i className="ti ti-chevron-left" aria-hidden="true"></i></div>
          <div className="ep-tap-zone ep-tap-next" id="tap-next"><i className="ti ti-chevron-right" aria-hidden="true"></i></div>
          <div className="ep-progressbar"><div className="ep-progressbar-fill" id="ep-progress-fill"></div></div>
        </div>
      </div>
    </>
  );
}
