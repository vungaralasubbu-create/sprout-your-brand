/**
 * Knowledge Graph — builds a deterministic radial layout of Glintr's
 * concepts, learning paths, careers and comparisons.
 *
 * The graph is derived from data, not stored. It stays SSR-friendly and
 * the layout is deterministic so tests and share links are stable.
 */

import { GLOSSARY, type GlossaryEntry, type GlossaryCategory } from "@/data/glossary";
import { LEARNING_PATHS } from "@/data/learning-paths";
import { CAREER_MAPS } from "@/data/career-maps";
import { COMPARISONS } from "@/data/comparisons";

export type NodeKind = "concept" | "path" | "career";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  slug: string;
  category: string;
  domain: Domain;
  level: Level; // beginner | intermediate | advanced
  popular: boolean;
  x: number;
  y: number;
  r: number;
  aliases?: string[];
  short?: string;
  entry?: GlossaryEntry;
  readingMinutes?: number;
}

export type EdgeKind =
  | "related"
  | "prerequisite"
  | "advanced"
  | "alternative"
  | "path"
  | "career";

export interface GraphEdge {
  a: string; // node id
  b: string;
  kind: EdgeKind;
  weight?: number; // 1..3 visual weight
}

export type Level = "beginner" | "intermediate" | "advanced";

// ---- Domains ---------------------------------------------------------------

export const DOMAINS = [
  { key: "ai", label: "Artificial Intelligence", color: "oklch(0.72 0.16 235)" },
  { key: "programming", label: "Programming", color: "oklch(0.72 0.16 155)" },
  { key: "cloud", label: "Cloud & Security", color: "oklch(0.72 0.14 260)" },
  { key: "electronics", label: "Engineering", color: "oklch(0.74 0.13 55)" },
  { key: "marketing", label: "Marketing", color: "oklch(0.72 0.18 25)" },
  { key: "business", label: "Business", color: "oklch(0.74 0.12 85)" },
  { key: "finance", label: "Finance", color: "oklch(0.72 0.13 200)" },
  { key: "healthcare", label: "Healthcare", color: "oklch(0.74 0.13 355)" },
  { key: "career", label: "Career", color: "oklch(0.70 0.10 300)" },
] as const;

export type Domain = (typeof DOMAINS)[number]["key"];

const CATEGORY_TO_DOMAIN: Record<GlossaryCategory, Domain> = {
  "Artificial Intelligence": "ai",
  "Machine Learning": "ai",
  "Generative AI": "ai",
  Programming: "programming",
  "Software Development": "programming",
  Cloud: "cloud",
  "Cyber Security": "cloud",
  VLSI: "electronics",
  "Embedded Systems": "electronics",
  IoT: "electronics",
  Robotics: "electronics",
  "Mechanical Engineering": "electronics",
  "Digital Marketing": "marketing",
  Business: "business",
  "Human Resources": "business",
  Finance: "finance",
  "Investment Banking": "finance",
  Healthcare: "healthcare",
  "Medical Coding": "healthcare",
  "Genetic Engineering": "healthcare",
  Career: "career",
  "General Technology": "career",
};

export function domainOf(category: string): Domain {
  return CATEGORY_TO_DOMAIN[category as GlossaryCategory] ?? "career";
}

export function domainMeta(domain: Domain) {
  return DOMAINS.find((d) => d.key === domain) ?? DOMAINS[DOMAINS.length - 1];
}

// ---- Level heuristic -------------------------------------------------------

function levelFor(entry: GlossaryEntry): Level {
  const advanced = new Set([
    "deep-learning",
    "neural-network",
    "llm",
    "rtl",
    "semiconductor",
    "fpga",
    "kubernetes",
    "docker",
    "financial-modeling",
    "investment-banking",
    "cyber-security",
  ]);
  const beginner = new Set([
    "artificial-intelligence",
    "machine-learning",
    "chatgpt",
    "claude",
    "gemini",
    "prompt-engineering",
    "html",
    "css",
    "javascript",
    "api",
    "cloud-computing",
    "seo",
    "sem",
    "digital-marketing",
    "finance",
    "medical-coding",
    "iot",
    "embedded-systems",
    "firmware",
    "microcontroller",
  ]);
  if (advanced.has(entry.slug)) return "advanced";
  if (beginner.has(entry.slug) || entry.popular) return "beginner";
  return "intermediate";
}

// ---- Layout ----------------------------------------------------------------

const CANVAS = { w: 1200, h: 900, cx: 600, cy: 450 };

function domainAngle(domain: Domain): number {
  const idx = DOMAINS.findIndex((d) => d.key === domain);
  const total = DOMAINS.length;
  // start at -90deg (top) and go clockwise
  return (-Math.PI / 2) + (idx / total) * Math.PI * 2;
}

// Deterministic cluster position for a node index within a domain
function positionFor(domain: Domain, idxInCluster: number, count: number) {
  const R = 340; // main ring radius
  const cluster = 110; // sub-cluster radius
  const a = domainAngle(domain);
  const cx = CANVAS.cx + Math.cos(a) * R;
  const cy = CANVAS.cy + Math.sin(a) * R;
  // Distribute nodes in a spiral within cluster
  const ang = (idxInCluster / Math.max(count, 1)) * Math.PI * 2;
  const rad = cluster * (0.55 + 0.45 * (idxInCluster / Math.max(count, 1)));
  return {
    x: cx + Math.cos(ang) * rad,
    y: cy + Math.sin(ang) * rad,
  };
}

// ---- Build -----------------------------------------------------------------

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  byId: Map<string, GraphNode>;
  neighbors: Map<string, Set<string>>;
  domainCenters: Array<{ domain: Domain; label: string; x: number; y: number; color: string }>;
  canvas: typeof CANVAS;
}

function buildGraph(): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Group glossary by domain
  const byDomain: Record<Domain, GlossaryEntry[]> = Object.fromEntries(
    DOMAINS.map((d) => [d.key, [] as GlossaryEntry[]]),
  ) as Record<Domain, GlossaryEntry[]>;

  for (const g of GLOSSARY) {
    byDomain[domainOf(g.category)].push(g);
  }

  for (const domain of DOMAINS.map((d) => d.key)) {
    const list = byDomain[domain];
    list.forEach((g, i) => {
      const { x, y } = positionFor(domain, i, list.length);
      nodes.push({
        id: `g:${g.slug}`,
        kind: "concept",
        label: g.term,
        slug: g.slug,
        category: g.category,
        domain,
        level: levelFor(g),
        popular: !!g.popular,
        x,
        y,
        r: g.popular ? 10 : 7,
        aliases: g.aliases,
        short: g.short,
        entry: g,
      });
    });
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Concept-to-concept edges from `related`
  const seen = new Set<string>();
  for (const g of GLOSSARY) {
    for (const rel of g.related ?? []) {
      const a = `g:${g.slug}`;
      const b = `g:${rel}`;
      if (!byId.has(b)) continue;
      const key = [a, b].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a, b, kind: "related", weight: 1 });
    }
  }

  // Path nodes — placed near center of their domain
  for (const p of LEARNING_PATHS) {
    const domain = domainOf(p.domain);
    const idx = DOMAINS.findIndex((d) => d.key === domain);
    const ang = domainAngle(domain);
    const R = 180;
    const id = `p:${p.slug}`;
    nodes.push({
      id,
      kind: "path",
      label: p.title.replace(" Learning Path", ""),
      slug: p.slug,
      category: p.domain,
      domain,
      level: "beginner",
      popular: true,
      x: CANVAS.cx + Math.cos(ang) * R,
      y: CANVAS.cy + Math.sin(ang) * R,
      r: 12,
      short: p.short,
    });
    // Path step edges — sequential prerequisite chain
    let prev: string | null = null;
    for (const step of p.steps) {
      const gid = step.glossary ? `g:${step.glossary}` : null;
      if (gid && byId.has(gid)) {
        // Path -> first step
        if (!prev) {
          edges.push({ a: id, b: gid, kind: "path", weight: 2 });
        } else {
          edges.push({ a: prev, b: gid, kind: "prerequisite", weight: 2 });
        }
        prev = gid;
      }
    }
    // Ignore idx (avoid unused)
    void idx;
  }

  // Career nodes — outer ring beyond cluster
  for (const c of CAREER_MAPS) {
    const domain = domainOf(c.domain);
    const ang = domainAngle(domain);
    const R = 470;
    const id = `c:${c.slug}`;
    nodes.push({
      id,
      kind: "career",
      label: c.title.replace(" Career Map", ""),
      slug: c.slug,
      category: c.domain,
      domain,
      level: "advanced",
      popular: true,
      x: CANVAS.cx + Math.cos(ang) * R,
      y: CANVAS.cy + Math.sin(ang) * R,
      r: 13,
      short: c.short,
    });
    for (const gs of c.relatedGlossary ?? []) {
      const gid = `g:${gs}`;
      if (byId.has(gid)) edges.push({ a: id, b: gid, kind: "career", weight: 1 });
    }
  }

  // Rebuild byId with all nodes
  const finalById = new Map(nodes.map((n) => [n.id, n]));
  const neighbors = new Map<string, Set<string>>();
  for (const n of nodes) neighbors.set(n.id, new Set());
  for (const e of edges) {
    if (!finalById.has(e.a) || !finalById.has(e.b)) continue;
    neighbors.get(e.a)!.add(e.b);
    neighbors.get(e.b)!.add(e.a);
  }

  const domainCenters = DOMAINS.map((d) => {
    const ang = domainAngle(d.key);
    return {
      domain: d.key,
      label: d.label,
      x: CANVAS.cx + Math.cos(ang) * 340,
      y: CANVAS.cy + Math.sin(ang) * 340,
      color: d.color,
    };
  });

  return { nodes, edges, byId: finalById, neighbors, domainCenters, canvas: CANVAS };
}

export const KNOWLEDGE_GRAPH = buildGraph();

// ---- Search helpers --------------------------------------------------------

export function searchNodes(query: string, limit = 12): GraphNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: Array<{ n: GraphNode; score: number }> = [];
  for (const n of KNOWLEDGE_GRAPH.nodes) {
    const hay = [n.label, n.slug, n.category, ...(n.aliases ?? [])].join(" ").toLowerCase();
    if (!hay.includes(q)) continue;
    let score = 0;
    if (n.label.toLowerCase().startsWith(q)) score += 4;
    if (n.label.toLowerCase() === q) score += 8;
    if (n.aliases?.some((a) => a.toLowerCase() === q)) score += 6;
    if (n.popular) score += 1;
    if (n.kind === "concept") score += 0.5;
    results.push({ n, score });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map((r) => r.n);
}

export function findComparison(a: string, b: string) {
  const set = new Set([a.toLowerCase(), b.toLowerCase()]);
  return (
    COMPARISONS.find(
      (c) => c.items.length === 2 && set.has(c.items[0].toLowerCase()) && set.has(c.items[1].toLowerCase()),
    ) ?? null
  );
}

export function neighborsOf(id: string): GraphNode[] {
  const set = KNOWLEDGE_GRAPH.neighbors.get(id);
  if (!set) return [];
  return Array.from(set)
    .map((nid) => KNOWLEDGE_GRAPH.byId.get(nid)!)
    .filter(Boolean);
}
