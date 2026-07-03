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
      <aside id="r-toc" className={collapsed ? 'collapsed' : ''}>
        <div id="r-toc-list">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={`r-toc-item${index === activeIndex ? ' active' : ''}`}
              onClick={() => handleChapterClick(index)}
            >
              {chapter.title || 'Tanpa judul'}
              <span className="r-toc-wc">
                {(chapter.word_count || 0).toLocaleString('id-ID')} kata
              </span>
            </div>
          ))}
        </div>
      </aside>
      
      {/* TOC backdrop for mobile */}
      {!collapsed && (
        <div
          className="r-toc-backdrop"
          onClick={onToggle}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9,
            display: window.innerWidth < 760 ? 'block' : 'none',
          }}
        />
      )}
    </>
  );
}
