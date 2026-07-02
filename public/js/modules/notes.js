// js/modules/notes.js

const NotesAPI = {
  async listByProject(projectId) {
    const { data, error } = await supabaseClient
      .from('quick_notes')
      .select('*, chapter:assigned_chapter_id(id,title), character:assigned_character_id(id,name), world:assigned_world_id(id,title)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async listByChapter(chapterId) {
    const { data, error } = await supabaseClient
      .from('quick_notes')
      .select('*')
      .eq('assigned_chapter_id', chapterId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(projectId, fields) {
    const { data, error } = await supabaseClient
      .from('quick_notes')
      .insert([{ project_id: projectId, ...fields }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const { data, error } = await supabaseClient
      .from('quick_notes')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabaseClient.from('quick_notes').delete().eq('id', id);
    if (error) throw error;
  },
};
