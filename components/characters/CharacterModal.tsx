/**
 * CharacterModal Component
 * Modal for creating/editing characters with photo upload
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/ui';
import type { Character, CharacterRole } from '@/types/character';
import { ROLE_LABELS } from '@/types/character';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  onSave: (data: {
    name: string;
    aliases: string | null;
    role: CharacterRole | null;
    description: string | null;
  }, photoFile?: File) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function CharacterModal({
  isOpen,
  onClose,
  character,
  onSave,
  onDelete,
}: CharacterModalProps) {
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [role, setRole] = useState<CharacterRole | ''>('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when modal opens or character changes
  useEffect(() => {
    if (isOpen) {
      setName(character?.name || '');
      setAliases(character?.aliases || '');
      setRole((character?.role as CharacterRole) || '');
      setDescription(character?.description || '');
      setPhotoFile(null);
      setPhotoPreview(character?.image_url || '');
      setError('');
    }
  }, [isOpen, character]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama karakter tidak boleh kosong');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          aliases: aliases.trim() || null,
          role: role || null,
          description: description.trim() || null,
        },
        photoFile || undefined
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan karakter');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm(`Hapus karakter "${character?.name}"? Link ke bab juga ikut kehapus.`)) return;

    setIsSaving(true);
    try {
      await onDelete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus karakter');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={character ? 'Edit karakter' : 'Karakter baru'}
    >
      <form onSubmit={handleSubmit}>
        {/* Photo Upload */}
        <div className="field">
          <label>Foto karakter</label>
          <div 
            className={`photo-preview ${photoPreview ? 'has-photo' : ''}`}
            style={photoPreview ? { backgroundImage: `url('${photoPreview}')` } : undefined}
            onClick={() => photoInputRef.current?.click()}
          >
            {!photoPreview && <i className="ti ti-camera" aria-hidden="true"></i>}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Klik untuk upload foto
          </p>
        </div>

        {/* Name */}
        <div className="field">
          <label htmlFor="character-name">Nama *</label>
          <Input
            id="character-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama karakter"
            required
            autoFocus
          />
        </div>

        {/* Aliases */}
        <div className="field">
          <label htmlFor="character-aliases">Alias / julukan</label>
          <Input
            id="character-aliases"
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            placeholder="Contoh: Si Pemberani, The Dark Knight"
          />
        </div>

        {/* Role */}
        <div className="field">
          <label htmlFor="character-role">Peran</label>
          <Select
            id="character-role"
            value={role}
            onChange={(e) => setRole(e.target.value as CharacterRole | '')}
          >
            <option value="">Pilih peran</option>
            <option value="mc">Protagonis</option>
            <option value="supporting">Pendukung</option>
            <option value="antagonist">Antagonis</option>
            <option value="other">Lainnya</option>
          </Select>
        </div>

        {/* Description */}
        <div className="field">
          <label htmlFor="character-description">Deskripsi</label>
          <Textarea
            id="character-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Kepribadian, penampilan, background…"
          />
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '8px' }}>
            {error}
          </p>
        )}

        <div className="modal-actions">
          {character && onDelete && (
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