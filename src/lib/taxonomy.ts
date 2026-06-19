/**
 * taxonomy.ts — URL normalisation helpers for tags and categories.
 *
 * Replicates Hugo's default taxonomy URL generation:
 *   - ASCII letters → lowercase
 *   - Spaces and underscores → hyphens
 *   - ASCII punctuation (except hyphen) → stripped
 *   - CJK characters (and other non-ASCII Unicode) → preserved as-is
 *   - Multiple consecutive hyphens → collapsed to one
 *   - Leading/trailing hyphens → trimmed
 *
 * Examples:
 *   "CanoKeys"  → "canokeys"
 *   "YubiKey"   → "yubikey"
 *   "安全密钥"   → "安全密钥"
 *   "foo bar"   → "foo-bar"
 *   "C++"       → "c"
 *   "Node.js"   → "nodejs"
 */

/**
 * Convert a taxonomy term to its URL slug, mirroring Hugo behaviour.
 *
 * ASCII letters are lowercased; spaces and underscores become hyphens;
 * ASCII punctuation is stripped; CJK and other non-ASCII codepoints are kept.
 */
export function urlizeTerm(term: string): string {
  let result = '';

  for (const ch of term) {
    const code = ch.codePointAt(0) ?? 0;

    if (code > 127) {
      // Non-ASCII (CJK, accented Latin, emoji, etc.) — keep as-is
      result += ch;
    } else if (ch >= 'A' && ch <= 'Z') {
      // ASCII uppercase → lowercase
      result += ch.toLowerCase();
    } else if (ch >= 'a' && ch <= 'z') {
      // ASCII lowercase — keep
      result += ch;
    } else if (ch >= '0' && ch <= '9') {
      // ASCII digit — keep
      result += ch;
    } else if (ch === ' ' || ch === '_') {
      // Space/underscore → hyphen
      result += '-';
    } else if (ch === '-') {
      // Hyphen — keep (collapse handled below)
      result += '-';
    }
    // All other ASCII (punctuation, symbols) → strip
  }

  // Collapse consecutive hyphens and trim leading/trailing hyphens
  return result.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
}
