/**
 * EPUB Reader Page
 * Full React/TypeScript implementation of EPUB reader
 */
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEpubReader } from '@/hooks/useEpubReader';
import { useEpubStore } from '@/store/useEpubStore';
import {
  EpubControls,
  EpubViewer,
  EpubTOC,
  EpubFormatPanel,
} from '@/components/epub';

interface FormatSettings {
  lineHeight: number;
  paraSpacing: number;
  textAlign: string;
  paraIndent: number;
}

const DEFAULT_FORMAT: FormatSettings = {
  lineHeight: 1.6,
  paraSpacing: 1.0,
  textAlign: 'justify',
  paraIndent: 1.5,
};

function EpubReaderContent() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get('id');
  
  const { books, loadBooks } = useEpubStore();
  const [bookUrl, setBookUrl] = useState<string>('');
  const [savedCfi, setSavedCfi] = useState<string>('');
  
  // UI state
  const [fontSize, setFontSize] = useState(16);
  const [flow, setFlow] = useState<'paginated' | 'scrolled'>('paginated');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('dark');
  const [formatSettings, setFormatSettings] = useState<FormatSettings>(DEFAULT_FORMAT);
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const [isFormatPanelOpen, setIsFormatPanelOpen] = useState(false);

  // Load CSS & epub.js library
  useEffect(() => {
    document.body.className = `epub-reader-body ep-${theme}`;

    const cssFiles = [
      '/css/base.css',
      '/css/layout.css',
      '/css/components.css',
      '/css/epub-reader.css',
    ];
    cssFiles.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    // Load epub.js
    if (!(window as any).ePub) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, [theme]);

  // Load book data
  useEffect(() => {
    if (!bookId) return;
    
    const loadBookData = async () => {
      await loadBooks();
      const book = books.find((b) => b.id === bookId);
      if (book) {
        setBookUrl(book.epub_url);
        // Load saved reading position from localStorage
        const saved = localStorage.getItem(`epub-position-${bookId}`);
        if (saved) {
          setSavedCfi(saved);
        }
      }
    };
    
    loadBookData();
  }, [bookId, books, loadBooks]);

  // Handle location change (save progress)
  const handleLocationChange = useCallback(
    (location: any) => {
      if (!bookId || !location?.start?.cfi) return;
      localStorage.setItem(`epub-position-${bookId}`, location.start.cfi);
      
      // Update progress bar
      const percentage = location.start.percentage || 0;
      const progressBar = document.getElementById('ep-progress-fill');
      if (progressBar) {
        progressBar.style.width = `${percentage * 100}%`;
      }
    },
    [bookId]
  );

  // Initialize reader (only when bookUrl is available)
  const {
    toc,
    currentLocation,
    isLoading,
    error,
    bookTitle,
    nextPage,
    prevPage,
    goToLocation,
    updateFontSize,
    updateTheme,
    updateFlow,
  } = useEpubReader({
    bookUrl: bookUrl || '', // Ensure non-empty string
    containerId: 'ep-viewer-wrap',
    initialCfi: savedCfi,
    fontSize,
    flow,
    theme,
    onLocationChange: handleLocationChange,
  });

  // Apply format settings via CSS injection
  useEffect(() => {
    const styleId = 'epub-custom-format';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      #ep-viewer-wrap iframe {
        line-height: ${formatSettings.lineHeight} !important;
      }
      #ep-viewer-wrap p {
        margin-bottom: ${formatSettings.paraSpacing}em !important;
        text-align: ${formatSettings.textAlign} !important;
        text-indent: ${formatSettings.paraIndent}em !important;
      }
    `;
  }, [formatSettings]);

  // Control handlers
  const handleFontSmaller = () => {
    const newSize = Math.max(12, fontSize - 2);
    setFontSize(newSize);
    updateFontSize(newSize);
  };

  const handleFontLarger = () => {
    const newSize = Math.min(24, fontSize + 2);
    setFontSize(newSize);
    updateFontSize(newSize);
  };

  const handleToggleFlow = () => {
    const newFlow = flow === 'paginated' ? 'scrolled' : 'paginated';
    setFlow(newFlow);
    updateFlow(newFlow);
  };

  const handleToggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'sepia'> = ['light', 'dark', 'sepia'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    updateTheme(nextTheme);
  };

  const handleUpdateFormatSettings = (newSettings: Partial<FormatSettings>) => {
    setFormatSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetFormat = () => {
    setFormatSettings(DEFAULT_FORMAT);
  };

  const handleNavigateToTOC = (href: string) => {
    goToLocation(href);
    setIsTOCOpen(false);
  };

  if (!bookId) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <p>Book ID tidak ditemukan</p>
        <a href="/epub-library" style={{ color: 'var(--ep-accent)' }}>
          ← Balik ke Library
        </a>
      </div>
    );
  }

  return (
    <>
      <EpubControls
        bookTitle={bookTitle}
        onToggleTOC={() => setIsTOCOpen(!isTOCOpen)}
        onFontSmaller={handleFontSmaller}
        onFontLarger={handleFontLarger}
        onToggleFlow={handleToggleFlow}
        onToggleTheme={handleToggleTheme}
        onToggleFormatPanel={() => setIsFormatPanelOpen(!isFormatPanelOpen)}
      />

      <div className="ep-body">
        <EpubTOC
          toc={toc}
          isOpen={isTOCOpen}
          onNavigate={handleNavigateToTOC}
        />

        <EpubFormatPanel
          isOpen={isFormatPanelOpen}
          settings={formatSettings}
          onUpdateSettings={handleUpdateFormatSettings}
          onReset={handleResetFormat}
        />

        <EpubViewer
          isLoading={isLoading}
          error={error}
          onNext={nextPage}
          onPrev={prevPage}
        />
      </div>
    </>
  );
}

export default function EpubReaderPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <i
            className="ti ti-loader"
            style={{ fontSize: '28px', animation: 'spin 1s linear infinite' }}
            aria-hidden="true"
          ></i>
          <span>Loading…</span>
        </div>
      }
    >
      <EpubReaderContent />
    </Suspense>
  );
}
