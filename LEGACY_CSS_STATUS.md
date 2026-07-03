# Legacy CSS Status Report

**Date:** July 3, 2026  
**After:** Reader Page Migration Complete

---

## 📊 Overview

### ✅ Fully Migrated to Tailwind
- **Manuscript Page** - ChapterPanel, EditorPanel, ContextPanel (100% Tailwind)
- **Reader Page** - ReaderTopbar, ReaderTOC, ReaderContent layout (Hybrid: Tailwind + minimal CSS)
- **Characters Page** - CharacterCard (Tailwind)
- **Plot Page** - ArcCard, ForeshadowItem (Tailwind)
- **Notes Page** - NoteCard (Tailwind)
- **Worldbuilding Page** - WorldEntryCard (Tailwind)
- **Hub Page** - ProjectCard (Tailwind)
- **Nav Component** - Navigation (Tailwind)
- **Login Page** - Login form (Tailwind)

### 🔄 Still Using Legacy CSS

#### 1. **base.css** (~400+ lines)
**Status:** Partially migrated  
**Contains:**
- ❌ Theme transition styles
- ❌ Brand typography (`.brand`, `.brand-title`)
- ✅ Hub page styles (MIGRATED - now in Tailwind)
- ✅ Project card styles (MIGRATED - now in Tailwind)
- ❌ Modal styles (`.modal-overlay`, `.modal-card`)
- ❌ Form field styles
- ✅ Login page styles (MIGRATED - now in Tailwind)
- ❌ Cover upload styles

**Why Still Needed:**
- Modal system used across multiple pages
- Form field styles are global
- Cover upload component not yet refactored

**Migration Priority:** HIGH (next target)

#### 2. **layout.css** (~200 lines)
**Status:** Not migrated  
**Contains:**
- ❌ App shell layout (`.app-shell`)
- ❌ Sidebar navigation (`.sidebar`, `.nav-icon`)
- ❌ Topbar (`.topbar`, `.topbar-right`)
- ❌ Content area (`.content-area`)
- ❌ Sync status indicator

**Why Still Needed:**
- Main app layout structure
- Used by all pages with sidebar navigation

**Migration Priority:** HIGH (should be done soon)

#### 3. **components.css** (~600+ lines)
**Status:** Not migrated  
**Contains:**
- ❌ Crosslink suggestion dropdown (`.xlink-suggest-dropdown`)
- ❌ Toast notifications (`.toast`)
- ❌ Focus mode styles (`.manuscript-shell.focus-mode`)
- ❌ Export dropdown (`.export-dropdown`)
- ❌ AI modal (`.ai-modal-overlay`, `.ai-modal-card`)

**Why Still Needed:**
- Shared components used across multiple pages
- Complex interactive components (AI modal, crosslink dropdown)

**Migration Priority:** MEDIUM (after layout.css)

#### 4. **epub-reader.css** (~500+ lines)
**Status:** Not migrated  
**Contains:**
- ❌ EPUB library page styles
- ❌ EPUB reader topbar
- ❌ EPUB TOC sidebar
- ❌ EPUB viewer iframe container
- ❌ Format panel

**Why Still Needed:**
- Separate EPUB reading functionality
- Different from novel reader
- Not yet prioritized for migration

**Migration Priority:** LOW (separate feature, works fine)

#### 5. **splash.css** (~50 lines)
**Status:** Not migrated  
**Contains:**
- ❌ PWA splash screen styles
- ❌ Loading animation

**Why Still Needed:**
- PWA splash screen functionality
- Small, focused file
- Not a priority

**Migration Priority:** LOW (PWA-specific, small file)

#### 6. **reader-typography.css** (~218 lines)
**Status:** NEW FILE - Minimal CSS  
**Contains:**
- ✅ Typography system for dynamic content
- ✅ Font families, sizes, alignment
- ✅ Content styles (paragraphs, headings)
- ✅ Crosslinks, illustrations, chapter nav

**Why Needed:**
- Dynamic HTML generation via `innerHTML`
- Cannot use Tailwind on dynamically generated content
- Minimal and focused

**Migration Priority:** N/A (intentional hybrid approach)

#### 7. **reader.css** (~424 lines)
**Status:** ⚠️ OBSOLETE - Should be deleted  
**Contains:**
- ❌ Old reader styles (now replaced)

**Action Required:** DELETE THIS FILE

---

## 📈 Migration Progress

### Total CSS Lines (Approximate)

| File | Lines | Status | Action |
|------|-------|--------|--------|
| **base.css** | ~400 | 🔄 Partial | Migrate modals, forms |
| **layout.css** | ~200 | ❌ Legacy | Migrate app shell |
| **components.css** | ~600 | ❌ Legacy | Migrate shared components |
| **epub-reader.css** | ~500 | ❌ Legacy | Low priority |
| **splash.css** | ~50 | ❌ Legacy | Low priority |
| **reader-typography.css** | 218 | ✅ New | Keep (intentional) |
| **reader.css** | 424 | ⚠️ Obsolete | DELETE |
| **manuscript.css** | 0 | ✅ Deleted | Migrated |

**Total Legacy CSS:** ~1,750 lines (excluding reader-typography.css)  
**Total Migrated:** ~850+ lines (manuscript + reader components)  
**Migration Progress:** ~33% complete

---

## 🎯 Next Migration Targets

### Priority 1: Layout System (HIGH)
**Target:** `layout.css` (~200 lines)  
**Impact:** Affects all pages with sidebar  
**Components:**
- App shell container
- Sidebar navigation
- Topbar
- Content area wrapper

**Benefits:**
- Consistent layout across all pages
- Better responsive control
- Easier to maintain

### Priority 2: Base Modals & Forms (HIGH)
**Target:** `base.css` (modals, forms section)  
**Impact:** All pages using modals  
**Components:**
- Modal overlay and card
- Form fields
- Cover upload component

**Benefits:**
- Reusable modal component
- Type-safe form components
- Better accessibility

### Priority 3: Shared Components (MEDIUM)
**Target:** `components.css` (~600 lines)  
**Impact:** Interactive features  
**Components:**
- Toast notifications
- Crosslink dropdown
- AI modal
- Export dropdown

**Benefits:**
- Better React integration
- Easier to test
- More maintainable

---

## 🧹 Cleanup Tasks

### Immediate
1. **Delete `reader.css`** - Now replaced by `reader-typography.css`
2. **Remove unused CSS from `base.css`** - Hub, ProjectCard, Login styles now in Tailwind
3. **Update CSS references** - Ensure no files still reference old CSS

### Short-term
1. **Audit `base.css`** - Identify what's actually being used
2. **Extract modal system** - Create reusable React modal component
3. **Extract form components** - Create reusable form field components

---

## 💡 Recommendations

### 1. Continue Hybrid Approach
For features with dynamic HTML generation (like reader content), keep minimal CSS. Don't force full Tailwind migration where it doesn't make sense.

### 2. Component-First Migration
Migrate CSS by component, not by file. Extract reusable components as you migrate:
- `<Modal>` component (replace modal CSS)
- `<FormField>` component (replace field CSS)
- `<Toast>` component (replace toast CSS)

### 3. Gradual Migration
Don't rush. The current state is stable and functional. Migrate as you work on features:
- Adding new feature? Use Tailwind
- Fixing bug in component? Migrate to Tailwind
- No active work? Leave as-is

### 4. Test Thoroughly
Each migration should be tested across:
- Desktop and mobile
- All theme variants (light, dark, sepia)
- Different user preferences
- Edge cases

---

## ✅ Success Metrics

### What We've Achieved
- ✅ Manuscript page: 100% Tailwind
- ✅ Reader page: 95% Tailwind (5% intentional CSS)
- ✅ 48% CSS reduction in reader
- ✅ All card components migrated
- ✅ Better code organization
- ✅ Improved maintainability

### What's Left
- 🎯 Layout system migration
- 🎯 Modal component migration
- 🎯 Shared components migration
- 🎯 EPUB reader migration (optional)

**Overall Assessment:** Good progress. About 1/3 complete. Continue steady migration with hybrid approach where appropriate.
