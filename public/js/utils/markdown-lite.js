// js/utils/markdown-lite.js
// Helper buat toolbar editor — wrap/insert syntax markdown di sekitar teks yang diseleksi.
// Render markdown→HTML (buat Reader/Viewer mode) nyusul di Fase 4, file ini fokus
// ke sisi insert/edit aja dulu.

const MarkdownLite = {
  wrapSelection(textarea, before, after = before) {
    const scrollTop = textarea.scrollTop;
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const selected = value.slice(start, end);
    const hasOuterMarkers =
      start >= before.length &&
      value.slice(start - before.length, start) === before &&
      value.slice(end, end + after.length) === after;
    const selectionHasMarkers =
      selected.startsWith(before) &&
      selected.endsWith(after) &&
      selected.length >= before.length + after.length;

    let newValue;
    let cursorStart;
    let cursorEnd;

    if (hasOuterMarkers) {
      newValue =
        value.slice(0, start - before.length) +
        selected +
        value.slice(end + after.length);
      cursorStart = start - before.length;
      cursorEnd = end - before.length;
    } else if (selectionHasMarkers) {
      const inner = selected.slice(before.length, selected.length - after.length);
      newValue = value.slice(0, start) + inner + value.slice(end);
      cursorStart = start;
      cursorEnd = start + inner.length;
    } else {
      newValue = value.slice(0, start) + before + selected + after + value.slice(end);
      cursorStart = start + before.length;
      cursorEnd = cursorStart + selected.length;
    }

    textarea.value = newValue;
    textarea.focus();
    textarea.setSelectionRange(cursorStart, cursorEnd);
    restoreScroll(textarea, scrollTop);
    return newValue;
  },

  insertLinePrefix(textarea, prefix) {
    const scrollTop = textarea.scrollTop;
    const { selectionStart: start, value } = textarea;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    textarea.value = newValue;
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    restoreScroll(textarea, scrollTop);
    return newValue;
  },
};

function restoreScroll(textarea, scrollTop) {
  textarea.scrollTop = scrollTop;
  const schedule = globalThis.requestAnimationFrame || ((callback) => setTimeout(callback, 0));
  schedule(() => {
    textarea.scrollTop = scrollTop;
  });
}
