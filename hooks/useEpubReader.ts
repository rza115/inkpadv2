/**
 * useEpubReader Hook
 * Manages epub.js lifecycle and provides reader controls
 */

import { useEffect, useState, useCallback, useRef } from 'react';

// epub.js types (basic - library has limited TS support)
interface Book {
  ready: Promise<void>;
  destroy(): void;
  loaded: {
    navigation: Promise<Navigation>;
  };
  renderTo(element: string, options: any): Rendition;
  packaging?: {
    metadata?: {
      title?: string;
    };
  };
}

interface Rendition {
  display(target?: string): Promise<void>;
  next(): Promise<void>;
  prev(): Promise<void>;
  destroy(): void;
  themes: {
    register(name: string, styles: Record<string, any>): void;
    select(name: string): void;
    fontSize(size: string): void;
  };
  on(event: string, callback: (...args: any[]) => void): void;
  flow(flow: 'paginated' | 'scrolled'): void;
  spread(spread: 'none' | 'auto'): void;
}

interface Navigation {
  toc: NavItem[];
}

export interface NavItem {
  id: string;
  href: string;
  label: string;
  subitems?: NavItem[];
}

export interface ReaderLocation {
  start: {
    cfi: string;
    displayed: { page: number; total: number };
    percentage: number;
  };
  end: {
    cfi: string;
    displayed: { page: number; total: number };
    percentage: number;
  };
}

interface UseEpubReaderOptions {
  bookUrl: string;
  containerId: string;
  initialCfi?: string;
  fontSize?: number;
  flow?: 'paginated' | 'scrolled';
  theme?: 'light' | 'dark' | 'sepia';
  onLocationChange?: (location: ReaderLocation) => void;
}

export function useEpubReader({
  bookUrl,
  containerId,
  initialCfi,
  fontSize = 16,
  flow = 'paginated',
  theme = 'light',
  onLocationChange,
}: UseEpubReaderOptions) {
  const [book, setBook] = useState<Book | null>(null);
  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [currentLocation, setCurrentLocation] = useState<ReaderLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('');
  
  const initializingRef = useRef(false);

  // Initialize epub.js
  useEffect(() => {
    if (!bookUrl || !containerId || initializingRef.current) return;
    
    initializingRef.current = true;
    setIsLoading(true);
    setError(null);

    let bookInstance: Book | null = null;
    let renditionInstance: Rendition | null = null;

    const initReader = async () => {
      try {
        // Check if ePub is available
        if (typeof window === 'undefined' || !(window as any).ePub) {
          throw new Error('epub.js library not loaded');
        }

        const ePub = (window as any).ePub;
        
        // Create book instance
        bookInstance = ePub(bookUrl);
        setBook(bookInstance);

        // Wait for book to be ready
        if (!bookInstance) {
          throw new Error('Failed to create book instance');
        }
        
        await bookInstance.ready;

        // Get container element
        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error(`Container element #${containerId} not found`);
        }

        // Create rendition
        renditionInstance = bookInstance.renderTo(containerId, {
          width: '100%',
          height: '100%',
          flow: flow,
          spread: 'none',
        });

        if (!renditionInstance) {
          throw new Error('Failed to create rendition');
        }

        setRendition(renditionInstance);

        // Register themes
        renditionInstance.themes.register('light', {
          body: {
            color: '#1a1a1a',
            background: '#ffffff',
          },
        });

        renditionInstance.themes.register('dark', {
          body: {
            color: '#e0e0e0',
            background: '#1a1a1a',
          },
        });

        renditionInstance.themes.register('sepia', {
          body: {
            color: '#5c4a3a',
            background: '#f4ecd8',
          },
        });

        // Apply initial settings
        renditionInstance.themes.select(theme);
        renditionInstance.themes.fontSize(`${fontSize}px`);

        // Display book (at saved position or beginning)
        await renditionInstance.display(initialCfi || undefined);

        // Setup location change listener
        renditionInstance.on('relocated', (location: ReaderLocation) => {
          setCurrentLocation(location);
          onLocationChange?.(location);
        });

        // Load TOC
        const navigation = await bookInstance.loaded.navigation;
        setToc(navigation.toc);

        // Get book title from metadata
        if ((bookInstance as any).packaging?.metadata?.title) {
          setBookTitle((bookInstance as any).packaging.metadata.title);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize epub reader:', err);
        setError(err instanceof Error ? err.message : 'Failed to load book');
        setIsLoading(false);
      }
    };

    initReader();

    // Cleanup
    return () => {
      initializingRef.current = false;
      if (renditionInstance) {
        try {
          renditionInstance.destroy();
        } catch (e) {
          console.warn('Rendition cleanup error:', e);
        }
      }
      if (bookInstance) {
        try {
          bookInstance.destroy();
        } catch (e) {
          console.warn('Book cleanup error:', e);
        }
      }
    };
  }, [bookUrl, containerId, initialCfi, fontSize, flow, theme, onLocationChange]);

  // Navigation functions
  const nextPage = useCallback(() => {
    if (rendition) {
      rendition.next();
    }
  }, [rendition]);

  const prevPage = useCallback(() => {
    if (rendition) {
      rendition.prev();
    }
  }, [rendition]);

  const goToLocation = useCallback((cfi: string) => {
    if (rendition) {
      rendition.display(cfi);
    }
  }, [rendition]);

  // Settings functions
  const updateFontSize = useCallback((size: number) => {
    if (rendition) {
      rendition.themes.fontSize(`${size}px`);
    }
  }, [rendition]);

  const updateTheme = useCallback((newTheme: 'light' | 'dark' | 'sepia') => {
    if (rendition) {
      rendition.themes.select(newTheme);
    }
  }, [rendition]);

  const updateFlow = useCallback((newFlow: 'paginated' | 'scrolled') => {
    if (rendition) {
      rendition.flow(newFlow);
    }
  }, [rendition]);

  return {
    book,
    rendition,
    toc,
    currentLocation,
    isLoading,
    error,
    bookTitle,
    // Navigation
    nextPage,
    prevPage,
    goToLocation,
    // Settings
    updateFontSize,
    updateTheme,
    updateFlow,
  };
}
