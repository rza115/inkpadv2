/**
 * Notes Store
 * Manages notes state and operations
 */
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Note, CreateNoteData, UpdateNoteData } from '@/types/note';

interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadNotes: (projectId: string) => Promise<void>;
  createNote: (projectId: string, data: CreateNoteData) => Promise<Note>;
  updateNote: (id: string, data: UpdateNoteData) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  clearNotes: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  loadNotes: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('quick_notes')
        .select(`
          *,
          chapter:assigned_chapter_id(id, title),
          character:assigned_character_id(id, name),
          world:assigned_world_id(id, title)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ notes: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createNote: async (projectId: string, data: CreateNoteData) => {
    try {
      const supabase = createClient();
      const { data: note, error } = await supabase
        .from('quick_notes')
        .insert([{ project_id: projectId, ...data }])
        .select(`
          *,
          chapter:assigned_chapter_id(id, title),
          character:assigned_character_id(id, name),
          world:assigned_world_id(id, title)
        `)
        .single();

      if (error) throw error;
      
      // Add to store
      set((state) => ({ notes: [note, ...state.notes] }));
      return note;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateNote: async (id: string, data: UpdateNoteData) => {
    try {
      const supabase = createClient();
      const { data: note, error } = await supabase
        .from('quick_notes')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          chapter:assigned_chapter_id(id, title),
          character:assigned_character_id(id, name),
          world:assigned_world_id(id, title)
        `)
        .single();

      if (error) throw error;
      
      // Update in store
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? note : n)),
      }));
      return note;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteNote: async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('quick_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Remove from store
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  clearNotes: () => {
    set({ notes: [], error: null });
  },
}));