/**
 * Characters Page
 * Manage characters with photos, roles, and descriptions
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
      <div style={{ padding: '24px' }}>
        <p className="muted">
          Tidak ada novel yang dipilih. Kembali ke <Link href="/">Project Hub</Link>.
        </p>
      </div>
    );
  }

  return (
    <>
      <main id="page-main">
        <div id="character-grid">
          {loading && <Loading />}
          
          {!loading && (
            <>
              <NewCharacterCard onClick={() => handleOpenModal()} />
              
              {characters.length === 0 ? (
                <p className="muted empty-state">
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
    </>
  );
}

export default function CharactersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CharactersContent />
    </Suspense>
  );
}