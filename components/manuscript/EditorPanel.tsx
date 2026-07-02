/**
 * EditorPanel Component
 * Chapter title input, textarea editor, toolbar, typography controls, word count, save indicator
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChapterStore } from '@/store/useChapterStore';
import { SearchPanel } from './SearchPanel';
import { GeneratorPanel } from './GeneratorPanel';
import { VersioningPanel } from './VersioningPanel';

interface EditorPanelProps {
  projectId: string;
}

function getLocalStorage(key: string, defaultValue: boolean): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) === 'true';
  }
  return defaultValue;
}

export function EditorPanel({ projectId }: EditorPanelProps) {
  const { activeChapter, chapters, updateChapter, saveIndicator, lastSavedAt } = useChapterStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [versioningOpen, setVersioningOpen] = useState(false);
  const [headersCollapsed, setHeadersCollapsed] = useState(() => getLocalStorage('inkpad_headers_collapsed', false));
  const [typographyCollapsed, setTypographyCollapsed] = useState(() => getLocalStorage('inkpad_typography_bar_collapsed', false));

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

  // Update local state when active chapter changes
  useEffect(() => {
    if (activeChapter) {
      if (activeChapter.id !== activeChapterIdRef.current) {
        activeChapterIdRef.current = activeChapter.id;
        setTitle(activeChapter.title || '');
        setContent(activeChapter.content || '');
        setWordCount(activeChapter.word_count || 0);
      }
    } else {
      activeChapterIdRef.current = null;
      setTitle('');
      setContent('');
      setWordCount(0);
    }
  }, [activeChapter?.id]);

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

  // Toolbar actions - read from textarea directly to avoid stale closure
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
    
    if (type === 'bold') {
      newContent = before + '**' + selected + '**' + after;
    } else if (type === 'italic') {
      newContent = before + '_' + selected + '_' + after;
    } else if (type === 'heading') {
      newContent = before + '## ' + selected + after;
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
    
    // Restore cursor
    setTimeout(() => {
      ta.focus();
      if (type === 'heading') {
        ta.setSelectionRange(start + 3, start + 3 + selected.length);
      } else {
        ta.setSelectionRange(start + 2, end + 2);
      }
    }, 0);
  }, [activeChapter, updateChapter, updateWordCount]);

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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [forceSave, applyToolbar, toggleFocusMode, focusMode]);

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
      <section className="editor-panel">
        <div className="editor-empty" id="editor-empty" style={{ display: 'flex' }}>
          <div className="editor-empty-inner">
            <p>Buat bab baru untuk mulai menulis.</p>
            <button
              className="empty-state-chapter-btn"
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
      <section className={`editor-panel ${focusMode ? 'focus-mode' : ''}`}>
      {/* Empty state (hidden when chapter is active) */}
      <div className="editor-empty" id="editor-empty" style={{ display: 'none' }}>
        <div className="editor-empty-inner">
          <p>Buat bab baru untuk mulai menulis.</p>
          <button className="empty-state-chapter-btn" id="empty-new-chapter-btn">
            <i className="ti ti-plus" aria-hidden="true"></i> Bab baru
          </button>
        </div>
      </div>

      {/* Active editor */}
      <div className="editor-active" id="editor-active" style={{ display: 'flex' }}>
        <div className="editor-header">
          <input
            ref={titleRef}
            type="text"
            id="chapter-title-input"
            className="chapter-title-input"
            placeholder="Judul bab"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
          <div className="editor-meta">
            <div className="export-wrap">
              <button
                className="read-btn"
                id="export-btn"
                title="Export"
                onClick={() => setExportOpen(!exportOpen)}
              >
                <i className="ti ti-download" aria-hidden="true"></i>
              </button>
              <div className={`export-dropdown ${exportOpen ? 'open' : ''}`} id="export-dropdown">
                <div className="export-dropdown-item" onClick={() => { setExportOpen(false); exportChapterMarkdown(); }}>
                  <i className="ti ti-file-text" aria-hidden="true"></i> Bab ini (.md)
                </div>
                <div className="export-dropdown-divider"></div>
                <div className="export-dropdown-item" onClick={() => { setExportOpen(false); exportAllMarkdown(); }}>
                  <i className="ti ti-files" aria-hidden="true"></i> Semua bab (.md)
                </div>
              </div>
            </div>
            <button className="read-btn" id="search-btn" title="Cari di semua bab (Ctrl+F)" onClick={() => setSearchOpen(true)}>
              <i className="ti ti-search" aria-hidden="true"></i>
            </button>
            <button className="read-btn" id="generator-btn" title="AI Generator Tools" onClick={() => setGeneratorOpen(true)}>
              <i className="ti ti-dice" aria-hidden="true"></i>
            </button>
            <button
              className="read-btn"
              id="focus-btn"
              title={focusMode ? 'Keluar focus mode (Esc)' : 'Distraction-free mode (Alt+F)'}
              onClick={toggleFocusMode}
              style={{ color: focusMode ? 'var(--accent)' : '' }}
            >
              <i className={`ti ti-focus-2 ${focusMode ? 'active' : ''}`} aria-hidden="true"></i>
            </button>
            <button className="read-btn" id="versioning-btn" title="Riwayat Versi" onClick={() => setVersioningOpen(true)}>
              <i className="ti ti-history" aria-hidden="true"></i>
            </button>
            <button className="read-btn" id="theme-toggle-btn" title="Ganti tema">
              <i className="ti ti-sun" aria-hidden="true"></i>
            </button>
            <button className="read-btn" id="read-btn">
              <i className="ti ti-book" aria-hidden="true"></i> Baca
            </button>
            <span id="save-indicator">{saveIndicatorText()}</span>
            <span id="word-count">{wordCount.toLocaleString('id-ID')} kata</span>
          </div>
        </div>

        <div className="editor-toolbar">
          <button type="button" data-md="bold" title="Bold" data-shortcut="Ctrl+B" onClick={() => applyToolbar('bold')}>
            <i className="ti ti-bold" aria-hidden="true"></i>
          </button>
          <button type="button" data-md="italic" title="Italic" data-shortcut="Ctrl+I" onClick={() => applyToolbar('italic')}>
            <i className="ti ti-italic" aria-hidden="true"></i>
          </button>
          <button type="button" data-md="heading" title="Heading" data-shortcut="Ctrl+H" onClick={() => applyToolbar('heading')}>
            <i className="ti ti-heading" aria-hidden="true"></i>
          </button>
          <button type="button" id="ai-polish-btn" title="AI Polish — rapikan teks (Ctrl+Shift+P)" data-shortcut="Ctrl+Shift+P">
            <i className="ti ti-sparkles" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            id="toggle-headers-btn"
            title={headersCollapsed ? 'Tampilkan navigasi & header' : 'Sembunyikan navigasi & header'}
            onClick={toggleHeadersCollapsed}
          >
            <i className={`ti ti-chevron-${headersCollapsed ? 'down' : 'up'}`} aria-hidden="true"></i>
          </button>
        </div>

        <div className={`editor-typography-bar ${typographyCollapsed ? 'collapsed' : ''}`} id="editor-typography-bar">
          <span className="typo-label">Font:</span>
          <select id="editor-font-family" title="Font">
            <option value="literata">Literata</option>
            <option value="lora">Lora</option>
            <option value="inter">Inter</option>
            <option value="nunito">Nunito</option>
            <option value="georgia">Georgia</option>
            <option value="mono">Mono</option>
          </select>
          <div className="typo-separator"></div>
          <span className="typo-label">Ukuran:</span>
          <select id="editor-font-size" title="Ukuran font">
            <option value="sm">Kecil</option>
            <option value="md" selected>Sedang</option>
            <option value="lg">Besar</option>
            <option value="xl">XL</option>
          </select>
          <div className="typo-separator"></div>
          <span className="typo-label">Spasi:</span>
          <select id="editor-font-spacing" title="Spasi baris">
            <option value="tight">Rapat</option>
            <option value="normal" selected>Normal</option>
            <option value="relaxed">Lebar</option>
          </select>
          <div className="typo-separator"></div>
          <button className="typo-btn" id="editor-paper-mode" title="Mode kertas bergaris">
            <i className="ti ti-notebook" aria-hidden="true"></i> Kertas
          </button>
          <button
            className="typography-bar-toggle"
            id="typography-bar-toggle"
            title={typographyCollapsed ? 'Tampilkan kontrol tipografi' : 'Sembunyikan kontrol tipografi'}
            onClick={toggleTypographyCollapsed}
          >
            <i className="ti ti-chevron-up" aria-hidden="true"></i>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          id="editor-textarea"
          className="editor-textarea"
          placeholder="Mulai nulis di sini..."
          spellCheck={false}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
        />
      </div>
    </section>

      {/* Overlay Panels */}
      <SearchPanel isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <GeneratorPanel isOpen={generatorOpen} onClose={() => setGeneratorOpen(false)} />
      <VersioningPanel isOpen={versioningOpen} onClose={() => setVersioningOpen(false)} />
    </>
  );
}
