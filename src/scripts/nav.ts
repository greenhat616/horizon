/**
 * nav.ts — Scroll-driven nav transparency, mobile drawer, back-to-top.
 * Pure DOM, zero runtime deps. Replicates journal-module.js behaviour.
 *
 * Exports:
 *   initNav()  — call once on DOMContentLoaded
 *
 * Expected DOM:
 *   [data-nav]        — the top navigation bar element
 *   [data-page-head]  — the page hero / header element whose height drives the fade
 *   [data-drawer]     — mobile side-drawer element
 *   [data-drawer-toggle]  — button(s) that open/close the drawer
 *   [data-back-to-top]    — back-to-top button (shown when scrollY > 300)
 */

// ─── sgn: smooth step used in original journal-module.js ────────────────────
// sgn(t, x) → 0 when x≤t, 1 when x≥1-t, linear ramp in between.
function sgn(t: number, x: number): number {
  if (x <= t) return 0;
  if (x >= 1 - t) return 1;
  const k = 1 / (1 - 2 * t);
  return k * (x - t);
}

// ─── debounce (minimal, matches original semantics) ─────────────────────────
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number,
): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  } as T;
}

// ─── scroll top compat ───────────────────────────────────────────────────────
function getScrollTop(): number {
  return (
    window.pageYOffset ??
    window.scrollY ??
    document.documentElement.scrollTop ??
    document.body.scrollTop ??
    0
  );
}

// ─── nav transparency ────────────────────────────────────────────────────────
function initNavScroll(nav: HTMLElement, pageHead: HTMLElement): () => void {
  function update(): void {
    const scrollY = getScrollTop();
    const navH = nav.offsetHeight;
    const headH = pageHead.offsetHeight;
    const ratio = headH - navH * 0.8 > 0 ? scrollY / (headH - navH * 0.8) : 1;
    const clamped = Math.min(1, Math.max(0, ratio));
    const opacity = sgn(0.0, clamped) >= 1 ? 1 : 0;
    // opacity 0 → nav is transparent (original behaviour: class toggle)
    nav.setAttribute("data-nav-opaque", String(opacity === 1));
    nav.style.setProperty("--nav-opacity", String(opacity));
  }

  const onScroll = debounce(update, 50);
  const onResize = debounce(update, 100);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  update(); // initial paint

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
  };
}

// ─── mobile drawer ───────────────────────────────────────────────────────────
// Mirrors the original Vue theme: the drawer slides in via the
// `single-column-drawer-container-active` class, and the backdrop is made
// visible by adding `single-column-drawer-mask` (the class itself supplies
// the fixed full-screen dark overlay in journal.scss). Both classes are
// present only while the drawer is open.
const DRAWER_OPEN_CLASS = "single-column-drawer-container-active";
const MASK_VISIBLE_CLASS = "single-column-drawer-mask";

function initDrawer(
  drawer: HTMLElement,
  toggleBtns: NodeListOf<HTMLElement>,
  mask: HTMLElement | null,
): void {
  function setOpen(opened: boolean): void {
    drawer.classList.toggle(DRAWER_OPEN_CLASS, opened);
    drawer.setAttribute("aria-hidden", String(!opened));
    mask?.classList.toggle(MASK_VISIBLE_CLASS, opened);
    mask?.setAttribute("aria-hidden", String(!opened));
    toggleBtns.forEach((btn) =>
      btn.setAttribute("aria-expanded", String(opened)),
    );
  }

  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      setOpen(!drawer.classList.contains(DRAWER_OPEN_CLASS));
    });
  });

  // close on backdrop click
  mask?.addEventListener("click", () => setOpen(false));

  // close after navigating via a drawer link
  drawer.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  // close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains(DRAWER_OPEN_CLASS)) {
      setOpen(false);
    }
  });
}

// ─── back-to-top ─────────────────────────────────────────────────────────────
function initBackToTop(btn: HTMLElement): void {
  function syncVisibility(): void {
    const visible = getScrollTop() > 300;
    btn.classList.toggle("is-visible", visible);
    btn.setAttribute("aria-hidden", String(!visible));
  }

  window.addEventListener("scroll", debounce(syncVisibility, 50), {
    passive: true,
  });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  syncVisibility();
}

// ─── table striping (mirrors journal-module.js onMounted side-effect) ────────
function initTables(): void {
  document.querySelectorAll<HTMLTableElement>("table").forEach((el) => {
    el.classList.add(
      "table",
      "table-striped",
      "table-responsive",
      "table-hover",
    );
  });
}

// ─── public API ──────────────────────────────────────────────────────────────

/** Wire up all navigation behaviours. Call once after DOMContentLoaded. */
export function initNav(): void {
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  const pageHead = document.querySelector<HTMLElement>("[data-page-head]");
  const drawer = document.querySelector<HTMLElement>("[data-drawer]");
  const drawerMask = document.querySelector<HTMLElement>("[data-drawer-mask]");
  const toggleBtns = document.querySelectorAll<HTMLElement>(
    "[data-drawer-toggle]",
  );
  const backToTop = document.querySelector<HTMLElement>("[data-back-to-top]");

  if (nav && pageHead) initNavScroll(nav, pageHead);
  if (drawer && toggleBtns.length) initDrawer(drawer, toggleBtns, drawerMask);
  if (backToTop) initBackToTop(backToTop);
  initTables();
}
