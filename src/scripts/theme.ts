/**
 * theme.ts — Dark mode toggle (vanilla TS, zero runtime deps).
 *
 * Reads/writes cookie `night` (values '1' / '0').
 * Falls back to `prefers-color-scheme` when cookie is absent.
 * Toggles `html.night` + `html.dark` classes and updates the
 * `<meta name="theme-color">` value.
 *
 * The no-FOUC inline snippet that runs *before* first paint belongs in
 * BaseLayout's <head>; this module only provides the toggle logic called
 * after the page is interactive.
 *
 * Exports:
 *   initTheme()       — call once on DOMContentLoaded to sync state
 *   toggleDarkMode()  — exposed on window for onclick handlers
 */

// ─── cookie helpers ──────────────────────────────────────────────────────────

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)",
    ),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, days = 365): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// ─── night-mode detection (mirrors Hugo head.html getNightRawMode) ────────────

function getNightRaw(): "1" | "0" {
  const cookie = getCookie("night");
  if (cookie !== undefined) return cookie === "1" ? "1" : "0";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "1" : "0";
}

// ─── DOM helpers ─────────────────────────────────────────────────────────────

function applyDark(dark: boolean): void {
  const root = document.documentElement;
  root.classList.toggle("night", dark);
  root.classList.toggle("dark", dark);

  const meta = document.head.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (meta) {
    meta.content = getComputedStyle(root)
      .getPropertyValue("--nav-bar-background-color")
      .trim();
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

/** Sync dark-mode state from cookie / media-query on page load. */
export function initTheme(): void {
  const isDark = getNightRaw() === "1";
  setCookie("night", isDark ? "1" : "0");
  applyDark(isDark);
}

/** Toggle dark mode. Safe to call from onclick attributes via window.toggleDarkMode(). */
export function toggleDarkMode(): void {
  const willBeDark = !document.documentElement.classList.contains("night");
  setCookie("night", willBeDark ? "1" : "0");
  applyDark(willBeDark);
}

// Expose on window so inline onclick="toggleDarkMode()" works without imports.
declare global {
  interface Window {
    toggleDarkMode: () => void;
  }
}
window.toggleDarkMode = toggleDarkMode;
