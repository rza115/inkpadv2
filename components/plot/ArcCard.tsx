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
    <div className="arc-card" onClick={() => onClick(arc)}>
      <p className="arc-card-title">{arc.title}</p>
      {hasRange && (
        <p className="arc-card-range">
          {startTitle} → {endTitle}
        </p>
      )}
      {arc.summary && <p className="arc-card-summary">{arc.summary}</p>}
      <div className="arc-card-footer">
        <span className={`badge ${arc.status}`}>
          {STATUS_LABELS[arc.status] || arc.status}
        </span>
      </div>
    </div>
  );
}
