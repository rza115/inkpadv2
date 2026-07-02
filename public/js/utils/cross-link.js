// js/utils/cross-link.js
// Parser [[Nama]] sederhana — nyambungin teks ke karakter atau world entry lain
// dalam project yang sama, lewat pencocokan nama (case-insensitive, exact match).
//
// Ini versi DASAR buat preview kecil di form Karakter & Worldbuilding.
// Rendering penuh di alur baca (Reader Mode, Fase 4c) dan link-ke-chapter
// nyusul & dirapihin lebih lanjut di Fase 6.

const CrossLink = {
  // resolver: function(name) => { type: 'character'|'world', id } | null
  render(text, resolver) {
    if (!text) return '';
    const escaped = escapeHtmlForXlink(text);
    return escaped.replace(/\[\[([^[\]]+)\]\]/g, (match, name) => {
      const trimmed = name.trim();
      const resolved = resolver(trimmed);
      if (resolved) {
        return `<a class="xlink-link" data-type="${resolved.type}" data-id="${resolved.id}">${escapeHtmlForXlink(trimmed)}</a>`;
      }
      return `<span class="xlink-broken" title="Belum ada karakter/entry dengan nama ini">${escapeHtmlForXlink(trimmed)}</span>`;
    });
  },
};

function escapeHtmlForXlink(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
