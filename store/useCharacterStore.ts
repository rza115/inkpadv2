/**
 * Character Store
 * Manages character state and operations
 */
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { uploadFile } from '@/lib/storage';
import type { Character, CreateCharacterData, UpdateCharacterData } from '@/types/character';

interface CharacterState {
  characters: Character[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadCharacters: (projectId: string) => Promise<void>;
  createCharacter: (projectId: string, data: CreateCharacterData, photoFile?: File) => Promise<Character>;
  updateCharacter: (id: string, data: UpdateCharacterData, photoFile?: File) => Promise<Character>;
  deleteCharacter: (id: string) => Promise<void>;
  clearCharacters: () => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  loading: false,
  error: null,

  loadCharacters: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) throw error;
      set({ characters: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createCharacter: async (projectId: string, data: CreateCharacterData, photoFile?: File) => {
    try {
      const supabase = createClient();
      
      // Upload photo if provided
      let imageUrl = data.image_url || null;
      if (photoFile) {
        imageUrl = await uploadFile('characters', photoFile);
      }

      const { data: character, error } = await supabase
        .from('characters')
        .insert([{ 
          project_id: projectId, 
          ...data,
          image_url: imageUrl,
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Add to store
      set((state) => ({ 
        characters: [...state.characters, character].sort((a, b) => a.name.localeCompare(b.name))
      }));
      return character;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateCharacter: async (id: string, data: UpdateCharacterData, photoFile?: File) => {
    try {
      const supabase = createClient();
      
      // Upload photo if provided
      const updateData = { ...data };
      if (photoFile) {
        updateData.image_url = await uploadFile('characters', photoFile);
      }

      const { data: character, error } = await supabase
        .from('characters')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update in store
      set((state) => ({
        characters: state.characters
          .map((c) => (c.id === id ? character : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));
      return character;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteCharacter: async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Remove from store
      set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  clearCharacters: () => {
    set({ characters: [], error: null });
  },
}));