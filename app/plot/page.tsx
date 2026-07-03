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

  // Load CSS
  useEffect(() => {
    const cssFiles = ['/css/base.css', '/css/layout.css', '/css/components.css'];
    cssFiles.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

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
  };

  const handleDeleteArc = async () => {
    if (!editingArc) return;
    await deleteArc(editingArc.id);
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
  };

  const handleDeleteForeshadow = async () => {
    if (!editingForeshadow) return;
    await deleteForeshadow(editingForeshadow.id);
  };

  const handleToggleForeshadowStatus = async (foreshadow: Foreshadow) => {
    try {
      await toggleForeshadowStatus(foreshadow.id);
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDeleteForeshadowDirect = async (foreshadow: Foreshadow) => {
    try {
      await deleteForeshadow(foreshadow.id);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (!projectId) {
    return (
      <Nav layout="project" title="Plot">
        <main id="page-main">
          <p className="muted" style={{ padding: '24px' }}>
            Tidak ada novel yang dipilih. Kembali ke <Link href="/">Project Hub</Link>.
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
          <div className="plot-shell">
            {/* Arc Tracker */}
            <div className="section-header">
              <h1 className="section-title">Arc</h1>
              <button className="ghost" onClick={handleNewArc}>
                <i className="ti ti-plus" aria-hidden="true"></i> Arc baru
              </button>
            </div>
            <div className="arc-grid" id="arc-grid">
              {isLoading && arcs.length === 0 && (
                <p className="empty-msg">Memuat…</p>
              )}
              {!isLoading && arcs.length === 0 && (
                <p className="empty-msg">Belum ada arc. Klik &quot;Arc baru&quot; buat mulai.</p>
              )}
              {arcs.map((arc) => (
                <ArcCard key={arc.id} arc={arc} onClick={handleEditArc} />
              ))}
            </div>

            {/* Foreshadow Log */}
            <div className="section-divider">
              <div className="section-header">
                <h1 className="section-title">Foreshadow Log</h1>
                <button className="ghost" onClick={handleNewForeshadow}>
                  <i className="ti ti-plus" aria-hidden="true"></i> Tambah
                </button>
              </div>
              <div className="foreshadow-list" id="foreshadow-list">
                {isLoading && foreshadows.length === 0 && (
                  <p className="empty-msg">Memuat…</p>
                )}
                {!isLoading && foreshadows.length === 0 && (
                  <p className="empty-msg">Belum ada entri foreshadow.</p>
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
