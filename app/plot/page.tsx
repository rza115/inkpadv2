"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Loading } from "@/components/ui";
import { useProjectStore } from "@/store/useProjectStore";
import { useChapterStore } from "@/store/useChapterStore";
import { usePlotStore } from "@/store/usePlotStore";
import { ArcCard } from "@/components/plot/ArcCard";
import { ArcModal } from "@/components/plot/ArcModal";
import { ForeshadowItem } from "@/components/plot/ForeshadowItem";
import { ForeshadowModal } from "@/components/plot/ForeshadowModal";
import type { Arc, Foreshadow, ArcFormData, ForeshadowFormData } from "@/types/plot";
import type { Project } from "@/types/project";

function PlotContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("project");

  const { projects } = useProjectStore();
  const { chapters, loadChapters } = useChapterStore();
  const {
    arcs,
    foreshadows,
    isLoading,
    fetchArcs,
    fetchForeshadows,
    createArc,
    updateArc,
    deleteArc,
    createForeshadow,
    updateForeshadow,
    deleteForeshadow,
    toggleForeshadowStatus,
  } = usePlotStore();

  const [project, setProject] = useState<Project | null>(null);
  const [isArcModalOpen, setIsArcModalOpen] = useState(false);
  const [editingArc, setEditingArc] = useState<Arc | null>(null);
  const [isForeshadowModalOpen, setIsForeshadowModalOpen] = useState(false);
  const [editingForeshadow, setEditingForeshadow] = useState<Foreshadow | null>(null);

  // Load project and data
  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      try {
        // Find project from store
        const proj = projects.find(p => p.id === projectId);
        setProject(proj || null);
        
        await Promise.all([
          loadChapters(projectId),
          fetchArcs(projectId),
          fetchForeshadows(projectId),
        ]);
      } catch (error) {
        console.error('Failed to load plot data:', error);
      }
    };

    loadData();
  }, [projectId, projects, loadChapters, fetchArcs, fetchForeshadows]);

  // Arc handlers
  const handleNewArc = () => {
    setEditingArc(null);
    setIsArcModalOpen(true);
  };

  const handleEditArc = (arc: Arc) => {
    setEditingArc(arc);
    setIsArcModalOpen(true);
  };

  const handleSaveArc = async (data: ArcFormData) => {
    if (!projectId) return;

    if (editingArc) {
      await updateArc(editingArc.id, data);
    } else {
      await createArc(projectId, data);
    }
    setIsArcModalOpen(false);
    setEditingArc(null);
  };

  const handleDeleteArc = async () => {
    if (!editingArc) return;
    const confirmed = confirm(`Hapus arc "${editingArc.title}"?`);
    if (confirmed) {
      await deleteArc(editingArc.id);
      setIsArcModalOpen(false);
      setEditingArc(null);
    }
  };

  // Foreshadow handlers
  const handleNewForeshadow = () => {
    setEditingForeshadow(null);
    setIsForeshadowModalOpen(true);
  };

  const handleEditForeshadow = (foreshadow: Foreshadow) => {
    setEditingForeshadow(foreshadow);
    setIsForeshadowModalOpen(true);
  };

  const handleSaveForeshadow = async (data: ForeshadowFormData) => {
    if (!projectId) return;

    if (editingForeshadow) {
      await updateForeshadow(editingForeshadow.id, data);
    } else {
      await createForeshadow(projectId, data);
    }
    setIsForeshadowModalOpen(false);
    setEditingForeshadow(null);
  };

  const handleDeleteForeshadow = async () => {
    if (!editingForeshadow) return;
    const confirmed = confirm('Hapus entri foreshadow ini?');
    if (confirmed) {
      await deleteForeshadow(editingForeshadow.id);
      setIsForeshadowModalOpen(false);
      setEditingForeshadow(null);
    }
  };

  const handleDeleteForeshadowDirect = async (foreshadow: Foreshadow) => {
    await deleteForeshadow(foreshadow.id);
  };

  const handleToggleForeshadowStatus = async (foreshadow: Foreshadow) => {
    await toggleForeshadowStatus(foreshadow.id);
  };

  if (!projectId) {
    return (
      <Nav layout="project" title="Plot">
        <main id="page-main">
          <p className="text-muted text-sm p-6">
            Tidak ada novel yang dipilih. Kembali ke <Link href="/" className="text-accent-deep underline">Project Hub</Link>.
          </p>
        </main>
      </Nav>
    );
  }

  const pageTitle = project ? `Plot — ${project.title}` : 'Plot';

  return (
    <>
      <Nav layout="project" title={pageTitle} projectId={projectId}>
        <main id="page-main">
          <div className="max-w-[1000px]">
            {/* Arc Tracker */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-serif text-xl font-semibold">Arc</h1>
              <button 
                className="px-3 py-1.5 bg-transparent border border-default text-primary rounded-[var(--radius)] text-sm cursor-pointer transition-colors hover:border-accent hover:text-accent"
                onClick={handleNewArc}
              >
                <i className="ti ti-plus" aria-hidden="true"></i> Arc baru
              </button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 mb-12">
              {isLoading && arcs.length === 0 && (
                <p className="text-muted text-sm">Memuat…</p>
              )}
              {!isLoading && arcs.length === 0 && (
                <p className="text-muted text-sm">Belum ada arc. Klik &quot;Arc baru&quot; buat mulai.</p>
              )}
              {arcs.map((arc) => (
                <ArcCard key={arc.id} arc={arc} onClick={handleEditArc} />
              ))}
            </div>

            {/* Foreshadow Log */}
            <div className="border-t border-default pt-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="font-serif text-xl font-semibold">Foreshadow Log</h1>
                <button 
                  className="px-3 py-1.5 bg-transparent border border-default text-primary rounded-[var(--radius)] text-sm cursor-pointer transition-colors hover:border-accent hover:text-accent"
                  onClick={handleNewForeshadow}
                >
                  <i className="ti ti-plus" aria-hidden="true"></i> Tambah
                </button>
              </div>
              <div className="border border-default rounded-[var(--radius-lg)] overflow-hidden">
                {isLoading && foreshadows.length === 0 && (
                  <p className="text-muted text-sm p-4">Memuat…</p>
                )}
                {!isLoading && foreshadows.length === 0 && (
                  <p className="text-muted text-sm p-4">Belum ada entri foreshadow.</p>
                )}
                {foreshadows.map((foreshadow) => (
                  <ForeshadowItem
                    key={foreshadow.id}
                    foreshadow={foreshadow}
                    onEdit={handleEditForeshadow}
                    onToggleStatus={handleToggleForeshadowStatus}
                    onDelete={handleDeleteForeshadowDirect}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      </Nav>

      {/* Arc Modal */}
      <ArcModal
        isOpen={isArcModalOpen}
        onClose={() => setIsArcModalOpen(false)}
        onSave={handleSaveArc}
        onDelete={editingArc ? handleDeleteArc : undefined}
        editingArc={editingArc}
        chapters={chapters}
      />

      {/* Foreshadow Modal */}
      <ForeshadowModal
        isOpen={isForeshadowModalOpen}
        onClose={() => setIsForeshadowModalOpen(false)}
        onSave={handleSaveForeshadow}
        onDelete={editingForeshadow ? handleDeleteForeshadow : undefined}
        editingForeshadow={editingForeshadow}
        chapters={chapters}
      />
    </>
  );
}

export default function PlotPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PlotContent />
    </Suspense>
  );
}
