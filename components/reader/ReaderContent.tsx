/**
 * ReaderContent Component
 * Renders chapter content with illustrations and navigation
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Chapter, Illustration } from '@/types/chapter';
import type { Character } from '@/types/character';
import type { WorldEntry } from '@/types/worldbuilding';
import { useReaderStore } from '@/store/useReaderStore';
import {
  buildCrosslinkResolver,
  splitChapterContent,
  linkifyCrosslinks,
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

// Illustration block component
function IllustrationBlock({ illustration }: { illustration: Illustration }) {
  return (
    <div className="r-illustration">
      {illustration.video_url ? (
        <video src={illustration.video_url} autoPlay muted loop playsInline />
      ) : illustration.image_url ? (
        <img src={illustration.image_url} alt={illustration.caption || ''} loading="lazy" />
      ) : null}
      {illustration.caption && <p className="r-caption">{illustration.caption}</p>}
    </div>
  );
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

  // Prepare content segments
  const resolver = buildCrosslinkResolver(characters, worldEntries);
  const { segments, usedIndices } = chapter
    ? splitChapterContent(chapter.content || '', illustrations)
    : { segments: [], usedIndices: new Set<number>() };
  const remainingIllustrations = illustrations.filter((_, i) => !usedIndices.has(i));

  return (
    <div id="r-pane" ref={paneRef} className="flex-1 overflow-y-auto px-6 py-10 min-w-0 w-full max-md:p-[24px_max(16px,env(safe-area-inset-right,0px))_calc(24px+env(safe-area-inset-bottom,0px))_max(16px,env(safe-area-inset-left,0px))]">
      <div id="r-column" ref={columnRef} className="r-column max-w-[680px] mx-auto transition-[max-width] duration-200">
        {!chapter ? (
          <p className="r-loading">Tidak ada bab yang dipilih.</p>
        ) : (
          <>
            <h1 className="r-chapter-heading">{chapter.title || 'Tanpa judul'}</h1>

            {remainingIllustrations.length > 0 && (
              <div className="r-illustrations">
                {remainingIllustrations.map((il) => (
                  <IllustrationBlock key={il.id} illustration={il} />
                ))}
              </div>
            )}

            <div className="r-content">
              {segments.map((seg, i) =>
                seg.type === 'text' ? (
                  <ReactMarkdown
                    key={i}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => {
                        if (href?.startsWith('#xlink:')) {
                          const parts = href.split(':');
                          const type = parts[1];
                          const id = parts[2];
                          return (
                            <button
                              className="r-xlink"
                              onClick={() =>
                                router.push(
                                  type === 'character'
                                    ? `/characters?project=${projectId}&open=${id}`
                                    : `/worldbuilding?project=${projectId}&open=${id}`
                                )
                              }
                            >
                              {children}
                            </button>
                          );
                        }
                        return <a href={href}>{children}</a>;
                      },
                    }}
                  >
                    {linkifyCrosslinks(seg.content, resolver)}
                  </ReactMarkdown>
                ) : (
                  <IllustrationBlock key={i} illustration={seg.illustration} />
                )
              )}
            </div>

            {(chapters[chapterIndex - 1] || chapters[chapterIndex + 1]) && (
              <div className="r-chapter-nav">
                {chapters[chapterIndex - 1] && (
                  <button
                    className="r-nav-btn prev"
                    onClick={() => onChapterChange(chapterIndex - 1)}
                  >
                    ← {chapters[chapterIndex - 1].title || 'Bab sebelumnya'}
                  </button>
                )}
                {chapters[chapterIndex + 1] && (
                  <button
                    className="r-nav-btn next"
                    onClick={() => onChapterChange(chapterIndex + 1)}
                  >
                    {chapters[chapterIndex + 1].title || 'Bab berikutnya'} →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
