/**
 * ReaderTOC Component
 * Table of contents sidebar for reader mode
 */

import type { Chapter } from '@/types/chapter';

interface ReaderTOCProps {
  chapters: Chapter[];
  activeIndex: number;
  collapsed: boolean;
  onChapterSelect: (index: number) => void;
  onToggle: () => void;
}

export function ReaderTOC({
  chapters,
  activeIndex,
  collapsed,
  onChapterSelect,
  onToggle,
}: ReaderTOCProps) {
  const handleChapterClick = (index: number) => {
    onChapterSelect(index);
    // Auto-collapse on mobile after selection
    if (window.innerWidth < 760) {
      onToggle();
    }
  };

  return (
    <>
      <aside 
        id="r-toc" 
        className={`w-60 border-r border-[var(--border)] flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 max-md:fixed max-md:top-[var(--r-topbar-h)] max-md:left-0 max-md:bottom-0 max-md:z-[35] max-md:w-[min(280px,88vw)] max-md:max-w-[88vw] max-md:bg-[var(--bg)] max-md:shadow-[8px_0_24px_rgba(0,0,0,0.25)] max-md:transition-[transform,visibility] ${collapsed ? 'w-0 border-none max-md:w-[min(280px,88vw)] max-md:-translate-x-full max-md:invisible max-md:pointer-events-none' : 'max-md:translate-x-0 max-md:visible max-md:pointer-events-auto'}`}
      >
        <div id="r-toc-list" className="flex-1 overflow-y-auto p-2">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={`py-2 cursor-pointer text-xs mb-1 leading-snug ${index === activeIndex ? 'border-l-2 border-[var(--accent)] bg-[var(--surface-raised)] text-[var(--accent)] font-medium pl-[8px] pr-2.5 rounded-r-md' : 'pl-[10px] pr-2.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] rounded-md'}`}
              onClick={() => handleChapterClick(index)}
            >
              {chapter.title || 'Tanpa judul'}
              <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                {(chapter.word_count || 0).toLocaleString('id-ID')} kata
              </span>
            </div>
          ))}
        </div>
      </aside>
      
      {/* TOC backdrop for mobile */}
      {!collapsed && typeof window !== 'undefined' && window.innerWidth < 760 && (
        <div
          className="fixed inset-0 bg-black/45 z-[30]"
          onClick={onToggle}
        />
      )}
    </>
  );
}
