/**
 * Theme utilities
 * Shared theme management functions for consistent theme handling across the app
 */

export const THEMES = ["light", "dark", "sepia"] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Get the current theme from document.documentElement data-theme attribute
 */
export function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  return (THEMES as readonly string[]).includes(attr || "")
    ? (attr as Theme)
    : "light";
}

/**
 * Get the icon class for a given theme
 */
export function getThemeIcon(theme: Theme): string {
  return theme === "dark" 
    ? "ti ti-moon" 
    : theme === "sepia" 
    ? "ti ti-sunset" 
    : "ti ti-sun";
}

/**
 * Apply a theme to the document and persist to localStorage
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("inkpad_theme", theme);
}

/**
 * Cycle to the next theme in the sequence
 */
export function cycleTheme(): Theme {
  const cur = getCurrentTheme();
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  applyTheme(next);
  return next;
}

/**
 * Restore the stored theme from localStorage
 * Should be called early in the app lifecycle
 */
export function restoreStoredTheme(): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("inkpad_theme");
  if (stored && (THEMES as readonly string[]).includes(stored)) {
    document.documentElement.setAttribute("data-theme", stored);
  }
}
