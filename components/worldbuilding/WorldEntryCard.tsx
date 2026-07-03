/**
 * WorldEntryCard Component
 * Displays a world entry card with title and content preview
 */
'use client';

import type { WorldEntry } from '@/types/worldbuilding';
import { stripCrossLinks } from '@/lib/crosslink';

interface WorldEntryCardProps {
  entry: WorldEntry;
  onClick: () => void;
}

export function WorldEntryCard({ entry, onClick }: WorldEntryCardProps) {
  // Strip [[]] markup and truncate for preview
  const preview = entry.content
    ? stripCrossLinks(entry.content).slice(0, 140)
    : '';
  const showEllipsis = (entry.content?.length || 0) > 140;

  return (
    <div className="entry-card" onClick={onClick}>
      <p className="entry-title">{entry.title}</p>
      {preview && (
        <p className="entry-preview">
          {preview}{showEllipsis ? '…' : ''}
        </p>
      )}
    </div>
  );
}