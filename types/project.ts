/**
 * Project Type Definitions
 */

export interface Project {
  id: string;
  title: string;
  genre: string | null;
  status: 'ongoing' | 'hiatus' | 'completed';
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export type ProjectCreateInput = Pick<Project, 'title' | 'genre' | 'status' | 'cover_url'>;
export type ProjectUpdateInput = Partial<ProjectCreateInput>;

export type SortKey = 
  | 'updated_desc' 
  | 'title_asc' 
  | 'title_desc' 
  | 'genre_asc' 
  | 'genre_desc' 
  | 'status_asc' 
  | 'created_desc' 
  | 'created_asc';
