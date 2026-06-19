# 实施计划：Hugo(diary) → Astro

> 分层 DAG，便于并行实施。Layer N 依赖 Layer N-1。每个子任务标注**文件范围（互不重叠）**与**验证**。

## 技术基线（已定）
- Astro static（`output:'static'`, `site:'https://i.a632079.me'`, `trailingSlash:'always'` 对齐 Hugo）。
- Tailwind v4 via `@tailwindcss/vite`（`npx astro add tailwind`）。
- 集成：`@astrojs/sitemap`、`@astrojs/rss`、`@astrojs/mdx`(按需)。
- Content Layer：`glob()` loader + Zod schema。
- 包管理：pnpm（lockfile 进 CI）。

## 目标文件树
```
astro.config.mjs · package.json · tsconfig.json
src/
  content.config.ts
  styles/        journal.scss(移植) · dark-mode.scss(移植) · global.css(@import tailwind + @theme)
  lib/           cdn.ts · dates.ts · outdated.ts
  plugins/       remark-reading-time-cjk.mjs · remark-modified-time.mjs · remark-hugo-shortcodes.mjs
  scripts/       theme.ts · nav.ts · outdated-runtime.ts · comments.ts · viewer.ts
  components/    HeadMeta · ExternalAsset · SidebarNav · MobileHeader · MobileDrawer · ExtraBar ·
                 Footer · PostCard · PostMeta · PostPager · TableOfContents · OutdatedNotice ·
                 Notice · FriendsGrid · BilibiliEmbed · Figure · CCLicense · Comments · DarkModeToggle
  layouts/       BaseLayout.astro · PostLayout.astro · ListLayout.astro
  pages/         index.astro · posts/[...id].astro · posts/page/[page].astro ·
                 tags/[tag].astro · tags/index.astro · categories/[category].astro · categories/index.astro ·
                 friends.astro · workers.astro · 404.astro · index.xml.ts
  content/       posts/*.md(迁移) · pages/*.md
.github/workflows/deploy.yml(改 Node+astro→dist)
scripts/freeze-urls.mjs(迁移前冻结基线)
```

---

## Layer 0 — 脚手架基座（单任务，最先）
**文件**：`package.json`, `astro.config.mjs`, `tsconfig.json`, `src/content.config.ts`, `src/styles/{global.css,journal.scss,dark-mode.scss}`
- 初始化 Astro + TW v4 + 集成；移植 diary 两份 SCSS；`@theme` 映射核心色/字体 token；Zod schema（见下）。
- **schema**：`title,date,lastmod,updated,slug,permalink,description,featured_image,tags,categories[],draft,hidden,enableLaTeX,comment,disableToC,disableMetaInfo,disablePagination,disableImageViewer,disableCC`；`z.coerce.date()`；裸日期预处理补 `+08:00`。
- **验证**：`pnpm astro check` 通过；`pnpm dev` 起站空页。

## Layer 1 — 底层（4 个子任务并行）
- **L1a 数据/插件**：`src/lib/{cdn,dates,outdated}.ts` + `src/plugins/remark-*.mjs`
  - `cdn.ts`：外链清单（zstatic 主→cdnjs 备 + SRI + crossorigin + `__cdnfb`），拒绝 staticfile/bytecdntp/BootCDN。
  - `dates.ts`：日期归一（Asia/Shanghai）。`outdated.ts`：`staleAfter=lastmod+6月` 共享计算。
  - remark：CJK 阅读时长、git lastmod、Hugo shortcode 预处理（`row` 拆包裹 / `notice`,`bilibili`,`friends` 转指令）。
  - 验证：单测/`astro check`。
- **L1b 脚本**：`src/scripts/{theme,nav,outdated-runtime,comments,viewer}.ts`（vanilla，替代 Vue 行为；comments/viewer 懒加载）。验证：构建无报错、体积 < 数 KB。
- **L1c 叶子组件**：`ExternalAsset, Notice, BilibiliEmbed, Figure, CCLicense, PostMeta, OutdatedNotice, DarkModeToggle, FriendsGrid`（不依赖布局）。`OutdatedNotice.astro` 编译期渲染 + data 属性（配 L1b 运行时脚本）。验证：Storybook 式单页渲染。
- **L1d 内容迁移**：`scripts/freeze-urls.mjs`（冻结现网 URL/RSS 基线）+ `content/posts/*.md`（迁移 + 给无 slug 文章补显式**小写** slug + 审计 staticfile.org 原始 HTML）。验证：URL 清单与基线 diff=0。

## Layer 2 — 组合层（2 子任务并行）
- **L2a 复合组件**：`HeadMeta(OG/Twitter), SidebarNav, MobileHeader, MobileDrawer, ExtraBar, Footer, PostCard, PostPager, TableOfContents, Comments`（组合 L1c 叶子 + L1b 脚本）。
- **L2b 布局**：`BaseLayout, PostLayout, ListLayout`（暗色无-FOUC 内联脚本入 BaseLayout `<head>`）。
- 验证：布局组合渲染、暗色无闪。

## Layer 3 — 页面与路由（依赖 L2）
- **L3a 文章/列表**：`pages/{index,posts/[...id],posts/page/[page]}.astro`（`getStaticPaths` + `entry.id` 小写）。
- **L3b 分类法/特殊页**：`pages/{tags,categories,friends,workers,404}.astro`。
- **L3c feed/CI**：`pages/index.xml.ts`（复刻 `/index.xml` 全文+GUID+过滤）+ `@astrojs/sitemap` + `.github/workflows/deploy.yml`（setup-node→`pnpm i`→`astro build`→rsync `dist/`，`fetch-depth:0`）。
- 验证：`astro build` 出全部路由；sitemap/RSS diff=0。

## Layer 4 — Parity 验收
URL diff / RSS diff（link/GUID/pubDate/计数）/ 视觉 diff（home·post·friends·taxonomy × 桌面·移动）/ JS 预算（核心页无 Vue/Bootstrap/dayjs/js-cookie）/ OutdatedNotice 三态 / 草稿隐藏排除。

---

## 风险与缓解
| 风险 | 级别 | 缓解 |
|---|---|---|
| 无 slug 文章 URL 漂移（中文+大小写） | High | L1d 冻结基线 + 补显式小写 slug + L4 diff |
| 裸日期时区错位 | Med | dates.ts 按 Asia/Shanghai |
| 原始 HTML 内嵌 staticfile.org（禁用 CDN） | High(策略) | L1d 审计替换为 zstatic+SRI |
| RSS GUID/全文不一致致重复推送 | Med | index.xml.ts 对齐 GUID/link |
| Tailwind 全量重写视觉漂移 | Med | 混合策略，逐块比对 |

## 测试策略
- 构建期：`astro check`（类型）、remark 插件单测。
- 产物：freeze 基线 vs dist 的 URL/RSS/sitemap 自动 diff 脚本。
- 视觉：关键页人工/截图比对。
- 运行时：OutdatedNotice 三态、暗色无闪、抽屉/滚动行为。

## 迁移切换顺序
冻结基线 → Layer0→1→2→3 → Layer4 parity 全过 → 暂存并行比对 → 切 CI `public/`→`dist/` → **parity 接受后**删 diary submodule。
