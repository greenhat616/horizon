#!/usr/bin/env node
/**
 * new-post.mjs — Interactively scaffold a new post in src/content/posts/.
 *
 * Zero dependencies (node:readline/promises). Prompts for title, slug,
 * description, tags, categories and draft flag, then writes a Markdown file
 * with frontmatter that matches the existing corpus:
 *   - `date` is the created-at, written in Asia/Shanghai ISO (…+08:00) to match
 *     content.config.ts#toDate and the existing posts.
 *   - New posts default to `draft: true`; flip them with `pnpm post:publish`,
 *     which also rewrites `date` to the publish moment.
 *   - `lastmod` is intentionally omitted so the git-derived value drives it
 *     until the author pins an explicit override.
 *
 * Usage: pnpm post:new
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, "..", "src", "content", "posts");

/** Format a Date as a bare Asia/Shanghai ISO string, e.g. 2026-06-23T15:04:09+08:00. */
function shanghaiISO(date) {
  // en-CA gives YYYY-MM-DD; en-GB hour12:false gives HH:mm:ss. Pin the zone so
  // the wall-clock reads as UTC+8 regardless of the host's local timezone.
  const opts = { timeZone: "Asia/Shanghai" };
  const ymd = date.toLocaleDateString("en-CA", opts);
  const hms = date.toLocaleTimeString("en-GB", { ...opts, hour12: false });
  return `${ymd}T${hms}+08:00`;
}

/** Quote a YAML scalar defensively (double-quote + escape embedded quotes). */
function yamlScalar(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Render a YAML block list, or an empty value when the list is empty. */
function yamlList(key, items) {
  if (items.length === 0) return `${key}:`;
  return `${key}:\n${items.map((i) => `  - ${i}`).join("\n")}`;
}

/** Split a comma/、-separated answer into a trimmed, de-duped list. */
function parseList(answer) {
  return [
    ...new Set(
      answer
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

/** Loose slug suggestion: lowercase, spaces→`-`, drop non-[a-z0-9-] runs. */
function suggestSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Interactive on a TTY; when stdin is piped (tests, CI) readline/promises hangs
// on EOF, so pre-buffer the lines and answer from a queue instead.
const isTTY = Boolean(input.isTTY);
const rl = isTTY ? createInterface({ input, output }) : null;
let queued = [];
if (!isTTY) {
  let buf = "";
  input.setEncoding("utf-8");
  for await (const chunk of input) buf += chunk;
  queued = buf.split(/\r?\n/);
}

/** Ask one question; reads from the TTY or the pre-buffered queue. */
async function ask(prompt) {
  if (rl) return rl.question(prompt);
  output.write(prompt);
  const line = queued.shift() ?? "";
  output.write(line + "\n");
  return line;
}

try {
  const title = (await ask("Title (required): ")).trim();
  if (!title) {
    console.error("✗ Title is required. Aborted.");
    rl?.close();
    process.exit(1);
  }

  const slugSuggestion = suggestSlug(title);
  const slugAnswer = (
    await ask(
      `Slug${slugSuggestion ? ` [${slugSuggestion}]` : " (required for CJK titles)"}: `,
    )
  ).trim();
  const slug = (slugAnswer || slugSuggestion).toLowerCase();
  if (!slug) {
    console.error("✗ Could not derive a slug; please provide one. Aborted.");
    rl?.close();
    process.exit(1);
  }

  const description = (await ask("Description (optional): ")).trim();
  const tags = parseList(await ask("Tags (comma-separated): "));
  const categories = parseList(await ask("Categories (comma-separated): "));
  // Optional fields: prompt the author, but default to null (empty value) when
  // left blank — the Zod schema treats an empty key as nullish/absent.
  const featuredImage = (await ask("Featured image URL (optional): ")).trim();

  const filenameDefault = `${title}.md`;
  const filenameAnswer = (await ask(`Filename [${filenameDefault}]: `)).trim();
  const filename = filenameAnswer || filenameDefault;
  const targetPath = join(POSTS_DIR, filename);

  if (existsSync(targetPath)) {
    console.error(`✗ ${filename} already exists. Aborted.`);
    rl?.close();
    process.exit(1);
  }

  // Guard against slug collisions with existing posts.
  const SLUG_RE = /^slug:\s*['"]?(.+?)['"]?\s*$/m;
  const collision = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .find((f) => {
      const m = SLUG_RE.exec(readFileSync(join(POSTS_DIR, f), "utf-8"));
      return m && m[1].toLowerCase() === slug;
    });
  if (collision) {
    console.error(`✗ slug "${slug}" already used by ${collision}. Aborted.`);
    rl?.close();
    process.exit(1);
  }

  const now = shanghaiISO(new Date());
  const lines = [
    "---",
    `title: ${yamlScalar(title)}`,
    `slug: ${slug}`,
    `date: ${now}`,
    description ? `description: ${yamlScalar(description)}` : "description:",
    yamlList("tags", tags),
    yamlList("categories", categories),
    featuredImage ? `featured_image: ${featuredImage}` : "featured_image:",
    "draft: true",
    "---",
    "",
    "",
  ];

  writeFileSync(targetPath, lines.join("\n"), "utf-8");
  console.log(`✓ Created src/content/posts/${filename}`);
  console.log(`  slug: ${slug}   url: /posts/${slug}/   draft: true`);
  console.log(
    "  → write your content, then publish with: pnpm post:publish " + slug,
  );
} finally {
  rl?.close();
}
