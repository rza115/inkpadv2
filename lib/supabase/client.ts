/**
 * Supabase Client for Client Components
 * Use this in React components (client-side)
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Only throw during runtime, not during build
    if (typeof window !== 'undefined') {
      throw new Error(
        'Missing Supabase environment variables. Please check your .env.local file:\n' +
        '- NEXT_PUBLIC_SUPABASE_URL\n' +
        '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
    }
    // During build/SSR, return a dummy client to prevent build failures
    // This is safe because these pages are client-only ('use client')
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    );
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
