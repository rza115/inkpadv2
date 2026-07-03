/**
 * EPUB Library Page
 * Manage EPUB book collection with upload and reading capabilities
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { BookGrid, UploadProgress } from '@/components/epub';
import { useEpubStore } from '@/store/useEpubStore';
import { useAuthStore } from '@/store/useAuthStore';
import { createClient } from '@/lib/supabase/client';
import { extractEpubMetadata, uploadEpubFile, uploadCoverImage } from '@/lib/epub';

interface UploadState {
  isVisible: boolean;
  progress: number;
  currentFile: string;
  currentIndex: number;
  totalFiles: number;
  statusMessage: string;
}

export default function EpubLibraryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuthStore();
  const { books, isLoading, loadBooks, removeBook } = useEpubStore();
  
  const [uploadState, setUploadState] = useState<UploadState>({
    isVisible: false,
    progress: 0,
    currentFile: '',
    currentIndex: 0,
    totalFiles: 0,
    statusMessage: 'Mengupload…',
  });

  // Load CSS files and JSZip
  useEffect(() => {
    const cssFiles = ['/css/base.css', '/css/layout.css', '/css/components.css', '/css/epub-reader.css'];
    cssFiles.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    // Load JSZip for metadata extraction
    if (!(window as any).JSZip) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Handle upload trigger
  const handleUploadTrigger = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    e.target.value = ''; // Reset input
    
    await processFiles(fileArray);
  };

  // Handle drag & drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []).filter(
        (f) => f.name.toLowerCase().endsWith('.epub') || f.type === 'application/epub+zip'
      );
      if (files.length > 0) {
        processFiles(files);
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Process uploaded files
  const processFiles = async (files: File[]) => {
    if (!user) {
      alert('Anda harus login untuk upload');
      return;
    }

    const supabase = createClient();

    setUploadState({
      isVisible: true,
      progress: 0,
      currentFile: '',
      currentIndex: 0,
      totalFiles: files.length,
      statusMessage: 'Memulai upload…',
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const baseProgress = (i / files.length) * 100;

      try {
        // Update: Extracting metadata
        setUploadState(prev => ({
          ...prev,
          currentIndex: i + 1,
          currentFile: file.name,
          progress: baseProgress,
          statusMessage: 'Mengekstrak metadata…',
        }));

        const metadata = await extractEpubMetadata(file);

        // Update: Uploading EPUB
        setUploadState(prev => ({
          ...prev,
          progress: baseProgress + (0.3 / files.length) * 100,
          statusMessage: 'Mengupload EPUB…',
        }));

        const epubUrl = await uploadEpubFile(file, user.id, supabase);

        // Update: Uploading cover (if exists)
        let coverUrl: string | null = null;
        if (metadata.coverBlob) {
          setUploadState(prev => ({
            ...prev,
            progress: baseProgress + (0.6 / files.length) * 100,
            statusMessage: 'Mengupload cover…',
          }));

          coverUrl = await uploadCoverImage(
            metadata.coverBlob,
            user.id,
            metadata.title || file.name,
            supabase
          );
        }

        // Update: Saving to database
        setUploadState(prev => ({
          ...prev,
          progress: baseProgress + (0.9 / files.length) * 100,
          statusMessage: 'Menyimpan ke database…',
        }));

        await useEpubStore.getState().addBook({
          title: metadata.title || file.name,
          author: metadata.author || null,
          cover_url: coverUrl,
          epub_url: epubUrl,
          file_size: file.size,
        });

      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // Continue with next file
      }
    }

    // Complete
    setUploadState(prev => ({
      ...prev,
      progress: 100,
      statusMessage: 'Selesai!',
    }));

    // Hide overlay after short delay
    setTimeout(() => {
      setUploadState(prev => ({ ...prev, isVisible: false }));
      loadBooks(); // Refresh book list
    }, 400);
  };

  // Handle book deletion
  const handleDeleteBook = async (id: string) => {
    await removeBook(id);
  };

  // Handle open book
  const handleOpenBook = (id: string) => {
    router.push(`/epub-reader?id=${id}`);
  };

  return (
    <Nav layout="project" title="Perpustakaan EPUB">
      <main id="page-main">
        <div className="epub-library-shell">
          {/* Toolbar */}
          <div className="epub-library-toolbar">
            <h2 style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: '17px', 
              fontWeight: 600, 
              margin: 0, 
              flex: 1 
            }}>
              EPUB Library
            </h2>
            <button 
              className="ghost" 
              onClick={handleUploadTrigger}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}
            >
              <i className="ti ti-upload" aria-hidden="true"></i> Upload EPUB
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub,application/epub+zip"
            multiple
            hidden
            onChange={handleFileSelect}
          />

          {/* Book Grid */}
          <BookGrid
            books={books}
            isLoading={isLoading}
            onUploadTrigger={handleUploadTrigger}
            onDeleteBook={handleDeleteBook}
            onOpenBook={handleOpenBook}
          />
        </div>
      </main>

      {/* Upload Progress Overlay */}
      <UploadProgress {...uploadState} />
    </Nav>
  );
}
