# Manuscript Page CSS Fix

**Date:** July 3, 2026  
**Issue:** Manuscript page layout/styling completely broken  
**Status:** ✅ **EMERGENCY FIX APPLIED**

---

## 🐛 Root Cause

The manuscript page's CSS selectors use `body[data-page="manuscript"]` to scope styles. The `app/layout.tsx` had a script in the `<head>` that tried to set this attribute:

```javascript
// BROKEN: Ran in <head> before <body> existed
<script>
  if (page) document.body.setAttribute('data-page', page);
</script>
```

**Problem:** In Next.js App Router, the script runs before `<body>` element is created, so the attribute was never set, and all `manuscript.css` styles failed to apply.

---

## ✅ Fix Applied

**Removed the broken script** from `app/layout.tsx` (lines 53-72).

The manuscript page already has working code to set the attribute in its own `useEffect`:

```typescript
// app/manuscript/page.tsx - Lines 38-40
useEffect(() => {
  if (!projectId || initialized.current) return;
  initialized.current = true;

  // Set body attributes for CSS ✅ This works!
  document.body.dataset.layout = "project";
  document.body.dataset.page = "manuscript";
  
  // Load data...
}, [projectId]);
```

This runs **after** the component mounts, when `document.body` definitely exists.

---

## ✅ CSS Loading Verified

The `manuscript.css` file is correctly loaded in `app/layout.tsx`:

```tsx
<head>
  <link rel="stylesheet" href="/css/manuscript.css" />
  <link rel="stylesheet" href="/css/reader.css" />
</head>
```

---

## 🧪 Testing Required

Please test the manuscript page now:

- [ ] Navigate to `/manuscript?project=<your-project-id>`
- [ ] Verify chapter panel appears on the left
- [ ] Verify editor panel appears in the center
- [ ] Verify context panel appears on the right
- [ ] Check mobile responsive layout
- [ ] Test theme switching (light, dark, sepia, forest)
- [ ] Test drag-drop chapter ordering
- [ ] Test typography controls

---

## 🔮 Next Steps

### Option A: Keep This Fix (If It Works)
If the manuscript page now displays correctly:
- ✅ Emergency resolved
- ✅ Page functional again
- ⚠️ Still using legacy CSS (but stable)
- 📝 Document this as a working solution

### Option B: Proceed with Tailwind Migration
If you want to modernize and eliminate the `body[data-page]` dependency:

**Benefits:**
- No more fragile attribute selectors
- Modern Tailwind utilities
- Consistent with other migrated pages
- Remove 1,976 lines of legacy CSS

**Time Investment:**
- Phase 1: Layout structure (1-2 hours)
- Phase 2: ChapterPanel component (1-2 hours)
- Phase 3: EditorPanel component (2-3 hours)
- Phase 4: ContextPanel component (1-2 hours)
- Phase 5: Mobile responsive (1 hour)
- **Total: 6-10 hours**

---

## 📋 Tailwind Migration Plan (If Proceeding)

### Component Priority:

1. **manuscript-shell** → `flex flex-1 min-h-0`
2. **chapter-panel** → `w-[220px] border-r border-[var(--border)] flex flex-col shrink-0`
3. **editor-panel** → `flex-1 flex flex-col min-w-0`
4. **context-panel** → `w-[200px] border-l border-[var(--border)] shrink-0 p-4`

### Files to Update:
- `components/manuscript/ChapterPanel.tsx`
- `components/manuscript/EditorPanel.tsx`
- `components/manuscript/ContextPanel.tsx`
- `app/manuscript/page.tsx`

### Can Remove After Migration:
- `public/css/manuscript.css` (1,976 lines)
- Body attribute dependency
- Dynamic CSS loading logic

---

## 🎯 Recommendation

**Try the fix first:**
1. Reload the manuscript page
2. Check if layout appears correctly
3. If yes → Keep this fix, document success
4. If no → Proceed with Tailwind migration

The emergency fix should work because the page's `useEffect` sets the attribute correctly. If it doesn't work, we'll need to investigate further or proceed with the full Tailwind rebuild.

---

## 📝 Changes Made

**File:** `app/layout.tsx`  
**Change:** Removed lines 53-72 (broken script that tried to set body attribute before body existed)  
**Result:** Manuscript page now relies on its own `useEffect` hook to set attributes after mounting

**Status:** Ready for testing! 🚀
