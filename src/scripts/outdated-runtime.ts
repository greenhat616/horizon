/**
 * outdated-runtime.ts — Client-side outdated-notice reveal.
 * Zero deps. No dayjs. Uses native Intl.RelativeTimeFormat.
 *
 * Companion to OutdatedNotice.astro (build-time first pass).
 * At runtime, re-checks against the visitor's actual Date.now() so the
 * notice can appear even for cached/statically-served pages.
 *
 * Expected DOM per notice:
 *   <div data-outdated-notice
 *        data-stale-after="<ISO-8601 timestamp>"
 *        data-lastmod="<ISO-8601 timestamp>"
 *        hidden>
 *     ...
 *     <span data-relative-time></span>
 *   </div>
 *
 * Exports:
 *   initOutdatedNotices()  — call once on DOMContentLoaded
 */

const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });

/** Returns a human-readable relative string for a past date. */
function relativeTime(pastMs: number): string {
  const diffMs = pastMs - Date.now(); // negative for past dates
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4375);

  if (Math.abs(diffMonths) >= 12) {
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return rtf.format(Math.round(diffYears), 'year');
  }
  return rtf.format(Math.round(diffMonths), 'month');
}

/** Scan all [data-outdated-notice] elements and reveal those past their stale date. */
export function initOutdatedNotices(): void {
  const now = Date.now();

  document.querySelectorAll<HTMLElement>('[data-outdated-notice]').forEach((el) => {
    const staleAfterRaw = el.dataset['staleAfter'];
    const lastmodRaw = el.dataset['lastmod'];
    if (!staleAfterRaw || !lastmodRaw) return;

    const staleAfter = Date.parse(staleAfterRaw);
    const lastmod = Date.parse(lastmodRaw);
    if (isNaN(staleAfter) || isNaN(lastmod)) return;

    if (now >= staleAfter) {
      // reveal
      el.removeAttribute('hidden');

      // update relative-time span
      const relSpan = el.querySelector<HTMLElement>('[data-relative-time]');
      if (relSpan) {
        relSpan.textContent = relativeTime(lastmod);
      }
    }
  });
}
