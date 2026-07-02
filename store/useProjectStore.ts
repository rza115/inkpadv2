/**
 * Project Store
 * Zustand store for project management
 */
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Project, ProjectCreateInput, ProjectUpdateInput, SortKey } from '@/types/project';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  currentSort: SortKey;
  
  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (input: ProjectCreateInput) => Promise<Project>;
  updateProject: (id: string, input: ProjectUpdateInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setSort: (sortKey: SortKey) => void;
  getSortedProjects: () => Project[];
}

const STATUS_ORDER = { ongoing: 0, hiatus: 1, completed: 2 };
const SORT_STORAGE_KEY = 'inkpad-hub-sort';

// Load saved sort preference
const getSavedSort = (): SortKey => {
  if (typeof window === 'undefined') return 'updated_desc';
  const saved = localStorage.getItem(SORT_STORAGE_KEY);
  return (saved as SortKey) || 'updated_desc';
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  currentSort: getSavedSort(),

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      set({ projects: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createProject: async (input: ProjectCreateInput) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        title: input.title,
        genre: input.genre || null,
        status: input.status || 'ongoing',
        cover_url: input.cover_url || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Add to local state
    set((state) => ({
      projects: [data, ...state.projects]
    }));
    
    return data;
  },

  updateProject: async (id: string, input: ProjectUpdateInput) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update local state
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? data : p))
    }));
    
    return data;
  },

  deleteProject: async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Remove from local state
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id)
    }));
  },

  setSort: (sortKey: SortKey) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SORT_STORAGE_KEY, sortKey);
    }
    set({ currentSort: sortKey });
  },

  getSortedProjects: () => {
    const { projects, currentSort } = get();
    const sorted = [...projects];
    
    const byTitle = (a: Project, b: Project) => 
      a.title.localeCompare(b.title, 'id', { sensitivity: 'base' });
    
    const byDate = (field: 'created_at' | 'updated_at', asc: boolean) => 
      (a: Project, b: Project) => {
        const diff = new Date(a[field]).getTime() - new Date(b[field]).getTime();
        return asc ? diff : -diff;
      };
    
    const byGenre = (asc: boolean) => (a: Project, b: Project) => {
      const ga = a.genre || '';
      const gb = b.genre || '';
      if (!ga && !gb) return byTitle(a, b);
      if (!ga) return 1;
      if (!gb) return -1;
      const diff = ga.localeCompare(gb, 'id', { sensitivity: 'base' });
      if (diff === 0) return byTitle(a, b);
      return asc ? diff : -diff;
    };

    switch (currentSort) {
      case 'title_asc':
        return sorted.sort(byTitle);
      case 'title_desc':
        return sorted.sort((a, b) => byTitle(b, a));
      case 'genre_asc':
        return sorted.sort(byGenre(true));
      case 'genre_desc':
        return sorted.sort(byGenre(false));
      case 'status_asc':
        return sorted.sort((a, b) => {
          const diff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
          return diff || byTitle(a, b);
        });
      case 'created_asc':
        return sorted.sort(byDate('created_at', true));
      case 'created_desc':
        return sorted.sort(byDate('created_at', false));
      case 'updated_desc':
      default:
        return sorted.sort(byDate('updated_at', false));
    }
  }
}));
