// js/modules/theme.js — Theme Manager for Inkpad
// Menangani tema global (dark, sepia, forest, inkpad-light) + font editor preferences

const THEME_STORAGE_KEY = 'inkpad:theme';
const FONT_PREFS_KEY = 'inkpad:editor-font-prefs';

// ── Available themes ──
const THEMES = [
  { id: 'inkpad',   label: 'Inkpad',   icon: 'ti ti-sun' },
  { id: 'dark',     label: 'Gelap',    icon: 'ti ti-moon' },
  { id: 'sepia',    label: 'Sepia',    icon: 'ti ti-books' },
  { id: 'forest',   label: 'Forest',   icon: 'ti ti-leaf' },
];

const DEFAULT_FONT_PREFS = {
  family: 'literata',
  size: 'md',
  spacing: 'normal',
  paperMode: false,
};

// ── Current state ──
let currentTheme = 'inkpad';
let editorFontPrefs = { ...DEFAULT_FONT_PREFS };

// ── Init ──
function initTheme() {
  // Load saved theme
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES.some(t => t.id === saved)) {
      currentTheme = saved;
    }
  } catch (_) {}

  // Load saved editor font prefs
  try {
    const saved = localStorage.getItem(FONT_PREFS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      editorFontPrefs = { ...DEFAULT_FONT_PREFS, ...parsed };
    }
  } catch (_) {}

  applyTheme(currentTheme);
}

function applyTheme(themeId) {
  currentTheme = themeId;
  document.documentElement.setAttribute('data-theme', themeId);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (_) {}

  // Update theme toggle button icon if present
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    const theme = THEMES.find(t => t.id === themeId);
    const icon = themeBtn.querySelector('i');
    if (icon && theme) icon.className = theme.icon;
    themeBtn.title = `Tema: ${theme ? theme.label : themeId}`;
  }
}

function toggleTheme() {
  const idx = THEMES.findIndex(t => t.id === currentTheme);
  const next = THEMES[(idx + 1) % THEMES.length];
  applyTheme(next.id);
}

function getCurrentTheme() {
  return currentTheme;
}

function getThemes() {
  return THEMES;
}

// ── Editor Font Preferences ──

function setEditorFontPref(key, value) {
  editorFontPrefs[key] = value;
  saveEditorFontPrefs();
  applyEditorFontPrefs();
}

function getEditorFontPrefs() {
  return { ...editorFontPrefs };
}

function saveEditorFontPrefs() {
  try {
    localStorage.setItem(FONT_PREFS_KEY, JSON.stringify(editorFontPrefs));
  } catch (_) {}
}

function applyEditorFontPrefs() {
  const editor = document.querySelector('.editor-textarea');
  if (!editor) return;

  // Font family
  const families = ['literata', 'lora', 'inter', 'nunito', 'georgia', 'mono'];
  families.forEach(f => editor.classList.remove(`ef-${f}`));
  editor.classList.add(`ef-${editorFontPrefs.family}`);

  // Font size
  const sizes = ['sm', 'md', 'lg', 'xl'];
  sizes.forEach(s => editor.classList.remove(`efs-${s}`));
  editor.classList.add(`efs-${editorFontPrefs.size}`);

  // Line spacing
  const spacings = ['tight', 'normal', 'relaxed'];
  spacings.forEach(s => editor.classList.remove(`esp-${s}`));
  editor.classList.add(`esp-${editorFontPrefs.spacing}`);

  // Paper mode
  editor.classList.toggle('paper-mode', editorFontPrefs.paperMode);
}

function initEditorFontControls() {
  const fontFamilySelect = document.getElementById('editor-font-family');
  const fontSizeSelect = document.getElementById('editor-font-size');
  const fontSpacingSelect = document.getElementById('editor-font-spacing');
  const paperModeBtn = document.getElementById('editor-paper-mode');

  if (fontFamilySelect) {
    fontFamilySelect.value = editorFontPrefs.family;
    fontFamilySelect.addEventListener('change', () => {
      setEditorFontPref('family', fontFamilySelect.value);
    });
  }

  if (fontSizeSelect) {
    fontSizeSelect.value = editorFontPrefs.size;
    fontSizeSelect.addEventListener('change', () => {
      setEditorFontPref('size', fontSizeSelect.value);
    });
  }

  if (fontSpacingSelect) {
    fontSpacingSelect.value = editorFontPrefs.spacing;
    fontSpacingSelect.addEventListener('change', () => {
      setEditorFontPref('spacing', fontSpacingSelect.value);
    });
  }

  if (paperModeBtn) {
    paperModeBtn.classList.toggle('active', editorFontPrefs.paperMode);
    paperModeBtn.addEventListener('click', () => {
      const newVal = !editorFontPrefs.paperMode;
      setEditorFontPref('paperMode', newVal);
      paperModeBtn.classList.toggle('active', newVal);
    });
  }

  // Apply initial prefs
  applyEditorFontPrefs();
}

// ── Expose globally ──
window.InkpadTheme = {
  init: initTheme,
  apply: applyTheme,
  toggle: toggleTheme,
  getCurrent: getCurrentTheme,
  getThemes,
  setEditorFontPref,
  getEditorFontPrefs,
  initEditorFontControls,
  applyEditorFontPrefs,
};