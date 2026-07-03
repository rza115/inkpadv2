/**
 * Reader Store
 * Manages reader preferences and reading position
 */

import { create } from 'zustand';
import type { ReaderPreferences, ReaderPosition, FontFamily, TextAlign } from '@/types/reader';

const READER_PREF_KEY = 'inkpad:reader-prefs';
const FONT_STEPS = ['r-fs-sm', 'r-fs-md', 'r-fs-lg', 'r-fs-xl'];
const FONT_FAMILIES: FontFamily[] = ['literata', 'lora', 'inter', 'nunito'];
const TEXT_ALIGNS: TextAlign[] = ['left', 'right', 'justify'];
const WIDTH_STEPS = ['narrow', '', 'wide'];

interface ReaderState {
  // Preferences
  preferences: ReaderPreferences;
  
  // Active reading state
  activeChapterIndex: number;
  tocCollapsed: boolean;
  
  // Actions
  setFontSize: (direction: 'increase' | 'decrease') => void;
  setFontFamily: (family: FontFamily) => void;
  setTextAlign: (align: TextAlign) => void;
  cycleWidth: () => void;
  setActiveChapter: (index: number) => void;
  toggleTOC: () => void;
  setTOCCollapsed: (collapsed: boolean) => void;
  
  // Position tracking
  savePosition: (projectId: string, chapterIndex: number, scrollY: number, chapterTitle: string) => void;
  loadPosition: (projectId: string) => ReaderPosition | null;
  
  // Helpers
  getFontSizeClass: () => string;
  getWidthClass: () => string;
  
  // Reset
  reset: () => void;
}

// Load preferences from localStorage
const loadPreferences = (): ReaderPreferences => {
  if (typeof window === 'undefined') {
    return {
      fontIdx: 1,
      fontFamily: 'literata',
      textAlign: 'left',
      widthIdx: 1,
    };
  }

  try {
    const saved = localStorage.getItem(READER_PREF_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return normalizePreferences(parsed);
    }
  } catch (error) {
    console.error('Failed to load reader preferences:', error);
  }

  return {
    fontIdx: 1,
    fontFamily: 'literata',
    textAlign: 'left',
    widthIdx: 1,
  };
};

// Normalize preferences to ensure valid values
const normalizePreferences = (prefs: Partial<ReaderPreferences>): ReaderPreferences => {
  const fontIdx = clampIndex(prefs.fontIdx ?? 1, FONT_STEPS.length, 1);
  const fontFamily = FONT_FAMILIES.includes(prefs.fontFamily as FontFamily)
    ? (prefs.fontFamily as FontFamily)
    : 'literata';
  const textAlign = TEXT_ALIGNS.includes(prefs.textAlign as TextAlign)
    ? (prefs.textAlign as TextAlign)
    : 'left';
  const widthIdx = clampIndex(prefs.widthIdx ?? 1, WIDTH_STEPS.length, 1);

  return { fontIdx, fontFamily, textAlign, widthIdx };
};

const clampIndex = (value: number | undefined, len: number, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.floor(value), 0), len - 1);
};

// Save preferences to localStorage
const savePreferences = (prefs: ReaderPreferences) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(READER_PREF_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save reader preferences:', error);
  }
};

// Position storage helpers
const getPositionKey = (projectId: string) => `inkpad:reader:lastPosition:${projectId}`;

export const useReaderStore = create<ReaderState>((set, get) => ({
  // Initial state
  preferences: loadPreferences(),
  activeChapterIndex: 0,
  tocCollapsed: typeof window !== 'undefined' && window.innerWidth < 760,

  // ── Preference Actions ──
  setFontSize: (direction: 'increase' | 'decrease') => {
    const { preferences } = get();
    let newIdx = preferences.fontIdx;

    if (direction === 'increase') {
      newIdx = Math.min(FONT_STEPS.length - 1, newIdx + 1);
    } else {
      newIdx = Math.max(0, newIdx - 1);
    }

    const newPrefs = { ...preferences, fontIdx: newIdx };
    set({ preferences: newPrefs });
    savePreferences(newPrefs);
  },

  setFontFamily: (family: FontFamily) => {
    const { preferences } = get();
    const newPrefs = { ...preferences, fontFamily: family };
    set({ preferences: newPrefs });
    savePreferences(newPrefs);
  },

  setTextAlign: (align: TextAlign) => {
    const { preferences } = get();
    const newPrefs = { ...preferences, textAlign: align };
    set({ preferences: newPrefs });
    savePreferences(newPrefs);
  },

  cycleWidth: () => {
    const { preferences } = get();
    const newIdx = (preferences.widthIdx + 1) % WIDTH_STEPS.length;
    const newPrefs = { ...preferences, widthIdx: newIdx };
    set({ preferences: newPrefs });
    savePreferences(newPrefs);
  },

  // ── Chapter Navigation ──
  setActiveChapter: (index: number) => {
    set({ activeChapterIndex: index });
  },

  // ── TOC Management ──
  toggleTOC: () => {
    set((state) => ({ tocCollapsed: !state.tocCollapsed }));
  },

  setTOCCollapsed: (collapsed: boolean) => {
    set({ tocCollapsed: collapsed });
  },

  // ── Position Tracking ──
  savePosition: (projectId: string, chapterIndex: number, scrollY: number, chapterTitle: string) => {
    if (typeof window === 'undefined') return;

    try {
      const position: ReaderPosition = {
        chapterIndex,
        scrollY,
        chapterTitle,
        timestamp: Date.now(),
      };
      localStorage.setItem(getPositionKey(projectId), JSON.stringify(position));
    } catch (error) {
      console.error('Failed to save reading position:', error);
    }
  },

  loadPosition: (projectId: string): ReaderPosition | null => {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem(getPositionKey(projectId));
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load reading position:', error);
    }

    return null;
  },

  // ── Helpers ──
  getFontSizeClass: () => {
    const { preferences } = get();
    return FONT_STEPS[preferences.fontIdx];
  },

  getWidthClass: () => {
    const { preferences } = get();
    return WIDTH_STEPS[preferences.widthIdx];
  },

  // ── Reset ──
  reset: () => {
    set({
      activeChapterIndex: 0,
      tocCollapsed: typeof window !== 'undefined' && window.innerWidth < 760,
    });
  },
}));

// Export constants for use in components
export { FONT_FAMILIES, TEXT_ALIGNS };
