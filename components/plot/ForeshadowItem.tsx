/**
 * ForeshadowItem Component
 * Displays a foreshadow log entry
 */

import type { Foreshadow } from '@/types/plot';

interface ForeshadowItemProps {
  foreshadow: Foreshadow;
  onEdit: (foreshadow: Foreshadow) => void;
  onToggleStatus: (foreshadow: Foreshadow) => void;
  onDelete: (foreshadow: Foreshadow) => void;
}

export function ForeshadowItem({
  foreshadow,
  onEdit,
  onToggleStatus,
  onDelete,
}: ForeshadowItemProps) {
  const plantedTitle = foreshadow.planted?.title || '—';
  const payoffTitle = foreshadow.payoff?.title || '—';
  const isPaid = foreshadow.status === 'paid';

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStatus(foreshadow);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Hapus entri ini?')) {
      onDelete(foreshadow);
    }
  };

  return (
    <div className="foreshadow-item">
      <span
        className="foreshadow-note"
        onClick={() => onEdit(foreshadow)}
        style={{ cursor: 'pointer' }}
      >
        {foreshadow.note}
      </span>
      <span className="foreshadow-chapters">
        {plantedTitle} → {payoffTitle}
      </span>
      <button
        className={`foreshadow-status ${foreshadow.status}`}
        onClick={handleStatusClick}
        type="button"
      >
        {isPaid ? '✓ Terbayar' : 'Belum dibayar'}
      </button>
      <button
        className="foreshadow-delete"
        onClick={handleDeleteClick}
        title="Hapus"
        type="button"
      >
        <i className="ti ti-x" aria-hidden="true"></i>
      </button>
    </div>
  );
}
