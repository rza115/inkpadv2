// js/modules/manuscript.js — PATCHED for Next.js
// global-search.js and random-generator.js are loaded separately as scripts

function initManuscriptPage() {
  const projectId = window.InkpadProject.getActiveProjectId();
  if (!projectId) {
    document.getElementById('page-main').innerHTML =
      '<p class="muted" style="padding:24px;">Nggak ada novel yang dipilih. Balik ke <a href="/">Project Hub</a>.</p>';
    return;
  }

  const chapterListEl = document.getElementById('chapter-list');
  const chapterCountEl = document.getElementById('chapter-count');
  const newChapterBtn = document.getElementById('new-chapter-btn');
  const editorEmpty = document.getElementById('editor-empty');
  const editorActive = document.getElementById('editor-active');
  const titleInput = document.getElementById('chapter-title-input');
  const textarea = document.getElementById('editor-textarea');
  const wordCountEl = document.getElementById('word-count');
  const saveIndicatorEl = document.getElementById('save-indicator');
  const contextPanel = document.getElementById('context-panel');
  const contextCharacterList = document.getElementById('context-character-list');
  const addCharacterBtn = document.getElementById('add-character-btn');
  const contextPicker = document.getElementById('context-picker');
  const contextWorldList = document.getElementById('context-world-list');
  const addWorldBtn = document.getElementById('add-world-btn');
  const contextWorldPicker = document.getElementById('context-world-picker');
  const illusUpload = document.getElementById('illus-upload');
  const illusListEl = document.getElementById('context-illus-list');
  const readBtn = document.getElementById('read-btn');
  const focusBtn = document.getElementById('focus-btn');
  const exportBtn = document.getElementById('export-btn');
  const exportDropdown = document.getElementById('export-dropdown');
  const contextNotesList = document.getElementById('context-notes-list');
  const quickNoteInput = document.getElementById('quick-note-input');
  const quickNoteAdd = document.getElementById('quick-note-add');
  const openNotesPageBtn = document.getElementById('open-notes-page-btn');
  const manuscriptShell = document.querySelector('.manuscript-shell');
  const chapterPanelEl = document.getElementById('chapter-panel');
  const chapterPanelToggle = document.getElementById('chapter-panel-toggle');
  const toggleHeadersBtn = document.getElementById('toggle-headers-btn');
  const typographyBar = document.getElementById('editor-typography-bar');
  const typographyBarToggle = document.getElementById('typography-bar-toggle');

  let chapters = [];
  let activeChapter = null;
  let dragSourceId = null;
  let allCharacters = [];
  let linkedCharacters = [];
  let allWorldEntries = [];
  let linkedWorldEntries = [];
  let titleSaveTimer = null;
  let contentSaveTimer = null;
  let focusMode = false;
  let toastTimer = null;

  // ── Last Chapter State ──
  const LAST_CHAPTER_KEY = `inkpad:manuscript:lastChapter:${projectId}`;

  function saveLastChapter(chapterId, chapterTitle) {
    try {
      localStorage.setItem(LAST_CHAPTER_KEY, JSON.stringify({
        chapterId,
        chapterTitle,
        timestamp: Date.now()
      }));
    } catch (_) {}
  }

  function loadLastChapter() {
    try {
      const saved = localStorage.getItem(LAST_CHAPTER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  }

  function clearLastChapter() {
    try {
      localStorage.removeItem(LAST_CHAPTER_KEY);
    } catch (_) {}
  }

  // ── AI Polish ──
  AIPolish.init(
    // getter context
    () => ({
      chapter: activeChapter,
      chapters,
      linkedCharacters,
      linkedWorldEntries,
      projectId,
    }),
    // onApply: ganti teks asli dengan hasil AI di textarea
    (originalText, resultText) => {
      const isFullChapter = textarea.value.trim() === originalText;
      if (isFullChapter) {
        textarea.value = resultText;
      } else {
        // ganti hanya bagian yang terseleksi
        const start = textarea.value.indexOf(originalText);
        if (start !== -1) {
          textarea.value =
            textarea.value.slice(0, start) +
            resultText +
            textarea.value.slice(start + originalText.length);
        } else {
          // fallback: ganti seluruh chapter kalau posisi tidak ditemukan
          textarea.value = resultText;
        }
      }
      updateWordCountLive();
      clearTimeout(contentSaveTimer);
      contentSaveTimer = setTimeout(handleContentChange, 700);
      showToast('Teks berhasil diperbarui ✓', 'success');
    }
  );

  // — Chapter panel collapse toggle (mobile only) —
  const PANEL_COLLAPSED_KEY = 'inkpad_chapter_panel_collapsed';

  function initChapterPanelToggle() {
    if (!chapterPanelToggle || !chapterPanelEl) return;

    // restore saved state
    const savedCollapsed = localStorage.getItem(PANEL_COLLAPSED_KEY) === 'true';
    if (savedCollapsed) {
      chapterPanelEl.classList.add('collapsed');
      chapterPanelToggle.classList.add('collapsed');
      chapterPanelToggle.title = 'Tampilkan navigasi bab';
    }

    chapterPanelToggle.addEventListener('click', () => {
      const isCollapsed = chapterPanelEl.classList.toggle('collapsed');
      chapterPanelToggle.classList.toggle('collapsed', isCollapsed);
      chapterPanelToggle.title = isCollapsed ? 'Tampilkan navigasi bab' : 'Sembunyikan navigasi bab';
      localStorage.setItem(PANEL_COLLAPSED_KEY, isCollapsed);
    });
  }

  initChapterPanelToggle();

  // — Headers and navigation toggle —
  const HEADERS_COLLAPSED_KEY = 'inkpad_headers_collapsed';

  function initHeadersToggle() {
    if (!toggleHeadersBtn || !manuscriptShell) return;

    // restore saved state
    const savedCollapsed = localStorage.getItem(HEADERS_COLLAPSED_KEY) === 'true';
    if (savedCollapsed) {
      manuscriptShell.classList.add('headers-collapsed');
      updateToggleHeadersButton(true);
    }

    toggleHeadersBtn.addEventListener('click', () => {
      const isCollapsed = manuscriptShell.classList.toggle('headers-collapsed');
      updateToggleHeadersButton(isCollapsed);
      localStorage.setItem(HEADERS_COLLAPSED_KEY, isCollapsed);
    });
  }

  function updateToggleHeadersButton(isCollapsed) {
    if (!toggleHeadersBtn) return;
    const icon = toggleHeadersBtn.querySelector('i');
    if (icon) {
      icon.className = isCollapsed ? 'ti ti-chevron-down' : 'ti ti-chevron-up';
    }
    toggleHeadersBtn.title = isCollapsed ? 'Tampilkan navigasi & header' : 'Sembunyikan navigasi & header';
  }

  initHeadersToggle();

  // — Typography bar collapse toggle —
  const TYPOGRAPHY_BAR_COLLAPSED_KEY = 'inkpad_typography_bar_collapsed';

  function initTypographyBarToggle() {
    if (!typographyBarToggle || !typographyBar) return;

    // restore saved state
    const savedCollapsed = localStorage.getItem(TYPOGRAPHY_BAR_COLLAPSED_KEY) === 'true';
    if (savedCollapsed) {
      typographyBar.classList.add('collapsed');
      typographyBarToggle.title = 'Tampilkan kontrol tipografi';
    }

    typographyBarToggle.addEventListener('click', () => {
      const isCollapsed = typographyBar.classList.toggle('collapsed');
      typographyBarToggle.title = isCollapsed ? 'Tampilkan kontrol tipografi' : 'Sembunyikan kontrol tipografi';
      localStorage.setItem(TYPOGRAPHY_BAR_COLLAPSED_KEY, isCollapsed);
    });
  }

  initTypographyBarToggle();

  // ── Theme & Editor Font Controls Init ──
  if (window.InkpadTheme) {
    window.InkpadTheme.init();
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => window.InkpadTheme.toggle());
    }
    // Init font controls after DOM is ready
    window.InkpadTheme.initEditorFontControls();
  }

  // ── Versioning Init ──
  if (window.InkpadVersioning) {
    window.InkpadVersioning.init();
    const versioningBtn = document.getElementById('versioning-btn');
    if (versioningBtn) {
      versioningBtn.addEventListener('click', () => {
        if (activeChapter) {
          window.InkpadVersioning.open(activeChapter.id);
        } else {
          showToast('Pilih bab terlebih dahulu');
        }
      });
    }

    // Listen for version restore to update editor
    document.addEventListener('versioning:restored', (e) => {
      const { chapterId, title, content } = e.detail;
      if (activeChapter && activeChapter.id === chapterId) {
        titleInput.value = title;
        textarea.value = content;
        updateWordCountLive();
        clearTimeout(contentSaveTimer);
        contentSaveTimer = setTimeout(handleContentChange, 700);
      }
    });
  }

  // ── AI Generator Init ──
  if (window.InkpadRandom) {
    window.InkpadRandom.init();
    const generatorBtn = document.getElementById('generator-btn');
    if (generatorBtn) {
      generatorBtn.addEventListener('click', () => {
        window.InkpadRandom.open();
      });
    }

    // Listen for generator insert
    document.addEventListener('generator:insert', (e) => {
      const { text } = e.detail;
      if (textarea && text) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        const insertText = (start > 0 && !before.endsWith('\n') ? '\n\n' : '') + text;
        textarea.value = before + insertText + after;
        textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
        updateWordCountLive();
        clearTimeout(contentSaveTimer);
        contentSaveTimer = setTimeout(handleContentChange, 700);
        textarea.focus();
      }
    });
  }

  // ── Global Search Init ──
  if (window.InkpadSearch) {
    window.InkpadSearch.init();
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        window.InkpadSearch.open(chapters);
      });
    }

    // Listen for search navigation
    document.addEventListener('search:navigate', (e) => {
      const { chapterId, matchIndex, matchLength } = e.detail;
      if (chapterId) {
        // Select the chapter
        const ch = chapters.find((c) => c.id === chapterId);
        if (ch) {
          selectChapter(chapterId);
          // If matchIndex is provided, scroll to and highlight the match
          if (matchIndex !== undefined && matchLength) {
            const titleLen = (ch.title || '').length + 1;
            const contentIndex = matchIndex - titleLen;
            if (contentIndex >= 0 && contentIndex <= textarea.value.length) {
              textarea.focus();
              textarea.setSelectionRange(contentIndex, contentIndex + matchLength);
              // Scroll textarea to show selection
              const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10) || 24;
              const linesBefore = textarea.value.substring(0, contentIndex).split('\n').length;
              textarea.scrollTop = Math.max(0, (linesBefore - 5) * lineHeight);
            }
          }
        }
      }
    });
  }

  loadProject();
  loadChapters();
  loadAllCharacters();
  loadAllWorldEntries();

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      if (window.InkpadSearch) {
        window.InkpadSearch.open(chapters);
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (activeChapter) forceSave();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      applyToolbar('heading');
      return;
    }
    if (e.altKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      toggleFocusMode();
      return;
    }
    if (e.key === 'Escape' && focusMode) {
      toggleFocusMode();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      if (activeChapter) {
        const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
        AIPolish.run(selected, textarea.value);
      }
    }
  });

  if (focusBtn) {
    focusBtn.addEventListener('click', toggleFocusMode);
  }

  if (exportBtn && exportDropdown) {
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => exportDropdown.classList.remove('open'));
  }

  document.getElementById('export-chapter-md')?.addEventListener('click', () => {
    exportDropdown?.classList.remove('open');
    exportChapterMarkdown();
  });

  document.getElementById('export-all-md')?.addEventListener('click', () => {
    exportDropdown?.classList.remove('open');
    exportAllMarkdown();
  });

  if (window.CrossLinkSuggest) {
    CrossLinkSuggest.init(textarea, () => {
      const chars = allCharacters.map((c) => ({ name: c.name, type: 'character' }));
      const worlds = allWorldEntries.map((w) => ({ name: w.title, type: 'world' }));
      return [...chars, ...worlds].filter((item) => item.name);
    }, () => {
      updateWordCountLive();
      scheduleContentSave();
    });
  }

  if (readBtn) {
    readBtn.addEventListener('click', () => {
      if (activeChapter) {
        window.location.href = `/reader?project=${projectId}&chapterId=${activeChapter.id}`;
      } else if (chapters.length > 0) {
        window.location.href = `/reader?project=${projectId}&chapterId=${chapters[0].id}`;
      }
    });
  }

  if (illusUpload) {
    illusUpload.addEventListener('change', handleIllusUpload);
  }

  if (quickNoteAdd) {
    quickNoteAdd.addEventListener('click', handleQuickNoteAdd);
    quickNoteInput && quickNoteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickNoteAdd(); }
    });
  }

  if (openNotesPageBtn) {
    openNotesPageBtn.addEventListener('click', () => {
      window.location.href = `/pages/notes.html?project=${projectId}`;
    });
  }

  addCharacterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeWorldPicker();
    togglePicker();
  });
  addWorldBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closePicker();
    toggleWorldPicker();
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-add-wrap')) {
      closePicker();
      closeWorldPicker();
    }
  });

  document.addEventListener('offline-queue-flushed', (e) => {
    if (activeChapter && e.detail.remaining === 0) {
      setSaveIndicator('saved', new Date().toISOString());
    }
  });

  newChapterBtn.addEventListener('click', handleCreateChapter);

  const emptyNewChapterBtn = document.getElementById('empty-new-chapter-btn');
  if (emptyNewChapterBtn) {
    emptyNewChapterBtn.addEventListener('click', handleCreateChapter);
  }

  titleInput.addEventListener('input', () => {
    if (!activeChapter) return;
    const titleEl = chapterListEl.querySelector(`.chapter-item[data-id="${activeChapter.id}"] .chapter-item-title`);
    if (titleEl) titleEl.textContent = titleInput.value || 'Tanpa judul';
  });
  titleInput.addEventListener('input', scheduleTitleSave);

  textarea.addEventListener('input', updateWordCountLive);
  textarea.addEventListener('input', scheduleContentSave);

  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); applyToolbar('bold'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); applyToolbar('italic'); }
  });

  document.querySelectorAll('.editor-toolbar button[data-md]').forEach((btn) => {
    btn.addEventListener('click', () => applyToolbar(btn.dataset.md));
  });

  // tombol AI di toolbar
  const aiPolishBtn = document.getElementById('ai-polish-btn');
  if (aiPolishBtn) {
    aiPolishBtn.addEventListener('click', () => {
      const selected = textarea.value.substring(
        textarea.selectionStart,
        textarea.selectionEnd
      );
      AIPolish.run(selected, textarea.value);
    });
  }

  async function loadProject() {
    try {
      const project = await ProjectsAPI.getById(projectId);
      window.InkpadNav.setTitle(project.title);
    } catch (err) {
      window.InkpadNav.setTitle('Novel tidak ditemukan');
    }
  }

  async function loadChapters() {
    chapterListEl.innerHTML = '<p class="muted" style="padding:8px;">Memuat…</p>';
    try {
      chapters = await ChaptersAPI.listByProject(projectId);
      renderChapterList();
      
      // Cek apakah ada last chapter yang tersimpan
      const lastChapter = loadLastChapter();
      const hasSavedChapter = lastChapter && chapters.find(c => c.id === lastChapter.chapterId);
      
      if (chapters.length > 0 && !activeChapter) {
        if (hasSavedChapter) {
          // Jangan auto-pilih chapter pertama, biarkan empty state dengan tombol "Lanjutkan menulis"
          editorEmpty.style.display = 'flex';
          editorActive.style.display = 'none';
          contextPanel.style.display = 'none';
        } else {
          selectChapter(chapters[0].id);
        }
      }
      checkAndShowLastChapter();
    } catch (err) {
      chapterListEl.innerHTML = `<p class="muted" style="padding:8px;">Gagal memuat: ${err.message}</p>`;
    }
  }

  function renderChapterList() {
    const totalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);
    chapterCountEl.textContent = `${chapters.length} bab · ${totalWords.toLocaleString('id-ID')} kata`;

    chapterListEl.innerHTML = '';
    chapters.forEach((ch) => {
      const item = document.createElement('div');
      item.className = 'chapter-item' + (activeChapter && activeChapter.id === ch.id ? ' active' : '');
      item.draggable = true;
      item.dataset.id = ch.id;
      item.innerHTML = `
        <span class="chapter-item-title">${escapeHtml(ch.title || 'Tanpa judul')}</span>
        <span class="chapter-item-status" data-id="${ch.id}">${ch.status}</span>
        <button class="chapter-item-delete" data-id="${ch.id}" title="Hapus bab"><i class="ti ti-trash" aria-hidden="true"></i></button>
      `;
      item.addEventListener('click', (e) => {
        if (e.target.closest('.chapter-item-delete') || e.target.closest('.chapter-item-status')) return;
        selectChapter(ch.id);
      });
      item.querySelector('.chapter-item-status').addEventListener('click', (e) => {
        e.stopPropagation();
        cycleStatus(ch);
      });
      item.querySelector('.chapter-item-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteChapter(ch);
      });
      item.addEventListener('dragstart', () => {
        dragSourceId = ch.id;
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      item.addEventListener('dragover', (e) => e.preventDefault());
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        handleReorder(dragSourceId, ch.id);
      });
      chapterListEl.appendChild(item);
    });
  }

  function selectChapter(id) {
    activeChapter = chapters.find((c) => c.id === id);
    if (!activeChapter) return;
    editorEmpty.style.display = 'none';
    editorActive.style.display = 'flex';
    contextPanel.style.display = 'block';
    titleInput.value = activeChapter.title || '';
    textarea.value = activeChapter.content || '';
    updateWordCountLive();
    setSaveIndicator('saved', activeChapter.updated_at);
    renderChapterList();
    loadContextPanel();
    loadWorldContextPanel();
    loadIllusPanel();
    loadNotesPanel();
    
    // Save as last opened chapter
    saveLastChapter(activeChapter.id, activeChapter.title || 'Tanpa judul');
  }

  function checkAndShowLastChapter() {
    const lastChapter = loadLastChapter();
    
    // Hapus button continue yang existing (cegah duplikasi)
    const existingBtn = editorEmpty.querySelector('.continue-btn');
    if (existingBtn) existingBtn.remove();
    
    // Update empty state dengan button "Lanjutkan menulis"
    if (lastChapter && chapters.length > 0) {
      const chapterStillExists = chapters.find(c => c.id === lastChapter.chapterId);
      if (chapterStillExists) {
        const emptyStateInner = editorEmpty.querySelector('.editor-empty-inner');
        if (emptyStateInner) {
          const continueBtn = document.createElement('button');
          continueBtn.className = 'empty-state-chapter-btn continue-btn';
          continueBtn.innerHTML = `<i class="ti ti-arrow-forward" aria-hidden="true"></i> Lanjutkan menulis di: ${escapeHtml(lastChapter.chapterTitle)}`;
          continueBtn.addEventListener('click', () => {
            selectChapter(lastChapter.chapterId);
          });
          
          // Insert sebelum tombol "Bab baru" yang existing
          const newChapterBtn = emptyStateInner.querySelector('#empty-new-chapter-btn');
          if (newChapterBtn) {
            emptyStateInner.insertBefore(continueBtn, newChapterBtn);
          } else {
            emptyStateInner.appendChild(continueBtn);
          }
        }
      }
    }
  }

  async function handleCreateChapter() {
    const maxOrder = chapters.reduce((max, c) => Math.max(max, c.order_index), -1);
    try {
      const newChapter = await ChaptersAPI.create(projectId, maxOrder + 1);
      chapters.push(newChapter);
      selectChapter(newChapter.id);
      titleInput.focus();
      titleInput.select();
    } catch (err) {
      alert('Gagal bikin bab: ' + err.message);
    }
  }

  async function handleDeleteChapter(ch) {
    if (!confirm(`Hapus "${ch.title}"? Nggak bisa dibatalin.`)) return;
    try {
      await ChaptersAPI.remove(ch.id);
      chapters = chapters.filter((c) => c.id !== ch.id);
      if (activeChapter && activeChapter.id === ch.id) {
        activeChapter = null;
        if (chapters.length > 0) {
          selectChapter(chapters[0].id);
        } else {
          editorActive.style.display = 'none';
          editorEmpty.style.display = 'flex';
          contextPanel.style.display = 'none';
          renderChapterList();
        }
      } else {
        renderChapterList();
      }
    } catch (err) {
      alert('Gagal hapus bab: ' + err.message);
    }
  }

  async function cycleStatus(ch) {
    const order = ['draft', 'revisi', 'final'];
    const next = order[(order.indexOf(ch.status) + 1) % order.length];
    try {
      await ChaptersAPI.update(ch.id, { status: next });
      ch.status = next;
      renderChapterList();
    } catch (err) {
      alert('Gagal ubah status: ' + err.message);
    }
  }

  async function handleTitleChange() {
    if (!activeChapter) return;
    const newTitle = titleInput.value.trim() || 'Tanpa judul';
    setSaveIndicator('saving');
    try {
      const updated = await ChaptersAPI.update(activeChapter.id, { title: newTitle });
      activeChapter.title = updated.title;
      setSaveIndicator(updated._offline ? 'offline' : 'saved', updated.updated_at);
    } catch (err) {
      setSaveIndicator('error');
    }
  }

  function scheduleTitleSave() {
    clearTimeout(titleSaveTimer);
    titleSaveTimer = setTimeout(handleTitleChange, 500);
  }

  async function handleContentChange() {
    if (!activeChapter) return;
    const content = textarea.value;
    const wc = countWords(content);
    setSaveIndicator('saving');
    try {
      const updated = await ChaptersAPI.update(activeChapter.id, { content, word_count: wc });
      activeChapter.content = updated.content;
      activeChapter.word_count = updated.word_count;
      setSaveIndicator(updated._offline ? 'offline' : 'saved', updated.updated_at);
      renderChapterList();
    } catch (err) {
      setSaveIndicator('error');
    }
  }

  function scheduleContentSave() {
    clearTimeout(contentSaveTimer);
    contentSaveTimer = setTimeout(handleContentChange, 700);
  }

  async function forceSave() {
    if (!activeChapter) return;
    clearTimeout(titleSaveTimer);
    clearTimeout(contentSaveTimer);
    await Promise.all([handleTitleChange(), handleContentChange()]);
    showToast('Tersimpan', 'success');
  }

  function updateWordCountLive() {
    wordCountEl.textContent = `${countWords(textarea.value)} kata`;
  }

  function setSaveIndicator(state, timestamp) {
    if (state === 'saving') saveIndicatorEl.textContent = 'Menyimpan…';
    if (state === 'saved') saveIndicatorEl.textContent = timestamp ? `Tersimpan ${formatTime(timestamp)}` : 'Tersimpan';
    if (state === 'offline') saveIndicatorEl.textContent = 'Tersimpan di perangkat (offline)';
    if (state === 'error') saveIndicatorEl.textContent = 'Gagal tersimpan';
  }

  function applyToolbar(type) {
    if (type === 'bold') MarkdownLite.wrapSelection(textarea, '**');
    if (type === 'italic') MarkdownLite.wrapSelection(textarea, '_');
    if (type === 'heading') MarkdownLite.insertLinePrefix(textarea, '## ');
    updateWordCountLive();
    clearTimeout(contentSaveTimer);
    handleContentChange();
  }

  async function handleReorder(sourceId, targetId) {
    if (!sourceId || sourceId === targetId) return;
    const sourceIndex = chapters.findIndex((c) => c.id === sourceId);
    const targetIndex = chapters.findIndex((c) => c.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...chapters];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    reordered.forEach((c, i) => (c.order_index = i));
    chapters = reordered;
    renderChapterList();

    try {
      await ChaptersAPI.reorder(reordered.map((c) => ({ id: c.id, order_index: c.order_index })));
    } catch (err) {
      if (!navigator.onLine) {
        alert('Urutan belum bisa disimpen karena lagi offline. Urutan bakal balik kalau halaman di-refresh sebelum online lagi.');
      } else {
        alert('Gagal nyimpen urutan: ' + err.message);
        loadChapters();
      }
    }
  }

  async function loadAllCharacters() {
    try {
      allCharacters = await CharactersAPI.listByProject(projectId);
    } catch (err) {
      allCharacters = [];
    }
  }

  async function loadContextPanel() {
    if (!activeChapter) return;
    contextCharacterList.innerHTML = '<span class="context-empty">Memuat…</span>';
    try {
      linkedCharacters = await CharactersAPI.listForChapter(activeChapter.id);
      renderContextPanel();
    } catch (err) {
      contextCharacterList.innerHTML = `<span class="context-empty">Gagal memuat: ${err.message}</span>`;
    }
  }

  function renderContextPanel() {
    contextCharacterList.innerHTML = '';
    if (linkedCharacters.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'context-empty';
      empty.textContent = 'Belum ada karakter di bab ini.';
      contextCharacterList.appendChild(empty);
      return;
    }
    linkedCharacters.forEach((ch) => {
      const chip = document.createElement('div');
      chip.className = 'context-character-chip';
      const avatarStyle = ch.image_url ? `background-image: url('${ch.image_url}')` : '';
      chip.innerHTML = `
        <span class="context-character-avatar" style="${avatarStyle}">${ch.image_url ? '' : initials(ch.name)}</span>
        <span>${escapeHtml(ch.name)}</span>
        <button class="unlink-btn" title="Lepas dari bab ini"><i class="ti ti-x" aria-hidden="true"></i></button>
      `;
      chip.addEventListener('click', (e) => {
        if (e.target.closest('.unlink-btn')) return;
        window.location.href = `/characters?project=${projectId}&open=${ch.id}`;
      });
      chip.querySelector('.unlink-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await CharactersAPI.unlinkFromChapter(activeChapter.id, ch.id);
          loadContextPanel();
        } catch (err) {
          alert('Gagal lepas karakter: ' + err.message);
        }
      });
      contextCharacterList.appendChild(chip);
    });
  }

  function togglePicker() {
    if (contextPicker.classList.contains('open')) {
      closePicker();
      return;
    }
    if (!activeChapter) return;

    const linkedIds = new Set(linkedCharacters.map((c) => c.id));
    const available = allCharacters.filter((c) => !linkedIds.has(c.id));

    contextPicker.innerHTML = '';
    if (allCharacters.length === 0) {
      contextPicker.innerHTML = `<p class="context-picker-empty">Belum ada karakter. <a href="/characters?project=${projectId}">Bikin di sini</a>.</p>`;
    } else if (available.length === 0) {
      contextPicker.innerHTML = '<p class="context-picker-empty">Semua karakter udah dipasang di bab ini.</p>';
    } else {
      available.forEach((ch) => {
        const item = document.createElement('div');
        item.className = 'context-picker-item';
        item.textContent = ch.name;
        item.addEventListener('click', async () => {
          try {
            await CharactersAPI.linkToChapter(activeChapter.id, ch.id);
            closePicker();
            loadContextPanel();
          } catch (err) {
            alert('Gagal nambah karakter: ' + err.message);
          }
        });
        contextPicker.appendChild(item);
      });
    }

    contextPicker.classList.add('open');
  }

  function closePicker() {
    contextPicker.classList.remove('open');
  }

  async function loadAllWorldEntries() {
    try {
      allWorldEntries = await WorldAPI.listByProject(projectId);
    } catch (_) {
      allWorldEntries = [];
    }
  }

  async function loadWorldContextPanel() {
    if (!activeChapter) return;
    contextWorldList.innerHTML = '<span class="context-empty">Memuat…</span>';
    try {
      linkedWorldEntries = await WorldAPI.listForChapter(activeChapter.id);
      renderWorldContextPanel();
    } catch (err) {
      contextWorldList.innerHTML = `<span class="context-empty">Gagal: ${err.message}</span>`;
    }
  }

  function renderWorldContextPanel() {
    contextWorldList.innerHTML = '';
    if (linkedWorldEntries.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'context-empty';
      empty.textContent = 'Belum ada world entry.';
      contextWorldList.appendChild(empty);
      return;
    }
    linkedWorldEntries.forEach((entry) => {
      const chip = document.createElement('div');
      chip.className = 'context-world-chip';
      chip.innerHTML = `
        <span class="context-world-chip-text">${escapeHtml(entry.title)}</span>
        <button class="unlink-btn" title="Lepas dari bab ini"><i class="ti ti-x" aria-hidden="true"></i></button>
      `;
      chip.addEventListener('click', (e) => {
        if (e.target.closest('.unlink-btn')) return;
        window.location.href = `/worldbuilding?project=${projectId}&open=${entry.id}`;
      });
      chip.querySelector('.unlink-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await WorldAPI.unlinkFromChapter(activeChapter.id, entry.id);
          loadWorldContextPanel();
        } catch (err) {
          alert('Gagal lepas entry: ' + err.message);
        }
      });
      contextWorldList.appendChild(chip);
    });
  }

  function toggleWorldPicker() {
    if (contextWorldPicker.classList.contains('open')) {
      closeWorldPicker();
      return;
    }
    if (!activeChapter) return;

    const linkedIds = new Set(linkedWorldEntries.map((e) => e.id));
    const available = allWorldEntries.filter((e) => !linkedIds.has(e.id));

    contextWorldPicker.innerHTML = '';
    if (allWorldEntries.length === 0) {
      contextWorldPicker.innerHTML = `<p class="context-picker-empty">Belum ada entry. <a href="/pages/worldbuilding.html?project=${projectId}">Bikin di sini</a>.</p>`;
    } else if (available.length === 0) {
      contextWorldPicker.innerHTML = '<p class="context-picker-empty">Semua entry udah dipasang di bab ini.</p>';
    } else {
      available.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'context-picker-item';
        item.textContent = entry.title;
        item.addEventListener('click', async () => {
          try {
            await WorldAPI.linkToChapter(activeChapter.id, entry.id);
            closeWorldPicker();
            loadWorldContextPanel();
          } catch (err) {
            alert('Gagal nambah entry: ' + err.message);
          }
        });
        contextWorldPicker.appendChild(item);
      });
    }
    contextWorldPicker.classList.add('open');
  }

  function closeWorldPicker() {
    contextWorldPicker.classList.remove('open');
  }

  async function loadIllusPanel() {
    if (!activeChapter || !illusListEl) return;
    illusListEl.innerHTML = '<span class="context-empty" style="font-size:12px;">Memuat…</span>';
    try {
      const list = await IllustrationsAPI.listByChapter(activeChapter.id);
      renderIllusPanel(list);
    } catch (err) {
      illusListEl.innerHTML = `<span class="context-empty" style="font-size:12px;">Gagal: ${err.message}</span>`;
    }
  }

  function renderIllusPanel(list) {
    if (!illusListEl) return;
    illusListEl.innerHTML = '';
    if (list.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'context-empty';
      empty.style.fontSize = '12px';
      empty.textContent = 'Belum ada ilustrasi.';
      illusListEl.appendChild(empty);
      return;
    }
    list.forEach((il, index) => {
      const wrap = document.createElement('div');
      wrap.className = 'illus-thumb-wrap';
      
      // Tambah badge nomor index untuk referensi marker
      const indexBadge = document.createElement('span');
      indexBadge.className = 'illus-index-badge';
      indexBadge.textContent = index;
      indexBadge.title = `Gunakan {{illus:${index}}} di editor`;
      
      if (il.video_url) {
        wrap.innerHTML = `<video class="illus-video-thumb" src="${il.video_url}" muted loop></video>`;
      } else if (il.image_url) {
        wrap.innerHTML = `<img class="illus-thumb" src="${il.image_url}" alt="" loading="lazy" />`;
      }
      
      wrap.insertBefore(indexBadge, wrap.firstChild);
      
      const captionInput = document.createElement('input');
      captionInput.type = 'text';
      captionInput.className = 'illus-caption-input';
      captionInput.placeholder = 'Caption opsional…';
      captionInput.value = il.caption || '';
      captionInput.addEventListener('change', async () => {
        try { await IllustrationsAPI.updateCaption(il.id, captionInput.value.trim()); }
        catch (_) {}
      });
      const delBtn = document.createElement('button');
      delBtn.className = 'illus-delete-btn';
      delBtn.innerHTML = '<i class="ti ti-x" aria-hidden="true"></i>';
      delBtn.title = 'Hapus ilustrasi';
      delBtn.addEventListener('click', async () => {
        if (!confirm('Hapus ilustrasi ini?')) return;
        try {
          await IllustrationsAPI.remove(il.id);
          loadIllusPanel();
        } catch (err) {
          alert('Gagal hapus: ' + err.message);
        }
      });
      wrap.appendChild(captionInput);
      wrap.appendChild(delBtn);
      illusListEl.appendChild(wrap);
    });
  }

  async function handleIllusUpload() {
    if (!activeChapter || !illusUpload.files[0]) return;
    const file = illusUpload.files[0];
    illusUpload.value = '';

    const uploading = document.createElement('span');
    uploading.className = 'illus-uploading';
    uploading.textContent = 'Mengupload…';
    illusListEl.prepend(uploading);

    try {
      const isVideo = file.type.startsWith('video/');
      const folder = isVideo ? 'illustrations/video' : 'illustrations/image';
      const url = await StorageAPI.upload(folder, file);

      const list = await IllustrationsAPI.listByChapter(activeChapter.id);
      const maxOrder = list.reduce((m, il) => Math.max(m, il.order_index), -1);

      await IllustrationsAPI.create(activeChapter.id, {
        image_url: isVideo ? null : url,
        video_url: isVideo ? url : null,
        caption: null,
        order_index: maxOrder + 1,
      });
      loadIllusPanel();
    } catch (err) {
      alert('Gagal upload: ' + err.message);
      uploading.remove();
    }
  }

  async function loadNotesPanel() {
    if (!activeChapter || !contextNotesList) return;
    contextNotesList.innerHTML = '<span class="context-empty" style="font-size:12px;">Memuat…</span>';
    try {
      const notes = await NotesAPI.listByChapter(activeChapter.id);
      renderNotesPanel(notes);
    } catch (err) {
      contextNotesList.innerHTML = `<span class="context-empty" style="font-size:12px;">Gagal: ${err.message}</span>`;
    }
  }

  function renderNotesPanel(notes) {
    if (!contextNotesList) return;
    contextNotesList.innerHTML = '';
    if (notes.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'context-empty';
      empty.style.fontSize = '12px';
      empty.textContent = 'Belum ada catatan.';
      contextNotesList.appendChild(empty);
      return;
    }
    notes.forEach((note) => {
      const item = document.createElement('div');
      item.className = 'context-note-item';
      item.innerHTML = `
        <span class="context-note-text">${escapeHtml(note.content)}</span>
        <button class="context-note-del" title="Hapus catatan"><i class="ti ti-x" aria-hidden="true"></i></button>
      `;
      item.querySelector('.context-note-del').addEventListener('click', async (e) => {
        e.stopPropagation();
        try { await NotesAPI.remove(note.id); loadNotesPanel(); }
        catch (err) { alert('Gagal hapus: ' + err.message); }
      });
      contextNotesList.appendChild(item);
    });
  }

  async function handleQuickNoteAdd() {
    if (!activeChapter || !quickNoteInput) return;
    const content = quickNoteInput.value.trim();
    if (!content) return;
    try {
      await NotesAPI.create(projectId, {
        content,
        assigned_chapter_id: activeChapter.id,
        assigned_character_id: null,
        assigned_world_id: null,
      });
      quickNoteInput.value = '';
      loadNotesPanel();
    } catch (err) {
      alert('Gagal simpan catatan: ' + err.message);
    }
  }

  function toggleFocusMode() {
    focusMode = !focusMode;
    manuscriptShell?.classList.toggle('focus-mode', focusMode);
    if (focusBtn) {
      focusBtn.title = focusMode ? 'Keluar focus mode (Esc)' : 'Distraction-free mode (Alt+F)';
      const icon = focusBtn.querySelector('i');
      if (icon) icon.className = focusMode ? 'ti ti-focus-2 active' : 'ti ti-focus-2';
      focusBtn.style.color = focusMode ? 'var(--accent)' : '';
    }
    if (focusMode) textarea.focus();
  }

  function exportChapterMarkdown() {
    if (!activeChapter) {
      showToast('Pilih bab dulu', 'error');
      return;
    }
    const title = titleInput.value.trim() || activeChapter.title || 'Tanpa Judul';
    const content = textarea.value || '';
    downloadText(`# ${title}\n\n${content}`, `${safeFilename(title)}.md`);
    showToast(`Mengunduh: ${title}.md`, 'success');
  }

  async function exportAllMarkdown() {
    if (chapters.length === 0) {
      showToast('Belum ada bab', 'error');
      return;
    }
    showToast('Menyiapkan export...');
    try {
      if (activeChapter) await forceSave();
      const allChapters = await ChaptersAPI.listByProject(projectId);
      const projectTitle = document.querySelector('.topbar h1')?.textContent || 'Novel';
      const markdown = allChapters.map((chapter) => {
        const title = chapter.title || 'Tanpa Judul';
        const content = chapter.content || '';
        return `# ${title}\n\n${content}`;
      }).join('\n\n---\n\n');
      downloadText(markdown, `${safeFilename(projectTitle)}.md`);
      showToast(`Mengunduh: ${projectTitle}.md`, 'success');
    } catch (err) {
      showToast('Gagal export: ' + err.message, 'error');
    }
  }

  function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      anchor.remove();
    }, 1000);
  }

  function showToast(message, type = '') {
    let toast = document.getElementById('inkpad-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'inkpad-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    clearTimeout(toastTimer);
    requestAnimationFrame(() => {
      toast.classList.add('show');
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    });
  }

  function safeFilename(name) {
    return (name || 'Novel').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Novel';
  }

  function initials(name) {
    return (name || '?').trim().slice(0, 1).toUpperCase();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

pageInit.register('manuscript', initManuscriptPage);