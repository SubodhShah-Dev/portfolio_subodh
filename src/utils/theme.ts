export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/** Stored preference, or null when the visitor has never chosen. */
export function getStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

/** OS-level preference (used when nothing is stored). */
export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** What the document is showing right now. */
export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Apply a theme to the document: flip the `.dark` class (all Signal tokens
 * re-point), sync the native `color-scheme` (scrollbars/form controls), and
 * persist unless told otherwise. Broadcasts `themechange` for listeners.
 */
export function applyTheme(theme: Theme, persist = true): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage may be blocked — theme still applies for this session */
    }
  }
  window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
}

/**
 * Flip the theme instantly (no transition — flat motion policy).
 */
export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
