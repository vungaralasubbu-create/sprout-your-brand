// Recommendation engine for the workspace: derives interests from recently viewed
// items + saved bookmarks, then ranks programs, blogs, glossary, tools, and paths.

import { GLOSSARY } from "@/data/glossary";
import { LEARNING_PATHS } from "@/data/learning-paths";
import { TOOLS } from "@/data/tools";
import type { Bookmark, RecentItem } from "@/lib/mentor/storage";

export interface Recommendation {
  href: string;
  label: string;
  kind: "program" | "blog" | "glossary" | "tool" | "path";
  reason: string;
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  ai: ["ai", "artificial", "chatgpt", "claude", "gemini", "gen", "ml", "machine", "prompt", "deep", "neural"],
  vlsi: ["vlsi", "electronics", "chip", "verilog", "vhdl", "embedded", "iot", "cadence"],
  marketing: ["marketing", "seo", "ads", "brand", "growth", "digital-marketing"],
  cs: ["software", "developer", "programming", "cloud", "python", "java", "web", "full-stack"],
  data: ["data", "analytics", "sql", "power-bi", "tableau", "science"],
};

export function inferInterests(recent: RecentItem[], bookmarks: Bookmark[]): string[] {
  const bag = [...recent, ...bookmarks].map((r) => `${r.href} ${r.label}`.toLowerCase()).join(" ");
  const scores: Record<string, number> = {};
  for (const [domain, words] of Object.entries(DOMAIN_KEYWORDS)) {
    scores[domain] = words.reduce((acc, w) => acc + (bag.includes(w) ? 1 : 0), 0);
  }
  return Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
}

function matches(text: string, domain: string) {
  const words = DOMAIN_KEYWORDS[domain] ?? [];
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w));
}

export function buildRecommendations(
  recent: RecentItem[],
  bookmarks: Bookmark[],
  seenHrefs: Set<string>,
): Recommendation[] {
  const interests = inferInterests(recent, bookmarks);
  const primary = interests[0];

  const recs: Recommendation[] = [];

  // Glossary
  for (const g of GLOSSARY) {
    if (recs.filter((r) => r.kind === "glossary").length >= 3) break;
    const href = `/glossary/${g.slug}`;
    if (seenHrefs.has(href)) continue;
    if (primary ? matches(`${g.term} ${g.category}`, primary) : true) {
      recs.push({
        href,
        label: g.term,
        kind: "glossary",
        reason: primary ? `Because you're exploring ${primary.toUpperCase()}` : "Popular glossary",
      });
    }
  }

  // Learning paths
  for (const p of LEARNING_PATHS) {
    if (recs.filter((r) => r.kind === "path").length >= 2) break;
    const href = `/learning-paths/${p.slug}`;
    if (seenHrefs.has(href)) continue;
    if (primary ? matches(`${p.title} ${p.domain}`, primary) : true) {
      recs.push({
        href,
        label: p.title,
        kind: "path",
        reason: `Learning path • ${p.domain}`,
      });
    }
  }

  // Tools
  for (const t of TOOLS) {
    if (recs.filter((r) => r.kind === "tool").length >= 3) break;
    const href = `/tools/${t.slug}`;
    if (seenHrefs.has(href)) continue;
    if (primary ? matches(`${t.title} ${t.category}`, primary) : true) {
      recs.push({
        href,
        label: t.title,
        kind: "tool",
        reason: `Tool • ${t.category}`,
      });
    }
  }

  return recs.slice(0, 8);
}
