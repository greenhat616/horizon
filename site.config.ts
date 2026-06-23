/**
 * site.config.ts — Single source of truth for site-wide brand & navigation.
 *
 * The schema (`SiteConfig`) and the `defineSiteConfig()` helper live in
 * `src/lib/site.ts`. Deployment-varying values (`SITE_URL`, `ARTALK_SERVER`) are
 * sourced from astro:env/client and re-exported from there — this file holds
 * only the static brand copy and menu. Every layout/component imports the
 * resolved config from here instead of redefining its own copy.
 *
 * Values derive from the legacy config.toml + config/_default/{params,menu}.toml.
 */

import { defineSiteConfig } from "./src/lib/site";

export default defineSiteConfig({
  title: "藤之青",
  subtitle: "亲眼所见，亦非真实",
  copyright: "2026 a632079",
  description: "亲眼所见，亦非真实",
  favicon: "https://cdn.a632079.me/favicon.ico",
  artalkSite: "藤之青",
  nav: [
    { url: "https://github.com/greenhat616", name: "Github", weight: 1 },
    { url: "https://moebako.a632079.me/", name: "Moebako", weight: 2 },
    { url: "/friends/", name: "朋友们", weight: 3 },
    { url: "/posts/", name: "文章", weight: 4 },
    { url: "/index.xml", name: "RSS", weight: 5 },
  ],
});
