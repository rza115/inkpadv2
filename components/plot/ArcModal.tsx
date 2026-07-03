/**
 * ArcModal Component
 * Modal for creating/editing arcs
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import type { Arc, ArcFormData, ArcStatus } from '@/types/plot';
import type { Chapter } from '@/types/chapter';

interface ArcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ArcFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  editingArc: Arc | null;
  chapters: Chapter[];
}

export function ArcModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingArc,
  chapters,
}: ArcModalProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<ArcStatus>('planning');
  const [summary, setSummary] = useState('');
  const [chapterStartId, setChapterStartId] = useState<string>('');
  const [chapterEndId, setChapterEndId] = useState<string>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when modal opens or editing arc changes
  useEffect(() => {
    if (isOpen) {
      if (editingArc) {
        setTitle(editingArc.title);
        setStatus(editingArc.status);
        setSummary(editingArc.summary || '');
        setChapterStartId(editingArc.chapter_start_id || '');
        setChapterEndId(editingArc.chapter_end_id || '');
      } else {
        // Reset for new arc
        setTitle('');
        setStatus('planning');
        setSummary('');
        setChapterStartId('');
        setChapterEndId('');
      }
      setError('');
    }
  }, [isOpen, editingArc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Judul arc harus diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        status,
        summary: summary.trim() || null,
        chapter_start_id: chapterStartId || null,
        chapter_end_id: chapterEndId || null,
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
    if (!onDelete || !editingArc) return;
    
    if (!confirm('Hapus arc ini?')) return;

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
      title={editingArc ? 'Edit arc' : 'Arc baru'}
    >
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="arc-title">Judul arc</label>
          <Input
            id="arc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="field">
          <label htmlFor="arc-status">Status</label>
          <Select
            id="arc-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ArcStatus)}
            disabled={isSubmitting}
          >
            <option value="planning">Planning</option>
            <option value="ongoing">Ongoing</option>
            <option value="complete">Selesai</option>
          </Select>
        </div>

        <div className="field">
          <label htmlFor="arc-start">Mulai dari bab</label>
          <Select
            id="arc-start"
            value={chapterStartId}
            onChange={(e) => setChapterStartId(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">— Belum ditentukan —</option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title || 'Tanpa judul'}
              </option>
            ))}
          </Select>
        </div>

        <div className="field">
          <label htmlFor="arc-end">Sampai bab</label>
          <Select
            id="arc-end"
            value={chapterEndId}
            onChange={(e) => setChapterEndId(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">— Belum ditentukan —</option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title || 'Tanpa judul'}
              </option>
            ))}
          </Select>
        </div>

        <div className="field">
          <label htmlFor="arc-summary">Ringkasan</label>
          <Textarea
            id="arc-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="Apa yang terjadi di arc ini…"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: 'var(--danger)', marginBottom: '12px' }}>
            {error}
          </p>
        )}

        <div className="modal-actions">
          {editingArc && onDelete && (
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
