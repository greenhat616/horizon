import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import remarkReadingTimeCjk from './src/plugins/remark-reading-time-cjk.mjs';
import remarkModifiedTime from './src/plugins/remark-modified-time.mjs';
import remarkHugoShortcodes from './src/plugins/remark-hugo-shortcodes.mjs';

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
      remarkReadingTimeCjk,
      remarkModifiedTime,
    ],
    shikiConfig: {
      theme: 'monokai',
    },
  },
});
