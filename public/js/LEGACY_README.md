# Legacy JavaScript Files - DEPRECATED

⚠️ **WARNING: These files are from the old vanilla JavaScript architecture and are being phased out.**

## Current Status

This directory contains the original vanilla JavaScript codebase that has been **mostly replaced** by the new Next.js + React + TypeScript architecture.

### ✅ What's Been Migrated

Most functionality has been moved to:
- **Pages**: `/app/*` (Next.js App Router)
- **Components**: `/components/*` (React + TypeScript)
- **State Management**: `/store/*` (Zustand stores)
- **Utilities**: `/lib/*` (TypeScript modules)
- **Types**: `/types/*` (TypeScript definitions)

### ⚠️ What Might Still Be Used

Some files may still be referenced during the transition:
- `offline-queue.js` - Offline sync functionality
- `pwa-register.js` - PWA registration (if still needed)
- `epub-books.js`, `epub-library-page.js`, `epub-reader-page.js` - EPUB features (under review)

### 🚫 What Should NOT Be Used

DO NOT use or modify these files for new features:
- `pageInit.js` - Obsolete (replaced by Next.js routing)
- `splash.js` - Obsolete (replaced by React loading states)
- `auth-guard.js` - Replaced by `/hooks/useAuth.ts`
- `nav.js` - Replaced by `/components/Nav.tsx`
- `project-context.js` - Replaced by Zustand stores
- `supabase-client.js` - Replaced by `/lib/supabase/client.ts`
- Most `*-page.js` files - Replaced by `/app/*/page.tsx`
- Most CRUD modules - Replaced by Zustand stores

## For Developers

### Adding New Features
**DO**: Create new React components in `/components/*` and pages in `/app/*`  
**DON'T**: Add code to these legacy files

### Fixing Bugs
1. Check if the feature has been migrated to React
2. If yes: fix in React component
3. If no: fix here but plan migration soon

### Migration Checklist
Before removing a legacy file:
1. ✅ Verify React equivalent exists and works
2. ✅ Search codebase for imports/references
3. ✅ Test all affected features
4. ✅ Update documentation
5. ✅ Remove the legacy file

## Need Help?

See `/MIGRATION_NEXTJS.md` for complete migration status and guidelines.
