// js/core/storage.js
// Upload file ke bucket 'inkpad-media'. Path SELALU diawali user_id
// (dibutuhin sama storage RLS policy biar user cuma bisa nulis ke folder sendiri,
// lihat sql/migrations/002_fase4a_characters.sql).

const StorageAPI = {
  async upload(folder, file) {
    const user = window.currentUser;
    if (!user) throw new Error('Belum login.');

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabaseClient.storage.from('inkpad-media').upload(path, file);
    if (error) throw error;

    const { data } = supabaseClient.storage.from('inkpad-media').getPublicUrl(path);
    return data.publicUrl;
  },

  _parsePublicUrl(publicUrl) {
    if (!publicUrl || typeof publicUrl !== 'string') return null;
    const match = publicUrl.match(/\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/?]+)\/([^?]+)/);
    if (!match) return null;
    const bucket = decodeURIComponent(match[1]);
    const path = decodeURIComponent(match[2]);
    if (bucket !== 'inkpad-media') return null;
    return path;
  },

  async removeByUrl(publicUrl) {
    const path = this._parsePublicUrl(publicUrl);
    if (!path) return;

    const user = window.currentUser;
    if (!user) throw new Error('Belum login.');
    if (!path.startsWith(`${user.id}/`)) {
      throw new Error('Tidak bisa hapus file di luar folder user.');
    }

    const { error } = await supabaseClient.storage.from('inkpad-media').remove([path]);
    if (error) throw error;
  },
};
