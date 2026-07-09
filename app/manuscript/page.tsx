"use client";

import { Suspense } from "react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Nav } from "@/components/Nav";
import { Loading } from "@/components/ui";
import { ChapterPanel } from "@/components/manuscript/ChapterPanel";
import { EditorPanel } from "@/components/manuscript/EditorPanel";
import { ContextPanel } from "@/components/manuscript/ContextPanel";
import { SearchPanel } from "@/components/manuscript/SearchPanel";
import { GeneratorPanel } from "@/components/manuscript/GeneratorPanel";
import { VersioningPanel } from "@/components/manuscript/VersioningPanel";
import { useChapterStore } from "@/store/useChapterStore";
import { createClient } from '@/lib/supabase/client';

function ManuscriptContent() {
  const { isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  
  const { 
    loadChapters, 
    loadAllCharacters, 
    loadAllWorldEntries, 
    chapters, 
    activeChapter, 
    selectChapter 
  } = useChapterStore();
  
  const initialized = useRef(false);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    if (!projectId || initialized.current) return;
    initialized.current = true;

    // Load data
    loadChapters(projectId);
    loadAllCharacters(projectId);
    loadAllWorldEntries(projectId);
    
    // Load project title
    (async () => {
      const { data } = await createClient()
        .from('projects')
        .select('title')
        .eq('id', projectId)
        .single();
      if (data) setProjectTitle(data.title);
    })();
  }, [projectId, loadChapters, loadAllCharacters, loadAllWorldEntries]);

  // Auto-select first chapter after loading (if no last chapter saved)
  useEffect(() => {
    if (chapters.length === 0 || activeChapter) return;
    
    // Check for last saved chapter
    try {
      const key = `inkpad:manuscript:lastChapter:${projectId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const lastChapter = JSON.parse(saved);
        const exists = chapters.find(c => c.id === lastChapter.chapterId);
        if (exists) {
          // Don't auto-select, show empty state with continue button
          return;
        }
      }
    } catch (_) {}
    
    // Auto-select first chapter
    selectChapter(chapters[0].id);
  }, [chapters, activeChapter, selectChapter, projectId]);

  if (authLoading) {
    return (
      <Nav layout="project" title="Memuat…" projectId={projectId}>
        <main id="page-main">
          <Loading message="Memuat…" />
        </main>
      </Nav>
    );
  }

  if (!projectId) {
    return (
      <Nav layout="project" title="Novel tidak ditemukan" projectId={null}>
        <main id="page-main">
          <p className="muted" style={{ padding: "24px" }}>
            Nggak ada novel yang dipilih. Balik ke <a href="/">Project Hub</a>.
          </p>
        </main>
      </Nav>
    );
  }

  return (
    <Nav layout="project" title={projectTitle ?? 'Memuat…'} projectId={projectId}>
      <main id="page-main" className="flex flex-1 min-h-0 overflow-hidden">
        <ChapterPanel projectId={projectId} />
        <EditorPanel projectId={projectId} />
        <ContextPanel projectId={projectId} />
      </main>
    </Nav>
  );
}

export default function ManuscriptPage() {
  return (
    <Suspense fallback={
      <Nav layout="project" title="Memuat…" projectId={null}>
        <main id="page-main">
          <Loading message="Memuat…" />
        </main>
      </Nav>
    }>
      <ManuscriptContent />
    </Suspense>
  );
}