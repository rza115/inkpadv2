// js/core/supabase-client.js
// Inisialisasi Supabase client — satu instance dipakai bareng di semua halaman.
//
// WAJIB load script CDN supabase-js SEBELUM file ini:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="js/core/supabase-client.js"></script>

const SUPABASE_URL = 'https://cijaiymfeidphxhxynbq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mi1r-XvYQJz8vNkYlTW5PA_MuRJukG3';

if (typeof supabase === 'undefined') {
  console.error('Supabase SDK belum dimuat. Pastikan script CDN supabase-js ada sebelum supabase-client.js');
}

// window.supabaseClient dipakai di semua halaman & module lain
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
