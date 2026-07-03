// types/epub.ts
// Type definitions for EPUB library feature

export interface EpubBook {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  epub_url: string;
  cover_url: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface EpubMetadata {
  title: string;
  author: string | null;
  coverBlob: Blob | null;
}

export interface EpubReaderPosition {
  bookId: string;
  cfi: string;
  percentage: number;
  timestamp: number;
}

export interface EpubReaderSettings {
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  paragraphIndent: number;
  theme: 'ep-light' | 'ep-sepia' | 'ep-dark';
  flowMode: 'paginated' | 'scrolled';
}
