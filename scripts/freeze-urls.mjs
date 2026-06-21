#!/usr/bin/env node
/**
 * freeze-urls.mjs — Scan src/content/posts, derive each post's canonical URL,
 * and write url-manifest.json for URL-parity verification.
 *
 * Slug resolution rules (mirrors Hugo behaviour):
 *   1. If frontmatter contains `slug:` → use it as-is (already lowercased at
 *      migration time; Hugo lowercases at build time).
 *   2. Otherwise derive from filename stem:
 *      a. Strip leading date prefix (YYYY- at word boundary).
 *      b. Lowercase.
 *      c. Replace spaces with `-`.
 *      d. Strip full-width punctuation (，。！？：；、…「」『』【】《》〈〉〔〕〖〗〘〙〚〛).
 *      e. Strip ASCII punctuation except `-` and alphanumeric/CJK.
 *      f. Collapse multiple `-` into one; trim `-`.
 *
 * Output: url-manifest.json at the project root.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, "..", "src", "content", "posts");
const MANIFEST_PATH = join(__dirname, "..", "url-manifest.json");

// Regex patterns
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
const SLUG_RE = /^slug:\s*['"]?(.+?)['"]?\s*$/m;
const TITLE_RE = /^title:\s*['"]?(.*?)['"]?\s*$/m;
// Full-width punctuation and common ASCII punctuation to strip (preserve CJK and hyphens)
const STRIP_PUNCT_RE =
  /[，。！？：；、…「」『』【】《》〈〉〔〕〖〗〘〙〚〛！？：！？：；]/g;
const ASCII_PUNCT_RE = /[^\w一-鿿぀-ゟ゠-ヿ㐀-䶿＀-￯-]/g;
// Leading date prefix like "2017-"
const DATE_PREFIX_RE = /^\d{4}-/;

/**
 * Derive a slug from a markdown filename (without extension).
 * Mirrors Hugo's pathological slug derivation for Chinese filenames.
 */
function deriveSlugFromFilename(stem) {
  // 1. Strip leading YYYY- date prefix
  let s = stem.replace(DATE_PREFIX_RE, "");
  // 2. Lowercase
  s = s.toLowerCase();
  // 3. Replace spaces with hyphens
  s = s.replace(/ /g, "-");
  // 4. Strip full-width punctuation
  s = s.replace(STRIP_PUNCT_RE, "");
  // 5. Strip remaining ASCII punctuation (keep hyphens, word chars, CJK ranges)
  s = s.replace(ASCII_PUNCT_RE, "");
  // 6. Collapse multiple hyphens; trim
  s = s.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  return s;
}

/**
 * Parse YAML-ish frontmatter for a single key using a regex.
 * Handles simple scalar values; does not parse multi-line or complex YAML.
 */
function extractFrontmatterField(content, re) {
  const fm = FRONTMATTER_RE.exec(content);
  if (!fm) return null;
  const m = re.exec(fm[1]);
  return m ? m[1].trim() : null;
}

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

const manifest = files.map((filename) => {
  const filePath = join(POSTS_DIR, filename);
  const content = readFileSync(filePath, "utf-8");

  const stem = basename(filename, ".md");
  const rawSlug = extractFrontmatterField(content, SLUG_RE);
  const title = extractFrontmatterField(content, TITLE_RE) ?? stem;

  let slug;
  let hadExplicitSlug;

  if (rawSlug) {
    // Explicit slug — apply lowercase to match Hugo behaviour
    slug = rawSlug.toLowerCase();
    hadExplicitSlug = true;
  } else {
    slug = deriveSlugFromFilename(stem);
    hadExplicitSlug = false;
  }

  return {
    file: filename,
    title,
    slug,
    url: `/posts/${slug}/`,
    hadExplicitSlug,
  };
});

// Sort by slug for stable output
manifest.sort((a, b) => a.slug.localeCompare(b.slug, "zh"));

writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
console.log(`Written ${manifest.length} entries to url-manifest.json`);
manifest.forEach(({ file, slug, hadExplicitSlug }) => {
  const marker = hadExplicitSlug ? "[explicit]" : "[derived] ";
  console.log(`  ${marker}  ${slug}  ←  ${file}`);
});
