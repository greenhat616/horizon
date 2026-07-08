/**
 * rehype-footnote-refs
 *
 * GFM footnotes render each in-text reference as
 *   <sup><a href="#user-content-fn-N" id="user-content-fnref-N" data-footnote-ref>N</a></sup>
 * with no class, so the number shows as a faint superscript that's easy to miss
 * (worse in dark mode, where `html.night a` paints it the same teal as the dark
 * surface). Tag every reference anchor with `.footnote-ref` so global.css can
 * render it as a compact accent pill (background + dark-mode contrast + a gap
 * between adjacent refs, which GFM emits back-to-back with no separation).
 *
 * Runs at the HAST stage, after remark-rehype has expanded the footnotes. The
 * backref anchors (the ↩ links in the notes list) carry `data-footnote-backref`
 * and already own a class, so they are intentionally left untouched.
 */

import type { RehypePlugin } from "@astrojs/markdown-remark";
import type { Root } from "hast";
import { visit } from "unist-util-visit";

const rehypeFootnoteRefs: RehypePlugin = () => {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (
        node.tagName !== "a" ||
        !node.properties ||
        !("dataFootnoteRef" in node.properties)
      )
        return;

      // className in hast is string | number | (string | number)[]; normalise
      // to an array before appending so any pre-existing class is preserved.
      const prev = node.properties.className;
      const classes: (string | number)[] = Array.isArray(prev)
        ? [...prev]
        : typeof prev === "string" || typeof prev === "number"
          ? [prev]
          : [];
      classes.push("footnote-ref");
      node.properties.className = classes;
    });
  };
};

export default rehypeFootnoteRefs;
