# Patch: Fix tombol "Baca" tidak berfungsi di Manuscript

## File target
`components/manuscript/EditorPanel.tsx`

## Masalah
Tombol "Baca" (`id="read-btn"`) di toolbar editor tidak punya `onClick` handler sama sekali — beda dari tombol lain (Export, Search, Generator, Focus, Versioning) yang semuanya sudah terhubung ke fungsi masing-masing.

Halaman `/reader` (`app/reader/page.tsx`) sudah lengkap dan menerima query param:
- `project` — project ID (wajib)
- `chapterId` — ID chapter yang mau langsung dibuka (opsional, prioritas di atas `chapter` index)

Jadi tombol "Baca" tinggal di-`router.push` ke sana, sambil pastikan draft yang lagi diedit sudah tersimpan dulu biar Reader nampilin versi terbaru.

## Instruksi perbaikan

### 1. Tambahkan import `useRouter`
Cari:
```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChapterStore } from '@/store/useChapterStore';
```

Ganti jadi:
```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChapterStore } from '@/store/useChapterStore';
```

### 2. Inisialisasi router di dalam komponen
Cari:
```tsx
export function EditorPanel({ projectId }: EditorPanelProps) {
const { activeChapter, chapters, updateChapter, saveIndicator, lastSavedAt, versionRestoreSignal } = useChapterStore();
```

Ganti jadi:
```tsx
export function EditorPanel({ projectId }: EditorPanelProps) {
const router = useRouter();
const { activeChapter, chapters, updateChapter, saveIndicator, lastSavedAt, versionRestoreSignal } = useChapterStore();
```

### 3. Tambahkan handler `openReadMode`
Taruh setelah fungsi `forceSave` (setelah blok `}, [activeChapter, updateChapter]);` penutup `forceSave`), sebelum `applyToolbar`:

```tsx
// Buka mode baca — simpan draft dulu biar Reader nampilin versi terbaru
const openReadMode = useCallback(async () => {
  if (!activeChapter) return;
  await forceSave();
  router.push(`/reader?project=${projectId}&chapterId=${activeChapter.id}`);
}, [activeChapter, forceSave, projectId, router]);
```

### 4. Sambungkan ke tombol "Baca"
Cari:
```tsx
<button className="flex items-center justify-center gap-1 px-3 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="read-btn">
  <i className="ti ti-book" aria-hidden="true"></i> Baca
</button>
```

Ganti jadi:
```tsx
<button className="flex items-center justify-center gap-1 px-3 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="read-btn" title="Buka mode baca" onClick={openReadMode}>
  <i className="ti ti-book" aria-hidden="true"></i> Baca
</button>
```

## Verifikasi setelah patch
- [ ] Klik "Baca" saat ada chapter aktif → pindah ke `/reader?project=<id>&chapterId=<id>` dan menampilkan chapter yang sama persis dengan yang sedang diedit.
- [ ] Perubahan yang belum ke-autosave (misal baru ngetik <700ms sebelum klik) tetap ikut tersimpan sebelum redirect, karena `forceSave()` dipanggil dulu.
- [ ] Tidak ada error TypeScript soal `useRouter` (pastikan import dari `next/navigation`, bukan `next/router`).
