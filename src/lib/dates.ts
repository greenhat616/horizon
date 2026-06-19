/**
 * Date parsing and formatting utilities.
 *
 * Quirk handled here: Hugo content often stores dates as bare strings like
 * "2023-04-15 10:30:00" with no timezone information. Those are treated as
 * Asia/Shanghai (UTC+8) to match the author's locale. Strings that already
 * carry a Z suffix or a numeric UTC offset are parsed as-is by the built-in
 * Date constructor.
 */

/** Regex that matches a bare "YYYY-MM-DD HH:mm:ss" (no Z, no offset). */
const BARE_DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?$/;

/** Regex that matches a bare "YYYY-MM-DD" date only. */
const BARE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a raw date value tolerantly.
 *
 * - If `raw` is already a Date, return it.
 * - Bare "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD" strings are interpreted in
 *   Asia/Shanghai (UTC+8) by appending "+08:00" before construction.
 * - Anything else — ISO strings with Z/offset, numbers, etc. — is passed
 *   directly to `new Date()`.
 *
 * Returns `null` when the value cannot be parsed into a valid date.
 */
export function toDate(raw: unknown): Date | null {
  if (raw instanceof Date) {
    return isNaN(raw.getTime()) ? null : raw;
  }

  if (typeof raw === 'number') {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return null;

    // Bare datetime — no timezone info, treat as Asia/Shanghai
    if (BARE_DATETIME_RE.test(s)) {
      // Normalise the separator to 'T' and append the offset
      const iso = s.replace(' ', 'T') + '+08:00';
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : d;
    }

    // Bare date only — treat as midnight Asia/Shanghai
    if (BARE_DATE_RE.test(s)) {
      const d = new Date(s + 'T00:00:00+08:00');
      return isNaN(d.getTime()) ? null : d;
    }

    // Has explicit timezone info — let the Date constructor handle it
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Format a Date for display.
 *
 * @param d      - The date to format (must be a valid Date).
 * @param locale - BCP 47 locale tag. Defaults to "zh-CN".
 * @returns      A human-readable string, e.g. "2023年4月15日".
 */
export function formatDate(d: Date, locale = 'zh-CN'): string {
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
