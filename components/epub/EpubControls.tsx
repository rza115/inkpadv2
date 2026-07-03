/**
 * EpubControls Component
 * Top toolbar with navigation and settings controls
 */

import { useRouter } from 'next/navigation';

interface EpubControlsProps {
  bookTitle: string;
  onToggleTOC?: () => void;
  onFontSmaller?: () => void;
  onFontLarger?: () => void;
  onToggleFlow?: () => void;
  onToggleTheme?: () => void;
  onToggleFormatPanel?: () => void;
}

export function EpubControls({
  bookTitle,
  onToggleTOC,
  onFontSmaller,
  onFontLarger,
  onToggleFlow,
  onToggleTheme,
  onToggleFormatPanel,
}: EpubControlsProps) {
  const router = useRouter();

  return (
    <header className="ep-topbar">
      <button
        className="ep-topbar-btn"
        id="back-btn"
        onClick={() => router.push('/epub-library')}
      >
        <i className="ti ti-arrow-left" aria-hidden="true"></i> Library
      </button>
      
      <button
        className="ep-topbar-btn"
        id="toc-btn"
        onClick={onToggleTOC}
        title="Daftar isi"
      >
        <i className="ti ti-layout-sidebar" aria-hidden="true"></i>
      </button>
      
      <span className="ep-title" id="ep-title">
        {bookTitle || 'Memuat…'}
      </span>
      
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button
          className="ep-ctrl-btn"
          id="font-sm"
          onClick={onFontSmaller}
          title="Font kecil"
        >
          A<sup>-</sup>
        </button>
        
        <button
          className="ep-ctrl-btn"
          id="font-lg"
          onClick={onFontLarger}
          title="Font besar"
        >
          A<sup>+</sup>
        </button>
        
        <button
          className="ep-ctrl-btn wide"
          id="flow-btn"
          onClick={onToggleFlow}
          title="Ganti mode scroll/halaman"
        >
          ⇄
        </button>
        
        <button
          className="ep-ctrl-btn wide"
          id="theme-btn"
          onClick={onToggleTheme}
          title="Ganti tema"
        >
          <i className="ti ti-sun" aria-hidden="true"></i>
        </button>
        
        <button
          className="ep-ctrl-btn wide"
          id="format-btn"
          onClick={onToggleFormatPanel}
          title="Pengaturan format"
        >
          <i className="ti ti-settings" aria-hidden="true"></i>
        </button>
      </div>
    </header>
  );
}
