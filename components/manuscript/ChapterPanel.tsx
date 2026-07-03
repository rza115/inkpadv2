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
    <aside 
      className={`${collapsed ? 'w-[36px] min-w-[36px]' : 'w-[220px]'} border-r border-[var(--border)] flex flex-col shrink-0 transition-[width] duration-200 md:relative md:top-0 md:h-auto max-md:w-full max-md:max-h-[138px] max-md:border-r-0 max-md:border-b max-md:transition-[max-height] max-md:overflow-hidden ${collapsed ? 'max-md:max-h-[36px]' : ''}`} 
      id="chapter-panel"
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3.5 py-3 border-b border-[var(--border)] max-md:px-3 max-md:py-2 max-md:pb-1 max-md:border-b-0`}>
        <p className={`text-xs text-[var(--text-muted)] m-0 ${collapsed ? 'hidden' : ''}`} id="chapter-count">
          {isLoading ? 'Memuat…' : `${chapters.length} bab · ${totalWords.toLocaleString('id-ID')} kata`}
        </p>
        <button
          className="flex items-center justify-center bg-transparent border-none text-[var(--text-muted)] cursor-pointer px-1 py-0.5 rounded-[var(--radius)] shrink-0 transition-colors hover:text-[var(--text)]"
          id="chapter-panel-toggle"
          onClick={handleToggleCollapse}
          title={collapsed ? 'Tampilkan navigasi bab' : 'Sembunyikan navigasi bab'}
          aria-label="Toggle navigasi bab"
        >
          <i className={`ti ti-chevron-${collapsed ? 'down' : 'up'} transition-transform duration-200 ${collapsed ? 'md:-rotate-90' : ''}`} aria-hidden="true"></i>
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto p-2 ${collapsed ? 'hidden md:hidden' : ''} max-md:flex max-md:flex-none max-md:gap-2 max-md:overflow-x-auto max-md:overflow-y-hidden max-md:px-3 max-md:py-1.5 max-md:pb-2 max-md:scroll-snap-x max-md:scroll-snap-type-proximity`} id="chapter-list">
        {isLoading && chapters.length === 0 && (
          <p className="text-[var(--text-muted)] text-xs p-2">Memuat…</p>
        )}
        
        {!isLoading && chapters.length === 0 && (
          <p className="text-[var(--text-muted)] text-xs p-2">Belum ada bab.</p>
        )}

        {chapters.map((ch) => (
          <div
            key={ch.id}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-[var(--radius)] cursor-pointer mb-1 text-sm transition-colors ${activeChapter?.id === ch.id ? 'bg-[var(--surface-raised)] text-[var(--accent)]' : 'hover:bg-[var(--surface-raised)]'} max-md:flex-[0_0_min(72vw,260px)] max-md:mb-0 max-md:scroll-snap-align-start max-md:bg-[var(--surface)] max-md:border max-md:border-[var(--border)] ${activeChapter?.id === ch.id ? 'max-md:border-[rgba(214,138,60,0.45)]' : ''}`}
            draggable
            data-id={ch.id}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('[data-delete-btn]') || target.closest('[data-status-btn]')) return;
              selectChapter(ch.id);
            }}
            onDragStart={() => handleDragStart(ch.id)}
            onDragEnd={() => setDragSourceId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(ch.id)}
          >
            <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{ch.title || 'Tanpa judul'}</span>
            <span
              data-status-btn
              className="text-[10px] text-[var(--text-muted)] shrink-0 cursor-pointer px-1.5 py-0.5 rounded-full bg-[var(--bg)]"
              onClick={(e) => {
                e.stopPropagation();
                cycleStatus(ch);
              }}
            >
              {statusLabels[ch.status] || ch.status}
            </span>
            <button
              data-delete-btn
              className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer shrink-0 flex p-0.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity max-md:w-7 max-md:h-7 max-md:items-center max-md:justify-center"
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

      <button className={`mx-2 my-2 px-2 py-2 border border-dashed border-[var(--border)] bg-transparent rounded-[var(--radius)] text-[var(--text-muted)] cursor-pointer text-xs flex items-center justify-center gap-1.5 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] ${collapsed ? 'hidden' : ''} max-md:shrink-0 max-md:mx-3 max-md:mb-2.5 max-md:min-h-[38px]`} id="new-chapter-btn" onClick={handleCreate}>
        <i className="ti ti-plus" aria-hidden="true"></i> Bab baru
      </button>
    </aside>
  );
}