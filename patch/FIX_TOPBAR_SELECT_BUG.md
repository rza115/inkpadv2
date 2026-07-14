# Fix: Font-family select rusak di ReaderTopbar

## Root cause
`components/ui/Select.tsx` membungkus `<select>` di dalam `<div className="field">`.
Class `.field` di `app/globals.css` (ada di dua tempat, baris ~882 dan ~1344) diset
`margin-bottom: 12px` / `14px` — didesain untuk form vertikal, bukan untuk dipasang
di dalam row horizontal seperti topbar. Ini bikin dropdown font-family di
`ReaderTopbar.tsx` ke-geser/terpotong secara vertikal karena `align-items: center`
di parent flex tetap menghitung margin itu sebagai bagian tinggi elemen.

## Fix
Di `components/reader/ReaderTopbar.tsx`, jangan pakai wrapper `.field` bawaan
`<Select>` untuk kasus ini. Tambahkan class `[&_.field]:mb-0` pada elemen div
pembungkus terdekat yang membungkus komponen `<Select id="font-family-select" .../>`
di ReaderTopbar — atau, kalau `<Select>` tidak dibungkus manual, bungkus langsung:

```tsx
<div className="[&_.field]:mb-0 [&_.field]:contents">
  <Select
    id="font-family-select"
    value={preferences.fontFamily}
    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
    className="bg-transparent border border-[var(--border)] text-[var(--text-muted)] rounded-md h-7 px-2 pr-6 text-[11px] cursor-pointer appearance-none max-w-[108px] hover:text-[var(--text)] hover:border-[var(--accent)] focus:text-[var(--text)] focus:border-[var(--accent)] focus:outline-none max-md:max-w-[88px] max-md:text-[10px]"
  >
    {FONT_FAMILIES.map((font) => (
      <option key={font} value={font}>
        {font.charAt(0).toUpperCase() + font.slice(1)}
      </option>
    ))}
  </Select>
</div>
```

`[&_.field]:contents` membuat div `.field` di dalamnya jadi `display: contents`
(hilang secara layout, tapi elemen di dalamnya tetap render), sehingga margin-bottom
dari `.field` tidak lagi memengaruhi tinggi/posisi select di dalam flex row topbar.

## Verifikasi
- Buka reader page, pastikan dropdown font-family sejajar vertikal sama tombol-tombol
  lain di sebelahnya (back, TOC toggle sudah benar; font-sm/font-lg/align/width/theme
  juga harus sejajar).
- Test di lebar layar sempit (mobile breakpoint, di bawah 768px) — pastikan dropdown
  tetap sejajar dan tidak terpotong.
- Setelah deploy, kalau masih terlihat sama seperti sebelumnya, kemungkinan besar itu
  cache dari `public/service-worker.js`. Hard refresh (Ctrl+Shift+R) atau unregister
  service worker dulu sebelum cek ulang — ini pola bug yang sudah beberapa kali
  muncul di project ini (lihat EPUB_BUGS_FIXED.md).
