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
