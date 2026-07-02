/**
 * ContextPanel Component
 * Right sidebar showing linked characters, world entries, illustrations, and notes
 */
'use client';

import { useState, useRef } from 'react';
import { useChapterStore } from '@/store/useChapterStore';
import { useRouter } from 'next/navigation';

interface ContextPanelProps {
  projectId: string;
}

export function ContextPanel({ projectId }: ContextPanelProps) {
  const router = useRouter();
  const {
    activeChapter,
    allCharacters,
    linkedCharacters,
    allWorldEntries,
    linkedWorldEntries,
    illustrations,
    notes,
    linkCharacter,
    unlinkCharacter,
    linkWorldEntry,
    unlinkWorldEntry,
    uploadIllustration,
    deleteIllustration,
    updateIllustrationCaption,
    createNote,
    deleteNote,
  } = useChapterStore();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [worldPickerOpen, setWorldPickerOpen] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const illusInputRef = useRef<HTMLInputElement>(null);

  if (!activeChapter) return null;

  const linkedCharIds = new Set(linkedCharacters.map(c => c.id));
  const availableChars = allCharacters.filter(c => !linkedCharIds.has(c.id));

  const linkedWorldIds = new Set(linkedWorldEntries.map(e => e.id));
  const availableWorlds = allWorldEntries.filter(e => !linkedWorldIds.has(e.id));

  const handleLinkCharacter = async (characterId: string) => {
    try {
      await linkCharacter(activeChapter.id, characterId);
      setPickerOpen(false);
    } catch (err: any) {
      alert('Gagal nambah karakter: ' + err.message);
    }
  };

  const handleUnlinkCharacter = async (characterId: string) => {
    try {
      await unlinkCharacter(activeChapter.id, characterId);
    } catch (err: any) {
      alert('Gagal lepas karakter: ' + err.message);
    }
  };

  const handleLinkWorld = async (entryId: string) => {
    try {
      await linkWorldEntry(activeChapter.id, entryId);
      setWorldPickerOpen(false);
    } catch (err: any) {
      alert('Gagal nambah entry: ' + err.message);
    }
  };

  const handleUnlinkWorld = async (entryId: string) => {
    try {
      await unlinkWorldEntry(activeChapter.id, entryId);
    } catch (err: any) {
      alert('Gagal lepas entry: ' + err.message);
    }
  };

  const handleIllusUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChapter) return;
    setUploading(true);
    try {
      await uploadIllustration(activeChapter.id, file);
    } catch (err: any) {
      alert('Gagal upload: ' + err.message);
    } finally {
      setUploading(false);
      if (illusInputRef.current) illusInputRef.current.value = '';
    }
  };

  const handleDeleteIllus = async (id: string) => {
    if (!confirm('Hapus ilustrasi ini?')) return;
    try {
      await deleteIllustration(id);
    } catch (err: any) {
      alert('Gagal hapus: ' + err.message);
    }
  };

  const handleCaptionChange = async (id: string, caption: string) => {
    try {
      await updateIllustrationCaption(id, caption);
    } catch (_) {}
  };

  const handleQuickNoteAdd = async () => {
    const content = quickNote.trim();
    if (!content || !activeChapter) return;
    try {
      await createNote(projectId, activeChapter.id, content);
      setQuickNote('');
    } catch (err: any) {
      alert('Gagal simpan catatan: ' + err.message);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
    } catch (err: any) {
      alert('Gagal hapus: ' + err.message);
    }
  };

  const initials = (name: string) => (name || '?').trim().slice(0, 1).toUpperCase();

  return (
    <aside className="context-panel" id="context-panel">
      {/* Characters Section */}
      <div className="context-section">
        <div className="context-section-header">
          <p className="context-section-title">Karakter di bab ini</p>
          <div className="context-add-wrap">
            <button
              className="context-add-btn"
              title="Tambah karakter"
              onClick={() => { setWorldPickerOpen(false); setPickerOpen(!pickerOpen); }}
            >
              <i className="ti ti-plus" aria-hidden="true"></i>
            </button>
            {pickerOpen && (
              <div className="context-picker" id="context-picker">
                {allCharacters.length === 0 ? (
                  <p className="context-picker-empty">
                    Belum ada karakter. <a href={`/characters?project=${projectId}`}>Bikin di sini</a>.
                  </p>
                ) : availableChars.length === 0 ? (
                  <p className="context-picker-empty">Semua karakter udah dipasang di bab ini.</p>
                ) : (
                  availableChars.map(ch => (
                    <div
                      key={ch.id}
                      className="context-picker-item"
                      onClick={() => handleLinkCharacter(ch.id)}
                    >
                      {ch.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="context-character-list" id="context-character-list">
          {linkedCharacters.length === 0 ? (
            <span className="context-empty">Belum ada karakter di bab ini.</span>
          ) : (
            linkedCharacters.map(ch => (
              <div key={ch.id} className="context-character-chip" onClick={() => {
                router.push(`/characters?project=${projectId}&open=${ch.id}`);
              }}>
                <span
                  className="context-character-avatar"
                  style={ch.image_url ? { backgroundImage: `url('${ch.image_url}')` } : undefined}
                >
                  {ch.image_url ? '' : initials(ch.name)}
                </span>
                <span>{ch.name}</span>
                <button
                  className="unlink-btn"
                  title="Lepas dari bab ini"
                  onClick={(e) => { e.stopPropagation(); handleUnlinkCharacter(ch.id); }}
                >
                  <i className="ti ti-x" aria-hidden="true"></i>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* World Entries Section */}
      <div className="context-section">
        <div className="context-section-header">
          <p className="context-section-title">World di bab ini</p>
          <div className="context-add-wrap">
            <button
              className="context-add-btn"
              title="Tambah entry world"
              onClick={() => { setPickerOpen(false); setWorldPickerOpen(!worldPickerOpen); }}
            >
              <i className="ti ti-plus" aria-hidden="true"></i>
            </button>
            {worldPickerOpen && (
              <div className="context-picker" id="context-world-picker">
                {allWorldEntries.length === 0 ? (
                  <p className="context-picker-empty">
                    Belum ada entry. <a href={`/worldbuilding?project=${projectId}`}>Bikin di sini</a>.
                  </p>
                ) : availableWorlds.length === 0 ? (
                  <p className="context-picker-empty">Semua entry udah dipasang di bab ini.</p>
                ) : (
                  availableWorlds.map(entry => (
                    <div
                      key={entry.id}
                      className="context-picker-item"
                      onClick={() => handleLinkWorld(entry.id)}
                    >
                      {entry.title}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="context-world-list" id="context-world-list">
          {linkedWorldEntries.length === 0 ? (
            <span className="context-empty">Belum ada world entry.</span>
          ) : (
            linkedWorldEntries.map(entry => (
              <div key={entry.id} className="context-world-chip" onClick={() => {
                router.push(`/worldbuilding?project=${projectId}&open=${entry.id}`);
              }}>
                <span className="context-world-chip-text">{entry.title}</span>
                <button
                  className="unlink-btn"
                  title="Lepas dari bab ini"
                  onClick={(e) => { e.stopPropagation(); handleUnlinkWorld(entry.id); }}
                >
                  <i className="ti ti-x" aria-hidden="true"></i>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Illustrations Section */}
      <div className="context-section">
        <div className="context-section-header">
          <p className="context-section-title">Ilustrasi</p>
          <label className="context-add-btn" htmlFor="illus-upload" title="Upload ilustrasi / video">
            <i className="ti ti-photo-plus" aria-hidden="true"></i>
          </label>
          <input
            ref={illusInputRef}
            type="file"
            id="illus-upload"
            accept="image/*,video/*"
            hidden
            onChange={handleIllusUpload}
          />
        </div>
        <div id="context-illus-list">
          {uploading && <span className="illus-uploading">Mengupload…</span>}
          {!uploading && illustrations.length === 0 && (
            <span className="context-empty" style={{ fontSize: '12px' }}>Belum ada ilustrasi.</span>
          )}
          {illustrations.map((il, index) => (
            <div key={il.id} className="illus-thumb-wrap">
              <span className="illus-index-badge" title={`Gunakan {{illus:${index}}} di editor`}>
                {index}
              </span>
              {il.video_url ? (
                <video className="illus-video-thumb" src={il.video_url} muted loop />
              ) : il.image_url ? (
                <img className="illus-thumb" src={il.image_url} alt="" loading="lazy" />
              ) : null}
              <input
                type="text"
                className="illus-caption-input"
                placeholder="Caption opsional…"
                defaultValue={il.caption || ''}
                onBlur={(e) => handleCaptionChange(il.id, e.target.value.trim())}
              />
              <button
                className="illus-delete-btn"
                title="Hapus ilustrasi"
                onClick={() => handleDeleteIllus(il.id)}
              >
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>
          ))}
        </div>
        <div className="illus-tip-box">
          <strong>💡 Tip:</strong>
          Ketik <code>{`{{illus:0}}`}</code> di editor untuk menempatkan ilustrasi pertama di antara teks. Ganti 0 dengan 1, 2, dst. untuk ilustrasi lainnya.
        </div>
      </div>

      {/* Notes Section */}
      <div className="context-section">
        <div className="context-section-header">
          <p className="context-section-title">Catatan</p>
          <button
            className="context-add-btn"
            title="Lihat semua catatan"
            onClick={() => router.push(`/notes?project=${projectId}`)}
          >
            <i className="ti ti-external-link" aria-hidden="true"></i>
          </button>
        </div>
        <div id="context-notes-list">
          {notes.length === 0 ? (
            <span className="context-empty" style={{ fontSize: '12px' }}>Belum ada catatan.</span>
          ) : (
            notes.map(note => (
              <div key={note.id} className="context-note-item">
                <span className="context-note-text">{note.content}</span>
                <button
                  className="context-note-del"
                  title="Hapus catatan"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  <i className="ti ti-x" aria-hidden="true"></i>
                </button>
              </div>
            ))
          )}
        </div>
        <div className="quick-note-section">
          <textarea
            id="quick-note-input"
            rows={2}
            placeholder="Tambah catatan cepat…"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuickNoteAdd();
              }
            }}
          />
          <button className="ghost" id="quick-note-add" onClick={handleQuickNoteAdd}>
            Tambah
          </button>
        </div>
      </div>
    </aside>
  );
}