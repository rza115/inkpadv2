/**
 * BookCard Component
 * Displays individual EPUB book in library grid
 */

import { useState } from 'react';
import type { EpubBook } from '@/types/epub';

interface BookCardProps {
  book: EpubBook;
  onDelete: (id: string) => Promise<void>;
  onOpen: (id: string) => void;
}

export function BookCard({ book, onDelete, onOpen }: BookCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Hapus "${book.title}"?`)) return;
    
    setIsDeleting(true);
    try {
      await onDelete(book.id);
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('Gagal hapus: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsDeleting(false);
    }
  };

  const handleClick = () => {
    if (!isDeleting) {
      onOpen(book.id);
    }
  };

  return (
    <div
      className="epub-card"
      onClick={handleClick}
      style={{
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        opacity: isDeleting ? 0.5 : 1,
        position: 'relative',
      }}
    >
      {/* Cover */}
      <div className="epub-cover">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <i className="ti ti-book-2" aria-hidden="true"></i>
        )}
      </div>

      {/* Delete Button */}
      <button
        className="epub-delete-btn"
        onClick={handleDelete}
        disabled={isDeleting}
        title="Hapus buku"
        aria-label={`Hapus ${book.title}`}
      >
        <i
          className={isDeleting ? 'ti ti-loader' : 'ti ti-trash'}
          aria-hidden="true"
          style={isDeleting ? { animation: 'spin 1s linear infinite' } : undefined}
        ></i>
      </button>

      {/* Title & Author */}
      <p className="epub-book-title">{book.title}</p>
      {book.author && <p className="epub-book-author">{book.author}</p>}
    </div>
  );
}
