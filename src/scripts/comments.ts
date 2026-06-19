/**
 * comments.ts — Lazy-load Waline comment widget.
 * Zero runtime npm deps. Waline CSS+JS are injected from CDN with SRI
 * only when the comment container enters the viewport (or is clicked).
 *
 * CDN URLs + SRI sourced from src/lib/cdn.ts registry (zstatic primary, cdnjs fallback).
 * Waline assets are NOT loaded on page load — they are injected only when the
 * #waline container scrolls into view (IntersectionObserver, 200 px margin) or is clicked.
 *
 * Expected DOM:
 *   <div id="waline" data-comments></div>
 *
 * Exports:
 *   initComments()  — call once on DOMContentLoaded
 */

import { CDN } from '../lib/cdn';
import { WALINE_SERVER } from '../site.config';

// Resolve CDN entries at module load time (build-time constants via cdn.ts).
const WALINE_CSS = CDN['waline-css'];
const WALINE_JS  = CDN['waline-js'];

// Minimal Waline type surface — avoids importing @waline/client into the bundle.
interface WalineInstance {
  destroy(): void;
}
interface WalineStatic {
  init(opts: Record<string, unknown>): WalineInstance;
}

declare global {
  interface Window {
    Waline?: WalineStatic;
  }
}

// ─── asset injection helpers ─────────────────────────────────────────────────

function injectCSS(res: typeof WALINE_CSS): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`link[href="${res.primary}"]`)) { resolve(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = res.primary;
    link.integrity = res.integrity;
    link.crossOrigin = res.crossorigin;
    link.onerror = () => {
      const fb = document.createElement('link');
      fb.rel = 'stylesheet';
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

function injectJS(res: typeof WALINE_JS): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Waline) { resolve(); return; }
    const script = document.createElement('script');
    script.src = res.primary;
    script.integrity = res.integrity;
    script.crossOrigin = res.crossorigin;
    script.async = false;
    script.onerror = () => {
      const fb = document.createElement('script');
      fb.src = res.fallback;
      fb.integrity = res.integrity;
      fb.crossOrigin = res.crossorigin;
      fb.onload = () => resolve();
      fb.onerror = () => reject(new Error('Waline JS failed to load from both CDNs'));
      document.head.appendChild(fb);
    };
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// ─── Waline init ─────────────────────────────────────────────────────────────

async function loadWaline(container: HTMLElement): Promise<void> {
  await injectCSS(WALINE_CSS);
  await injectJS(WALINE_JS);

  const Waline = window.Waline;
  if (!Waline) return;

  Waline.init({
    el: container,
    path: location.pathname,
    serverURL: WALINE_SERVER,
    comment: true,
    dark: 'html.night',
    requiredMeta: ['nick', 'mail'],
    imageUploader: false,
    emoji: [
      'https://unpkg.com/@waline/emojis@1.1.0/alus',
      'https://unpkg.com/@waline/emojis@1.1.0/weibo',
      'https://unpkg.com/@waline/emojis@1.1.0/tieba',
      'https://unpkg.com/@waline/emojis@1.1.0/bilibili',
    ],
  });
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Observe the comment container with IntersectionObserver. Waline assets are
 * fetched only when the element scrolls into view or is clicked.
 * Call once on DOMContentLoaded.
 */
export function initComments(): void {
  const container = document.querySelector<HTMLElement>('[data-comments]');
  if (!container) return;

  let loaded = false;

  const load = () => {
    if (loaded) return;
    loaded = true;
    loadWaline(container).catch(console.error);
  };

  // click fallback
  container.addEventListener('click', load, { once: true });

  // IntersectionObserver — trigger 200 px before viewport edge
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          io.disconnect();
          load();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(container);
  } else {
    // No IO support — load immediately
    load();
  }
}
