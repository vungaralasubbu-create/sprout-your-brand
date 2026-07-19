/**
 * Glintr SEO Engine — the single, centralized source of truth for every
 * page's SEO surface. Route `head()` functions call `buildSeo({...})`
 * and receive a fully-populated `{ meta, links, scripts }` payload for
 * TanStack Router.
 *
 * What it covers:
 *  - Dynamic title (clamped to <60 chars) and description (140–160 chars)
 *  - Self-referencing canonical + og:url
 *  - Open Graph (title, description, image, type, site_name, locale)
 *  - Twitter Card (summary_large_image)
 *  - Robots directives (index/follow/noindex/nofollow, noarchive, max-*)
 *  - Breadcrumb JSON-LD
 *  - Arbitrary structured-data (JSON-LD) stacking
 *  - Hreflang alternates
 *  - Pagination (rel="prev" / rel="next") for listing pages
 *
 * Every page type on Glintr (17 kinds) has an adapter in `generators.ts`
 * that maps its domain data → `SeoInput`. This file is intentionally
 * UI-free and read-only: it never touches routes, auth, or payments.
 */

import type { BreadcrumbItem } from "./breadcrumbs";
import { breadcrumbListSchema } from "./breadcrumbs";
import { hreflangLinks, type HreflangAlternate } from "./hreflang";
import { paginationLinks, type PaginationInput } from "./pagination";

export const SITE_ORIGIN = "https://glintr.com";
export const SITE_NAME = "Glintr";
export const DEFAULT_LOCALE = "en_IN";
export const DEFAULT_OG_IMAGE =
  `${SITE_ORIGIN}/__l5e/assets-v1/d12f985f-d4a9-44a8-ae66-6ea6d0a3b725/glintr-mark.png`;

const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;

export type OgType =
  | "website"
  | "article"
  | "product"
  | "profile"
  | "book"
  | "video.other";

export interface RobotsDirective {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  maxSnippet?: number;
  maxImagePreview?: "none" | "standard" | "large";
  maxVideoPreview?: number;
}

export interface SeoInput {
  /** Path relative to SITE_ORIGIN, e.g. "/programs/ai/chatgpt-mastery". */
  path: string;
  /** Raw title before clamping. */
  title: string;
  /** Raw description; the engine will pad/trim to 140–160 chars. */
  description: string;
  ogType?: OgType;
  /** Absolute image URL for og:image + twitter:image. */
  image?: string | null;
  imageAlt?: string | null;
  locale?: string;
  robots?: RobotsDirective;
  /** Extra keywords (rendered as <meta name="keywords">). Optional; ignored by most crawlers but useful for internal search. */
  keywords?: string[];
  /** Author string for og:article and articles. */
  author?: string | null;
  /** ISO timestamp — sets article:published_time. */
  publishedAt?: string | null;
  /** ISO timestamp — sets article:modified_time. */
  updatedAt?: string | null;
  breadcrumbs?: BreadcrumbItem[];
  /** Additional JSON-LD graph nodes to stack (Article, Course, FAQPage, etc.). */
  schemas?: Array<Record<string, unknown>>;
  hreflang?: HreflangAlternate[];
  pagination?: PaginationInput;
  /** Optional Twitter handle override, e.g. "@glintrhq". */
  twitterSite?: string;
  /** When true, adds <meta name="robots" content="noindex"> even if index is undefined. */
  noindex?: boolean;
}

export interface HeadPayload {
  meta: Array<Record<string, string>>;
  links: Array<Record<string, string>>;
  scripts: Array<{ type: string; children: string }>;
}

// ---------- string helpers ----------

export function absoluteUrl(path: string): string {
  if (!path) return SITE_ORIGIN;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${clean}`;
}

export function clampTitle(base: string, brandSuffix = `| ${SITE_NAME}`): string {
  const raw = (base ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return SITE_NAME;
  const full = raw.includes(SITE_NAME) ? raw : `${raw} ${brandSuffix}`.trim();
  if (full.length <= TITLE_MAX) return full;
  const room = TITLE_MAX - brandSuffix.length - 2;
  return `${raw.slice(0, Math.max(10, room)).trimEnd()}… ${brandSuffix}`;
}

export function clampDescription(base: string, filler?: string): string {
  let d = (base ?? "").trim().replace(/\s+/g, " ");
  if (!d) {
    d = `Learn with ${SITE_NAME} — live cohorts, hands-on projects, mentor support, and real career outcomes.`;
  }
  if (d.length >= DESC_MIN && d.length <= DESC_MAX) return d;
  if (d.length > DESC_MAX) return d.slice(0, DESC_MAX - 1).replace(/[,.;:\s]+\S*$/, "") + "…";
  if (filler) d = `${d} ${filler}`.trim();
  if (d.length < DESC_MIN) {
    d = `${d} Launch. Sell. Grow. with ${SITE_NAME} — live cohorts, mentor support, and outcome-first training.`;
  }
  if (d.length > DESC_MAX) d = d.slice(0, DESC_MAX - 1) + "…";
  return d;
}

function robotsContent(input: SeoInput): string | null {
  const r = input.robots ?? {};
  if (input.noindex || r.index === false) {
    const parts = ["noindex"];
    if (r.follow === false) parts.push("nofollow");
    if (r.noarchive) parts.push("noarchive");
    if (r.nosnippet) parts.push("nosnippet");
    return parts.join(", ");
  }
  const parts: string[] = [];
  if (r.follow === false) parts.push("nofollow");
  if (r.noarchive) parts.push("noarchive");
  if (r.nosnippet) parts.push("nosnippet");
  if (typeof r.maxSnippet === "number") parts.push(`max-snippet:${r.maxSnippet}`);
  if (r.maxImagePreview) parts.push(`max-image-preview:${r.maxImagePreview}`);
  if (typeof r.maxVideoPreview === "number") parts.push(`max-video-preview:${r.maxVideoPreview}`);
  return parts.length ? parts.join(", ") : null;
}

// ---------- main builder ----------

export function buildSeo(input: SeoInput): HeadPayload {
  const url = absoluteUrl(input.path);
  const title = clampTitle(input.title);
  const description = clampDescription(input.description);
  const ogType = input.ogType ?? "website";
  const image = input.image ?? DEFAULT_OG_IMAGE;
  const locale = input.locale ?? DEFAULT_LOCALE;

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: ogType },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: locale },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
    if (input.imageAlt) {
      meta.push({ property: "og:image:alt", content: input.imageAlt });
      meta.push({ name: "twitter:image:alt", content: input.imageAlt });
    }
  }

  if (input.twitterSite) meta.push({ name: "twitter:site", content: input.twitterSite });

  if (input.keywords && input.keywords.length) {
    meta.push({ name: "keywords", content: input.keywords.slice(0, 20).join(", ") });
  }

  if (ogType === "article") {
    if (input.author) meta.push({ property: "article:author", content: input.author });
    if (input.publishedAt) meta.push({ property: "article:published_time", content: input.publishedAt });
    if (input.updatedAt) meta.push({ property: "article:modified_time", content: input.updatedAt });
  }

  const robots = robotsContent(input);
  if (robots) meta.push({ name: "robots", content: robots });

  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: url },
  ];

  for (const alt of hreflangLinks(input.hreflang)) links.push(alt);
  for (const p of paginationLinks(input.pagination)) links.push(p);

  const scripts: Array<{ type: string; children: string }> = [];

  if (input.breadcrumbs && input.breadcrumbs.length) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify(breadcrumbListSchema(input.breadcrumbs)),
    });
  }

  for (const s of input.schemas ?? []) {
    scripts.push({ type: "application/ld+json", children: JSON.stringify(s) });
  }

  return { meta, links, scripts };
}
