// js/modules/plot.js

const PlotAPI = {
  // ── Arc ──
  async listArcs(projectId) {
    const { data, error } = await supabaseClient
      .from('plot_arcs')
      .select('*, start:chapter_start_id(id,title), end:chapter_end_id(id,title)')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createArc(projectId, fields) {
    const { data, error } = await supabaseClient
      .from('plot_arcs')
      .insert([{ project_id: projectId, ...fields }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateArc(id, fields) {
    const { data, error } = await supabaseClient
      .from('plot_arcs')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeArc(id) {
    const { error } = await supabaseClient.from('plot_arcs').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Foreshadow ──
  async listForeshadow(projectId) {
    const { data, error } = await supabaseClient
      .from('foreshadow_log')
      .select('*, planted:planted_chapter_id(id,title), payoff:payoff_chapter_id(id,title)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createForeshadow(projectId, fields) {
    const { data, error } = await supabaseClient
      .from('foreshadow_log')
      .insert([{ project_id: projectId, ...fields }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateForeshadow(id, fields) {
    const { data, error } = await supabaseClient
      .from('foreshadow_log')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeForeshadow(id) {
    const { error } = await supabaseClient.from('foreshadow_log').delete().eq('id', id);
    if (error) throw error;
  },
};
