/**
 * site.ts — Site configuration schema + factory.
 *
 * Defines the `SiteConfig` shape and the `defineSiteConfig()` helper consumed by
 * the root `site.config.ts` (the single source of truth for site-wide brand and
 * navigation values). Acts as a typed identity à la Astro's `defineConfig`, and
 * normalizes the nav order so callers never re-sort.
 *
 * Deployment-varying values (canonical origin, comment server) are read from
 * astro:env/client (PUBLIC_*) and re-exported here; see .env.example.
 */

import { PUBLIC_SITE_URL, PUBLIC_ARTALK_SERVER } from "astro:env/client";

// ─── Schema ──────────────────────────────────────────────────────────────────

export interface NavItem {
  /** Link target (absolute path or external URL). */
  url: string;
  /** Display label. */
  name: string;
  /** Sort key — ascending, matching Hugo's menu render order. */
  weight: number;
}

export interface SiteConfig {
  /** Site title (config.toml `title`). */
  title: string;
  /** Tagline shown beneath the title (params.toml `subtitle`). */
  subtitle: string;
  /** Copyright line (config.toml `copyright`). */
  copyright: string;
  /** Default OG/meta description (params.toml `description`). */
  description: string;
  /** Favicon URL (params.toml `favicon`). */
  favicon: string;
  /**
   * Artalk site identifier. Must match the backend site name and the `site`
   * field of imported comment data. Fixed brand label; '' for single-site.
   */
  artalkSite: string;
  /** Primary navigation menu (config/_default/menu.toml [[main]] entries). */
  nav: NavItem[];
}

/**
 * Define the site configuration. Typed identity (like Astro's `defineConfig`)
 * that also normalizes `nav` — sorted ascending by `weight`, matching Hugo's
 * menu render order — so every consumer renders the same order without sorting.
 */
export function defineSiteConfig(config: SiteConfig): SiteConfig {
  return {
    ...config,
    nav: [...config.nav].sort((a, b) => a.weight - b.weight),
  };
}

// ─── Deployment-varying values (astro:env/client, PUBLIC_*) ───────────────────

/** Canonical origin (PUBLIC_SITE_URL; mirrors astro.config `site`). */
export const SITE_URL = PUBLIC_SITE_URL;

/** Artalk comment-server origin (PUBLIC_ARTALK_SERVER). */
export const ARTALK_SERVER = PUBLIC_ARTALK_SERVER;
