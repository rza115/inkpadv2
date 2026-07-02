// js/modules/plot-page.js

function initPlotPage() {
  const projectId = window.InkpadProject.getActiveProjectId();
  if (!projectId) {
    document.getElementById('page-main').innerHTML =
      '<p class="muted" style="padding:24px;">Nggak ada novel yang dipilih. Balik ke <a href="/index.html">Project Hub</a>.</p>';
    return;
  }

  let chapters = [], arcs = [], foreshadows = [];

  const arcGrid = document.getElementById('arc-grid');
  const foreshadowList = document.getElementById('foreshadow-list');

  // ── Arc modal ──
  const arcModal = document.getElementById('arc-modal');
  const arcForm = document.getElementById('arc-form');
  const arcError = document.getElementById('arc-error');
  const arcClose = document.getElementById('arc-close');
  const arcDeleteBtn = document.getElementById('arc-delete-btn');
  let editingArcId = null;

  // ── Foreshadow modal ──
  const fModal = document.getElementById('foreshadow-modal');
  const fForm = document.getElementById('foreshadow-form');
  const fError = document.getElementById('foreshadow-error');
  const fClose = document.getElementById('foreshadow-close');
  const fDeleteBtn = document.getElementById('foreshadow-delete-btn-modal');
  let editingFId = null;

  loadProject();
  loadAll();

  document.getElementById('new-arc-btn').addEventListener('click', () => openArcModal());
  arcClose.addEventListener('click', () => arcModal.classList.remove('open'));
  arcModal.addEventListener('click', (e) => { if (e.target === arcModal) arcModal.classList.remove('open'); });
  arcDeleteBtn.addEventListener('click', handleArcDelete);
  arcForm.addEventListener('submit', handleArcSubmit);

  document.getElementById('new-foreshadow-btn').addEventListener('click', () => openFModal());
  fClose.addEventListener('click', () => fModal.classList.remove('open'));
  fModal.addEventListener('click', (e) => { if (e.target === fModal) fModal.classList.remove('open'); });
  fDeleteBtn.addEventListener('click', handleFDelete);
  fForm.addEventListener('submit', handleFSubmit);

  async function loadProject() {
    try {
      const project = await ProjectsAPI.getById(projectId);
      window.InkpadNav.setTitle(`Plot — ${project.title}`);
    } catch (_) {}
  }

  async function loadAll() {
    arcGrid.innerHTML = '<p class="empty-msg">Memuat…</p>';
    foreshadowList.innerHTML = '<p class="empty-msg">Memuat…</p>';
    try {
      [chapters, arcs, foreshadows] = await Promise.all([
        ChaptersAPI.listByProject(projectId),
        PlotAPI.listArcs(projectId),
        PlotAPI.listForeshadow(projectId),
      ]);
      renderArcs();
      renderForeshadows();
    } catch (err) {
      arcGrid.innerHTML = `<p class="empty-msg">Gagal memuat: ${err.message}</p>`;
    }
  }

  // ── Arc render ──
  function renderArcs() {
    arcGrid.innerHTML = '';
    if (arcs.length === 0) {
      arcGrid.innerHTML = '<p class="empty-msg">Belum ada arc. Klik "Arc baru" buat mulai.</p>';
      return;
    }
    arcs.forEach((arc) => arcGrid.appendChild(buildArcCard(arc)));
  }

  function buildArcCard(arc) {
    const card = document.createElement('div');
    card.className = 'arc-card';
    const startTitle = arc.start ? arc.start.title : '?';
    const endTitle = arc.end ? arc.end.title : '?';
    const hasRange = arc.chapter_start_id || arc.chapter_end_id;
    card.innerHTML = `
      <p class="arc-card-title">${escHtml(arc.title)}</p>
      ${hasRange ? `<p class="arc-card-range">${escHtml(startTitle)} → ${escHtml(endTitle)}</p>` : ''}
      ${arc.summary ? `<p class="arc-card-summary">${escHtml(arc.summary)}</p>` : ''}
      <div class="arc-card-footer">
        <span class="badge ${arc.status}">${statusLabel(arc.status)}</span>
      </div>
    `;
    card.addEventListener('click', () => openArcModal(arc));
    return card;
  }

  // ── Arc modal ──
  function openArcModal(arc) {
    editingArcId = arc ? arc.id : null;
    arcError.style.display = 'none';
    document.getElementById('arc-modal-title').textContent = arc ? 'Edit arc' : 'Arc baru';
    arcDeleteBtn.style.display = arc ? 'inline-flex' : 'none';
    document.getElementById('arc-title').value = arc ? arc.title : '';
    document.getElementById('arc-status').value = arc ? arc.status : 'planning';
    document.getElementById('arc-summary').value = arc ? arc.summary || '' : '';
    populateChapterSelects('arc-start', arc ? arc.chapter_start_id : null);
    populateChapterSelects('arc-end', arc ? arc.chapter_end_id : null);
    arcModal.classList.add('open');
  }

  async function handleArcSubmit(e) {
    e.preventDefault();
    arcError.style.display = 'none';
    const title = document.getElementById('arc-title').value.trim();
    if (!title) return;
    const fields = {
      title,
      status: document.getElementById('arc-status').value,
      summary: document.getElementById('arc-summary').value.trim() || null,
      chapter_start_id: document.getElementById('arc-start').value || null,
      chapter_end_id: document.getElementById('arc-end').value || null,
      order_index: editingArcId ? undefined : arcs.length,
    };
    const btn = arcForm.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Menyimpan…';
    try {
      editingArcId ? await PlotAPI.updateArc(editingArcId, fields) : await PlotAPI.createArc(projectId, fields);
      arcModal.classList.remove('open');
      loadAll();
    } catch (err) {
      arcError.textContent = err.message; arcError.style.display = 'block';
    } finally { btn.disabled = false; btn.textContent = 'Simpan'; }
  }

  async function handleArcDelete() {
    if (!editingArcId) return;
    if (!confirm('Hapus arc ini?')) return;
    try { await PlotAPI.removeArc(editingArcId); arcModal.classList.remove('open'); loadAll(); }
    catch (err) { alert('Gagal hapus: ' + err.message); }
  }

  // ── Foreshadow render ──
  function renderForeshadows() {
    foreshadowList.innerHTML = '';
    if (foreshadows.length === 0) {
      foreshadowList.innerHTML = '<p class="empty-msg">Belum ada entri foreshadow.</p>';
      return;
    }
    foreshadows.forEach((f) => foreshadowList.appendChild(buildForeshadowItem(f)));
  }

  function buildForeshadowItem(f) {
    const item = document.createElement('div');
    item.className = 'foreshadow-item';
    const plantedTitle = f.planted ? f.planted.title : '—';
    const payoffTitle = f.payoff ? f.payoff.title : '—';
    item.innerHTML = `
      <span class="foreshadow-note">${escHtml(f.note)}</span>
      <span class="foreshadow-chapters">${escHtml(plantedTitle)} → ${escHtml(payoffTitle)}</span>
      <button class="foreshadow-status ${f.status}" data-id="${f.id}" data-status="${f.status}">
        ${f.status === 'paid' ? '✓ Terbayar' : 'Belum dibayar'}
      </button>
      <button class="foreshadow-delete" title="Hapus" data-id="${f.id}"><i class="ti ti-x" aria-hidden="true"></i></button>
    `;
    item.querySelector('.foreshadow-note').addEventListener('click', () => openFModal(f));
    item.querySelector('.foreshadow-status').addEventListener('click', async (e) => {
      e.stopPropagation();
      const newStatus = f.status === 'paid' ? 'pending' : 'paid';
      try { await PlotAPI.updateForeshadow(f.id, { status: newStatus }); loadAll(); }
      catch (err) { alert('Gagal update: ' + err.message); }
    });
    item.querySelector('.foreshadow-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Hapus entri ini?')) return;
      try { await PlotAPI.removeForeshadow(f.id); loadAll(); }
      catch (err) { alert('Gagal hapus: ' + err.message); }
    });
    return item;
  }

  // ── Foreshadow modal ──
  function openFModal(f) {
    editingFId = f ? f.id : null;
    fError.style.display = 'none';
    document.getElementById('foreshadow-modal-title').textContent = f ? 'Edit foreshadow' : 'Foreshadow baru';
    fDeleteBtn.style.display = f ? 'inline-flex' : 'none';
    document.getElementById('f-note').value = f ? f.note : '';
    populateChapterSelects('f-planted', f ? f.planted_chapter_id : null);
    populateChapterSelects('f-payoff', f ? f.payoff_chapter_id : null);
    fModal.classList.add('open');
  }

  async function handleFSubmit(e) {
    e.preventDefault();
    fError.style.display = 'none';
    const note = document.getElementById('f-note').value.trim();
    if (!note) return;
    const fields = {
      note,
      planted_chapter_id: document.getElementById('f-planted').value || null,
      payoff_chapter_id: document.getElementById('f-payoff').value || null,
    };
    const btn = fForm.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Menyimpan…';
    try {
      editingFId ? await PlotAPI.updateForeshadow(editingFId, fields) : await PlotAPI.createForeshadow(projectId, fields);
      fModal.classList.remove('open');
      loadAll();
    } catch (err) {
      fError.textContent = err.message; fError.style.display = 'block';
    } finally { btn.disabled = false; btn.textContent = 'Simpan'; }
  }

  async function handleFDelete() {
    if (!editingFId) return;
    if (!confirm('Hapus entri foreshadow ini?')) return;
    try { await PlotAPI.removeForeshadow(editingFId); fModal.classList.remove('open'); loadAll(); }
    catch (err) { alert('Gagal hapus: ' + err.message); }
  }

  // ── helpers ──
  function populateChapterSelects(selectId, selectedId) {
    const sel = document.getElementById(selectId);
    sel.innerHTML = '<option value="">— Belum dipilih —</option>';
    chapters.forEach((ch) => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.textContent = ch.title || 'Tanpa judul';
      if (ch.id === selectedId) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function statusLabel(s) {
    return { planning: 'Planning', ongoing: 'Ongoing', complete: 'Selesai' }[s] || s;
  }

  function escHtml(str) {
    const d = document.createElement('div'); d.textContent = str; return d.innerHTML;
  }
}

pageInit.register('plot', initPlotPage);
