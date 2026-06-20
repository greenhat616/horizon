import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import rehypeCodeGroup from 'rehype-code-group';
import rehypeReadingTime from './src/plugins/rehype-reading-time.mjs';
import remarkModifiedTime from './src/plugins/remark-modified-time.mjs';
import remarkHugoShortcodes from './src/plugins/remark-hugo-shortcodes.mjs';
import { transformerCodeCard } from './src/plugins/shiki-code-card.mjs';

export default defineConfig({
  output: 'static',
  site: 'https://i.a632079.me',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // Exclude draft-related paths and hidden special pages from the sitemap.
      // /friends/ and /workers/ are hidden:true pages not meant for crawlers.
      filter: (page) =>
        !page.includes('/friends/') &&
        !page.includes('/workers/') &&
        !page.includes('/404'),
    }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // Hugo shortcode pre-processor must run first so remark sees clean Markdown
    remarkPlugins: [
      remarkHugoShortcodes,
      remarkModifiedTime,
    ],
    // VitePress-style ::: code-group tabs (wraps code blocks at the HAST level,
    // injects its own switch script/style into <head>; we override its classes).
    // rehypeReadingTime counts the rendered HTML text (Hugo's countwords .Content).
    rehypePlugins: [rehypeCodeGroup, rehypeReadingTime],
    shikiConfig: {
      theme: 'monokai',
      // Map non-lowercase fence languages used in legacy content to Shiki ids
      // so they highlight instead of falling back to plain text.
      langAlias: {
        HTML: 'html',
        PHP: 'php',
        JavaScript: 'js',
        conf: 'ini',
      },
      // Wrap each <pre> in a .code-card frame (lang label + copy + line numbers).
      transformers: [transformerCodeCard()],
    },
  },
});
