// js/modules/global-search.js
// Global Search & Replace — cari teks di seluruh chapter,
// dengan preview, replace single, dan replace all.

// ── State ──
let searchChapters = [];
let searchResults = [];
let searchQuery = '';
let replaceText = '';
let caseSensitive = false;
let wholeWord = false;
let statusFilter = 'all';
let isOpen = false;
let currentMatchIndex = 0;
let totalMatchCount = 0;

// ── Init ──
function initGlobalSearch() {
  const panel = document.getElementById('search-panel');
  if (!panel) return;

  // Close button
  document.getElementById('search-close')?.addEventListener('click', closeSearch);

  // Search input
  const searchInput = document.getElementById('search-input');
  searchInput?.addEventListener('input', () => {
    searchQuery = searchInput.value;
    debouncedSearch();
  });
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        navigateSearch(-1);
      } else {
        navigateSearch(1);
      }
    }
  });

  // Replace input
  const replaceInput = document.getElementById('search-replace-input');
  replaceInput?.addEventListener('input', () => {
    replaceText = replaceInput.value;
  });
  replaceInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleReplaceAll();
    }
  });

  // Toggle options
  document.getElementById('search-case')?.addEventListener('change', (e) => {
    caseSensitive = e.target.checked;
    runSearch();
  });
  document.getElementById('search-word')?.addEventListener('change', (e) => {
    wholeWord = e.target.checked;
    runSearch();
  });
  document.getElementById('search-status')?.addEventListener('change', (e) => {
    statusFilter = e.target.value;
    runSearch();
  });

  // Buttons
  document.getElementById('search-prev')?.addEventListener('click', () => navigateSearch(-1));
  document.getElementById('search-next')?.addEventListener('click', () => navigateSearch(1));
  document.getElementById('search-replace-btn')?.addEventListener('click', handleReplaceSingle);
  document.getElementById('search-replace-all')?.addEventListener('click', handleReplaceAll);

  // Click outside to close
  panel.addEventListener('click', (e) => {
    if (e.target === panel) closeSearch();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeSearch();
  });
}

let searchDebounceTimer = null;
function debouncedSearch() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(runSearch, 300);
}

function openSearch(chapters) {
  searchChapters = chapters || [];
  isOpen = true;

  const panel = document.getElementById('search-panel');
  const overlay = document.getElementById('search-overlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('open');

  document.body.style.overflow = 'hidden';

  // Focus search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.focus();
    searchInput.select();
  }

  // Auto-run if there's already text
  if (searchQuery) runSearch();
}

function closeSearch() {
  isOpen = false;
  const panel = document.getElementById('search-panel');
  const overlay = document.getElementById('search-overlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');

  document.body.style.overflow = '';
  searchResults = [];
  currentMatchIndex = 0;
  totalMatchCount = 0;
}

function runSearch() {
  const resultsEl = document.getElementById('search-results');
  if (!resultsEl) return;

  if (!searchQuery.trim()) {
    resultsEl.innerHTML = '<div class="search-empty">Ketik kata kunci untuk mencari di semua bab.</div>';
    updateSearchStats(0, 0);
    return;
  }

  try {
    let flags = 'g';
    if (!caseSensitive) flags += 'i';
    let pattern = escapeSearchRegex(searchQuery);
    if (wholeWord) pattern = `\\b${pattern}\\b`;
    const regex = new RegExp(pattern, flags);

    searchResults = [];
    totalMatchCount = 0;

    const filtered = statusFilter === 'all'
      ? searchChapters
      : searchChapters.filter((ch) => ch.status === statusFilter);

    filtered.forEach((ch) => {
      const title = ch.title || '';
      const content = ch.content || '';
      const allText = title + '\n' + content;
      const matches = [];
      let match;

      while ((match = regex.exec(allText)) !== null) {
        const pos = match.index;
        const lineStart = allText.lastIndexOf('\n', pos) + 1;
        const lineEnd = allText.indexOf('\n', pos);
        const lineNum = allText.substring(0, pos).split('\n').length;
        const line = allText.substring(lineStart, lineEnd !== -1 ? lineEnd : allText.length);

        matches.push({
          index: pos,
          length: match[0].length,
          line: line.trim(),
          lineNum,
          contextBefore: line.substring(0, pos - lineStart).slice(-40),
          contextAfter: line.substring(pos - lineStart + match[0].length).slice(0, 40),
        });
      }

      if (matches.length > 0) {
        searchResults.push({
          chapterId: ch.id,
          chapterTitle: title || 'Tanpa judul',
          chapterStatus: ch.status,
          matches,
        });
        totalMatchCount += matches.length;
      }
    });

    currentMatchIndex = 0;
    renderResults(resultsEl);
    updateSearchStats(searchResults.length, totalMatchCount);
  } catch (err) {
    resultsEl.innerHTML = `<div class="search-error">Error: ${escapeSearchHtml(err.message)}</div>`;
  }
}

function renderResults(container) {
  if (searchResults.length === 0) {
    container.innerHTML = `
      <div class="search-empty">
        <i class="ti ti-search-off" aria-hidden="true" style="font-size:28px; opacity:0.3;"></i>
        <p>Tidak ditemukan hasil untuk "<strong>${escapeSearchHtml(searchQuery)}</strong>"</p>
      </div>
    `;
    return;
  }

  container.innerHTML = searchResults.map((result, ri) => `
    <div class="search-result-chapter">
      <div class="search-result-header" data-chapter-id="${result.chapterId}">
        <span class="search-result-title">${escapeSearchHtml(result.chapterTitle)}</span>
        <span class="search-result-status">${result.chapterStatus}</span>
        <span class="search-result-count">${result.matches.length} hasil</span>
      </div>
      ${result.matches.map((m, mi) => `
        <div class="search-result-item" data-ri="${ri}" data-mi="${mi}">
          <span class="search-result-line">${escapeSearchHtml(m.contextBefore)}<mark>${escapeSearchHtml(searchQuery)}</mark>${escapeSearchHtml(m.contextAfter)}</span>
          <span class="search-result-location">Baris ${m.lineNum}</span>
        </div>
      `).join('')}
    </div>
  `).join('');

  // Wire click to navigate
  container.querySelectorAll('.search-result-item').forEach((item) => {
    item.addEventListener('click', () => {
      const ri = parseInt(item.dataset.ri, 10);
      const mi = parseInt(item.dataset.mi, 10);
      navigateToResult(ri, mi);
    });
  });

  // Wire chapter header click to open chapter
  container.querySelectorAll('.search-result-header').forEach((header) => {
    header.addEventListener('click', () => {
      const chapterId = header.dataset.chapterId;
      navigateToChapter(chapterId);
    });
  });
}

function updateSearchStats(chapterCount, matchCount) {
  const stats = document.getElementById('search-stats');
  if (!stats) return;
  if (matchCount === 0) {
    stats.textContent = '';
  } else {
    stats.textContent = `${matchCount} hasil di ${chapterCount} bab`;
  }
}

function navigateSearch(direction) {
  if (searchResults.length === 0 || totalMatchCount === 0) return;

  // Hitung global match index
  let globalIdx = 0;
  let targetIdx = currentMatchIndex + direction;

  // Clamp
  if (targetIdx < 0) targetIdx = totalMatchCount - 1;
  if (targetIdx >= totalMatchCount) targetIdx = 0;

  currentMatchIndex = targetIdx;

  // Cari result & match yang sesuai
  let found = false;
  for (const result of searchResults) {
    for (let mi = 0; mi < result.matches.length; mi++) {
      if (globalIdx === currentMatchIndex) {
        navigateToResult(searchResults.indexOf(result), mi);
        found = true;
        break;
      }
      globalIdx++;
    }
    if (found) break;
  }

  // Highlight item di panel
  highlightSearchItem(currentMatchIndex);
}

function highlightSearchItem(globalIdx) {
  const items = document.querySelectorAll('.search-result-item');
  let idx = 0;
  items.forEach((item) => {
    item.classList.toggle('active', idx === globalIdx);
    if (idx === globalIdx) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    idx++;
  });
}

function navigateToResult(ri, mi) {
  const result = searchResults[ri];
  if (!result) return;

  const match = result.matches[mi];
  if (!match) return;

  // Dispatch custom event untuk manuscript.js
  document.dispatchEvent(new CustomEvent('search:navigate', {
    detail: {
      chapterId: result.chapterId,
      matchIndex: match.index,
      matchLength: match.length,
    }
  }));

  closeSearch();
}

function navigateToChapter(chapterId) {
  document.dispatchEvent(new CustomEvent('search:navigate', {
    detail: { chapterId }
  }));
  closeSearch();
}

async function handleReplaceSingle() {
  if (!replaceText || searchResults.length === 0 || totalMatchCount === 0) return;

  // Cari match berdasarkan currentMatchIndex
  let globalIdx = 0;
  for (const result of searchResults) {
    for (let mi = 0; mi < result.matches.length; mi++) {
      if (globalIdx === currentMatchIndex) {
        await doReplace(result.chapterId, result.matches[mi], replaceText);
        return;
      }
      globalIdx++;
    }
  }
}

async function handleReplaceAll() {
  if (!replaceText || searchResults.length === 0) return;

  const count = totalMatchCount;
  if (!confirm(`Ganti semua ${count} hasil dengan "${replaceText}"? Tindakan ini tidak bisa dibatalkan.`)) return;

  for (const result of searchResults) {
    // Replace dari belakang ke depan agar index tidak berubah
    const sorted = [...result.matches].sort((a, b) => b.index - a.index);
    let content = null;

    for (const match of sorted) {
      // Ambil content chapter (hanya sekali)
      if (content === null) {
        const ch = searchChapters.find((c) => c.id === result.chapterId);
        if (!ch) continue;
        content = ch.content || '';
      }

      // Adjust index: title + '\n' offset
      const ch = searchChapters.find((c) => c.id === result.chapterId);
      const titleLen = (ch.title || '').length + 1; // +1 for \n
      const contentIndex = match.index - titleLen;

      if (contentIndex >= 0 && contentIndex <= content.length) {
        content = content.substring(0, contentIndex) + replaceText + content.substring(contentIndex + match.length);
      }
    }

    if (content !== null) {
      try {
        const updated = await ChaptersAPI.update(result.chapterId, { content, word_count: countWords(content) });
        // Update searchChapters agar data tetap sinkron
        const ch = searchChapters.find((c) => c.id === result.chapterId);
        if (ch && updated && !updated._offline) ch.content = updated.content;
      } catch (err) {
        console.error('Gagal replace all di chapter:', result.chapterTitle, err);
      }
    }
  }

  // Re-run search
  showSearchToast(`Diganti ${count} hasil`);
  runSearch();
}

async function doReplace(chapterId, match, newText) {
  const ch = searchChapters.find((c) => c.id === chapterId);
  if (!ch) return;

  const titleLen = (ch.title || '').length + 1;
  const contentIndex = match.index - titleLen;

  if (contentIndex < 0 || contentIndex > (ch.content || '').length) return;

  const newContent = ch.content.substring(0, contentIndex) + newText + ch.content.substring(contentIndex + match.length);

  try {
    await ChaptersAPI.update(chapterId, { content: newContent, word_count: countWords(newContent) });
    ch.content = newContent;
    showSearchToast('Diganti 1 hasil');
    runSearch();
  } catch (err) {
    showSearchToast('Gagal replace: ' + err.message, true);
  }
}

// ── Toast ──
function showSearchToast(msg, isError) {
  const existing = document.querySelector('.search-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'search-toast' + (isError ? ' search-toast-error' : '');
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ── Helpers ──
function escapeSearchRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeSearchHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function countWords(text) {
  return (text || '').trim() ? (text || '').trim().split(/\s+/).length : 0;
}

// ── Expose globally (loaded as regular script, not ES module) ──
window.InkpadSearch = {
  init: initGlobalSearch,
  open: openSearch,
  close: closeSearch,
};
