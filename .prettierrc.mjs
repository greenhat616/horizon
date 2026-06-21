/** @type {import("prettier").Config} */
export default {
  // prettier-plugin-tailwindcss MUST be last so it sorts classes on the
  // already-parsed Astro output.
  plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  // Tailwind v4 has no tailwind.config.js — point the sorter at the CSS entry
  // (where `@import "tailwindcss"` and `@theme` live) so it knows the layer order.
  tailwindStylesheet: "./src/styles/global.css",
  overrides: [
    {
      files: "*.astro",
      options: { parser: "astro" },
    },
  ],
};
