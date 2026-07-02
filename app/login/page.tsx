"use client";

import { useState, FormEvent, useEffect } from "react";
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

  // Load CSS files
  useEffect(() => {
    const cssFiles = [
      '/css/base.css',
      '/css/layout.css',
      '/css/components.css',
      '/css/splash.css'
    ];
    
    cssFiles.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

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
      <div className="login-wrap" style={{ minHeight: "100dvh" }}>
        <div className="login-card">
          <div className="brand">
            <h1>Inkpad</h1>
            <span className="cursor" aria-hidden="true"></span>
          </div>
          <p className="tagline">Memuat…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap" style={{ minHeight: "100dvh" }}>
      <div className="login-card">
        <div className="brand">
          <h1>Inkpad</h1>
          <span className="cursor" aria-hidden="true"></span>
        </div>
        <p className="tagline">
          {mode === "login" 
            ? "Masuk untuk lanjut menulis" 
            : "Buat akun baru"}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Kata sandi</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              disabled={isSubmitting}
            />
          </div>
          <button 
            type="submit" 
            className="primary" 
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? "Memproses…" 
              : mode === "login" ? "Masuk" : "Daftar"}
          </button>
          
          {error && (
            <p className="error" style={{ display: "block", color: "var(--danger)" }}>
              {error}
            </p>
          )}
          
          {isSuccess && (
            <p className="error" style={{ display: "block", color: "var(--accent)" }}>
              Akun dibuat. Kalau email confirmation aktif, cek inbox dulu sebelum masuk.
            </p>
          )}
        </form>

        <p className="switch">
          <span>
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}
          </span>{" "}
          <a onClick={toggleMode} style={{ cursor: "pointer" }}>
            {mode === "login" ? "Daftar" : "Masuk"}
          </a>
        </p>
      </div>
    </div>
  );
}
