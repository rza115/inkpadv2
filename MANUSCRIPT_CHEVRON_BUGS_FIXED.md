# Manuscript Editor Chevron Bugs - FIXED ✅

**Date:** 2026-07-14  
**File Modified:** `components/manuscript/EditorPanel.tsx`  
**Patch References:** 
- `patch/FIX_MANUSCRIPT_CHEVRON_BUGS.md` (initial fix)
- `patch/FIX_MANUSCRIPT_CHEVRON_UNHIDE.md` (corrected approach - applied)

---

## Summary

Fixed two critical chevron toggle bugs in the manuscript editor toolbar. The initial fix made the collapse work but introduced a regression where the toggle buttons themselves disappeared when collapsed. The corrected approach uses a split-wrapper pattern to keep toggle buttons always visible.

---

## The Problem & Solution Evolution

### Initial Issue
Two chevron toggle buttons existed but had different problems:
1. **Headers chevron**: State was updating but rows weren't collapsing
2. **Typography chevron**: Row had conflicting Tailwind classes causing incomplete collapse

### First Fix Attempt
Added conditional className logic to make rows collapse - this worked for hiding, but created a **regression**: the toggle buttons lived inside the collapsing rows, so once collapsed, there was no button to click to unhide them.

### Final Solution ✅
**Split-wrapper pattern** - separates each toolbar into:
1. **Outer wrapper** (always visible) - holds only the toggle button
2. **Inner content wrapper** (collapsible) - holds all other controls, toggles between full classes and `"hidden"`

This ensures toggle buttons remain accessible even when content is collapsed.

---

## Bug 1: Headers Chevron - Split Wrapper Fix ✅

**Location:** Lines 503-531  
**Button ID:** `toggle-headers-btn`

### Structure
```tsx
<div className="flex items-center border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
  {/* Inner content wrapper - collapsible */}
  <div
    className={
      headersCollapsed
        ? "hidden"
        : "flex items-center gap-1 px-4 py-2 flex-1 min-w-0"
    }
  >
    {/* Bold/Italic/Heading/AI buttons */}
  </div>

  {/* Toggle button - always visible */}
  <button
    className="... ml-auto shrink-0"
    id="toggle-headers-btn"
    onClick={toggleHeadersCollapsed}
  >
    <i className={`ti ti-chevron-${headersCollapsed ? 'down' : 'up'}`} />
  </button>
</div>
```

### Key Changes
- Outer `<div>` has static classes (no conditional logic) - never collapses
- Inner `<div>` toggles between full layout and `"hidden"` 
- Toggle button is a sibling of inner div, not a child - always stays visible
- Title/icon row (line 436) still collapses as a whole (unaffected)

---

## Bug 2: Typography Chevron - Split Wrapper Fix ✅

**Location:** Lines 533-570  
**Element ID:** `editor-typography-bar`

### Structure
```tsx
<div className="flex items-center border-b border-[var(--border)] bg-[var(--surface)] text-xs shrink-0" id="editor-typography-bar">
  {/* Inner content wrapper - collapsible */}
  <div
    className={
      typographyCollapsed
        ? "hidden"
        : "flex items-center gap-3 px-4 py-2 flex-1 min-w-0"
    }
  >
    {/* Font/Size/Spacing selects + Kertas button */}
  </div>

  {/* Toggle button - always visible */}
  <button
    className="... ml-auto mr-3 shrink-0"
    id="typography-bar-toggle"
    onClick={toggleTypographyCollapsed}
  >
    <i className={`ti ti-chevron-${typographyCollapsed ? 'down' : 'up'}`} />
  </button>
</div>
```

### Key Changes
- Outer `<div>` maintains border/background - never collapses
- Inner `<div>` uses clean toggle: `"hidden"` vs full layout (no conflicting classes)
- Toggle button remains accessible as sibling, not child
- Added `mr-3` for proper spacing when collapsed

---

## Technical Benefits

✅ **No Tailwind class conflicts** - uses `"hidden"` instead of layering `py-0` over `py-2`  
✅ **Always accessible toggle** - buttons never disappear with content  
✅ **Clean state management** - simple boolean toggle, no complex CSS logic  
✅ **Proper visual hierarchy** - outer wrapper maintains row structure  
✅ **Smooth UX** - clicking chevron always works, regardless of collapsed state

---

## Testing Checklist

- [x] Headers chevron collapses Bold/Italic/Heading/AI row
- [x] Typography chevron collapses Font/Size/Spacing controls
- [x] Both toggle buttons remain visible when collapsed
- [x] Both toggle buttons remain clickable to expand content
- [x] Chevron icons flip direction correctly (up/down)
- [x] Collapsed states persist after page reload
- [x] No visual glitches or layout jumps
- [x] Thin outer bar remains visible showing toggle button

---

## Pattern Notes

This split-wrapper pattern should be used anytime a collapsible section contains its own toggle control:

```tsx
{/* ✅ CORRECT: Split wrapper pattern */}
<div className="outer-always-visible">
  <div className={collapsed ? "hidden" : "content-classes"}>
    {/* collapsible content */}
  </div>
  <button onClick={toggle}>Toggle</button>
</div>

{/* ❌ WRONG: Toggle inside collapsible */}
<div className={collapsed ? "h-0 overflow-hidden" : "visible-classes"}>
  {/* content */}
  <button onClick={toggle}>Toggle</button> {/* disappears! */}
</div>
```
