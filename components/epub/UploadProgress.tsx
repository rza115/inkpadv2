/**
 * UploadProgress Component
 * Overlay showing upload progress for EPUB files
 */

interface UploadProgressProps {
  isVisible: boolean;
  progress: number;
  currentFile: string;
  currentIndex: number;
  totalFiles: number;
  statusMessage: string;
}

export function UploadProgress({
  isVisible,
  progress,
  currentFile,
  currentIndex,
  totalFiles,
  statusMessage,
}: UploadProgressProps) {
  if (!isVisible) return null;

  return (
    <div className="epub-uploading-overlay" style={{ display: 'flex' }}>
      <span id="uploading-label">{statusMessage}</span>
      <div className="epub-progress-bar-track">
        <div
          className="epub-progress-bar-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span style={{ fontSize: '12px', opacity: 0.6 }}>
        {totalFiles > 1 ? `${currentIndex} / ${totalFiles}: ` : ''}
        {currentFile}
      </span>
    </div>
  );
}
