/**
 * ChapterPanel Component
 * Displays chapter list with drag reorder, create, delete, and status cycling
 */
'use client';

import { useState, useRef } from 'react';
import { useChapterStore } from '@/store/useChapterStore';
import type { Chapter } from '@/types/chapter';

interface ChapterPanelProps {
  projectId: string;
}

export function ChapterPanel({ projectId }: ChapterPanelProps) {
  const {
    chapters,
    activeChapter,
    isLoading,
    selectChapter,
    createChapter,
    deleteChapter,
    cycleStatus,
    reorderChapters,
  } = useChapterStore();

  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('inkpad_chapter_panel_collapsed') === 'true';
    }
    return false;
  });

  const totalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('inkpad_chapter_panel_collapsed', String(next));
  };

  const handleCreate = async () => {
    try {
      const chapter = await createChapter(projectId);
      selectChapter(chapter.id);
      // Focus title input after a tick
      setTimeout(() => {
        const input = document.querySelector('.chapter-title-input') as HTMLInputElement;
        if (input) { input.focus(); input.select(); }
      }, 100);
    } catch (err: any) {
      alert('Gagal bikin bab: ' + err.message);
    }
  };

  const handleDelete = async (ch: Chapter) => {
    if (!confirm(`Hapus "${ch.title}"? Nggak bisa dibatalin.`)) return;
    try {
      await deleteChapter(ch.id);
    } catch (err: any) {
      alert('Gagal hapus bab: ' + err.message);
    }
  };

  const handleDragStart = (id: string) => {
    setDragSourceId(id);
  };

  const handleDrop = (targetId: string) => {
    if (dragSourceId) {
      reorderChapters(dragSourceId, targetId);
      setDragSourceId(null);
    }
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    revisi: 'Revisi',
    final: 'Final',
  };

  return (
    <aside className={`chapter-panel ${collapsed ? 'collapsed' : ''}`} id="chapter-panel">
      <div className="chapter-panel-header">
        <p className="chapter-panel-title" id="chapter-count">
          {isLoading ? 'Memuat…' : `${chapters.length} bab · ${totalWords.toLocaleString('id-ID')} kata`}
        </p>
        <button
          className="chapter-panel-toggle"
          id="chapter-panel-toggle"
          onClick={handleToggleCollapse}
          title={collapsed ? 'Tampilkan navigasi bab' : 'Sembunyikan navigasi bab'}
          aria-label="Toggle navigasi bab"
        >
          <i className={`ti ti-chevron-${collapsed ? 'down' : 'up'}`} aria-hidden="true"></i>
        </button>
      </div>

      <div className="chapter-list" id="chapter-list">
        {isLoading && chapters.length === 0 && (
          <p className="muted" style={{ padding: '8px' }}>Memuat…</p>
        )}
        
        {!isLoading && chapters.length === 0 && (
          <p className="muted" style={{ padding: '8px' }}>Belum ada bab.</p>
        )}

        {chapters.map((ch) => (
          <div
            key={ch.id}
            className={`chapter-item${activeChapter?.id === ch.id ? ' active' : ''}`}
            draggable
            data-id={ch.id}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.chapter-item-delete') ||
                  (e.target as HTMLElement).closest('.chapter-item-status')) return;
              selectChapter(ch.id);
            }}
            onDragStart={() => handleDragStart(ch.id)}
            onDragEnd={() => setDragSourceId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(ch.id)}
          >
            <span className="chapter-item-title">{ch.title || 'Tanpa judul'}</span>
            <span
              className="chapter-item-status"
              data-id={ch.id}
              onClick={(e) => {
                e.stopPropagation();
                cycleStatus(ch);
              }}
            >
              {statusLabels[ch.status] || ch.status}
            </span>
            <button
              className="chapter-item-delete"
              data-id={ch.id}
              title="Hapus bab"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(ch);
              }}
            >
              <i className="ti ti-trash" aria-hidden="true"></i>
            </button>
          </div>
        ))}
      </div>

      <button className="new-chapter-btn" id="new-chapter-btn" onClick={handleCreate}>
        <i className="ti ti-plus" aria-hidden="true"></i> Bab baru
      </button>
    </aside>
  );
}