/**
 * Reader-related TypeScript types
 */

export type FontSize = 'r-fs-sm' | 'r-fs-md' | 'r-fs-lg' | 'r-fs-xl';
export type FontFamily = 'literata' | 'lora' | 'inter' | 'nunito';
export type TextAlign = 'left' | 'right' | 'justify';
export type ColumnWidth = 'narrow' | '' | 'wide';

export interface ReaderPreferences {
  fontIdx: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  widthIdx: number;
}

export interface ReaderPosition {
  chapterIndex: number;
  scrollY: number;
  chapterTitle: string;
  timestamp: number;
}

export interface IllustrationPlaceholder {
  [key: string]: string;
}
