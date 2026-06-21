# 藤之青 · 博客

> 个人博客，由 **Hugo（diary 主题）迁移至 [Astro](https://astro.build)** 的静态站点。
> 设计目标：**纯静态、默认零客户端 JS、保留原站观感、对外 URL 契约不变**。

线上：<https://i.a632079.me>

---

## 技术栈

| 领域 | 选型 |
| --- | --- |
| 框架 | Astro 6（Content Layer，`output: static`） |
| 样式 | Tailwind v4（`@tailwindcss/vite`）+ 迁移自原主题的 SCSS（`sass`） |
| 代码高亮 | Shiki 双主题（`github-light` / `monokai`），自定义 transformer 包装 code-card |
| 内容 | Markdown / MDX（`@astrojs/mdx`），Zod schema 校验 frontmatter |
| 派生 | RSS（`@astrojs/rss` 全文）、Sitemap（`@astrojs/sitemap`） |
| 包管理 | pnpm |
| 运行时 | Node ≥ 20（开发环境 Node 26） |

**零客户端框架**：旧 Vue / Bootstrap / dayjs / js-cookie 全部移除；页面为纯静态 HTML + 内联微脚本 + 按需懒加载（评论 Waline、图片预览 ViewerJS）。

---

## 快速开始

```bash
pnpm install           # 安装依赖（自动经 husky 装 git 钩子）
cp .env.example .env   # 配置 PUBLIC_* 环境变量

pnpm dev               # 开发服务器 → http://localhost:4321
pnpm build             # 生产构建 → dist/
pnpm preview           # 本地预览 dist/
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器（HMR） |
| `pnpm build` | 生产构建，输出到 `dist/` |
| `pnpm preview` | 预览构建产物 |
| `pnpm check` / `pnpm typecheck` | `astro check`（类型 + 模板诊断） |
| `pnpm lint` / `pnpm lint:fix` | ESLint（flat config，覆盖 `.astro` frontmatter / `<script>` / 模板） |
| `pnpm fmt` / `pnpm fmt:check` | Prettier（含 `prettier-plugin-astro`） |

### 质量门禁

- **Git 钩子**（husky v9）：`pre-commit` → lint-staged（`eslint --fix` + `prettier --write`）；`commit-msg` → commitlint（须 [Conventional Commits](https://www.conventionalcommits.org)）。
- **CI**：`.github/workflows/lint.yml`（push master + 所有 PR）执行 `fmt:check` → `lint` → `typecheck`。

---

## 项目结构

```
src/
├── content.config.ts   # posts / pages 集合 + Zod schema（裸日期按 Asia/Shanghai）
├── pages/              # 路由
│   ├── index.astro            # 首页列表
│   ├── posts/[...id].astro     # 文章详情（用 data.slug 而非 id）
│   ├── posts/page/[page].astro # 分页
│   ├── tags/ · categories/     # taxonomy（用 lib/taxonomy 的 urlizeTerm）
│   ├── friends.astro · workers.astro · 404.astro
│   └── index.xml.ts            # RSS 全文
├── layouts/            # BaseLayout（唯一 <head> + 暗色 no-FOUC 内联脚本）/ Post / List
├── components/         # 20 个 .astro 组件（OutdatedNotice / ExternalAsset / Notice …）
├── lib/                # cdn · dates · outdated · taxonomy
├── plugins/            # remark / rehype 插件（见下）
├── scripts/            # vanilla 微脚本（theme / nav / comments / viewer / code-card）
└── styles/             # global.css（Tailwind）+ 迁移的 SCSS
```

### 自定义构建插件（`src/plugins/`）

- **`remark-hugo-shortcodes`** — 解包 Hugo `row` / 去 `friends` / `bilibili` → iframe；导出 `stripShortcodes`。
- **`rehype-reading-time`** — 复刻 Hugo diary 的字数与阅读时长算法（CJK 按 rune、ASCII 按词，`/220*60`），写入 `readingSeconds` / `wordCount`。
- **`remark-modified-time`** — 经 git `lastmod` 读取文章修改时间。
- **`shiki-code-card`** — Shiki transformer：`<pre>` → `figure.code-card`（语言标签 + 复制按钮 + 行号）。

---

## 关键策略

- **URL 等价**：文章路由用 frontmatter `slug`（全小写、与生产一致）；taxonomy 用 `urlizeTerm`（ASCII 小写、CJK 保留）。基线快照见 `url-manifest.json`（`node scripts/freeze-urls.mjs` 可重生成）。**生产切换前须跑完整 sitemap diff。**
- **CDN 策略**：主 zstatic → 备 cdnjs，全程 SRI 校验，`__cdnfb` onerror 兜底；**禁用** staticfile / bytecdntp / BootCDN（已投毒）。实现见 `src/lib/cdn.ts`。
- **暗色模式**：基于 `html.night` 类（非 `prefers-color-scheme`），`<head>` 内联脚本避免闪烁（no-FOUC）；`global.css` 已配 `@custom-variant dark`，组件内可直接用 `dark:` 工具类。
- **环境变量**：经 `astro:env` 外部化 `PUBLIC_*`；配置见 `.env.example`。

---

## 内容

文章与单页位于 `src/content/`（`posts/` · `pages/`），通过 Astro Content Layer + Zod schema 管理。草稿（`draft: true`）在生产构建中自动排除。

---

## 部署

合并至 `master` 触发 `.github/workflows/deploy.yml`（Node + Astro 构建，部署 `dist/`）。

---

迁移与设计决策的详细记录见 [`CLAUDE.md`](./CLAUDE.md) 及 `.ccg/tasks/migrate-blog-to-astro/`。
