# 迁移需求：Hugo(diary) → Astro

## 目标
将博客 `藤之青`（https://i.a632079.me/）从 Hugo + diary 主题（git submodule）迁移到 **Astro 静态站**：零-JS 默认 + 组件化，**保留原观感与所有对外契约**。根因——性能瓶颈是主题全局运行时 JS（完整 Vue + Bootstrap + dayjs + Waline + ViewerJS），与 SSG 无关。

## 硬约束（MUST）
- 纯静态 SSG 输出（无 SSR）；生产仍 rsync `dist/` 到现服务器。
- 视觉/交互须符合原 diary 观感（像素级保真优先）。
- **URL 等价**：`/posts/<slug>/`、`/index.xml`(RSS)、sitemap、tags/categories、`/friends/`、`/workers/`、404。
- 暗色模式无 FOUC。
- 保留 **SRI + zstatic→cdnjs(`__cdnfb`) 兜底**；禁用 staticfile/bytecdntp/BootCDN（见 memory: cdn-policy）。
- **OutdatedNotice 编译期 + 运行时双计算**，弃用 dayjs（用 `Intl.RelativeTimeFormat`）。
- 草稿/隐藏文章在生产排除。

## 偏好（SHOULD）
- SCSS 渐进迁移到 **Tailwind v4**（`@tailwindcss/vite`，混合策略，非全量重写）。
- 组件化、维护友好（单维护者）。

## 范围
- IN：25 篇 posts + friends/workers 页、主题重建、构建链替换、CI/CD、RSS/sitemap、shortcode 转换。
- OUT：内容改写、新增功能、设计大改（须保真）。

## 验收标准
1. URL / RSS(`/index.xml`) / sitemap 对照冻结基线 **0 漂移**。
2. 核心页无 Vue/Bootstrap/dayjs/js-cookie，首方 JS 仅数 KB（Waline/Viewer/KaTeX 按需懒加载）。
3. OutdatedNotice 三态正确：编译期已过时 / 编译期新鲜 / 运行时跨越阈值。
4. 视觉 diff（home/post/friends/taxonomy × 桌面/移动）通过。
5. 暗色无闪、抽屉、滚动导航透明度行为与原站一致。
