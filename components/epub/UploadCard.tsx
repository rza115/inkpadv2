/**
 * UploadCard Component
 * Upload trigger card in EPUB library grid
 */

interface UploadCardProps {
  onTrigger: () => void;
}

export function UploadCard({ onTrigger }: UploadCardProps) {
  return (
    <label
      className="epub-card epub-upload-card"
      onClick={onTrigger}
      style={{ cursor: 'pointer' }}
    >
      <div className="epub-cover">
        <i className="ti ti-book-upload" aria-hidden="true"></i>
        <span>Upload EPUB</span>
      </div>
    </label>
  );
}
