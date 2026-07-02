// js/modules/epub-books.js
// CRUD epub_books + helper extract metadata (title/author/cover) dari file EPUB
// sebelum diupload ke Storage.
//
// Parser metadata sengaja minimal (pakai DOMParser, bukan epub.js) biar ringan
// dan nggak bergantung library di upload step. epub.js cuma dipakai di reader.

const EpubBooksAPI = {
  async list() {
    const { data, error } = await supabaseClient
      .from('epub_books')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(fields) {
    const { data, error } = await supabaseClient
      .from('epub_books')
      .insert([fields])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data: book, error: fetchError } = await supabaseClient
      .from('epub_books')
      .select('epub_url, cover_url')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    if (book.epub_url) await StorageAPI.removeByUrl(book.epub_url);
    if (book.cover_url) await StorageAPI.removeByUrl(book.cover_url);

    const { error } = await supabaseClient
      .from('epub_books')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ── Metadata parser ──
// Baca OPF di dalam file EPUB (ZIP) dan ekstrak title, author, cover image.
// Butuh JSZip — load via CDN di halaman yang menggunakannya.
const EpubMeta = {
  async extract(file) {
    const meta = { title: file.name.replace(/\.epub$/i, ''), author: null, coverBlob: null };

    try {
      if (typeof JSZip === 'undefined') return meta;
      const zip = await JSZip.loadAsync(file);

      // 1. Cari container.xml → path ke OPF
      const containerXml = await zip.file('META-INF/container.xml')?.async('string');
      if (!containerXml) return meta;

      const containerDoc = new DOMParser().parseFromString(containerXml, 'application/xml');
      const opfPath = containerDoc.querySelector('rootfile')?.getAttribute('full-path');
      if (!opfPath) return meta;

      // 2. Parse OPF
      const opfXml = await zip.file(opfPath)?.async('string');
      if (!opfXml) return meta;

      const opfDoc = new DOMParser().parseFromString(opfXml, 'application/xml');
      const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

      // title & author
      const titleEl = opfDoc.querySelector('metadata > title, metadata > *|title');
      const creatorEl = opfDoc.querySelector('metadata > creator, metadata > *|creator');
      if (titleEl?.textContent) meta.title = titleEl.textContent.trim();
      if (creatorEl?.textContent) meta.author = creatorEl.textContent.trim();

      // cover image — cari lewat meta name="cover" atau item properties="cover-image"
      const coverId = opfDoc.querySelector('meta[name="cover"]')?.getAttribute('content');
      let coverItem = coverId
        ? opfDoc.querySelector(`manifest > item[id="${coverId}"]`)
        : opfDoc.querySelector('manifest > item[properties~="cover-image"]');

      if (coverItem) {
        const href = coverItem.getAttribute('href');
        const fullPath = opfDir + href;
        const coverFile = zip.file(fullPath) || zip.file(decodeURIComponent(fullPath));
        if (coverFile) {
          const arr = await coverFile.async('arraybuffer');
          const mime = href.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          meta.coverBlob = new Blob([arr], { type: mime });
        }
      }
    } catch (err) {
      console.warn('EpubMeta.extract gagal (bukan masalah kritis):', err.message);
    }

    return meta;
  },
};
