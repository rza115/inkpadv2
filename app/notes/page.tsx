/**
 * Notes Page
 * Manage quick notes with optional assignment to chapters, characters, or world entries
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useNotesStore } from '@/store/useNotesStore';
import { createClient } from '@/lib/supabase/client';
import { Button, Loading } from '@/components/ui';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteModal } from '@/components/notes/NoteModal';
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

function NotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const pageTitle = projectId ? 'Quick notes' : 'Novel tidak ditemukan';
  const { notes, loading, loadNotes, createNote, updateNote, deleteNote } = useNotesStore();
  
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldEntries, setWorldEntries] = useState<WorldEntry[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!projectId) {
      router.push('/');
      return;
    }

    loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    if (!projectId) return;

    try {
      setLoadError('');
      const supabase = createClient();

      // Load notes, chapters, characters, and world entries in parallel
      const [notesResult, chaptersResult, charactersResult, worldResult] = await Promise.all([
        loadNotes(projectId).catch((err) => {
          console.error('Failed to load notes:', err);
          return null;
        }),
        supabase
          .from('chapters')
          .select('id, title')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true }),
        supabase
          .from('characters')
          .select('id, name')
          .eq('project_id', projectId)
          .order('name', { ascending: true }),
        supabase
          .from('world_entries')
          .select('id, title')
          .eq('project_id', projectId)
          .order('title', { ascending: true }),
      ]);

      if (chaptersResult.error) throw chaptersResult.error;
      if (charactersResult.error) throw charactersResult.error;
      if (worldResult.error) throw worldResult.error;

      setChapters(chaptersResult.data || []);
      setCharacters(charactersResult.data || []);
      setWorldEntries(worldResult.data || []);
    } catch (err: any) {
      setLoadError(err.message || 'Gagal memuat data');
    }
  };

  const handleOpenModal = (note?: Note) => {
    setEditingNote(note || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSave = async (data: {
    content: string;
    assigned_chapter_id: string | null;
    assigned_character_id: string | null;
    assigned_world_id: string | null;
  }) => {
    if (!projectId) return;

    if (editingNote) {
      await updateNote(editingNote.id, data);
    } else {
      await createNote(projectId, data);
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!editingNote) return;
    const confirmed = confirm('Hapus catatan ini?');
    if (confirmed) {
      await deleteNote(editingNote.id);
      handleCloseModal();
    }
  };

  if (!projectId) {
    return (
      <Nav layout="project" title={pageTitle} projectId={null}>
        <main id="page-main">
          <p className="text-muted text-sm p-6">
            Tidak ada novel yang dipilih. Kembali ke <Link href="/" className="text-accent-deep underline">Project Hub</Link>.
          </p>
        </main>
      </Nav>
    );
  }

  return (
    <Nav layout="project" title={pageTitle} projectId={projectId}>
        <main id="page-main">
        <div className="max-w-[800px]">
          <div className="mb-4">
            <Button variant="ghost" onClick={() => handleOpenModal()}>
              <i className="ti ti-plus" aria-hidden="true"></i> Catatan baru
            </Button>
          </div>

          {loading && <Loading />}
          
          {loadError && (
            <p className="text-sm text-[var(--danger)] mb-4">
              {loadError}
            </p>
          )}

          {!loading && !loadError && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {notes.length === 0 ? (
                <p className="text-muted text-sm col-span-full text-center py-10">
                  Belum ada catatan. Buang ide random di sini dulu, rapiin belakangan.
                </p>
              ) : (
                notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => handleOpenModal(note)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <NoteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        note={editingNote}
        chapters={chapters}
        characters={characters}
        worldEntries={worldEntries}
        onSave={handleSave}
        onDelete={editingNote ? handleDelete : undefined}
      />
    </Nav>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NotesContent />
    </Suspense>
  );
}
