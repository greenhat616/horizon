/**
 * remark-hugo-shortcodes
 *
 * Strips / transforms Hugo shortcode syntax at two levels:
 *
 *   1. **String pre-pass** (`stripShortcodes`) — exported pure function used by
 *      the RSS pipeline and the parser wrapper.  Runs regexes over raw Markdown
 *      and is safe to call outside of any unified context.
 *
 *   2. **Parser wrapper** — wraps `this.parser` (set by remark-parse via Astro)
 *      so that `stripShortcodes` eliminates shortcodes *before* the mdast is
 *      built.  This is the primary path.
 *
 *   3. **mdast transformer** — walks the parsed tree with `unist-util-visit`
 *      and strips residual shortcode tokens from paragraph/html nodes.
 *      Defensive fallback for edge cases the string pass could not cover.
 *
 * Supported shortcodes:
 *
 *   {{<row>}} / {{</row>}}
 *     Unwrap — remove the open/close tags, keep the inner content.
 *
 *   {{<friends>}} / {{</friends>}} / {{<friends-list>}}
 *     Remove entirely (list rendered by FriendsGrid component).
 *
 *   {{<bilibili BVID [PAGE]>}}
 *     Replace with a responsive 16:9 <iframe> embed block.
 *
 *   {{<notice TYPE>}} … {{</notice>}}
 *     Best-effort: wrap in <blockquote data-notice-type="TYPE">.
 *     Not used in current content; tags are stripped on fallback.
 */

import { visit, SKIP, CONTINUE } from "unist-util-visit";

// ---------------------------------------------------------------------------
// Regex constants
// ---------------------------------------------------------------------------

/** {{<row>}} opening tag */
const ROW_OPEN_RE = /\{\{<\s*row\s*>\}\}/g;
/** {{</row>}} closing tag */
const ROW_CLOSE_RE = /\{\{<\s*\/row\s*>\}\}/g;

/** {{<friends>}}, {{</friends>}}, or {{<friends-list>}} */
const FRIENDS_RE = /\{\{<\s*\/?friends(?:-list)?\s*>\}\}/g;

/**
 * {{<notice TYPE>}} … {{</notice>}} blocks.
 * Capture groups: 1 = notice type, 2 = inner content.
 */
const NOTICE_RE =
  /\{\{<\s*notice\s+(\S+)\s*>\}\}([\s\S]*?)\{\{<\s*\/notice\s*>\}\}/g;

/**
 * {{<bilibili BVID>}} or {{<bilibili BVID PAGE>}}.
 * Capture groups: 1 = BV id, 2 = optional page number.
 */
const BILIBILI_RE = /\{\{<\s*bilibili\s+(BV\w+)(?:\s+(\d+))?\s*>\}\}/g;

/** Matches any remaining shortcode tag — used in the defensive AST walk. */
const ANY_SHORTCODE_RE = /\{\{<[^>]*>\}\}/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Emit a responsive 16:9 Bilibili iframe embed string.
 *
 * @param {string} bvid  BV identifier
 * @param {string|undefined} page  Optional page number
 * @returns {string} HTML fragment
 */
function bilibiliEmbed(bvid, page) {
  const pageParam = page ? `&page=${page}` : "";
  return (
    `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">` +
    `<iframe src="//player.bilibili.com/player.html?bvid=${bvid}${pageParam}&high_quality=1&danmaku=0" ` +
    `style="position:absolute;top:0;left:0;width:100%;height:100%;" ` +
    `scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" ` +
    `loading="lazy"></iframe>` +
    `</div>`
  );
}

// ---------------------------------------------------------------------------
// Public API — pure string pre-processor (also consumed by RSS pipeline)
// ---------------------------------------------------------------------------

/**
 * Strip / transform Hugo shortcode syntax in raw Markdown text.
 *
 * Safe to call outside of any unified context — no AST involved.
 * The RSS pipeline calls this before passing body text to `bodyToHtml`.
 *
 * @param {string} markdown  Raw Markdown source
 * @returns {string}         Markdown with shortcodes removed or replaced
 */
export function stripShortcodes(markdown) {
  let src = markdown;

  // 1. Notice blocks — run first so nested row/friends are handled
  src = src.replace(NOTICE_RE, (_match, type, inner) => {
    const escaped = type.toLowerCase().replace(/[^a-z0-9-]/g, "");
    return `<blockquote data-notice-type="${escaped}">\n\n${inner.trim()}\n\n</blockquote>`;
  });

  // 2. Bilibili embeds
  src = src.replace(BILIBILI_RE, (_match, bvid, page) =>
    bilibiliEmbed(bvid, page),
  );

  // 3. row wrappers — strip the tags, keep whatever is between them
  src = src.replace(ROW_OPEN_RE, "");
  src = src.replace(ROW_CLOSE_RE, "");

  // 4. friends / friends-list — remove entirely
  src = src.replace(FRIENDS_RE, "");

  return src;
}

// ---------------------------------------------------------------------------
// remark plugin
// ---------------------------------------------------------------------------

/**
 * remark plugin factory.
 *
 * Astro adds remark-parse as the base parser, then calls user-provided remark
 * plugins.  By the time this attacher runs, `this.parser` already points to
 * remark-parse's `fromMarkdown` wrapper.  We replace it with a thin wrapper
 * that applies `stripShortcodes` to the raw source string before the real
 * parser runs, ensuring the mdast never sees shortcode tokens.
 *
 * A defensive transformer also walks the resulting mdast to catch any residual
 * tokens (e.g. if the parser is substituted later by another plugin).
 *
 * @this {import('unified').Processor}
 */
export default function remarkHugoShortcodes() {
  // --- (a) Wrap this.parser to pre-process raw Markdown ---
  // remark-parse (loaded by Astro) sets `this.parser` to a function:
  //   function parser(doc) { return fromMarkdown(doc, options) }
  // We replace it with a wrapper that cleans the source first.
  const originalParser = this.parser;

  if (typeof originalParser === "function") {
    this.parser = function shortcodesParser(doc, file) {
      const cleaned = stripShortcodes(String(doc));
      // Keep file.value consistent with what the parser will build from.
      if (file && "value" in file) file.value = cleaned;
      return originalParser.call(this, cleaned, file);
    };
  }

  // --- (b) Transformer: defensive AST walk for residual tokens ---
  return function transformer(tree) {
    // Remove standalone paragraph nodes whose text is entirely a shortcode.
    visit(tree, "paragraph", (node, index, parent) => {
      const rawText = node.children
        .map((c) => ("value" in c ? c.value : ""))
        .join("");

      if (!ANY_SHORTCODE_RE.test(rawText)) return CONTINUE;

      if (parent && typeof index === "number") {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }

      // Inline fallback: scrub shortcode tokens from text children.
      for (const child of node.children) {
        if (child.type === "text" && ANY_SHORTCODE_RE.test(child.value)) {
          child.value = child.value.replace(/\{\{<[^>]*>\}\}/g, "");
        }
      }
      return CONTINUE;
    });

    // Clean or remove html nodes that are purely a shortcode token.
    visit(tree, "html", (node, index, parent) => {
      if (!ANY_SHORTCODE_RE.test(node.value)) return CONTINUE;

      node.value = node.value.replace(/\{\{<[^>]*>\}\}/g, "");
      if (!node.value.trim() && parent && typeof index === "number") {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
      return CONTINUE;
    });
  };
}
