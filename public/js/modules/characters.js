// js/modules/characters.js
// CRUD karakter, plus link/unlink karakter ke chapter (buat panel kanan editor).

const CharactersAPI = {
  async listByProject(projectId) {
    const { data, error } = await supabaseClient
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(projectId, fields) {
    const { data, error } = await supabaseClient
      .from('characters')
      .insert([{ project_id: projectId, ...fields }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const { data, error } = await supabaseClient
      .from('characters')
      .update(fields)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Karakter nggak ketemu atau nggak punya akses buat ngedit.');
    return data;
  },

  async remove(id) {
    const { error } = await supabaseClient.from('characters').delete().eq('id', id);
    if (error) throw error;
  },

  async listForChapter(chapterId) {
    const { data, error } = await supabaseClient
      .from('chapter_characters')
      .select('character_id, characters(*)')
      .eq('chapter_id', chapterId);
    if (error) throw error;
    return (data || []).map((row) => row.characters).filter(Boolean);
  },

  async linkToChapter(chapterId, characterId) {
    const { error } = await supabaseClient
      .from('chapter_characters')
      .insert([{ chapter_id: chapterId, character_id: characterId }]);
    if (error) throw error;
  },

  async unlinkFromChapter(chapterId, characterId) {
    const { error } = await supabaseClient
      .from('chapter_characters')
      .delete()
      .eq('chapter_id', chapterId)
      .eq('character_id', characterId);
    if (error) throw error;
  },
};
