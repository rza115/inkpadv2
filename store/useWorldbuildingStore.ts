/**
 * Worldbuilding Store
 * Manages worldbuilding entries state and operations
 */
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { WorldEntry, CreateWorldEntryData, UpdateWorldEntryData } from '@/types/worldbuilding';

interface WorldbuildingState {
  entries: WorldEntry[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadEntries: (projectId: string) => Promise<void>;
  createEntry: (projectId: string, data: CreateWorldEntryData) => Promise<WorldEntry>;
  updateEntry: (id: string, data: UpdateWorldEntryData) => Promise<WorldEntry>;
  deleteEntry: (id: string) => Promise<void>;
  clearEntries: () => void;
}

export const useWorldbuildingStore = create<WorldbuildingState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  loadEntries: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('world_entries')
        .select('*')
        .eq('project_id', projectId)
        .order('title', { ascending: true });

      if (error) throw error;
      set({ entries: data || [], loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, loading: false });
      throw error;
    }
  },

  createEntry: async (projectId: string, data: CreateWorldEntryData) => {
    try {
      const supabase = createClient();
      
      const { data: entry, error } = await supabase
        .from('world_entries')
        .insert([{ 
          project_id: projectId,
          title: data.title,
          category: data.category || 'Lainnya',
          content: data.content || null,
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Add to store
      set((state) => ({ 
        entries: [...state.entries, entry].sort((a, b) => a.title.localeCompare(b.title))
      }));
      return entry;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
      throw error;
    }
  },

  updateEntry: async (id: string, data: UpdateWorldEntryData) => {
    try {
      const supabase = createClient();
      
      const { data: entry, error } = await supabase
        .from('world_entries')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update in store
      set((state) => ({
        entries: state.entries
          .map((e) => (e.id === id ? entry : e))
          .sort((a, b) => a.title.localeCompare(b.title)),
      }));
      return entry;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
      throw error;
    }
  },

  deleteEntry: async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('world_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Remove from store
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
      throw error;
    }
  },

  clearEntries: () => {
    set({ entries: [], error: null });
  },
}));