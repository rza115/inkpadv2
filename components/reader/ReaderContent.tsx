/**
 * ReaderContent Component
 * Renders chapter content with illustrations and navigation
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Chapter, Illustration } from '@/types/chapter';
import type { Character } from '@/types/character';
import type { WorldEntry } from '@/types/worldbuilding';
import { useReaderStore } from '@/store/useReaderStore';
import {
  escapeHtml,
  buildIllustrationHTML,
  buildChapterNavigation,
  buildCrosslinkResolver,
  processChapterContent,
  replacePlaceholders,
  getRemainingIllustrations,
} from '@/lib/reader';

interface ReaderContentProps {
  projectId: string;
  chapter: Chapter | null;
  chapterIndex: number;
  chapters: Chapter[];
  illustrations: Illustration[];
  characters: Character[];
  worldEntries: WorldEntry[];
  onChapterChange: (index: number) => void;
}

export function ReaderContent({
  projectId,
  chapter,
  chapterIndex,
  chapters,
  illustrations,
  characters,
  worldEntries,
  onChapterChange,
}: ReaderContentProps) {
  const router = useRouter();
  const columnRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    preferences,
    getFontSizeClass,
    getWidthClass,
    savePosition,
  } = useReaderStore();

  // Build chapter HTML
  const buildChapterHTML = useCallback(() => {
    if (!chapter) return '<p class="r-loading">Tidak ada bab yang dipilih.</p>';

    const resolver = buildCrosslinkResolver(characters, worldEntries);
    let html = `<h1 class="r-chapter-heading">${escapeHtml(chapter.title || 'Tanpa judul')}</h1>`;

    // Process content with illustration markers
    const { processedContent, pendingIllustrations, usedIndices } = processChapterContent(
      chapter.content || '',
      illustrations
    );

    // Get remaining (unused) illustrations to display at top
    const remainingIllustrations = getRemainingIllustrations(illustrations, usedIndices);
    if (remainingIllustrations.length > 0) {
      html += '<div class="r-illustrations">';
      remainingIllustrations.forEach((il) => {
        html += buildIllustrationHTML(il);
      });
      html += '</div>';
    }

    // Render markdown content (need to use global MarkdownRender from vanilla JS)
    let renderedContent = processedContent;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).MarkdownRender) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderedContent = (window as any).MarkdownRender.render(processedContent, resolver);
    }

    // Replace illustration placeholders with actual HTML
    renderedContent = replacePlaceholders(renderedContent, pendingIllustrations);

    html += `<div class="r-content">${renderedContent}</div>`;
    html += buildChapterNavigation(chapters, chapterIndex);

    return html;
  }, [chapter, chapterIndex, chapters, illustrations, characters, worldEntries]);

  // Wire chapter navigation buttons
  const wireChapterNav = useCallback(() => {
    if (!columnRef.current) return;

    const navButtons = columnRef.current.querySelectorAll('.r-nav-btn');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.idx || '0', 10);
        onChapterChange(idx);
      });
    });
  }, [onChapterChange]);

  // Wire crosslinks
  const wireCrosslinks = useCallback(() => {
    if (!columnRef.current) return;

    const xlinks = columnRef.current.querySelectorAll('.r-xlink');
    xlinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const type = (link as HTMLElement).dataset.type;
        const id = (link as HTMLElement).dataset.id;
        
        if (type === 'character') {
          router.push(`/characters?project=${projectId}&open=${id}`);
        } else if (type === 'world') {
          router.push(`/worldbuilding?project=${projectId}&open=${id}`);
        }
      });
    });
  }, [projectId, router]);

  // Setup scroll tracking with debounce
  useEffect(() => {
    if (!paneRef.current || !chapter) return;

    const handleScroll = () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }

      scrollTimerRef.current = setTimeout(() => {
        if (paneRef.current && chapter) {
          savePosition(
            projectId,
            chapterIndex,
            paneRef.current.scrollTop,
            chapter.title || 'Tanpa judul'
          );
        }
      }, 500);
    };

    const pane = paneRef.current;
    pane.addEventListener('scroll', handleScroll);

    return () => {
      pane.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [projectId, chapter, chapterIndex, savePosition]);

  // Render chapter content and wire up interactivity
  useEffect(() => {
    if (!columnRef.current) return;

    const html = buildChapterHTML();
    columnRef.current.innerHTML = html;

    // Wire up interactive elements
    wireChapterNav();
    wireCrosslinks();
  }, [buildChapterHTML, wireChapterNav, wireCrosslinks]);

  // Apply reader preferences styling
  useEffect(() => {
    if (!columnRef.current) return;

    const col = columnRef.current;
    const fontSizeClass = getFontSizeClass();
    const widthClass = getWidthClass();

    // Remove all font size classes
    col.classList.remove('r-fs-sm', 'r-fs-md', 'r-fs-lg', 'r-fs-xl');
    col.classList.add(fontSizeClass);

    // Remove all font family classes
    col.classList.remove('r-ff-literata', 'r-ff-lora', 'r-ff-inter', 'r-ff-nunito');
    col.classList.add(`r-ff-${preferences.fontFamily}`);

    // Remove all text align classes
    col.classList.remove('r-al-left', 'r-al-right', 'r-al-justify');
    col.classList.add(`r-al-${preferences.textAlign}`);

    // Remove all width classes
    col.classList.remove('narrow', 'wide');
    if (widthClass) {
      col.classList.add(widthClass);
    }
  }, [preferences, getFontSizeClass, getWidthClass]);

  return (
    <div id="r-pane" ref={paneRef}>
      <div id="r-column" ref={columnRef}>
        <p className="r-loading">Memuat…</p>
      </div>
    </div>
  );
}
