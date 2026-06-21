/**
 * rehype-reading-time
 *
 * Reproduces the Hugo "diary" theme's reading-time figure so the Astro site
 * shows the SAME "min s" as the live site (i.a632079.me).
 *
 * Hugo computes it from `countwords .Content`, i.e. the STRIPPED RENDERED HTML:
 *   {{ $readTime := mul (div (countwords .Content) 220.0) 60 }}  // seconds
 *   {{ $minutes  := math.Floor (div $readTime 60) }}
 *   {{ $seconds  := mod $readTime 60 }}                          // int64 trunc
 *
 * Counting the rendered HTML (this plugin, run at the HAST stage) rather than
 * the parsed Markdown matters: legacy posts embed raw inline HTML, whose tag
 * names and attribute URLs `StripHTML` discards but the Markdown AST would
 * otherwise count as words. We collect only text-node content — the rehype
 * equivalent of `StripHTML` — then count it Hugo's way.
 *
 * Writes to file.data.astro.frontmatter:
 *   readingSeconds {number} — reading time in seconds (Hugo's $readTime)
 *   wordCount      {number} — Hugo-equivalent word count
 *
 * Keep the counting logic in sync with src/lib/reading-time.ts.
 */

/** Hugo's reading speed, words per minute. */
const WORDS_PER_MINUTE = 220;

const encoder = new TextEncoder();

/** Concatenate the text content of a hast tree (ignoring tags, comments, raw). */
function hastText(node) {
  if (node.type === "text") return node.value;
  if (node.children) {
    let out = "";
    for (const child of node.children) out += hastText(child);
    return out;
  }
  return "";
}

/**
 * Hugo `countwords`: CJK (multi-byte) tokens contribute their rune count,
 * pure-ASCII tokens contribute 1. Mirrors strings.Fields + the per-token
 * `len(word) == RuneCount` test (byte length vs rune count).
 */
function countWordsHugo(text) {
  let count = 0;
  for (const token of text.split(/\s+/)) {
    if (!token) continue;
    const runeCount = [...token].length;
    const byteLength = encoder.encode(token).length;
    count += byteLength === runeCount ? 1 : runeCount;
  }
  return count;
}

/** rehype plugin factory — no options required. */
export default function rehypeReadingTime() {
  return function (tree, file) {
    const words = countWordsHugo(hastText(tree));
    const readingSeconds = (words / WORDS_PER_MINUTE) * 60;

    if (!file.data.astro) file.data.astro = {};
    if (!file.data.astro.frontmatter) file.data.astro.frontmatter = {};

    file.data.astro.frontmatter.readingSeconds = readingSeconds;
    file.data.astro.frontmatter.wordCount = words;
  };
}
