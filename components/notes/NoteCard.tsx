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
    <div className="note-card" onClick={onClick}>
      <p className="note-content">{note.content}</p>
      <div className="note-footer">
        {assignBadge ? (
          <span className="note-assign-badge">{assignBadge}</span>
        ) : (
          <span></span>
        )}
        <span className="note-date">{formatDate(note.created_at)}</span>
      </div>
    </div>
  );
}