/**
 * Worldbuilding Types
 * Type definitions for worldbuilding entries
 */

export interface WorldEntry {
  id: string;
  project_id: string;
  category: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorldEntryData {
  title: string;
  category?: string;
  content?: string | null;
}

export interface UpdateWorldEntryData {
  title?: string;
  category?: string;
  content?: string | null;
}

export const DEFAULT_CATEGORIES = [
  'Lokasi',
  'Karakter',
  'Sistem Power',
  'Sejarah',
  'Organisasi',
  'Artefak',
  'Lainnya',
] as const;