// js/modules/illustrations.js

const IllustrationsAPI = {
  async listByChapter(chapterId) {
    const { data, error } = await supabaseClient
      .from('chapter_illustrations')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(chapterId, { image_url, video_url, caption, order_index }) {
    const { data, error } = await supabaseClient
      .from('chapter_illustrations')
      .insert([{ chapter_id: chapterId, image_url, video_url, caption, order_index }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCaption(id, caption) {
    const { data, error } = await supabaseClient
      .from('chapter_illustrations')
      .update({ caption })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data: row, error: fetchError } = await supabaseClient
      .from('chapter_illustrations')
      .select('image_url, video_url')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    if (row.image_url) await StorageAPI.removeByUrl(row.image_url);
    if (row.video_url) await StorageAPI.removeByUrl(row.video_url);

    const { error } = await supabaseClient
      .from('chapter_illustrations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
