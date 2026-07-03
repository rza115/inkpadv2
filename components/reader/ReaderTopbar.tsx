/**
 * ReaderTopbar Component
 * Top navigation bar with reader controls
 */

import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui';
import { useReaderStore, FONT_FAMILIES, TEXT_ALIGNS } from '@/store/useReaderStore';
import type { FontFamily, TextAlign } from '@/types/reader';

interface ReaderTopbarProps {
  projectId: string | null;
  chapterTitle: string;
  onTOCToggle: () => void;
}

export function ReaderTopbar({ projectId, chapterTitle, onTOCToggle }: ReaderTopbarProps) {
  const router = useRouter();
  const {
    preferences,
    setFontSize,
    setFontFamily,
    setTextAlign,
    cycleWidth,
  } = useReaderStore();

  const handleBack = () => {
    if (projectId) {
      router.push(`/manuscript?project=${projectId}`);
    } else {
      router.push('/');
    }
  };

  const handleThemeToggle = () => {
    // Access global theme toggle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).InkpadTheme) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).InkpadTheme.toggle();
    }
  };

  const getThemeIcon = () => {
    if (typeof window === 'undefined') return 'ti ti-sun';
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const theme = (window as any).InkpadTheme?.getCurrent?.() || 'light';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const themes = (window as any).InkpadTheme?.getThemes?.() || [
      { id: 'light', icon: 'ti ti-sun' },
      { id: 'dark', icon: 'ti ti-moon' }
    ];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentIdx = themes.findIndex((t: any) => t.id === theme);
    const nextIdx = (currentIdx + 1) % themes.length;
    return themes[nextIdx]?.icon || 'ti ti-sun';
  };

  return (
    <div className="r-topbar">
      <div className="r-topbar-left">
        <button
          id="back-btn"
          className="r-btn"
          onClick={handleBack}
          title="Kembali"
        >
          <i className="ti ti-arrow-left" aria-hidden="true"></i>
        </button>
        <button
          id="toc-btn"
          className="r-btn"
          onClick={onTOCToggle}
          title="Daftar bab"
        >
          <i className="ti ti-list" aria-hidden="true"></i>
        </button>
        <h2 id="topbar-title">{chapterTitle}</h2>
      </div>

      <div className="r-topbar-right">
        {/* Font Family */}
        <Select
          id="font-family-select"
          value={preferences.fontFamily}
          onChange={(e) => setFontFamily(e.target.value as FontFamily)}
          style={{ width: '120px' }}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font.charAt(0).toUpperCase() + font.slice(1)}
            </option>
          ))}
        </Select>

        {/* Font Size Controls */}
        <button
          id="font-sm"
          className="r-btn"
          onClick={() => setFontSize('decrease')}
          title="Perkecil teks"
        >
          <i className="ti ti-letter-a" aria-hidden="true"></i>
        </button>
        <button
          id="font-lg"
          className="r-btn"
          onClick={() => setFontSize('increase')}
          title="Perbesar teks"
        >
          <i className="ti ti-letter-a-small" aria-hidden="true"></i>
        </button>

        {/* Text Alignment */}
        {TEXT_ALIGNS.map((align) => (
          <button
            key={align}
            className={`r-btn${preferences.textAlign === align ? ' active' : ''}`}
            data-text-align={align}
            onClick={() => setTextAlign(align as TextAlign)}
            title={`Rata ${align === 'left' ? 'kiri' : align === 'right' ? 'kanan' : 'kiri-kanan'}`}
          >
            <i
              className={`ti ti-align-${align === 'justify' ? 'justified' : align}`}
              aria-hidden="true"
            ></i>
          </button>
        ))}

        {/* Width Toggle */}
        <button
          id="width-btn"
          className="r-btn"
          onClick={cycleWidth}
          title="Ubah lebar kolom"
        >
          <i className="ti ti-layout-columns" aria-hidden="true"></i>
        </button>

        {/* Theme Toggle */}
        <button
          id="theme-btn"
          className="r-btn"
          onClick={handleThemeToggle}
          title="Ganti tema"
        >
          <i className={getThemeIcon()} aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}
