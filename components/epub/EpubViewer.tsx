/**
 * EpubViewer Component
 * Main EPUB book viewer container with loading/error states
 */

interface EpubViewerProps {
  isLoading: boolean;
  error: string | null;
  onNext?: () => void;
  onPrev?: () => void;
}

export function EpubViewer({ isLoading, error, onNext, onPrev }: EpubViewerProps) {
  return (
    <div className="ep-pane" id="ep-pane">
      {/* Viewer container - MUST be visible from start for epub.js */}
      <div id="ep-viewer-wrap"></div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="ep-loading" id="ep-loading">
          <i
            className="ti ti-loader"
            style={{ fontSize: '28px', animation: 'spin 1s linear infinite' }}
            aria-hidden="true"
          ></i>
          <span id="ep-loading-msg">Memuat buku…</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="ep-loading">
          <i
            className="ti ti-alert-circle"
            style={{ fontSize: '28px', color: 'var(--ep-accent)' }}
            aria-hidden="true"
          ></i>
          <span style={{ textAlign: 'center', maxWidth: '280px' }}>{error}</span>
          <a
            href="/epub-library"
            style={{
              color: 'var(--ep-accent)',
              fontSize: '13px',
              marginTop: '4px',
            }}
          >
            ← Balik ke Library
          </a>
        </div>
      )}

      {/* Navigation tap zones */}
      {!isLoading && !error && (
        <>
          <div className="ep-tap-zone ep-tap-prev" id="tap-prev" onClick={onPrev}>
            <i className="ti ti-chevron-left" aria-hidden="true"></i>
          </div>
          <div className="ep-tap-zone ep-tap-next" id="tap-next" onClick={onNext}>
            <i className="ti ti-chevron-right" aria-hidden="true"></i>
          </div>
        </>
      )}

      {/* Progress bar */}
      <div className="ep-progressbar">
        <div className="ep-progressbar-fill" id="ep-progress-fill"></div>
      </div>
    </div>
  );
}
