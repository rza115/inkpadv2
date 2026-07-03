# EPUB Feature Migration Status

## 📊 Current Status: Partial Migration (Infrastructure Complete)

Tanggal: 2026-07-03

---

## ✅ Yang Sudah Selesai

### 1. **TypeScript Types** 
File: `/types/epub.ts`

```typescript
- EpubBook          // Database record type
- EpubMetadata      // Extracted from EPUB file
- EpubReaderPosition // Save reading progress
- EpubReaderSettings // Reader preferences
```

### 2. **Zustand Store**
File: `/store/useEpubStore.ts`

**Features:**
- ✅ Load books from database
- ✅ Add new book
- ✅ Remove book (with storage cleanup)
- ✅ Reader position management (localStorage)
- ✅ Reader settings persistence
- ✅ Error handling

**State Management:**
```typescript
books: EpubBook[]           // All EPUB books
currentBook: EpubBook       // Currently reading
readerPosition: Position    // CFI + percentage
readerSettings: Settings    // Font, theme, etc.
```

### 3. **Utility Functions**
File: `/lib/epub.ts`

**Functions:**
- ✅ `extractEpubMetadata()` - Parse EPUB for title/author/cover
- ✅ `uploadEpubFile()` - Upload to Supabase Storage
- ✅ `uploadCoverImage()` - Upload extracted cover

---

## ⚠️ Yang Belum Selesai

### 1. **EPUB Library Page** 
File: `/app/epub-library/page.tsx`

**Status**: Hybrid (React shell + legacy JS)

**Current Approach:**
- React component me-load legacy scripts
- Masih menggunakan vanilla JS untuk UI logic
- CSS loaded dynamically

**Needs Migration:**
- [ ] Convert to proper React components
- [ ] Use `useEpubStore` instead of legacy `EpubBooksAPI`
- [ ] Replace DOM manipulation with React state
- [ ] Migrate upload logic to use `/lib/epub.ts`
- [ ] Remove dependency on legacy scripts

### 2. **EPUB Reader Page**
File: `/app/epub-reader/page.tsx`

**Status**: Hybrid (React shell + legacy JS)

**Current Approach:**
- React component me-load epub.js library
- Masih menggunakan vanilla JS untuk reader logic
- Complex reader interactions via DOM

**Needs Migration:**
- [ ] Create React component wrapper for epub.js
- [ ] Use `useEpubStore` for settings
- [ ] Integrate reader position saving
- [ ] Proper React lifecycle for epub.js initialization
- [ ] Remove dependency on legacy `epub-reader-page.js`

### 3. **Legacy Files Still in Use**
```
/public/js/modules/epub-books.js         - CRUD API (duplicate of store)
/public/js/modules/epub-library-page.js  - Library UI logic
/public/js/modules/epub-reader-page.js   - Reader UI logic
```

---

## 🎯 Recommended Migration Plan

### Phase 1: EPUB Library (Easier)
**Estimated effort**: 2-4 hours

1. Create React components:
   - `BookCard.tsx` - Display individual book
   - `BookGrid.tsx` - Grid layout
   - `UploadButton.tsx` - File upload with progress

2. Update `app/epub-library/page.tsx`:
   - Remove script loading
   - Use `useEpubStore` for data
   - Use `/lib/epub.ts` for upload
   - Proper loading/error states

3. Testing:
   - Upload EPUB files
   - Delete books
   - View book details
   - Cover image display

### Phase 2: EPUB Reader (Complex)
**Estimated effort**: 4-8 hours

**Challenge**: epub.js requires specific DOM structure and lifecycle

**Approach Options:**

#### Option A: React Wrapper (Recommended)
- Create `<EpubViewer>` component
- Use `useRef` for epub.js rendition
- Manage lifecycle with `useEffect`
- Keep epub.js but control via React

#### Option B: Full Rewrite
- Find React-based EPUB library
- Complete rewrite of reader
- Higher risk but cleaner architecture

**Implementation:**
1. Create `components/epub/EpubViewer.tsx`
2. Create `components/epub/EpubControls.tsx`
3. Create `components/epub/EpubTOC.tsx`
4. Update `app/epub-reader/page.tsx`
5. Integrate with `useEpubStore`

---

## 🔍 Technical Considerations

### epub.js Integration
```typescript
// epub.js expects specific DOM structure:
<div id="viewer"></div>

// Initialization:
const book = ePub(url);
const rendition = book.renderTo("viewer", { 
  width: "100%", 
  height: "100%" 
});
```

**Challenge**: epub.js menggunakan imperative API, sedangkan React declarative

**Solution**: 
- Use `useRef` for container
- Initialize in `useEffect`
- Cleanup on unmount
- Expose controls via React state

### Dependencies
```json
{
  "epubjs": "^0.3.93",     // Already loaded via CDN
  "jszip": "^3.10.1"       // For metadata extraction
}
```

**Recommendation**: Add to package.json instead of CDN for better type support

### Storage Structure
```
supabase storage: epub/
  ├── {user_id}/
  │   ├── {timestamp}_filename.epub
  │   └── {timestamp}_filename_cover.jpg
```

---

## 📝 Migration Checklist

### Infrastructure ✅
- [x] Type definitions
- [x] Zustand store
- [x] Utility functions
- [x] Storage integration

### EPUB Library
- [ ] BookCard component
- [ ] BookGrid component
- [ ] Upload functionality in React
- [ ] Remove legacy epub-library-page.js
- [ ] Update page.tsx to use React components
- [ ] Test all CRUD operations

### EPUB Reader
- [ ] EpubViewer component
- [ ] Reader controls component
- [ ] TOC component
- [ ] Settings panel component
- [ ] Position persistence
- [ ] Remove legacy epub-reader-page.js
- [ ] Update page.tsx to use React components
- [ ] Test reading experience

### Cleanup
- [ ] Remove unused legacy files
- [ ] Update documentation
- [ ] Add deprecation warnings

---

## 💡 Quick Wins

Bisa di-tackle terpisah:

1. **Add to package.json** (5 mins)
   ```bash
   npm install epubjs jszip
   npm install --save-dev @types/jszip
   ```

2. **Create BookCard component** (30 mins)
   - Simple display component
   - No complex logic
   - Easy to test

3. **Migrate upload logic** (1 hour)
   - Already have utilities in `/lib/epub.ts`
   - Just need to wire up to React component
   - Good test of store integration

---

## 🚀 Next Actions

**Immediate** (If continuing EPUB migration):
1. Add dependencies to package.json
2. Create BookCard component
3. Test integration with useEpubStore

**Alternative** (If moving to other priorities):
1. Document current hybrid state
2. Ensure existing functionality works
3. Plan EPUB migration for later sprint

---

**Note**: Saat ini EPUB features **masih berfungsi** dengan hybrid approach. Migration adalah untuk **improve maintainability** dan **consistency**, bukan bug fix.

Migration bisa dilakukan bertahap tanpa break existing functionality.

---

*Status: Infrastructure ready, UI migration pending*  
*Last updated: 2026-07-03*
