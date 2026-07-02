// js/modules/projects.js
// CRUD project. Semua fungsi return data langsung atau throw error
// (biar pemanggil cukup pakai try/catch, nggak perlu cek {data, error} berulang).

const ProjectsAPI = {
  async list() {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create({ title, genre, status, cover_url }) {
    const { data, error } = await supabaseClient
      .from('projects')
      .insert([{ title, genre: genre || null, status: status || 'ongoing', cover_url: cover_url || null }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const { data, error } = await supabaseClient
      .from('projects')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabaseClient.from('projects').delete().eq('id', id);
    if (error) throw error;
  },
};
