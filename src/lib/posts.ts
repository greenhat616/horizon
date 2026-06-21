/**
 * posts.ts — Centralised listability/routing rules for the posts collection.
 *
 * Replaces the `!p.data.draft && !p.data.hidden` predicate that was
 * copy-pasted across the home feed, archive, pagination, tag, and category
 * pages. Keeping the rule in one place means drafts surface (or stay hidden)
 * consistently everywhere.
 *
 * Draft visibility is gated on `astro dev`: drafts are listable and routable
 * during development for preview, but PROD builds (`astro build`) exclude them
 * exactly as before — preserving the production URL contract (sitemap parity).
 * `hidden` posts (friends/workers) are excluded unconditionally.
 */

import type { CollectionEntry } from "astro:content";

/** Drafts are visible only under `astro dev`; PROD builds always exclude them. */
export const SHOW_DRAFTS = import.meta.env.DEV;

/**
 * Stable URL segment for a post: the frontmatter slug, falling back to the
 * glob id (filename) when absent. The fallback keeps slug-less draft files
 * (e.g. Unraid.md) from generating `/posts/undefined/` in dev.
 */
export function postSlug(p: CollectionEntry<"posts">): string {
  return p.data.slug ?? p.id;
}

/** Listable/routable: never `hidden`; drafts only under dev. */
export function isListable(p: CollectionEntry<"posts">): boolean {
  return !p.data.hidden && (SHOW_DRAFTS || !p.data.draft);
}
