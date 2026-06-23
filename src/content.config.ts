import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { toDate } from "./lib/dates";

// Preprocessor that handles bare "YYYY-MM-DD HH:mm:ss" strings without a
// timezone by forwarding them through toDate(), which applies Asia/Shanghai.
// Values that are already Date objects are passed through unchanged, which
// covers YAML timestamps that Astro's loader already converted.
const optionalDateField = z.preprocess(
  (v) => (typeof v === "string" ? toDate(v) : v),
  z.date().optional(),
);

// Tolerates string, number, or array of mixed string/number for tags/categories.
// Hugo allows numeric tags like "2017" which YAML parses as a number.
const arrayOrString = z.preprocess((val) => {
  if (val === null || val === undefined) return [];
  // Scalar → wrap in array
  const arr = Array.isArray(val) ? val : [val];
  // Coerce each element to string
  return arr.map((v) => String(v));
}, z.array(z.string()).optional());

const postSchema = z.object({
  // title and date are required for published posts but bare-draft files may
  // omit them; default to empty/epoch so the schema doesn't reject them.
  title: z.string().default(""),
  date: z.preprocess(
    (v) => (typeof v === "string" ? toDate(v) : v),
    z.date().default(new Date(0)),
  ),
  lastmod: optionalDateField,
  updated: optionalDateField,
  slug: z.string().nullish(),
  permalink: z.string().nullish(),
  description: z.string().nullish(),
  featured_image: z.string().nullish(),
  tags: arrayOrString,
  categories: arrayOrString,
  draft: z.boolean().default(false),
  hidden: z.boolean().default(false),
  enableLaTeX: z.boolean().default(false),
  comment: z.boolean().optional(),
  disableToC: z.boolean().optional(),
  disableMetaInfo: z.boolean().optional(),
  disablePagination: z.boolean().optional(),
  disableImageViewer: z.boolean().optional(),
  disableCC: z.boolean().optional(),
  disableOutdatedNotice: z.boolean().optional(),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: postSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: postSchema,
});

export const collections = { posts, pages };
