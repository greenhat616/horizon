/**
 * remark-modified-time
 *
 * Reads the last commit timestamp for the source file from git history
 * (`git log -1 --pretty=format:%cI <file>`) and writes it to
 * `file.data.astro.frontmatter.lastModified` as an ISO 8601 string.
 *
 * Falls back to `new Date().toISOString()` when:
 *   - the file has never been committed (new/untracked file), or
 *   - git is not available (CI without full history, etc.).
 */

import { execFileSync } from "node:child_process";
import type { RemarkPlugin } from "@astrojs/markdown-remark";

/** remark plugin factory — no options required. */
const remarkModifiedTime: RemarkPlugin = () => {
  return (_tree, file) => {
    // file.history[0] is the absolute path to the source file
    const filepath = file.history[0];

    let lastModified: string;

    if (filepath) {
      try {
        // %cI  →  ISO 8601 committer date with timezone offset
        const result = execFileSync(
          "git",
          ["log", "-1", "--pretty=format:%cI", "--", filepath],
          {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
          },
        ).trim();

        // Empty string means the file is not tracked by git yet
        lastModified = result || new Date().toISOString();
      } catch {
        lastModified = new Date().toISOString();
      }
    } else {
      lastModified = new Date().toISOString();
    }

    if (!file.data.astro) file.data.astro = {};
    if (!file.data.astro.frontmatter) file.data.astro.frontmatter = {};

    file.data.astro.frontmatter.lastModified = lastModified;
  };
};

export default remarkModifiedTime;
