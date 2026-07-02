// js/modules/worldbuilding-page.js

function initWorldPage() {
  const projectId = window.InkpadProject.getActiveProjectId();
  if (!projectId) {
    document.getElementById('page-main').innerHTML =
      '<p class="muted" style="padding:24px;">Nggak ada novel yang dipilih. Balik ke <a href="/index.html">Project Hub</a>.</p>';
    return;
  }

  const groups = document.getElementById('world-groups');
  const newBtn = document.getElementById('new-entry-btn');
  const modal = document.getElementById('entry-modal');
  const modalTitle = document.getElementById('modal-title');
  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('entry-form');
  const formError = document.getElementById('entry-error');
  const deleteBtn = document.getElementById('entry-delete-btn');
  const titleInput = document.getElementById('entry-title');
  const categoryInput = document.getElementById('entry-category');
  const contentInput = document.getElementById('entry-content');
  const xlinkPreview = document.getElementById('xlink-preview');
  const categorySuggestions = document.getElementById('category-suggestions');

  let entries = [];
  let characters = [];
  let editingId = null;

  loadProject();
  loadData();

  newBtn.addEventListener('click', () => openModal());
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  deleteBtn.addEventListener('click', handleDelete);
  form.addEventListener('submit', handleSubmit);

  // preview cross-link live saat ngetik isi
  contentInput.addEventListener('input', updateXlinkPreview);

  // juga update preview saat judul diganti (bisa aja entry nama sendiri di-xlink)
  titleInput.addEventListener('input', updateXlinkPreview);

  // auto-close modal kalau klik xlink-link di preview
  xlinkPreview.addEventListener('click', (e) => {
    const link = e.target.closest('.xlink-link');
    if (!link) return;
    const type = link.dataset.type;
    const id = link.dataset.id;
    closeModal();
    if (type === 'character') {
      window.location.href = `/characters?project=${projectId}&open=${id}`;
    } else if (type === 'world') {
      const entry = entries.find((en) => en.id === id);
      if (entry) openModal(entry);
    }
  });

  async function loadProject() {
    try {
      const project = await ProjectsAPI.getById(projectId);
      window.InkpadNav.setTitle(`Worldbuilding — ${project.title}`);
    } catch (_) {
      window.InkpadNav.setTitle('Worldbuilding');
    }
  }

  async function loadData() {
    groups.innerHTML = '<p class="muted">Memuat…</p>';
    try {
      [entries, characters] = await Promise.all([
        WorldAPI.listByProject(projectId),
        CharactersAPI.listByProject(projectId),
      ]);
      renderGroups();
      updateCategorySuggestions();
      maybeOpenFromQuery();
    } catch (err) {
      groups.innerHTML = `<p class="muted">Gagal memuat: ${err.message}</p>`;
    }
  }

  function maybeOpenFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get('open');
    if (!openId) return;
    const entry = entries.find((e) => e.id === openId);
    if (entry) openModal(entry);
  }

  function renderGroups() {
    groups.innerHTML = '';

    if (entries.length === 0) {
      groups.innerHTML = `
        <div class="empty-state">
          <p class="muted">Belum ada entry worldbuilding. Mulai dari lokasi, sistem kekuatan, atau sejarah dunia ceritamu.</p>
        </div>`;
      return;
    }

    // kelompokin per kategori
    const grouped = entries.reduce((acc, entry) => {
      const cat = entry.category || 'Lainnya';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(entry);
      return acc;
    }, {});

    Object.keys(grouped).sort().forEach((cat) => {
      const group = document.createElement('div');
      group.className = 'world-group';
      group.innerHTML = `<h2 class="world-group-title">${escapeHtml(cat)}</h2>`;
      const grid = document.createElement('div');
      grid.className = 'entry-grid';
      grouped[cat].forEach((entry) => grid.appendChild(buildCard(entry)));
      group.appendChild(grid);
      groups.appendChild(group);
    });
  }

  function buildCard(entry) {
    const card = document.createElement('div');
    card.className = 'entry-card';
    const preview = (entry.content || '').replace(/\[\[([^\]]+)\]\]/g, '$1').slice(0, 140);
    card.innerHTML = `
      <p class="entry-title">${escapeHtml(entry.title)}</p>
      ${preview ? `<p class="entry-preview">${escapeHtml(preview)}${(entry.content || '').length > 140 ? '…' : ''}</p>` : ''}
    `;
    card.addEventListener('click', () => openModal(entry));
    return card;
  }

  function openModal(entry) {
    editingId = entry ? entry.id : null;
    formError.style.display = 'none';
    modalTitle.textContent = entry ? 'Edit entry' : 'Entry baru';
    deleteBtn.style.display = entry ? 'inline-flex' : 'none';
    titleInput.value = entry ? entry.title : '';
    categoryInput.value = entry ? entry.category || '' : '';
    contentInput.value = entry ? entry.content || '' : '';
    updateXlinkPreview();
    modal.classList.add('open');
    titleInput.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    editingId = null;
  }

  function buildResolver() {
    return (name) => {
      const lname = name.toLowerCase();
      const char = characters.find((c) => c.name.toLowerCase() === lname ||
        (c.aliases || '').split(/[,，]/).map((a) => a.trim().toLowerCase()).includes(lname));
      if (char) return { type: 'character', id: char.id };
      const world = entries.find((e) => e.title.toLowerCase() === lname);
      if (world) return { type: 'world', id: world.id };
      return null;
    };
  }

  function updateXlinkPreview() {
    const text = contentInput.value;
    if (!text.trim()) {
      xlinkPreview.innerHTML = '<span style="opacity:.5">Preview cross-link muncul di sini saat ada [[Nama]].</span>';
      return;
    }
    xlinkPreview.innerHTML = CrossLink.render(text, buildResolver());
  }

  function updateCategorySuggestions() {
    const cats = [...new Set(entries.map((e) => e.category).filter(Boolean))];
    const defaults = ['Lokasi', 'Karakter', 'Sistem Power', 'Sejarah', 'Organisasi', 'Artefak', 'Lainnya'];
    const all = [...new Set([...cats, ...defaults])].sort();
    categorySuggestions.innerHTML = all.map((c) => `<option value="${escapeHtml(c)}">`).join('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    formError.style.display = 'none';
    const title = titleInput.value.trim();
    const category = categoryInput.value.trim() || 'Lainnya';
    const content = contentInput.value.trim();
    if (!title) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan…';

    try {
      if (editingId) {
        await WorldAPI.update(editingId, { title, category, content });
      } else {
        await WorldAPI.create(projectId, { title, category, content });
      }
      closeModal();
      loadData();
    } catch (err) {
      formError.textContent = err.message;
      formError.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan';
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    const entry = entries.find((e) => e.id === editingId);
    if (!entry) return;
    if (!confirm(`Hapus "${entry.title}"? Link ke bab juga ikut kehapus.`)) return;
    try {
      await WorldAPI.remove(editingId);
      closeModal();
      loadData();
    } catch (err) {
      alert('Gagal hapus: ' + err.message);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

pageInit.register('world', initWorldPage);
