// js/modules/chapters.js
// CRUD chapter dalam satu project.
//
// update() offline-aware: kalau gagal karena nggak ada koneksi, operasi
// di-antri lewat OfflineQueue (lihat js/core/offline-queue.js) dan resolve
// optimis biar UI tetap kerasa instan. Error LAIN (RLS, validasi, dsb)
// sengaja TETAP dilempar apa adanya — bukan ikut di-antri — biar nggak
// ngumpet jadi "offline" padahal sebenernya ada masalah lain.
//
// create()/remove()/reorder() SENGAJA nggak offline-aware (out of scope Fase 3):
// operasi struktural begini butuh reconciliation ID yang lebih rumit kalau
// mau didukung offline. Untuk sekarang user perlu koneksi buat bikin/hapus
// bab atau ngubah urutan.

function isNetworkError(err) {
  return err instanceof TypeError || /fetch|network/i.test(err && err.message || '');
}

const ChaptersAPI = {
  async listByProject(projectId) {
    const { data, error } = await supabaseClient
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(projectId, orderIndex) {
    if (!navigator.onLine) {
      throw new Error('Nggak bisa bikin bab baru waktu offline. Sambungin internet dulu.');
    }
    const { data, error } = await supabaseClient
      .from('chapters')
      .insert([{ project_id: projectId, title: 'Bab baru', order_index: orderIndex }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    if (!navigator.onLine) {
      await OfflineQueue.enqueue('chapters', id, fields);
      return { id, ...fields, updated_at: new Date().toISOString(), _offline: true };
    }
    try {
      const { data, error } = await supabaseClient
        .from('chapters')
        .update(fields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        await OfflineQueue.enqueue('chapters', id, fields);
        return { id, ...fields, updated_at: new Date().toISOString(), _offline: true };
      }
      throw err;
    }
  },

  async remove(id) {
    if (!navigator.onLine) {
      throw new Error('Nggak bisa hapus bab waktu offline. Sambungin internet dulu.');
    }
    const { error } = await supabaseClient.from('chapters').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Versioning ──

  async saveVersion(chapterId, label) {
    // Ambil data chapter dulu
    const { data: chapter, error: fetchErr } = await supabaseClient
      .from('chapters')
      .select('title, content, word_count')
      .eq('id', chapterId)
      .single();
    if (fetchErr) throw fetchErr;

    const { data, error } = await supabaseClient
      .from('chapter_versions')
      .insert([{
        chapter_id: chapterId,
        title: chapter.title,
        content: chapter.content,
        word_count: chapter.word_count || 0,
        label: label || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listVersions(chapterId) {
    const { data, error } = await supabaseClient
      .from('chapter_versions')
      .select('id, version_number, title, word_count, label, created_at')
      .eq('chapter_id', chapterId)
      .order('version_number', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getVersion(versionId) {
    const { data, error } = await supabaseClient
      .from('chapter_versions')
      .select('*')
      .eq('id', versionId)
      .single();
    if (error) throw error;
    return data;
  },

  async restoreVersion(chapterId, versionId) {
    // Ambil konten versi
    const version = await this.getVersion(versionId);
    // Update chapter dengan konten versi tersebut
    const { data, error } = await supabaseClient
      .from('chapters')
      .update({
        title: version.title,
        content: version.content,
        word_count: version.word_count,
      })
      .eq('id', chapterId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteVersion(versionId) {
    const { error } = await supabaseClient
      .from('chapter_versions')
      .delete()
      .eq('id', versionId);
    if (error) throw error;
  },

  // updates: [{ id, order_index }, ...]
  async reorder(updates) {
    if (!navigator.onLine) {
      throw new Error('Urutan belum bisa disimpen karena lagi offline.');
    }
    const results = await Promise.all(
      updates.map((u) =>
        supabaseClient.from('chapters').update({ order_index: u.order_index }).eq('id', u.id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed) throw failed.error;
  },
};
