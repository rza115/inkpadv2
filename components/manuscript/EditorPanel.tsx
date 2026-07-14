/**
 * EditorPanel Component
 * Chapter title input, textarea editor, toolbar, typography controls, word count, save indicator
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChapterStore } from '@/store/useChapterStore';
import { SearchPanel } from './SearchPanel';
import { GeneratorPanel } from './GeneratorPanel';
import { VersioningPanel } from './VersioningPanel';
import { AIPolishModal } from './AIPolishModal';
import { getCurrentTheme, getThemeIcon, cycleTheme } from '@/lib/theme';

interface EditorPanelProps {
  projectId: string;
}

function getLocalStorage(key: string, defaultValue: boolean): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) === 'true';
  }
  return defaultValue;
}

function getLocalStorageString(key: string, defaultValue: string): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) || defaultValue;
  }
  return defaultValue;
}

export function EditorPanel({ projectId }: EditorPanelProps) {
const router = useRouter();
const { activeChapter, chapters, updateChapter, saveIndicator, lastSavedAt, versionRestoreSignal } = useChapterStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [versioningOpen, setVersioningOpen] = useState(false);
  const [polishOpen, setPolishOpen] = useState(false);
  const [polishSelection, setPolishSelection] = useState<{ text: string; start: number; end: number } | null>(null);
  const [headersCollapsed, setHeadersCollapsed] = useState(() => getLocalStorage('inkpad_headers_collapsed', false));
  const [typographyCollapsed, setTypographyCollapsed] = useState(() => getLocalStorage('inkpad_typography_bar_collapsed', false));
  
  // Typography state — loaded from localStorage, applied as CSS classes on textarea
  const [fontFamily, setFontFamily] = useState(() => getLocalStorageString('inkpad_editor_font', 'literata'));
  const [fontSize, setFontSize] = useState(() => getLocalStorageString('inkpad_editor_fontsize', 'md'));
  const [fontSpacing, setFontSpacing] = useState(() => getLocalStorageString('inkpad_editor_spacing', 'normal'));
  const [paperMode, setPaperMode] = useState(() => getLocalStorage('inkpad_editor_paper', false));

  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const contentSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const activeChapterIdRef = useRef<string | null>(null);
  const contentRef = useRef<string>('');
  const titleRefValue = useRef<string>('');

  // Keep refs in sync with state for use in callbacks
  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { titleRefValue.current = title; }, [title]);

  // Sync local state when switching to a different chapter
  useEffect(() => {
    if (activeChapter) {
      activeChapterIdRef.current = activeChapter.id;
      setTitle(activeChapter.title || '');
      setContent(activeChapter.content || '');
      setWordCount(activeChapter.word_count || 0);
      clearTimeout(contentSaveTimer.current);
      clearTimeout(titleSaveTimer.current);
    } else {
      activeChapterIdRef.current = null;
      setTitle('');
      setContent('');
      setWordCount(0);
    }
  }, [activeChapter?.id]);

  // Sync local state when version restored on same chapter
  useEffect(() => {
    if (!activeChapter || activeChapter.id !== activeChapterIdRef.current) return;
    setContent(activeChapter.content || '');
    setWordCount(activeChapter.word_count || 0);
    if (activeChapter.title !== titleRefValue.current) {
      setTitle(activeChapter.title || '');
    }
    clearTimeout(contentSaveTimer.current);
    clearTimeout(titleSaveTimer.current);
  }, [versionRestoreSignal]);

  // Count words
  const countWords = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const updateWordCount = useCallback((text: string) => {
    setWordCount(countWords(text));
  }, []);

  // Auto-save title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(() => {
      if (activeChapter) {
        updateChapter(activeChapter.id, { title: value.trim() || 'Tanpa judul' });
      }
    }, 500);
  };

  // Auto-save content
  const handleContentChange = (value: string) => {
    setContent(value);
    updateWordCount(value);
    clearTimeout(contentSaveTimer.current);
    contentSaveTimer.current = setTimeout(() => {
      if (activeChapter) {
        const wc = countWords(value);
        updateChapter(activeChapter.id, { content: value, word_count: wc });
      }
    }, 700);
  };

  // Force save - read from refs to avoid stale closure
  const forceSave = useCallback(async () => {
    if (!activeChapter) return;
    clearTimeout(titleSaveTimer.current);
    clearTimeout(contentSaveTimer.current);
    const currentContent = contentRef.current;
    const currentTitle = titleRefValue.current;
    const wc = countWords(currentContent);
    await updateChapter(activeChapter.id, {
      title: currentTitle.trim() || 'Tanpa judul',
      content: currentContent,
      word_count: wc,
    });
  }, [activeChapter, updateChapter]);

  // Buka mode baca — simpan draft dulu biar Reader nampilin versi terbaru
  const openReadMode = useCallback(async () => {
    if (!activeChapter) return;
    await forceSave();
    router.push(`/reader?project=${projectId}&chapterId=${activeChapter.id}`);
  }, [activeChapter, forceSave, projectId, router]);

  // Toolbar actions - read from textarea directly to avoid stale closure
  // Supports toggle: applying the same formatting twice on the same
  // selection removes it instead of stacking markers.
  const applyToolbar = useCallback((type: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const currentContent = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = currentContent.substring(0, start);
    const after = currentContent.substring(end);
    const selected = currentContent.substring(start, end);

    let newContent = currentContent;
    let newStart = start;
    let newEnd = end;

    if (type === 'bold' || type === 'italic') {
      const marker = type === 'bold' ? '**' : '_';
      const mLen = marker.length;

      if (before.endsWith(marker) && after.startsWith(marker)) {
        // Marker sits right outside the selection -> un-wrap
        newContent = before.slice(0, before.length - mLen) + selected + after.slice(mLen);
        newStart = start - mLen;
        newEnd = end - mLen;
      } else if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= mLen * 2) {
        // Marker is included inside the selection -> un-wrap
        const unwrapped = selected.slice(mLen, selected.length - mLen);
        newContent = before + unwrapped + after;
        newStart = start;
        newEnd = start + unwrapped.length;
      } else {
        // Not formatted yet -> wrap
        newContent = before + marker + selected + marker + after;
        newStart = start + mLen;
        newEnd = end + mLen;
      }
    } else if (type === 'heading') {
      const marker = '## ';
      const mLen = marker.length;

      if (before.endsWith(marker)) {
        // Marker sits right before the selection -> un-heading
        newContent = before.slice(0, before.length - mLen) + selected + after;
        newStart = start - mLen;
        newEnd = end - mLen;
      } else if (selected.startsWith(marker)) {
        // Marker is included inside the selection -> un-heading
        const unwrapped = selected.slice(mLen);
        newContent = before + unwrapped + after;
        newStart = start;
        newEnd = start + unwrapped.length;
      } else {
        // Not a heading yet -> add marker
        newContent = before + marker + selected + after;
        newStart = start + mLen;
        newEnd = end + mLen;
      }
    }

    setContent(newContent);
    updateWordCount(newContent);

    // Schedule save
    clearTimeout(contentSaveTimer.current);
    contentSaveTimer.current = setTimeout(() => {
      if (activeChapter) {
        const wc = countWords(newContent);
        updateChapter(activeChapter.id, { content: newContent, word_count: wc });
      }
    }, 700);

    // Restore selection to the same logical text, so clicking the
    // same button again toggles the formatting back off.
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newStart, newEnd);
    }, 0);
  }, [activeChapter, updateChapter, updateWordCount]);

  // Open the AI Polish modal with the current textarea selection
  const openAIPolish = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value.substring(start, end);
    if (!text.trim()) {
      alert('Seleksi teks yang mau dirapikan dulu, ya.');
      return;
    }
    setPolishSelection({ text, start, end });
    setPolishOpen(true);
  }, []);

  // Replace the originally-selected range with the polished text
  const handlePolishApply = useCallback((newText: string) => {
    if (!polishSelection) return;
    const ta = textareaRef.current;
    const currentContent = ta ? ta.value : content;
    const { start, end } = polishSelection;
    const before = currentContent.substring(0, start);
    const after = currentContent.substring(end);
    const newContent = before + newText + after;

    setContent(newContent);
    updateWordCount(newContent);

    clearTimeout(contentSaveTimer.current);
    contentSaveTimer.current = setTimeout(() => {
      if (activeChapter) {
        const wc = countWords(newContent);
        updateChapter(activeChapter.id, { content: newContent, word_count: wc });
      }
    }, 700);

    setTimeout(() => {
      if (ta) {
        ta.focus();
        ta.setSelectionRange(start, start + newText.length);
      }
    }, 0);
  }, [polishSelection, activeChapter, updateChapter, updateWordCount, content]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev;
      if (next && textareaRef.current) {
        textareaRef.current.focus();
      }
      return next;
    });
  }, []);

  const toggleHeadersCollapsed = () => {
    const next = !headersCollapsed;
    setHeadersCollapsed(next);
    localStorage.setItem('inkpad_headers_collapsed', String(next));
  };

  // Theme state — using shared theme utilities
  const [themeIcon, setThemeIcon] = useState(() => {
    if (typeof window === 'undefined') return 'ti ti-sun';
    return getThemeIcon(getCurrentTheme());
  });

  const handleThemeToggle = () => {
    const next = cycleTheme();
    setThemeIcon(getThemeIcon(next));
  };

  const toggleTypographyCollapsed = () => {
    const next = !typographyCollapsed;
    setTypographyCollapsed(next);
    localStorage.setItem('inkpad_typography_bar_collapsed', String(next));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        forceSave();
        return;
      }
      if (isCtrl && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        applyToolbar('heading');
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFocusMode();
        return;
      }
      if (e.key === 'Escape' && focusMode) {
        toggleFocusMode();
      }
      if (isCtrl && e.key === 'b') {
        e.preventDefault();
        applyToolbar('bold');
      }
      if (isCtrl && e.key === 'i') {
        e.preventDefault();
        applyToolbar('italic');
      }
      if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        openAIPolish();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [forceSave, applyToolbar, toggleFocusMode, focusMode, openAIPolish]);

  // Export - read from refs to avoid stale closure
  const exportChapterMarkdown = () => {
    if (!activeChapter) return;
    const currentTitle = titleRefValue.current;
    const currentContent = contentRef.current;
    const md = `# ${currentTitle}\n\n${currentContent}`;
    downloadText(md, `${safeFilename(currentTitle)}.md`);
  };

  const exportAllMarkdown = async () => {
    if (chapters.length === 0) return;
    await forceSave();
    const currentTitle = titleRefValue.current;
    const projectTitle = currentTitle || 'Novel';
    const md = chapters.map((ch) => {
      return `# ${ch.title || 'Tanpa Judul'}\n\n${ch.content || ''}`;
    }).join('\n\n---\n\n');
    downloadText(md, `${safeFilename(projectTitle)}.md`);
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  };

  const safeFilename = (name: string) => {
    return (name || 'Novel').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Novel';
  };

  const saveIndicatorText = () => {
    if (saveIndicator === 'saving') return 'Menyimpan…';
    if (saveIndicator === 'saved') return lastSavedAt ? `Tersimpan ${formatTime(lastSavedAt)}` : 'Tersimpan';
    if (saveIndicator === 'offline') return 'Tersimpan di perangkat (offline)';
    if (saveIndicator === 'error') return 'Gagal tersimpan';
    return '';
  };

  const formatTime = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Empty state when no chapter selected
  if (!activeChapter) {
    return (
      <section className="flex-1 flex flex-col min-w-0 bg-[var(--bg)]">
        <div className="flex items-center justify-center flex-1" id="editor-empty">
          <div className="text-center">
            <p className="text-[var(--text-muted)] mb-4">Buat bab baru untuk mulai menulis.</p>
            <button
              className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-[var(--radius)] cursor-pointer border-none flex items-center gap-2 mx-auto hover:opacity-90 transition-opacity"
              id="empty-new-chapter-btn"
              onClick={() => {
                const btn = document.getElementById('new-chapter-btn');
                if (btn) btn.click();
              }}
            >
              <i className="ti ti-plus" aria-hidden="true"></i> Bab baru
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={`flex-1 flex flex-col min-w-0 bg-[var(--bg)] ${focusMode ? 'fixed inset-0 z-[9999] bg-[var(--bg)]' : ''}`}>
      {/* Active editor */}
      <div className="flex-1 flex flex-col" id="editor-active">
        <div
          className={
            headersCollapsed
              ? "h-0 py-0 overflow-hidden border-b-0"
              : "flex items-center justify-between px-5 py-3 border-b border-[var(--border)] gap-4 shrink-0"
          }
        >
          <input
            ref={titleRef}
            type="text"
            id="chapter-title-input"
            className="flex-1 bg-transparent border-none text-xl font-semibold text-[var(--text)] outline-none min-w-0"
            placeholder="Judul bab"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="relative">
              <button
                className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]"
                id="export-btn"
                title="Export"
                onClick={() => setExportOpen(!exportOpen)}
              >
                <i className="ti ti-download" aria-hidden="true"></i>
              </button>
              {exportOpen && (
                <div className="absolute top-[calc(100%+6px)] right-0 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] min-w-[190px] z-50 overflow-hidden shadow-lg" id="export-dropdown">
                  <div className="px-3.5 py-2.5 text-xs cursor-pointer text-[var(--text)] flex items-center gap-2 hover:bg-[var(--surface)]" onClick={() => { setExportOpen(false); exportChapterMarkdown(); }}>
                    <i className="ti ti-file-text" aria-hidden="true"></i> Bab ini (.md)
                  </div>
                  <div className="h-px bg-[var(--border)]"></div>
                  <div className="px-3.5 py-2.5 text-xs cursor-pointer text-[var(--text)] flex items-center gap-2 hover:bg-[var(--surface)]" onClick={() => { setExportOpen(false); exportAllMarkdown(); }}>
                    <i className="ti ti-files" aria-hidden="true"></i> Semua bab (.md)
                  </div>
                </div>
              )}
            </div>
            <button className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="search-btn" title="Cari di semua bab (Ctrl+F)" onClick={() => setSearchOpen(true)}>
              <i className="ti ti-search" aria-hidden="true"></i>
            </button>
            <button className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="generator-btn" title="AI Generator Tools" onClick={() => setGeneratorOpen(true)}>
              <i className="ti ti-dice" aria-hidden="true"></i>
            </button>
            <button
              className="flex items-center justify-center w-8 h-8 bg-transparent border-none cursor-pointer rounded-[var(--radius)] transition-colors hover:bg-[var(--surface-raised)]"
              id="focus-btn"
              title={focusMode ? 'Keluar focus mode (Esc)' : 'Distraction-free mode (Alt+F)'}
              onClick={toggleFocusMode}
              style={{ color: focusMode ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              <i className="ti ti-focus-2" aria-hidden="true"></i>
            </button>
            <button className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="versioning-btn" title="Riwayat Versi" onClick={() => setVersioningOpen(true)}>
              <i className="ti ti-history" aria-hidden="true"></i>
            </button>
            <button className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="theme-toggle-btn" title="Ganti tema" onClick={handleThemeToggle}>
              <i className={`ti ${themeIcon}`} aria-hidden="true"></i>
            </button>
            <button className="flex items-center justify-center gap-1 px-3 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="read-btn" title="Buka mode baca" onClick={openReadMode}>
              <i className="ti ti-book" aria-hidden="true"></i> Baca
            </button>
            <span className="text-xs text-[var(--text-muted)] ml-2" id="save-indicator">{saveIndicatorText()}</span>
            <span className="text-xs text-[var(--text-muted)] ml-2" id="word-count">{wordCount.toLocaleString('id-ID')} kata</span>
          </div>
        </div>

        <div
          className={
            headersCollapsed
              ? "h-0 py-0 overflow-hidden border-b-0"
              : "flex items-center gap-1 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] shrink-0"
          }
        >
          <button type="button" className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" data-md="bold" title="Bold" data-shortcut="Ctrl+B" onClick={() => applyToolbar('bold')}>
            <i className="ti ti-bold" aria-hidden="true"></i>
          </button>
          <button type="button" className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" data-md="italic" title="Italic" data-shortcut="Ctrl+I" onClick={() => applyToolbar('italic')}>
            <i className="ti ti-italic" aria-hidden="true"></i>
          </button>
          <button type="button" className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" data-md="heading" title="Heading" data-shortcut="Ctrl+H" onClick={() => applyToolbar('heading')}>
            <i className="ti ti-heading" aria-hidden="true"></i>
          </button>
          <button type="button" className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="ai-polish-btn" title="AI Polish — rapikan teks (Ctrl+Shift+P)" data-shortcut="Ctrl+Shift+P" onClick={openAIPolish}>
            <i className="ti ti-sparkles" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)] ml-auto"
            id="toggle-headers-btn"
            title={headersCollapsed ? 'Tampilkan navigasi & header' : 'Sembunyikan navigasi & header'}
            onClick={toggleHeadersCollapsed}
          >
            <i className={`ti ti-chevron-${headersCollapsed ? 'down' : 'up'}`} aria-hidden="true"></i>
          </button>
        </div>

        <div
          className={
            typographyCollapsed
              ? "flex items-center gap-3 px-4 h-0 py-0 border-b-0 bg-[var(--surface)] text-xs shrink-0 overflow-hidden transition-all duration-200"
              : "flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] text-xs shrink-0 transition-all duration-200"
          }
          id="editor-typography-bar"
        >
          <span className="text-[var(--text-muted)] shrink-0">Font:</span>
          <select className="px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] cursor-pointer text-xs" id="editor-font-family" title="Font" value={fontFamily} onChange={(e) => { const v = e.target.value; setFontFamily(v); localStorage.setItem('inkpad_editor_font', v); }}>
            <option value="literata">Literata</option>
            <option value="lora">Lora</option>
            <option value="inter">Inter</option>
            <option value="nunito">Nunito</option>
            <option value="georgia">Georgia</option>
            <option value="mono">Mono</option>
          </select>
          <div className="w-px h-4 bg-[var(--border)]"></div>
          <span className="text-[var(--text-muted)] shrink-0">Ukuran:</span>
          <select className="px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] cursor-pointer text-xs" id="editor-font-size" title="Ukuran font" value={fontSize} onChange={(e) => { const v = e.target.value; setFontSize(v); localStorage.setItem('inkpad_editor_fontsize', v); }}>
            <option value="sm">Kecil</option>
            <option value="md">Sedang</option>
            <option value="lg">Besar</option>
            <option value="xl">XL</option>
          </select>
          <div className="w-px h-4 bg-[var(--border)]"></div>
          <span className="text-[var(--text-muted)] shrink-0">Spasi:</span>
          <select className="px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] cursor-pointer text-xs" id="editor-font-spacing" title="Spasi baris" value={fontSpacing} onChange={(e) => { const v = e.target.value; setFontSpacing(v); localStorage.setItem('inkpad_editor_spacing', v); }}>
            <option value="tight">Rapat</option>
            <option value="normal">Normal</option>
            <option value="relaxed">Lebar</option>
          </select>
          <div className="w-px h-4 bg-[var(--border)]"></div>
          <button className={`flex items-center gap-1 px-2 py-1 bg-transparent border rounded-[var(--radius)] cursor-pointer transition-colors ${paperMode ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`} id="editor-paper-mode" title="Mode kertas bergaris" onClick={() => { const next = !paperMode; setPaperMode(next); localStorage.setItem('inkpad_editor_paper', String(next)); }}>
            <i className="ti ti-notebook" aria-hidden="true"></i> Kertas
          </button>
          <button
            className="flex items-center justify-center w-6 h-6 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] ml-auto"
            id="typography-bar-toggle"
            title={typographyCollapsed ? 'Tampilkan kontrol tipografi' : 'Sembunyikan kontrol tipografi'}
            onClick={toggleTypographyCollapsed}
          >
            <i className={`ti ti-chevron-${typographyCollapsed ? 'down' : 'up'} transition-transform duration-200`} aria-hidden="true"></i>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          id="editor-textarea"
          className={`editor-textarea flex-1 w-full px-6 py-4 bg-[var(--bg)] border-none text-[var(--text)] resize-none outline-none text-base leading-relaxed ef-${fontFamily} efs-${fontSize} esp-${fontSpacing}${paperMode ? ' paper-mode' : ''}`}
          placeholder="Mulai nulis di sini..."
          spellCheck={false}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
        />
      </div>
    </section>

      {/* Overlay Panels */}
      <SearchPanel
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        activeChapterId={activeChapter?.id}
        getCurrentContent={() => content}
        onReplaceInActiveChapter={(newContent: string) => {
          setContent(newContent);
          updateWordCount(newContent);
          clearTimeout(contentSaveTimer.current);
          contentSaveTimer.current = setTimeout(() => {
            if (activeChapter) {
              const wc = countWords(newContent);
              updateChapter(activeChapter.id, { content: newContent, word_count: wc });
            }
          }, 700);
        }}
      />
      <GeneratorPanel isOpen={generatorOpen} onClose={() => setGeneratorOpen(false)} />
      <VersioningPanel isOpen={versioningOpen} onClose={() => setVersioningOpen(false)} />
      <AIPolishModal
        isOpen={polishOpen}
        onClose={() => setPolishOpen(false)}
        selectedText={polishSelection?.text || ''}
        onApply={handlePolishApply}
      />
    </>
  );
}
