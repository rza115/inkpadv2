/**
 * NoteCard Component
 * Displays a single note with assignment badge and date
 */
'use client';

import type { Note } from '@/types/note';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const getAssignmentBadge = () => {
    if (note.chapter) return `↳ ${note.chapter.title || 'Tanpa judul'}`;
    if (note.character) return `↳ ${note.character.name}`;
    if (note.world) return `↳ ${note.world.title}`;
    return '';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const assignBadge = getAssignmentBadge();

  return (
    <div 
      className="bg-surface border border-default rounded-[var(--radius-lg)] p-4 cursor-pointer transition-colors hover:border-accent"
      onClick={onClick}
    >
      <p className="text-sm mb-3 whitespace-pre-wrap">{note.content}</p>
      <div className="flex items-center justify-between text-xs text-muted">
        {assignBadge ? (
          <span>{assignBadge}</span>
        ) : (
          <span></span>
        )}
        <span>{formatDate(note.created_at)}</span>
      </div>
    </div>
  );
}
