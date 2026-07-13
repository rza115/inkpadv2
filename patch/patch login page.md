# Patch: Fix layout numpuk di halaman login

## File target
`app/login/page.tsx`

## Masalah
Ada duplikasi struktur: wrapper luar (`<div className="w-full max-w-sm bg-[var(--surface)] border ... rounded-[var(--radius-lg)] p-8 shadow-sm">`) sudah punya styling kartu sendiri (background, border, shadow, padding), lalu di dalamnya ada blok "Brand" (logo "Inkpad" + cursor blink) DAN card putih kedua (`bg-white ... rounded-[18px] ... p-11`) yang juga punya brand-nya sendiri.

Akibatnya render dua "kartu" bertumpuk dengan jarak cuma `mb-1` (4px), dan gradient top border card kedua terlihat menembus/nabrak card pertama.

Bug ini terjadi di **dua tempat** dalam file yang sama:
1. Return block saat `authLoading === true` (loading state)
2. Return block utama (form login/signup)

## Instruksi perbaikan

### 1. Loading state block
Cari:
```tsx
if (authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 shadow-sm">
        <div className="flex items-baseline gap-1 mb-1">
          <h1 className="brand-title text-3xl font-serif">Inkpad</h1>
          <span className="w-0.5 h-6 bg-[var(--accent)] cursor" aria-hidden="true"></span>
        </div>
        <p className="text-[var(--text-muted)] text-sm tracking-wide mb-7">Memuat…</p>
      </div>
    </div>
  );
}
```

Ganti jadi single-card, konsisten dengan styling card di return utama:
```tsx
if (authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div
        className="w-full max-w-sm bg-white border rounded-[18px] shadow-[0_24px_60px_-20px_rgba(34,29,43,0.16),_0_2px_10px_rgba(34,29,43,0.04)] p-11 pb-9 relative"
        style={{ borderColor: 'var(--novelist-line)' }}
      >
        <div
          className="absolute top-0 left-6 right-6 h-[3px] rounded-b-[3px]"
          style={{ background: 'linear-gradient(90deg, var(--novelist-lavender), var(--novelist-pink))' }}
        ></div>
        <div className="flex items-baseline gap-2.5 mb-1.5">
          <h1
            className="font-serif font-semibold text-[32px] tracking-[0.2px]"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--novelist-ink)' }}
          >
            Inkpad
          </h1>
          <span
            className="w-1.5 h-1.5 rounded-full -translate-y-2"
            style={{ background: 'var(--novelist-pink)' }}
          ></span>
        </div>
        <p className="text-sm" style={{ color: 'var(--novelist-ink-soft)' }}>Memuat…</p>
      </div>
    </div>
  );
}
```

### 2. Return block utama
Cari pembuka:
```tsx
return (
  <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
    <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 shadow-sm">
      {/* Brand */}
      <div className="flex items-baseline gap-1 mb-1">
        <h1 className="brand-title text-3xl font-serif">Inkpad</h1>
        <span className="w-0.5 h-6 bg-[var(--accent)] cursor" aria-hidden="true"></span>
      </div>

      {/* Card */}
      <div
        className="bg-white border rounded-[18px] shadow-[0_24px_60px_-20px_rgba(34,29,43,0.16),_0_2px_10px_rgba(34,29,43,0.04)] p-11 pb-9 relative"
        style={{ borderColor: 'var(--novelist-line)' }}
      >
```

Ganti jadi:
```tsx
return (
  <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
    {/* Single Card - no more duplicate outer wrapper/brand */}
    <div
      className="w-full max-w-sm bg-white border rounded-[18px] shadow-[0_24px_60px_-20px_rgba(34,29,43,0.16),_0_2px_10px_rgba(34,29,43,0.04)] p-11 pb-9 relative"
      style={{ borderColor: 'var(--novelist-line)' }}
    >
```

**Hapus** blok "Brand" luar (logo `Inkpad|` + cursor) sepenuhnya — sudah tergantikan oleh Brand yang ada di dalam card.

### 3. Penutup tag
Karena satu level nesting `<div>` dihapus (wrapper luar), hapus juga satu `</div>` penutup ekstra di akhir file, tepat sebelum penutup:
```tsx
      </div>
    </div>
  );
}
```
menjadi:
```tsx
      </div>
    </div>
  );
}
```
(pastikan jumlah `</div>` yang menutup sesuai — dari 3 closing div di akhir jadi 2, karena wrapper card luar sudah dihapus).

## Verifikasi setelah patch
- [ ] Hanya ada satu elemen kartu (`bg-white ... rounded-[18px]`) yang membungkus logo + form.
- [ ] Tidak ada lagi elemen `brand-title` / `cursor` blinking bar di luar card.
- [ ] Loading state (`authLoading`) dan return utama punya struktur card yang identik.
- [ ] `npm run build` / `next dev` tidak error JSX (tag matching).
