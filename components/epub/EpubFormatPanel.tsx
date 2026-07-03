/**
 * EpubFormatPanel Component
 * Format settings panel for text customization
 */

interface FormatSettings {
  lineHeight: number;
  paraSpacing: number;
  textAlign: string;
  paraIndent: number;
}

interface EpubFormatPanelProps {
  isOpen: boolean;
  settings: FormatSettings;
  onUpdateSettings: (settings: Partial<FormatSettings>) => void;
  onReset: () => void;
}

export function EpubFormatPanel({
  isOpen,
  settings,
  onUpdateSettings,
  onReset,
}: EpubFormatPanelProps) {
  const lineHeights = [
    { value: 1.4, label: 'Padat' },
    { value: 1.6, label: 'Normal' },
    { value: 1.8, label: 'Lapang' },
    { value: 2.0, label: 'Luas' },
  ];

  const paraSpacings = [
    { value: 0.5, label: 'Kecil' },
    { value: 1.0, label: 'Normal' },
    { value: 1.5, label: 'Besar' },
  ];

  const textAligns = [
    { value: 'left', icon: 'ti-align-left', label: 'Rata kiri' },
    { value: 'center', icon: 'ti-align-center', label: 'Rata tengah' },
    { value: 'right', icon: 'ti-align-right', label: 'Rata kanan' },
    { value: 'justify', icon: 'ti-align-justified', label: 'Rata kanan-kiri' },
  ];

  const paraIndents = [
    { value: 0, label: 'Tidak Ada' },
    { value: 1.5, label: 'Kecil' },
    { value: 3.0, label: 'Sedang' },
  ];

  return (
    <aside
      className={`ep-format-panel ${isOpen ? '' : 'collapsed'}`}
      id="ep-format-panel"
    >
      <div className="ep-format-header">
        <p>Pengaturan Format</p>
      </div>
      <div className="ep-format-body">
        {/* Line Height */}
        <div className="ep-format-group">
          <label className="ep-format-label">Tinggi Baris</label>
          <div className="ep-format-controls">
            {lineHeights.map(({ value, label }) => (
              <button
                key={value}
                className={`ep-format-btn ${settings.lineHeight === value ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ lineHeight: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Paragraph Spacing */}
        <div className="ep-format-group">
          <label className="ep-format-label">Spasi Paragraf</label>
          <div className="ep-format-controls">
            {paraSpacings.map(({ value, label }) => (
              <button
                key={value}
                className={`ep-format-btn ${settings.paraSpacing === value ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ paraSpacing: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Alignment */}
        <div className="ep-format-group">
          <label className="ep-format-label">Perataan Teks</label>
          <div className="ep-format-controls">
            {textAligns.map(({ value, icon, label }) => (
              <button
                key={value}
                className={`ep-format-btn icon ${settings.textAlign === value ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ textAlign: value })}
                title={label}
              >
                <i className={`ti ${icon}`} aria-hidden="true"></i>
              </button>
            ))}
          </div>
        </div>

        {/* Paragraph Indent */}
        <div className="ep-format-group">
          <label className="ep-format-label">Indentasi Paragraf</label>
          <div className="ep-format-controls">
            {paraIndents.map(({ value, label }) => (
              <button
                key={value}
                className={`ep-format-btn ${settings.paraIndent === value ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ paraIndent: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <div className="ep-format-group">
          <button
            className="ep-format-reset-btn"
            id="format-reset-btn"
            onClick={onReset}
          >
            <i className="ti ti-refresh" aria-hidden="true"></i> Reset ke Default
          </button>
        </div>
      </div>
    </aside>
  );
}
