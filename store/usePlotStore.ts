/**
 * Plot Store
 * Manages arcs and foreshadow log using Zustand
 */

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Arc, Foreshadow, ArcFormData, ForeshadowFormData } from '@/types/plot';

const supabase = createClient();

interface PlotState {
  // State
  arcs: Arc[];
  foreshadows: Foreshadow[];
  isLoading: boolean;
  error: string | null;

  // Arc actions
  fetchArcs: (projectId: string) => Promise<void>;
  createArc: (projectId: string, data: ArcFormData) => Promise<Arc>;
  updateArc: (id: string, data: Partial<ArcFormData>) => Promise<Arc>;
  deleteArc: (id: string) => Promise<void>;

  // Foreshadow actions
  fetchForeshadows: (projectId: string) => Promise<void>;
  createForeshadow: (projectId: string, data: ForeshadowFormData) => Promise<Foreshadow>;
  updateForeshadow: (id: string, data: Partial<ForeshadowFormData>) => Promise<Foreshadow>;
  deleteForeshadow: (id: string) => Promise<void>;
  toggleForeshadowStatus: (id: string) => Promise<void>;

  // Utility
  reset: () => void;
}

const initialState = {
  arcs: [],
  foreshadows: [],
  isLoading: false,
  error: null,
};

export const usePlotStore = create<PlotState>((set, get) => ({
  ...initialState,

  // ── Arc Actions ──
  fetchArcs: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('plot_arcs')
        .select('*, start:chapter_start_id(id,title), end:chapter_end_id(id,title)')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      set({ arcs: data || [], isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createArc: async (projectId: string, data: ArcFormData) => {
    set({ error: null });
    try {
      const currentArcs = get().arcs;
      const order_index = currentArcs.length;

      const { data: newArc, error } = await supabase
        .from('plot_arcs')
        .insert([{ 
          project_id: projectId, 
          ...data,
          order_index 
        }])
        .select()
        .single();

      if (error) throw error;

      set({ arcs: [...currentArcs, newArc] });
      return newArc;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
      throw error;
    }
  },

  updateArc: async (id: string, data: Partial<ArcFormData>) => {
    set({ error: null });
    try {
      const { data: updatedArc, error } = await supabase
        .from('plot_arcs')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set({
        arcs: get().arcs.map((arc) => (arc.id === id ? updatedArc : arc)),
      });
      return updatedArc;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
      throw error;
    }
  },

  deleteArc: async (id: string) => {
    set({ error: null });
    try {
      const { error } = await supabase
        .from('plot_arcs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({
        arcs: get().arcs.filter((arc) => arc.id !== id),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
      throw error;
    }
  },

  // ── Foreshadow Actions ──
  fetchForeshadows: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('foreshadow_log')
        .select('*, planted:planted_chapter_id(id,title), payoff:payoff_chapter_id(id,title)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ foreshadows: data || [], isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createForeshadow: async (projectId: string, data: ForeshadowFormData) => {
    set({ error: null });
    try {
      const { data: newForeshadow, error } = await supabase
        .from('foreshadow_log')
        .insert([{ project_id: projectId, ...data }])
        .select()
        .single();

      if (error) throw error;

      set({ foreshadows: [...get().foreshadows, newForeshadow] });
      return newForeshadow;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
      throw error;
    }
  },

  updateForeshadow: async (id: string, data: Partial<ForeshadowFormData & { status?: 'pending' | 'paid' }>) => {
    set({ error: null });
    try {
      const { data: updatedForeshadow, error } = await supabase
        .from('foreshadow_log')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set({
        foreshadows: get().foreshadows.map((f) => (f.id === id ? updatedForeshadow : f)),
      });
      return updatedForeshadow;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
      throw error;
    }
  },

  deleteForeshadow: async (id: string) => {
    set({ error: null });
    try {
      const { error } = await supabase
        .from('foreshadow_log')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({
        foreshadows: get().foreshadows.filter((f) => f.id !== id),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
      throw error;
    }
  },

  toggleForeshadowStatus: async (id: string) => {
    const foreshadow = get().foreshadows.find((f) => f.id === id);
    if (!foreshadow) return;

    const newStatus = foreshadow.status === 'paid' ? 'pending' : 'paid';
    await get().updateForeshadow(id, { status: newStatus });
  },

  // ── Utility ──
  reset: () => set(initialState),
}));
