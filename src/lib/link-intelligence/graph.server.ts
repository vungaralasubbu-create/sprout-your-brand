/**
 * Internal Linking Intelligence — Graph builder.
 * Discovers linkable content across all supported types and maintains
 * link_graph_nodes with authority + orphan status. Additive only.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// The graph spans many content tables with distinct schemas; use a loose
// client here to avoid coupling to generated types. Never used for auth.
const db = supabaseAdmin as unknown as {
  from: (t: string) => any;
};

export type NodeContentType =
  | "blog" | "course" | "career_guide" | "roadmap" | "interview_questions"
  | "project" | "tutorial" | "salary" | "technology" | "comparison"
  | "certification" | "company" | "placement" | "scholarship"
  | "student_story" | "case_study" | "landing" | "faq" | "glossary"
  | "pseo";

/**
 * Rebuild the graph node index from published content sources.
 * Idempotent — upserts by (content_type, content_id).
 */
export async function rebuildGraphNodes(): Promise<{ upserted: number }> {
  let upserted = 0;
  const push = async (rows: Array<Record<string, unknown>>) => {
    if (!rows.length) return;
    const { error } = await db.from("link_graph_nodes")
      .upsert(rows, { onConflict: "content_type,content_id" });
    if (!error) upserted += rows.length;
  };

  // Blogs
  const { data: blogs } = await db.from("blog_posts")
    .select("id, slug, title, category_id, keywords, status")
    .eq("status", "published").limit(5000);
  await push((blogs ?? []).map((b: any) => ({
    content_type: "blog",
    content_id: String(b.id),
    url: `/blog/${b.slug}`,
    title: b.title,
    topic_cluster: b.category_id ?? null,
    keywords: Array.isArray(b.keywords) ? b.keywords : [],
  })));

  // Courses
  const { data: courses } = await db.from("courses")
    .select("id, slug, title, category_id, status")
    .in("status", ["published", "active"]).limit(5000);
  await push((courses ?? []).map((c: any) => ({
    content_type: "course",
    content_id: String(c.id),
    url: `/programs/${c.slug}`,
    title: c.title,
    topic_cluster: c.category_id ?? null,
    keywords: [],
  })));

  // Content Hub items (roadmaps, tutorials, guides, comparisons, etc.)
  const { data: items } = await db.from("content_items")
    .select("id, slug, title, kind, category_id, status")
    .eq("status", "published").limit(20000);
  await push((items ?? []).map((c: any) => ({
    content_type: mapKind(c.kind),
    content_id: String(c.id),
    url: `/${c.kind ?? "content"}/${c.slug}`,
    title: c.title,
    topic_cluster: c.category_id ?? null,
    keywords: [],
  })));

  // Programmatic SEO pages
  const { data: pseo } = await db.from("pseo_pages")
    .select("id, slug, title, keywords, status")
    .eq("status", "published").limit(20000);
  await push((pseo ?? []).map((p: any) => ({
    content_type: "pseo",
    content_id: String(p.id),
    url: `/p/${p.slug}`,
    title: p.title,
    keywords: Array.isArray(p.keywords) ? p.keywords : [],
  })));

  // Knowledge base / glossary
  const { data: kb } = await db.from("kb_articles")
    .select("id, slug, title, category_id, kind, tags, published")
    .eq("published", true).limit(5000);
  await push((kb ?? []).map((g: any) => ({
    content_type: g.kind === "glossary" ? "glossary" : "faq",
    content_id: String(g.id),
    url: `/help/${g.slug}`,
    title: g.title,
    topic_cluster: g.category_id ?? null,
    keywords: Array.isArray(g.tags) ? g.tags : [],
  })));

  await recomputeGraphStats();
  return { upserted };
}

function mapKind(kind: string | null): string {
  const m: Record<string, string> = {
    roadmap: "roadmap", tutorial: "tutorial", guide: "career_guide",
    comparison: "comparison", certification: "certification",
    interview: "interview_questions", salary: "salary",
    technology: "technology", project: "project", faq: "faq",
    story: "student_story", case_study: "case_study",
    company: "company", placement: "placement", scholarship: "scholarship",
    landing: "landing",
  };
  return m[kind ?? ""] ?? "landing";
}

/** Recompute inbound/outbound counts + orphan flags from link_graph_edges. */
export async function recomputeGraphStats(): Promise<void> {
  const { data: outb } = await db.from("link_graph_edges")
    .select("from_node_id").eq("status", "active");
  const { data: inb } = await db.from("link_graph_edges")
    .select("to_node_id").eq("status", "active");

  const outCount = new Map<string, number>();
  const inCount = new Map<string, number>();
  (outb ?? []).forEach((r: any) => outCount.set(r.from_node_id, (outCount.get(r.from_node_id) ?? 0) + 1));
  (inb ?? []).forEach((r: any) => inCount.set(r.to_node_id, (inCount.get(r.to_node_id) ?? 0) + 1));

  const { data: nodes } = await db.from("link_graph_nodes").select("id");
  for (const n of (nodes ?? []) as Array<{ id: string }>) {
    const outC = outCount.get(n.id) ?? 0;
    const inC = inCount.get(n.id) ?? 0;
    await db.from("link_graph_nodes").update({
      inbound_count: inC,
      outbound_count: outC,
      is_orphan: inC === 0,
      updated_at: new Date().toISOString(),
    }).eq("id", n.id);
  }
}

/** Simple internal PageRank (damped, in-memory). */
export async function computePageRank(iterations = 20, damping = 0.85): Promise<void> {
  const { data: nodes } = await db.from("link_graph_nodes").select("id");
  const { data: edges } = await db.from("link_graph_edges")
    .select("from_node_id, to_node_id, weight").eq("status", "active");
  if (!nodes?.length) return;

  const ids = (nodes as Array<{ id: string }>).map((n) => n.id);
  const N = ids.length;
  const rank = new Map<string, number>(ids.map((id) => [id, 1 / N]));
  const outAdj = new Map<string, Array<{ to: string; w: number }>>();
  (edges ?? []).forEach((e: any) => {
    const arr = outAdj.get(e.from_node_id) ?? [];
    arr.push({ to: e.to_node_id, w: e.weight ?? 1 });
    outAdj.set(e.from_node_id, arr);
  });

  for (let it = 0; it < iterations; it++) {
    const next = new Map<string, number>(ids.map((id) => [id, (1 - damping) / N]));
    for (const [from, outs] of outAdj) {
      const r = rank.get(from) ?? 0;
      const totalW = outs.reduce((s, o) => s + o.w, 0) || 1;
      for (const o of outs) {
        next.set(o.to, (next.get(o.to) ?? 0) + damping * r * (o.w / totalW));
      }
    }
    for (const [k, v] of next) rank.set(k, v);
  }

  for (const id of ids) {
    await db.from("link_graph_nodes").update({
      pagerank: rank.get(id) ?? 0,
      authority: (rank.get(id) ?? 0) * N,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
  }
}
