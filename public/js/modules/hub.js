// js/modules/hub.js
// Project Hub — list, create, delete novel.

function initHubPage() {
  const grid = document.getElementById('project-grid');
  const modal = document.getElementById('create-modal');
  const modalTitle = document.getElementById('project-modal-title');
  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('create-form');
  const submitBtn = document.getElementById('project-submit-btn');
  const formError = document.getElementById('create-error');
  const coverInput = document.getElementById('project-cover');
  const coverPreview = document.getElementById('cover-preview');

  const coverModal = document.getElementById('cover-modal');
  const coverModalClose = document.getElementById('cover-modal-close');
  const coverModalTitle = document.getElementById('cover-modal-title');
  const editCoverInput = document.getElementById('edit-cover-input');
  const editCoverPreview = document.getElementById('edit-cover-preview');
  const coverSaveBtn = document.getElementById('cover-save-btn');
  const coverRemoveBtn = document.getElementById('cover-remove-btn');
  const coverError = document.getElementById('cover-error');
  const sortSelect = document.getElementById('hub-sort');

  const SORT_STORAGE_KEY = 'inkpad-hub-sort';
  const STATUS_ORDER = { ongoing: 0, hiatus: 1, completed: 2 };

  let cachedProjects = [];
  let pendingCoverFile = null;
  let editingProjectId = null;
  let editingProject = null;
  let pendingEditCoverFile = null;
  let removeCoverOnSave = false;

  const savedSort = localStorage.getItem(SORT_STORAGE_KEY);
  if (savedSort && sortSelect.querySelector(`option[value="${savedSort}"]`)) {
    sortSelect.value = savedSort;
  }

  sortSelect.addEventListener('change', () => {
    localStorage.setItem(SORT_STORAGE_KEY, sortSelect.value);
    renderGrid(sortProjects(cachedProjects, sortSelect.value));
  });

  loadProjects();

  closeBtn.addEventListener('click', () => closeModal());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  coverModalClose.addEventListener('click', () => closeCoverModal());
  coverModal.addEventListener('click', (e) => {
    if (e.target === coverModal) closeCoverModal();
  });

  coverInput.addEventListener('change', () => {
    const file = coverInput.files[0];
    if (!file) return;
    pendingCoverFile = file;
    coverPreview.style.backgroundImage = `url('${URL.createObjectURL(file)}')`;
    coverPreview.classList.add('has-cover');
  });

  editCoverInput.addEventListener('change', () => {
    const file = editCoverInput.files[0];
    if (!file) return;
    pendingEditCoverFile = file;
    removeCoverOnSave = false;
    editCoverPreview.style.backgroundImage = `url('${URL.createObjectURL(file)}')`;
    editCoverPreview.classList.add('has-cover');
    coverSaveBtn.disabled = false;
    coverRemoveBtn.disabled = false;
  });

  coverRemoveBtn.addEventListener('click', () => {
    pendingEditCoverFile = null;
    removeCoverOnSave = true;
    editCoverInput.value = '';
    editCoverPreview.style.backgroundImage = '';
    editCoverPreview.classList.remove('has-cover');
    coverSaveBtn.disabled = false;
  });

  coverSaveBtn.addEventListener('click', async () => {
    if (!editingProject || coverSaveBtn.disabled) return;
    coverError.style.display = 'none';
    coverSaveBtn.disabled = true;
    coverSaveBtn.textContent = 'Menyimpan…';

    try {
      let cover_url = editingProject.cover_url;
      if (removeCoverOnSave) {
        cover_url = null;
      } else if (pendingEditCoverFile) {
        cover_url = await StorageAPI.upload('covers', pendingEditCoverFile);
      }
      await ProjectsAPI.update(editingProject.id, { cover_url });
      closeCoverModal();
      loadProjects();
    } catch (err) {
      coverError.textContent = err.message;
      coverError.style.display = 'block';
      coverSaveBtn.disabled = false;
    } finally {
      coverSaveBtn.textContent = 'Simpan';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.style.display = 'none';

    const title = document.getElementById('project-title').value.trim();
    const genre = document.getElementById('project-genre').value.trim();
    const status = document.getElementById('project-status').value;
    if (!title) return;

    const isEdit = Boolean(editingProjectId);
    submitBtn.disabled = true;
    submitBtn.textContent = isEdit ? 'Menyimpan…' : 'Membuat…';

    try {
      if (isEdit) {
        const fields = { title, genre: genre || null, status };
        if (pendingCoverFile) {
          fields.cover_url = await StorageAPI.upload('covers', pendingCoverFile);
        }
        await ProjectsAPI.update(editingProjectId, fields);
      } else {
        let cover_url = null;
        if (pendingCoverFile) {
          cover_url = await StorageAPI.upload('covers', pendingCoverFile);
        }
        await ProjectsAPI.create({ title, genre, status, cover_url });
      }
      closeModal();
      loadProjects();
    } catch (err) {
      formError.textContent = err.message;
      formError.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Simpan' : 'Buat';
    }
  });

  function openCreateModal() {
    editingProjectId = null;
    modalTitle.textContent = 'Novel baru';
    submitBtn.textContent = 'Buat';
    form.reset();
    pendingCoverFile = null;
    coverPreview.style.backgroundImage = '';
    coverPreview.classList.remove('has-cover');
    formError.style.display = 'none';
    modal.classList.add('open');
  }

  function openEditModal(project) {
    editingProjectId = project.id;
    modalTitle.textContent = 'Edit novel';
    submitBtn.textContent = 'Simpan';
    form.reset();
    pendingCoverFile = null;
    formError.style.display = 'none';

    document.getElementById('project-title').value = project.title;
    document.getElementById('project-genre').value = project.genre || '';
    document.getElementById('project-status').value = project.status || 'ongoing';

    if (project.cover_url) {
      coverPreview.style.backgroundImage = `url('${project.cover_url}')`;
      coverPreview.classList.add('has-cover');
    } else {
      coverPreview.style.backgroundImage = '';
      coverPreview.classList.remove('has-cover');
    }

    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
    editingProjectId = null;
    form.reset();
    pendingCoverFile = null;
    coverPreview.style.backgroundImage = '';
    coverPreview.classList.remove('has-cover');
    modalTitle.textContent = 'Novel baru';
    submitBtn.textContent = 'Buat';
    formError.style.display = 'none';
  }

  function openCoverModal(project) {
    editingProject = project;
    pendingEditCoverFile = null;
    removeCoverOnSave = false;
    coverError.style.display = 'none';
    editCoverInput.value = '';
    coverModalTitle.textContent = `Ubah cover — ${project.title}`;
    coverSaveBtn.disabled = true;
    coverRemoveBtn.disabled = !project.cover_url;

    if (project.cover_url) {
      editCoverPreview.style.backgroundImage = `url('${project.cover_url}')`;
      editCoverPreview.classList.add('has-cover');
    } else {
      editCoverPreview.style.backgroundImage = '';
      editCoverPreview.classList.remove('has-cover');
    }

    coverModal.classList.add('open');
  }

  function closeCoverModal() {
    coverModal.classList.remove('open');
    editingProject = null;
    pendingEditCoverFile = null;
    removeCoverOnSave = false;
    editCoverInput.value = '';
    editCoverPreview.style.backgroundImage = '';
    editCoverPreview.classList.remove('has-cover');
    coverSaveBtn.disabled = true;
    coverRemoveBtn.disabled = true;
    coverError.style.display = 'none';
  }

  async function loadProjects() {
    grid.innerHTML = '<p class="muted">Memuat…</p>';
    try {
      cachedProjects = await ProjectsAPI.list();
      renderGrid(sortProjects(cachedProjects, sortSelect.value));
    } catch (err) {
      grid.innerHTML = `<p class="muted">Gagal memuat: ${err.message}</p>`;
    }
  }

  function sortProjects(projects, sortKey) {
    const sorted = [...projects];
    const byTitle = (a, b) => a.title.localeCompare(b.title, 'id', { sensitivity: 'base' });
    const byDate = (field, asc) => (a, b) => {
      const diff = new Date(a[field]).getTime() - new Date(b[field]).getTime();
      return asc ? diff : -diff;
    };
    const byGenre = (asc) => (a, b) => {
      const ga = a.genre || '';
      const gb = b.genre || '';
      if (!ga && !gb) return byTitle(a, b);
      if (!ga) return 1;
      if (!gb) return -1;
      const diff = ga.localeCompare(gb, 'id', { sensitivity: 'base' });
      if (diff === 0) return byTitle(a, b);
      return asc ? diff : -diff;
    };

    switch (sortKey) {
      case 'title_asc':
        return sorted.sort(byTitle);
      case 'title_desc':
        return sorted.sort((a, b) => byTitle(b, a));
      case 'genre_asc':
        return sorted.sort(byGenre(true));
      case 'genre_desc':
        return sorted.sort(byGenre(false));
      case 'status_asc':
        return sorted.sort((a, b) => {
          const diff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
          return diff || byTitle(a, b);
        });
      case 'created_asc':
        return sorted.sort(byDate('created_at', true));
      case 'created_desc':
        return sorted.sort(byDate('created_at', false));
      case 'updated_desc':
      default:
        return sorted.sort(byDate('updated_at', false));
    }
  }

  function renderGrid(projects) {
    grid.innerHTML = '';
    grid.appendChild(buildNewCard());

    if (projects.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'muted empty-state';
      empty.textContent = 'Belum ada novel. Mulai yang pertama lewat kartu di atas.';
      grid.appendChild(empty);
      return;
    }

    projects.forEach((p) => grid.appendChild(buildProjectCard(p)));
  }

  function buildNewCard() {
    const card = document.createElement('div');
    card.className = 'project-card new-card';
    card.innerHTML = '<i class="ti ti-plus" aria-hidden="true"></i><span>Novel baru</span>';
    card.addEventListener('click', () => openCreateModal());
    return card;
  }

  function buildProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    const coverStyle = project.cover_url ? `background-image: url('${project.cover_url}')` : '';

    card.innerHTML = `
      <div class="cover ${project.cover_url ? '' : 'cover-placeholder'}" style="${coverStyle}">
        ${project.cover_url ? '' : '<i class="ti ti-book-2" aria-hidden="true"></i>'}
      </div>
      <div class="project-meta">
        <p class="project-title">${escapeHtml(project.title)}</p>
        <div class="project-tags">
          <span class="badge status-${project.status}">${statusLabel(project.status)}</span>
          ${project.genre ? `<span class="badge">${escapeHtml(project.genre)}</span>` : ''}
        </div>
      </div>
      <button class="cover-edit-btn" title="Ubah cover" type="button"><i class="ti ti-photo" aria-hidden="true"></i></button>
      <button class="edit-btn" title="Edit detail" type="button"><i class="ti ti-pencil" aria-hidden="true"></i></button>
      <button class="delete-btn" title="Hapus novel" type="button"><i class="ti ti-trash" aria-hidden="true"></i></button>
    `;

    card.querySelector('.cover-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openCoverModal(project);
    });

    card.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(project);
    });

    card.querySelector('.delete-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`Hapus "${project.title}"? Semua bab di dalamnya ikut terhapus.`)) return;
      try {
        await ProjectsAPI.remove(project.id);
        loadProjects();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    });

    card.addEventListener('click', () => {
      window.InkpadProject.setActiveProjectId(project.id);
      window.location.href = `/manuscript?project=${project.id}`;
    });

    return card;
  }

  function statusLabel(status) {
    return { ongoing: 'Ongoing', hiatus: 'Hiatus', completed: 'Selesai' }[status] || status;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

pageInit.register('hub', initHubPage);
