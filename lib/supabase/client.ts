/**
 * Supabase Client for Client Components
 * Use this in React components (client-side)
 */
import { createBrowserClient } from '@supabase/ssr';

// Supabase configuration
const SUPABASE_URL = 'https://eqfgulhknfmhkhybatpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZmd1bGhrbmZtaGtoeWJhdHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMzYxNTYsImV4cCI6MjA1NDkxMjE1Nn0.hgI7h9WmXzSFV_B-aJmJkMkQUg2X0B9n_OwJkUFnfWw';

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}
