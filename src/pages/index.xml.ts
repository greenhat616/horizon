/**
 * index.xml.ts — Full-content RSS 2.0 feed at /index.xml.
 *
 * Mirrors themes/diary/layouts/index.rss.xml:
 *   - Channel title:       藤之青
 *   - Channel description: 亲眼所见，亦非真实
 *   - Items: published posts (draft=false, hidden=false), newest first
 *   - Per item: title, pubDate=data.date, content=full HTML,
 *               description=plain excerpt, link=absolute,
 *               guid=absolute link (matches Hugo .Permalink)
 *
 * Full-content strategy: render each post's .body through a
 * remark-parse → remark-gfm → remark-rehype → rehype-stringify pipeline.
 * Hugo shortcodes are stripped via `stripShortcodes` before the pipeline
 * runs so the feed never contains raw `{{< >}}` tokens.
 * The resulting HTML is placed in the `content` field of @astrojs/rss,
 * which emits it inside a <content:encoded> CDATA block.
 */

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE_TITLE, SITE_DESCRIPTION } from '../site.config';
import { stripShortcodes } from '../plugins/remark-hugo-shortcodes.mjs';

// Build-time markdown→HTML processor.
// We initialise lazily to avoid top-level await and keep imports tree-shakeable.
let _processor: {
  process(src: string): Promise<{ toString(): string }>;
} | null = null;

async function getProcessor() {
  if (_processor) return _processor;
  // Dynamic imports avoid the unified dual-version TypeScript conflict that
  // arises when @astrojs/markdown-remark pins its own unified version.
  const [
    { unified },
    { default: remarkParse },
    { default: remarkGfm },
    { default: remarkRehype },
    { default: rehypeStringify },
  ] = await Promise.all([
    import('unified'),
    import('remark-parse'),
    import('remark-gfm'),
    import('remark-rehype'),
    import('rehype-stringify'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _processor = (unified() as any)
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  return _processor!;
}

async function bodyToHtml(body: string): Promise<string> {
  // Strip Hugo shortcodes from the raw Markdown before rendering so that the
  // feed never contains literal {{< >}} tokens.
  const cleaned = stripShortcodes(body);
  const processor = await getProcessor();
  const file = await processor.process(cleaned);
  return file.toString();
}

export async function GET(context: APIContext) {
  const allPosts = await getCollection('posts');
  const published = allPosts
    .filter((p) => !p.data.draft && !p.data.hidden)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const siteOrigin =
    context.site?.toString().replace(/\/$/, '') ?? 'https://i.a632079.me';

  const items = await Promise.all(
    published.map(async (post) => {
      const rawSlug = post.data.slug ?? post.id.replace(/\.mdx?$/, '');
      // Encode CJK and other non-ASCII characters in the slug so the link and
      // guid match the percent-encoded URLs that Astro's sitemap emits.
      const encodedSlug = rawSlug
        .split('/')
        .map((seg) => encodeURIComponent(seg))
        .join('/');
      const link = `${siteOrigin}/posts/${encodedSlug}/`;

      // Render markdown body to HTML for full-content feed.
      let content: string | undefined;
      try {
        content = await bodyToHtml(post.body ?? '');
      } catch {
        // Render failure falls back to description-only.
        content = undefined;
      }

      // description: plain-text excerpt for feed readers that ignore content:encoded
      const description = post.data.description ?? `${SITE_TITLE} ${link}`;

      return {
        title: post.data.title,
        pubDate: post.data.date,
        description,
        // @astrojs/rss emits this as <content:encoded> CDATA (requires xmlns below)
        content,
        link,
        // guid matches Hugo's .Permalink — absolute URL, same as link
        customData: `<guid>${link}</guid>`,
      };
    }),
  );

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    // We already include trailing slashes in each link/guid; disable auto-append.
    trailingSlash: false,
    items,
    customData: `<language>zh-cn</language>`,
    xmlns: {
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
  });
}
