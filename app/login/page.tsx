"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  // Auth hook - redirects to / if already authenticated
  const { isLoading: authLoading } = useAuth({ 
    requireAuth: false, 
    redirectIfAuthenticated: true 
  });
  
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setIsSuccess(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSuccess(false);
    setIsSubmitting(true);

    const supabase = createClient();

    try {
      if (mode === "login") {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(signInError.message);
          setIsSubmitting(false);
          return;
        }

        // Redirect to home
        router.push("/");
      } else {
        // Sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          setIsSubmitting(false);
          return;
        }

        // Show success message
        setIsSuccess(true);
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi.");
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
        <div
          className="w-full max-w-sm bg-white border rounded-[18px] shadow-[0_24px_60px_-20px_rgba(34,29,43,0.16),_0_2px_10px_rgba(34,29,43,0.04)] p-11 pb-9 relative"
          style={{ borderColor: 'var(--novelist-line)' }}
        >
          <div
            className="absolute top-0 left-6 right-6 h-[3px] rounded-b-[3px]"
            style={{ background: 'linear-gradient(90deg, var(--novelist-lavender), var(--novelist-pink))' }}
          ></div>
          <div className="flex items-baseline gap-2.5 mb-1.5">
            <h1
              className="font-serif font-semibold text-[32px] tracking-[0.2px]"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--novelist-ink)' }}
            >
              Inkpad
            </h1>
            <span
              className="w-1.5 h-1.5 rounded-full -translate-y-2"
              style={{ background: 'var(--novelist-pink)' }}
            ></span>
          </div>
          <p className="text-sm" style={{ color: 'var(--novelist-ink-soft)' }}>Memuat…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      {/* Single Card - no more duplicate outer wrapper/brand */}
      <div
        className="w-full max-w-sm bg-white border rounded-[18px] shadow-[0_24px_60px_-20px_rgba(34,29,43,0.16),_0_2px_10px_rgba(34,29,43,0.04)] p-11 pb-9 relative"
        style={{ borderColor: 'var(--novelist-line)' }}
      >
          {/* Gradient top border */}
          <div 
            className="absolute top-0 left-6 right-6 h-[3px] rounded-b-[3px]"
            style={{ background: 'linear-gradient(90deg, var(--novelist-lavender), var(--novelist-pink))' }}
          ></div>

          {/* Brand */}
          <div className="flex items-baseline gap-2.5 mb-1.5">
            <h1 
              className="font-serif font-semibold text-[32px] tracking-[0.2px]"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--novelist-ink)' }}
            >
              Inkpad
            </h1>
            <span 
              className="w-1.5 h-1.5 rounded-full -translate-y-2"
              style={{ background: 'var(--novelist-pink)' }}
            ></span>
          </div>
          
          <p className="text-sm mb-8" style={{ color: 'var(--novelist-ink-soft)' }}>
            {mode === "login" ? "Masuk untuk lanjut menulis" : "Buat akun baru"}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                htmlFor="email"
                className="block text-[12.5px] font-medium uppercase tracking-[0.06em] mb-2"
                style={{ color: 'var(--novelist-ink-soft)' }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                autoComplete="email"
                disabled={isSubmitting}
                className="w-full h-[46px] px-3.5 border rounded-[10px] text-[14.5px] outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: 'var(--novelist-line)',
                  background: 'var(--novelist-input-bg)',
                  color: 'var(--novelist-ink)',
                  fontFamily: 'var(--font-sans)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--novelist-lavender)';
                  e.target.style.background = '#FFFFFF';
                  e.target.style.boxShadow = '0 0 0 3px var(--novelist-lavender-lt)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--novelist-line)';
                  e.target.style.background = 'var(--novelist-input-bg)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="password"
                className="block text-[12.5px] font-medium uppercase tracking-[0.06em] mb-2"
                style={{ color: 'var(--novelist-ink-soft)' }}
              >
                Kata sandi
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={6}
                disabled={isSubmitting}
                className="w-full h-[46px] px-3.5 border rounded-[10px] text-[14.5px] outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: 'var(--novelist-line)',
                  background: 'var(--novelist-input-bg)',
                  color: 'var(--novelist-ink)',
                  fontFamily: 'var(--font-sans)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--novelist-lavender)';
                  e.target.style.background = '#FFFFFF';
                  e.target.style.boxShadow = '0 0 0 3px var(--novelist-lavender-lt)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--novelist-line)';
                  e.target.style.background = 'var(--novelist-input-bg)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-12 mt-2 border-none rounded-[10px] text-white font-semibold text-[15px] tracking-[0.02em] cursor-pointer transition-all duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, var(--novelist-lavender), var(--novelist-pink-dark))',
                boxShadow: '0 10px 24px -8px rgba(183,55,106,0.45)',
                fontFamily: 'var(--font-sans)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.filter = 'brightness(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 28px -8px rgba(183,55,106,0.55)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.boxShadow = '0 10px 24px -8px rgba(183,55,106,0.45)';
              }}
            >
              {isSubmitting 
                ? "Memproses…" 
                : mode === "login" ? "Masuk" : "Daftar"}
            </button>
            
            {/* Error Message */}
            {error && (
              <p className="text-sm mt-2.5" style={{ color: 'var(--danger)' }}>
                {error}
              </p>
            )}
            
            {/* Success Message */}
            {isSuccess && (
              <p className="text-sm mt-2.5" style={{ color: 'var(--novelist-lavender)' }}>
                Akun dibuat. Kalau email confirmation aktif, cek inbox dulu sebelum masuk.
              </p>
            )}
          </form>

          {/* Divider */}
          <div className="flex items-center gap-2.5 my-7">
            <div className="flex-1 h-px" style={{ background: 'var(--novelist-line)' }}></div>
            <span 
              className="text-[11px] uppercase tracking-[0.08em]"
              style={{ color: '#C7BFD4' }}
            >
              Inkpad
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--novelist-line)' }}></div>
          </div>

          {/* Mode Toggle */}
          <p className="text-center text-[13.5px]" style={{ color: 'var(--novelist-ink-soft)' }}>
            <span>
              {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}
            </span>{" "}
            <button 
              type="button"
              onClick={toggleMode}
              className="font-semibold cursor-pointer border-b pb-px transition-all duration-150"
              style={{ 
                color: 'var(--novelist-pink-dark)',
                borderColor: 'rgba(183,55,106,0.35)',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--novelist-pink-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(183,55,106,0.35)';
              }}
            >
              {mode === "login" ? "Daftar" : "Masuk"}
            </button>
          </p>
      </div>
    </div>
  );
}
