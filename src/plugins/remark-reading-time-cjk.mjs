/**
 * remark-reading-time-cjk
 *
 * Calculates a reading-time estimate that handles mixed CJK + Latin content
 * correctly. The standard `reading-time` package counts all characters as
 * "words" for CJK, which badly overstates the time. Here we split the text
 * into CJK runs (counted by character) and Latin runs (counted by word), then
 * combine the two estimates.
 *
 * Writes to file.data.astro.frontmatter:
 *   readingTime  {string}  — e.g. "5 分钟" or "3 min read"
 *   wordCount    {number}  — total word/character equivalent count
 */

import { toString } from 'mdast-util-to-string';

/** Chinese/Japanese/Korean Unicode ranges used for CJK character detection. */
const CJK_RE =
  /[⺀-⻿⼀-⿟　-〿぀-ゟ゠-ヿ㄀-ㄯ㈀-㋿㐀-䶿一-鿿ꀀ-꓿가-퟿豈-﫿︰-﹏]/g;

/** Average reading speed: CJK characters per minute. */
const CJK_CPM = 300;
/** Average reading speed: Latin words per minute. */
const LATIN_WPM = 200;

/**
 * Count CJK characters and estimate Latin word count from a plain-text string.
 * Returns { cjkChars, latinWords, totalMinutes }.
 */
function analyzeText(text) {
  // Count CJK characters
  const cjkMatches = text.match(CJK_RE) ?? [];
  const cjkChars = cjkMatches.length;

  // Remove CJK characters and count remaining whitespace-separated tokens
  const latinText = text.replace(CJK_RE, ' ');
  const latinWords = latinText
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const totalMinutes = cjkChars / CJK_CPM + latinWords / LATIN_WPM;

  return { cjkChars, latinWords, totalMinutes };
}

/**
 * Format minutes into a human-readable string.
 * Uses Chinese "分钟" for very short or long articles; falls back to
 * a rounded minute count.
 */
function formatReadingTime(minutes) {
  const rounded = Math.max(1, Math.round(minutes));
  return `${rounded} 分钟`;
}

/** remark plugin factory — no options required. */
export default function remarkReadingTimeCjk() {
  return function (tree, file) {
    const text = toString(tree);
    const { cjkChars, latinWords, totalMinutes } = analyzeText(text);

    // Ensure the frontmatter namespace exists
    if (!file.data.astro) file.data.astro = {};
    if (!file.data.astro.frontmatter) file.data.astro.frontmatter = {};

    file.data.astro.frontmatter.readingTime = formatReadingTime(totalMinutes);
    file.data.astro.frontmatter.wordCount = cjkChars + latinWords;
  };
}
