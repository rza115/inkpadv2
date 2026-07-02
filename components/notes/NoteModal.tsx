/**
 * NoteModal Component
 * Modal for creating/editing notes with assignment to chapters, characters, or world entries
 */
'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Textarea, Select } from '@/components/ui';
import type { Note } from '@/types/note';

interface ChapterOption {
  id: string;
  title: string;
}

interface Character {
  id: string;
  name: string;
}

interface WorldEntry {
  id: string;
  title: string;
}

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  chapters: ChapterOption[];
  characters: Character[];
  worldEntries: WorldEntry[];
  onSave: (data: {
    content: string;
    assigned_chapter_id: string | null;
    assigned_character_id: string | null;
    assigned_world_id: string | null;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function NoteModal({
  isOpen,
  onClose,
  note,
  chapters,
  characters,
  worldEntries,
  onSave,
  onDelete,
}: NoteModalProps) {
  const [content, setContent] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [characterId, setCharacterId] = useState('');
  const [worldId, setWorldId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize form when modal opens or note changes
  useEffect(() => {
    if (isOpen) {
      setContent(note?.content || '');
      setChapterId(note?.assigned_chapter_id || '');
      setCharacterId(note?.assigned_character_id || '');
      setWorldId(note?.assigned_world_id || '');
      setError('');
    }
  }, [isOpen, note]);

  // Handle assignment selection (only one at a time)
  const handleChapterChange = (value: string) => {
    setChapterId(value);
    if (value) {
      setCharacterId('');
      setWorldId('');
    }
  };

  const handleCharacterChange = (value: string) => {
    setCharacterId(value);
    if (value) {
      setChapterId('');
      setWorldId('');
    }
  };

  const handleWorldChange = (value: string) => {
    setWorldId(value);
    if (value) {
      setChapterId('');
      setCharacterId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Konten catatan tidak boleh kosong');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        content: content.trim(),
        assigned_chapter_id: chapterId || null,
        assigned_character_id: characterId || null,
        assigned_world_id: worldId || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan catatan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Hapus catatan ini?')) return;

    setIsSaving(true);
    try {
      await onDelete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus catatan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={note ? 'Edit catatan' : 'Catatan baru'}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="note-content">Isi catatan</label>
          <Textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Tulis ide, reminders, atau apapun…"
            required
            autoFocus
          />
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Assign ke (opsional, pilih salah satu)
        </p>

        <div className="assign-row">
          <div className="field">
            <label htmlFor="note-chapter">Bab</label>
            <Select
              id="note-chapter"
              value={chapterId}
              onChange={(e) => handleChapterChange(e.target.value)}
            >
              <option value="">—</option>
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.title || 'Tanpa judul'}
                </option>
              ))}
            </Select>
          </div>

          <div className="field">
            <label htmlFor="note-character">Karakter</label>
            <Select
              id="note-character"
              value={characterId}
              onChange={(e) => handleCharacterChange(e.target.value)}
            >
              <option value="">—</option>
              {characters.map((chr) => (
                <option key={chr.id} value={chr.id}>
                  {chr.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="field" style={{ marginTop: '8px' }}>
          <label htmlFor="note-world">World entry</label>
          <Select
            id="note-world"
            value={worldId}
            onChange={(e) => handleWorldChange(e.target.value)}
          >
            <option value="">—</option>
            {worldEntries.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </Select>
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '8px' }}>
            {error}
          </p>
        )}

        <div className="modal-actions">
          {note && onDelete && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={isSaving}
            >
              Hapus
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}