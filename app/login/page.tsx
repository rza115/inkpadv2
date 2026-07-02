"use client";

import { useEffect, useRef } from "react";

export default function LoginPage() {
  const scriptsLoaded = useRef(false);

  useEffect(() => {
    if (scriptsLoaded.current) return;
    scriptsLoaded.current = true;

    // Load Supabase CDN first, then our scripts
    const scriptUrls = [
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
      "/js/core/supabase-client.js",
      "/js/core/auth-guard.js",
      "/js/core/offline-queue.js",
      "/js/core/pwa-register.js",
    ];

    let idx = 0;
    function loadNext() {
      if (idx >= scriptUrls.length) {
        // All scripts loaded — init the login form
        initLoginForm();
        return;
      }
      const script = document.createElement("script");
      script.src = scriptUrls[idx];
      script.async = false;
      script.onload = () => {
        idx++;
        loadNext();
      };
      script.onerror = () => {
        idx++;
        loadNext();
      };
      document.body.appendChild(script);
    }
    loadNext();

    function initLoginForm() {
      let mode: "login" | "signup" = "login";

      const form = document.getElementById("auth-form") as HTMLFormElement | null;
      const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement | null;
      const errorMsg = document.getElementById("error-msg") as HTMLElement | null;
      const switchLink = document.getElementById("switch-link") as HTMLElement | null;
      const switchText = document.getElementById("switch-text") as HTMLElement | null;
      const tagline = document.getElementById("form-tagline") as HTMLElement | null;

      if (!form || !submitBtn || !errorMsg || !switchLink || !switchText || !tagline) return;

      switchLink.addEventListener("click", () => {
        mode = mode === "login" ? "signup" : "login";
        if (mode === "signup") {
          submitBtn.textContent = "Daftar";
          tagline.textContent = "Buat akun baru";
          switchText.textContent = "Sudah punya akun?";
          switchLink.textContent = "Masuk";
        } else {
          submitBtn.textContent = "Masuk";
          tagline.textContent = "Masuk untuk lanjut menulis";
          switchText.textContent = "Belum punya akun?";
          switchLink.textContent = "Daftar";
        }
        errorMsg.style.display = "none";
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorMsg.style.display = "none";
        errorMsg.style.color = "var(--danger)";
        submitBtn.disabled = true;
        submitBtn.textContent = "Memproses…";

        const emailInput = document.getElementById("email") as HTMLInputElement | null;
        const passwordInput = document.getElementById("password") as HTMLInputElement | null;
        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const sb = (window as any).supabaseClient;
        if (!sb) {
          errorMsg.textContent = "Supabase client belum siap.";
          errorMsg.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = mode === "login" ? "Masuk" : "Daftar";
          return;
        }

        const { error } =
          mode === "login"
            ? await sb.auth.signInWithPassword({ email, password })
            : await sb.auth.signUp({ email, password });

        if (error) {
          errorMsg.textContent = error.message;
          errorMsg.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = mode === "login" ? "Masuk" : "Daftar";
          return;
        }

        if (mode === "signup") {
          errorMsg.style.color = "var(--accent)";
          errorMsg.textContent =
            "Akun dibuat. Kalau email confirmation aktif, cek inbox dulu sebelum masuk.";
          errorMsg.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "Daftar";
          return;
        }

        // Redirect to hub
        window.location.href = "/";
      });
    }
  }, []);

  return (
    <div className="login-wrap" style={{ minHeight: "100dvh" }}>
      <div className="login-card">
        <div className="brand">
          <h1>Inkpad</h1>
          <span className="cursor" aria-hidden="true"></span>
        </div>
        <p className="tagline" id="form-tagline">
          Masuk untuk lanjut menulis
        </p>

        <form id="auth-form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Kata sandi</label>
            <input
              type="password"
              id="password"
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>
          <button type="submit" className="primary" id="submit-btn">
            Masuk
          </button>
          <p className="error" id="error-msg"></p>
        </form>

        <p className="switch">
          <span id="switch-text">Belum punya akun?</span>
          <a id="switch-link">Daftar</a>
        </p>
      </div>
    </div>
  );
}