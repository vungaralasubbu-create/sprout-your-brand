// Lightweight HTML analyzer used by the Site Health Center crawler.
// Pure functions — no external dependencies. Extracts every signal the audit
// engine needs from a page's HTML string.

export type PageSignals = {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  viewport: string | null;
  lang: string | null;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  headingsOrder: string[];
  wordCount: number;
  text: string;
  images: Array<{
    src: string;
    alt: string | null;
    width: string | null;
    height: string | null;
    loading: string | null;
    format: string | null;
  }>;
  links: Array<{ href: string; rel: string | null; text: string }>;
  scripts: number;
  stylesheets: number;
  jsonLd: any[];
  hasHttpsMixed: boolean;
  htmlBytes: number;
};

const stripTags = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const attr = (tag: string, name: string): string | null => {
  const re = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = tag.match(re);
  return m ? (m[2] ?? m[3] ?? m[4] ?? null) : null;
};

const findMeta = (html: string, key: "name" | "property", value: string) => {
  const re = new RegExp(
    `<meta[^>]*${key}\\s*=\\s*["']${value}["'][^>]*>`,
    "i",
  );
  const m = html.match(re);
  return m ? attr(m[0], "content") : null;
};

export function analyzeHtml(html: string): PageSignals {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  const metaDescription = findMeta(html, "name", "description");
  const robots = findMeta(html, "name", "robots");
  const viewport = findMeta(html, "name", "viewport");
  const ogTitle = findMeta(html, "property", "og:title");
  const ogDescription = findMeta(html, "property", "og:description");
  const ogImage = findMeta(html, "property", "og:image");
  const twitterCard = findMeta(html, "name", "twitter:card");

  const canonicalMatch = html.match(
    /<link[^>]*rel\s*=\s*["']canonical["'][^>]*>/i,
  );
  const canonical = canonicalMatch ? attr(canonicalMatch[0], "href") : null;

  const langMatch = html.match(/<html[^>]*\slang\s*=\s*["']([^"']+)["']/i);
  const lang = langMatch ? langMatch[1] : null;

  const headings = [...html.matchAll(/<h([1-6])[^>]*>/gi)].map((m) => `h${m[1]}`);
  const h1Count = headings.filter((h) => h === "h1").length;
  const h2Count = headings.filter((h) => h === "h2").length;
  const h3Count = headings.filter((h) => h === "h3").length;

  const text = stripTags(html);
  const wordCount = text ? text.split(/\s+/).length : 0;

  const images: PageSignals["images"] = [
    ...html.matchAll(/<img\b[^>]*>/gi),
  ].map((m) => {
    const tag = m[0];
    const src = attr(tag, "src") ?? "";
    return {
      src,
      alt: attr(tag, "alt"),
      width: attr(tag, "width"),
      height: attr(tag, "height"),
      loading: attr(tag, "loading"),
      format: src.split("?")[0].split(".").pop()?.toLowerCase() ?? null,
    };
  });

  const links: PageSignals["links"] = [
    ...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi),
  ].map((m) => {
    const tag = `<a ${m[1]}>`;
    return {
      href: attr(tag, "href") ?? "",
      rel: attr(tag, "rel"),
      text: stripTags(m[2]).slice(0, 200),
    };
  });

  const scripts = (html.match(/<script\b/gi) ?? []).length;
  const stylesheets = (html.match(/<link[^>]*rel\s*=\s*["']stylesheet["']/gi) ?? [])
    .length;

  const jsonLd: any[] = [];
  for (const m of html.matchAll(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(m[1].trim());
      jsonLd.push(parsed);
    } catch {
      // ignore invalid JSON-LD — surfaced separately as an issue
    }
  }

  const hasHttpsMixed = /(src|href)\s*=\s*["']http:\/\//i.test(html);

  return {
    title,
    metaDescription,
    canonical,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    viewport,
    lang,
    h1Count,
    h2Count,
    h3Count,
    headingsOrder: headings,
    wordCount,
    text,
    images,
    links,
    scripts,
    stylesheets,
    jsonLd,
    hasHttpsMixed,
    htmlBytes: new Blob([html]).size,
  };
}

/** Check heading structure for skipped levels or missing H1. */
export function headingIssues(order: string[]): string[] {
  const problems: string[] = [];
  const levels = order.map((h) => Number(h.slice(1)));
  if (!levels.includes(1)) problems.push("h1_missing");
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      problems.push(`skipped_level:${levels[i - 1]}_to_${levels[i]}`);
      break;
    }
  }
  return problems;
}

/** Very cheap Flesch reading-ease approximation. */
export function readabilityScore(text: string): number {
  const sentences = (text.match(/[.!?]+/g) ?? []).length || 1;
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const syllables = Math.max(
    words,
    (text.toLowerCase().match(/[aeiouy]+/g) ?? []).length,
  );
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, Math.round(score)));
}
