/**
 * ForeshadowModal Component
 * Modal for creating/editing foreshadow entries
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Select, Textarea } from '@/components/ui';
import type { Foreshadow, ForeshadowFormData } from '@/types/plot';
import type { Chapter } from '@/types/chapter';

interface ForeshadowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ForeshadowFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  editingForeshadow: Foreshadow | null;
  chapters: Chapter[];
}

export function ForeshadowModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingForeshadow,
  chapters,
}: ForeshadowModalProps) {
  const [note, setNote] = useState('');
  const [plantedChapterId, setPlantedChapterId] = useState<string>('');
  const [payoffChapterId, setPayoffChapterId] = useState<string>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when modal opens or editing foreshadow changes
  useEffect(() => {
    if (isOpen) {
      if (editingForeshadow) {
        setNote(editingForeshadow.note);
        setPlantedChapterId(editingForeshadow.planted_chapter_id || '');
        setPayoffChapterId(editingForeshadow.payoff_chapter_id || '');
      } else {
        // Reset for new foreshadow
        setNote('');
        setPlantedChapterId('');
        setPayoffChapterId('');
      }
      setError('');
    }
  }, [isOpen, editingForeshadow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!note.trim()) {
      setError('Isi foreshadow harus diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        note: note.trim(),
        planted_chapter_id: plantedChapterId || null,
        payoff_chapter_id: payoffChapterId || null,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !editingForeshadow) return;
    
    if (!confirm('Hapus entri foreshadow ini?')) return;

    setIsSubmitting(true);
    try {
      await onDelete();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingForeshadow ? 'Edit foreshadow' : 'Foreshadow baru'}
    >
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="f-note">Apa yang ditanam</label>
          <Textarea
            id="f-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Contoh: Mahkota yang retak di meja Amelia"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="field">
          <label htmlFor="f-planted">Ditanam di bab</label>
          <Select
            id="f-planted"
            value={plantedChapterId}
            onChange={(e) => setPlantedChapterId(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">— Belum dipilih —</option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title || 'Tanpa judul'}
              </option>
            ))}
          </Select>
        </div>

        <div className="field">
          <label htmlFor="f-payoff">Dibayar di bab (opsional)</label>
          <Select
            id="f-payoff"
            value={payoffChapterId}
            onChange={(e) => setPayoffChapterId(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">— Belum dibayar —</option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title || 'Tanpa judul'}
              </option>
            ))}
          </Select>
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: 'var(--danger)', marginBottom: '12px' }}>
            {error}
          </p>
        )}

        <div className="modal-actions">
          {editingForeshadow && onDelete && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Hapus
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
