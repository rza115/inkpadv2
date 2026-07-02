// js/modules/ai-polish.js
// Modul AI Polish — kirim teks ke Gemini lewat /api/gemini,
// tampilkan hasilnya di panel modal, bisa di-apply atau discard.
//
// Cara pakai di manuscript.js:
//   AIPolish.init(getContextFn, onApplyFn);
//   AIPolish.run(selectedText, fullChapterContent);

const AIPolish = (() => {
  // ── state ──
  let _getContext = null;
  let _onApply = null;
  let _lastPrompt = null;
  let _lastOriginal = null;
  let _lastMode = 'editor';
  let _lastInstructions = '';
  let _lastIsSelection = false;
  let _modalBuilt = false;

  // ── public API ──
  function init(getContextFn, onApplyFn) {
    _getContext = getContextFn;
    _onApply = onApplyFn;
    _buildModal();
  }

  async function run(selectedText, fullContent) {
    const ctx = _getContext();
    if (!ctx?.chapter) {
      alert('Pilih bab dulu sebelum menggunakan AI Polish.');
      return;
    }

    const text = selectedText?.trim() || fullContent?.trim() || '';
    if (!text) {
      alert('Tidak ada teks untuk dipoles. Tulis atau seleksi teks terlebih dahulu.');
      return;
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    _lastIsSelection = Boolean(selectedText?.trim());

    _showModal({ text, wordCount, isSelection: _lastIsSelection });
  }

  // ── generate (dipanggil dari tombol Generate) ──
  async function _generate() {
    const ctx = _getContext();
    if (!ctx?.chapter) return;

    const text = document.getElementById('ai-original-display').textContent;
    const isSelection = _lastIsSelection;

    // Baca mode & instruksi dari DOM
    _lastMode = document.getElementById('ai-mode-select').value;
    _lastInstructions = document.getElementById('ai-instructions-input').value.trim();

    // Fetch plot arcs + chapter notes secara paralel
    let arcs = [], chapterNotes = [];
    try {
      const [arcRes, noteRes] = await Promise.all([
        supabaseClient.from('plot_arcs').select('title,summary,status').eq('project_id', ctx.projectId),
        supabaseClient.from('quick_notes').select('content').eq('assigned_chapter_id', ctx.chapter.id),
      ]);
      arcs = arcRes.data || [];
      chapterNotes = noteRes.data || [];
    } catch (_) { /* non-critical, lanjut tanpa context ini */ }

    const prompt = _buildPrompt({
      text,
      chapter: ctx.chapter,
      chapters: ctx.chapters,
      linkedCharacters: ctx.linkedCharacters,
      linkedWorldEntries: ctx.linkedWorldEntries,
      arcs,
      chapterNotes,
      isSelection,
      mode: _lastMode,
      instructions: _lastInstructions,
    });

    _lastPrompt = prompt;
    _lastOriginal = text;

    await _callAPI(prompt);
  }

  // ── prompt ──
  function _buildPrompt({ text, chapter, chapters, linkedCharacters, linkedWorldEntries, arcs, chapterNotes, isSelection, mode, instructions }) {
    const idx = chapters.findIndex((c) => c.id === chapter.id) + 1;
    const total = chapters.length;

    let ctx = '';

    if (linkedCharacters?.length > 0) {
      ctx += '\n\nKARAKTER YANG ADA DI BAB INI:\n';
      linkedCharacters.forEach((c) => {
        const role = c.role ? ` (${c.role})` : '';
        const alias = c.aliases ? ` / ${c.aliases}` : '';
        const desc = (c.description || '').slice(0, 250);
        ctx += `• ${c.name}${alias}${role}${desc ? ' — ' + desc : ''}\n`;
      });
    }

    if (linkedWorldEntries?.length > 0) {
      ctx += '\nSETTING & WORLDBUILDING:\n';
      linkedWorldEntries.forEach((w) => {
        const content = (w.content || '').slice(0, 200);
        ctx += `• ${w.title}${w.category ? ` [${w.category}]` : ''}${content ? ': ' + content : ''}\n`;
      });
    }

    const activeArcs = (arcs || []).filter((a) => a.status === 'ongoing');
    if (activeArcs.length > 0) {
      ctx += '\nARC CERITA YANG SEDANG BERJALAN:\n';
      activeArcs.forEach((a) => {
        ctx += `• ${a.title}${a.summary ? ': ' + a.summary.slice(0, 150) : ''}\n`;
      });
    }

    if (chapterNotes?.length > 0) {
      ctx += '\nCATATAN AUTHOR UNTUK BAB INI:\n';
      chapterNotes.forEach((n) => { ctx += `• ${n.content.slice(0, 200)}\n`; });
    }

    const scope = isSelection
      ? `Ini adalah penggalan dari Bab ${idx} ("${chapter.title}") yang dipilih penulis untuk diperbaiki.`
      : `Ini adalah keseluruhan konten Bab ${idx} dari ${total} bab, berjudul "${chapter.title}".`;

    if (mode === 'co-author') {
      const instructionsBlock = instructions
        ? `\nARAHAN PENULIS:\n${instructions}\n`
        : '';

      return `Kamu adalah co-author light novel berbahasa Indonesia. Tugasmu adalah mengembangkan adegan yang sudah ditulis penulis — jangan menghapus teks asli, tetapi perluas dengan menambah dialog, deskripsi suasana, detail sensorik, reaksi karakter, dan gerak tubuh yang memperkuat adegan.

${scope}${ctx}${instructionsBlock}

TEKS ASLI:
---
${text}
---

INSTRUKSI PENGEMBANGAN:

• Kembangkan adegan ini dengan menambah dialog, deskripsi, dan detail yang memperkuat suasana serta karakter.
• Jangan hapus teks asli — perluas di sekitarnya, sisipkan tambahan di sela-sela yang sudah ada.
• Tambahkan dialog yang natural sesuai kepribadian masing-masing karakter.
• Perkuat deskripsi suasana (visual, auditori, sensorik) yang relevan dengan adegan, pilih salah satu yang paling relevan.
• Tambahkan reaksi karakter (ekspresi, gesture, bahasa tubuh) terhadap apa yang terjadi, pilih salah satu yang paling relevan.
• Pertahankan gaya dialog-driven dan sudut pandang (POV) yang digunakan.
• Pertahankan konsistensi istilah, gelar, nama tempat, nama kemampuan, dan terminologi dunia.
• Pertahankan gaya bicara, tingkat formalitas, dan kepribadian setiap karakter.
• Hasil harus terasa seperti satu kesatuan yang utuh, bukan tempelan.

PENTING: Hasil harus dalam bahasa Indonesia. Gunakan format Markdown: **bold** untuk penekanan kuat, *italic* untuk penekanan ringan, istilah asing, atau internal monolog, dan --- untuk pemisah adegan jika diperlukan. Jangan gunakan HTML.`;
    }

    // ── default: editor mode ──
    return `Kamu adalah editor profesional light novel berbahasa Indonesia yang berpengalaman.

${scope}${ctx}

TEKS YANG PERLU DIPERBAIKI:
---
${text}
---

INSTRUKSI EDITING:

Prioritas utama: perbaiki tata bahasa dan keterbacaan terlebih dahulu, baru lakukan penyempurnaan narasi secara selektif.

── TATA BAHASA & KETERBACAAN ──
• Perbaiki tata bahasa, ejaan, tanda baca, dan keterbacaan.
• Haluskan pilihan kata agar terasa lebih alami dan lebih nyaman dibaca.
• Perbaiki transisi antar kalimat dan antar paragraf agar mengalir lebih mulus.
• Variasikan struktur kalimat agar ritme membaca terasa dinamis.

── NARASI & DESKRIPSI ──
• Tingkatkan kualitas narasi sehingga terasa lebih hidup tanpa kehilangan kesederhanaannya.
• Lakukan rewrite ringan hingga sedang apabila menghasilkan narasi yang lebih kuat — tetapi pertahankan makna inti setiap kalimat.
• Tambahkan detail deskriptif (visual, auditori, sensorik) secara selektif apabila benar-benar memperkuat suasana, karakter, atau emosi; pilih yang paling relevan dengan adegan.
• Gunakan narasi untuk mendukung adegan, bukan mengambil alih adegan.
• Kurangi deskripsi yang terlalu panjang apabila memperlambat tempo.
• Kurangi repetisi emosi, pikiran, atau informasi yang telah dipahami pembaca.
• Padatkan narasi yang menyampaikan makna yang sama dalam beberapa kalimat.
• Panjang hasil boleh sedikit berbeda dari teks asli, tetapi usahakan tidak lebih dari 20% lebih panjang atau lebih pendek.

── DIALOG & KARAKTER ──
• Pertahankan gaya dialog-driven sebagai karakter utama naskah.
• Pertahankan keseimbangan antara dialog, aksi, dan narasi.
• Jadikan dialog, aksi, dan respon karakter sebagai penggerak utama adegan.
• Sebisa mungkin tampilkan emosi melalui tindakan, ekspresi, dialog, dan gesture sebelum menjelaskannya melalui narasi.
• Pertahankan gaya bicara, tingkat formalitas, pilihan kata, dan kepribadian setiap karakter.
• Pertahankan sudut pandang (POV) yang digunakan dalam teks asli.
• Perbaiki format dialog sesuai kaidah penulisan light novel Indonesia (tanda petik, em dash untuk interupsi).
• Gunakan *italic* untuk internal monolog, penekanan ringan, atau istilah asing.
• Gunakan **bold** untuk penekanan kuat.

── PACING & STRUKTUR ──
• Pertahankan variasi panjang kalimat sesuai ritme adegan.
• Saat adegan cepat, gunakan kalimat yang ringkas, tajam, dan ritmis.
• Saat adegan tenang atau emosional, gunakan narasi yang lebih kaya secukupnya.

── KONSISTENSI ──
• Pertahankan konsistensi istilah, gelar, nama tempat, nama kemampuan, dan terminologi dunia.
• Hasil harus terasa seperti sudah melalui proses line-editing profesional.

PENTING: Hasil harus dalam bahasa Indonesia. Gunakan format Markdown: **bold** untuk penekanan kuat, *italic* untuk penekanan ringan, istilah asing, atau internal monolog, dan --- untuk pemisah adegan jika diperlukan. Jangan gunakan HTML.`;
  }

  // ── API call ──
  async function _callAPI(prompt) {
    _setUIState('loading');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      _setUIState('result', data.result);
    } catch (err) {
      _setUIState('error', err.message);
    }
  }

  // ── modal ──
  function _buildModal() {
    if (_modalBuilt) return;
    _modalBuilt = true;

    const el = document.createElement('div');
    el.id = 'ai-polish-modal';
    el.className = 'ai-modal-overlay';
    el.style.display = 'none';
    el.innerHTML = `
      <div class="ai-modal-card">

        <div class="ai-modal-header">
          <span class="ai-modal-icon"><i class="ti ti-sparkles" aria-hidden="true"></i></span>
          <span class="ai-modal-title">AI</span>
          <select id="ai-mode-select" class="ai-mode-select">
            <option value="editor">Editor</option>
            <option value="co-author">Co-Author</option>
          </select>
          <span class="ai-modal-badge" id="ai-mode-badge"></span>
          <button class="ai-modal-close" id="ai-close-btn" title="Tutup (Esc)">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <div class="ai-modal-body">

          <div id="ai-instructions-area" class="ai-instructions-area" style="display:none;">
            <textarea id="ai-instructions-input" class="ai-instructions-input" placeholder="Arahan untuk co-author: misalnya 'Tambah dialog antara A dan B, perkuat deskripsi suasana malam, tambah reaksi karakter terhadap kejadian ini'" spellcheck="false"></textarea>
          </div>

          <div id="ai-state-idle" class="ai-state-idle">
            <div class="ai-panels">
              <div class="ai-panel">
                <div class="ai-panel-label">Teks Asli</div>
                <div class="ai-panel-original" id="ai-original-display"></div>
              </div>
              <div class="ai-panel-arrow">
                <i class="ti ti-arrow-right" aria-hidden="true"></i>
              </div>
              <div class="ai-panel">
                <div class="ai-panel-label">Hasil AI</div>
                <div class="ai-panel-idle-hint">Pilih mode, lalu klik <strong>Generate</strong> untuk memproses</div>
              </div>
            </div>
          </div>

          <div id="ai-state-loading" class="ai-state-loading" style="display:none;">
            <div class="ai-spinner"></div>
            <p>Memproses dengan Gemini…</p>
            <p class="ai-hint" id="ai-loading-hint"></p>
          </div>

          <div id="ai-state-error" class="ai-state-error" style="display:none;">
            <i class="ti ti-alert-circle" aria-hidden="true"></i>
            <p id="ai-error-msg"></p>
            <button class="ghost" id="ai-error-retry-btn">Coba Lagi</button>
          </div>

          <div id="ai-state-result" class="ai-state-result" style="display:none;">
            <div class="ai-panels">
              <div class="ai-panel">
                <div class="ai-panel-label">Teks Asli</div>
                <div class="ai-panel-original" id="ai-original-display-result"></div>
              </div>
              <div class="ai-panel-arrow">
                <i class="ti ti-arrow-right" aria-hidden="true"></i>
              </div>
              <div class="ai-panel">
                <div class="ai-panel-label">
                  Hasil AI
                  <span class="ai-hint">bisa diedit sebelum apply</span>
                </div>
                <textarea id="ai-result-input" class="ai-panel-result" spellcheck="false"></textarea>
              </div>
            </div>
          </div>

        </div>

        <div class="ai-modal-footer" id="ai-modal-footer">
          <button class="ghost" id="ai-discard-btn">Discard</button>
          <button class="ghost" id="ai-retry-btn" style="display:none;">
            <i class="ti ti-refresh" aria-hidden="true"></i> Coba Lagi
          </button>
          <button class="primary" id="ai-generate-btn">
            <i class="ti ti-player-play" aria-hidden="true"></i> Generate
          </button>
          <button class="primary" id="ai-apply-btn" style="display:none;">
            <i class="ti ti-check" aria-hidden="true"></i> Apply
          </button>
        </div>

      </div>
    `;
    document.body.appendChild(el);

    // Event listeners
    el.addEventListener('click', (e) => { if (e.target === el) _close(); });
    el.querySelector('#ai-close-btn').addEventListener('click', _close);
    el.querySelector('#ai-discard-btn').addEventListener('click', _close);
    el.querySelector('#ai-apply-btn').addEventListener('click', _apply);
    el.querySelector('#ai-generate-btn').addEventListener('click', _generate);
    el.querySelector('#ai-retry-btn').addEventListener('click', _retry);
    el.querySelector('#ai-error-retry-btn').addEventListener('click', _retry);

    // Toggle instructions area on mode change
    el.querySelector('#ai-mode-select').addEventListener('change', (e) => {
      const isCoAuthor = e.target.value === 'co-author';
      document.getElementById('ai-instructions-area').style.display = isCoAuthor ? 'block' : 'none';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.style.display !== 'none') _close();
    });
  }

  function _showModal({ text, wordCount, isSelection }) {
    const modal = document.getElementById('ai-polish-modal');
    if (!modal) return;
    modal.style.display = 'flex';

    // Set mode select to last used mode
    const modeSelect = document.getElementById('ai-mode-select');
    modeSelect.value = _lastMode;
    document.getElementById('ai-instructions-area').style.display = _lastMode === 'co-author' ? 'block' : 'none';
    document.getElementById('ai-instructions-input').value = _lastInstructions;

    const modeLabel = _lastMode === 'co-author' ? 'Co-Author' : 'Editor';
    const scopeLabel = isSelection ? 'Teks terpilih' : 'Seluruh bab';
    document.getElementById('ai-mode-badge').textContent =
      `${modeLabel} · ${scopeLabel} · ${wordCount.toLocaleString('id-ID')} kata`;
    document.getElementById('ai-original-display').textContent = text;
    document.getElementById('ai-result-input').value = '';
    document.getElementById('ai-loading-hint').textContent =
      wordCount > 800 ? 'Teks panjang, bisa butuh 20–40 detik…' : '';
    _setUIState('idle');
  }

  function _setUIState(state, data) {
    document.getElementById('ai-state-idle').style.display = state === 'idle' ? 'flex' : 'none';
    document.getElementById('ai-state-loading').style.display = state === 'loading' ? 'flex' : 'none';
    document.getElementById('ai-state-error').style.display = state === 'error' ? 'flex' : 'none';
    document.getElementById('ai-state-result').style.display = state === 'result' ? 'flex' : 'none';

    // Footer buttons
    const generateBtn = document.getElementById('ai-generate-btn');
    const retryBtn = document.getElementById('ai-retry-btn');
    const applyBtn = document.getElementById('ai-apply-btn');
    const discardBtn = document.getElementById('ai-discard-btn');

    generateBtn.style.display = 'none';
    retryBtn.style.display = 'none';
    applyBtn.style.display = 'none';
    discardBtn.style.display = 'none';

    if (state === 'idle') {
      generateBtn.style.display = 'inline-flex';
      discardBtn.style.display = 'inline-flex';
    } else if (state === 'loading') {
      // no buttons during loading
    } else if (state === 'error') {
      retryBtn.style.display = 'inline-flex';
      discardBtn.style.display = 'inline-flex';
    } else if (state === 'result') {
      retryBtn.style.display = 'inline-flex';
      applyBtn.style.display = 'inline-flex';
      discardBtn.style.display = 'inline-flex';
      // Sync original text to result panel
      const origText = document.getElementById('ai-original-display').textContent;
      document.getElementById('ai-original-display-result').textContent = origText;
      document.getElementById('ai-result-input').value = data || '';
    }
  }

  function _apply() {
    const result = document.getElementById('ai-result-input').value.trim();
    if (result && _onApply) {
      _onApply(_lastOriginal, result);
      _close();
    }
  }

  async function _retry() {
    if (!_lastPrompt) return;
    _setUIState('loading');
    await _callAPI(_lastPrompt);
  }

  function _close() {
    const modal = document.getElementById('ai-polish-modal');
    if (modal) modal.style.display = 'none';
  }

  return { init, run };
})();