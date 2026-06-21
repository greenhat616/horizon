/**
 * reading-time.ts — format a reading-time figure the way the Hugo "diary"
 * theme does, so the rendered "min s" string matches the live site.
 *
 * The seconds value itself is computed at build time by
 * plugins/remark-reading-time-cjk.mjs (Hugo's `countwords / 220 * 60`) and
 * surfaced to pages via `render()`'s remarkPluginFrontmatter.readingSeconds.
 * This module only turns that number into Hugo's display string.
 */

/**
 * Format reading time in seconds exactly as the diary theme's template:
 *   $minutes := math.Floor (div $readTime 60)
 *   $seconds := mod $readTime 60        // int64 truncation
 *   minutes shown only when > 0; seconds always shown
 *   singular "minute"/"second", else "min"/"s"
 *
 * e.g. 1500.0 → "25 min 0 s", 24.5 → "24 s", 61 → "1 min 1 s".
 */
export function formatReadingTime(readSeconds: number): string {
  const minutes = Math.floor(readSeconds / 60);
  const seconds = Math.trunc(readSeconds) % 60;

  const parts: string[] = [];
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "min"}`);
  }
  parts.push(`${seconds} ${seconds === 1 ? "second" : "s"}`);
  return parts.join(" ");
}
