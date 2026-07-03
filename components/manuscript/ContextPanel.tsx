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
    <aside className="w-[260px] border-l border-[var(--border)] shrink-0 p-4 overflow-y-auto bg-[var(--bg)] max-md:w-full max-md:border-l-0 max-md:border-t max-md:max-h-[50vh]" id="context-panel">
      {/* Characters Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] m-0">Karakter di bab ini</p>
          <div className="relative">
            <button
              className="w-6 h-6 flex items-center justify-center bg-transparent border border-[var(--border)] rounded-[var(--radius)] text-[var(--text-muted)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              title="Tambah karakter"
              onClick={() => { setWorldPickerOpen(false); setPickerOpen(!pickerOpen); }}
            >
              <i className="ti ti-plus text-xs" aria-hidden="true"></i>
            </button>
            {pickerOpen && (
              <div className="absolute top-[calc(100%+6px)] right-0 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] min-w-[200px] max-w-[280px] max-h-[280px] overflow-y-auto z-50 shadow-lg" id="context-picker">
                {allCharacters.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[var(--text-muted)] m-0">
                    Belum ada karakter. <a href={`/characters?project=${projectId}`} className="text-[var(--accent)]">Bikin di sini</a>.
                  </p>
                ) : availableChars.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[var(--text-muted)] m-0">Semua karakter udah dipasang di bab ini.</p>
                ) : (
                  availableChars.map(ch => (
                    <div
                      key={ch.id}
                      className="px-3 py-2 cursor-pointer text-sm text-[var(--text)] hover:bg-[var(--surface)] border-b border-[var(--border)] last:border-b-0"
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
        <div className="flex flex-col gap-2" id="context-character-list">
          {linkedCharacters.length === 0 ? (
            <span className="text-xs text-[var(--text-muted)]">Belum ada karakter di bab ini.</span>
          ) : (
            linkedCharacters.map(ch => (
              <div key={ch.id} className="flex items-center gap-2 p-2 bg-[var(--surface)] rounded-[var(--radius)] cursor-pointer border border-[var(--border)] hover:border-[var(--accent)] transition-colors group" onClick={() => {
                router.push(`/characters?project=${projectId}&open=${ch.id}`);
              }}>
                <span
                  className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-medium bg-[var(--accent)] text-[var(--bg)] bg-center bg-cover"
                  style={ch.image_url ? { backgroundImage: `url('${ch.image_url}')` } : undefined}
                >
                  {ch.image_url ? '' : initials(ch.name)}
                </span>
                <span className="flex-1 min-w-0 text-sm overflow-hidden text-ellipsis whitespace-nowrap">{ch.name}</span>
                <button
                  className="shrink-0 w-5 h-5 flex items-center justify-center bg-transparent border-none text-[var(--text-muted)] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--text)]"
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] m-0">World di bab ini</p>
          <div className="relative">
            <button
              className="w-6 h-6 flex items-center justify-center bg-transparent border border-[var(--border)] rounded-[var(--radius)] text-[var(--text-muted)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              title="Tambah entry world"
              onClick={() => { setPickerOpen(false); setWorldPickerOpen(!worldPickerOpen); }}
            >
              <i className="ti ti-plus text-xs" aria-hidden="true"></i>
            </button>
            {worldPickerOpen && (
              <div className="absolute top-[calc(100%+6px)] right-0 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] min-w-[200px] max-w-[280px] max-h-[280px] overflow-y-auto z-50 shadow-lg" id="context-world-picker">
                {allWorldEntries.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[var(--text-muted)] m-0">
                    Belum ada entry. <a href={`/worldbuilding?project=${projectId}`} className="text-[var(--accent)]">Bikin di sini</a>.
                  </p>
                ) : availableWorlds.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[var(--text-muted)] m-0">Semua entry udah dipasang di bab ini.</p>
                ) : (
                  availableWorlds.map(entry => (
                    <div
                      key={entry.id}
                      className="px-3 py-2 cursor-pointer text-sm text-[var(--text)] hover:bg-[var(--surface)] border-b border-[var(--border)] last:border-b-0"
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
        <div className="flex flex-col gap-2" id="context-world-list">
          {linkedWorldEntries.length === 0 ? (
            <span className="text-xs text-[var(--text-muted)]">Belum ada world entry.</span>
          ) : (
            linkedWorldEntries.map(entry => (
              <div key={entry.id} className="flex items-center gap-2 p-2 bg-[var(--surface)] rounded-[var(--radius)] cursor-pointer border border-[var(--border)] hover:border-[var(--accent)] transition-colors group" onClick={() => {
                router.push(`/worldbuilding?project=${projectId}&open=${entry.id}`);
              }}>
                <span className="flex-1 min-w-0 text-sm overflow-hidden text-ellipsis whitespace-nowrap">{entry.title}</span>
                <button
                  className="shrink-0 w-5 h-5 flex items-center justify-center bg-transparent border-none text-[var(--text-muted)] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--text)]"
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] m-0">Ilustrasi</p>
          <label className="w-6 h-6 flex items-center justify-center bg-transparent border border-[var(--border)] rounded-[var(--radius)] text-[var(--text-muted)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]" htmlFor="illus-upload" title="Upload ilustrasi / video">
            <i className="ti ti-photo-plus text-xs" aria-hidden="true"></i>
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
        <div id="context-illus-list" className="flex flex-col gap-3">
          {uploading && <span className="text-xs text-[var(--text-muted)]">Mengupload…</span>}
          {!uploading && illustrations.length === 0 && (
            <span className="text-xs text-[var(--text-muted)]">Belum ada ilustrasi.</span>
          )}
          {illustrations.map((il, index) => (
            <div key={il.id} className="relative border border-[var(--border)] rounded-[var(--radius)] overflow-hidden bg-[var(--surface)] group">
              <span className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center bg-[var(--bg)] text-[var(--accent)] text-xs font-medium rounded-full z-10" title={`Gunakan {{illus:${index}}} di editor`}>
                {index}
              </span>
              {il.video_url ? (
                <video className="w-full h-auto aspect-video object-cover" src={il.video_url} muted loop />
              ) : il.image_url ? (
                <img className="w-full h-auto aspect-video object-cover" src={il.image_url} alt="" loading="lazy" />
              ) : null}
              <input
                type="text"
                className="w-full px-2 py-1.5 text-xs bg-[var(--surface)] border-t border-[var(--border)] text-[var(--text)]"
                placeholder="Caption opsional…"
                defaultValue={il.caption || ''}
                onBlur={(e) => handleCaptionChange(il.id, e.target.value.trim())}
              />
              <button
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-[var(--bg)] border-none rounded-full text-[var(--text-muted)] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--text)]"
                title="Hapus ilustrasi"
                onClick={() => handleDeleteIllus(il.id)}
              >
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2.5 bg-[var(--surface)] rounded-[var(--radius)] text-xs text-[var(--text-muted)] border border-[var(--border)]">
          <strong className="text-[var(--text)]">💡 Tip:</strong>
          {' '}Ketik <code className="px-1 py-0.5 bg-[var(--bg)] rounded text-[var(--accent)]">{`{{illus:0}}`}</code> di editor untuk menempatkan ilustrasi pertama di antara teks. Ganti 0 dengan 1, 2, dst. untuk ilustrasi lainnya.
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] m-0">Catatan</p>
          <button
            className="w-6 h-6 flex items-center justify-center bg-transparent border border-[var(--border)] rounded-[var(--radius)] text-[var(--text-muted)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            title="Lihat semua catatan"
            onClick={() => router.push(`/notes?project=${projectId}`)}
          >
            <i className="ti ti-external-link text-xs" aria-hidden="true"></i>
          </button>
        </div>
        <div id="context-notes-list" className="flex flex-col gap-2 mb-3">
          {notes.length === 0 ? (
            <span className="text-xs text-[var(--text-muted)]">Belum ada catatan.</span>
          ) : (
            notes.map(note => (
              <div key={note.id} className="flex items-start gap-2 p-2 bg-[var(--surface)] rounded-[var(--radius)] text-xs border border-[var(--border)] group">
                <span className="flex-1 min-w-0 text-[var(--text)]">{note.content}</span>
                <button
                  className="shrink-0 w-5 h-5 flex items-center justify-center bg-transparent border-none text-[var(--text-muted)] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--text)]"
                  title="Hapus catatan"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  <i className="ti ti-x" aria-hidden="true"></i>
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex flex-col gap-2">
          <textarea
            id="quick-note-input"
            className="w-full px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text)] resize-none"
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
          <button className="px-3 py-1.5 bg-transparent border border-[var(--border)] rounded-[var(--radius)] text-xs text-[var(--text-muted)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]" id="quick-note-add" onClick={handleQuickNoteAdd}>
            Tambah
          </button>
        </div>
      </div>
    </aside>
  );
}