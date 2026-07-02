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
  /**
   * Layout type: 'hub' = only topbar, 'project' = topbar + sidebar
   */
  layout?: 'hub' | 'project';
  
  /**
   * Page title shown in topbar
   */
  title?: string;
  
  /**
   * Active project ID (for project-specific URLs)
   */
  projectId?: string | null;
  
  /**
   * Page content to render inside the layout
   */
  children?: React.ReactNode;
}

export function Nav({ layout = 'hub', title = 'Inkpad', projectId = null, children }: NavProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [syncCount, setSyncCount] = useState(0);

  // Determine active page from pathname
  const activePage = pathname?.split('/')[1] || 'hub';

  // Track online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Track sync queue count (for offline support - will be implemented later)
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

  // Build URL with project ID if available
  const getNavHref = (href: string) => {
    if (projectId) {
      return `${href}?project=${projectId}`;
    }
    return href;
  };

  return (
    <div className={`app-shell layout-${layout}`}>
      {/* Sidebar (only shown in project layout) */}
      {layout === 'project' && (
        <nav className="sidebar">
          <Link className="nav-icon" href="/" title="Project Hub">
            <i className="ti ti-home" aria-hidden="true"></i>
          </Link>
          
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = item.key === activePage;
            const href = getNavHref(item.href);
            
            return (
              <Link
                key={item.key}
                className={`nav-icon${isActive ? ' active' : ''}`}
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
      <div className="content-area">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar-right">
            {/* Sync Status */}
            {!isOnline && (
              <span className="sync-status offline" style={{ display: 'inline-flex' }}>
                Offline
              </span>
            )}
            {isOnline && syncCount > 0 && (
              <span className="sync-status" style={{ display: 'inline-flex' }}>
                Sync {syncCount}…
              </span>
            )}
            
            {/* User Email */}
            <span id="user-email">{user?.email || ''}</span>
            
            {/* Sign Out Button */}
            <button className="ghost" onClick={handleSignOut}>
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
