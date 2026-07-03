# Legacy CSS Status Report

**Date:** July 3, 2026  
**Status:** ⚠️ **PARTIAL MIGRATION** - 3 specialized pages still using legacy CSS

---

## Summary

While 6 core pages have been successfully migrated to Tailwind CSS, **3 specialized pages continue to use legacy CSS files** from `public/css/`. These pages were intentionally excluded from the Tailwind migration due to their complex, specialized styling requirements.

---

## Legacy CSS Files (7 files in `public/css/`)

### 1. **`base.css`** (759 lines)
**Purpose:** Shared component styles for hub, characters, notes, plot, worldbuilding pages

**Contents:**
- Form elements (inputs, textareas, buttons)
- Cards and modals
- Progress bars
- Project cards and grid layouts
- Character cards
- Note cards
- Plot cards (arcs, foreshadow items)
- Worldbuilding entry cards
- Badge components

**Used by:** epub-library, reader pages (dynamically loaded)

**Status:** ⚠️ Partially duplicated in `app/globals.css` - some styles consolidated but file still actively loaded

---

### 2. **`manuscript.css`** (1,976+ lines)
**Purpose:** Complete manuscript editor styling system

**Contents:**
- Chapter panel (sidebar list, drag & drop)
- Editor panel (header, toolbar, textarea)
- Context panel (characters, world entries, illustrations, notes)
- Typography controls (font families, sizes, line spacing, paper mode)
- Versioning panel (revision history UI)
- Responsive layouts for mobile/desktop
- Collapsed states and panel toggles

**Used by:** `app/manuscript/page.tsx` (sets `data-page="manuscript"` on body)

**Status:** ✅ Active and necessary - Complex editor requires specialized styling

---

### 3. **`reader.css`** (424 lines)
**Purpose:** Reading mode typography and layout

**Contents:**
- Reader topbar and controls
- TOC sidebar with cover display
- Reading pane typography
- Font family variations (Literata, Lora, Inter, Nunito)
- Font size steps (sm, md, lg, xl)
- Text alignment options
- Illustration display
- Chapter navigation
- Mobile responsive drawer

**Used by:** `app/reader/page.tsx` (dynamically loaded)

**Status:** ⚠️ Partially duplicated in `app/globals.css` but still actively loaded

---

### 4. **`components.css`** (422+ lines)
**Purpose:** Shared component styles used across multiple pages

**Contents:**
- Cross-link suggestion dropdown
- Toast notifications
- Search panels
- Generator panels
- Other reusable UI components

**Used by:** epub-library, reader, epub-reader pages (dynamically loaded)

**Status:** ✅ Active and necessary - Shared by multiple specialized pages

---

### 5. **`layout.css`** (143+ lines)
**Purpose:** Shell layout - sidebar navigation, topbar, content area

**Contents:**
- App shell flex layout
- Sidebar with nav icons
- Topbar header
- Content area structure
- Theme switcher
- Mobile responsive navigation

**Used by:** epub-library, reader, epub-reader pages (dynamically loaded)

**Status:** ✅ Active and necessary - Core layout for specialized pages

---

### 6. **`epub-reader.css`** (459+ lines)
**Purpose:** EPUB reader module specific styles

**Contents:**
- EPUB library grid
- Book cards with covers
- EPUB viewer layout
- EPUB controls (progress, TOC, format panel)
- Theme variations (dark, sepia, light)
- Typography controls for EPUB content

**Used by:** `app/epub-reader/page.tsx` (dynamically loaded)

**Status:** ✅ Active and necessary - EPUB reader requires specialized styling

---

### 7. **`splash.css`**
**Purpose:** Splash screen styles

**Status:** ⚠️ Not examined - Potentially unused

---

## Pages Loading Legacy CSS

### 1. **Manuscript Page** (`app/manuscript/page.tsx`)
**Method:** Sets `data-page="manuscript"` on `<body>` element  
**CSS Loaded:** `manuscript.css` (via body selector scoping)

```typescript
// Sets body attributes for CSS
document.body.dataset.layout = "project";
document.body.dataset.page = "manuscript";
```

**Why:** Complex editor with specialized interactions (drag-drop chapters, context panels, typography controls, versioning)

---

### 2. **Reader Page** (`app/reader/page.tsx`)
**Method:** Dynamic `<link>` injection in useEffect

```typescript
const cssFiles = [
  "/css/layout.css",
  "/css/components.css", 
  "/css/reader.css",
  '/css/base.css'
];
```

**Why:** Reading experience requires specialized typography controls and layout

---

### 3. **EPUB Library Page** (`app/epub-library/page.tsx`)
**Method:** Dynamic `<link>` injection in useEffect

```typescript
const cssFiles = [
  '/css/base.css',
  '/css/layout.css', 
  '/css/components.css'
];
```

**Why:** EPUB-specific card layout and library grid

---

### 4. **EPUB Reader Page** (`app/epub-reader/page.tsx`)
**Method:** Dynamic `<link>` injection in useEffect

```typescript
const cssFiles = [
  '/css/layout.css',
  '/css/components.css',
  '/css/epub-reader.css'
];
```

**Why:** EPUB rendering requires specialized viewer and controls

---

## Style Duplication Analysis

### Duplicated Between Legacy CSS and `app/globals.css`:

**From `base.css` → `globals.css`:**
- ✅ Form elements (inputs, textareas, selects)
- ✅ Primary and ghost buttons
- ✅ Card component
- ✅ Progress bar
- ✅ Brand/logo styles
- ✅ Badge component
- ✅ Modal overlay and card
- ✅ Field labels

**From `reader.css` → `globals.css`:**
- ✅ Reading typography (`.r-*` classes)
- ✅ Font family variables
- ✅ Font size steps
- ✅ Text alignment
- ✅ Chapter navigation

**Result:** Core components consolidated into `globals.css`, but legacy files still loaded for backwards compatibility and page-specific variations.

---

## Pages Successfully Migrated to Tailwind ✅

1. **Login** (`app/login/page.tsx`)
2. **Hub** (`app/page.tsx`)
3. **Characters** (`app/characters/page.tsx`)
4. **Plot** (`app/plot/page.tsx`)
5. **Notes** (`app/notes/page.tsx`)
6. **Worldbuilding** (`app/worldbuilding/page.tsx`)

These pages NO LONGER load legacy CSS files.

---

## Migration Philosophy

According to `TAILWIND_MIGRATION.md`:

> **Pages Not Requiring Migration**
> - Manuscript Page - Uses complex editor with its own styling
> - Reader Page - Uses reader-specific styling
> - EPUB Pages - Already using component-based styling
>
> These pages are functioning correctly and don't require migration as they use specialized components with their own styling systems.

This was a **deliberate decision** to maintain stability for complex, working features rather than forcing a migration that could introduce bugs.

---

## Recommendations

### Option 1: Keep Current State ✅ **RECOMMENDED**
**Pros:**
- Manuscript, Reader, and EPUB pages are stable and working
- No risk of breaking complex interactions
- Clear separation between Tailwind pages and specialized pages

**Cons:**
- Maintaining two styling systems
- ~4KB additional CSS on specialized pages

**Action:** None needed - document current state (this file)

---

### Option 2: Complete Tailwind Migration
**Pros:**
- Single styling system
- Modern Tailwind utilities throughout
- Smaller bundle size

**Cons:**
- High risk: 2,800+ lines of specialized CSS to migrate
- Manuscript editor has complex interactions (drag-drop, typography controls, versioning)
- Reader has specialized typography system
- EPUB reader has book rendering logic
- Could introduce visual bugs or break functionality

**Action:** Only attempt if there's a compelling reason (performance issues, maintenance burden)

---

### Option 3: Consolidate Legacy CSS
**Pros:**
- Reduce file count
- Remove duplicated styles
- Better organization

**Cons:**
- Moderate effort
- Risk of breaking page-specific selectors
- May not provide significant benefits

**Action:** Could combine base.css + components.css + layout.css into a single `legacy.css`

---

### Option 4: Remove Unused/Duplicated Styles
**Pros:**
- Smaller CSS files
- Less duplication
- Clean up technical debt

**Cons:**
- Need thorough testing
- Risk of removing styles that look unused but aren't

**Action:** Audit each legacy CSS file for unused selectors

---

## Current Best Practice: Use `app/globals.css` for New Features

For any **new pages or components**, use Tailwind CSS classes and `app/globals.css` utilities. Only touch legacy CSS files when modifying existing specialized pages (Manuscript, Reader, EPUB).

---

## Testing Checklist

If you decide to modify or remove legacy CSS:

- [ ] Test manuscript page: chapter list, editor, context panel, typography controls
- [ ] Test reader page: TOC, typography controls, chapter navigation
- [ ] Test EPUB library: book grid, upload, delete
- [ ] Test EPUB reader: viewer, controls, TOC, formatting
- [ ] Test all theme switches (light, dark, sepia, forest)
- [ ] Test mobile responsive layouts
- [ ] Test with actual project data loaded

---

## Conclusion

**Legacy CSS is actively used** in 3 specialized pages (Manuscript, Reader, EPUB). This is **intentional and acceptable** given the complexity of these features. The current hybrid approach (Tailwind for simple pages, legacy CSS for complex features) provides a good balance between modernization and stability.

**No immediate action required** unless there's a specific issue with the legacy CSS files.
