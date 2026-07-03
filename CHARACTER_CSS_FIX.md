# CSS Selector Fixes - Multiple Pages

## Overview
Fixed CSS issues across multiple pages where CSS selectors didn't match the component structure after Next.js migration.

## Issues Found

### 1. Character Page
**Problem**: 
- CSS used `.char-grid` (class) but component used `#character-grid` (ID)
- Missing `data-page="characters"` attribute

**Fix**:
- Added `#character-grid` selector alongside `.char-grid` in CSS
- Added global data-page script in layout.tsx

### 2. Worldbuilding Page  
**Problem**:
- CSS used `.world-groups` (class) but component used `#world-groups` (ID)

**Fix**:
- Changed component to use className instead of ID: `<div className="world-groups">`

### 3. Manuscript Page
**Status**: ✅ Already working correctly
- Sets `data-page` attribute directly in component
- All selectors match properly

### 4. Plot Page
**Status**: ✅ Already working correctly
- Uses `.plot-shell` and `.arc-grid` classes that match CSS
- Will benefit from global data-page script

### 5. Notes Page
**Status**: ✅ Already working correctly  
- Uses `.notes-shell` class that matches CSS
- Will benefit from global data-page script

## Root Cause
During the Next.js migration:
- Some HTML elements were changed from classes to IDs without updating CSS
- The legacy `data-page` attribute system wasn't fully migrated

## Solutions Implemented

### 1. Fixed CSS Selector (public/css/base.css)
Added support for both legacy class and new ID on character grid:
```css
body[data-page="characters"] #character-grid,
body[data-page="characters"] .char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  max-width: 900px;
}
```

### 2. Added data-page Attribute System (app/layout.tsx)
Injected a client-side script to set the `data-page` attribute based on current route:
```javascript
const pageMap = {
  '/characters': 'characters',
  '/plot': 'plot',
  '/worldbuilding': 'world',
  '/notes': 'notes',
  '/manuscript': 'manuscript',
  '/reader': 'reader',
  '/epub-reader': 'epub-reader',
  '/epub-library': 'epub-library'
};
```

### 3. Fixed Worldbuilding Component (app/worldbuilding/page.tsx)
Changed from ID to class:
```tsx
// Before: <div id="world-groups">
// After:  <div className="world-groups">
```

## Files Modified
1. `app/layout.tsx` - Added data-page attribute initialization script
2. `public/css/base.css` - Added `#character-grid` selector alongside `.char-grid`
3. `app/worldbuilding/page.tsx` - Changed `#world-groups` to `.world-groups`

## Impact
These fixes ensure that:
- All page-specific CSS styles work correctly
- Grid layouts display properly across all pages
- Hover effects, transitions, and animations work
- Modal dialogs have correct styling
- The fixes are backward compatible with any remaining legacy code

## Testing Checklist
- [x] Character page grid displays correctly
- [x] Worldbuilding page grid displays correctly
- [x] Plot page grid displays correctly
- [x] Notes page list displays correctly
- [x] Manuscript page panels display correctly
- [x] All hover effects work
- [x] Modal dialogs styled correctly
