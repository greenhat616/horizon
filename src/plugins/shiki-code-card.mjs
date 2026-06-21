/**
 * shiki-code-card
 *
 * A Shiki transformer that wraps every highlighted `<pre>` in a `.code-card`
 * frame carrying:
 *   - a header bar with the language label (left) and a copy button (right),
 *     plus an optional title parsed from the fence meta;
 *   - a `line-numbers` class on the `<pre>` (default ON) so pure-CSS counters
 *     render a gutter — disabled per-block via the `no-line-numbers` meta flag.
 *
 * Runs inside Astro's Shiki step (config `markdown.shikiConfig.transformers`),
 * which is the only extension point that exposes the raw fence meta string via
 * `this.options.meta.__raw` (needed for the per-block title / line-number flag).
 *
 * The copy button is inert markup; behaviour is attached by the delegated
 * vanilla listener in `src/scripts/code-card.ts` (booted from BaseLayout).
 *
 * Authoring:
 *   ```ts title="server.ts"        → title shown in the bar
 *   ```bash no-line-numbers        → suppress the line-number gutter
 *
 * Composes with `rehype-code-group`: each `.code-card` figure is later wrapped
 * into a tab panel; group-scoped CSS hides the now-redundant per-card label.
 */

// ---------------------------------------------------------------------------
// hast helpers
// ---------------------------------------------------------------------------

/** Build a hast element node. */
const h = (tagName, properties = {}, children = []) => ({
  type: "element",
  tagName,
  properties,
  children,
});

/** Build a hast text node. */
const t = (value) => ({ type: "text", value });

/**
 * Inline SVG icon (clipboard / check). hast-util-to-html auto-switches to SVG
 * space for `<svg>` descendants, so camelCased props map to correct attributes.
 *
 * @param {'copy'|'done'} kind
 */
function icon(kind) {
  const base = {
    viewBox: "0 0 24 24",
    width: "15",
    height: "15",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };
  if (kind === "copy") {
    return h(
      "svg",
      { ...base, className: ["code-card__icon", "code-card__icon--copy"] },
      [
        h("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2" }),
        h("path", {
          d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
        }),
      ],
    );
  }
  return h(
    "svg",
    { ...base, className: ["code-card__icon", "code-card__icon--done"] },
    [h("polyline", { points: "20 6 9 17 4 12" })],
  );
}

// ---------------------------------------------------------------------------
// Language label map
// ---------------------------------------------------------------------------

/** Friendly display names; falls back to UPPERCASE of the resolved lang id. */
const LANG_LABELS = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  less: "Less",
  json: "JSON",
  json5: "JSON5",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  ini: "INI",
  conf: "INI",
  md: "Markdown",
  markdown: "Markdown",
  mdx: "MDX",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  shellscript: "Shell",
  zsh: "Zsh",
  powershell: "PowerShell",
  ps1: "PowerShell",
  php: "PHP",
  py: "Python",
  python: "Python",
  go: "Go",
  rust: "Rust",
  rs: "Rust",
  java: "Java",
  kotlin: "Kotlin",
  c: "C",
  cpp: "C++",
  "c++": "C++",
  cs: "C#",
  csharp: "C#",
  sql: "SQL",
  diff: "Diff",
  docker: "Dockerfile",
  dockerfile: "Dockerfile",
  nginx: "Nginx",
  vue: "Vue",
  svelte: "Svelte",
  astro: "Astro",
  xml: "XML",
  text: "TEXT",
  plaintext: "TEXT",
  txt: "TEXT",
};

/** @param {string} lang */
function labelFor(lang) {
  return LANG_LABELS[lang] || lang.toUpperCase();
}

// ---------------------------------------------------------------------------
// Meta parsing
// ---------------------------------------------------------------------------

/**
 * Parse the raw fence meta (`title="x" no-line-numbers`).
 * @param {string} meta
 */
function parseMeta(meta) {
  const titleMatch = meta.match(/title=(?:"([^"]*)"|'([^']*)')/);
  const title = titleMatch ? (titleMatch[1] ?? titleMatch[2]) : undefined;
  const noLineNumbers = /(?:^|\s)no-line-numbers(?:\s|$)/i.test(meta);
  return { title, noLineNumbers };
}

/** Normalise a hast `className` property into a string array. */
function toClassList(className) {
  if (Array.isArray(className)) return [...className];
  if (typeof className === "string")
    return className.split(/\s+/).filter(Boolean);
  return [];
}

// ---------------------------------------------------------------------------
// Transformer
// ---------------------------------------------------------------------------

/**
 * @returns {import('@shikijs/types').ShikiTransformer}
 */
export function transformerCodeCard() {
  return {
    name: "code-card",
    root(root) {
      const pre = root.children.find(
        (node) => node.type === "element" && node.tagName === "pre",
      );
      if (!pre) return;

      const lang = String(this.options.lang || "text").toLowerCase();
      const meta = this.options?.meta?.__raw ?? "";
      const { title, noLineNumbers } = parseMeta(meta);

      // Line numbers: default ON via CSS counters; opt out per block.
      const cls = toClassList(pre.properties.className);
      if (!noLineNumbers && !cls.includes("line-numbers"))
        cls.push("line-numbers");
      pre.properties.className = cls;

      // Header bar: language label, optional title, copy button.
      const barChildren = [
        h("span", { className: ["code-card__lang"] }, [t(labelFor(lang))]),
      ];
      if (title) {
        barChildren.push(
          h("span", { className: ["code-card__title"] }, [t(title)]),
        );
      }
      barChildren.push(
        h(
          "button",
          {
            type: "button",
            className: ["code-card__copy"],
            "aria-label": "复制代码",
          },
          [icon("copy"), icon("done")],
        ),
      );

      const figure = h(
        "figure",
        { className: ["code-card"], "data-lang": lang },
        [h("div", { className: ["code-card__bar"] }, barChildren), pre],
      );

      root.children = [figure];
    },
  };
}

export default transformerCodeCard;
