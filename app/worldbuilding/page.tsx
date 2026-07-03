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
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <Button
            id="new-entry-btn"
            variant="primary"
            onClick={() => handleOpenModal()}
          >
            + Entry baru
          </Button>
        </div>

        <div id="world-groups" style={{ padding: '24px' }}>
          {loading && <Loading />}
          
          {!loading && entries.length === 0 && (
            <div className="empty-state">
              <p className="muted">
                Belum ada entry worldbuilding. Mulai dari lokasi, sistem kekuatan, atau sejarah dunia ceritamu.
              </p>
            </div>
          )}

          {!loading && entries.length > 0 && categories.map((category) => (
            <div key={category} className="world-group" style={{ marginBottom: '32px' }}>
              <h2 className="world-group-title" style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                marginBottom: '12px',
                color: 'var(--text-primary)',
              }}>
                {category}
              </h2>
              <div className="entry-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}>
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