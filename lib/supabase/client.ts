/**
 * Supabase Client for Client Components
 * Use this in React components (client-side)
 */
import { createBrowserClient } from '@supabase/ssr';

// Supabase configuration — uses env vars from .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL as string,
    SUPABASE_ANON_KEY as string
  );
}
