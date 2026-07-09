/**
 * VersioningPanel Component
 * Chapter version history and snapshots
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChapterStore } from '@/store/useChapterStore';
import type { ChapterVersion } from '@/types/chapter';

interface VersioningPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersioningPanel({ isOpen, onClose }: VersioningPanelProps) {
  const { activeChapter, versions, isLoading, error, loadVersions, saveVersion, deleteVersion, restoreVersion, clearVersions } = useChapterStore();
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<ChapterVersion | null>(null);

  // Load versions when panel opens & chapter changes
  useEffect(() => {
    if (isOpen && activeChapter) {
      loadVersions(activeChapter.id);
    }
    if (!isOpen) {
      clearVersions();
      setLabel('');
      setConfirmDelete(null);
      setPreviewVersion(null);
    }
  }, [isOpen, activeChapter?.id, loadVersions, clearVersions]);

  const showToast = useCallback((msg: string, err?: boolean) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = async () => {
    if (!activeChapter) return;
    setSaving(true);
    try {
      await saveVersion(activeChapter.id, activeChapter.title, activeChapter.content, activeChapter.word_count, label || undefined);
      setLabel('');
      showToast('Versi tersimpan');
    } catch (e: any) {
      showToast(e.message || 'Gagal simpan versi', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVersion(id);
      setConfirmDelete(null);
      showToast('Versi dihapus');
    } catch (e: any) {
      showToast(e.message || 'Gagal hapus versi', true);
    }
  };

  const handleRestore = async (v: ChapterVersion) => {
    try {
      await restoreVersion(v);
      showToast('Versi dipulihkan');
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Gagal pulihkan versi', true);
    }
  };

  const formatDate = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="versioning-overlay" onClick={onClose}></div>
      <aside className="versioning-panel">
        <div className="versioning-header">
          <h2><i className="ti ti-history" aria-hidden="true"></i> Riwayat Versi</h2>
          <button className="versioning-close-btn" onClick={onClose} title="Tutup">
            <i className="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        {!activeChapter ? (
          <div className="versioning-empty">
            <i className="ti ti-history" aria-hidden="true"></i>
            <p>Pilih bab untuk melihat riwayat versi.</p>
          </div>
        ) : (
          <>
            <div className="versioning-save-section">
              <div className="versioning-save-row">
                <input
                  type="text"
                  placeholder="Label (opsional, misal: Sebelum revisi)"
                  maxLength={100}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={saving}
                />
                <button className="versioning-save-btn" onClick={handleSave} disabled={saving}>
                  <i className={`ti ${saving ? 'ti-loader' : 'ti-device-floppy'}`} aria-hidden="true"></i>
                  {saving ? ' Menyimpan…' : ' Simpan'}
                </button>
              </div>
              <p className="versioning-save-hint">Simpan snapshot konten saat ini sebelum melakukan revisi besar.</p>
            </div>

            <div className="versioning-list">
              {isLoading ? (
                <div className="versioning-loading">Memuat riwayat versi…</div>
              ) : error ? (
                <div className="versioning-error">Error: {error}</div>
              ) : versions.length === 0 ? (
                <div className="versioning-empty">
                  <i className="ti ti-history" aria-hidden="true"></i>
                  <p>Belum ada versi tersimpan.</p>
                  <p>Simpan versi sebelum melakukan revisi besar agar bisa kembali.</p>
                </div>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="versioning-item">
                    <div className="versioning-item-header">
                      <span className="versioning-number">v{v.version_number}</span>
                      <span className="versioning-date">{formatDate(v.created_at)}</span>
                    </div>
                    <div className="versioning-item-body">
                      <span className="versioning-item-title">{v.title || 'Tanpa judul'}</span>
                      {v.label && <span className="versioning-label">{v.label}</span>}
                      <span className="versioning-words">{v.word_count?.toLocaleString('id-ID') || 0} kata</span>
                    </div>
                    <div className="versioning-item-actions">
                      <button
                        className="versioning-btn versioning-btn-preview"
                        title="Pratinjau"
                        onClick={() => setPreviewVersion(v)}
                      >
                        <i className="ti ti-eye" aria-hidden="true"></i>
                      </button>
                      <button
                        className="versioning-btn versioning-btn-restore"
                        title="Pulihkan versi ini"
                        onClick={() => {
                          if (confirm('Pulihkan versi ini? Konten bab saat ini akan ditimpa.')) {
                            handleRestore(v);
                          }
                        }}
                      >
                        <i className="ti ti-rotate-left" aria-hidden="true"></i>
                      </button>
                      {confirmDelete === v.id ? (
                        <>
                          <button
                            className="versioning-btn versioning-btn-delete"
                            title="Konfirmasi hapus"
                            onClick={() => handleDelete(v.id)}
                          >
                            <i className="ti ti-check" aria-hidden="true"></i>
                          </button>
                          <button
                            className="versioning-btn"
                            title="Batal"
                            onClick={() => setConfirmDelete(null)}
                          >
                            <i className="ti ti-x" aria-hidden="true"></i>
                          </button>
                        </>
                      ) : (
                        <button
                          className="versioning-btn versioning-btn-delete"
                          title="Hapus versi"
                          onClick={() => setConfirmDelete(v.id)}
                        >
                          <i className="ti ti-trash" aria-hidden="true"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Toast notification */}
        {toast && (
          <div className={`versioning-toast ${toast.err ? 'versioning-toast-error' : ''}`}>
            {toast.msg}
          </div>
        )}
      </aside>

      {/* Preview modal */}
      {previewVersion && (
        <div className="versioning-preview-modal">
          <div className="versioning-preview-backdrop" onClick={() => setPreviewVersion(null)}></div>
          <div className="versioning-preview-content">
            <div className="versioning-preview-header">
              <h3>v{previewVersion.version_number} — {previewVersion.title || 'Tanpa judul'}</h3>
              <div className="versioning-preview-meta">
                {formatDate(previewVersion.created_at)}
                {previewVersion.label && ` · ${previewVersion.label}`}
                {' · '}{previewVersion.word_count?.toLocaleString('id-ID') || 0} kata
              </div>
              <button className="versioning-preview-close" onClick={() => setPreviewVersion(null)}>
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>
            <div className="versioning-preview-body">
              <pre className="versioning-preview-text">{previewVersion.content || '(kosong)'}</pre>
            </div>
            <div className="versioning-preview-footer">
              <button
                className="versioning-btn versioning-btn-restore"
                onClick={() => {
                  setPreviewVersion(null);
                  if (confirm('Pulihkan versi ini? Konten bab saat ini akan ditimpa.')) {
                    handleRestore(previewVersion);
                  }
                }}
              >
                <i className="ti ti-rotate-left" aria-hidden="true"></i> Pulihkan versi ini
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}