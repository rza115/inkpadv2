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
    <div 
      className="group relative bg-surface border border-default rounded-[var(--radius-lg)] overflow-hidden cursor-pointer flex flex-col transition-colors hover:border-accent"
      onClick={handleClick}
    >
      {/* Cover */}
      <div
        className="aspect-[2/3] bg-surface-raised bg-cover bg-center flex items-center justify-center text-muted text-[28px]"
        style={project.cover_url ? { backgroundImage: `url('${project.cover_url}')` } : undefined}
      >
        {!project.cover_url && <i className="ti ti-book-2" aria-hidden="true"></i>}
      </div>

      {/* Meta */}
      <div className="p-2.5 px-3">
        <p className="font-serif text-sm font-semibold mb-1.5 line-clamp-2">
          {project.title}
        </p>
        <div className="flex gap-1.5 flex-wrap">
          <span className={`text-[11px] px-2 py-0.5 rounded-full bg-surface-raised ${
            project.status === 'ongoing' ? 'text-accent' : 'text-muted'
          }`}>
            {statusLabel}
          </span>
          {project.genre && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-raised text-muted">
              {project.genre}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <button
        className="absolute top-2 left-2 w-[26px] h-[26px] rounded-full bg-[rgba(27,26,23,0.6)] text-primary flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[rgba(27,26,23,0.85)] hover:text-accent"
        title="Ubah cover"
        type="button"
        onClick={handleEditCover}
      >
        <i className="ti ti-photo" aria-hidden="true"></i>
      </button>
      
      <button
        className="absolute top-2 left-10 w-[26px] h-[26px] rounded-full bg-[rgba(27,26,23,0.6)] text-primary flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[rgba(27,26,23,0.85)] hover:text-accent"
        title="Edit detail"
        type="button"
        onClick={handleEdit}
      >
        <i className="ti ti-pencil" aria-hidden="true"></i>
      </button>
      
      <button
        className="absolute top-2 right-2 w-[26px] h-[26px] rounded-full bg-[rgba(27,26,23,0.6)] text-primary flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[rgba(27,26,23,0.85)] hover:text-accent"
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
    <div 
      className="bg-surface border border-dashed border-default rounded-[var(--radius-lg)] cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[240px] text-muted text-sm transition-colors hover:border-accent"
      onClick={onClick}
    >
      <i className="ti ti-plus text-[22px]" aria-hidden="true"></i>
      <span>Novel baru</span>
    </div>
  );
}
