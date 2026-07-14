# Patch: Fix Manuscript Editor Collapse Chevrons

Repo: `rza115/inkpadv2`
Scope: `components/manuscript/EditorPanel.tsx`

There are two chevron toggle buttons in the manuscript editor toolbar
area. Both look similar but have different root causes.

---

## Bug 1 — "Sembunyikan navigasi & header" chevron does nothing

Location: end of the Bold/Italic/Heading/AI-polish toolbar row
(`id="toggle-headers-btn"`, around line 521).

**Root cause:** `headersCollapsed` state (declared line 47, toggled via
`toggleHeadersCollapsed` around line 290) is fully wired for state +
persistence (`localStorage.setItem('inkpad_headers_collapsed', ...)`)
and the button's own icon flips direction (`chevron-down` /
`chevron-up`) — but **`headersCollapsed` is never referenced anywhere
else in the component**. The two rows it's supposed to hide — the
title/icon row (title input + download/search/generator/focus/
history/theme/Baca buttons, around line 443) and the Bold/Italic/
Heading/AI row itself (around line 503) — both have static
`className` strings with no conditional on `headersCollapsed`. So
clicking the button updates state silently but nothing collapses.

**Fix:** Reference `headersCollapsed` in both rows' `className`, using
the same collapse technique already used for the typography bar
(explicit either/or, not an appended conflicting class — see Bug 2
for why that matters):

```tsx
// Title/icon row
<div
  className={
    headersCollapsed
      ? "h-0 py-0 overflow-hidden border-b-0"
      : "flex items-center justify-between px-5 py-3 border-b border-[var(--border)] gap-4 shrink-0"
  }
>
  {/* ...unchanged content... */}
</div>

// Bold/Italic/Heading/AI toolbar row
<div
  className={
    headersCollapsed
      ? "h-0 py-0 overflow-hidden border-b-0"
      : "flex items-center gap-1 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] shrink-0"
  }
>
  {/* ...unchanged content, including the toggle-headers-btn itself... */}
</div>
```

Note the toggle button lives *inside* the second row — make sure it
stays reachable/clickable even when that row is visually collapsing
(the `transition-all duration-200` used elsewhere in the file is a
nice-to-have here too, so the collapse animates instead of snapping).

**Verify:** click the chevron at the end of the Bold/Italic/Heading/AI
row — both that row and the title/icon row above it should collapse
away, and the chevron direction should still flip. Click again to
restore. Reload the page — collapsed state should persist (already
handled by the existing `localStorage` read on mount).

---

## Bug 2 — "Sembunyikan kontrol tipografi" chevron doesn't fully collapse

Location: Font/Ukuran/Spasi/Kertas row (`id="editor-typography-bar"`,
around line 528).

**Root cause:** the row's `className` combines a base `py-2` with a
conditionally *appended* `py-0` instead of switching between the two:

```tsx
className={`flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] text-xs shrink-0 transition-all duration-200 ${typographyCollapsed ? 'h-0 py-0 overflow-hidden border-b-0' : ''}`}
```

When `typographyCollapsed` is true, both `py-2` and `py-0` end up in
the element's class list at the same time. Which one wins is decided
by their order in Tailwind's *compiled* stylesheet, not their order in
this string — so `py-2`'s padding can still take effect over `py-0`.
Combined with `h-0`, that leaves the row unable to shrink to a true
zero height (padding needs space `height: 0` can't provide), so it
never fully hides — just leaves a visible sliver.

**Fix:** make the two states mutually exclusive instead of layering
one on top of the other:

```tsx
className={
  typographyCollapsed
    ? "flex items-center gap-3 px-4 h-0 py-0 border-b-0 bg-[var(--surface)] text-xs shrink-0 overflow-hidden transition-all duration-200"
    : "flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] text-xs shrink-0 transition-all duration-200"
}
```

**Verify:** click the chevron on the typography row — it should
collapse to a true 0px strip with no visible sliver, and expand back
cleanly. Same check as Bug 1 for persistence across reload.

---

## Cleanup

After both fixes, double check no other row in `EditorPanel.tsx` uses
the same append-conflicting-utility pattern (`base-class ... collapsed
? 'conflicting-class' : ''`) — search for it:

```bash
grep -n "shrink-0.*\${.*Collapsed ? '" components/manuscript/EditorPanel.tsx
```

Any other match should be converted to the same either/or ternary
style used above.
