/**
 * useAuth Hook - Provides auth state and protection for components
 * Replaces the auth-guard.js pattern with React hooks
 */
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface UseAuthOptions {
  /**
   * Redirect to login if not authenticated
   * Default: true
   */
  requireAuth?: boolean;
  
  /**
   * Redirect to home if already authenticated (for login page)
   * Default: false
   */
  redirectIfAuthenticated?: boolean;
}

/**
 * Hook for accessing auth state and protecting routes
 * 
 * @example
 * // In a protected page
 * const { user, isLoading } = useAuth();
 * 
 * @example
 * // In login page (redirect if already logged in)
 * const { user } = useAuth({ redirectIfAuthenticated: true });
 */
export function useAuth(options: UseAuthOptions = {}) {
  const { 
    requireAuth = true, 
    redirectIfAuthenticated = false 
  } = options;
  
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isInitialized, initialize, signOut } = useAuthStore();

  // Initialize auth on first mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Handle auth redirects
  useEffect(() => {
    // Wait for initialization
    if (!isInitialized || isLoading) return;

    // Redirect to login if auth required and no user
    if (requireAuth && !user && pathname !== '/login') {
      router.push('/login');
      return;
    }

    // Redirect to home if already authenticated (e.g., on login page)
    if (redirectIfAuthenticated && user) {
      router.push('/');
      return;
    }
  }, [user, isLoading, isInitialized, requireAuth, redirectIfAuthenticated, pathname, router]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}

/**
 * Hook for non-protected pages (no redirect)
 * Just provides auth state
 */
export function useAuthState() {
  return useAuth({ requireAuth: false });
}
