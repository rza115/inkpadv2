/**
 * Nav Component
 * Replaces vanilla nav.js with React component
 * Provides topbar and sidebar navigation
 */
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';

interface NavItem {
  key: string;
  icon: string;
  label: string;
  href: string;
}

const SIDEBAR_ITEMS: NavItem[] = [
  { key: 'manuscript', icon: 'ti-file-text', label: 'Manuscript', href: '/manuscript' },
  { key: 'characters', icon: 'ti-users', label: 'Karakter', href: '/characters' },
  { key: 'world', icon: 'ti-world', label: 'Worldbuilding', href: '/worldbuilding' },
  { key: 'plot', icon: 'ti-list-details', label: 'Plot & foreshadow', href: '/plot' },
  { key: 'notes', icon: 'ti-notes', label: 'Quick notes', href: '/notes' },
  { key: 'epub-library', icon: 'ti-books', label: 'Perpustakaan EPUB', href: '/epub-library' },
];

interface NavProps {
  layout?: 'hub' | 'project';
  title?: string;
  projectId?: string | null;
  children?: React.ReactNode;
}

export function Nav({ layout = 'hub', title = 'Inkpad', projectId = null, children }: NavProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [syncCount, setSyncCount] = useState(0);

  const activePage = pathname?.split('/')[1] || 'hub';

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const updateSyncCount = () => {
      if (typeof window !== 'undefined' && (window as any).OfflineQueue) {
        (window as any).OfflineQueue.count().then((count: number) => {
          setSyncCount(count);
        });
      }
    };
    updateSyncCount();
    document.addEventListener('offline-queue-flushed', updateSyncCount);
    return () => {
      document.removeEventListener('offline-queue-flushed', updateSyncCount);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const getNavHref = (href: string) => {
    if (projectId) {
      return `${href}?project=${projectId}`;
    }
    return href;
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — becomes bottom nav on mobile */}
      {layout === 'project' && (
        <nav className="
          w-14 bg-[var(--surface)] border-r border-[var(--border)]
          flex flex-col items-center py-4 gap-[18px] shrink-0
          max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50
          max-md:w-full max-md:h-[calc(58px+env(safe-area-inset-bottom))]
          max-md:flex-row max-md:justify-around max-md:items-center
          max-md:py-2 max-md:px-[10px] max-md:pb-[calc(8px+env(safe-area-inset-bottom))]
          max-md:border-r-0 max-md:border-t max-md:border-[var(--border)] max-md:gap-1
        ">
          <Link
            className="w-9 h-9 flex items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)] text-lg max-md:w-10 max-md:h-10 max-md:text-[19px]"
            href="/"
            title="Project Hub"
          >
            <i className="ti ti-home" aria-hidden="true"></i>
          </Link>
          
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = item.key === activePage;
            const href = getNavHref(item.href);
            return (
              <Link
                key={item.key}
                className={`w-9 h-9 flex items-center justify-center rounded text-lg max-md:w-10 max-md:h-10 max-md:text-[19px] ${
                  isActive ? 'bg-[var(--surface-raised)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]'
                }`}
                href={href}
                title={item.label}
              >
                <i className={`ti ${item.icon}`} aria-hidden="true"></i>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Content Area with Topbar */}
      <div className="flex-1 flex flex-col min-w-0 max-md:min-h-[100dvh] max-md:pb-[calc(58px+env(safe-area-inset-bottom))]">
        <header className="flex justify-between items-center px-6 py-4 border-b border-[var(--border)] shrink-0 max-md:px-3 max-md:py-[10px] max-md:gap-[10px]">
          <h1 className="font-[var(--font-serif)] text-lg font-semibold m-0 max-md:flex-1 max-md:min-w-0 max-md:overflow-hidden max-md:text-ellipsis max-md:whitespace-nowrap max-md:text-base">
            {title}
          </h1>
          <div className="flex items-center gap-3 max-md:gap-2 max-md:shrink-0">
            {/* Sync Status */}
            {!isOnline && (
              <span className="inline-flex items-center text-xs px-[9px] py-[3px] rounded-full bg-[var(--surface-raised)] text-[var(--danger)] max-md:hidden">
                Offline
              </span>
            )}
            {isOnline && syncCount > 0 && (
              <span className="inline-flex items-center text-xs px-[9px] py-[3px] rounded-full bg-[var(--surface-raised)] text-[var(--text-muted)] max-md:hidden">
                Sync {syncCount}…
              </span>
            )}
            
            <span className="text-xs text-[var(--text-muted)] max-md:hidden">
              {user?.email || ''}
            </span>
            
            <button
              className="bg-transparent border border-[var(--border)] text-[var(--text)] px-3 py-2 rounded text-xs cursor-pointer hover:bg-[var(--surface-raised)] max-md:px-[9px] max-md:py-[7px]"
              onClick={handleSignOut}
            >
              Keluar
            </button>
          </div>
        </header>
        
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}