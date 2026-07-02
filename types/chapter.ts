/**
 * Chapter Type Definitions
 */

export interface Chapter {
  id: string;
  project_id: string;
  title: string;
  content: string;
  status: 'draft' | 'revisi' | 'final';
  order_index: number;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterVersion {
  id: string;
  chapter_id: string;
  version_number: number;
  title: string;
  content: string;
  word_count: number;
  label: string | null;
  created_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  image_url: string | null;
}

export interface WorldEntry {
  id: string;
  project_id: string;
  title: string;
}

export interface Illustration {
  id: string;
  chapter_id: string;
  image_url: string | null;
  video_url: string | null;
  caption: string | null;
  order_index: number;
}

export interface Note {
  id: string;
  project_id: string;
  content: string;
  assigned_chapter_id: string | null;
  assigned_character_id: string | null;
  assigned_world_id: string | null;
  created_at: string;
}