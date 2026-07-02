// js/modules/random-generator.js
// AI Generator Tools — generate ide cerita via Gemini API
// Reuse endpoint /api/gemini yang sudah ada.

const GENERATOR_TYPES = [
  {
    id: 'character',
    label: 'Nama Karakter',
    icon: 'ti ti-user',
    prompt: `Kamu adalah asisten penulis light novel Indonesia. Buatkan 5 nama karakter untuk light novel dengan variasi: nama asli Indonesia, nama Jepang, dan nama Barat. Setiap karakter sertakan deskripsi singkat peran atau ciri khasnya (5-10 kata).

Format output:
1. [Nama Lengkap] — [deskripsi singkat]
2. [Nama Lengkap] — [deskripsi singkat]
...dst

PENTING: Gunakan bahasa Indonesia. Output hanya nomor dan nama, tanpa intro atau penutup.`,
  },
  {
    id: 'location',
    label: 'Nama Tempat',
    icon: 'ti ti-map-pin',
    prompt: `Kamu adalah asisten penulis light novel Indonesia. Buatkan 5 nama lokasi atau tempat untuk setting fantasy light novel. Beri deskripsi singkat suasana atau ciri khas tempat tersebut (5-10 kata).

Format output:
1. [Nama Tempat] — [deskripsi singkat]
2. [Nama Tempat] — [deskripsi singkat]
...dst

PENTING: Gunakan bahasa Indonesia. Output hanya nomor dan nama tempat, tanpa intro atau penutup.`,
  },
  {
    id: 'plot-twist',
    label: 'Plot Twist',
    icon: 'ti ti-shield-bolt',
    prompt: `Kamu adalah asisten penulis light novel Indonesia. Buatkan 3 plot twist yang mengejutkan dan menarik untuk light novel. Setiap plot twist terdiri dari 2-3 kalimat yang menggambarkan twist tersebut.

Format output:
1. [Judul Twist] — [deskripsi 2-3 kalimat]
2. [Judul Twist] — [deskripsi 2-3 kalimat]
3. [Judul Twist] — [deskripsi 2-3 kalimat]

PENTING: Gunakan bahasa Indonesia. Output hanya nomor dan twist, tanpa intro atau penutup.`,
  },
  {
    id: 'dialog',
    label: 'Dialog Prompt',
    icon: 'ti ti-message',
    prompt: `Kamu adalah asisten penulis light novel Indonesia. Buatkan 3 prompt dialog yang menarik antara dua karakter untuk light novel. Setiap prompt menggambarkan situasi dan emosi yang terlibat (1-2 kalimat).

Format output:
1. [Situasi dialog] — [deskripsi emosi/dinamika]
2. [Situasi dialog] — [deskripsi emosi/dinamika]
3. [Situasi dialog] — [deskripsi emosi/dinamika]

PENTING: Gunakan bahasa Indonesia. Output hanya nomor dan prompt, tanpa intro atau penutup.`,
  },
  {
    id: 'item',
    label: 'Benda / Artefak',
    icon: 'ti ti-backpack',
    prompt: `Kamu adalah asisten penulis light novel Indonesia. Buatkan 5 benda atau artefak unik untuk setting fantasy light novel. Setiap benda memiliki nama yang menarik dan deskripsi fungsi atau sejarah singkat (5-10 kata).

Format output:
1. [Nama Benda] — [deskripsi singkat]
2. [Nama Benda] — [deskripsi singkat]
...dst

PENTING: Gunakan bahasa Indonesia. Output hanya nomor dan benda, tanpa intro atau penutup.`,
  },
  {
    id: 'conflict',
    label: 'Konflik Cerita',
    icon: 'ti ti-swords',
    prompt: `Kamu adalah asisten penulis light novel Indonesia. Buatkan 3 premis konflik cerita untuk light novel. Setiap premis terdiri dari 2-3 kalimat yang menggambarkan konflik utama.

Format output:
1. [Judul Premis] — [deskripsi konflik 2-3 kalimat]
2. [Judul Premis] — [deskripsi konflik 2-3 kalimat]
3. [Judul Premis] — [deskripsi konflik 2-3 kalimat]

PENTING: Gunakan bahasa Indonesia. Output hanya nomor dan premis, tanpa intro atau penutup.`,
  },
];

// ── State ──
let isOpen = false;
let lastResult = '';
let currentType = 'character';

// ── Init ──
function initGenerator() {
  const panel = document.getElementById('generator-panel');
  if (!panel) return;

  // Close button
  document.getElementById('generator-close')?.addEventListener('click', closeGenerator);

  // Type select
  const typeSelect = document.getElementById('generator-type');
  typeSelect?.addEventListener('change', (e) => {
    currentType = e.target.value;
  });

  // Generate button
  document.getElementById('generator-btn-generate')?.addEventListener('click', handleGenerate);

  // Copy button
  document.getElementById('generator-copy')?.addEventListener('click', handleCopy);

  // Insert button
  document.getElementById('generator-insert')?.addEventListener('click', handleInsert);

  // Click outside to close
  panel.addEventListener('click', (e) => {
    if (e.target === panel) closeGenerator();
  });

  // Escape key (dengan cleanup)
  function closeOnEsc(e) {
    if (e.key === 'Escape') closeGenerator();
  }
  document.addEventListener('keydown', closeOnEsc);
  
  // Store reference untuk cleanup
  panel._closeOnEsc = closeOnEsc;
}

function openGenerator() {
  isOpen = true;

  const panel = document.getElementById('generator-panel');
  const overlay = document.getElementById('generator-overlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('open');

  document.body.style.overflow = 'hidden';

  // Reset state
  lastResult = '';
  document.getElementById('generator-result')?.classList.remove('show');
  document.getElementById('generator-output')?.classList.remove('show');
  document.getElementById('generator-output')?.classList.add('hidden');
  document.getElementById('generator-loading')?.classList.add('hidden');
  document.getElementById('generator-loading')?.classList.remove('show');
  document.getElementById('generator-error')?.classList.add('hidden');
  document.getElementById('generator-error')?.classList.remove('show');
}

function closeGenerator() {
  isOpen = false;
  const panel = document.getElementById('generator-panel');
  const overlay = document.getElementById('generator-overlay');
  if (panel) {
    panel.classList.remove('open');
    // Cleanup escape listener
    if (panel._closeOnEsc) {
      document.removeEventListener('keydown', panel._closeOnEsc);
      panel._closeOnEsc = null;
    }
  }
  if (overlay) overlay.classList.remove('open');

  document.body.style.overflow = '';
}

async function handleGenerate() {
  const type = GENERATOR_TYPES.find((t) => t.id === currentType) || GENERATOR_TYPES[0];
  const outputEl = document.getElementById('generator-output');
  const loadingEl = document.getElementById('generator-loading');
  const errorEl = document.getElementById('generator-error');
  const resultEl = document.getElementById('generator-result');

  // Show loading
  outputEl?.classList.add('hidden');
  outputEl?.classList.remove('show');
  errorEl?.classList.add('hidden');
  errorEl?.classList.remove('show');
  loadingEl?.classList.remove('hidden');
  loadingEl?.classList.add('show');
  resultEl?.classList.remove('show');

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: type.prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

    lastResult = data.result || 'Tidak ada hasil.';
    const outputText = document.getElementById('generator-output-text');
    if (outputText) outputText.textContent = lastResult;

    // Show output
    loadingEl?.classList.add('hidden');
    loadingEl?.classList.remove('show');
    outputEl?.classList.remove('hidden');
    outputEl?.classList.add('show');
    resultEl?.classList.add('show');
  } catch (err) {
    loadingEl?.classList.add('hidden');
    loadingEl?.classList.remove('show');
    errorEl?.classList.remove('hidden');
    errorEl?.classList.add('show');
    const errorMsg = document.getElementById('generator-error-msg');
    if (errorMsg) errorMsg.textContent = err.message;
  }
}

function handleCopy() {
  if (!lastResult) return;
  navigator.clipboard.writeText(lastResult).then(() => {
    showGeneratorToast('Disalin ke clipboard!');
  }).catch(() => {
    showGeneratorToast('Gagal menyalin', true);
  });
}

function handleInsert() {
  if (!lastResult) return;

  // Dispatch custom event untuk manuscript.js
  document.dispatchEvent(new CustomEvent('generator:insert', {
    detail: { text: lastResult }
  }));

  closeGenerator();
  showGeneratorToast('Disisipkan ke editor!');
}

// ── Toast ──
function showGeneratorToast(msg, isError) {
  const existing = document.querySelector('.generator-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'generator-toast' + (isError ? ' generator-toast-error' : '');
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ── Expose globally (loaded as regular script, not ES module) ──
window.InkpadRandom = {
  init: initGenerator,
  open: openGenerator,
  close: closeGenerator,
};
