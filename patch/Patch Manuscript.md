# Patch: Manuscript Search/Replace, Generator Panel CSS, Gemini API

## Context
3 bug ditemukan & fix di halaman Manuscript Inkpad:
1. Search & Replace ga jalan (tombol ga ke-wire)
2. Layout GeneratorPanel berantakan (CSS class hilang)
3. Generator AI ga jalan (env var GEMINI_API_KEY — **sudah fix di Vercel, skip**)

Terapkan 2 fix kode di bawah ini ke file aslinya di repo.

---

## Fix 1: `components/manuscript/SearchPanel.tsx`

**Masalah:** Tombol "Ganti" salah manggil `performSearch` (bukan replace), dan tombol "Ganti Semua" ga punya `onClick` sama sekali. Fungsi replace belum pernah diimplementasikan.

**Perubahan:**

1. Tambah helper regex builder (taruh di top-level file, di luar component):

```tsx
function buildRegex(query: string, caseSensitive: boolean, wholeWord: boolean, global: boolean) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
  const flags = (caseSensitive ? '' : 'i') + (global ? 'g' : '');
  return new RegExp(pattern, flags);
}
```

2. Update props interface — tambah `onReplaceInActiveChapter`:

```tsx
interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeChapterId?: string | null;
  getCurrentContent?: () => string;
  onReplaceInActiveChapter?: (newContent: string) => void;
}
```

3. Ambil `updateChapter` dari store (taruh dekat deklarasi `chapters` yang sudah ada):

```tsx
const updateChapter = useChapterStore((s) => s.updateChapter);
```

4. Tambah dua fungsi ini (letakkan dekat `performSearch` yang sudah ada):

```tsx
const performReplace = useCallback(() => {
  if (!hasSearched || results.length === 0) return;
  const r = results[currentResultIndex];
  if (!r) return;
  const isActive = r.chapterId === activeChapterId;
  const currentContent = isActive && getCurrentContent
    ? getCurrentContent()
    : (chapters.find(c => c.id === r.chapterId)?.content || '');
  const lines = currentContent.split('\n');
  const lineIdx = r.lineIndex - 1;
  if (lineIdx < 0 || lineIdx >= lines.length) return;

  const regex = buildRegex(searchQuery.trim(), caseSensitive, wholeWord, false);
  const newLine = lines[lineIdx].replace(regex, replaceQuery);
  if (newLine === lines[lineIdx]) return;
  lines[lineIdx] = newLine;
  const newContent = lines.join('\n');

  if (isActive && onReplaceInActiveChapter) {
    onReplaceInActiveChapter(newContent);
  } else {
    const wc = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
    updateChapter(r.chapterId, { content: newContent, word_count: wc });
  }

  const newResults = results.filter((_, i) => i !== currentResultIndex);
  setResults(newResults);
  setCurrentResultIndex((prev) => (newResults.length === 0 ? 0 : Math.min(prev, newResults.length - 1)));
}, [hasSearched, results, currentResultIndex, activeChapterId, getCurrentContent, chapters, searchQuery, caseSensitive, wholeWord, replaceQuery, onReplaceInActiveChapter, updateChapter]);

const performReplaceAll = useCallback(() => {
  if (!searchQuery.trim()) return;
  const regex = buildRegex(searchQuery.trim(), caseSensitive, wholeWord, true);

  chapters.forEach((ch) => {
    if (statusFilter !== 'all' && ch.status !== statusFilter) return;
    const isActive = ch.id === activeChapterId;
    const currentContent = isActive && getCurrentContent ? getCurrentContent() : (ch.content || '');
    if (!regex.test(currentContent)) return;
    regex.lastIndex = 0;
    const newContent = currentContent.replace(regex, replaceQuery);

    if (isActive && onReplaceInActiveChapter) {
      onReplaceInActiveChapter(newContent);
    } else {
      const wc = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
      updateChapter(ch.id, { content: newContent, word_count: wc });
    }
  });

  setResults([]);
  setHasSearched(false);
}, [searchQuery, chapters, caseSensitive, wholeWord, statusFilter, activeChapterId, getCurrentContent, replaceQuery, onReplaceInActiveChapter, updateChapter]);
```

5. Wire ulang tombol yang sudah ada (ganti `onClick` lama):

```tsx
<button className="search-replace-btn" onClick={performReplace}>
  <i className="ti ti-arrow-bar-to-down" aria-hidden="true"></i> Ganti
</button>
<button className="search-replace-btn-outline" onClick={performReplaceAll}>
  <i className="ti ti-arrows-exchange" aria-hidden="true"></i> Ganti Semua
</button>
```

---

## Fix 2: `components/manuscript/EditorPanel.tsx`

**Masalah:** SearchPanel butuh cara buat nulis balik ke content chapter yang lagi aktif diedit (bukan cuma baca).

**Perubahan:** Update pemanggilan `<SearchPanel>` yang sudah ada, tambah prop `onReplaceInActiveChapter`:

```tsx
<SearchPanel
  isOpen={searchOpen}
  onClose={() => setSearchOpen(false)}
  activeChapterId={activeChapter?.id}
  getCurrentContent={() => content}
  onReplaceInActiveChapter={(newContent: string) => {
    setContent(newContent);
    updateWordCount(newContent);
    clearTimeout(contentSaveTimer.current);
    contentSaveTimer.current = setTimeout(() => {
      if (activeChapter) {
        const wc = countWords(newContent);
        updateChapter(activeChapter.id, { content: newContent, word_count: wc });
      }
    }, 700);
  }}
/>
```

Catatan: pola debounce ini niru `handleContentChange` yang sudah ada di file — sesuaikan nama variabel (`content`, `setContent`, `contentSaveTimer`, `updateWordCount`, `countWords`, `activeChapter`, `updateChapter`) kalau penamaan aslinya beda.

---

## Fix 3: `app/globals.css`

**Masalah:** Class `.generator-panel` dan `.generator-overlay` (dipakai `GeneratorPanel.tsx`) tidak pernah didefinisikan — hanya `.search-panel`/`.search-overlay` yang ada.

**Perubahan:** Tambahkan blok CSS berikut (taruh setelah blok `.search-panel`, sebelum `.modal-overlay`). **Cek dulu apakah `.generator-panel` sudah ada di baris >1000 file ini — kalau sudah ada, jangan duplikat, sesuaikan saja.**

```css
/* ───────── Generator Panel (AI Generator) ───────── */
.generator-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 200;
}

.generator-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(420px, 92vw);
  background: var(--surface);
  border-left: 1px solid var(--border);
  z-index: 201;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 24px rgba(0,0,0,0.15);
}

.generator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.generator-header h2 {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
}

.generator-close-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.generator-close-btn:hover { color: var(--text); border-color: var(--accent); }

.generator-controls {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.generator-type-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.generator-type-row label { font-size: 12px; color: var(--text-muted); white-space: nowrap; }

.generator-type-select {
  flex: 1;
  padding: 8px 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 13px;
}

.generator-generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.generator-generate-btn:hover { opacity: 0.9; }
.generator-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.generator-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
  text-align: center;
}

.generator-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.generator-loading {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
}
.generator-spinner {
  width: 32px;
  height: 32px;
  margin: 0 auto 12px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: generator-spin 0.7s linear infinite;
}
@keyframes generator-spin { to { transform: rotate(360deg); } }

.generator-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: rgba(192, 57, 43, 0.1);
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  color: var(--danger);
  font-size: 13px;
}

.generator-output {
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}
.generator-output pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  margin: 0;
}

.generator-actions {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.generator-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius);
  font-size: 12px;
  cursor: pointer;
}
.generator-action-btn:hover { border-color: var(--accent); color: var(--accent); }
.generator-action-btn.primary {
  background: var(--accent);
  color: var(--accent-text);
  border: none;
}
.generator-action-btn.primary:hover { opacity: 0.9; }

@media (max-width: 600px) {
  .generator-panel { width: 100vw; }
}
```

---

## Optional (bonus, belum dikonfirmasi user): `ai-polish-btn`

Tombol `ai-polish-btn` di toolbar `EditorPanel.tsx` tidak punya `onClick` sama sekali. Belum ada spec jelas mau ngapain — **jangan diubah dulu tanpa konfirmasi user.**

---

## Verifikasi setelah patch
- [ ] Ketik query di search, klik "Ganti" → 1 match ke-replace, hilang dari list hasil
- [ ] Klik "Ganti Semua" → semua match di semua chapter ke-replace, hasil search ke-reset
- [ ] Buka GeneratorPanel → posisi panel di kanan (fixed), overlay gelap di belakang, responsive di mobile