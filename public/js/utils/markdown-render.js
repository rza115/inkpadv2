// js/utils/markdown-render.js
// Full markdown → HTML renderer buat Reader Mode.
// Subset: ## heading, # heading, **bold**, _italic_, [[cross-link]], paragraphs, line breaks.
// Sengaja dipisah dari markdown-lite.js (yang khusus buat insert syntax di textarea).

const MarkdownRender = {
  // text: string mentah dari textarea
  // resolver: function(name) => { type: 'character'|'world', id } | null (opsional)
  render(text, resolver) {
    if (!text || !text.trim()) {
      return '<p class="r-empty">Bab ini masih kosong.</p>';
    }
    const paragraphs = text.split(/\n{2,}/);
    return paragraphs
      .map((para) => {
        const t = para.trim();
        if (!t) return '';
        if (t.startsWith('## ')) {
          return `<h2 class="r-h2">${this._inline(t.slice(3), resolver)}</h2>`;
        }
        if (t.startsWith('# ')) {
          return `<h1 class="r-h1">${this._inline(t.slice(2), resolver)}</h1>`;
        }
        const lines = t
          .split('\n')
          .map((l) => this._inline(l, resolver))
          .join('<br>');
        return `<p>${lines}</p>`;
      })
      .filter(Boolean)
      .join('');
  },

  _inline(text, resolver) {
    // Pisahin [[link]] dulu sebelum escape, biar karakter seperti & di nama
    // nggak kena double-escape.
    const parts = [];
    let last = 0;
    const rx = /\[\[([^\]]+)\]\]/g;
    let m;
    while ((m = rx.exec(text)) !== null) {
      if (m.index > last) parts.push({ type: 't', v: text.slice(last, m.index) });
      parts.push({ type: 'link', v: m[1].trim() });
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push({ type: 't', v: text.slice(last) });

    return parts
      .map((p) => {
        if (p.type === 'link') {
          const res = resolver ? resolver(p.v) : null;
          const esc = this._esc(p.v);
          if (res) {
            return `<a class="r-xlink" data-type="${res.type}" data-id="${res.id}" href="#">${esc}</a>`;
          }
          return `<span class="r-xlink-miss">${esc}</span>`;
        }
        let t = this._esc(p.v);
        t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        t = t.replace(/_(.+?)_/g, '<em>$1</em>');
        return t;
      })
      .join('');
  },

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  },
};
