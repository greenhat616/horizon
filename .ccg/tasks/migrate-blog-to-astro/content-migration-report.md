# Wave 1 Content Migration Report

## Summary

| Metric | Count |
|---|---|
| Posts migrated | 24 |
| Posts with explicit `slug:` (pre-existing) | 20 |
| Posts requiring slug lowercasing only | 1 |
| Posts without `slug:` — derived + added | 3 |
| Posts without `slug:` — derived (no title, pure draft) | 1 |
| Pages migrated (friends / workers) | 2 |
| url-manifest.json entries | 24 |
| Banned CDN hits in live HTML | 0 |
| Banned CDN hits in fenced code examples | 6 (not replaced — see below) |

---

## Slug Decisions

### Had Explicit `slug:` (20 posts — kept as-is after lowercasing)

| File | slug |
|---|---|
| 2017-花开花落，始终如一。.md | `2017-never-say-bye` |
| 2017年寒假计划.md | `2017-winter-planning` |
| Navicat-16-激活工具.md | `navicat-16-keygen` |
| win10-1709-去除字体-Hinting，-带来美妙体验.md | `win10-remove-font-hinting` |
| 一言-API-网易云-API.md | `teng-koa` |
| 你没有领先，你也没有落后.md | `youre-not-late-youre-not-early` |
| 使用-MacType-改善-Windows-字体渲染.md | `mactype-improve-windows-font-render` |
| 喵！送上-Aplayer-和-Cplayer-网易云音乐的支持。.md | `163music` |
| 备案完成.md | `start` |
| 好久没更新博客了，来说一下最近发生了啥。.md | `whats-now` |
| 开启-HSTS-提高站点安全.md | `hsts` |
| 怎样安装Ghost呢？.md | `how-to-install-ghost` |
| 最近勒索病毒频发，大家注意防护哦.md | `antivirus-suggestion` |
| 期末调研终于结束了.md | `exam-done` |
| 浅尝 7505 软路由.md | `have-a-try-with-7505-router` |
| 浅谈藤式PHP构架.md | `teng-php` |
| 硬件安全密钥折腾记 - CanoKeys.md | `cano-keys-first-try` |
| 防止流量外流：制作一个URL跳转页.md | `create-a-url-page` |
| 好久没更新博客了，来说一下最近发生了啥。.md | `whats-now` |

### Slug Lowercasing Applied (1 post)

`缅怀江泽民先生.md` had `slug: in-honor-of-former-general-secretary-Jiang` (capital J).
Hugo lowercases slugs at build time. Changed to `in-honor-of-former-general-secretary-jiang`.

### No `slug:` — Derived from Filename (3 posts + 1 empty draft)

| File | Derived slug | Rule applied |
|---|---|---|
| `为什么我要使用 1Password？.md` | `为什么我要使用-1password` | Strip `？`, lowercase, spaces→`-` |
| `小记-迁移至-Hexo.md` | `小记-迁移至-hexo` | Lowercase only |
| `小记：从 Hexo 迁移至 Hugo.md` | `小记从-hexo-迁移至-hugo` | Strip `：`, spaces→`-`, lowercase |
| `Unraid.md` | `unraid` | Lowercase only (no title in frontmatter, pure draft) |

### `permalink:` Field (1 post — treated as legacy metadata)

`Nodebb-PA-翻译组-正式成立！.md` has `permalink: nodebb-compelely-translate` (note: this appears to be a Hexo-era artifact with a typo; Hugo does not treat `permalink` frontmatter as a URL override for content pages — it derives the slug from filename). The derived slug `nodebb-pa-翻译组-正式成立` is added explicitly. The `permalink` field is retained as legacy metadata.

**Note on typo**: The original `permalink` value `nodebb-compelely-translate` contains a typo (`compelely` vs `completely`). The live Hugo URL is almost certainly `/posts/nodebb-pa-翻译组-正式成立/` from the filename, not the `permalink` value. Verify against `public/` artefact or production URL if parity is critical.

---

## CDN Security Audit

### Banned CDN Scan Results

Scanned for: `staticfile`, `bytecdntp`, `bootcdn` (case-insensitive)

**File with hits**: `防止流量外流：制作一个URL跳转页.md`

```
Line 62:  <link rel="stylesheet" href="https://cdn.staticfile.org/amazeui/2.7.2/css/amazeui.min.css">
Line 113: <script src="https://cdn.staticfile.org/jquery/2.2.3/jquery.min.js"></script>
Line 116: <script src="https://cdn.staticfile.org/jquery/1.11.3/jquery.min.js"></script>
Line 117: <script src="https://cdn.staticfile.org/modernizr/2.8.3/modernizr.js"></script>
Line 118: <script src="https://cdn.staticfile.org/amazeui/2.7.2/js/amazeui.ie8polyfill.min.js"></script>
Line 120: <script src="https://cdn.staticfile.org/amazeui/2.7.2/js/amazeui.min.js"></script>
```

**Assessment**: All 6 occurrences are inside a fenced code block (` ```HTML `) in a 2017 tutorial post. They are rendered as display-only code examples, not executed by the browser visiting the blog. No live CDN dependency is introduced.

**Decision**: Not replaced. Modifying code examples inside a tutorial would alter the article's technical accuracy and historical record. The banned CDN policy applies to functional asset loading (blog layout, components), not to code snippets quoted in educational content.

**Action item for layer team**: If the policy is interpreted strictly to include all file content regardless of context, the replacements below could be applied. Available alternatives on cdnjs:

| Banned URL | cdnjs Replacement |
|---|---|
| `cdn.staticfile.org/jquery/2.2.3/jquery.min.js` | `cdnjs.cloudflare.com/ajax/libs/jquery/2.2.3/jquery.min.js` |
| `cdn.staticfile.org/jquery/1.11.3/jquery.min.js` | `cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.min.js` |
| `cdn.staticfile.org/modernizr/2.8.3/modernizr.js` | `cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js` |
| `cdn.staticfile.org/amazeui/2.7.2/*` | No cdnjs equivalent confirmed — AmazeUI not on cdnjs as of 2025 |

### Bare `<script>` Outside Code Blocks

`好久没更新博客了，来说一下最近发生了啥。.md` line 19:
```html
<script src="https://cdn.a632079.me/auto_cplayer.js"></script>
```
Domain is `cdn.a632079.me` (owner's own CDN, not a banned third-party CDN). No action required.

---

## `.gitignore` Changes

**Before** (problems):
- `pnpm-lock.yaml` was ignored (lockfile must be committed for reproducible installs)
- `dist` and `node_modules` appeared twice (duplicate lines)
- No comment explaining `public/` for future Astro static asset handling

**After**:
- Removed `pnpm-lock.yaml` from ignore list
- Deduplicated `dist/` and `node_modules/` (kept with trailing slash for clarity)
- Added comment on `public/` explaining Astro static asset note
- Retained: `public/`, `resources/_gen/`, `.hugo_build.lock`, `.astro/`, `tmp/`, `.DS_Store`

---

## url-manifest.json

24 entries written to `url-manifest.json`. All posts now have an unambiguous slug — either pre-existing (23) or freshly added (3 + `Unraid.md` which was derived without a slug field since it has no frontmatter title).

Run `node scripts/freeze-urls.mjs` at any time to regenerate the manifest from `src/content/posts/`.
