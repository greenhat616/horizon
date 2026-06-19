/**
 * CDN resource registry.
 *
 * Policy: zstatic (s4.zstatic.net) is primary, cdnjs is fallback.
 * Banned CDNs are listed in BANNED_CDN — never use them.
 * SRI hashes and URLs are copied verbatim from themes/diary/layouts/partials/head.html.
 */

export interface CdnResource {
  /** Primary URL (zstatic) */
  primary: string;
  /** Fallback URL (cdnjs) */
  fallback: string;
  /** SRI integrity hash */
  integrity: string;
  crossorigin: 'anonymous';
  /** 'script' | 'style' — hints for the consumer */
  type: 'script' | 'style';
}

/** CDN providers that are permanently banned (compromised / injected). */
export const BANNED_CDN = ['staticfile', 'bytecdntp', 'bootcdn'] as const;

/** Validate that a URL does not reference a banned CDN provider. */
export function assertNoBannedCdn(url: string): void {
  for (const banned of BANNED_CDN) {
    if (url.toLowerCase().includes(banned)) {
      throw new Error(`Banned CDN provider "${banned}" found in URL: ${url}`);
    }
  }
}

/** Return true when the URL contains a banned CDN provider. */
export function isBannedCdn(url: string): boolean {
  return BANNED_CDN.some((b) => url.toLowerCase().includes(b));
}

/**
 * External CDN resource registry.
 * Keys match the logical name used across components and scripts.
 * Hashes and URLs copied verbatim from head.html — do NOT edit manually.
 *
 * Removed entries (no longer used in this Astro build):
 *   js-cookie   — replaced by native document.cookie in theme.ts
 *   vue-disqus  — Vue dependency dropped; Waline is the sole comment system
 *   twikoo-js   — comment system not in use
 *   gitalk-css/js — comment system not in use
 */
export const CDN: Record<string, CdnResource> = {
  // ── Waline ────────────────────────────────────────────────────────────
  'waline-css': {
    primary:
      'https://s4.zstatic.net/ajax/libs/waline/2.15.5/waline.min.css',
    fallback:
      'https://cdnjs.cloudflare.com/ajax/libs/waline/2.15.5/waline.min.css',
    integrity:
      'sha384-7PVcrQdw1KOS/MXsBfQevVf5AJs2mD055XoGTdex2w/v5tTsGPfiYzsxlW+y4vUd',
    crossorigin: 'anonymous',
    type: 'style',
  },
  'waline-js': {
    primary:
      'https://s4.zstatic.net/ajax/libs/waline/2.15.5/waline.min.js',
    fallback:
      'https://cdnjs.cloudflare.com/ajax/libs/waline/2.15.5/waline.min.js',
    integrity:
      'sha384-40RaVgL7x9vyFxIDbsZireNQWZ+W6Fky5QGZ+BLyHgaRn1q2NeH30iPTq410dG1c',
    crossorigin: 'anonymous',
    type: 'script',
  },

  // ── KaTeX ─────────────────────────────────────────────────────────────
  'katex-css': {
    primary:
      'https://s4.zstatic.net/ajax/libs/KaTeX/0.16.8/katex.min.css',
    fallback:
      'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.css',
    integrity:
      'sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn',
    crossorigin: 'anonymous',
    type: 'style',
  },
  'katex-js': {
    primary:
      'https://s4.zstatic.net/ajax/libs/KaTeX/0.16.8/katex.min.js',
    fallback:
      'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.js',
    integrity:
      'sha384-cpW21h6RZv/phavutF+AuVYrr+dA8xD9zs6FwLpaCct6O9ctzYFfFr4dgmgccOTx',
    crossorigin: 'anonymous',
    type: 'script',
  },
  'katex-auto-render': {
    primary:
      'https://s4.zstatic.net/ajax/libs/KaTeX/0.16.8/contrib/auto-render.min.js',
    fallback:
      'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/contrib/auto-render.min.js',
    integrity:
      'sha384-+VBxd3r6XgURycqtZ117nYw44OOcIax56Z4dCRWbxyPt0Koah1uHoK0o4+/RRE05',
    crossorigin: 'anonymous',
    type: 'script',
  },

  // ── ViewerJS ──────────────────────────────────────────────────────────
  'viewerjs-css': {
    primary:
      'https://s4.zstatic.net/ajax/libs/viewerjs/1.10.4/viewer.min.css',
    fallback:
      'https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.10.4/viewer.min.css',
    integrity:
      'sha384-Yrc0/8dYoo/XkTKV+KGZew5r7Nb4pOQ7E6Nx4lcElZQaw6hdI3QG4ho9DcdrcFhs',
    crossorigin: 'anonymous',
    type: 'style',
  },
  'viewerjs-js': {
    primary:
      'https://s4.zstatic.net/ajax/libs/viewerjs/1.10.4/viewer.min.js',
    fallback:
      'https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.10.4/viewer.min.js',
    integrity:
      'sha384-46jHTagPsmMd7t7PDY+3UMgOqicZdmM+hW6vnMXayfNFPDLmNhSqnUPlKYe70qC5',
    crossorigin: 'anonymous',
    type: 'script',
  },

  // ── Animate.css ───────────────────────────────────────────────────────
  'animate-css': {
    primary:
      'https://s4.zstatic.net/ajax/libs/animate.css/4.1.1/animate.min.css',
    fallback:
      'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
    integrity:
      'sha384-Gu3KVV2H9d+yA4QDpVB7VcOyhJlAVrcXd0thEjr4KznfaFPLe0xQJyonVxONa4ZC',
    crossorigin: 'anonymous',
    type: 'style',
  },
};

/**
 * Inline script string for the CDN fallback loader (__cdnfb).
 * Copied verbatim from head.html — swap primary→fallback on network/404/SRI error.
 */
export const CDNFB_SCRIPT = `window.__cdnfb = function (el) {
  el.onerror = null;
  var fb = el.getAttribute('data-fb');
  if (!fb) return;
  var n = document.createElement(el.tagName);
  if (el.tagName === 'LINK') { n.rel = 'stylesheet'; n.href = fb; }
  else { n.src = fb; n.defer = el.defer; n.async = false; }
  if (el.integrity) { n.integrity = el.integrity; n.crossOrigin = 'anonymous'; }
  var p = el.parentNode;
  if (p) { p.insertBefore(n, el.nextSibling); p.removeChild(el); }
};`;
