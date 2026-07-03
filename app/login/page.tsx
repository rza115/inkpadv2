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
        <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 shadow-sm">
          <div className="flex items-baseline gap-1 mb-1">
            <h1 className="brand-title text-3xl font-serif">Inkpad</h1>
            <span className="w-0.5 h-6 bg-[var(--accent)] cursor-blink" aria-hidden="true"></span>
          </div>
          <p className="text-[var(--text-muted)] text-sm tracking-wide mb-7">Memuat…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 shadow-sm">
        {/* Brand */}
        <div className="flex items-baseline gap-1 mb-1">
          <h1 className="brand-title text-3xl font-serif">Inkpad</h1>
          <span className="w-0.5 h-6 bg-[var(--accent)] cursor-blink" aria-hidden="true"></span>
        </div>
        <p className="text-[var(--text-muted)] text-sm tracking-wide mb-7">
          {mode === "login" 
            ? "Masuk untuk lanjut menulis" 
            : "Buat akun baru"}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label 
              htmlFor="email"
              className="block text-xs text-[var(--text-muted)] mb-1.5"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] text-sm outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label 
              htmlFor="password"
              className="block text-xs text-[var(--text-muted)] mb-1.5"
            >
              Kata sandi
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] text-sm outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full px-3 py-2.5 bg-[var(--accent-deep)] text-[var(--accent-text)] border-none rounded-[var(--radius)] font-semibold text-sm cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting 
              ? "Memproses…" 
              : mode === "login" ? "Masuk" : "Daftar"}
          </button>
          
          {/* Error Message */}
          {error && (
            <p className="text-sm text-[var(--danger)] mt-2.5">
              {error}
            </p>
          )}
          
          {/* Success Message */}
          {isSuccess && (
            <p className="text-sm text-[var(--accent)] mt-2.5">
              Akun dibuat. Kalau email confirmation aktif, cek inbox dulu sebelum masuk.
            </p>
          )}
        </form>

        {/* Mode Toggle */}
        <p className="text-center mt-4.5 text-sm text-[var(--text-muted)]">
          <span>
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}
          </span>{" "}
          <button 
            type="button"
            onClick={toggleMode}
            className="underline cursor-pointer text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            {mode === "login" ? "Daftar" : "Masuk"}
          </button>
        </p>
      </div>
    </div>
  );
}
