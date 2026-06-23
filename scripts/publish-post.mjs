#!/usr/bin/env node
/**
 * publish-post.mjs — Flip a draft to a published post.
 *
 * Sets `draft: false` and rewrites `date` to the publish moment (created-at is
 * defined as the publish date in this project — see content.config.ts). All
 * other frontmatter and the body are preserved verbatim, including the file's
 * existing line endings.
 *
 * Usage:
 *   pnpm post:publish              # interactive picker over all drafts
 *   pnpm post:publish <slug>       # match by frontmatter slug
 *   pnpm post:publish <filename>   # match by file name (with or without .md)
 *
 * After publishing, re-run `node scripts/freeze-urls.mjs` so the now-published
 * slug enters the url-manifest.json parity baseline (the freeze script does not
 * read `draft`, so only published posts belong there).
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, "..", "src", "content", "posts");

const FRONTMATTER_RE = /^(---\r?\n)([\s\S]*?)(\r?\n---)/;
const SLUG_RE = /^slug:\s*['"]?(.+?)['"]?\s*$/m;
const TITLE_RE = /^title:\s*['"]?(.*?)['"]?\s*$/m;
const DRAFT_TRUE_RE = /^draft:\s*true\s*$/m;

/** Format a Date as a bare Asia/Shanghai ISO string, e.g. 2026-06-23T15:04:09+08:00. */
function shanghaiISO(date) {
  const opts = { timeZone: "Asia/Shanghai" };
  const ymd = date.toLocaleDateString("en-CA", opts);
  const hms = date.toLocaleTimeString("en-GB", { ...opts, hour12: false });
  return `${ymd}T${hms}+08:00`;
}

function readFrontmatter(content) {
  const m = FRONTMATTER_RE.exec(content);
  return m ? m[2] : null;
}

/** Set or insert a single-line scalar field within a frontmatter block string. */
function setField(fmBody, key, value, eol) {
  const re = new RegExp(`^${key}:.*$`, "m");
  if (re.test(fmBody)) return fmBody.replace(re, `${key}: ${value}`);
  return `${fmBody}${eol}${key}: ${value}`;
}

const allMd = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

/** Collect drafts as {file, slug, title}. */
const drafts = allMd
  .map((file) => {
    const fm = readFrontmatter(readFileSync(join(POSTS_DIR, file), "utf-8"));
    if (!fm || !DRAFT_TRUE_RE.test(fm)) return null;
    const slug = SLUG_RE.exec(fm)?.[1]?.toLowerCase() ?? null;
    const title = TITLE_RE.exec(fm)?.[1] ?? file.replace(/\.md$/, "");
    return { file, slug, title };
  })
  .filter(Boolean);

async function resolveTarget() {
  const arg = process.argv[2]?.trim();

  if (arg) {
    const key = arg.toLowerCase().replace(/\.md$/, "");
    const match = drafts.find(
      (d) =>
        d.slug === key || d.file.replace(/\.md$/, "").toLowerCase() === key,
    );
    if (!match) {
      console.error(`✗ No draft found matching "${arg}".`);
      if (drafts.length) {
        console.error(
          "  Available drafts: " +
            drafts.map((d) => d.slug ?? d.file).join(", "),
        );
      }
      process.exit(1);
    }
    return match;
  }

  if (drafts.length === 0) {
    console.log("No drafts found. Nothing to publish.");
    process.exit(0);
  }

  const rl = createInterface({ input, output });
  try {
    console.log("Drafts:");
    drafts.forEach((d, i) => {
      console.log(`  [${i + 1}] ${d.title}  (${d.slug ?? d.file})`);
    });
    const answer = (await rl.question("Pick a draft to publish [1]: ")).trim();
    const idx = answer ? Number(answer) - 1 : 0;
    if (!Number.isInteger(idx) || idx < 0 || idx >= drafts.length) {
      console.error("✗ Invalid selection. Aborted.");
      process.exit(1);
    }
    return drafts[idx];
  } finally {
    rl.close();
  }
}

const target = await resolveTarget();
const path = join(POSTS_DIR, target.file);
const content = readFileSync(path, "utf-8");
const m = FRONTMATTER_RE.exec(content);
if (!m) {
  console.error(`✗ ${target.file} has no frontmatter block. Aborted.`);
  process.exit(1);
}

const eol = m[1].includes("\r\n") ? "\r\n" : "\n";
const now = shanghaiISO(new Date());

let fmBody = m[2];
fmBody = setField(fmBody, "draft", "false", eol);
fmBody = setField(fmBody, "date", now, eol);

const updated = content.replace(FRONTMATTER_RE, `${m[1]}${fmBody}${m[3]}`);
writeFileSync(path, updated, "utf-8");

console.log(`✓ Published ${target.file}`);
console.log(`  draft: false   date: ${now}`);
if (target.slug) console.log(`  url: /posts/${target.slug}/`);
console.log("  → refresh URL parity baseline: node scripts/freeze-urls.mjs");
