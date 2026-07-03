# Next.js Migration Progress

## Overview
This document tracks the migration of Inkpad from vanilla JavaScript to Next.js 16 with React 19, TypeScript, and Zustand.

---

## ✅ Completed Migrations

### 1. **Core Infrastructure**
- [x] Next.js 16.2.4 setup with App Router
- [x] TypeScript configuration
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration

### 2. **Authentication & Data Layer**
- [x] Supabase client setup (`/lib/supabase/client.ts`)
- [x] Auth hook (`/hooks/useAuth.ts`)
- [x] Zustand stores for state management:
  - `useAuthStore.ts`
  - `useChapterStore.ts`
  - `useCharacterStore.ts`
  - `useNotesStore.ts`
  - `usePlotStore.ts`
  - `useProjectStore.ts`
  - `useReaderStore.ts`
  - `useWorldbuildingStore.ts`

### 3. **Type Definitions**
- [x] `types/chapter.ts`
- [x] `types/character.ts`
- [x] `types/note.ts`
- [x] `types/plot.ts`
- [x] `types/project.ts`
- [x] `types/reader.ts`
- [x] `types/worldbuilding.ts`

### 4. **Pages (App Router)**
- [x] `/app/page.tsx` - Hub
- [x] `/app/login/page.tsx`
- [x] `/app/manuscript/page.tsx`
- [x] `/app/characters/page.tsx`
- [x] `/app/worldbuilding/page.tsx`
- [x] `/app/plot/page.tsx`
- [x] `/app/notes/page.tsx`
- [x] `/app/reader/page.tsx`
- [x] `/app/epub-library/page.tsx`
- [x] `/app/epub-reader/page.tsx`

### 5. **React Components**
- [x] Navigation (`components/Nav.tsx`)
- [x] UI Components:
  - Button, Input, Select, Textarea, Modal, Loading
- [x] Manuscript Components:
  - ChapterPanel, EditorPanel, ContextPanel
  - SearchPanel, GeneratorPanel, VersioningPanel
- [x] Characters Components:
  - CharacterCard, CharacterModal
- [x] Worldbuilding Components:
  - WorldEntryCard, WorldEntryModal
- [x] Plot Components:
  - ArcCard, ArcModal, ForeshadowItem, ForeshadowModal
- [x] Notes Components:
  - NoteCard, NoteModal
- [x] Reader Components:
  - ReaderContent, ReaderTOC, ReaderTopbar
- [x] Hub Components:
  - ProjectCard, ProjectModal, CoverModal

### 6. **API Routes**
- [x] `/app/api/gemini/route.ts` - Gemini AI proxy (migrated from `/public/api/gemini.js`)

### 7. **PWA Configuration**
- [x] Updated `service-worker.js` for Next.js routes
- [x] Updated `manifest.json` (changed start_url from `/index.html` to `/`)

---

## ⚠️ Legacy Code (Not Yet Migrated)

### **JavaScript Modules** (`/public/js/`)

These files still exist but may have duplicate or unused functionality:

#### Core Modules (`/public/js/core/`)
- `auth-guard.js` - Authentication guards (now handled by `useAuth` hook)
- `nav.js` - Navigation logic (now in `components/Nav.tsx`)
- `offline-queue.js` - Offline sync queue (needs review)
- `pageInit.js` - Page initialization (obsolete with Next.js)
- `project-context.js` - Project context (now in Zustand stores)
- `pwa-register.js` - PWA registration (may still be needed)
- `splash.js` - Splash screen (obsolete)
- `storage.js` - Storage utilities (now in `/lib/storage.ts`)
- `supabase-client.js` - Old Supabase client (replaced by `/lib/supabase/client.ts`)

#### Feature Modules (`/public/js/modules/`)
- `ai-polish.js` - AI text polishing (integrated in EditorPanel)
- `chapters.js` - Chapter CRUD (now in `useChapterStore`)
- `characters.js` - Character CRUD (now in `useCharacterStore`)
- `characters-page.js` - Character page logic (now in `/app/characters/page.tsx`)
- `epub-books.js` - EPUB management (needs review for epub-library)
- `epub-library-page.js` - EPUB library UI (needs review)
- `epub-reader-page.js` - EPUB reader UI (needs review)
- `global-search.js` - Search & replace (integrated in SearchPanel)
- `hub.js` - Project hub (now in `/app/page.tsx`)
- `illustrations.js` - Illustration uploads (needs review)
- `manuscript.js` - **1161 lines** (mostly replaced by manuscript components)
- `notes-page.js` - Notes UI (now in `/app/notes/page.tsx`)
- `notes.js` - Notes CRUD (now in `useNotesStore`)
- `plot-page.js` - Plot UI (now in `/app/plot/page.tsx`)
- `plot.js` - Plot CRUD (now in `usePlotStore`)
- `projects.js` - Project CRUD (now in `useProjectStore`)
- `random-generator.js` - AI generator (integrated in GeneratorPanel)
- `reader.js` - Reader mode (now in `/app/reader/page.tsx`)
- `theme.js` - Theme management (needs migration to React context)
- `versioning.js` - Revision history (integrated in VersioningPanel)
- `worldbuilding-page.js` - Worldbuilding UI (now in `/app/worldbuilding/page.tsx`)
- `worldbuilding.js` - Worldbuilding CRUD (now in `useWorldbuildingStore`)

#### Utility Modules (`/public/js/utils/`)
- `cross-link.js` - Cross-linking (now in `/lib/crosslink.ts`)
- `cross-link-suggest.js` - Link suggestions (needs review)
- `debounce.js` - Debounce utility (can use lodash or native)
- `format.js` - Formatting utilities (needs review)
- `markdown-lite.js` - Markdown parser (needs review)
- `markdown-render.js` - Markdown renderer (needs review)

### **CSS Files** (`/public/css/`)
These should be converted to Tailwind classes or CSS modules:
- `base.css` - Base styles (partially migrated to `app/globals.css`)
- `components.css` - Component styles
- `epub-reader.css` - EPUB reader styles
- `layout.css` - Layout styles
- `manuscript.css` - Manuscript editor styles
- `reader.css` - Reader mode styles
- `splash.css` - Splash screen styles

---

## 🎯 Next Steps

### High Priority
1. **Review and Remove Duplicate Logic**
   - [ ] Audit `manuscript.js` (1161 lines) - identify what's still needed
   - [ ] Remove obsolete core modules (pageInit.js, splash.js, etc.)
   - [ ] Consolidate theme.js functionality into React context

2. **EPUB Features**
   - [ ] Review epub-books.js, epub-library-page.js, epub-reader-page.js
   - [ ] Ensure EPUB library and reader work with new architecture

3. **Offline Queue**
   - [ ] Review offline-queue.js implementation
   - [ ] Decide if it needs migration or can stay as-is

### Medium Priority
4. **Utility Migration**
   - [ ] Move remaining utilities to `/lib` folder
   - [ ] Convert to TypeScript modules
   - [ ] Add proper type definitions

5. **CSS Refactoring**
   - [ ] Convert legacy CSS to Tailwind utilities
   - [ ] Use CSS modules for component-specific styles
   - [ ] Remove unused CSS files

### Low Priority
6. **Cleanup**
   - [ ] Remove unused legacy JavaScript files
   - [ ] Update documentation
   - [ ] Create deprecation warnings for legacy code paths

---

## 📝 Migration Guidelines

### When Adding New Features
1. Always use Next.js App Router patterns
2. Create TypeScript components, not vanilla JS
3. Use Zustand for state management
4. Use Tailwind for styling
5. Follow existing patterns in `/app` and `/components`

### When Modifying Existing Features
1. Check if legacy JS file has been replaced by React component
2. If replaced: update React component, don't touch legacy file
3. If not replaced: consider migrating to React first
4. Add deprecation comments to legacy files

### Testing After Migration
1. Test offline functionality (service worker, PWA)
2. Test all CRUD operations (chapters, characters, etc.)
3. Test AI features (polish, generator)
4. Test reader modes (reader, epub-reader)
5. Test project management (hub, creation, deletion)

---

## 🔧 Technical Notes

### Supabase Client
- Old: `/public/js/core/supabase-client.js`
- New: `/lib/supabase/client.ts`
- Uses `@supabase/ssr` for server-side rendering support

### State Management
- Old: Global variables and DOM manipulation
- New: Zustand stores with TypeScript
- Stores handle data fetching, caching, and updates

### Routing
- Old: Static HTML files + manual navigation
- New: Next.js App Router with dynamic routes
- Service worker updated to cache new route structure

### API Endpoints
- Old: `/public/api/*.js` (Vercel Functions)
- New: `/app/api/*/route.ts` (Next.js Route Handlers)
- Both still work during transition period

---

## 📊 Migration Progress

**Overall Completion: ~75%**

- ✅ Core infrastructure: 100%
- ✅ Pages and routing: 100%
- ✅ Components: 100%
- ✅ State management: 100%
- ⚠️ Legacy cleanup: 20%
- ⚠️ CSS migration: 40%
- ⚠️ Utility functions: 60%

---

## 🚀 Deployment Notes

### Environment Variables
Ensure these are set in Vercel/deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

### Build Configuration
- Using Next.js static export where possible
- Service worker registered in production
- PWA manifest configured for mobile app experience

---

*Last updated: 2026-07-03*
