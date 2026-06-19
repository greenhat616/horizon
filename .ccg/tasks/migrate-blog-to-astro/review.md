# Phase 5 Review — Round 1 (codex + Claude + 质量门)

codex 评分 50/100 NEEDS_IMPROVEMENT。质量门：verify-security ✓、verify-quality ✓(1 info 行长)、verify-change ✓。
构建绿(astro check 0/0/0)但掩盖了语义/parity bug。已在 dist 核实。

## Critical（5 确认 / 1 驳回）
- C1 **嵌套 `<head>`**：HeadMeta 在 BaseLayout 的 `<head>` 内再发 `<head>` → dist 出现 2× `<head>`。修：HeadMeta 返回片段，BaseLayout 独占唯一 `<head>`。
- C2 **shortcode 泄漏**：`{{<row>}}`/`{{<friends-list>}}` 字面量进入 8 篇文章 + friends 页。remark-hugo-shortcodes 在 transform 阶段改 file.value 无效。修：用 mdast visitor 移除 row/friends 标记段（row 仅 unwrap）、bilibili→iframe；RSS 管线同样处理。
- C3 **taxonomy 大小写 parity**：生成 `/tags/CanoKeys/` 但生产是 `/tags/canokeys/`；且 PostMeta 链接用 toLowerCase → 链接 404。修：共享 `urlizeTerm()`（小写 ASCII、保留 CJK），路由与链接统一。
- C4 **裸日期时区**：schema 用 `z.coerce.date()` 忽略 `toDate()`，裸 `2018-02-15 22:52:46` 按 UTC → 显示/排序/RSS 偏移。修：schema 用 toDate 预处理（Asia/Shanghai）。
- C5 **OutdatedNotice 缺口**：仅 `lastmod ?? updated`，无 git-lastmod/date 兜底，无 `disableOutdatedNotice`。修：有效 lastmod = lastmod ?? updated ?? gitLastModified ?? date；schema 加 disableOutdatedNotice 并透传。
- ~~C6 scripts after `</html>`~~：**驳回**——Astro 自动 hoist，dist 无此问题。

## Warning
- ViewerJS `<script>` 与 Waline CSS 在每页 eager 加载（HeadMeta）→ 移除，改 viewer.ts/comments.ts 懒加载（仅文章页）。
- comments.ts/viewer.ts 硬编码 CDN URL+SRI → 改从 src/lib/cdn.ts 引用。
- FriendsGrid `onclick=window.open(href)` 无校验/无 noopener → 改 `<a target=_blank rel=noopener>` + 构建期校验 http(s)。
- remark-modified-time `execSync` 拼接路径 → `execFileSync('git', [...])`。
- remark lastModified 写了但没人用 → 接入有效 lastmod（见 C5）。
- RSS：CJK slug 未编码 + 用 content:encoded+summary，非 Hugo full-description 形状 → 编码 + 统一渲染路径。
- 字体 CSS 无 SRI（CSS @import 字体难加 SRI）→ 记录为可接受或自托管（暂记录）。
- FriendsGrid email 头像用 simpleHash 非 MD5 → 用 crypto md5（gravatar/cravatar parity）。

## Info
- SCSS `darken()/lighten()/@import` 弃用警告 → 迁 `@use "sass:color"`（暂缓）。
- HeadMeta 重复 site 常量 → import site.config。
- cdn.ts 残留 js-cookie/vue-disqus 等未用条目 → 删。
- staticfile.org 仅在代码块示例 → 可接受，保留。

## Round 2 修复分工（文件互斥）
- fix-A：remark-hugo-shortcodes.mjs, remark-modified-time.mjs, content.config.ts, lib/dates.ts, pages/index.xml.ts（C2,C4 + RSS/execFileSync）
- fix-B：HeadMeta.astro, BaseLayout.astro, lib/cdn.ts, scripts/viewer.ts, scripts/comments.ts（C1 + eager 资产 + CDN 收敛）
- fix-C：lib/taxonomy.ts(新), tags/*, categories/*, PostMeta.astro, posts/[...id].astro, PostLayout.astro, FriendsGrid.astro（C3,C5 + friends 安全/MD5）
