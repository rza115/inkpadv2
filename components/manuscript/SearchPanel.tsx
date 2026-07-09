/**
 * SearchPanel Component
 * Global search and replace across all chapters
 */
'use client';

import { useState, useCallback } from 'react';
import { useChapterStore } from '@/store/useChapterStore';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  line: string;
  lineIndex: number;
}

export function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const chapters = useChapterStore((s) => s.chapters);

  const performSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const query = searchQuery.trim();
    const found: SearchResult[] = [];

    chapters.forEach((ch) => {
      if (statusFilter !== 'all' && ch.status !== statusFilter) return;

      const content = ch.content || '';
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        let match = false;
        const testLine = caseSensitive ? line : line.toLowerCase();
        const testQuery = caseSensitive ? query : query.toLowerCase();

        if (wholeWord) {
          const regex = new RegExp(`\\b${testQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
          match = regex.test(testLine);
        } else {
          match = testLine.includes(testQuery);
        }

        if (match) {
          found.push({
            chapterId: ch.id,
            chapterTitle: ch.title || 'Tanpa judul',
            line: line.trim(),
            lineIndex: idx + 1,
          });
        }
      });
    });

    setResults(found);
    setCurrentResultIndex(0);
    setHasSearched(true);
  }, [searchQuery, chapters, caseSensitive, wholeWord, statusFilter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        // Navigate previous
        setCurrentResultIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else {
        // Navigate next after search
        if (!hasSearched) {
          performSearch();
        } else if (results.length > 0) {
          setCurrentResultIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        }
      }
    }
  };

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
              onKeyDown={handleKeyDown}
            />
            <div className="search-nav-btns">
              <button className="search-nav-btn" title="Sebelumnya (Shift+Enter)" onClick={() => setCurrentResultIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))}>
                <i className="ti ti-chevron-up" aria-hidden="true"></i>
              </button>
              <button className="search-nav-btn" title="Berikutnya (Enter)" onClick={() => {
                if (!hasSearched) { performSearch(); return; }
                setCurrentResultIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
              }}>
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
          <button className="search-replace-btn" onClick={performSearch}>
            <i className="ti ti-arrow-bar-to-down" aria-hidden="true"></i> Ganti
          </button>
          <button className="search-replace-btn-outline">
            <i className="ti ti-arrows-exchange" aria-hidden="true"></i> Ganti Semua
          </button>
        </div>
        <div className="search-stats">
          {hasSearched && (
            <span>{results.length} hasil {results.length > 0 && `(${currentResultIndex + 1}/${results.length})`}</span>
          )}
        </div>
        <div className="search-results">
          {!hasSearched ? (
            <div className="search-empty">
              <i className="ti ti-search" aria-hidden="true"></i>
              <p>Ketik kata kunci untuk mencari di semua bab.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <i className="ti ti-search" aria-hidden="true"></i>
              <p>Tidak ada hasil.</p>
            </div>
          ) : (
            results.map((r, idx) => (
              <div
                key={`${r.chapterId}-${r.lineIndex}-${idx}`}
                className={`search-result-item ${idx === currentResultIndex ? 'search-result-active' : ''}`}
                onClick={() => setCurrentResultIndex(idx)}
              >
                <div className="search-result-chapter">{r.chapterTitle}</div>
                <div className="search-result-line">Baris {r.lineIndex}: {r.line}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}