# CLAUDE.md — 藤之青 博客 · Astro 迁移工作区

> 本目录是 Hugo→Astro 迁移的 git worktree（分支 `worktree-astro-migration`）。在此 workspace 继续迁移的收尾与生产切换。

## 状态（2026-06-20）
Hugo（diary 主题）→ Astro 静态站迁移 **已实施、评审、修复并构建验证通过**，尚未切换生产。
- 构建：`astro check` 0/0/0；`astro build` 74 页。
- **URL 等价**：与生产 sitemap **精确匹配**（15 篇已发布文章 / 46 tags / 5 categories；9 篇草稿正确排除）。见 `url-manifest.json`，`node scripts/freeze-urls.mjs` 可重生成。
- 评审：codex 首轮 50/100 揪出 5 个 Critical，已全部修复复验（嵌套 `<head>`、shortcode 泄漏、taxonomy 大小写 parity、裸日期时区、OutdatedNotice 兜底）。

## 技术栈与命令
Astro 5.18（Content Layer）+ Tailwind v4（`@tailwindcss/vite`）+ pnpm。
- `pnpm dev` → http://localhost:4321 · `pnpm build` → `dist/` · `pnpm preview` · `pnpm astro check`

## 架构（`src/`）
- `content.config.ts`：posts/pages 集合，Zod schema，`z.preprocess(toDate)`（裸日期按 Asia/Shanghai）。
- `pages/`：`index`(首页列表) · `posts/[...id]`(**用 `data.slug` 非 `id`**) · `posts/page/[page]` · `tags|categories`(用 `lib/taxonomy.ts` 的 `urlizeTerm`) · `friends` · `workers` · `404` · `index.xml`(RSS 全文)。
- `layouts/`：BaseLayout(唯一 `<head>` + 暗色 no-FOUC 内联脚本) / PostLayout / ListLayout。
- `components/`：19 个；含 **OutdatedNotice**(编译期 + 运行时双算，弃 dayjs 用 `Intl.RelativeTimeFormat`)、**ExternalAsset**(SRI + `__cdnfb` 兜底)、Notice/Figure/BilibiliEmbed/FriendsGrid 等。
- `lib/`：`cdn`(外链注册表 + SRI + `__cdnfb` + 禁用 CDN 校验) · `dates` · `outdated` · `taxonomy`。
- `plugins/`：`remark-hugo-shortcodes`(unwrap `row` / 去 `friends` / `bilibili`→iframe；导出 `stripShortcodes`) · `remark-reading-time-cjk` · `remark-modified-time`(`execFileSync` git lastmod)。
- `scripts/`：theme / nav / outdated-runtime / comments(懒加载 Waline) / viewer(懒加载 ViewerJS)，全 vanilla 零依赖。
- **零客户端框架**：旧 Vue/Bootstrap/dayjs/js-cookie 全弃；页面纯静态 HTML + 内联微脚本 + 按需懒加载。

## 关键策略（务必保持）
- **CDN 策略**：主 zstatic → 备 cdnjs，全 SRI，`__cdnfb` onerror 兜底；**禁用** staticfile/bytecdntp/BootCDN（已投毒）。`lib/cdn.ts` 实现。
- **URL 等价**：文章路由用 frontmatter `slug`（已全小写、与生产一致）；taxonomy 用 `urlizeTerm`（ASCII 小写、CJK 保留）。切换前跑完整 sitemap diff。

## 待办 / 生产切换步骤
1. **视觉保真核对（人工）**：`pnpm dev` 对照 https://i.a632079.me 逐页核对（首页/文章/friends/taxonomy × 桌面+移动、暗色无闪）。
2. **Shiki 高亮大小写**：部分文章代码块用 `HTML`/`PHP`/`JavaScript`/`conf` 非小写语言名 → 回退纯文本无高亮。修法：`astro.config.mjs` 加 `markdown.shikiConfig.langAlias`（`HTML→html, PHP→php, JavaScript→js, conf→ini`），不动内容。
3. **SCSS 弃用警告（Info）**：`styles/journal.scss` 的 `darken()/lighten()/@import` → 迁 `@use "sass:color"`。
3b. **Astro 弃用提示（Info，非阻塞）**：`astro check` 提示 `z` from `astro:content` 已弃用（改直接 `import { z } from 'zod'`）、`markdown.remarkPlugins` 配置已弃用（改用 `@astrojs/markdown-remark` 的 `unified({...})`）。仅前向兼容，不影响当前构建。
4. **/workers/**：生产 sitemap 不含，按需保留或移除。
5. **生产切换**：合并 `worktree-astro-migration` → `master` 触发 CI（`.github/workflows/deploy.yml` 已改 Node+Astro、部署 `dist/`）；parity 接受后删 diary submodule（`.gitmodules` + `themes/`）+ 旧 Hugo 文件（`config.toml`、`content/`、`static/`、`archetypes/`、`config/`）。

## 详细记录
`.ccg/tasks/migrate-blog-to-astro/`：`requirements.md` · `analysis.md` · `plan.md` · `review.md` · `content-migration-report.md` · `task.json`。
（迁移决策与 CDN 策略亦记录于用户级 memory：`blog-astro-migration`、`cdn-policy`。）
