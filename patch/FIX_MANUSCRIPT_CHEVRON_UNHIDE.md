# Patch: Fix Manuscript Chevron "Can't Unhide" Regression

Repo: `rza115/inkpadv2`
Scope: `components/manuscript/EditorPanel.tsx`
Supersedes: `FIX_MANUSCRIPT_CHEVRON_BUGS.md` (apply this instead/on top of it —
same two chevrons, corrected approach)

## The problem

After wiring `headersCollapsed` / `typographyCollapsed` to actually
collapse their rows, hiding works — but there's no way to unhide again,
because **the toggle button itself lives inside the row that gets
collapsed**. Once the row goes to `h-0 overflow-hidden`, the button
disappears along with everything else in it, so there's nothing left
to click.

## The fix (applies to both chevrons)

Split each toolbar row into two parts:
1. An **outer wrapper** that always renders (never collapses) — this
   is what holds the toggle button, so it's always clickable.
2. An **inner content wrapper** that collapses/hides — this holds
   everything except the toggle button, and switches cleanly between
   its full class list and `"hidden"` (not an appended conflicting
   utility — avoids the earlier `py-2`/`py-0` conflict entirely).

---

### 1. Bold/Italic/Heading/AI row + "headers" toggle

Currently (around line 503–525) the toggle button is the last child
inside the same row as Bold/Italic/Heading/AI. Restructure to:

```tsx
<div className="flex items-center border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
  <div
    className={
      headersCollapsed
        ? "hidden"
        : "flex items-center gap-1 px-4 py-2 flex-1 min-w-0"
    }
  >
    <button type="button" className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" data-md="bold" title="Bold" data-shortcut="Ctrl+B" onClick={() => applyToolbar('bold')}>
      <i className="ti ti-bold" aria-hidden="true"></i>
    </button>
    <button type="button" className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" data-md="italic" title="Italic" data-shortcut="Ctrl+I" onClick={() => applyToolbar('italic')}>
      <i className="ti ti-italic" aria-hidden="true"></i>
    </button>
    <button type="button" className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" data-md="heading" title="Heading" data-shortcut="Ctrl+H" onClick={() => applyToolbar('heading')}>
      <i className="ti ti-heading" aria-hidden="true"></i>
    </button>
    <button type="button" className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)]" id="ai-polish-btn" title="AI Polish — rapikan teks (Ctrl+Shift+P)" data-shortcut="Ctrl+Shift+P" onClick={openAIPolish}>
      <i className="ti ti-sparkles" aria-hidden="true"></i>
    </button>
  </div>

  <button
    type="button"
    className="flex items-center justify-center w-8 h-8 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] hover:bg-[var(--surface-raised)] ml-auto shrink-0"
    id="toggle-headers-btn"
    title={headersCollapsed ? 'Tampilkan navigasi & header' : 'Sembunyikan navigasi & header'}
    onClick={toggleHeadersCollapsed}
  >
    <i className={`ti ti-chevron-${headersCollapsed ? 'down' : 'up'}`} aria-hidden="true"></i>
  </button>
</div>
```

Key change: the outer `<div>` no longer has `px-4 py-2` or any
collapsing class on it at all — it's always a normal row. Only the
inner `<div>` wrapping Bold/Italic/Heading/AI toggles between its full
classes and `"hidden"`. The toggle button is a sibling, not a child, of
that inner div, so it never disappears.

*(The title/icon row above this one, around line 443, still collapses
as a whole with no button inside it — that part is unaffected and can
stay exactly as it is from the previous patch.)*

---

### 2. Font/Ukuran/Spasi/Kertas row + "typography" toggle

Same restructure, around line 528–568:

```tsx
<div className="flex items-center border-b border-[var(--border)] bg-[var(--surface)] text-xs shrink-0" id="editor-typography-bar">
  <div
    className={
      typographyCollapsed
        ? "hidden"
        : "flex items-center gap-3 px-4 py-2 flex-1 min-w-0"
    }
  >
    <span className="text-[var(--text-muted)] shrink-0">Font:</span>
    <select className="px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] cursor-pointer text-xs" id="editor-font-family" title="Font" value={fontFamily} onChange={(e) => { const v = e.target.value; setFontFamily(v); localStorage.setItem('inkpad_editor_font', v); }}>
      <option value="literata">Literata</option>
      <option value="lora">Lora</option>
      <option value="inter">Inter</option>
      <option value="nunito">Nunito</option>
      <option value="georgia">Georgia</option>
      <option value="mono">Mono</option>
    </select>
    <div className="w-px h-4 bg-[var(--border)]"></div>
    <span className="text-[var(--text-muted)] shrink-0">Ukuran:</span>
    <select className="px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] cursor-pointer text-xs" id="editor-font-size" title="Ukuran font" value={fontSize} onChange={(e) => { const v = e.target.value; setFontSize(v); localStorage.setItem('inkpad_editor_fontsize', v); }}>
      <option value="sm">Kecil</option>
      <option value="md">Sedang</option>
      <option value="lg">Besar</option>
      <option value="xl">XL</option>
    </select>
    <div className="w-px h-4 bg-[var(--border)]"></div>
    <span className="text-[var(--text-muted)] shrink-0">Spasi:</span>
    <select className="px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] cursor-pointer text-xs" id="editor-font-spacing" title="Spasi baris" value={fontSpacing} onChange={(e) => { const v = e.target.value; setFontSpacing(v); localStorage.setItem('inkpad_editor_spacing', v); }}>
      <option value="tight">Rapat</option>
      <option value="normal">Normal</option>
      <option value="relaxed">Lebar</option>
    </select>
    <div className="w-px h-4 bg-[var(--border)]"></div>
    <button className={`flex items-center gap-1 px-2 py-1 bg-transparent border rounded-[var(--radius)] cursor-pointer transition-colors ${paperMode ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`} id="editor-paper-mode" title="Mode kertas bergaris" onClick={() => { const next = !paperMode; setPaperMode(next); localStorage.setItem('inkpad_editor_paper', String(next)); }}>
      <i className="ti ti-notebook" aria-hidden="true"></i> Kertas
    </button>
  </div>

  <button
    className="flex items-center justify-center w-6 h-6 bg-transparent border-none text-[var(--text-muted)] cursor-pointer rounded-[var(--radius)] transition-colors hover:text-[var(--text)] ml-auto mr-3 shrink-0"
    id="typography-bar-toggle"
    title={typographyCollapsed ? 'Tampilkan kontrol tipografi' : 'Sembunyikan kontrol tipografi'}
    onClick={toggleTypographyCollapsed}
  >
    <i className={`ti ti-chevron-${typographyCollapsed ? 'down' : 'up'} transition-transform duration-200`} aria-hidden="true"></i>
  </button>
</div>
```

Same principle: outer row is always visible and un-collapsible, only
the inner content div (all the selects + Kertas button) switches to
`"hidden"`. The toggle button is a sibling that always stays put.

---

## Verify

- Click both chevrons to collapse — content should hide, each thin
  outer bar with just the chevron button should remain visible.
- Click again — content should come back, no missing button, no
  layout jump/flash.
- Reload the page with both collapsed — should stay collapsed (existing
  `localStorage` read on mount already covers this) and the button
  should still be there to expand again.
