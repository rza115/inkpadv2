/**
 * BookGrid Component
 * Grid layout for EPUB library with upload card and book cards
 */

import { BookCard } from './BookCard';
import { UploadCard } from './UploadCard';
import type { EpubBook } from '@/types/epub';

interface BookGridProps {
  books: EpubBook[];
  isLoading: boolean;
  onUploadTrigger: () => void;
  onDeleteBook: (id: string) => Promise<void>;
  onOpenBook: (id: string) => void;
}

export function BookGrid({
  books,
  isLoading,
  onUploadTrigger,
  onDeleteBook,
  onOpenBook,
}: BookGridProps) {
  return (
    <div className="epub-grid">
      {/* Upload Card - Always first */}
      <UploadCard onTrigger={onUploadTrigger} />

      {/* Loading State */}
      {isLoading && books.length === 0 && (
        <p
          className="muted"
          style={{
            gridColumn: '1/-1',
            padding: '32px 0',
            textAlign: 'center',
          }}
        >
          Memuat perpustakaan…
        </p>
      )}

      {/* Empty State */}
      {!isLoading && books.length === 0 && (
        <p
          className="muted"
          style={{
            gridColumn: '1/-1',
            padding: '32px 0',
            textAlign: 'center',
          }}
        >
          Belum ada buku. Upload file .epub buat mulai.
        </p>
      )}

      {/* Book Cards */}
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onDelete={onDeleteBook}
          onOpen={onOpenBook}
        />
      ))}
    </div>
  );
}
