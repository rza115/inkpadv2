/**
 * Chapter Store
 * Zustand store for chapter CRUD and manuscript data
 */
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Chapter, Character, WorldEntry, Illustration, Note } from '@/types/chapter';

interface ChapterState {
  // Data
  chapters: Chapter[];
  activeChapter: Chapter | null;
  allCharacters: Character[];
  linkedCharacters: Character[];
  allWorldEntries: WorldEntry[];
  linkedWorldEntries: WorldEntry[];
  illustrations: Illustration[];
  notes: Note[];
  
  // UI state
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveIndicator: 'saved' | 'saving' | 'offline' | 'error';
  lastSavedAt: string | null;
  
  // Actions
  loadChapters: (projectId: string) => Promise<void>;
  selectChapter: (id: string) => void;
  createChapter: (projectId: string) => Promise<Chapter>;
  deleteChapter: (id: string) => Promise<void>;
  updateChapter: (id: string, fields: Partial<Chapter>) => Promise<void>;
  cycleStatus: (ch: Chapter) => Promise<void>;
  reorderChapters: (sourceId: string, targetId: string) => Promise<void>;
  
  loadAllCharacters: (projectId: string) => Promise<void>;
  loadContextCharacters: (chapterId: string) => Promise<void>;
  linkCharacter: (chapterId: string, characterId: string) => Promise<void>;
  unlinkCharacter: (chapterId: string, characterId: string) => Promise<void>;
  
  loadAllWorldEntries: (projectId: string) => Promise<void>;
  loadContextWorldEntries: (chapterId: string) => Promise<void>;
  linkWorldEntry: (chapterId: string, entryId: string) => Promise<void>;
  unlinkWorldEntry: (chapterId: string, entryId: string) => Promise<void>;
  
  loadIllustrations: (chapterId: string) => Promise<void>;
  uploadIllustration: (chapterId: string, file: File) => Promise<void>;
  deleteIllustration: (id: string) => Promise<void>;
  updateIllustrationCaption: (id: string, caption: string) => Promise<void>;
  
  loadNotes: (chapterId: string) => Promise<void>;
  createNote: (projectId: string, chapterId: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  
  setSaveIndicator: (state: 'saved' | 'saving' | 'offline' | 'error', timestamp?: string) => void;
  clearError: () => void;
}

const LAST_CHAPTER_KEY_PREFIX = 'inkpad:manuscript:lastChapter:';

function getLastChapterKey(projectId: string) {
  return `${LAST_CHAPTER_KEY_PREFIX}${projectId}`;
}

export const useChapterStore = create<ChapterState>((set, get) => ({
  chapters: [],
  activeChapter: null,
  allCharacters: [],
  linkedCharacters: [],
  allWorldEntries: [],
  linkedWorldEntries: [],
  illustrations: [],
  notes: [],
  
  isLoading: false,
  isSaving: false,
  error: null,
  saveIndicator: 'saved',
  lastSavedAt: null,

  loadChapters: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      set({ chapters: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selectChapter: (id: string) => {
    const { chapters } = get();
    const chapter = chapters.find(c => c.id === id);
    if (!chapter) return;
    set({ activeChapter: chapter });
    
    // Save last chapter to localStorage
    try {
      const projectId = chapter.project_id;
      localStorage.setItem(getLastChapterKey(projectId), JSON.stringify({
        chapterId: chapter.id,
        chapterTitle: chapter.title || 'Tanpa judul',
        timestamp: Date.now()
      }));
    } catch (_) {}
    
    // Load context data
    get().loadContextCharacters(id);
    get().loadContextWorldEntries(id);
    get().loadIllustrations(id);
    get().loadNotes(id);
  },

  createChapter: async (projectId: string) => {
    const { chapters } = get();
    const maxOrder = chapters.reduce((max, c) => Math.max(max, c.order_index), -1);
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chapters')
      .insert([{ project_id: projectId, title: 'Bab baru', order_index: maxOrder + 1 }])
      .select()
      .single();
    if (error) throw error;
    
    set((state) => ({ chapters: [...state.chapters, data] }));
    return data;
  },

  deleteChapter: async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('chapters').delete().eq('id', id);
    if (error) throw error;
    
    set((state) => {
      const chapters = state.chapters.filter(c => c.id !== id);
      let activeChapter = state.activeChapter;
      if (activeChapter && activeChapter.id === id) {
        activeChapter = chapters.length > 0 ? chapters[0] : null;
      }
      return { chapters, activeChapter };
    });
  },

  updateChapter: async (id: string, fields: Partial<Chapter>) => {
    set({ isSaving: true, saveIndicator: 'saving' });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('chapters')
        .update(fields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      
      set((state) => ({
        chapters: state.chapters.map(c => c.id === id ? data : c),
        activeChapter: state.activeChapter?.id === id ? data : state.activeChapter,
        isSaving: false,
        saveIndicator: 'saved',
        lastSavedAt: data.updated_at,
      }));
    } catch (err: any) {
      set({ isSaving: false, saveIndicator: 'error' });
      throw err;
    }
  },

  cycleStatus: async (ch: Chapter) => {
    const order = ['draft', 'revisi', 'final'] as const;
    const next = order[(order.indexOf(ch.status as any) + 1) % order.length];
    await get().updateChapter(ch.id, { status: next } as any);
  },

  reorderChapters: async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const { chapters } = get();
    const sourceIndex = chapters.findIndex(c => c.id === sourceId);
    const targetIndex = chapters.findIndex(c => c.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    const reordered = [...chapters];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    reordered.forEach((c, i) => (c.order_index = i));
    set({ chapters: reordered });
    
    try {
      const supabase = createClient();
      await Promise.all(
        reordered.map((c) =>
          supabase.from('chapters').update({ order_index: c.order_index }).eq('id', c.id)
        )
      );
    } catch (err: any) {
      // Reload on failure
      const projectId = chapters[0]?.project_id;
      if (projectId) get().loadChapters(projectId);
    }
  },

  loadAllCharacters: async (projectId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('characters')
        .select('id, project_id, name, image_url')
        .eq('project_id', projectId);
      if (error) throw error;
      set({ allCharacters: data || [] });
    } catch (_) {
      set({ allCharacters: [] });
    }
  },

  loadContextCharacters: async (chapterId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('chapter_characters')
        .select('character_id')
        .eq('chapter_id', chapterId);
      if (error) throw error;
      
      if (data && data.length > 0) {
        const ids = data.map((r: any) => r.character_id);
        const { data: chars, error: charsError } = await supabase
          .from('characters')
          .select('id, project_id, name, image_url')
          .in('id', ids);
        if (charsError) throw charsError;
        set({ linkedCharacters: chars || [] });
      } else {
        set({ linkedCharacters: [] });
      }
    } catch (_) {
      set({ linkedCharacters: [] });
    }
  },

  linkCharacter: async (chapterId: string, characterId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('chapter_characters')
      .insert([{ chapter_id: chapterId, character_id: characterId }]);
    if (error) throw error;
    await get().loadContextCharacters(chapterId);
  },

  unlinkCharacter: async (chapterId: string, characterId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('chapter_characters')
      .delete()
      .eq('chapter_id', chapterId)
      .eq('character_id', characterId);
    if (error) throw error;
    await get().loadContextCharacters(chapterId);
  },

  loadAllWorldEntries: async (projectId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('world_entries')
        .select('id, project_id, title')
        .eq('project_id', projectId);
      if (error) throw error;
      set({ allWorldEntries: data || [] });
    } catch (_) {
      set({ allWorldEntries: [] });
    }
  },

  loadContextWorldEntries: async (chapterId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('chapter_world_entries')
        .select('world_entry_id')
        .eq('chapter_id', chapterId);
      if (error) throw error;
      
      if (data && data.length > 0) {
        const ids = data.map((r: any) => r.world_entry_id);
        const { data: entries, error: entriesError } = await supabase
          .from('world_entries')
          .select('id, project_id, title')
          .in('id', ids);
        if (entriesError) throw entriesError;
        set({ linkedWorldEntries: entries || [] });
      } else {
        set({ linkedWorldEntries: [] });
      }
    } catch (_) {
      set({ linkedWorldEntries: [] });
    }
  },

  linkWorldEntry: async (chapterId: string, entryId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('chapter_world_entries')
      .insert([{ chapter_id: chapterId, world_entry_id: entryId }]);
    if (error) throw error;
    await get().loadContextWorldEntries(chapterId);
  },

  unlinkWorldEntry: async (chapterId: string, entryId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('chapter_world_entries')
      .delete()
      .eq('chapter_id', chapterId)
      .eq('world_entry_id', entryId);
    if (error) throw error;
    await get().loadContextWorldEntries(chapterId);
  },

  loadIllustrations: async (chapterId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('chapter_illustrations')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      set({ illustrations: data || [] });
    } catch (_) {
      set({ illustrations: [] });
    }
  },

  uploadIllustration: async (chapterId: string, file: File) => {
    const supabase = createClient();
    const isVideo = file.type.startsWith('video/');
    const folder = isVideo ? 'illustrations/video' : 'illustrations/image';
    
    // Upload file
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${ext}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('inkpad-media')
      .upload(`${folder}/${filename}`, file);
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
    
    const { data: { publicUrl } } = supabase.storage
      .from('inkpad-media')
      .getPublicUrl(uploadData.path);
    
    // Get current max order
    const { illustrations } = get();
    const maxOrder = illustrations.reduce((m, il) => Math.max(m, il.order_index), -1);
    
    // Create illustration record
    const { error: createError } = await supabase
      .from('chapter_illustrations')
      .insert([{
        chapter_id: chapterId,
        image_url: isVideo ? null : publicUrl,
        video_url: isVideo ? publicUrl : null,
        caption: null,
        order_index: maxOrder + 1,
      }]);
    if (createError) throw createError;
    
    await get().loadIllustrations(chapterId);
  },

  deleteIllustration: async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('chapter_illustrations').delete().eq('id', id);
    if (error) throw error;
    await get().loadIllustrations(get().activeChapter?.id || '');
  },

  updateIllustrationCaption: async (id: string, caption: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('chapter_illustrations').update({ caption }).eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to update caption:', err.message);
      throw err;
    }
  },

    loadNotes: async (chapterId: string) => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('quick_notes')
          .select('*')
          .eq('assigned_chapter_id', chapterId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        set({ notes: data || [] });
      } catch (_) {
        set({ notes: [] });
      }
    },

    createNote: async (projectId: string, chapterId: string, content: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('quick_notes')
        .insert([{
          project_id: projectId,
          content,
          assigned_chapter_id: chapterId,
          assigned_character_id: null,
          assigned_world_id: null,
        }]);
      if (error) throw error;
      await get().loadNotes(chapterId);
    },

    deleteNote: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('quick_notes').delete().eq('id', id);
      if (error) throw error;
      await get().loadNotes(get().activeChapter?.id || '');
    },

  setSaveIndicator: (state, timestamp) => {
    set({ saveIndicator: state, lastSavedAt: timestamp || null });
  },

  clearError: () => set({ error: null }),
}));