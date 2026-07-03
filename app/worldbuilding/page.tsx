/**
 * Worldbuilding Page
 * Manage worldbuilding entries organized by category with cross-linking support
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWorldbuildingStore } from '@/store/useWorldbuildingStore';
import { useCharacterStore } from '@/store/useCharacterStore';
import { Loading, Button } from '@/components/ui';
import { WorldEntryCard } from '@/components/worldbuilding/WorldEntryCard';
import { WorldEntryModal } from '@/components/worldbuilding/WorldEntryModal';
import type { WorldEntry } from '@/types/worldbuilding';

function WorldbuildingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const openId = searchParams.get('open');
  
  const { entries, loading: entriesLoading, loadEntries, createEntry, updateEntry, deleteEntry } = useWorldbuildingStore();
  const { characters, loading: charactersLoading, loadCharacters } = useCharacterStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorldEntry | null>(null);

  const loading = entriesLoading || charactersLoading;

  const handleOpenModal = (entry?: WorldEntry) => {
    setEditingEntry(entry || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  useEffect(() => {
    if (!projectId) {
      router.push('/');
      return;
    }

    loadEntries(projectId);
    loadCharacters(projectId);
  }, [projectId]);

  // Handle deep-link to open specific entry
  useEffect(() => {
    if (!openId || entries.length === 0) return;
    
    const entry = entries.find((e) => e.id === openId);
    if (entry) {
      // eslint-disable-next-line
      setEditingEntry(entry);
      setIsModalOpen(true);
      // Clear the open parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('open');
      window.history.replaceState(null, '', url);
    }
  }, [openId, entries]);

  const handleSave = async (data: {
    title: string;
    category: string;
    content: string | null;
  }) => {
    if (!projectId) return;

    if (editingEntry) {
      await updateEntry(editingEntry.id, data);
    } else {
      await createEntry(projectId, data);
    }
  };

  const handleDelete = async () => {
    if (!editingEntry) return;
    await deleteEntry(editingEntry.id);
  };

  // Group entries by category
  const groupedEntries = entries.reduce((acc, entry) => {
    const cat = entry.category || 'Lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(entry);
    return acc;
  }, {} as Record<string, WorldEntry[]>);

  const categories = Object.keys(groupedEntries).sort();

  if (!projectId) {
    return (
      <div className="p-6">
        <p className="text-muted text-sm">
          Tidak ada novel yang dipilih. Kembali ke <Link href="/" className="text-accent-deep underline">Project Hub</Link>.
        </p>
      </div>
    );
  }

  return (
    <>
      <main id="page-main">
        <div className="p-4 px-6 border-b border-default">
          <Button
            id="new-entry-btn"
            variant="primary"
            onClick={() => handleOpenModal()}
          >
            + Entry baru
          </Button>
        </div>

        <div className="p-6">
          {loading && <Loading />}
          
          {!loading && entries.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted text-sm">
                Belum ada entry worldbuilding. Mulai dari lokasi, sistem kekuatan, atau sejarah dunia ceritamu.
              </p>
            </div>
          )}

          {!loading && entries.length > 0 && categories.map((category) => (
            <div key={category} className="mb-8">
              <h2 className="text-base font-semibold mb-3">
                {category}
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {groupedEntries[category].map((entry) => (
                  <WorldEntryCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => handleOpenModal(entry)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <WorldEntryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        entry={editingEntry}
        entries={entries}
        characters={characters}
        projectId={projectId}
        onSave={handleSave}
        onDelete={editingEntry ? handleDelete : undefined}
        onOpenEntry={handleOpenModal}
      />
    </>
  );
}

export default function WorldbuildingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <WorldbuildingContent />
    </Suspense>
  );
}
