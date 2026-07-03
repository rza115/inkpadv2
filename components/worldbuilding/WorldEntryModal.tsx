/**
 * WorldEntryModal Component
 * Modal for creating/editing worldbuilding entries with cross-link preview
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import type { WorldEntry } from '@/types/worldbuilding';
import type { Character } from '@/types/character';
import { renderCrossLinks, type CrossLinkResolver } from '@/lib/crosslink';
import { DEFAULT_CATEGORIES } from '@/types/worldbuilding';

interface WorldEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: WorldEntry | null;
  entries: WorldEntry[];
  characters: Character[];
  projectId: string;
  onSave: (data: {
    title: string;
    category: string;
    content: string | null;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onOpenEntry?: (entry: WorldEntry) => void;
}

export function WorldEntryModal({
  isOpen,
  onClose,
  entry,
  entries,
  characters,
  projectId,
  onSave,
  onDelete,
  onOpenEntry,
}: WorldEntryModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Get unique categories from existing entries
  const existingCategories = Array.from(new Set(entries.map(e => e.category).filter(Boolean)));
  const allCategories = Array.from(new Set([...existingCategories, ...DEFAULT_CATEGORIES])).sort();

  // Initialize form when modal opens or entry changes
  useEffect(() => {
    if (isOpen) {
      setTitle(entry?.title || '');
      setCategory(entry?.category || '');
      setContent(entry?.content || '');
      setError('');
      updatePreview(entry?.content || '', entry?.title || '');
    }
  }, [isOpen, entry]);

  // Build resolver for cross-links
  const buildResolver = (currentTitle: string): CrossLinkResolver => {
    return (name: string) => {
      const lname = name.toLowerCase();
      
      // Check characters (by name or aliases)
      const char = characters.find((c) => {
        if (c.name.toLowerCase() === lname) return true;
        if (!c.aliases) return false;
        const aliases = c.aliases.split(/[,，]/).map(a => a.trim().toLowerCase());
        return aliases.includes(lname);
      });
      if (char) return { type: 'character', id: char.id };
      
      // Check world entries (excluding current entry being edited)
      const world = entries.find((e) => 
        e.title.toLowerCase() === lname && 
        e.title !== currentTitle
      );
      if (world) return { type: 'world', id: world.id };
      
      return null;
    };
  };

  const updatePreview = (text: string, currentTitle: string) => {
    if (!text.trim()) {
      setPreview('<span style="opacity:.5">Preview cross-link muncul di sini saat ada [[Nama]].</span>');
      return;
    }
    const resolver = buildResolver(currentTitle);
    setPreview(renderCrossLinks(text, resolver));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    updatePreview(newContent, title);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updatePreview(content, newTitle);
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest('.xlink-link') as HTMLElement;
    if (!link) return;

    const type = link.dataset.type;
    const id = link.dataset.id;

    if (type === 'character' && id) {
      onClose();
      router.push(`/characters?project=${projectId}&open=${id}`);
    } else if (type === 'world' && id) {
      const linkedEntry = entries.find((e) => e.id === id);
      if (linkedEntry && onOpenEntry) {
        onClose();
        onOpenEntry(linkedEntry);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Judul entry tidak boleh kosong');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        category: category.trim() || 'Lainnya',
        content: content.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message || 'Gagal menyimpan entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm(`Hapus "${entry?.title}"? Link ke bab juga ikut kehapus.`)) return;

    setIsSaving(true);
    try {
      await onDelete();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message || 'Gagal menghapus entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={entry ? 'Edit entry' : 'Entry baru'}
    >
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="field">
          <label htmlFor="entry-title">Judul *</label>
          <Input
            id="entry-title"
            value={title}
            onChange={handleTitleChange}
            placeholder="Nama lokasi, sistem, atau konsep"
            required
            autoFocus
          />
        </div>

        {/* Category */}
        <div className="field">
          <label htmlFor="entry-category">Kategori</label>
          <Input
            id="entry-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Lokasi, Sistem Power, Sejarah, dll"
            list="category-suggestions"
          />
          <datalist id="category-suggestions">
            {allCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        {/* Content */}
        <div className="field">
          <label htmlFor="entry-content">Konten</label>
          <Textarea
            id="entry-content"
            value={content}
            onChange={handleContentChange}
            rows={6}
            placeholder="Detail entry… Gunakan [[Nama]] untuk link ke karakter atau entry lain."
          />
        </div>

        {/* Cross-link Preview */}
        <div className="field">
          <label>Preview cross-link</label>
          <div 
            id="xlink-preview"
            className="xlink-preview"
            dangerouslySetInnerHTML={{ __html: preview }}
            onClick={handlePreviewClick}
            style={{ 
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              minHeight: '60px',
              cursor: 'pointer',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
          />
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '8px' }}>
            {error}
          </p>
        )}

        <div className="modal-actions">
          {entry && onDelete && (
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