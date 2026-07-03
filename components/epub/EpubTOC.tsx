/**
 * EpubTOC Component
 * Table of Contents sidebar for EPUB navigation
 */

import type { NavItem } from '@/hooks/useEpubReader';

interface EpubTOCProps {
  toc: NavItem[];
  isOpen: boolean;
  onNavigate: (href: string) => void;
}

export function EpubTOC({ toc, isOpen, onNavigate }: EpubTOCProps) {
  const renderNavItem = (item: NavItem, level = 0) => (
    <div key={item.id} style={{ paddingLeft: `${level * 12}px` }}>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate(item.href);
        }}
        style={{
          display: 'block',
          padding: '8px 12px',
          fontSize: level === 0 ? '14px' : '13px',
          color: 'var(--ep-text)',
          textDecoration: 'none',
          borderRadius: '4px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--ep-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {item.label}
      </a>
      {item.subitems && item.subitems.map((sub) => renderNavItem(sub, level + 1))}
    </div>
  );

  return (
    <aside className={`ep-toc ${isOpen ? '' : 'collapsed'}`} id="ep-toc">
      <div className="ep-toc-header">
        <p>Daftar Isi</p>
      </div>
      <nav className="ep-toc-list" id="ep-toc-list">
        {toc.length === 0 && (
          <p
            style={{
              padding: '16px',
              fontSize: '13px',
              color: 'var(--ep-muted)',
              textAlign: 'center',
            }}
          >
            Tidak ada daftar isi
          </p>
        )}
        {toc.map((item) => renderNavItem(item))}
      </nav>
    </aside>
  );
}
