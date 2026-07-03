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
    <div className="flex items-center gap-3 py-2.5 px-3 bg-surface border-b border-default hover:bg-surface-raised transition-colors">
      <span
        className="flex-1 text-sm cursor-pointer"
        onClick={() => onEdit(foreshadow)}
      >
        {foreshadow.note}
      </span>
      <span className="text-xs text-muted whitespace-nowrap">
        {plantedTitle} → {payoffTitle}
      </span>
      <button
        className={`text-xs px-2.5 py-1 rounded-full border-none cursor-pointer transition-colors ${
          isPaid 
            ? 'bg-[var(--success)] text-white' 
            : 'bg-surface-raised text-muted hover:bg-[var(--accent)] hover:text-white'
        }`}
        onClick={handleStatusClick}
        type="button"
      >
        {isPaid ? '✓ Terbayar' : 'Belum dibayar'}
      </button>
      <button
        className="w-6 h-6 rounded-full bg-transparent text-muted border-none cursor-pointer flex items-center justify-center transition-colors hover:bg-surface-raised hover:text-[var(--danger)]"
        onClick={handleDeleteClick}
        title="Hapus"
        type="button"
      >
        <i className="ti ti-x" aria-hidden="true"></i>
      </button>
    </div>
  );
}
