/**
 * viewer.ts — Lazy-load ViewerJS for post image lightbox.
 * Zero runtime npm deps. CSS+JS injected from CDN with SRI on first click.
 *
 * CDN URLs + SRI sourced from src/lib/cdn.ts registry (zstatic primary, cdnjs fallback).
 * ViewerJS assets are NOT loaded on page load — they are injected only when a
 * user clicks an image inside .post-body (or [data-viewer-scope]).
 *
 * Expected DOM:
 *   <div class="post-body"> ... <img ...> ... </div>
 *   (Or any element matching [data-viewer-scope])
 *
 * Exports:
 *   initViewer()  — call once on DOMContentLoaded
 */

import { CDN } from "../lib/cdn";

// Resolve CDN entries at module load time (build-time constants via cdn.ts).
const VIEWER_CSS = CDN["viewerjs-css"];
const VIEWER_JS = CDN["viewerjs-js"];

// Minimal Viewer type — avoids importing viewerjs into the bundle.
interface ViewerConstructor {
  new (
    element: HTMLElement,
    options?: Record<string, unknown>,
  ): { destroy(): void };
}

declare global {
  interface Window {
    Viewer?: ViewerConstructor;
  }
}

// ─── asset injection helpers ─────────────────────────────────────────────────

function injectCSS(res: typeof VIEWER_CSS): void {
  if (document.querySelector(`link[href="${res.primary}"]`)) return;
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
  document.head.appendChild(link);
}

function injectJS(res: typeof VIEWER_JS): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Viewer) {
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
        reject(new Error("ViewerJS failed to load from both CDNs"));
      document.head.appendChild(fb);
    };
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// ─── viewer init ─────────────────────────────────────────────────────────────

async function loadViewer(scope: HTMLElement): Promise<void> {
  injectCSS(VIEWER_CSS);
  await injectJS(VIEWER_JS);

  const ViewerCtor = window.Viewer;
  if (!ViewerCtor) return;
  new ViewerCtor(scope);
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Attach a one-time click listener to each image inside `.post-body`
 * (or `[data-viewer-scope]`). On first click the ViewerJS assets are fetched
 * and the lightbox opens. Call once on DOMContentLoaded.
 */
export function initViewer(): void {
  const scope = document.querySelector<HTMLElement>(
    "[data-viewer-scope], .post-body",
  );
  if (!scope) return;

  const imgs = scope.querySelectorAll<HTMLImageElement>("img");
  if (!imgs.length) return;

  let loaded = false;

  const load = () => {
    if (loaded) return;
    loaded = true;
    loadViewer(scope).catch(console.error);
  };

  imgs.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", load, { once: true });
  });
}
