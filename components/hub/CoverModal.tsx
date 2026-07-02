/**
 * CoverModal Component
 * Modal for editing project cover separately
 */
'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import type { Project } from '@/types/project';
import { StorageAPI } from '@/lib/storage';

interface CoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (covUrl: string | null) => Promise<void>;
  project: Project | null;
}

export function CoverModal({ isOpen, onClose, onSave, project }: CoverModalProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [removeCover, setRemoveCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset when modal opens or project changes
  useEffect(() => {
    if (isOpen && project) {
      setCoverFile(null);
      setCoverPreview(project.cover_url || '');
      setRemoveCover(false);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, project]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setRemoveCover(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    setRemoveCover(true);
  };

  const handleSave = async () => {
    if (!project) return;
    
    setError('');
    setIsSubmitting(true);

    try {
      let cover_url: string | null = project.cover_url;

      if (removeCover) {
        cover_url = null;
      } else if (coverFile) {
        cover_url = await StorageAPI.upload('covers', coverFile);
      }

      await onSave(cover_url);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = coverFile !== null || removeCover;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ubah cover — ${project?.title || ''}`}
    >
      <p className="cover-modal-hint">Pilih gambar baru untuk cover novel.</p>

      {/* Cover Upload */}
      <div className="cover-upload-row">
        <label
          className={`cover-preview ${coverPreview ? 'has-cover' : ''}`}
          htmlFor="edit-cover-input"
          style={coverPreview ? { backgroundImage: `url('${coverPreview}')` } : undefined}
        >
          <i className="ti ti-photo-plus" aria-hidden="true"></i>
          <span>Pilih gambar</span>
        </label>
        <input
          type="file"
          id="edit-cover-input"
          accept="image/*"
          onChange={handleCoverChange}
          hidden
          disabled={isSubmitting}
        />
      </div>

      {/* Remove Cover Button */}
      <button
        type="button"
        className="cover-remove-btn"
        onClick={handleRemoveCover}
        disabled={!project?.cover_url && !coverFile}
      >
        Hapus cover
      </button>

      {/* Error Message */}
      {error && (
        <p 
          className="error" 
          style={{ display: 'block', color: 'var(--danger)', fontSize: 13, marginTop: 12 }}
        >
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
          type="button"
          className="primary"
          onClick={handleSave}
          disabled={!hasChanges || isSubmitting}
        >
          {isSubmitting ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </Modal>
  );
}
