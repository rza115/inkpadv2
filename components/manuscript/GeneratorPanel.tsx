/**
 * GeneratorPanel Component
 * AI Generator for creative writing ideas
 */
'use client';

import { useState } from 'react';

interface GeneratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (text: string) => void;
}

export function GeneratorPanel({ isOpen, onClose, onInsert }: GeneratorPanelProps) {
  const [generatorType, setGeneratorType] = useState('character');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setOutput('');
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: generatorType }),
      });
      
      if (!response.ok) throw new Error('Gagal generate');
      
      const data = await response.json();
      setOutput(data.result || 'Tidak ada hasil.');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    alert('Disalin ke clipboard!');
  };

  const handleInsert = () => {
    if (onInsert) onInsert(output);
    onClose();
  };

  return (
    <>
      <div className="generator-overlay" onClick={onClose}></div>
      <aside className="generator-panel">
        <div className="generator-header">
          <h2><i className="ti ti-dice" aria-hidden="true"></i> AI Generator</h2>
          <button className="generator-close-btn" onClick={onClose} title="Tutup (Esc)">
            <i className="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>
        <div className="generator-controls">
          <div className="generator-type-row">
            <label>Jenis:</label>
            <select
              className="generator-type-select"
              value={generatorType}
              onChange={(e) => setGeneratorType(e.target.value)}
              title="Jenis generator"
            >
              <option value="character">Nama Karakter</option>
              <option value="location">Nama Tempat</option>
              <option value="plot-twist">Plot Twist</option>
              <option value="dialog">Dialog Prompt</option>
              <option value="item">Benda / Artefak</option>
              <option value="conflict">Konflik Cerita</option>
            </select>
          </div>
          <button className="generator-generate-btn" onClick={handleGenerate} disabled={loading}>
            <i className="ti ti-sparkles" aria-hidden="true"></i> Generate dengan AI
          </button>
          <p className="generator-hint">Menggunakan Gemini API untuk menghasilkan ide cerita kreatif.</p>
        </div>
        <div className="generator-body">
          {loading && (
            <div className="generator-loading">
              <div className="generator-spinner"></div>
              <p>Sedang menggenerate ide…</p>
            </div>
          )}
          {error && (
            <div className="generator-error">
              <i className="ti ti-alert-circle" aria-hidden="true"></i>
              <p>{error}</p>
            </div>
          )}
          {output && (
            <div className="generator-output">
              <pre>{output}</pre>
            </div>
          )}
        </div>
        {output && (
          <div className="generator-actions">
            <button className="generator-action-btn" onClick={handleCopy}>
              <i className="ti ti-copy" aria-hidden="true"></i> Salin
            </button>
            <button className="generator-action-btn primary" onClick={handleInsert}>
              <i className="ti ti-arrow-bar-to-down" aria-hidden="true"></i> Pakai di Editor
            </button>
          </div>
        )}
      </aside>
    </>
  );
}