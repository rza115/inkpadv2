"use client";

import { useEffect, useRef } from "react";

export default function ManuscriptPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Set body attributes that nav.js and pageInit.js expect
    document.body.dataset.layout = "project";
    document.body.dataset.page = "manuscript";
    document.body.dataset.title = "Memuat…";

    // Load scripts in order
    const scriptUrls = [
      "/js/core/supabase-client.js",
      "/js/core/auth-guard.js",
      "/js/core/project-context.js",
      "/js/core/offline-queue.js",
      "/js/core/pwa-register.js",
      "/js/core/nav.js",
      "/js/core/pageInit.js",
      "/js/core/storage.js",
      "/js/utils/debounce.js",
      "/js/utils/format.js",
      "/js/utils/markdown-lite.js",
      "/js/utils/cross-link.js",
      "/js/utils/cross-link-suggest.js",
      "/js/modules/projects.js",
      "/js/modules/chapters.js",
      "/js/modules/characters.js",
      "/js/modules/worldbuilding.js",
      "/js/modules/illustrations.js",
      "/js/modules/notes.js",
      "/js/modules/ai-polish.js",
      "/js/modules/theme.js",
      "/js/modules/versioning.js",
      // type="module" scripts — loaded as regular scripts for simplicity
      "/js/modules/global-search.js",
      "/js/modules/random-generator.js",
      "/js/modules/manuscript.js",
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
        <div className="manuscript-shell">
          {/* Chapter panel */}
          <aside className="chapter-panel" id="chapter-panel">
            <div className="chapter-panel-header">
              <p className="chapter-panel-title" id="chapter-count">0 bab</p>
              <button className="chapter-panel-toggle" id="chapter-panel-toggle" title="Sembunyikan navigasi bab" aria-label="Toggle navigasi bab">
                <i className="ti ti-chevron-up" aria-hidden="true"></i>
              </button>
            </div>
            <div className="chapter-list" id="chapter-list"></div>
            <button className="new-chapter-btn" id="new-chapter-btn"><i className="ti ti-plus" aria-hidden="true"></i> Bab baru</button>
          </aside>

          {/* Editor panel */}
          <section className="editor-panel">
            <div className="editor-empty" id="editor-empty">
              <div className="editor-empty-inner">
                <p>Buat bab baru untuk mulai menulis.</p>
                <button className="empty-state-chapter-btn" id="empty-new-chapter-btn">
                  <i className="ti ti-plus" aria-hidden="true"></i> Bab baru
                </button>
              </div>
            </div>

            <div className="editor-active" id="editor-active">
              <div className="editor-header">
                <input type="text" id="chapter-title-input" className="chapter-title-input" placeholder="Judul bab" />
                <div className="editor-meta">
                  <div className="export-wrap">
                    <button className="read-btn" id="export-btn" title="Export"><i className="ti ti-download" aria-hidden="true"></i></button>
                    <div className="export-dropdown" id="export-dropdown">
                      <div className="export-dropdown-item" id="export-chapter-md"><i className="ti ti-file-text" aria-hidden="true"></i> Bab ini (.md)</div>
                      <div className="export-dropdown-divider"></div>
                      <div className="export-dropdown-item" id="export-all-md"><i className="ti ti-files" aria-hidden="true"></i> Semua bab (.md)</div>
                    </div>
                  </div>
                  <button className="read-btn" id="search-btn" title="Cari di semua bab (Ctrl+F)"><i className="ti ti-search" aria-hidden="true"></i></button>
                  <button className="read-btn" id="generator-btn" title="AI Generator Tools"><i className="ti ti-dice" aria-hidden="true"></i></button>
                  <button className="read-btn" id="focus-btn" title="Distraction-free mode (Alt+F)"><i className="ti ti-focus-2" aria-hidden="true"></i></button>
                  <button className="read-btn" id="versioning-btn" title="Riwayat Versi"><i className="ti ti-history" aria-hidden="true"></i></button>
                  <button className="read-btn" id="theme-toggle-btn" title="Ganti tema"><i className="ti ti-sun" aria-hidden="true"></i></button>
                  <button className="read-btn" id="read-btn"><i className="ti ti-book" aria-hidden="true"></i> Baca</button>
                  <span id="save-indicator">Tersimpan</span>
                  <span id="word-count">0 kata</span>
                </div>
              </div>
              <div className="editor-toolbar">
                <button type="button" data-md="bold" title="Bold" data-shortcut="Ctrl+B"><i className="ti ti-bold" aria-hidden="true"></i></button>
                <button type="button" data-md="italic" title="Italic" data-shortcut="Ctrl+I"><i className="ti ti-italic" aria-hidden="true"></i></button>
                <button type="button" data-md="heading" title="Heading" data-shortcut="Ctrl+H"><i className="ti ti-heading" aria-hidden="true"></i></button>
                <button type="button" id="ai-polish-btn" title="AI Polish — rapikan teks (Ctrl+Shift+P)" data-shortcut="Ctrl+Shift+P"><i className="ti ti-sparkles" aria-hidden="true"></i></button>
                <button type="button" id="toggle-headers-btn" title="Sembunyikan navigasi & header"><i className="ti ti-chevron-up" aria-hidden="true"></i></button>
              </div>
              <div className="editor-typography-bar" id="editor-typography-bar">
                <span className="typo-label">Font:</span>
                <select id="editor-font-family">
                  <option value="literata">Literata</option>
                  <option value="lora">Lora</option>
                  <option value="inter">Inter</option>
                  <option value="nunito">Nunito</option>
                  <option value="georgia">Georgia</option>
                  <option value="mono">Mono</option>
                </select>
                <div className="typo-separator"></div>
                <span className="typo-label">Ukuran:</span>
                <select id="editor-font-size">
                  <option value="sm">Kecil</option>
                  <option value="md" selected>Sedang</option>
                  <option value="lg">Besar</option>
                  <option value="xl">XL</option>
                </select>
                <div className="typo-separator"></div>
                <span className="typo-label">Spasi:</span>
                <select id="editor-font-spacing">
                  <option value="tight">Rapat</option>
                  <option value="normal" selected>Normal</option>
                  <option value="relaxed">Lebar</option>
                </select>
                <div className="typo-separator"></div>
                <button className="typo-btn" id="editor-paper-mode" title="Mode kertas bergaris">
                  <i className="ti ti-notebook" aria-hidden="true"></i> Kertas
                </button>
                <button className="typography-bar-toggle" id="typography-bar-toggle" title="Sembunyikan kontrol tipografi" aria-label="Toggle kontrol tipografi">
                  <i className="ti ti-chevron-up" aria-hidden="true"></i>
                </button>
              </div>
              <textarea id="editor-textarea" className="editor-textarea" placeholder="Mulai nulis di sini..." spellCheck="false"></textarea>
            </div>
          </section>

          {/* Context panel */}
          <aside className="context-panel" id="context-panel">
            <div className="context-section">
              <div className="context-section-header">
                <p className="context-section-title">Karakter di bab ini</p>
                <div className="context-add-wrap">
                  <button className="context-add-btn" id="add-character-btn" title="Tambah karakter"><i className="ti ti-plus" aria-hidden="true"></i></button>
                  <div className="context-picker" id="context-picker"></div>
                </div>
              </div>
              <div className="context-character-list" id="context-character-list"></div>
            </div>

            <div className="context-section">
              <div className="context-section-header">
                <p className="context-section-title">World di bab ini</p>
                <div className="context-add-wrap">
                  <button className="context-add-btn" id="add-world-btn" title="Tambah entry world"><i className="ti ti-plus" aria-hidden="true"></i></button>
                  <div className="context-picker" id="context-world-picker"></div>
                </div>
              </div>
              <div className="context-world-list" id="context-world-list"></div>
            </div>

            <div className="context-section">
              <div className="context-section-header">
                <p className="context-section-title">Ilustrasi</p>
                <label className="context-add-btn" htmlFor="illus-upload" title="Upload ilustrasi / video"><i className="ti ti-photo-plus" aria-hidden="true"></i></label>
                <input type="file" id="illus-upload" accept="image/*,video/*" hidden />
              </div>
              <div id="context-illus-list"></div>
              <div className="illus-tip-box">
                <strong>💡 Tip:</strong>
                Ketik <code>{`{{illus:0}}`}</code> di editor untuk menempatkan ilustrasi pertama di antara teks. Ganti 0 dengan 1, 2, dst. untuk ilustrasi lainnya.
              </div>
            </div>

            <div className="context-section">
              <div className="context-section-header">
                <p className="context-section-title">Catatan</p>
                <button className="context-add-btn" id="open-notes-page-btn" title="Lihat semua catatan"><i className="ti ti-external-link" aria-hidden="true"></i></button>
              </div>
              <div id="context-notes-list"></div>
              <div className="quick-note-section">
                <textarea id="quick-note-input" rows={2} placeholder="Tambah catatan cepat…"></textarea>
                <button className="ghost" id="quick-note-add">Tambah</button>
              </div>
            </div>
          </aside>

          {/* Generator Panel */}
          <div className="generator-overlay" id="generator-overlay"></div>
          <aside className="generator-panel" id="generator-panel">
            <div className="generator-header">
              <h2><i className="ti ti-dice" aria-hidden="true"></i> AI Generator</h2>
              <button className="generator-close-btn" id="generator-close" title="Tutup (Esc)"><i className="ti ti-x" aria-hidden="true"></i></button>
            </div>
            <div className="generator-controls">
              <div className="generator-type-row">
                <label>Jenis:</label>
                <select className="generator-type-select" id="generator-type" title="Jenis generator">
                  <option value="character">Nama Karakter</option>
                  <option value="location">Nama Tempat</option>
                  <option value="plot-twist">Plot Twist</option>
                  <option value="dialog">Dialog Prompt</option>
                  <option value="item">Benda / Artefak</option>
                  <option value="conflict">Konflik Cerita</option>
                </select>
              </div>
              <button className="generator-generate-btn" id="generator-btn-generate">
                <i className="ti ti-sparkles" aria-hidden="true"></i> Generate dengan AI
              </button>
              <p className="generator-hint">Menggunakan Gemini API untuk menghasilkan ide cerita kreatif.</p>
            </div>
            <div className="generator-body">
              <div className="generator-loading hidden" id="generator-loading">
                <div className="generator-spinner"></div>
                <p>Sedang menggenerate ide…</p>
              </div>
              <div className="generator-error hidden" id="generator-error">
                <i className="ti ti-alert-circle" aria-hidden="true"></i>
                <p id="generator-error-msg"></p>
              </div>
              <div className="generator-output hidden" id="generator-output">
                <pre id="generator-output-text"></pre>
              </div>
            </div>
            <div className="generator-actions hidden" id="generator-result">
              <button className="generator-action-btn" id="generator-copy">
                <i className="ti ti-copy" aria-hidden="true"></i> Salin
              </button>
              <button className="generator-action-btn primary" id="generator-insert">
                <i className="ti ti-arrow-bar-to-down" aria-hidden="true"></i> Pakai di Editor
              </button>
            </div>
          </aside>

          {/* Search Panel */}
          <div className="search-overlay" id="search-overlay"></div>
          <aside className="search-panel" id="search-panel">
            <div className="search-header">
              <h2><i className="ti ti-search" aria-hidden="true"></i> Cari & Ganti</h2>
              <button className="search-close-btn" id="search-close" title="Tutup (Esc)"><i className="ti ti-x" aria-hidden="true"></i></button>
            </div>
            <div className="search-inputs">
              <div className="search-input-wrap">
                <span className="search-input-icon"><i className="ti ti-search" aria-hidden="true"></i></span>
                <input type="text" className="search-input" id="search-input" placeholder="Cari di semua bab…" autoComplete="off" spellCheck="false" />
                <div className="search-nav-btns">
                  <button className="search-nav-btn" id="search-prev" title="Sebelumnya (Shift+Enter)"><i className="ti ti-chevron-up" aria-hidden="true"></i></button>
                  <button className="search-nav-btn" id="search-next" title="Berikutnya (Enter)"><i className="ti ti-chevron-down" aria-hidden="true"></i></button>
                </div>
              </div>
              <div className="search-input-wrap">
                <input type="text" className="search-replace-input" id="search-replace-input" placeholder="Ganti dengan…" autoComplete="off" spellCheck="false" />
              </div>
            </div>
            <div className="search-options">
              <label className="search-option">
                <input type="checkbox" id="search-case" /> Case sensitive
              </label>
              <label className="search-option">
                <input type="checkbox" id="search-word" /> Whole word
              </label>
              <label className="search-option">
                Filter: <select id="search-status">
                  <option value="all">Semua status</option>
                  <option value="draft">Draft</option>
                  <option value="revisi">Revisi</option>
                  <option value="final">Final</option>
                </select>
              </label>
            </div>
            <div className="search-replace-actions">
              <button className="search-replace-btn" id="search-replace-btn"><i className="ti ti-arrow-bar-to-down" aria-hidden="true"></i> Ganti</button>
              <button className="search-replace-btn-outline" id="search-replace-all"><i className="ti ti-arrows-exchange" aria-hidden="true"></i> Ganti Semua</button>
            </div>
            <div className="search-stats" id="search-stats"></div>
            <div className="search-results" id="search-results">
              <div className="search-empty">
                <i className="ti ti-search" aria-hidden="true"></i>
                <p>Ketik kata kunci untuk mencari di semua bab.</p>
              </div>
            </div>
          </aside>

          {/* Versioning Panel */}
          <div className="versioning-overlay" id="versioning-overlay"></div>
          <aside className="versioning-panel" id="versioning-panel">
            <div className="versioning-header">
              <h2><i className="ti ti-history" aria-hidden="true"></i> Riwayat Versi</h2>
              <button className="versioning-close-btn" id="versioning-close" title="Tutup"><i className="ti ti-x" aria-hidden="true"></i></button>
            </div>
            <div className="versioning-save-section">
              <div className="versioning-save-row">
                <input type="text" id="versioning-label-input" placeholder="Label (opsional, misal: Sebelum revisi)" maxLength={100} />
                <button className="versioning-save-btn" id="versioning-save"><i className="ti ti-device-floppy" aria-hidden="true"></i> Simpan</button>
              </div>
              <p className="versioning-save-hint">Simpan snapshot konten saat ini sebelum melakukan revisi besar.</p>
            </div>
            <div className="versioning-list" id="versioning-list">
              <div className="versioning-empty">
                <i className="ti ti-history" aria-hidden="true"></i>
                <p>Belum ada versi tersimpan.</p>
                <p>Simpan versi sebelum melakukan revisi besar agar bisa kembali.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}