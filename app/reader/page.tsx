"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProjectStore } from "@/store/useProjectStore";
import { useChapterStore } from "@/store/useChapterStore";
import { useCharacterStore } from "@/store/useCharacterStore";
import { useWorldbuildingStore } from "@/store/useWorldbuildingStore";
import { useReaderStore } from "@/store/useReaderStore";
import { ReaderTopbar } from "@/components/reader/ReaderTopbar";
import { ReaderTOC } from "@/components/reader/ReaderTOC";
import { ReaderContent } from "@/components/reader/ReaderContent";
import { Loading } from "@/components/ui";
import type { Project } from "@/types/project";
import type { Illustration } from "@/types/chapter";
import { createClient } from "@/lib/supabase/client";

function ReaderContent_Page() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("project");

  const { projects } = useProjectStore();
  const { chapters, loadChapters } = useChapterStore();
  const { characters, loadCharacters } = useCharacterStore();
  const { entries: worldEntries, loadEntries: loadWorldEntries } = useWorldbuildingStore();
  const {
    activeChapterIndex,
    tocCollapsed,
    setActiveChapter,
    toggleTOC,
    setTOCCollapsed,
    loadPosition,
    reset,
  } = useReaderStore();

  const [project, setProject] = useState<Project | null>(null);
  const [illustrations, setIllustrations] = useState<Illustration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync topbar height CSS variable for mobile TOC positioning
  useEffect(() => {
    const syncTopbarHeight = () => {
      const topbar = document.querySelector('[data-reader-topbar]') as HTMLElement;
      if (topbar) {
        document.documentElement.style.setProperty(
          '--r-topbar-h',
          `${topbar.offsetHeight}px`
        );
      }
    };

    syncTopbarHeight();
    window.addEventListener('resize', syncTopbarHeight);

    return () => {
      window.removeEventListener('resize', syncTopbarHeight);
    };
  }, []);

  // Auto-collapse TOC on mobile
  useEffect(() => {
    if (window.innerWidth < 760) {
      setTOCCollapsed(true);
    }
  }, [setTOCCollapsed]);

  // Load project data
  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Find project
        const proj = projects.find((p) => p.id === projectId);
        setProject(proj || null);

        if (proj) {
          document.title = `${proj.title} — Inkpad`;
        }

        // Load all data in parallel
        await Promise.all([
          loadChapters(projectId),
          loadCharacters(projectId),
          loadWorldEntries(projectId),
        ]);

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load reader data:", error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId, projects, loadChapters, loadCharacters, loadWorldEntries]);

  // Load illustrations for active chapter
  useEffect(() => {
    if (!chapters || chapters.length === 0) return;

    const activeChapter = chapters[activeChapterIndex];
    if (!activeChapter) return;

    const loadIllustrations = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("illustrations")
          .select("*")
          .eq("chapter_id", activeChapter.id)
          .order("order_index");

        if (error) throw error;
        setIllustrations(data || []);
      } catch (error) {
        console.error("Failed to load illustrations:", error);
        setIllustrations([]);
      }
    };

    loadIllustrations();
  }, [chapters, activeChapterIndex]);

  // Determine initial chapter from URL or saved position
  useEffect(() => {
    if (!projectId || !chapters || chapters.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const urlChapterId = params.get("chapterId");
    const urlChapterIdx = parseInt(params.get("chapter") || "0", 10);

    let initialIdx = 0;

    // Try chapterId first (more stable)
    if (urlChapterId) {
      const foundIdx = chapters.findIndex((c) => c.id === urlChapterId);
      if (foundIdx !== -1) {
        initialIdx = foundIdx;
      }
    } else if (Number.isFinite(urlChapterIdx)) {
      initialIdx = Math.min(
        Math.max(urlChapterIdx, 0),
        chapters.length - 1
      );
    }

    // Check for saved position (higher priority)
    const savedPosition = loadPosition(projectId);
    if (
      savedPosition &&
      savedPosition.chapterIndex >= 0 &&
      savedPosition.chapterIndex < chapters.length
    ) {
      initialIdx = savedPosition.chapterIndex;

      // Restore scroll position after a short delay
      setTimeout(() => {
        const pane = document.getElementById("r-pane");
        if (pane) {
          pane.scrollTop = savedPosition.scrollY || 0;
        }
      }, 100);
    }

    setActiveChapter(initialIdx);
  }, [projectId, chapters, loadPosition, setActiveChapter]);

  // Handle chapter change
  const handleChapterChange = useCallback(
    (index: number) => {
      setActiveChapter(index);

      // Scroll to top
      const pane = document.getElementById("r-pane");
      if (pane) {
        pane.scrollTop = 0;
      }

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set("chapter", index.toString());
      window.history.replaceState(null, "", url);
    },
    [setActiveChapter]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  if (!projectId) {
    return (
      <div style={{ padding: "24px" }}>
        <p>
          Tidak ada novel yang dipilih. Kembali ke <Link href="/">Project Hub</Link>.
        </p>
      </div>
    );
  }

  const activeChapter = chapters[activeChapterIndex] || null;
  const chapterTitle = activeChapter?.title || "Tanpa judul";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg)]">
      <ReaderTopbar
        projectId={projectId}
        chapterTitle={chapterTitle}
        onTOCToggle={toggleTOC}
      />

      <div className="flex flex-1 overflow-hidden min-w-0 w-full">
        {/* Table of Contents */}
        <ReaderTOC
          chapters={chapters}
          activeIndex={activeChapterIndex}
          collapsed={tocCollapsed}
          onChapterSelect={handleChapterChange}
          onToggle={toggleTOC}
        />

        {/* Main Content */}
        {isLoading ? (
          <div className="flex-1 overflow-y-auto px-6 py-10">
            <div className="max-w-[680px] mx-auto">
              <p className="r-loading">Memuat...</p>
            </div>
          </div>
        ) : chapters.length === 0 ? (
          <div className="flex-1 overflow-y-auto px-6 py-10">
            <div className="max-w-[680px] mx-auto">
              <p className="r-loading">Novel ini belum punya bab.</p>
            </div>
          </div>
        ) : (
          <ReaderContent
            projectId={projectId}
            chapter={activeChapter}
            chapterIndex={activeChapterIndex}
            chapters={chapters}
            illustrations={illustrations}
            characters={characters}
            worldEntries={worldEntries}
            onChapterChange={handleChapterChange}
          />
        )}
      </div>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ReaderContent_Page />
    </Suspense>
  );
}
