/**
 * Contextual internal linking + related content engine.
 * Pure functions; consumers pass the candidate pool from Supabase or static data.
 */

export interface LinkableItem {
  kind: "course" | "blog" | "learning-path" | "career" | "faq" | "glossary" | "tool";
  slug: string;
  title: string;
  categorySlug?: string;
  tags?: string[];
  keywords?: string[];
}

export function urlFor(item: LinkableItem): string {
  switch (item.kind) {
    case "course": return `/programs/${item.categorySlug ?? "programs"}/${item.slug}`;
    case "blog": return `/blog/${item.slug}`;
    case "learning-path": return `/learning-paths/${item.slug}`;
    case "career": return `/careers/${item.slug}`;
    case "faq": return `/faqs/${item.slug}`;
    case "glossary": return `/glossary/${item.slug}`;
    case "tool": return `/tools/${item.slug}`;
  }
}

function tokenize(s: string): Set<string> {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3),
  );
}

function score(a: LinkableItem, b: LinkableItem): number {
  const at = tokenize([a.title, ...(a.tags ?? []), ...(a.keywords ?? [])].join(" "));
  const bt = tokenize([b.title, ...(b.tags ?? []), ...(b.keywords ?? [])].join(" "));
  let s = 0;
  for (const t of at) if (bt.has(t)) s += 1;
  if (a.categorySlug && a.categorySlug === b.categorySlug) s += 3;
  return s;
}

/**
 * Rank related items for a given source, filtered by kind preference.
 * Preferences follow the platform's linking rules (blog↔course, course→path, etc).
 */
export function pickRelated(
  source: LinkableItem,
  pool: LinkableItem[],
  limit = 6,
): LinkableItem[] {
  const preferMap: Record<LinkableItem["kind"], LinkableItem["kind"][]> = {
    blog: ["course", "learning-path", "career", "blog", "faq"],
    course: ["learning-path", "career", "blog", "course", "faq"],
    "learning-path": ["course", "career", "blog"],
    career: ["course", "learning-path", "blog"],
    faq: ["course", "blog", "learning-path"],
    glossary: ["blog", "course", "learning-path"],
    tool: ["course", "blog", "learning-path"],
  };
  const prefer = preferMap[source.kind];
  const scored = pool
    .filter((p) => !(p.kind === source.kind && p.slug === source.slug))
    .map((p) => ({ p, s: score(source, p) + (prefer.indexOf(p.kind) >= 0 ? 10 - prefer.indexOf(p.kind) : 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.p);
}

/**
 * Inject up to `max` contextual links into raw markdown/text by matching
 * item titles against the body. Never creates duplicate anchors, never links
 * inside existing markdown links, and skips when the link is broken.
 */
export function injectContextualLinks(
  body: string,
  candidates: LinkableItem[],
  max = 5,
): string {
  if (!body) return body;
  const used = new Set<string>();
  let out = body;
  for (const c of candidates) {
    if (used.size >= max) break;
    if (used.has(c.slug)) continue;
    const url = urlFor(c);
    const rx = new RegExp(`(?<![\\[\\(\\w])(${escapeRegex(c.title)})(?![\\]\\)\\w])`, "i");
    if (rx.test(out) && !out.includes(url)) {
      out = out.replace(rx, `[$1](${url})`);
      used.add(c.slug);
    }
  }
  return out;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
