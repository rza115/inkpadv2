/**
 * ArcCard Component
 * Displays an arc with its information
 */

import type { Arc } from '@/types/plot';

interface ArcCardProps {
  arc: Arc;
  onClick: (arc: Arc) => void;
}

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  ongoing: 'Ongoing',
  complete: 'Selesai',
};

export function ArcCard({ arc, onClick }: ArcCardProps) {
  const startTitle = arc.start?.title || '?';
  const endTitle = arc.end?.title || '?';
  const hasRange = arc.chapter_start_id || arc.chapter_end_id;

  return (
    <div 
      className="bg-surface border border-default rounded-[var(--radius-lg)] p-4 cursor-pointer transition-colors hover:border-accent"
      onClick={() => onClick(arc)}
    >
      <p className="font-serif font-semibold text-base mb-2">{arc.title}</p>
      {hasRange && (
        <p className="text-xs text-muted mb-2">
          {startTitle} → {endTitle}
        </p>
      )}
      {arc.summary && (
        <p className="text-sm text-primary mb-3 line-clamp-2">{arc.summary}</p>
      )}
      <div className="flex gap-1.5">
        <span className={`text-[11px] px-2 py-0.5 rounded-full bg-surface-raised ${
          arc.status === 'ongoing' ? 'text-accent' : 'text-muted'
        }`}>
          {STATUS_LABELS[arc.status] || arc.status}
        </span>
      </div>
    </div>
  );
}
