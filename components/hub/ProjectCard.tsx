/**
 * ProjectCard Component
 * Displays a single project card with actions
 */
'use client';

import type { Project } from '@/types/project';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onEditCover: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onEditCover, onDelete }: ProjectCardProps) {
  const router = useRouter();

  const handleClick = () => {
    // Store project ID and navigate to manuscript
    if (typeof window !== 'undefined') {
      localStorage.setItem('active-project-id', project.id);
    }
    router.push(`/manuscript?project=${project.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(project);
  };

  const handleEditCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditCover(project);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmed = confirm(
      `Hapus "${project.title}"? Semua bab di dalamnya ikut terhapus.`
    );
    
    if (confirmed) {
      onDelete(project);
    }
  };

  const statusLabel = {
    ongoing: 'Ongoing',
    hiatus: 'Hiatus',
    completed: 'Selesai'
  }[project.status] || project.status;

  return (
    <div className="project-card" onClick={handleClick}>
      {/* Cover */}
      <div
        className={`cover ${project.cover_url ? '' : 'cover-placeholder'}`}
        style={project.cover_url ? { backgroundImage: `url('${project.cover_url}')` } : undefined}
      >
        {!project.cover_url && <i className="ti ti-book-2" aria-hidden="true"></i>}
      </div>

      {/* Meta */}
      <div className="project-meta">
        <p className="project-title">{project.title}</p>
        <div className="project-tags">
          <span className={`badge status-${project.status}`}>{statusLabel}</span>
          {project.genre && <span className="badge">{project.genre}</span>}
        </div>
      </div>

      {/* Actions */}
      <button
        className="cover-edit-btn"
        title="Ubah cover"
        type="button"
        onClick={handleEditCover}
      >
        <i className="ti ti-photo" aria-hidden="true"></i>
      </button>
      
      <button
        className="edit-btn"
        title="Edit detail"
        type="button"
        onClick={handleEdit}
      >
        <i className="ti ti-pencil" aria-hidden="true"></i>
      </button>
      
      <button
        className="delete-btn"
        title="Hapus novel"
        type="button"
        onClick={handleDelete}
      >
        <i className="ti ti-trash" aria-hidden="true"></i>
      </button>
    </div>
  );
}

export function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="project-card new-card" onClick={onClick}>
      <i className="ti ti-plus" aria-hidden="true"></i>
      <span>Novel baru</span>
    </div>
  );
}
