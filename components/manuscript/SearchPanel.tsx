/**
 * SearchPanel Component
 * Global search and replace across all chapters
 */
'use client';

import { useState } from 'react';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  if (!isOpen) return null;

  return (
    <>
      <div className="search-overlay" onClick={onClose}></div>
      <aside className="search-panel">
        <div className="search-header">
          <h2><i className="ti ti-search" aria-hidden="true"></i> Cari & Ganti</h2>
          <button className="search-close-btn" onClick={onClose} title="Tutup (Esc)">
            <i className="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>
        <div className="search-inputs">
          <div className="search-input-wrap">
            <span className="search-input-icon"><i className="ti ti-search" aria-hidden="true"></i></span>
            <input
              type="text"
              className="search-input"
              placeholder="Cari di semua bab…"
              autoComplete="off"
              spellCheck="false"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="search-nav-btns">
              <button className="search-nav-btn" title="Sebelumnya (Shift+Enter)">
                <i className="ti ti-chevron-up" aria-hidden="true"></i>
              </button>
              <button className="search-nav-btn" title="Berikutnya (Enter)">
                <i className="ti ti-chevron-down" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div className="search-input-wrap">
            <input
              type="text"
              className="search-replace-input"
              placeholder="Ganti dengan…"
              autoComplete="off"
              spellCheck="false"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="search-options">
          <label className="search-option">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} /> Case sensitive
          </label>
          <label className="search-option">
            <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} /> Whole word
          </label>
          <label className="search-option">
            Filter: <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Semua status</option>
              <option value="draft">Draft</option>
              <option value="revisi">Revisi</option>
              <option value="final">Final</option>
            </select>
          </label>
        </div>
        <div className="search-replace-actions">
          <button className="search-replace-btn">
            <i className="ti ti-arrow-bar-to-down" aria-hidden="true"></i> Ganti
          </button>
          <button className="search-replace-btn-outline">
            <i className="ti ti-arrows-exchange" aria-hidden="true"></i> Ganti Semua
          </button>
        </div>
        <div className="search-stats"></div>
        <div className="search-results">
          <div className="search-empty">
            <i className="ti ti-search" aria-hidden="true"></i>
            <p>Ketik kata kunci untuk mencari di semua bab.</p>
          </div>
        </div>
      </aside>
    </>
  );
}