/**
 * post-card.ts — Shared mapping from a posts collection entry to the card data
 * consumed by ListLayout / PostCard.
 *
 * Centralises the projection that was previously copy-pasted across the home
 * page, the paginated archive, and the tag/category pages. It also attaches the
 * reading-time figure (in seconds) so the list can show the same "min s" string
 * the article header shows.
 *
 * The reading time is read back from `render()`'s remarkPluginFrontmatter — the
 * exact value computed by remark-reading-time-cjk — so a post's list entry and
 * its article header never disagree. `render()` only compiles each entry once,
 * so calling it here (even across multiple taxonomy pages) is cheap.
 */

import { render, type CollectionEntry } from "astro:content";
import { postSlug } from "./posts";

export interface PostCardData {
  href: string;
  title: string;
  summary?: string;
  featuredImage?: string | null;
  date: Date;
  categories: string[];
  tags: string[];
  readingSeconds?: number;
  draft?: boolean;
}

/** Project a posts collection entry into list-card data. */
export async function toCardData(
  p: CollectionEntry<"posts">,
): Promise<PostCardData> {
  const { remarkPluginFrontmatter } = await render(p);
  const rs = remarkPluginFrontmatter?.readingSeconds;

  return {
    href: `/posts/${postSlug(p)}/`,
    title: p.data.title,
    summary: p.data.description ?? undefined,
    featuredImage: p.data.featured_image ?? undefined,
    date: p.data.date,
    categories: p.data.categories ?? [],
    tags: p.data.tags ?? [],
    readingSeconds: typeof rs === "number" ? rs : undefined,
    draft: p.data.draft,
  };
}
