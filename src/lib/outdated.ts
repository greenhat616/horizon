/**
 * Outdated-article detection helpers.
 *
 * Shared between compile-time (Astro components) and runtime scripts so the
 * staleness threshold is defined in exactly one place.
 *
 * Logic mirrors the original journal-module.js behaviour:
 *   an article is considered outdated when its lastmod is older than 6 months
 *   relative to the visitor's current time.
 */

/** Number of calendar months after which an article is considered stale. */
export const STALE_MONTHS = 6;

/**
 * Return the absolute Date at which the article becomes stale.
 *
 * @param lastmod - The last-modified date of the article.
 * @returns        lastmod + STALE_MONTHS calendar months.
 */
export function staleAfter(lastmod: Date): Date {
  const d = new Date(lastmod.getTime());
  d.setMonth(d.getMonth() + STALE_MONTHS);
  return d;
}

/**
 * Return true when the article is stale relative to `now`.
 *
 * @param staleAfterDate - Result of {@link staleAfter}.
 * @param now            - The reference point to compare against (typically
 *                         the build time at compile-time, or `new Date()` at
 *                         runtime).
 */
export function isStaleAt(staleAfterDate: Date, now: Date): boolean {
  return now >= staleAfterDate;
}
