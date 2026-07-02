// js/modules/worldbuilding.js
// CRUD world entry, plus link/unlink ke chapter (pola sama persis kayak characters.js).

const WorldAPI = {
  async listByProject(projectId) {
    const { data, error } = await supabaseClient
      .from('world_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('category', { ascending: true })
      .order('title', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(projectId, fields) {
    const { data, error } = await supabaseClient
      .from('world_entries')
      .insert([{ project_id: projectId, ...fields }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const { data, error } = await supabaseClient
      .from('world_entries')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabaseClient.from('world_entries').delete().eq('id', id);
    if (error) throw error;
  },

  async listForChapter(chapterId) {
    const { data, error } = await supabaseClient
      .from('chapter_world_entries')
      .select('world_entry_id, world_entries(*)')
      .eq('chapter_id', chapterId);
    if (error) throw error;
    return (data || []).map((row) => row.world_entries).filter(Boolean);
  },

  async linkToChapter(chapterId, entryId) {
    const { error } = await supabaseClient
      .from('chapter_world_entries')
      .insert([{ chapter_id: chapterId, world_entry_id: entryId }]);
    if (error) throw error;
  },

  async unlinkFromChapter(chapterId, entryId) {
    const { error } = await supabaseClient
      .from('chapter_world_entries')
      .delete()
      .eq('chapter_id', chapterId)
      .eq('world_entry_id', entryId);
    if (error) throw error;
  },
};
