# Character Page CSS Fix

## Issue
The character page CSS was broken due to two mismatches between the legacy CSS and the Next.js implementation:

1. **CSS Selector Mismatch**: The CSS defined styles for `.char-grid` (class), but the component used `#character-grid` (ID)
2. **Missing data-page Attribute**: The CSS selectors used `body[data-page="characters"]` but Next.js wasn't setting this attribute

## Root Cause
During the Next.js migration, the legacy HTML structure was converted to React components, but:
- The ID was changed from a class to an ID without updating the CSS
- The `data-page` attribute system wasn't migrated from the legacy JavaScript initialization

## Solution

### 1. Fixed CSS Selector (public/css/base.css)
Added support for both the legacy class and the new ID:
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
Injected a client-side script to set the `data-page` attribute based on the current route:
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

## Files Modified
- `app/layout.tsx` - Added data-page attribute initialization script
- `public/css/base.css` - Added `#character-grid` selector alongside `.char-grid`

## Impact
This fix ensures that:
- Character cards display in a proper grid layout
- All character page styles (cards, photos, badges, modals) work correctly
- The fix is backward compatible with any remaining legacy code
- Other pages using the same CSS pattern (plot, worldbuilding, notes) will also benefit from the data-page system

## Testing
Navigate to `/characters?project=<project-id>` to verify:
- Character grid displays correctly
- Character cards are properly styled
- Hover effects work
- Modal dialogs have correct styling
