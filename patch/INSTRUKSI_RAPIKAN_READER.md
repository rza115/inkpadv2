# Instruksi: Rapikan tampilan Reader Page

## Konteks
Project Next.js (App Router) + Tailwind. Reader mode punya 5 tema (light/dark/sepia/forest/violet)
yang di-switch lewat atribut `data-theme` di `<html>` (lihat `lib/theme.ts`). Semua warna reader
HARUS tetap pakai CSS variable yang sudah ada di `app/globals.css` (`--bg`, `--surface`,
`--surface-raised`, `--text`, `--text-muted`, `--border`, `--accent`, `--accent-hover`,
`--radius`, `--radius-lg`). **Jangan hardcode warna baru** — nanti rusak di tema lain.

File yang relevan:
- `components/reader/ReaderTopbar.tsx`
- `components/reader/ReaderTOC.tsx`
- `components/reader/ReaderContent.tsx`
- `app/globals.css` (blok `/* ───────── Reading Mode ───────── */`, sekitar baris 1136–1255)

Baca ketiga file komponen dan blok CSS reader itu dulu sebelum mengedit, supaya perubahan
konsisten dengan class dan struktur yang sudah ada (jangan bikin sistem styling baru).

---

## Task 1 — TOC (daftar bab) lebih jelas bedanya, aktif vs tidak

File: `components/reader/ReaderTOC.tsx`

Sekarang item aktif cuma beda `bg-[var(--surface)]` + `text-[var(--accent)]`, terasa kurang
kontras dan jarak antar item terlalu rapat.

Ubah item chapter (div di dalam `.map`) supaya:
- Item aktif (`index === activeIndex`): background `var(--surface-raised)`, teks judul
  `font-medium` warna `var(--accent)`, tambahkan left border aksen 2px `border-[var(--accent)]`
  (gunakan `border-l-2` dan pastikan sudut kiri TIDAK rounded — pakai `rounded-r-md` bukan
  `rounded-md` supaya border kiri lurus).
- Item tidak aktif: tetap seperti sekarang tapi tambah sedikit jarak vertikal antar item
  (`mb-1` alih-alih `mb-0.5`) dan padding kiri disamakan dengan item aktif supaya teks tidak
  "loncat" saat pindah state.
- Word count di bawah judul (`{(chapter.word_count || 0)...}`) buat sedikit lebih redup dari
  judulnya sendiri di kedua state (sudah pakai `text-[var(--text-muted)]`, itu sudah benar,
  jangan diubah).

## Task 2 — Konten bacaan: scene break & heading lebih rapi

File: `app/globals.css`, blok Reading Mode.

1. `.r-chapter-heading` — saat ini rata kiri/sesuai `--r-text-align`. Ubah jadi **selalu center**
   terlepas dari text-align preference user (judul bab beda kebutuhan dengan isi paragraf):
   `text-align: center;` (hapus `text-align: var(--r-text-align);` dari rule ini saja, jangan
   sentuh `.r-content`).
2. Tambahkan style untuk pemisah adegan. Saat ini kalau penulis pakai markdown `---` di tengah
   bab, react-markdown render jadi `<hr>` polos. Tambahkan rule baru:
   ```css
   .r-content hr {
     border: none;
     text-align: center;
     margin: 2.5em 0;
     height: 1em;
   }
   .r-content hr::before {
     content: "◇ ◇ ◇";
     color: var(--text-muted);
     letter-spacing: 0.3em;
     font-size: 13px;
     font-family: var(--font-sans);
   }
   ```
3. Tambahkan style dialog/quote yang lebih jelas. Kalau penulis pakai markdown blockquote (`>`)
   untuk dialog atau kutipan, saat ini tidak ada style khusus. Tambahkan:
   ```css
   .r-content blockquote {
     margin: 0 0 1.4em;
     padding-left: 14px;
     border-left: 2px solid var(--border);
     color: var(--text);
     font-style: normal;
   }
   ```

## Task 3 — Topbar: kelompok kontrol dikasih pemisah visual

File: `components/reader/ReaderTopbar.tsx`

Grup kontrol (font family, font size, alignment, width, theme) sekarang nempel jadi satu baris
tanpa pengelompokan visual. Tambahkan separator tipis vertikal di antara: (font family) |
(font size + alignment) | (width + theme), pakai elemen kecil:
```tsx
<span className="w-px h-4 bg-[var(--border)] mx-0.5" aria-hidden="true" />
```
Sisipkan dua `<span>` ini di antara grup yang sesuai di dalam div `flex gap-1.5 items-center`
yang sudah ada. Jangan ubah logic/handler apa pun, ini murni visual grouping.

---

## Batasan penting
- Jangan ubah nama props, store (`useReaderStore`), atau logic apa pun — murni CSS/className/JSX
  struktural kecil.
- Jangan hardcode warna hex baru di mana pun — selalu lewat CSS var yang sudah ada.
- Pastikan class Tailwind arbitrary value yang sudah ada tetap konsisten formatnya
  (`text-[var(--text-muted)]`, dst).
- Test di minimal 2 tema (light dan dark) setelah selesai — pastikan kontras tetap bagus,
  terutama border aksen TOC dan warna `◇ ◇ ◇` scene break.
- Jangan sentuh breakpoint mobile (`max-md:*`) yang sudah ada di ReaderTopbar/ReaderTOC.
