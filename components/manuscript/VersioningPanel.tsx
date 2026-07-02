/**
 * VersioningPanel Component
 * Chapter version history and snapshots
 */
'use client';

import { useState } from 'react';

interface VersioningPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersioningPanel({ isOpen, onClose }: VersioningPanelProps) {
  const [label, setLabel] = useState('');
  const [versions, setVersions] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // TODO: Implement version save logic
    alert('Fitur versioning akan diimplementasikan.');
  };

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
        <div className="versioning-save-section">
          <div className="versioning-save-row">
            <input
              type="text"
              placeholder="Label (opsional, misal: Sebelum revisi)"
              maxLength={100}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <button className="versioning-save-btn" onClick={handleSave}>
              <i className="ti ti-device-floppy" aria-hidden="true"></i> Simpan
            </button>
          </div>
          <p className="versioning-save-hint">Simpan snapshot konten saat ini sebelum melakukan revisi besar.</p>
        </div>
        <div className="versioning-list">
          {versions.length === 0 ? (
            <div className="versioning-empty">
              <i className="ti ti-history" aria-hidden="true"></i>
              <p>Belum ada versi tersimpan.</p>
              <p>Simpan versi sebelum melakukan revisi besar agar bisa kembali.</p>
            </div>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="version-item">
                {/* Version items will go here */}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}