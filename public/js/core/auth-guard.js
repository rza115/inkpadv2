// js/core/auth-guard.js — PATCHED for Next.js
// Jalankan PALING AWAL di tiap halaman (setelah supabase-client.js).
//
// Pattern load:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="/js/core/supabase-client.js"></script>
// <script src="/js/core/auth-guard.js"></script>
//
// Setelah selesai, dispatch event 'auth-ready' dengan { user } di detail.
// Halaman lain bisa dengerin event ini sebelum render data yang butuh auth.

(async function authGuard() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error('Auth check gagal:', error.message);
  }

  const path = window.location.pathname;
  const isLoginPage = path === '/login' || path.endsWith('login.html');

  if (!session && !isLoginPage) {
    window.location.href = '/login';
    return;
  }

  if (session && isLoginPage) {
    window.location.href = '/';
    return;
  }

  window.currentUser = session ? session.user : null;
  window.authReady = true;

  document.dispatchEvent(new CustomEvent('auth-ready', { detail: { user: window.currentUser } }));

  // dengerin perubahan auth state real-time (misal session expired di tab lain)
  supabaseClient.auth.onAuthStateChange((_event, newSession) => {
    const currPath = window.location.pathname;
    if (!newSession && currPath !== '/login') {
      window.location.href = '/login';
    }
  });
})();

async function signOut() {
  await supabaseClient.auth.signOut();
  window.location.href = '/login';
}