// js/utils/cross-link-suggest.js
// Menampilkan dropdown autocomplete saat user ngetik [[ di textarea.
// Posisi dropdown dihitung dari bounding rect textarea + estimasi baris kursor.
//
// Cara pakai:
//   CrossLinkSuggest.init(textarea, getItems, onValueChange);
//   getItems() harus return array: [{ name: string, type: 'character'|'world' }]
//   onValueChange(newValue) dipanggil setelah item dipilih

window.CrossLinkSuggest = (() => {
  let _textarea = null;
  let _dropdown = null;
  let _getItems = () => [];
  let _onValueChange = () => {};
  let _activeIdx = -1;
  let _matchStart = 0;

  function init(textarea, getItems, onValueChange) {
    if (!textarea) return;
    destroy();

    _textarea = textarea;
    _getItems = getItems;
    _onValueChange = onValueChange;

    _dropdown = document.createElement('div');
    _dropdown.className = 'xlink-suggest-dropdown';
    _dropdown.style.display = 'none';
    document.body.appendChild(_dropdown);

    textarea.addEventListener('input', _onInput);
    textarea.addEventListener('keydown', _onKeydown);
    textarea.addEventListener('blur', (e) => {
      // tunda hide biar klik item kebaca dulu
      setTimeout(() => {
        if (!document.activeElement.closest('.xlink-suggest-dropdown')) hide();
      }, 150);
    });
  }

  function _onInput() {
    const pos = _textarea.selectionStart;
    const before = _textarea.value.slice(0, pos);
    const match = before.match(/\[\[([^\][\n]*)$/);
    if (!match) { hide(); return; }

    const query = match[1].trim().toLowerCase();
    const items = _getItems()
      .filter((item) => {
        const n = item.name.toLowerCase();
        return n.startsWith(query) || (query.length >= 2 && n.includes(query));
      })
      .slice(0, 8);

    if (items.length === 0) { hide(); return; }

    _matchStart = pos - match[0].length;
    _render(items);
    _setActive(0);
    _position();
    _dropdown.style.display = 'block';
  }

  function _render(items) {
    _dropdown.innerHTML = '';
    items.forEach((item, i) => {
      const opt = document.createElement('div');
      opt.className = 'xlink-suggest-item';
      opt.dataset.name = item.name;
      const icon = item.type === 'character'
        ? '<i class="ti ti-user" aria-hidden="true"></i>'
        : '<i class="ti ti-world" aria-hidden="true"></i>';
      opt.innerHTML = `<span class="xlink-suggest-icon">${icon}</span>${_esc(item.name)}`;
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
        _insert(item.name);
      });
      _dropdown.appendChild(opt);
    });
  }

  function _setActive(idx) {
    const items = _dropdown.querySelectorAll('.xlink-suggest-item');
    items.forEach((el) => el.classList.remove('active'));
    _activeIdx = Math.max(-1, Math.min(idx, items.length - 1));
    if (_activeIdx >= 0) items[_activeIdx].classList.add('active');
  }

  function _onKeydown(e) {
    if (_dropdown.style.display === 'none') return;
    const items = _dropdown.querySelectorAll('.xlink-suggest-item');
    if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _setActive(_activeIdx + 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      _setActive(_activeIdx - 1);
      return;
    }
    if ((e.key === 'Enter' || e.key === 'Tab') && items.length > 0) {
      e.preventDefault();
      const active = items[Math.max(_activeIdx, 0)];
      if (active) _insert(active.dataset.name);
      return;
    }
  }

  function _insert(name) {
    const ta = _textarea;
    const pos = ta.selectionStart;
    const after = ta.value.slice(pos);
    ta.value = ta.value.slice(0, _matchStart) + `[[${name}]]` + after;
    const newPos = _matchStart + name.length + 4;
    ta.setSelectionRange(newPos, newPos);
    ta.focus();
    hide();
    _onValueChange(ta.value);
  }

  function _position() {
    const ta = _textarea;
    const rect = ta.getBoundingClientRect();
    const lineHeight = Math.max(parseInt(getComputedStyle(ta).lineHeight) || 28, 20);
    const textBefore = ta.value.slice(0, ta.selectionStart);
    const linesAbove = textBefore.split('\n').length - 1;
    const approxTop = rect.top + linesAbove * lineHeight - ta.scrollTop + lineHeight;
    const clampedTop = Math.min(approxTop, rect.bottom - 160);

    _dropdown.style.position = 'fixed';
    _dropdown.style.left = (rect.left + 60) + 'px';
    _dropdown.style.top = Math.max(rect.top + 8, clampedTop) + 'px';
    _dropdown.style.width = '220px';
    _dropdown.style.zIndex = '200';
  }

  function hide() {
    if (_dropdown) _dropdown.style.display = 'none';
    _activeIdx = -1;
  }

  function destroy() {
    if (_dropdown) _dropdown.remove();
    _textarea && _textarea.removeEventListener('input', _onInput);
    _textarea && _textarea.removeEventListener('keydown', _onKeydown);
    _dropdown = null;
    _textarea = null;
    _activeIdx = -1;
  }

  function _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return { init, hide, destroy };
})();
