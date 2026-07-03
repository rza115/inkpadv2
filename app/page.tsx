"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProjectStore } from "@/store/useProjectStore";
import { Nav } from "@/components/Nav";
import { Loading } from "@/components/ui";
import { ProjectCard, NewProjectCard } from "@/components/hub/ProjectCard";
import { ProjectModal, type ProjectFormData } from "@/components/hub/ProjectModal";
import { CoverModal } from "@/components/hub/CoverModal";
import type { Project, SortKey } from "@/types/project";

export default function HubPage() {
  const { isLoading: authLoading } = useAuth();
  const { 
    projects, 
    isLoading: projectsLoading, 
    fetchProjects, 
    createProject, 
    updateProject, 
    deleteProject,
    currentSort,
    setSort,
    getSortedProjects 
  } = useProjectStore();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [coverEditProject, setCoverEditProject] = useState<Project | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handlers
  const handleNewProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleEditCover = (project: Project) => {
    setCoverEditProject(project);
    setIsCoverModalOpen(true);
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProject(project.id);
    } catch (error: any) {
      alert('Gagal menghapus: ' + error.message);
    }
  };

  const handleSaveProject = async (data: ProjectFormData) => {
    // Ensure cover_url is string | null (not undefined)
    const projectData = {
      ...data,
      cover_url: data.cover_url ?? null
    };
    
    if (editingProject) {
      await updateProject(editingProject.id, projectData);
    } else {
      await createProject(projectData);
    }
  };

  const handleSaveCover = async (cover_url: string | null) => {
    if (coverEditProject) {
      await updateProject(coverEditProject.id, { cover_url });
      await fetchProjects(); // Refresh to show updated cover
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as SortKey);
  };

  const sortedProjects = getSortedProjects();

  // Show loading while authenticating
  if (authLoading) {
    return (
      <Nav layout="hub" title="Inkpad">
        <main id="page-main">
          <Loading message="Memuat…" />
        </main>
      </Nav>
    );
  }

  return (
    <>
      <Nav layout="hub" title="Inkpad">
        <main id="page-main">
        <div className="hub-shell">
          {/* Toolbar with Sort */}
          <div className="hub-toolbar">
            <label htmlFor="hub-sort">Urutkan</label>
            <select 
              id="hub-sort" 
              className="hub-sort-select"
              value={currentSort}
              onChange={handleSortChange}
            >
              <option value="updated_desc">Terbaru diubah</option>
              <option value="title_asc">Judul (A–Z)</option>
              <option value="title_desc">Judul (Z–A)</option>
              <option value="genre_asc">Genre (A–Z)</option>
              <option value="genre_desc">Genre (Z–A)</option>
              <option value="status_asc">Status</option>
              <option value="created_desc">Terbaru dibuat</option>
              <option value="created_asc">Terlama dibuat</option>
            </select>
          </div>

          {/* Project Grid */}
          <div className="hub-grid">
            <NewProjectCard onClick={handleNewProject} />
            
            {projectsLoading && projects.length === 0 && (
              <p className="muted">Memuat…</p>
            )}
            
            {!projectsLoading && sortedProjects.length === 0 && (
              <p className="muted empty-state">
                Belum ada novel. Mulai yang pertama lewat kartu di atas.
              </p>
            )}
            
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onEditCover={handleEditCover}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        </div>
      </main>
      </Nav>

      {/* Project Create/Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        editingProject={editingProject}
      />

      {/* Cover Edit Modal */}
      <CoverModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onSave={handleSaveCover}
        project={coverEditProject}
      />
    </>
  );
}
