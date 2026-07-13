/**
 * AIPolishModal Component
 * AI-assisted text polishing for the selected text in the manuscript editor.
 * Sends the selection to /api/gemini and lets the user replace it with the
 * polished result.
 */
'use client';

import { useState, useEffect } from 'react';

interface AIPolishModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onApply: (newText: string) => void;
}

export function AIPolishModal({ isOpen, onClose, selectedText, onApply }: AIPolishModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');

  const handlePolish = async () => {
    setLoading(true);
    setError('');
    setOutput('');

    try {
      const prompt =
        'Rapikan dan perbaiki teks berikut dari segi tata bahasa, kejelasan, dan alur kalimat, ' +
        'tanpa mengubah makna, gaya bercerita, atau sudut pandang penulisnya. ' +
        'Kembalikan HANYA teks hasil polish, tanpa komentar, judul, atau tanda kutip tambahan.\n\n' +
        selectedText;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memproses teks');

      setOutput(data.result || 'Tidak ada hasil.');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run polish every time the modal opens with a fresh selection
  useEffect(() => {
    if (isOpen) {
      setOutput('');
      setError('');
      handlePolish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  const handleApply = () => {
    onApply(output);
    onClose();
  };

  const wordCount = selectedText.trim() ? selectedText.trim().split(/\s+/).length : 0;

  return (
    <>
      <div className="generator-overlay" onClick={onClose}></div>
      <aside className="generator-panel">
        <div className="generator-header">
          <h2><i className="ti ti-sparkles" aria-hidden="true"></i> AI Polish</h2>
          <button className="generator-close-btn" onClick={onClose} title="Tutup (Esc)">
            <i className="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <div className="generator-controls">
          <p className="generator-hint">
            Merapikan {wordCount} kata yang diseleksi menggunakan Gemini API.
          </p>
          <button className="generator-generate-btn" onClick={handlePolish} disabled={loading}>
            <i className="ti ti-refresh" aria-hidden="true"></i> {output ? 'Polish Ulang' : 'Polish Sekarang'}
          </button>
        </div>

        <div className="generator-body">
          {loading && (
            <div className="generator-loading">
              <div className="generator-spinner"></div>
              <p>Sedang merapikan teks…</p>
            </div>
          )}
          {error && (
            <div className="generator-error">
              <i className="ti ti-alert-circle" aria-hidden="true"></i>
              <p>{error}</p>
            </div>
          )}
          {output && !loading && (
            <div className="generator-output">
              <pre>{output}</pre>
            </div>
          )}
        </div>

        {output && !loading && (
          <div className="generator-actions">
            <button className="generator-action-btn" onClick={handleCopy}>
              <i className="ti ti-copy" aria-hidden="true"></i> Salin
            </button>
            <button className="generator-action-btn primary" onClick={handleApply}>
              <i className="ti ti-replace" aria-hidden="true"></i> Ganti Teks Terpilih
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
