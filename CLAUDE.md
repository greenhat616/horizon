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
- **质量门禁**（Astro 官方栈）：`pnpm lint`(ESLint flat config `eslint.config.js`：`@eslint/js`+typescript-eslint+`eslint-plugin-astro` recommended，`.astro` frontmatter/`<script>` 用 TS parser，模板亦覆盖) · `pnpm fmt`/`fmt:check`(Prettier + `prettier-plugin-astro`，`.prettierignore` 排除 `src/content` 与全部 md/mdx；scss/css/astro/ts/js/json 均格式化) · `pnpm typecheck`(=`astro check`)。
- **Git 钩子**(husky v9)：pre-commit → lint-staged（`.lintstagedrc.json`：`*.{js,mjs,cjs,ts,astro}` 跑 `eslint --fix`+`prettier --write`，`*.{json,css,scss}` 跑 `prettier --write`）；commit-msg → commitlint（`@commitlint/config-conventional`，须 Conventional Commits）。`prepare:husky` 在 `pnpm install` 时自动装钩子。
- **CI**：`.github/workflows/lint.yml`（push master + 所有 PR）跑 fmt:check → lint → typecheck。
- 备注：Tailwind class 排序插件 `prettier-plugin-tailwindcss` **未启用**（会重排所有模板 class，diff 巨大）；如需启用，加入 `.prettierrc.mjs` 的 `plugins`（须置于 `prettier-plugin-astro` **之后**）并设 `tailwindStylesheet: './src/styles/global.css'`。

## 架构（`src/`）
- `content.config.ts`：posts/pages 集合，Zod schema，`z.preprocess(toDate)`（裸日期按 Asia/Shanghai）。
- `pages/`：`index`(首页列表) · `posts/[...id]`(**用 `data.slug` 非 `id`**) · `posts/page/[page]` · `tags|categories`(用 `lib/taxonomy.ts` 的 `urlizeTerm`) · `friends` · `workers` · `404` · `index.xml`(RSS 全文)。
- `layouts/`：BaseLayout(唯一 `<head>` + 暗色 no-FOUC 内联脚本) / PostLayout / ListLayout。
- `components/`：19 个；含 **OutdatedNotice**(编译期 + 运行时双算，弃 dayjs 用 `Intl.RelativeTimeFormat`)、**ExternalAsset**(SRI + `__cdnfb` 兜底)、Notice/Figure/BilibiliEmbed/FriendsGrid 等。
- `lib/`：`cdn`(外链注册表 + SRI + `__cdnfb` + 禁用 CDN 校验) · `dates` · `outdated` · `taxonomy`。
- `plugins/`：`remark-hugo-shortcodes`(unwrap `row` / 去 `friends` / `bilibili`→iframe；导出 `stripShortcodes`) · **`rehype-reading-time`**(复刻 Hugo diary `countwords .Content / 220 * 60`：HAST 阶段数渲染后纯文本[≈`StripHTML`，故含 raw-HTML 内文、排除标签/URL]，CJK 按 rune、ASCII token 按词；写 `readingSeconds`/`wordCount` frontmatter；`lib/reading-time.ts#formatReadingTime` 出 `min s`，单数 `minute`/`second` 与 Hugo 模板一致) · `remark-modified-time`(`execFileSync` git lastmod) · **`shiki-code-card`**(Shiki transformer：`<pre>`→`figure.code-card` 头部栏[语言 label+复制按钮]、默认加 `line-numbers` 类、读 `meta.__raw` 支持 `title="…"`/`no-line-numbers`)。
- `scripts/`：theme / nav / outdated-runtime / comments(懒加载 Waline) / viewer(懒加载 ViewerJS) / **code-card**(委托式复制按钮，BaseLayout 引导)，全 vanilla 零依赖。
- **零客户端框架**：旧 Vue/Bootstrap/dayjs/js-cookie 全弃；页面纯静态 HTML + 内联微脚本 + 按需懒加载。

## 关键策略（务必保持）
- **CDN 策略**：主 zstatic → 备 cdnjs，全 SRI，`__cdnfb` onerror 兜底；**禁用** staticfile/bytecdntp/BootCDN（已投毒）。`lib/cdn.ts` 实现。
- **URL 等价**：文章路由用 frontmatter `slug`（已全小写、与生产一致）；taxonomy 用 `urlizeTerm`（ASCII 小写、CJK 保留）。切换前跑完整 sitemap diff。
- **暗色与 Tailwind**：站点暗色用 `html.night`（非 `prefers-color-scheme`）。`global.css` 已加 `@custom-variant dark (&:where(.night, .night *))`，故组件内可直接用 `dark:` 工具类（如 `FriendsGrid.astro`）。`.night` 全局规则仍在 `dark-mode.scss`。**注意**：`.post-body img{border-radius:5px}`（特异性 0,1,1）会压过单类 Tailwind 工具，post-body 内的图片若要改圆角须用 `rounded-full!` 等 important 变体（友链头像即如此）。
- **友链卡片（friends）**：`/friends/` 用 `single.html` 结构（text-only 标题头 +`.post-body-wrapper/.post-body` 白卡阴影）；卡片网格 `FriendsGrid.astro` 已弃 Bootstrap（`.card/.row/.col-lg-6`），改 Tailwind grid（`lg:grid-cols-2`）。旧 `.friendship` SCSS 已删（journal/dark-mode）。
- **代码块增强（Shiki）**：行号（CSS counter，默认全开，`no-line-numbers` 关）+ 语言 label + 复制按钮（`shiki-code-card` transformer + `code-card.ts`）；代码组用 `rehype-code-group`（`::: code-group labels=[a,b]` … `:::`，其向 `<head>` 注入切换 script/style，我方用 `.post-body` 高特异性覆盖类名）。**注意**：transformer 把 `<pre>` 包进 `figure` 后 Astro 的 `astro-code` 类被丢弃，故 CSS 选择器只依赖自有 `.code-card`/`.line-numbers`，**勿**改回 `.astro-code`。**双主题**：`shikiConfig.themes={light:'github-light',dark:'monokai'}` + `defaultColor:'light'`——浅色主题色内联为默认、暗色作 `--shiki-dark`/`--shiki-dark-bg` 变量；`dark-mode.scss` 在 `html.night` 下用 `var(--shiki-dark*)!important` 翻转 `.code-card>pre` 与 `pre span`（`!important` 压过内联浅色）。行号 gutter 随面切换：明态深色（`journal.scss`，深字浅底）、暗态浅色（`dark-mode.scss` 带 `!important` 压过 `html.night pre{color:…!important}`）。授权语法见样式注释。

## 待办 / 生产切换步骤
1. **视觉保真核对（人工）**：`pnpm dev` 对照 https://i.a632079.me 逐页核对（首页/文章/friends/taxonomy × 桌面+移动、暗色无闪）。
2. ~~**Shiki 高亮大小写**~~：✅ 已修。`astro.config.mjs` 已加 `markdown.shikiConfig.langAlias`（`HTML→html, PHP→php, JavaScript→js, conf→ini`）；如再遇其他非小写语言名按需补映射。
3. **SCSS 弃用警告（Info）**：`styles/journal.scss` 的 `darken()/lighten()/@import` → 迁 `@use "sass:color"`。
3b. **Astro 弃用提示（Info，非阻塞）**：`astro check` 提示 `z` from `astro:content` 已弃用（改直接 `import { z } from 'zod'`）、`markdown.remarkPlugins`/`rehypePlugins`/`remarkRehype` 配置已弃用（改用 `@astrojs/markdown-remark` 的 `unified({...})`）。仅前向兼容，不影响当前构建。
4. **/workers/**：生产 sitemap 不含，按需保留或移除。
5. **生产切换**：合并 `worktree-astro-migration` → `master` 触发 CI（`.github/workflows/deploy.yml` 已改 Node+Astro、部署 `dist/`）；parity 接受后删 diary submodule（`.gitmodules` + `themes/`）+ 旧 Hugo 文件（`config.toml`、`content/`、`static/`、`archetypes/`、`config/`）。

## 详细记录
`.ccg/tasks/migrate-blog-to-astro/`：`requirements.md` · `analysis.md` · `plan.md` · `review.md` · `content-migration-report.md` · `task.json`。
（迁移决策与 CDN 策略亦记录于用户级 memory：`blog-astro-migration`、`cdn-policy`。）
