/**
 * ProjectModal Component
 * Modal for creating/editing projects
 */
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Modal } from '@/components/ui';
import type { Project } from '@/types/project';
import { StorageAPI } from '@/lib/storage';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectFormData) => Promise<void>;
  editingProject?: Project | null;
}

export interface ProjectFormData {
  title: string;
  genre: string;
  status: 'ongoing' | 'hiatus' | 'completed';
  cover_url?: string | null;
}

export function ProjectModal({ isOpen, onClose, onSave, editingProject }: ProjectModalProps) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState<'ongoing' | 'hiatus' | 'completed'>('ongoing');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = Boolean(editingProject);

  // Reset form when modal opens/closes or editing project changes
  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        setTitle(editingProject.title);
        setGenre(editingProject.genre || '');
        setStatus(editingProject.status);
        setCoverPreview(editingProject.cover_url || '');
      } else {
        setTitle('');
        setGenre('');
        setStatus('ongoing');
        setCoverPreview('');
      }
      setCoverFile(null);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, editingProject]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let cover_url = editingProject?.cover_url || null;
      
      // Upload new cover if selected
      if (coverFile) {
        cover_url = await StorageAPI.upload('covers', coverFile);
      }

      await onSave({
        title: title.trim(),
        genre: genre.trim(),
        status,
        cover_url
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit novel' : 'Novel baru'}
    >
      <form onSubmit={handleSubmit}>
        {/* Cover Upload */}
        <div className="cover-upload-row">
          <label
            className={`cover-preview ${coverPreview ? 'has-cover' : ''}`}
            htmlFor="project-cover"
            style={coverPreview ? { backgroundImage: `url('${coverPreview}')` } : undefined}
          >
            <i className="ti ti-photo-plus" aria-hidden="true"></i>
            <span>Cover (opsional)</span>
          </label>
          <input
            type="file"
            id="project-cover"
            accept="image/*"
            onChange={handleCoverChange}
            hidden
            disabled={isSubmitting}
          />
        </div>

        {/* Title */}
        <div className="field">
          <label htmlFor="project-title">Judul</label>
          <input
            type="text"
            id="project-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Genre */}
        <div className="field">
          <label htmlFor="project-genre">Genre (opsional)</label>
          <input
            type="text"
            id="project-genre"
            placeholder="Fantasi, Romance, dst"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Status */}
        <div className="field">
          <label htmlFor="project-status">Status</label>
          <select
            id="project-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            disabled={isSubmitting}
          >
            <option value="ongoing">Ongoing</option>
            <option value="hiatus">Hiatus</option>
            <option value="completed">Selesai</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <p className="error" style={{ display: 'block', color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan…' : isEditMode ? 'Simpan' : 'Buat'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
