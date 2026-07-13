/**
 * Reader utility functions
 * Helper functions for rendering chapter content
 */

import type { Chapter, Illustration, WorldEntry } from '@/types/chapter';
import type { Character } from '@/types/character';

// Chapter content segment types for React rendering
export type ChapterSegment =
  | { type: "text"; content: string }
  | { type: "illustration"; illustration: Illustration };

// HTML escaping utility
export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Build illustration HTML for display
export function buildIllustrationHTML(illustration: Illustration): string {
  let html = '<div class="r-illustration">';
  
  if (illustration.video_url) {
    html += `<video src="${illustration.video_url}" autoplay muted loop playsinline></video>`;
  } else if (illustration.image_url) {
    const caption = illustration.caption ? escapeHtml(illustration.caption) : '';
    html += `<img src="${illustration.image_url}" alt="${caption}" loading="lazy" />`;
  }
  
  if (illustration.caption) {
    html += `<p class="r-caption">${escapeHtml(illustration.caption)}</p>`;
  }
  
  html += '</div>';
  return html;
}

// Create placeholder for inline illustration
export function createInlineIllustrationPlaceholder(illustration: Illustration): {
  placeholder: string;
  html: string;
} {
  const uuid = Math.random().toString(36).substring(2, 11);
  const placeholder = `|||ILLUS_${uuid}|||`;
  const html = buildIllustrationHTML(illustration);
  
  return { placeholder, html };
}

// Build chapter navigation HTML
export function buildChapterNavigation(
  chapters: Chapter[],
  currentIndex: number
): string {
  const prev = chapters[currentIndex - 1];
  const next = chapters[currentIndex + 1];
  
  if (!prev && !next) return '';
  
  let nav = '<div class="r-chapter-nav">';
  
  if (prev) {
    const prevTitle = escapeHtml(prev.title || 'Bab sebelumnya');
    nav += `<button class="r-nav-btn prev" data-idx="${currentIndex - 1}">← ${prevTitle}</button>`;
  }
  
  if (next) {
    const nextTitle = escapeHtml(next.title || 'Bab berikutnya');
    nav += `<button class="r-nav-btn next" data-idx="${currentIndex + 1}">${nextTitle} →</button>`;
  }
  
  nav += '</div>';
  return nav;
}

// Build crosslink resolver function
export function buildCrosslinkResolver(
  characters: Character[],
  worldEntries: WorldEntry[]
) {
  return (name: string): { type: 'character' | 'world'; id: string } | null => {
    const lowerName = name.toLowerCase();
    
    // Check characters
    const char = characters.find((c) => {
      if (c.name.toLowerCase() === lowerName) return true;
      
      // Check aliases
      if (c.aliases) {
        const aliases = c.aliases.split(/[,，]/).map((a) => a.trim().toLowerCase());
        if (aliases.includes(lowerName)) return true;
      }
      
      return false;
    });
    
    if (char) return { type: 'character', id: char.id };
    
    // Check world entries
    const world = worldEntries.find((w) => w.title.toLowerCase() === lowerName);
    if (world) return { type: 'world', id: world.id };
    
    return null;
  };
}

// Split chapter content into segments (text + illustrations) for React rendering
export function splitChapterContent(
  content: string,
  illustrations: Illustration[]
): { segments: ChapterSegment[]; usedIndices: Set<number> } {
  const illustrationsMap = new Map<number, Illustration>();
  illustrations.forEach((il, i) => illustrationsMap.set(i, il));

  const markerRegex = /\{\{illus:(\d+)\}\}/g;
  const usedIndices = new Set<number>();
  const segments: ChapterSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markerRegex.exec(content)) !== null) {
    const textChunk = content.substring(lastIndex, match.index);
    if (textChunk.trim()) segments.push({ type: "text", content: textChunk });

    const illusIndex = parseInt(match[1], 10);
    const illustration = illustrationsMap.get(illusIndex);
    if (illustration) {
      segments.push({ type: "illustration", illustration });
      usedIndices.add(illusIndex);
    }
    lastIndex = match.index + match[0].length;
  }

  const remainder = content.substring(lastIndex);
  if (remainder.trim()) segments.push({ type: "text", content: remainder });

  return { segments, usedIndices };
}

// Convert character/world names in text to markdown links for crosslink rendering
export function linkifyCrosslinks(
  text: string,
  resolver: (name: string) => { type: 'character' | 'world'; id: string } | null
): string {
  // Build a regex pattern from all known names
  // For simplicity, we'll scan word by word and check against resolver
  // This is a basic implementation - can be optimized with a trie or similar
  
  // Split into words while preserving punctuation
  const words = text.split(/(\s+|[.,!?;:—–-])/);
  
  return words.map(word => {
    const trimmed = word.trim();
    if (!trimmed || /^\s+$/.test(word) || /^[.,!?;:—–-]$/.test(word)) {
      return word; // Keep whitespace and punctuation as-is
    }
    
    const resolved = resolver(trimmed);
    if (resolved) {
      return `[${word}](#xlink:${resolved.type}:${resolved.id})`;
    }
    
    return word;
  }).join('');
}

// Process chapter content with illustrations
export function processChapterContent(
  content: string,
  illustrations: Illustration[]
): {
  processedContent: string;
  pendingIllustrations: Record<string, string>;
  usedIndices: Set<number>;
} {
  // Map illustrations by index
  const illustrationsMap = new Map<number, Illustration>();
  illustrations.forEach((il, i) => {
    illustrationsMap.set(i, il);
  });

  const markerRegex = /\{\{illus:(\d+)\}\}/g;
  const pendingIllustrations: Record<string, string> = {};
  const usedIndices = new Set<number>();
  let processedContent = '';
  let lastIndex = 0;

  // Process content and inject illustration placeholders
  let match;
  while ((match = markerRegex.exec(content)) !== null) {
    const illusIndex = parseInt(match[1], 10);
    const illustration = illustrationsMap.get(illusIndex);
    
    // Add content before marker
    processedContent += content.substring(lastIndex, match.index);
    
    // Inject illustration placeholder if valid
    if (illustration) {
      const { placeholder, html } = createInlineIllustrationPlaceholder(illustration);
      processedContent += placeholder;
      pendingIllustrations[placeholder] = html;
      usedIndices.add(illusIndex);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining content
  processedContent += content.substring(lastIndex);

  return { processedContent, pendingIllustrations, usedIndices };
}

// Replace placeholders in rendered HTML
export function replacePlaceholders(
  html: string,
  pendingIllustrations: Record<string, string>
): string {
  let result = html;
  
  Object.keys(pendingIllustrations).forEach((placeholder) => {
    result = result.split(placeholder).join(pendingIllustrations[placeholder]);
  });
  
  return result;
}

// Get remaining (unused) illustrations
export function getRemainingIllustrations(
  illustrations: Illustration[],
  usedIndices: Set<number>
): Illustration[] {
  return illustrations.filter((_, i) => !usedIndices.has(i));
}
