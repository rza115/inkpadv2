# Fix: 404 saat load illustrations di reader page

## File
`app/reader/page.tsx` baris ~112

## Root cause
Query Supabase salah nembak nama tabel:

```ts
const { data, error } = await supabase
  .from("illustrations")   // ❌ tabel ini tidak ada
  .select("*")
  .eq("chapter_id", activeChapter.id)
  .order("order_index");
```

Di database, tabelnya bernama `chapter_illustrations` (bisa dicek di Supabase
Table Editor). Karena PostgREST tidak menemukan tabel `illustrations` di schema
cache, endpoint `.../rest/v1/illustrations?...` selalu balikin 404, dan itu yang
memicu error berulang di console (`Failed to load illustrations`) serta
error network di service worker (fetch event untuk request tersebut resolve
sebagai response gagal).

## Fix
Ganti nama tabel di query jadi `chapter_illustrations`:

```ts
const { data, error } = await supabase
  .from("chapter_illustrations")
  .select("*")
  .eq("chapter_id", activeChapter.id)
  .order("order_index");
```

Cari juga di seluruh codebase kalau-kalau ada pemanggilan `.from("illustrations")`
lain yang perlu diganti (search case-insensitive, termasuk di file API route kalau
ada) — pastikan semuanya konsisten pakai `chapter_illustrations`.

## Verifikasi
- Buka reader page di bab yang punya ilustrasi, pastikan tidak ada lagi 404 di
  Network tab untuk endpoint `.../rest/v1/illustrations`.
- Pastikan ilustrasi (kalau ada datanya di tabel `chapter_illustrations`) benar-benar
  muncul di reader, bukan cuma error hilang tapi datanya juga kosong.
