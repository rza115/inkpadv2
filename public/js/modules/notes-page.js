// js/modules/notes-page.js

function initNotesPage() {
  const projectId = window.InkpadProject.getActiveProjectId();
  if (!projectId) {
    document.getElementById('page-main').innerHTML =
      '<p class="muted" style="padding:24px;">Nggak ada novel yang dipilih. Balik ke <a href="/index.html">Project Hub</a>.</p>';
    return;
  }

  let notes = [], chapters = [], characters = [], worldEntries = [];
  let editingId = null;

  const notesList = document.getElementById('notes-list');
  const modal = document.getElementById('note-modal');
  const form = document.getElementById('note-form');
  const noteError = document.getElementById('note-error');
  const deleteBtn = document.getElementById('note-delete-btn');

  loadProject();
  loadAll();

  document.getElementById('new-note-btn').addEventListener('click', () => openModal());
  document.getElementById('note-close').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
  deleteBtn.addEventListener('click', handleDelete);
  form.addEventListener('submit', handleSubmit);

  // auto-clear assignment selects saat satu dipilih (single assignment)
  ['note-chapter', 'note-character', 'note-world'].forEach((id) => {
    document.getElementById(id).addEventListener('change', (e) => {
      if (e.target.value) {
        ['note-chapter', 'note-character', 'note-world']
          .filter((s) => s !== id)
          .forEach((s) => { document.getElementById(s).value = ''; });
      }
    });
  });

  async function loadProject() {
    try {
      const project = await ProjectsAPI.getById(projectId);
      window.InkpadNav.setTitle(`Catatan — ${project.title}`);
    } catch (_) {}
  }

  async function loadAll() {
    notesList.innerHTML = '<p class="empty-msg">Memuat…</p>';
    try {
      [notes, chapters, characters, worldEntries] = await Promise.all([
        NotesAPI.listByProject(projectId),
        ChaptersAPI.listByProject(projectId),
        CharactersAPI.listByProject(projectId),
        WorldAPI.listByProject(projectId),
      ]);
      renderNotes();
    } catch (err) {
      notesList.innerHTML = `<p class="empty-msg">Gagal memuat: ${err.message}</p>`;
    }
  }

  function renderNotes() {
    notesList.innerHTML = '';
    if (notes.length === 0) {
      notesList.innerHTML = '<p class="empty-msg">Belum ada catatan. Buang ide random di sini dulu, rapiin belakangan.</p>';
      return;
    }
    notes.forEach((note) => notesList.appendChild(buildNoteCard(note)));
  }

  function buildNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    const assignBadge = buildAssignBadge(note);
    const date = new Date(note.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    card.innerHTML = `
      <p class="note-content">${escHtml(note.content)}</p>
      <div class="note-footer">
        ${assignBadge ? `<span class="note-assign-badge">${assignBadge}</span>` : '<span></span>'}
        <span class="note-date">${date}</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(note));
    return card;
  }

  function buildAssignBadge(note) {
    if (note.chapter) return `↳ ${escHtml(note.chapter.title || 'Tanpa judul')}`;
    if (note.character) return `↳ ${escHtml(note.character.name)}`;
    if (note.world) return `↳ ${escHtml(note.world.title)}`;
    return '';
  }

  function openModal(note) {
    editingId = note ? note.id : null;
    noteError.style.display = 'none';
    document.getElementById('note-modal-title').textContent = note ? 'Edit catatan' : 'Catatan baru';
    deleteBtn.style.display = note ? 'inline-flex' : 'none';
    document.getElementById('note-content').value = note ? note.content : '';
    populateSelects(note);
    modal.classList.add('open');
    document.getElementById('note-content').focus();
  }

  function populateSelects(note) {
    const chSel = document.getElementById('note-chapter');
    const chrSel = document.getElementById('note-character');
    const wSel = document.getElementById('note-world');

    chSel.innerHTML = '<option value="">—</option>';
    chapters.forEach((c) => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.title || 'Tanpa judul';
      if (note && note.assigned_chapter_id === c.id) o.selected = true;
      chSel.appendChild(o);
    });

    chrSel.innerHTML = '<option value="">—</option>';
    characters.forEach((c) => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.name;
      if (note && note.assigned_character_id === c.id) o.selected = true;
      chrSel.appendChild(o);
    });

    wSel.innerHTML = '<option value="">—</option>';
    worldEntries.forEach((w) => {
      const o = document.createElement('option');
      o.value = w.id; o.textContent = w.title;
      if (note && note.assigned_world_id === w.id) o.selected = true;
      wSel.appendChild(o);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    noteError.style.display = 'none';
    const content = document.getElementById('note-content').value.trim();
    if (!content) return;
    const fields = {
      content,
      assigned_chapter_id: document.getElementById('note-chapter').value || null,
      assigned_character_id: document.getElementById('note-character').value || null,
      assigned_world_id: document.getElementById('note-world').value || null,
    };
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Menyimpan…';
    try {
      editingId ? await NotesAPI.update(editingId, fields) : await NotesAPI.create(projectId, fields);
      modal.classList.remove('open');
      loadAll();
    } catch (err) {
      noteError.textContent = err.message; noteError.style.display = 'block';
    } finally { btn.disabled = false; btn.textContent = 'Simpan'; }
  }

  async function handleDelete() {
    if (!editingId) return;
    if (!confirm('Hapus catatan ini?')) return;
    try { await NotesAPI.remove(editingId); modal.classList.remove('open'); loadAll(); }
    catch (err) { alert('Gagal hapus: ' + err.message); }
  }

  function escHtml(str) {
    const d = document.createElement('div'); d.textContent = str; return d.innerHTML;
  }
}

pageInit.register('notes', initNotesPage);
