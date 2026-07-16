/**
 * Central SEO head helper.
 *
 * Builds a TanStack Router `head()` return value with a consistent
 * shape across every public route: title, description, canonical,
 * Open Graph, Twitter, robots, and an optional JSON-LD schema array.
 *
 * Usage:
 *   head: () =>
 *     buildPageHead({
 *       path: "/earn",
 *       title: "Earn With Glintr",
 *       description: "…",
 *       image: "https://…/og.png",
 *       type: "website",
 *       schema: [{ "@context": "https://schema.org", "@type": "…" }],
 *     }),
 */

export const SITE_ORIGIN = "https://glintr.com";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/__l5e/assets-v1/d12f985f-d4a9-44a8-ae66-6ea6d0a3b725/glintr-mark.png`;

export interface BuildPageHeadOptions {
  /** Canonical path, always relative, always leading slash. */
  path: string;
  title: string;
  description: string;
  /** Absolute URL to an OG-suitable image. Falls back to the Glintr mark. */
  image?: string | null;
  type?: "website" | "article" | "profile";
  /** Set true for private / gated / duplicate-content routes. */
  noindex?: boolean;
  /** Optional structured-data payloads (already object form, we JSON.stringify). */
  schema?: Array<Record<string, unknown>>;
}

export interface BuildPageHeadResult {
  meta: Array<Record<string, string>>;
  links: Array<{ rel: string; href: string }>;
  scripts: Array<{ type: string; children: string }>;
}

export function buildPageHead(opts: BuildPageHeadOptions): BuildPageHeadResult {
  const url = absoluteUrl(opts.path);
  const image = opts.image ?? DEFAULT_OG_IMAGE;
  const type = opts.type ?? "website";
  const robots = opts.noindex ? "noindex, nofollow" : "index, follow";

  const meta: Array<Record<string, string>> = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { name: "robots", content: robots },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:site_name", content: "Glintr" },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: image },
  ];

  const links: Array<{ rel: string; href: string }> = opts.noindex
    ? []
    : [{ rel: "canonical", href: url }];

  const scripts = (opts.schema ?? []).map((s) => ({
    type: "application/ld+json",
    children: JSON.stringify(s),
  }));

  return { meta, links, scripts };
}

/** Absolute-URL helper. Accepts any path, always returns a fully qualified URL. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}

/**
 * Build a BreadcrumbList JSON-LD object.
 *
 * Each item is a `{ name, path }` tuple; the helper turns it into a
 * schema.org BreadcrumbList ready to pass to `buildPageHead({ schema })`.
 */
export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
