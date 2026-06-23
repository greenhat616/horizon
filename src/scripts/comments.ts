/**
 * comments.ts — Lazy-load the Artalk comment widget.
 * Zero runtime npm deps. Artalk CSS+JS are injected from CDN with SRI only
 * when the comment container enters the viewport (or is clicked).
 *
 * CDN URLs + SRI sourced from src/lib/cdn.ts (zstatic primary, cdnjs fallback).
 * Assets are NOT loaded on page load — they are injected only when the
 * #artalk container scrolls into view (IntersectionObserver, 200 px margin)
 * or is clicked.
 *
 * Expected DOM:
 *   <div id="artalk" data-comments></div>
 *
 * Exports:
 *   initComments()  — call once on DOMContentLoaded
 */

import { CDN } from "../lib/cdn";
import { ARTALK_SERVER } from "../lib/site";
import site from "../../site.config";

const ARTALK_SITE = site.artalkSite;

// Resolve CDN entries at module load time (build-time constants via cdn.ts).
const ARTALK_CSS = CDN["artalk-css"];
const ARTALK_JS = CDN["artalk-js"];

// Minimal Artalk type surface — avoids importing the artalk package into the bundle.
interface ArtalkInstance {
  setDarkMode(value: boolean | "auto"): void;
  destroy(): void;
}
interface ArtalkStatic {
  init(opts: Record<string, unknown>): ArtalkInstance;
}

declare global {
  interface Window {
    Artalk?: ArtalkStatic;
  }
}

const isNight = (): boolean =>
  document.documentElement.classList.contains("night");

// ─── asset injection helpers ─────────────────────────────────────────────────

function injectCSS(res: typeof ARTALK_CSS): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`link[href="${res.primary}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = res.primary;
    link.integrity = res.integrity;
    link.crossOrigin = res.crossorigin;
    link.onerror = () => {
      const fb = document.createElement("link");
      fb.rel = "stylesheet";
      fb.href = res.fallback;
      fb.integrity = res.integrity;
      fb.crossOrigin = res.crossorigin;
      document.head.appendChild(fb);
    };
    link.onload = () => resolve();
    document.head.appendChild(link);
    // resolve immediately — stylesheet load shouldn't block widget init
    resolve();
  });
}

function injectJS(res: typeof ARTALK_JS): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Artalk) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = res.primary;
    script.integrity = res.integrity;
    script.crossOrigin = res.crossorigin;
    script.async = false;
    script.onerror = () => {
      const fb = document.createElement("script");
      fb.src = res.fallback;
      fb.integrity = res.integrity;
      fb.crossOrigin = res.crossorigin;
      fb.onload = () => resolve();
      fb.onerror = () =>
        reject(new Error("Artalk JS failed to load from both CDNs"));
      document.head.appendChild(fb);
    };
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// ─── Artalk init ─────────────────────────────────────────────────────────────

async function loadArtalk(container: HTMLElement): Promise<void> {
  await injectCSS(ARTALK_CSS);
  await injectJS(ARTALK_JS);

  const Artalk = window.Artalk;
  if (!Artalk) return;

  const artalk = Artalk.init({
    el: container,
    // Invariant: pageKey MUST equal location.pathname. Historical comments were
    // imported with path-style page keys (url_resolver:false) — never derive
    // this from canonical / Astro.url / a normalised URL. trailingSlash:'always'
    // means the path carries a trailing slash, matching the imported data.
    pageKey: location.pathname,
    pageTitle: document.title,
    server: ARTALK_SERVER,
    site: ARTALK_SITE || undefined,
    // Boolean, not 'auto': dark mode follows html.night, not prefers-color-scheme.
    darkMode: isNight(),
    // Show each commenter's OS + browser, parsed from the backend-stored User-Agent.
    uaBadge: true,
    imgUpload: false,
  });

  // Keep the widget in sync with runtime theme toggles (theme.ts flips
  // html.night). Zero coupling — we only observe the class attribute.
  new MutationObserver(() => artalk.setDarkMode(isNight())).observe(
    document.documentElement,
    {
      attributes: true,
      attributeFilter: ["class"],
    },
  );
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Observe the comment container with IntersectionObserver. Artalk assets are
 * fetched only when the element scrolls into view or is clicked.
 * Call once on DOMContentLoaded.
 */
export function initComments(): void {
  const container = document.querySelector<HTMLElement>("[data-comments]");
  if (!container) return;

  let loaded = false;

  const load = () => {
    if (loaded) return;
    loaded = true;
    loadArtalk(container).catch(console.error);
  };

  // click fallback
  container.addEventListener("click", load, { once: true });

  // IntersectionObserver — trigger 200 px before viewport edge
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          io.disconnect();
          load();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(container);
  } else {
    // No IO support — load immediately
    load();
  }
}
