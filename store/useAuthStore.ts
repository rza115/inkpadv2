/**
 * Auth Store - Replaces auth-guard.js with React state management
 * Handles authentication, session management, and user state
 */
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  /**
   * Initialize auth - check session and set up listener
   * Call this once when the app starts
   */
  initialize: async () => {
    const supabase = createClient();
    
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth check failed:', error.message);
      }

      set({ 
        user: session?.user ?? null, 
        isLoading: false,
        isInitialized: true 
      });

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, newSession) => {
        set({ user: newSession?.user ?? null });
        
        // Handle redirect on logout (if not already on login page)
        if (!newSession && typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path !== '/login') {
            window.location.href = '/login';
          }
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    const supabase = createClient();
    
    try {
      await supabase.auth.signOut();
      set({ user: null });
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  /**
   * Manually set user (useful for login flow)
   */
  setUser: (user) => {
    set({ user, isLoading: false });
  },
}));
