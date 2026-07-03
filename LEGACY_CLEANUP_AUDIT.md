# Legacy JavaScript Cleanup Audit 🧹

## Status: ✅ COMPLETE — All legacy JS files deleted

**Total deleted**: 37 files (Phase 1: 23 + Phase 2: 14)
**Remaining**: 0 files
**Empty dirs**: removed

---

## Phase 1 — 23 files deleted

### Core Infrastructure (7)
- `core/pageInit.js` → Next.js App Router
- `core/splash.js` → React loading states
- `core/auth-guard.js` → `hooks/useAuth.ts`
- `core/nav.js` → `components/Nav.tsx`
- `core/project-context.js` → Zustand stores
- `core/supabase-client.js` → `lib/supabase/client.ts`
- `core/storage.js` → `lib/storage.ts`

### Page Modules (11)
- `modules/hub.js` → `app/page.tsx`
- `modules/characters-page.js` → `app/characters/page.tsx`
- `modules/notes-page.js` → `app/notes/page.tsx`
- `modules/worldbuilding-page.js` → `app/worldbuilding/page.tsx`
- `modules/manuscript.js` → `app/manuscript/page.tsx`
- `modules/plot-page.js` → `app/plot/page.tsx`
- `modules/reader.js` → `app/reader/page.tsx`
- `modules/epub-library-page.js` → `app/epub-library/page.tsx`
- `modules/epub-reader-page.js` → `app/epub-reader/page.tsx`
- `modules/epub-books.js` → `store/useEpubStore.ts`
- `modules/theme.js` → CSS variables in `app/globals.css`

### CRUD Modules (5)
- `modules/chapters.js` → `store/useChapterStore.ts`
- `modules/characters.js` → `store/useCharacterStore.ts`
- `modules/notes.js` → `store/useNotesStore.ts`
- `modules/plot.js` → `store/usePlotStore.ts`
- `modules/worldbuilding.js` → `store/useWorldbuildingStore.ts`

---

## Phase 2 — 14 files deleted

### Core (2)
- `core/offline-queue.js` — no React integration, dead code
- `core/pwa-register.js` — no React integration, dead code

### Modules (6)
- `modules/ai-polish.js` — button exists in React but no handler, no script tag loads it, dead code
- `modules/global-search.js` — no React integration
- `modules/illustrations.js` — no React integration
- `modules/projects.js` — no React integration (Projects module was never a separate page)
- `modules/random-generator.js` — no React integration
- `modules/versioning.js` — React VersioningPanel.tsx is placeholder, legacy JS had real logic but never loaded by any script tag, dead code

### Utils (6)
- `utils/cross-link.js` — replaced by `lib/crosslink.ts`
- `utils/cross-link-suggest.js` — replaced by `lib/crosslink.ts`
- `utils/debounce.js` — no React integration
- `utils/format.js` — no React integration
- `utils/markdown-lite.js` — no React integration
- `utils/markdown-render.js` — no React integration

---

## Remaining files kept (not legacy JS)
- `public/service-worker.js` — PWA service worker (active)
- `public/manifest.json` — PWA manifest (active)
- `public/api/gemini.js` — API function (needs verification if used)

---

## Phase 3 — Next: CSS cleanup
- `/public/css/components.css` — verify in layout.tsx
- `/public/css/layout.css` — verify in layout.tsx
- `/public/css/splash.css` — verify in layout.tsx