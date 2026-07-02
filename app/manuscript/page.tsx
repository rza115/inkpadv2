"use client";

import { Suspense } from "react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Nav } from "@/components/Nav";
import { Loading } from "@/components/ui";
import { ChapterPanel } from "@/components/manuscript/ChapterPanel";
import { EditorPanel } from "@/components/manuscript/EditorPanel";
import { useChapterStore } from "@/store/useChapterStore";

function ManuscriptContent() {
  const { isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  
  const { 
    loadChapters, 
    loadAllCharacters, 
    loadAllWorldEntries, 
    chapters, 
    activeChapter, 
    selectChapter 
  } = useChapterStore();
  
  const initialized = useRef(false);

  // Load data on mount
  useEffect(() => {
    if (!projectId || initialized.current) return;
    initialized.current = true;

    // Set body attributes for CSS
    document.body.dataset.layout = "project";
    document.body.dataset.page = "manuscript";

    // Load data
    loadChapters(projectId);
    loadAllCharacters(projectId);
    loadAllWorldEntries(projectId);
  }, [projectId, loadChapters, loadAllCharacters, loadAllWorldEntries]);

  // Auto-select first chapter after loading (if no last chapter saved)
  useEffect(() => {
    if (chapters.length === 0 || activeChapter) return;
    
    // Check for last saved chapter
    try {
      const key = `inkpad:manuscript:lastChapter:${projectId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const lastChapter = JSON.parse(saved);
        const exists = chapters.find(c => c.id === lastChapter.chapterId);
        if (exists) {
          // Don't auto-select, show empty state with continue button
          return;
        }
      }
    } catch (_) {}
    
    // Auto-select first chapter
    selectChapter(chapters[0].id);
  }, [chapters, activeChapter, selectChapter, projectId]);

  if (authLoading) {
    return (
      <Nav layout="project" title="Memuat…" projectId={projectId}>
        <main id="page-main">
          <Loading message="Memuat…" />
        </main>
      </Nav>
    );
  }

  if (!projectId) {
    return (
      <Nav layout="project" title="Novel tidak ditemukan" projectId={null}>
        <main id="page-main">
          <p className="muted" style={{ padding: "24px" }}>
            Nggak ada novel yang dipilih. Balik ke <a href="/">Project Hub</a>.
          </p>
        </main>
      </Nav>
    );
  }

  return (
    <Nav layout="project" title="Memuat…" projectId={projectId}>
      <main id="page-main">
        <div className="manuscript-shell">
          <ChapterPanel projectId={projectId} />
          <EditorPanel projectId={projectId} />
          
          {/* Context panel - will be refactored next */}
          <aside className="context-panel" id="context-panel">
            <div className="context-section">
              <div className="context-section-header">
                <p className="context-section-title">Karakter di bab ini</p>
                <div className="context-add-wrap">
                  <button className="context-add-btn" id="add-character-btn" title="Tambah karakter">
                    <i className="ti ti-plus" aria-hidden="true"></i>
                  </button>
                  <div className="context-picker" id="context-picker"></div>
                </div>
              </div>
              <div className="context-character-list" id="context-character-list"></div>
            </div>

            <div className="context-section">
              <div className="context-section-header">
                <p className="context-section-title">World di bab ini</p>
                <div className="context-add-wrap">
                  <button className="context-add-btn" id="add-world-btn" title="Tambah entry world">
                    <i className="ti ti-plus" aria-hidden="true"></i>
                  </button>
                  <div className="context-picker" id="context-world-picker"></div>
                </div>
              </div>
              <div className="context-world-list" id="context-world-list"></div>
            </div>

            <div className="context-section">
              <div className="context-section-header">
                <p className="context-section-title">Ilustrasi</p>
                <label className="context-add-btn" htmlFor="illus-upload" title="Upload ilustrasi / video">
                  <i className="ti ti-photo-plus" aria-hidden="true"></i>
                </label>
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
                <button className="context-add-btn" id="open-notes-page-btn" title="Lihat semua catatan">
                  <i className="ti ti-external-link" aria-hidden="true"></i>
                </button>
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
              <button className="generator-close-btn" id="generator-close" title="Tutup (Esc)">
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
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
              <button className="search-close-btn" id="search-close" title="Tutup (Esc)">
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>
            <div className="search-inputs">
              <div className="search-input-wrap">
                <span className="search-input-icon"><i className="ti ti-search" aria-hidden="true"></i></span>
                <input type="text" className="search-input" id="search-input" placeholder="Cari di semua bab…" autoComplete="off" spellCheck="false" />
                <div className="search-nav-btns">
                  <button className="search-nav-btn" id="search-prev" title="Sebelumnya (Shift+Enter)">
                    <i className="ti ti-chevron-up" aria-hidden="true"></i>
                  </button>
                  <button className="search-nav-btn" id="search-next" title="Berikutnya (Enter)">
                    <i className="ti ti-chevron-down" aria-hidden="true"></i>
                  </button>
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
              <button className="search-replace-btn" id="search-replace-btn">
                <i className="ti ti-arrow-bar-to-down" aria-hidden="true"></i> Ganti
              </button>
              <button className="search-replace-btn-outline" id="search-replace-all">
                <i className="ti ti-arrows-exchange" aria-hidden="true"></i> Ganti Semua
              </button>
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
              <button className="versioning-close-btn" id="versioning-close" title="Tutup">
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>
            <div className="versioning-save-section">
              <div className="versioning-save-row">
                <input type="text" id="versioning-label-input" placeholder="Label (opsional, misal: Sebelum revisi)" maxLength={100} />
                <button className="versioning-save-btn" id="versioning-save">
                  <i className="ti ti-device-floppy" aria-hidden="true"></i> Simpan
                </button>
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
    </Nav>
  );
}

export default function ManuscriptPage() {
  return (
    <Suspense fallback={
      <Nav layout="project" title="Memuat…" projectId={null}>
        <main id="page-main">
          <Loading message="Memuat…" />
        </main>
      </Nav>
    }>
      <ManuscriptContent />
    </Suspense>
  );
}