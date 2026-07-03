// store/useEpubStore.ts
// Zustand store for EPUB library management

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { EpubBook, EpubMetadata, EpubReaderPosition, EpubReaderSettings } from '@/types/epub';

const supabase = createClient();

interface EpubState {
  // Library state
  books: EpubBook[];
  isLoading: boolean;
  error: string | null;
  
  // Reader state
  currentBook: EpubBook | null;
  readerPosition: EpubReaderPosition | null;
  readerSettings: EpubReaderSettings;
  
  // Library actions
  loadBooks: () => Promise<void>;
  addBook: (fields: Partial<EpubBook>) => Promise<EpubBook>;
  removeBook: (id: string) => Promise<void>;
  
  // Reader actions
  setCurrentBook: (book: EpubBook | null) => void;
  saveReaderPosition: (position: EpubReaderPosition) => void;
  loadReaderPosition: (bookId: string) => EpubReaderPosition | null;
  updateReaderSettings: (settings: Partial<EpubReaderSettings>) => void;
  resetReaderSettings: () => void;
}

const DEFAULT_READER_SETTINGS: EpubReaderSettings = {
  fontSize: 100,
  lineHeight: 1.6,
  paragraphSpacing: 1.0,
  textAlign: 'justify',
  paragraphIndent: 1.5,
  theme: 'ep-dark',
  flowMode: 'paginated',
};

// Load settings from localStorage
const loadSettingsFromStorage = (): EpubReaderSettings => {
  if (typeof window === 'undefined') return DEFAULT_READER_SETTINGS;
  
  try {
    const stored = localStorage.getItem('inkpad:epub:settings');
    if (stored) {
      return { ...DEFAULT_READER_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load EPUB settings from localStorage', e);
  }
  
  return DEFAULT_READER_SETTINGS;
};

// Save settings to localStorage
const saveSettingsToStorage = (settings: EpubReaderSettings) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('inkpad:epub:settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save EPUB settings to localStorage', e);
  }
};

export const useEpubStore = create<EpubState>((set, get) => ({
  // Initial state
  books: [],
  isLoading: false,
  error: null,
  currentBook: null,
  readerPosition: null,
  readerSettings: loadSettingsFromStorage(),
  
  // Load all books
  loadBooks: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('epub_books')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ books: data || [], isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load books';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
  
  // Add new book
  addBook: async (fields) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('epub_books')
        .insert([fields])
        .select()
        .single();
      
      if (error) throw error;
      
      // Add to local state
      set(state => ({
        books: [data, ...state.books],
        isLoading: false,
      }));
      
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add book';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
  
  // Remove book
  removeBook: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get book to find files to delete
      const book = get().books.find(b => b.id === id);
      
      if (book) {
        // Delete files from storage
        if (book.epub_url) {
          const epubPath = book.epub_url.split('/').slice(-2).join('/');
          await supabase.storage.from('epub').remove([epubPath]);
        }
        
        if (book.cover_url) {
          const coverPath = book.cover_url.split('/').slice(-2).join('/');
          await supabase.storage.from('epub').remove([coverPath]);
        }
      }
      
      // Delete from database
      const { error } = await supabase
        .from('epub_books')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove from local state
      set(state => ({
        books: state.books.filter(b => b.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove book';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
  
  // Reader actions
  setCurrentBook: (book) => {
    set({ currentBook: book });
  },
  
  saveReaderPosition: (position) => {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `inkpad:epub:position:${position.bookId}`;
      localStorage.setItem(key, JSON.stringify(position));
      set({ readerPosition: position });
    } catch (e) {
      console.warn('Failed to save reader position', e);
    }
  },
  
  loadReaderPosition: (bookId) => {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = `inkpad:epub:position:${bookId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const position = JSON.parse(stored);
        set({ readerPosition: position });
        return position;
      }
    } catch (e) {
      console.warn('Failed to load reader position', e);
    }
    
    return null;
  },
  
  updateReaderSettings: (newSettings) => {
    const settings = { ...get().readerSettings, ...newSettings };
    saveSettingsToStorage(settings);
    set({ readerSettings: settings });
  },
  
  resetReaderSettings: () => {
    saveSettingsToStorage(DEFAULT_READER_SETTINGS);
    set({ readerSettings: DEFAULT_READER_SETTINGS });
  },
}));
