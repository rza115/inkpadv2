# Patch: Fix toggle Bold/Heading tidak berfungsi di Manuscript Editor

## File target
`components/manuscript/EditorPanel.tsx`

## Masalah
Fungsi `applyToolbar` cuma bisa **nambahin** marker (`**`, `_`, `## `), nggak pernah **ngelepas**. Klik Bold dua kali di teks yang sama harusnya bold → un-bold, tapi malah numpuk jadi `****teks****`.

Kenapa ini sebenarnya cukup gampang diperbaiki: setelah toolbar dijalankan sekali, kode sudah otomatis nge-highlight ulang teks aslinya (tanpa marker) lewat `ta.setSelectionRange(...)`. Jadi kalau tombol yang sama diklik lagi pada selection itu, karakter tepat sebelum (`before`) dan sesudah (`after`) selection sudah pasti berisi marker yang baru ditambahkan. Tinggal dicek dan dilepas kalau ketemu.

## Instruksi perbaikan

Cari seluruh fungsi `applyToolbar`:

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

Ganti **seluruh fungsi itu** jadi:

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

## Verifikasi setelah patch
- [ ] Select teks polos → klik Bold → jadi `**teks**`, selection tetap di teks (tanpa marker terlihat ke-highlight).
- [ ] Klik Bold lagi tanpa ubah selection → marker `**` hilang, balik ke teks polos.
- [ ] Sama untuk Italic (`_teks_`) dan Heading (`## teks`).
- [ ] Select teks yang di dalamnya sudah ada `**...**` (diketik manual, bukan lewat tombol) → klik Bold → marker ikut kehapus juga (bukan nambah jadi `****...****`).
- [ ] Ctrl+B / Ctrl+I / Ctrl+H (keyboard shortcut) juga ikut toggle dengan benar karena semuanya manggil `applyToolbar` yang sama.
