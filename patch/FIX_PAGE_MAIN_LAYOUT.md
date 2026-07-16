# Fix: Layout #page-main nempel ke nav (halaman Karakter dkk)

## Root cause
`components/Nav.tsx` cuma render `{children}` langsung tanpa wrapper padding
apa pun. Setiap halaman (`characters`, `notes`, `plot`, `worldbuilding`,
`epub-library`, `page.tsx` hub) punya `<main id="page-main">` sendiri-sendiri,
tapi elemen `#page-main` ini TIDAK punya CSS padding di mana pun (sudah dicek,
tidak ada di `globals.css` atau file lain). Beberapa halaman nambahin padding
manual ke div di dalamnya secara ad-hoc dan tidak konsisten (worldbuilding
pakai `p-4 px-6` di toolbar-nya, hub pakai `p-0` eksplisit, characters/notes/
plot sama sekali tidak ada) — makanya kartu di halaman Karakter nempel ke
sidebar dan header.

Perkecualian: `app/manuscript/page.tsx` baris ~102 sengaja pakai
`<main id="page-main" className="flex flex-1 min-h-0 overflow-hidden">` untuk
split-panel editor (ChapterPanel + EditorPanel) yang MEMANG harus full-bleed
edge-to-edge. Jangan kasih padding di situ.

## Fix — single source of truth di globals.css

Tambahkan rule ini di `app/globals.css` (di dekat rule layout lain, misal
setelah definisi header/nav):

```css
#page-main {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  min-width: 0;
}

/* Opt-out untuk halaman yang butuh full-bleed (mis. manuscript split editor) */
#page-main[data-fullbleed] {
  padding: 0;
  overflow: hidden;
}
```

## Perubahan di komponen

Di `app/manuscript/page.tsx`, pada `<main>` yang berisi ChapterPanel/EditorPanel
(baris ~102), tambahkan attribute `data-fullbleed`:

```tsx
<main id="page-main" data-fullbleed className="flex flex-1 min-h-0 overflow-hidden">
```

Semua `<main id="page-main">` lain (characters, notes, plot, worldbuilding,
epub-library, hub, dan state loading/empty di manuscript) TIDAK perlu diubah —
otomatis dapat padding 24px dari rule global di atas.

## Cek ulang setelah fix (potensi double-padding)
- `app/worldbuilding/page.tsx` baris ~112: div toolbar-nya pakai
  `className="p-4 px-6 border-b border-default"` yang sebelumnya sengaja full-width
  buat jadi garis pembatas edge-to-edge. Setelah `#page-main` dapat padding 24px,
  border itu otomatis ikut ke-inset (tidak full-width lagi). Ini kemungkinan
  besar malah lebih rapi & konsisten dengan halaman lain — tapi cek visual dulu,
  kalau memang dulu sengaja didesain full-width, mungkin perlu di-`negative margin`
  (`-mx-6 -mt-6`) biar tetap bleeding ke tepi.
- `app/page.tsx` (hub) baris ~103: ada `className="max-w-[1200px] mx-auto p-0"` —
  `p-0` di situ sekarang jadi mubazir/berlawanan sama padding baru dari
  `#page-main`, tapi tidak konflik (cuma padding di div dalam = 0, padding di
  main tetap 24px). Aman, tidak perlu diubah, tapi boleh dihapus `p-0`-nya biar
  bersih.

## Verifikasi
- Buka halaman Karakter — kartu "Karakter baru" harus punya jarak dari sidebar
  kiri dan header atas, bukan nempel.
- Buka Notes dan Plot & Foreshadow — pastikan sama-sama dapat jarak.
- Buka Manuscript (halaman editor dengan panel bab) — pastikan TETAP full-bleed
  seperti sebelumnya, TIDAK ada padding baru yang bikin panel jadi sempit/ada
  celah aneh di tepi.
- Cek Project Hub (halaman utama `/`) — pastikan grid project card masih rapi,
  tidak ada padding dobel yang bikin terlalu banyak jarak.
