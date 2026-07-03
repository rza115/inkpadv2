/**
 * Plot-related TypeScript types
 * Corresponds to plot_arcs and foreshadow_log tables
 */

import type { Chapter } from './chapter';

export type ArcStatus = 'planning' | 'ongoing' | 'complete';

export interface Arc {
  id: string;
  project_id: string;
  title: string;
  summary: string | null;
  chapter_start_id: string | null;
  chapter_end_id: string | null;
  status: ArcStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Joined chapter data
  start?: Pick<Chapter, 'id' | 'title'> | null;
  end?: Pick<Chapter, 'id' | 'title'> | null;
}

export type ForeshadowStatus = 'pending' | 'paid';

export interface Foreshadow {
  id: string;
  project_id: string;
  note: string;
  planted_chapter_id: string | null;
  payoff_chapter_id: string | null;
  status: ForeshadowStatus;
  created_at: string;
  updated_at: string;
  // Joined chapter data
  planted?: Pick<Chapter, 'id' | 'title'> | null;
  payoff?: Pick<Chapter, 'id' | 'title'> | null;
}

export interface ArcFormData {
  title: string;
  summary?: string | null;
  chapter_start_id?: string | null;
  chapter_end_id?: string | null;
  status: ArcStatus;
}

export interface ForeshadowFormData {
  note: string;
  planted_chapter_id?: string | null;
  payoff_chapter_id?: string | null;
  status?: ForeshadowStatus;
}
