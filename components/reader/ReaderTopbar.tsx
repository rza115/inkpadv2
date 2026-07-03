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
    <div className="h-12 flex items-center gap-3 px-4 pt-[env(safe-area-inset-top,0px)] border-b border-[var(--border)] shrink-0 bg-[var(--bg)] z-40 w-full max-w-full min-w-0 max-md:h-auto max-md:min-h-[calc(48px+env(safe-area-inset-top,0px))] max-md:grid max-md:grid-cols-[auto_auto_1fr] max-md:grid-rows-[auto_auto] max-md:p-[max(8px,env(safe-area-inset-top,0px))_12px_8px] max-md:gap-2">
      <button
        id="back-btn"
        className="flex items-center gap-1.5 bg-transparent border border-[var(--border)] text-[var(--text)] rounded-md px-2.5 py-1 text-xs cursor-pointer whitespace-nowrap hover:border-[var(--accent)] hover:text-[var(--accent)] max-md:col-[1] max-md:row-[1] max-md:px-2 max-md:text-[11px]"
        onClick={handleBack}
        title="Kembali"
      >
        <i className="ti ti-arrow-left" aria-hidden="true"></i>
      </button>
      <button
        id="toc-btn"
        className="flex items-center gap-1.5 bg-transparent border border-[var(--border)] text-[var(--text)] rounded-md px-2.5 py-1 text-xs cursor-pointer whitespace-nowrap hover:border-[var(--accent)] hover:text-[var(--accent)] max-md:col-[2] max-md:row-[1] max-md:px-2 max-md:text-[11px]"
        onClick={onTOCToggle}
        title="Daftar bab"
      >
        <i className="ti ti-list" aria-hidden="true"></i>
      </button>
      <h2 className="flex-1 min-w-0 text-center font-['Playfair_Display',serif] text-sm overflow-hidden text-ellipsis whitespace-nowrap text-[var(--text-muted)] max-md:hidden">{chapterTitle}</h2>

      <div className="flex gap-1.5 items-center shrink-0 min-w-0 max-md:col-[1/-1] max-md:row-[2] max-md:justify-start max-md:overflow-x-auto max-md:[-webkit-overflow-scrolling:touch] max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden">
        {/* Font Family */}
        <Select
          id="font-family-select"
          value={preferences.fontFamily}
          onChange={(e) => setFontFamily(e.target.value as FontFamily)}
          className="bg-transparent border border-[var(--border)] text-[var(--text-muted)] rounded-md h-7 px-2 pr-6 text-[11px] cursor-pointer appearance-none max-w-[108px] hover:text-[var(--text)] hover:border-[var(--accent)] focus:text-[var(--text)] focus:border-[var(--accent)] focus:outline-none max-md:max-w-[88px] max-md:text-[10px]"
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
          className="flex items-center justify-center bg-transparent border border-[var(--border)] text-[var(--text-muted)] rounded-md w-[30px] h-7 text-xs cursor-pointer hover:text-[var(--text)] hover:border-[var(--accent)]"
          onClick={() => setFontSize('decrease')}
          title="Perkecil teks"
        >
          <i className="ti ti-letter-a" aria-hidden="true"></i>
        </button>
        <button
          id="font-lg"
          className="flex items-center justify-center bg-transparent border border-[var(--border)] text-[var(--text-muted)] rounded-md w-[30px] h-7 text-xs cursor-pointer hover:text-[var(--text)] hover:border-[var(--accent)]"
          onClick={() => setFontSize('increase')}
          title="Perbesar teks"
        >
          <i className="ti ti-letter-a-small" aria-hidden="true"></i>
        </button>

        {/* Text Alignment */}
        {TEXT_ALIGNS.map((align) => (
          <button
            key={align}
            className={`flex items-center justify-center bg-transparent border border-[var(--border)] rounded-md w-[30px] h-7 text-xs cursor-pointer hover:text-[var(--text)] hover:border-[var(--accent)] ${preferences.textAlign === align ? 'border-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
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
          className="flex items-center justify-center bg-transparent border border-[var(--border)] text-[var(--text-muted)] rounded-md w-[30px] h-7 text-xs cursor-pointer hover:text-[var(--text)] hover:border-[var(--accent)]"
          onClick={cycleWidth}
          title="Ubah lebar kolom"
        >
          <i className="ti ti-layout-columns" aria-hidden="true"></i>
        </button>

        {/* Theme Toggle */}
        <button
          id="theme-btn"
          className="flex items-center justify-center bg-transparent border border-[var(--border)] text-[var(--text-muted)] rounded-md w-[30px] h-7 text-xs cursor-pointer hover:text-[var(--text)] hover:border-[var(--accent)]"
          onClick={handleThemeToggle}
          title="Ganti tema"
        >
          <i className={getThemeIcon()} aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}
