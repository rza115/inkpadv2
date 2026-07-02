// js/core/project-context.js
// Helper buat nyimpen & ambil project_id yang lagi aktif.
// Prioritas: query param ?project=... (kalau ada, update sessionStorage),
// fallback ke sessionStorage — biar context kebawa pas pindah antar halaman project
// tanpa harus selalu nempel di query param.

(function () {
  const STORAGE_KEY = 'inkpad:activeProject';

  function getActiveProjectId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('project');
    if (fromQuery) {
      sessionStorage.setItem(STORAGE_KEY, fromQuery);
      return fromQuery;
    }
    return sessionStorage.getItem(STORAGE_KEY);
  }

  function setActiveProjectId(id) {
    sessionStorage.setItem(STORAGE_KEY, id);
  }

  window.InkpadProject = { getActiveProjectId, setActiveProjectId };
})();
