/**
 * site.config.ts — Single source of truth for site-wide constants.
 *
 * Values are derived from config.toml + config/_default/{params,menu}.toml.
 * All layout and component hardcodes should reference these exports instead.
 *
 * Deployment-varying values (canonical origin, comment server) are read from
 * astro:env/client (PUBLIC_*); see .env.example. Brand copy stays hardcoded.
 */

import { PUBLIC_SITE_URL, PUBLIC_ARTALK_SERVER } from "astro:env/client";

// ─── Site identity ────────────────────────────────────────────────────────────

/** Site title (config.toml `title`). */
export const SITE_TITLE = "藤之青";

/** Tagline shown beneath the title (params.toml `subtitle`). */
export const SITE_SUBTITLE = "亲眼所见，亦非真实";

/** Copyright line (config.toml `copyright`). */
export const SITE_COPYRIGHT = "2026 a632079";

/** Canonical origin (astro:env PUBLIC_SITE_URL; mirrors astro.config `site`). */
export const SITE_URL = PUBLIC_SITE_URL;

/** Default OG/meta description (params.toml `description`). */
export const SITE_DESCRIPTION = "亲眼所见，亦非真实";

// ─── Assets ──────────────────────────────────────────────────────────────────

/** Favicon URL (params.toml `favicon`). */
export const FAVICON_URL = "https://cdn.a632079.me/favicon.ico";

// ─── Comments (Artalk) ───────────────────────────────────────────────────────

/** Artalk comment-server origin (astro:env PUBLIC_ARTALK_SERVER). */
export const ARTALK_SERVER = PUBLIC_ARTALK_SERVER;

/**
 * Artalk site identifier. Must match the backend site name and the `site` field
 * of imported comment data. Fixed brand label, not an env var; '' for single-site.
 */
export const ARTALK_SITE = "藤之青";

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  url: string;
  name: string;
  weight: number;
}

/**
 * Primary navigation menu (config/_default/menu.toml [[main]] entries).
 * Sorted ascending by weight — same render order as Hugo.
 */
export const NAV_ITEMS: NavItem[] = [
  { url: "https://github.com/greenhat616", name: "Github", weight: 1 },
  { url: "/friends/", name: "朋友们", weight: 2 },
  { url: "/posts/", name: "文章", weight: 4 },
  { url: "/index.xml", name: "RSS", weight: 5 },
].sort((a, b) => a.weight - b.weight);
