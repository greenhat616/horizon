import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import rehypeCodeGroup from "rehype-code-group";
import rehypeReadingTime from "./src/plugins/rehype-reading-time.mjs";
import remarkModifiedTime from "./src/plugins/remark-modified-time.mjs";
import remarkHugoShortcodes from "./src/plugins/remark-hugo-shortcodes.mjs";
import { transformerCodeCard } from "./src/plugins/shiki-code-card.mjs";

// The canonical origin must be known here (it feeds `site:` → sitemap / RSS /
// canonical URLs), but astro:env/client isn't available during config bootstrap.
// Load the gitignored .env natively (zero deps); CI injects the var instead, in
// which case there is no file and the value comes straight from the environment.
try {
  process.loadEnvFile();
} catch (error) {
  // A missing .env (e.g. CI, where the var is injected) is expected; any other
  // failure (malformed/unreadable file) is real and must not be swallowed.
  if (error?.code !== "ENOENT") throw error;
}
const SITE_URL = process.env.PUBLIC_SITE_URL;

export default defineConfig({
  output: "static",
  site: SITE_URL,
  trailingSlash: "always",
  // Astro v7 changed the default to 'jsx', which strips whitespace between inline
  // elements following JSX/React rules. Pin to the v6 HTML-aware behavior so the
  // rendered output stays byte-equivalent with the parity baseline.
  compressHTML: true,
  env: {
    schema: {
      PUBLIC_SITE_URL: envField.string({
        context: "client",
        access: "public",
        url: true,
      }),
      PUBLIC_ARTALK_SERVER: envField.string({
        context: "client",
        access: "public",
        url: true,
      }),
    },
  },
  integrations: [
    sitemap({
      // Exclude draft-related paths and hidden special pages from the sitemap.
      // /friends/ and /workers/ are hidden:true pages not meant for crawlers.
      filter: (page) =>
        !page.includes("/friends/") &&
        !page.includes("/workers/") &&
        !page.includes("/404"),
    }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // Astro v7 defaults to the native Sätteri pipeline, but our toolchain is built
    // on remark/rehype. Setting remarkPlugins/rehypePlugins keeps Astro on the
    // unified() pipeline (requires the now-explicit @astrojs/markdown-remark dep).
    // Hugo shortcode pre-processor must run first so remark sees clean Markdown
    remarkPlugins: [remarkHugoShortcodes, remarkModifiedTime],
    // VitePress-style ::: code-group tabs (wraps code blocks at the HAST level,
    // injects its own switch script/style into <head>; we override its classes).
    // rehypeReadingTime counts the rendered HTML text (Hugo's countwords .Content).
    rehypePlugins: [rehypeCodeGroup, rehypeReadingTime],
    shikiConfig: {
      // Dual theme: light site mode → a light palette (github-light); dark site
      // mode (html.night) → monokai. Shiki inlines the light colors as the
      // default and emits `--shiki-dark`/`--shiki-dark-bg` CSS vars on every
      // token; dark-mode.scss flips the code surface to those vars under .night.
      themes: {
        light: "github-light",
        dark: "monokai",
      },
      defaultColor: "light",
      // Map non-lowercase fence languages used in legacy content to Shiki ids
      // so they highlight instead of falling back to plain text.
      langAlias: {
        HTML: "html",
        PHP: "php",
        JavaScript: "js",
        conf: "ini",
      },
      // Wrap each <pre> in a .code-card frame (lang label + copy + line numbers).
      transformers: [transformerCodeCard()],
    },
  },
});
