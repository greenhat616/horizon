/**
 * code-card — copy-to-clipboard for `.code-card` blocks.
 *
 * One delegated listener on `document` covers every code card on the page
 * (posts and standalone pages), so it survives no matter how many blocks a
 * page has and needs no per-block wiring. Zero dependencies.
 *
 * Markup is emitted at build time by the `shiki-code-card` transformer; this
 * only attaches behaviour. The success state is purely a `.is-copied` class
 * toggle — the icon swap and colour live in CSS.
 *
 * Note: CSS `::before` line numbers are generated content and are excluded
 * from `innerText`, so the copied text never contains gutter numbers.
 */

const COPIED_CLASS = "is-copied";
const RESET_MS = 2000;

/** Copy `text` to the clipboard, with a legacy execCommand fallback. */
async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      /* fall through to legacy path (e.g. insecure context) */
    }
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    /* best effort */
  }
  ta.remove();
}

export function initCodeCard(): void {
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    const btn = target?.closest<HTMLButtonElement>(".code-card__copy");
    if (!btn) return;

    const code = btn
      .closest(".code-card")
      ?.querySelector<HTMLElement>("pre code");
    if (!code) return;

    void copyText(code.innerText.replace(/\n$/, "")).then(() => {
      btn.classList.add(COPIED_CLASS);
      window.setTimeout(() => btn.classList.remove(COPIED_CLASS), RESET_MS);
    });
  });
}
