// lib/epub.ts
// EPUB metadata extraction utilities
// Minimal parser using DOMParser (no epub.js dependency for upload step)

import type { EpubMetadata } from '@/types/epub';

/**
 * Wait for JSZip to be loaded via CDN script.
 * Polls with timeout to avoid race conditions.
 */
let jszipPromise: Promise<any> | null = null;

function getJSZip(): Promise<any> {
  if (jszipPromise) return jszipPromise;
  jszipPromise = new Promise((resolve, reject) => {
    if ((window as any).JSZip) {
      resolve((window as any).JSZip);
      return;
    }
    const maxWait = 15_000;
    const pollMs = 50;
    const start = Date.now();
    const check = () => {
      if ((window as any).JSZip) {
        resolve((window as any).JSZip);
      } else if (Date.now() - start > maxWait) {
        reject(new Error('JSZip failed to load within timeout'));
      } else {
        setTimeout(check, pollMs);
      }
    };
    setTimeout(check, pollMs);
  });
  return jszipPromise;
}

/**
 * Extract metadata from EPUB file
 * Requires JSZip to be loaded (load via CDN in components that use this)
 */
export async function extractEpubMetadata(file: File): Promise<EpubMetadata> {
  const defaultMeta: EpubMetadata = {
    title: file.name.replace(/\.epub$/i, ''),
    author: null,
    coverBlob: null,
  };

  try {
    const JSZip = await getJSZip();
    const zip = await JSZip.loadAsync(file);

    // 1. Find container.xml → path to OPF
    const containerXml = await zip.file('META-INF/container.xml')?.async('string');
    if (!containerXml) return defaultMeta;

    const containerDoc = new DOMParser().parseFromString(containerXml, 'application/xml');
    const opfPath = containerDoc.querySelector('rootfile')?.getAttribute('full-path');
    if (!opfPath) return defaultMeta;

    // 2. Parse OPF
    const opfXml = await zip.file(opfPath)?.async('string');
    if (!opfXml) return defaultMeta;

    const opfDoc = new DOMParser().parseFromString(opfXml, 'application/xml');
    const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

    // Extract title & author
    const titleEl = opfDoc.querySelector('metadata > title, metadata > *|title');
    const creatorEl = opfDoc.querySelector('metadata > creator, metadata > *|creator');
    
    if (titleEl?.textContent) {
      defaultMeta.title = titleEl.textContent.trim();
    }
    
    if (creatorEl?.textContent) {
      defaultMeta.author = creatorEl.textContent.trim();
    }

    // Extract cover image
    // Method 1: meta name="cover"
    const coverId = opfDoc.querySelector('meta[name="cover"]')?.getAttribute('content');
    let coverItem = coverId
      ? opfDoc.querySelector(`manifest > item[id="${coverId}"]`)
      : null;
    
    // Method 2: item properties="cover-image"
    if (!coverItem) {
      coverItem = opfDoc.querySelector('manifest > item[properties~="cover-image"]');
    }

    if (coverItem) {
      const href = coverItem.getAttribute('href');
      if (href) {
        const fullPath = opfDir + href;
        const coverFile = zip.file(fullPath) || zip.file(decodeURIComponent(fullPath));
        
        if (coverFile) {
          const arr = await coverFile.async('arraybuffer');
          const mime = href.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          defaultMeta.coverBlob = new Blob([arr], { type: mime });
        }
      }
    }

    return defaultMeta;
  } catch (err) {
    console.warn('EPUB metadata extraction failed (non-critical):', err);
    return defaultMeta;
  }
}

/**
 * Upload EPUB file to Supabase storage
 */
export async function uploadEpubFile(
  file: File,
  userId: string,
  supabase: any
): Promise<string> {
  const timestamp = Date.now();
  const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${userId}/${timestamp}_${sanitized}`;

  const { data, error } = await supabase.storage
    .from('epub')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('epub')
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Upload cover image to Supabase storage
 */
export async function uploadCoverImage(
  coverBlob: Blob,
  userId: string,
  bookTitle: string,
  supabase: any
): Promise<string> {
  const timestamp = Date.now();
  const ext = coverBlob.type === 'image/png' ? 'png' : 'jpg';
  const sanitized = bookTitle.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${userId}/${timestamp}_${sanitized}_cover.${ext}`;

  const { data, error } = await supabase.storage
    .from('epub')
    .upload(path, coverBlob, {
      cacheControl: '3600',
      upsert: false,
      contentType: coverBlob.type,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('epub')
    .getPublicUrl(path);

  return urlData.publicUrl;
}
