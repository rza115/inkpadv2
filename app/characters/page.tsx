/**
 * Characters Page
 * Manage characters with photos, roles, and descriptions
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useCharacterStore } from '@/store/useCharacterStore';
import { Loading } from '@/components/ui';
import { CharacterCard, NewCharacterCard } from '@/components/characters/CharacterCard';
import { CharacterModal } from '@/components/characters/CharacterModal';
import type { Character, CharacterRole } from '@/types/character';

function CharactersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const openId = searchParams.get('open');

  const pageTitle = projectId ? 'Karakter' : 'Novel tidak ditemukan';
  
  const { characters, loading, loadCharacters, createCharacter, updateCharacter, deleteCharacter } = useCharacterStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const handleOpenModal = (character?: Character) => {
    setEditingCharacter(character || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCharacter(null);
  };

  useEffect(() => {
    if (!projectId) {
      router.push('/');
      return;
    }

    loadCharacters(projectId);
  }, [projectId]);

  // Handle deep-link to open specific character
  useEffect(() => {
    if (!openId || characters.length === 0) return;
    
    const character = characters.find((c) => c.id === openId);
    if (character) {
      // Deep-linking requires setState in effect - intentional behavior
      // eslint-disable-next-line
      setEditingCharacter(character);
      setIsModalOpen(true);
      // Clear the open parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('open');
      window.history.replaceState(null, '', url);
    }
  }, [openId, characters]);

  const handleSave = async (
    data: {
      name: string;
      aliases: string | null;
      role: CharacterRole | null;
      description: string | null;
    },
    photoFile?: File
  ) => {
    if (!projectId) return;

    if (editingCharacter) {
      await updateCharacter(editingCharacter.id, data, photoFile);
    } else {
      await createCharacter(projectId, data, photoFile);
    }
  };

  const handleDelete = async () => {
    if (!editingCharacter) return;
    await deleteCharacter(editingCharacter.id);
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 max-w-[900px] mx-auto max-md:gap-2">
          {loading && <Loading />}
          
          {!loading && (
            <>
              <NewCharacterCard onClick={() => handleOpenModal()} />
              
              {characters.length === 0 ? (
                <p className="text-muted text-sm text-center py-10 col-span-full">
                  Belum ada karakter. Mulai dari tokoh utama.
                </p>
              ) : (
                characters.map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    onClick={() => handleOpenModal(character)}
                  />
                ))
              )}
            </>
          )}
        </div>
      </main>

      <CharacterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        character={editingCharacter}
        onSave={handleSave}
        onDelete={editingCharacter ? handleDelete : undefined}
      />
    </Nav>
  );
}

export default function CharactersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CharactersContent />
    </Suspense>
  );
}