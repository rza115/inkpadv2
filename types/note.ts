/**
 * Note Types
 */

export interface Note {
  id: string;
  project_id: string;
  content: string;
  assigned_chapter_id: string | null;
  assigned_character_id: string | null;
  assigned_world_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data from relations
  chapter?: {
    id: string;
    title: string;
  };
  character?: {
    id: string;
    name: string;
  };
  world?: {
    id: string;
    title: string;
  };
}

export interface CreateNoteData {
  content: string;
  assigned_chapter_id?: string | null;
  assigned_character_id?: string | null;
  assigned_world_id?: string | null;
}

export interface UpdateNoteData {
  content?: string;
  assigned_chapter_id?: string | null;
  assigned_character_id?: string | null;
  assigned_world_id?: string | null;
}