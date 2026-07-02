// js/modules/characters-page.js
// Logic halaman Karakter: grid, modal create/edit (sekaligus, lewat satu modal
// yang sama), upload foto, delete. Dukung deep-link ?open=<id> buat auto-buka
// modal edit karakter tertentu (dipakai dari panel kanan editor manuscript).

function initCharactersPage() {
  const projectId = window.InkpadProject.getActiveProjectId();
  if (!projectId) {
    document.getElementById('page-main').innerHTML =
      '<p class="muted" style="padding:24px;">Nggak ada novel yang dipilih. Balik ke <a href="/index.html">Project Hub</a>.</p>';
    return;
  }

  const grid = document.getElementById('character-grid');
  const modal = document.getElementById('character-modal');
  const modalTitle = document.getElementById('modal-title');
  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('character-form');
  const formError = document.getElementById('character-error');
  const photoInput = document.getElementById('character-photo');
  const photoPreview = document.getElementById('photo-preview');
  const deleteBtn = document.getElementById('character-delete-btn');
  const nameInput = document.getElementById('character-name');
  const aliasesInput = document.getElementById('character-aliases');
  const roleInput = document.getElementById('character-role');
  const descriptionInput = document.getElementById('character-description');

  let characters = [];
  let editingId = null;
  let pendingPhotoFile = null;

  loadProject();
  loadCharacters();

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (!file) return;
    pendingPhotoFile = file;
    photoPreview.style.backgroundImage = `url('${URL.createObjectURL(file)}')`;
    photoPreview.classList.add('has-photo');
  });

  form.addEventListener('submit', handleSubmit);
  deleteBtn.addEventListener('click', handleDelete);

  async function loadProject() {
    try {
      const project = await ProjectsAPI.getById(projectId);
      window.InkpadNav.setTitle(`Karakter — ${project.title}`);
    } catch (err) {
      window.InkpadNav.setTitle('Karakter');
    }
  }

  async function loadCharacters() {
    grid.innerHTML = '<p class="muted">Memuat…</p>';
    try {
      characters = await CharactersAPI.listByProject(projectId);
      renderGrid();
      maybeOpenFromQuery();
    } catch (err) {
      grid.innerHTML = `<p class="muted">Gagal memuat: ${err.message}</p>`;
    }
  }

  function maybeOpenFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get('open');
    if (!openId) return;
    const ch = characters.find((c) => c.id === openId);
    if (!ch) return;
    openModal(ch);
    clearOpenParam();
  }

  function clearOpenParam() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('open')) return;
    url.searchParams.delete('open');
    window.history.replaceState(null, '', url);
  }

  function renderGrid() {
    grid.innerHTML = '';
    grid.appendChild(buildNewCard());

    if (characters.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'muted empty-state';
      empty.textContent = 'Belum ada karakter. Mulai dari tokoh utama.';
      grid.appendChild(empty);
      return;
    }

    characters.forEach((ch) => grid.appendChild(buildCard(ch)));
  }

  function buildNewCard() {
    const card = document.createElement('div');
    card.className = 'character-card new-card';
    card.innerHTML = '<i class="ti ti-user-plus" aria-hidden="true"></i><span>Karakter baru</span>';
    card.addEventListener('click', () => openModal());
    return card;
  }

  function buildCard(ch) {
    const card = document.createElement('div');
    card.className = 'character-card';
    const photoStyle = ch.image_url ? `background-image: url('${ch.image_url}')` : '';
    card.innerHTML = `
      <div class="character-photo ${ch.image_url ? '' : 'no-photo'}" style="${photoStyle}">
        ${ch.image_url ? '' : '<i class="ti ti-user" aria-hidden="true"></i>'}
      </div>
      <p class="character-name">${escapeHtml(ch.name)}</p>
      ${ch.role ? `<span class="badge">${roleLabel(ch.role)}</span>` : ''}
    `;
    card.addEventListener('click', () => openModal(ch));
    return card;
  }

  function openModal(ch) {
    editingId = ch ? ch.id : null;
    pendingPhotoFile = null;
    formError.style.display = 'none';
    modalTitle.textContent = ch ? 'Edit karakter' : 'Karakter baru';
    deleteBtn.style.display = ch ? 'inline-flex' : 'none';

    nameInput.value = ch ? ch.name : '';
    aliasesInput.value = ch ? ch.aliases || '' : '';
    roleInput.value = ch ? ch.role || '' : '';
    descriptionInput.value = ch ? ch.description || '' : '';
    photoInput.value = '';

    if (ch && ch.image_url) {
      photoPreview.style.backgroundImage = `url('${ch.image_url}')`;
      photoPreview.classList.add('has-photo');
    } else {
      photoPreview.style.backgroundImage = '';
      photoPreview.classList.remove('has-photo');
    }

    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
    editingId = null;
    pendingPhotoFile = null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    formError.style.display = 'none';

    const name = nameInput.value.trim();
    if (!name) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan…';

    try {
      const fields = {
        name,
        aliases: aliasesInput.value.trim() || null,
        role: roleInput.value || null,
        description: descriptionInput.value.trim() || null,
      };

      if (pendingPhotoFile) {
        fields.image_url = await StorageAPI.upload('characters', pendingPhotoFile);
      } else if (!editingId) {
        fields.image_url = null;
      }

      if (editingId) {
        await CharactersAPI.update(editingId, fields);
      } else {
        await CharactersAPI.create(projectId, fields);
      }

      clearOpenParam();
      closeModal();
      await loadCharacters();
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
    const ch = characters.find((c) => c.id === editingId);
    if (!ch) return;
    if (!confirm(`Hapus karakter "${ch.name}"? Link ke bab juga ikut kehapus.`)) return;
    try {
      await CharactersAPI.remove(editingId);
      clearOpenParam();
      closeModal();
      await loadCharacters();
    } catch (err) {
      alert('Gagal hapus: ' + err.message);
    }
  }

  function roleLabel(role) {
    return { mc: 'Protagonis', supporting: 'Pendukung', antagonist: 'Antagonis', other: 'Lainnya' }[role] || role;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

pageInit.register('characters', initCharactersPage);
