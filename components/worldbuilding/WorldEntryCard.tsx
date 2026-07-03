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
    <div 
      className="bg-surface border border-default rounded-[var(--radius-lg)] p-4 cursor-pointer transition-colors hover:border-accent"
      onClick={onClick}
    >
      <p className="font-serif font-semibold text-base mb-2">{entry.title}</p>
      {preview && (
        <p className="text-sm text-muted line-clamp-3">
          {preview}{showEllipsis ? '…' : ''}
        </p>
      )}
    </div>
  );
}
