# 多模型迁移分析综合（codex 后端权威 + Claude 前端补位）

> gemini 本会话永久不可用（IneligibleTierError / UNSUPPORTED_CLIENT）。外部事实经 grok search 核实（High 置信度）。

## 已拍板决策
- **基座**：从零 minimal Astro static scaffold（不用 AstroPaper/官方 blog 模板——其观感会与"复刻 diary"硬约束打架）。
- **样式**：混合——先把 `journal.scss`/`dark-mode.scss` 原样搬入保真，再渐进映射到 Tailwind v4 `@theme` token；新组件用 Tailwind 工具类；彻底去 Bootstrap。
- **Tailwind**：`@tailwindcss/vite` 插件（`npx astro add tailwind`），非已废弃的 `@astrojs/tailwind`；TW v4 CSS-first（`@theme`/`@source`）。
- **内容**：Astro 5/6 Content Layer，`glob()` loader + Zod schema（`z.coerce.date()` 容错混杂日期，裸日期按 Asia/Shanghai）；路由 `src/pages/posts/[...id].astro`，用 `entry.id`。

## 关键事实（grok 核实）
- Tailwind 接入 Astro：`@tailwindcss/vite`（旧 `@astrojs/tailwind` 已废弃）。
- URL/slug：frontmatter `slug` 覆盖 `id`；Hugo 会**小写化** slug（`...-Jiang`→`...-jiang`）。
- CJK 阅读时长需自写 remark 插件（标准 reading-time 对中文失真）。

## URL parity 三陷阱（codex 复核 public/ 产物）
1. slug 大小写：Hugo 小写化 → 路由层 `.toLowerCase()`。
2. 无 slug 文章用文件名派生路径（中文保留 + 小写 + 空格转-，如 `/posts/为什么我要使用-1password/`）→ 须补显式 slug。
3. 日期格式混杂（+08:00 / Z / 裸 `YYYY-MM-DD HH:mm:ss`）→ 裸日期按 Asia/Shanghai。

## OutdatedNotice 双计算设计
- 编译期：`staleAfter = lastmod + 6 月` vs 构建日期；已过时→渲染可见静态 HTML（零-JS + SEO）；否则 `hidden` + data 属性。
- 运行时：~0.4KB 零依赖脚本，按访客当前时间重算，越阈值则揭示 + 用 `Intl.RelativeTimeFormat('zh-CN')` 刷新"N 年前"。彻底弃 dayjs。
- 兜底：GitHub Actions `schedule:` 定时重建，覆盖无-JS 访客。

## 其它
- 实际仅 `row`(passthrough，拆包裹) 和 `friends-list` 两个 shortcode 在用；`notice`/`bilibili`/`insertFigure` 作契约保留。
- Shiki(monokai) 高亮零客户端 JS；featured_image 多为远程 CDN 保持 `<img>`，仅 insertFigure 本地图走 astro:assets。
- 原始 HTML(unsafe) 须保留；个别老文内嵌 staticfile.org（被禁 CDN）须借迁移审计替换。
- RSS 现为 `/index.xml` 自定义全文 → 用 `src/pages/index.xml.ts` 复刻（保 link/GUID/pubDate/过滤）。
- 部署 `public/`→`dist/`，rsync 目标不变，parity 通过后再删 submodule。
