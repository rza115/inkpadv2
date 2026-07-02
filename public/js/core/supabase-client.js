// js/core/supabase-client.js
// Inisialisasi Supabase client — satu instance dipakai bareng di semua halaman.
//
// WAJIB load script CDN supabase-js SEBELUM file ini:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="js/core/supabase-client.js"></script>

const SUPABASE_URL = 'https://egslvksdfmiucbrlxfzy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_76znthPdbJWYMGnk1UVcvg_rX8Igjbi';

if (typeof supabase === 'undefined') {
  console.error('Supabase SDK belum dimuat. Pastikan script CDN supabase-js ada sebelum supabase-client.js');
}

// Use var so it becomes a window property accessible everywhere
var supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Sign out helper (moved from auth-guard.js which is not loaded in Next.js pages)
async function signOut() {
  await supabaseClient.auth.signOut();
  window.location.href = '/login';
}
