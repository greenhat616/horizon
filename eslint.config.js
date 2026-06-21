import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";

export default tseslint.config(
  {
    // Not source — generated, vendored, or content.
    ignores: [
      "dist/**",
      ".astro/**",
      "node_modules/**",
      "src/content/**",
      "url-manifest.json",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,

  // Shared globals: this is a static site (browser scripts) built with
  // Node-side config/plugins. Allow both so `no-undef` doesn't false-positive.
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // `<script lang="ts">` and frontmatter inside .astro need the TS parser.
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".astro"],
      },
    },
  },
);
