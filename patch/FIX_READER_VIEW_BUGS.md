# Patch: Fix Reader View (Paragraphs + Missing CSS/Theme)

Repo: `rza115/inkpadv2`
Scope: `app/reader/page.tsx`, `components/reader/ReaderContent.tsx`, `lib/reader.ts`

## Bug 1 — Reader view CSS/layout missing, no dark/light toggle

**Root cause:** `app/layout.tsx` only loads `/css/reader-typography.css` globally.
The reader page never loads `base.css`, `layout.css`, `components.css`, or
`reader.css` — unlike `app/epub-reader/page.tsx`, which injects those files
manually via `useEffect`. Since `base.css` owns the `data-theme` variables
(`--bg`, `--text`, etc.) and `reader.css` owns `.r-content` / `.r-column`
layout, none of it applies on `/reader`.

**Fix:** In `app/reader/page.tsx`, inside `ReaderContent_Page`, add a CSS
injection effect using the exact same pattern already used in
`app/epub-reader/page.tsx`:

```tsx
// Load reader-specific stylesheets (mirrors app/epub-reader/page.tsx pattern)
useEffect(() => {
  const cssFiles = [
    "/css/base.css",
    "/css/layout.css",
    "/css/components.css",
    "/css/reader.css",
  ];
  cssFiles.forEach((href) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  });
}, []);
```

Place it near the top of the component, alongside the existing
`syncTopbarHeight` effect. No new dependencies — pure React/Next, same
approach already proven on the epub reader page.

**Verify:** open `/reader?project=...` and confirm layout/spacing renders
and the existing theme toggle (whatever sets `data-theme` on `<html>` or
`<body>`) actually changes appearance.

---

## Bug 2 — Paragraphs collapse into one block of text

**Root cause:** `components/reader/ReaderContent.tsx` renders chapter body
by calling a legacy global, `window.MarkdownRender.render(...)`, that no
longer exists anywhere in the codebase (leftover from the pre-Next.js
vanilla-JS app). The `if (window.MarkdownRender)` check silently fails,
so the code falls through to raw, unrendered text with no `<p>` wrapping.

**Fix:** Replace the legacy global-based rendering with `react-markdown`,
and move from imperative `innerHTML` string-building to declarative JSX.

### 1. Install dependency

```bash
npm install react-markdown remark-gfm
```

### 2. Update `lib/reader.ts`

Keep `buildCrosslinkResolver` and `buildIllustrationHTML`/illustration
data as-is, but change `processChapterContent` to split content into
an array of typed segments instead of producing an HTML string with
placeholders (illustrations become real React elements, not HTML
strings, so no more `dangerouslySetInnerHTML` needed for them either):

```ts
// lib/reader.ts

export type ChapterSegment =
  | { type: "text"; content: string }
  | { type: "illustration"; illustration: Illustration };

export function splitChapterContent(
  content: string,
  illustrations: Illustration[]
): { segments: ChapterSegment[]; usedIndices: Set<number> } {
  const illustrationsMap = new Map<number, Illustration>();
  illustrations.forEach((il, i) => illustrationsMap.set(i, il));

  const markerRegex = /\{\{illus:(\d+)\}\}/g;
  const usedIndices = new Set<number>();
  const segments: ChapterSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markerRegex.exec(content)) !== null) {
    const textChunk = content.substring(lastIndex, match.index);
    if (textChunk.trim()) segments.push({ type: "text", content: textChunk });

    const illusIndex = parseInt(match[1], 10);
    const illustration = illustrationsMap.get(illusIndex);
    if (illustration) {
      segments.push({ type: "illustration", illustration });
      usedIndices.add(illusIndex);
    }
    lastIndex = match.index + match[0].length;
  }

  const remainder = content.substring(lastIndex);
  if (remainder.trim()) segments.push({ type: "text", content: remainder });

  return { segments, usedIndices };
}
```

Remove `createInlineIllustrationPlaceholder` and `replacePlaceholders`
(no longer needed — illustrations render as JSX, not injected strings).
`escapeHtml` and `buildIllustrationHTML`/`buildChapterNavigation` can be
deleted too, since their consumers become plain JSX (see below); keep
them only if something else in the codebase still imports them —
grep first: `grep -rn "buildIllustrationHTML\|buildChapterNavigation\|escapeHtml" --include="*.tsx" --include="*.ts" .`

### 3. Rewrite `components/reader/ReaderContent.tsx`

Replace the `innerHTML`-based rendering with `ReactMarkdown`, rendering
illustrations and chapter nav as normal JSX instead of DOM string
injection + manual event wiring (`wireChapterNav` / `wireCrosslinks` go
away entirely — `onClick` handlers do the same job declaratively):

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitChapterContent, buildCrosslinkResolver } from "@/lib/reader";
// ...keep other existing imports, drop the old lib/reader imports that
// no longer exist (escapeHtml, buildIllustrationHTML, buildChapterNavigation,
// processChapterContent, replacePlaceholders, getRemainingIllustrations)

// Inside the component, replace buildChapterHTML + the innerHTML effect with:

const resolver = buildCrosslinkResolver(characters, worldEntries);
const { segments, usedIndices } = chapter
  ? splitChapterContent(chapter.content || "", illustrations)
  : { segments: [], usedIndices: new Set<number>() };
const remainingIllustrations = illustrations.filter((_, i) => !usedIndices.has(i));

// Crosslink handling: react-markdown renders plain text nodes, so
// auto-linking character/world names needs a small custom component
// wrapping text output. Simplest approach: post-process each text
// segment's matched names via a custom remark plugin OR keep it simple
// with a regex-based replace before handing text to ReactMarkdown,
// swapping recognized names for markdown link syntax, e.g.
// `[Name](#xlink:character:id)`, then intercept clicks via a custom
// `a` renderer in `components` prop:
//
//   components={{
//     a: ({ href, children }) => {
//       if (href?.startsWith("#xlink:")) {
//         const [, type, id] = href.split(":");
//         return (
//           <button
//             className="r-xlink"
//             onClick={() =>
//               router.push(
//                 type === "character"
//                   ? `/characters?project=${projectId}&open=${id}`
//                   : `/worldbuilding?project=${projectId}&open=${id}`
//               )
//             }
//           >
//             {children}
//           </button>
//         );
//       }
//       return <a href={href}>{children}</a>;
//     },
//   }}

return (
  <div id="r-pane" ref={paneRef} className="flex-1 overflow-y-auto px-6 py-10 min-w-0 w-full ...">
    <div id="r-column" className="r-column max-w-[680px] mx-auto transition-[max-width] duration-200">
      {!chapter ? (
        <p className="r-loading">Tidak ada bab yang dipilih.</p>
      ) : (
        <>
          <h1 className="r-chapter-heading">{chapter.title || "Tanpa judul"}</h1>

          {remainingIllustrations.length > 0 && (
            <div className="r-illustrations">
              {remainingIllustrations.map((il) => (
                <IllustrationBlock key={il.id} illustration={il} />
              ))}
            </div>
          )}

          <div className="r-content">
            {segments.map((seg, i) =>
              seg.type === "text" ? (
                <ReactMarkdown
                  key={i}
                  remarkPlugins={[remarkGfm]}
                  components={{/* a: crosslink renderer above */}}
                >
                  {linkifyCrosslinks(seg.content, resolver)}
                </ReactMarkdown>
              ) : (
                <IllustrationBlock key={i} illustration={seg.illustration} />
              )
            )}
          </div>

          {(chapters[chapterIndex - 1] || chapters[chapterIndex + 1]) && (
            <div className="r-chapter-nav">
              {chapters[chapterIndex - 1] && (
                <button
                  className="r-nav-btn prev"
                  onClick={() => onChapterChange(chapterIndex - 1)}
                >
                  ← {chapters[chapterIndex - 1].title || "Bab sebelumnya"}
                </button>
              )}
              {chapters[chapterIndex + 1] && (
                <button
                  className="r-nav-btn next"
                  onClick={() => onChapterChange(chapterIndex + 1)}
                >
                  {chapters[chapterIndex + 1].title || "Bab berikutnya"} →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  </div>
);
```

Where `IllustrationBlock` is a small local component replacing
`buildIllustrationHTML`:

```tsx
function IllustrationBlock({ illustration }: { illustration: Illustration }) {
  return (
    <div className="r-illustration">
      {illustration.video_url ? (
        <video src={illustration.video_url} autoPlay muted loop playsInline />
      ) : illustration.image_url ? (
        <img src={illustration.image_url} alt={illustration.caption || ""} loading="lazy" />
      ) : null}
      {illustration.caption && <p className="r-caption">{illustration.caption}</p>}
    </div>
  );
}
```

And `linkifyCrosslinks(text, resolver)` is a small helper (can live in
`lib/reader.ts`) that scans `text` for known character/world names via
`resolver` and replaces matches with `[Name](#xlink:type:id)` markdown
link syntax so the custom `a` renderer above can intercept them.

Keep the existing `useEffect` for `getFontSizeClass` / `getWidthClass`
preference classes (`r-fs-*`, `r-ff-*`, `r-al-*`, width classes) — that
logic still applies fine to the outer `#r-column` div, it's unrelated to
the markdown rendering itself.

### 4. Cleanup

- Delete the now-unused `wireChapterNav` / `wireCrosslinks` callbacks
  and the `columnRef`-based `innerHTML` effect entirely.
- Search for any other place still referencing `window.MarkdownRender`
  or the removed `lib/reader.ts` exports before finishing:
  `grep -rn "MarkdownRender\|buildIllustrationHTML\|buildChapterNavigation\|replacePlaceholders\|createInlineIllustrationPlaceholder" --include="*.tsx" --include="*.ts" .`

**Verify:** open a chapter with multiple paragraphs, an inline
`{{illus:N}}` marker, and at least one recognized character/world name
in the text. Confirm paragraphs render separately, the illustration
shows inline, and the crosslink is clickable and navigates correctly.

---

## Bug 3 — Reader theme toggle button does nothing

**Root cause:** `components/reader/ReaderTopbar.tsx` calls
`window.InkpadTheme.toggle()` / `window.InkpadTheme.getCurrent()` — another
legacy global that, like `MarkdownRender`, no longer exists anywhere in
the codebase. The click silently no-ops.

**Reference implementation that already works:** `components/manuscript/EditorPanel.tsx`
implements its own theme toggle correctly, with no dependency on any
global — it cycles `['light', 'dark', 'sepia']` by setting
`document.documentElement.setAttribute('data-theme', next)` and persisting
to `localStorage.setItem('inkpad_theme', next)`, tracking the icon in
local React state.

**Fix:** Extract that logic into a shared utility so both pages use the
same, non-broken implementation.

### 1. Create `lib/theme.ts`

```ts
export const THEMES = ["light", "dark", "sepia"] as const;
export type Theme = (typeof THEMES)[number];

export function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  return (THEMES as readonly string[]).includes(attr || "")
    ? (attr as Theme)
    : "light";
}

export function getThemeIcon(theme: Theme): string {
  return theme === "dark" ? "ti ti-moon" : theme === "sepia" ? "ti ti-sunset" : "ti ti-sun";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("inkpad_theme", theme);
}

export function cycleTheme(): Theme {
  const cur = getCurrentTheme();
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  applyTheme(next);
  return next;
}

export function restoreStoredTheme(): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("inkpad_theme");
  if (stored && (THEMES as readonly string[]).includes(stored)) {
    document.documentElement.setAttribute("data-theme", stored);
  }
}
```

### 2. Update `components/reader/ReaderTopbar.tsx`

Replace the `window.InkpadTheme`-based `handleThemeToggle` and
`getThemeIcon` with the shared util, tracking icon in local state like
`EditorPanel.tsx` already does:

```tsx
import { useState } from "react";
import { getCurrentTheme, getThemeIcon, cycleTheme } from "@/lib/theme";

// inside the component:
const [themeIcon, setThemeIcon] = useState(() => getThemeIcon(getCurrentTheme()));

const handleThemeToggle = () => {
  const next = cycleTheme();
  setThemeIcon(getThemeIcon(next));
};
```

Update the button's icon JSX from calling `getThemeIcon()` inline to
just rendering the state:

```tsx
<button
  id="theme-btn"
  className="..." /* unchanged */
  onClick={handleThemeToggle}
  title="Ganti tema"
>
  <i className={themeIcon} aria-hidden="true"></i>
</button>
```

Delete the old local `getThemeIcon` function inside `ReaderTopbar.tsx`
(it's replaced by the imported one) and remove all `window.InkpadTheme`
references.

### 3. (Recommended) Refactor `components/manuscript/EditorPanel.tsx` to use the same util

To avoid two divergent implementations going forward, replace its inline
`themeIcon` state / `handleThemeToggle` (around line 296–312) with the
same imports from `lib/theme.ts` used above. Behavior stays identical —
this is just deduplication, not a functional change.

**Verify:** click the theme button on `/reader` — icon should update
immediately and `data-theme` on `<html>` should cycle light → dark →
sepia, matching what already happens on `/manuscript`.

---

## Bug 4 — Theme resets on reload / doesn't carry over between pages

**Root cause:** `localStorage.setItem('inkpad_theme', ...)` is only ever
written (from `EditorPanel.tsx`, and now also from the reader fix above)
— nothing in the app reads it back and re-applies `data-theme` when a
page first loads. So picking "dark" on manuscript, then reloading or
opening `/reader` in a fresh tab, silently reverts to the default theme.

**Fix:** Apply the stored theme as early as possible — before first
paint — via a small blocking inline script in the root layout `<head>`,
the same technique used by most Next.js dark-mode setups (avoids a
flash of the wrong theme, and works before React hydrates).

### 1. Update `app/layout.tsx`

Add `suppressHydrationWarning` to `<html>` (the attribute is set outside
React's control, so this prevents a spurious hydration warning), and add
an inline script as the very first thing in `<head>`, before the
stylesheet `<link>` tags:

```tsx
<html lang="id" className="h-full" suppressHydrationWarning>
  <head>
    {/* Apply stored theme before first paint, to avoid a flash of the wrong theme */}
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('inkpad_theme');if(t==='light'||t==='dark'||t==='sepia'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
      }}
    />

    {/* Custom CSS - loaded before everything else */}
    <link rel="stylesheet" href="/css/reader-typography.css" />
    {/* ...rest of existing <head> content unchanged... */}
  </head>
  {/* ...rest of layout unchanged... */}
</html>
```

This covers the case the inline script can't catch (e.g. `localStorage`
unavailable in some SSR edge case) — no other changes needed since it
runs on every full page load regardless of route.

**Verify:** on `/manuscript`, cycle theme to `sepia`. Reload the page —
should still be `sepia`. Navigate to `/reader?project=...` — should also
open already in `sepia`, no flash of `light` first.

### 4. Cleanup

After both fixes, confirm no dangling references remain:

```bash
grep -rn "InkpadTheme" --include="*.tsx" --include="*.ts" .
```

Should return nothing.
