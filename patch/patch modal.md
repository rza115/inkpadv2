# Patch: Fix Bold/Heading toggle + AI Polish di Manuscript Editor

File terkait:
- `components/manuscript/EditorPanel.tsx` (diedit)
- `components/manuscript/AIPolishModal.tsx` (file baru — sudah disediakan, tinggal taruh di folder ini)

---

## Bagian A — Buat file baru AIPolishModal.tsx

Salin file `AIPolishModal.tsx` yang sudah disediakan ke:
```
components/manuscript/AIPolishModal.tsx
```

Komponen ini:
- Otomatis manggil `/api/gemini` (endpoint yang sudah ada, format `{ prompt }`) begitu dibuka, dengan prompt "rapikan teks ini" + teks yang diseleksi.
- Nampilin hasilnya, dengan tombol **Salin** dan **Ganti Teks Terpilih** (yang manggil `onApply(newText)`).
- Style-nya reuse class `.generator-*` yang sudah ada di `globals.css` — nggak perlu nambah CSS baru.

---

## Bagian B — Edit EditorPanel.tsx

### 1. Tambah import
Cari:
```tsx
import { SearchPanel } from './SearchPanel';
import { GeneratorPanel } from './GeneratorPanel';
import { VersioningPanel } from './VersioningPanel';
```
Ganti jadi:
```tsx
import { SearchPanel } from './SearchPanel';
import { GeneratorPanel } from './GeneratorPanel';
import { VersioningPanel } from './VersioningPanel';
import { AIPolishModal } from './AIPolishModal';
```

### 2. Tambah state untuk modal AI Polish
Cari:
```tsx
  const [versioningOpen, setVersioningOpen] = useState(false);
```
Ganti jadi:
```tsx
  const [versioningOpen, setVersioningOpen] = useState(false);
  const [polishOpen, setPolishOpen] = useState(false);
  const [polishSelection, setPolishSelection] = useState<{ text: string; start: number; end: number } | null>(null);
```

### 3. Ganti fungsi `applyToolbar` (toggle Bold/Italic/Heading)
Cari seluruh fungsi:
```tsx
  // Toolbar actions - read from textarea directly to avoid stale closure
  const applyToolbar = useCallback((type: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const currentContent = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = currentContent.substring(0, start);
    const after = currentContent.substring(end);
    const selected = currentContent.substring(start, end);

    let newContent = currentContent;

    if (type === 'bold') {
      newContent = before + '**' + selected + '**' + after;
    } else if (type === 'italic') {
      newContent = before + '_' + selected + '_' + after;
    } else if (type === 'heading') {
      newContent = before + '## ' + selected + after;
    }

    setContent(newContent);
    updateWordCount(newContent);

    // Schedule save
    clearTimeout(contentSaveTimer.current);
    contentSaveTimer.current = setTimeout(() => {
      if (activeChapter) {
        const wc = countWords(newContent);
        updateChapter(activeChapter.id, { content: newContent, word_count: wc });
      }
    }, 700);

    // Restore cursor
    setTimeout(() => {
      ta.focus();
      if (type === 'heading') {
        ta.setSelectionRange(start + 3, start + 3 + selected.length);
      } else {
        ta.setSelectionRange(start + 2, end + 2);
      }
    }, 0);
  }, [activeChapter, updateChapter, updateWordCount]);
```

Ganti jadi:
```tsx
  // Toolbar actions - read from textarea directly to avoid stale closure
  // Supports toggle: applying the same formatting twice on the same
  // selection removes it instead of stacking markers.
  const applyToolbar = useCallback((type: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const currentContent = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = currentContent.substring(0, start);
    const after = currentContent.substring(end);
    const selected = currentContent.substring(start, end);

    let newContent = currentContent;
    let newStart = start;
    let newEnd = end;

    if (type === 'bold' || type === 'italic') {
      const marker = type === 'bold' ? '**' : '_';
      const mLen = marker.length;

      if (before.endsWith(marker) && after.startsWith(marker)) {
        // Marker sits right outside the selection -> un-wrap
        newContent = before.slice(0, before.length - mLen) + selected + after.slice(mLen);
        newStart = start - mLen;
        newEnd = end - mLen;
      } else if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= mLen * 2) {
        // Marker is included inside the selection -> un-wrap
        const unwrapped = selected.slice(mLen, selected.length - mLen);
        newContent = before + unwrapped + after;
        newStart = start;
        newEnd = start + unwrapped.length;
      } else {
        // Not formatted yet -> wrap
        newContent = before + marker + selected + marker + after;
        newStart = start + mLen;
        newEnd = end + mLen;
      }
    } else if (type === 'heading') {
      const marker = '## ';
      const mLen = marker.length;

      if (before.endsWith(marker)) {
        // Marker sits right before the selection -> un-heading
        newContent = before.slice(0, before.length - mLen) + selected + after;
        newStart = start - mLen;
        newEnd = end - mLen;
      } else if (selected.startsWith(marker)) {
        // Marker is included inside the selection -> un-heading
        const unwrapped = selected.slice(mLen);
        newContent = before + unwrapped + after;
        newStart = start;
        newEnd = start + unwrapped.length;
      } else {
        // Not a heading yet -> add marker
        newContent = before + marker + selected + after;
        newStart = start + mLen;
        newEnd = end + mLen;
      }
    }

    setContent(newContent);
    updateWordCount(newContent);

    // Schedule save
    clearTimeout(contentSaveTimer.current);
    contentSaveTimer.current = setTimeout(() => {
      if (activeChapter) {
        const wc = countWords(newContent);
        updateChapter(activeChapter.id, { content: newContent, word_count: wc });
      }
    }, 700);

    // Restore selection to the same logical text, so clicking the
    // same button again toggles the formatting back off.
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newStart, newEnd);
    }, 0);
  }, [activeChapter, updateChapter, updateWordCount]);
```

### 4. Tambah handler untuk buka & menerapkan hasil AI Polish
Taruh persis setelah fungsi `applyToolbar` yang baru saja diganti (setelah `}, [activeChapter, updateChapter, updateWordCount]);` penutupnya), sebelum `const toggleFocusMode = ...`:

```tsx
  // Open the AI Polish modal with the current textarea selection
  const openAIPolish = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value.substring(start, end);
    if (!text.trim()) {
      alert('Seleksi teks yang mau dirapikan dulu, ya.');
      return;
    }
    setPolishSelection({ text, start, end });
    setPolishOpen(true);
  }, []);

  // Replace the originally-selected range with the polished text
  const handlePolishApply = useCallback((newText: string) => {
    if (!polishSelection) return;
    const ta = textareaRef.current;
    const currentContent = ta ? ta.value : content;
    const { start, end } = polishSelection;
    const before = currentContent.substring(0, start);
    const after = currentContent.substring(end);
    const newContent = before + newText + after;

    setContent(newContent);
    updateWordCount(newContent);

    clearTimeout(contentSaveTimer.current);
    contentSaveTimer.current = setTimeout(() => {
      if (activeChapter) {
        const wc = countWords(newContent);
        updateChapter(activeChapter.id, { content: newContent, word_count: wc });
      }
    }, 700);

    setTimeout(() => {
      if (ta) {
        ta.focus();
        ta.setSelectionRange(start, start + newText.length);
      }
    }, 0);
  }, [polishSelection, activeChapter, updateChapter, updateWordCount, content]);
```

### 5. Sambungkan keyboard shortcut Ctrl+Shift+P
Tombol AI Polish sudah punya label `data-shortcut="Ctrl+Shift+P"` tapi shortcut-nya belum pernah didaftarkan. Cari blok `handleKeyDown`:
```tsx
      if (isCtrl && e.key === 'i') {
        e.preventDefault();
        applyToolbar('italic');
      }
    };
```
Ganti jadi:
```tsx
      if (isCtrl && e.key === 'i') {
        e.preventDefault();
        applyToolbar('italic');
      }
      if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        openAIPolish();
      }
    };
```

Lalu cari dependency array-nya tepat di bawah:
```tsx
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [forceSave, applyToolbar, toggleFocusMode, focusMode]);
```
Ganti jadi:
```tsx
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [forceSave, applyToolbar, toggleFocusMode, focusMode, openAIPolish]);
```

### 6. Sambungkan tombol "AI Polish" di toolbar
Cari:
```tsx
          <button type="button" className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="ai-polish-btn" title="AI Polish — rapikan teks (Ctrl+Shift+P)" data-shortcut="Ctrl+Shift+P">
            <i className="ti ti-sparkles" aria-hidden="true"></i>
          </button>
```
Ganti jadi:
```tsx
          <button type="button" className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="ai-polish-btn" title="AI Polish — rapikan teks (Ctrl+Shift+P)" data-shortcut="Ctrl+Shift+P" onClick={openAIPolish}>
            <i className="ti ti-sparkles" aria-hidden="true"></i>
          </button>
```

### 7. Render modal-nya
Cari:
```tsx
      <GeneratorPanel isOpen={generatorOpen} onClose={() => setGeneratorOpen(false)} />
      <VersioningPanel isOpen={versioningOpen} onClose={() => setVersioningOpen(false)} />
    </>
  );
}
```
Ganti jadi:
```tsx
      <GeneratorPanel isOpen={generatorOpen} onClose={() => setGeneratorOpen(false)} />
      <VersioningPanel isOpen={versioningOpen} onClose={() => setVersioningOpen(false)} />
      <AIPolishModal
        isOpen={polishOpen}
        onClose={() => setPolishOpen(false)}
        selectedText={polishSelection?.text || ''}
        onApply={handlePolishApply}
      />
    </>
  );
}
```

---

---

## Bagian C — Fix tombol "Generate dengan AI" di panel Generator (ikon dadu)

### Masalah
`handleGenerate` di `components/manuscript/GeneratorPanel.tsx` ngirim body `{ type: generatorType }` ke `/api/gemini`, padahal endpoint-nya (`app/api/gemini/route.ts`) cuma baca field `prompt`. Field `type` diabaikan sepenuhnya, jadi request selalu gagal dengan pesan `Field "prompt" diperlukan dan tidak boleh kosong.`

Selain itu tombol "Pakai di Editor" di panel ini manggil `onInsert`, tapi di `EditorPanel.tsx` komponen `<GeneratorPanel />` nggak dikasih prop `onInsert` sama sekali — jadi walaupun generate-nya berhasil, tombol itu cuma nutup panel tanpa nyisipin apa-apa ke editor. Sekalian dibenerin juga.

### File target: `components/manuscript/GeneratorPanel.tsx`

Cari:
```tsx
export function GeneratorPanel({ isOpen, onClose, onInsert }: GeneratorPanelProps) {
  const [generatorType, setGeneratorType] = useState('character');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setOutput('');
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: generatorType }),
      });
      
      if (!response.ok) throw new Error('Gagal generate');
      
      const data = await response.json();
      setOutput(data.result || 'Tidak ada hasil.');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };
```

Ganti jadi:
```tsx
// Prompt per jenis generator — dikirim sebagai field "prompt" sesuai
// yang dibaca oleh app/api/gemini/route.ts
const GENERATOR_PROMPTS: Record<string, string> = {
  character:
    'Buatkan 5 ide nama karakter fiksi lengkap dengan makna/asal-usul singkatnya, ' +
    'cocok untuk light novel atau cerita fantasi/isekai berbahasa Indonesia. ' +
    'Format list bernomor, singkat dan padat.',
  location:
    'Buatkan 5 ide nama tempat/lokasi fiksi yang cocok untuk light novel atau cerita fantasi, ' +
    'masing-masing dengan deskripsi singkat 1 kalimat. Format list bernomor.',
  'plot-twist':
    'Buatkan 5 ide plot twist yang bisa dipakai dalam cerita fiksi (light novel/isekai), ' +
    'masing-masing 1-2 kalimat. Format list bernomor.',
  dialog:
    'Buatkan 5 ide prompt dialog pembuka atau percakapan dramatis yang bisa dipakai dalam cerita fiksi. ' +
    'Format list bernomor.',
  item:
    'Buatkan 5 ide benda atau artefak unik untuk cerita fantasi/light novel, ' +
    'masing-masing dengan deskripsi singkat kegunaan atau kekuatannya. Format list bernomor.',
  conflict:
    'Buatkan 5 ide konflik cerita (personal, sosial, atau eksternal) yang bisa dipakai dalam ' +
    'light novel atau cerita fiksi, masing-masing 1-2 kalimat. Format list bernomor.',
};

export function GeneratorPanel({ isOpen, onClose, onInsert }: GeneratorPanelProps) {
  const [generatorType, setGeneratorType] = useState('character');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setOutput('');

    try {
      const prompt = GENERATOR_PROMPTS[generatorType] || GENERATOR_PROMPTS.character;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal generate');

      setOutput(data.result || 'Tidak ada hasil.');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };
```

### File target: `components/manuscript/EditorPanel.tsx`

Cari:
```tsx
      <GeneratorPanel isOpen={generatorOpen} onClose={() => setGeneratorOpen(false)} />
```
Ganti jadi:
```tsx
      <GeneratorPanel
        isOpen={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        onInsert={(text: string) => {
          const ta = textareaRef.current;
          const currentContent = ta ? ta.value : content;
          const insertAt = ta ? ta.selectionStart : currentContent.length;
          const before = currentContent.substring(0, insertAt);
          const after = currentContent.substring(insertAt);
          const newContent = before + text + after;

          setContent(newContent);
          updateWordCount(newContent);

          clearTimeout(contentSaveTimer.current);
          contentSaveTimer.current = setTimeout(() => {
            if (activeChapter) {
              const wc = countWords(newContent);
              updateChapter(activeChapter.id, { content: newContent, word_count: wc });
            }
          }, 700);

          setTimeout(() => {
            if (ta) {
              ta.focus();
              const cursorPos = insertAt + text.length;
              ta.setSelectionRange(cursorPos, cursorPos);
            }
          }, 0);
        }}
      />
```

## Verifikasi setelah patch
- [ ] Select teks → klik ikon **B** → jadi bold, klik lagi di selection yang sama → balik normal (nggak numpuk `****`).
- [ ] Sama untuk **Heading**.
- [ ] Select teks → klik ikon **sparkles (AI Polish)** → modal muncul, otomatis manggil Gemini, nampilin hasil rapian.
- [ ] Klik "Ganti Teks Terpilih" → teks di editor kegantikan hasil polish, dan ke-autosave.
- [ ] Coba Ctrl+Shift+P saat ada teks yang diseleksi → modal AI Polish ikut kebuka.
- [ ] Coba klik AI Polish **tanpa** ada teks yang diseleksi → muncul alert minta seleksi dulu, modal nggak kebuka.
- [ ] Buka panel Generator (ikon dadu) → pilih jenis apa aja → klik "Generate dengan AI" → hasil muncul (bukan error "Gagal generate" lagi).
- [ ] Klik "Pakai di Editor" pada hasil generator → teks kesisip di posisi kursor terakhir di textarea, dan ke-autosave.
