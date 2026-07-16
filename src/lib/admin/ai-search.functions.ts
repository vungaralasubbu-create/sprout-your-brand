import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

const AI_SIGNALS = {
  quickAnswer: /quick[\s-]*(answer|summary)|tl;?dr|in short/i,
  keyTakeaways: /key takeaway|key point|highlights?/i,
  definition: /^#{1,3}\s*(what is|definition)|is defined as|refers to/im,
  faq: /##\s*(faq|frequently asked|questions?)|^q:\s|^\*\*q\.\s/im,
  prerequisites: /prerequisit|before you (start|begin)|you should know/i,
  learningTime: /learning time|estimated (time|hours)|takes.*(hours|weeks|months) to learn/i,
  careerRelevance: /career|role|salary|hiring|job (title|role)/i,
  applications: /use cases?|applications?|real-world/i,
  examples: /example[s]?[:\s]|for instance|e\.g\./i,
  bulletList: /^[-*]\s/m,
  table: /^\|.+\|/m,
  headings: /^#{2,3}\s/m,
};

type Flags = Record<keyof typeof AI_SIGNALS, boolean>;
function analyzeItem(it: any) {
  const md = String(it.body_markdown ?? "");
  const flags = {} as Flags;
  for (const [k, re] of Object.entries(AI_SIGNALS)) flags[k] = re.test(md);

  const headingCount = (md.match(/^#{2,3}\s.+$/gm) ?? []).length;
  const bulletCount = (md.match(/^[-*]\s.+$/gm) ?? []).length;
  const wc = String(md).split(/\s+/).filter(Boolean).length;
  const internalLinks = (md.match(/\]\(\/[^)]+\)/g) ?? []).length;

  // AI readiness composite (0-100)
  const scores = {
    summary: (flags.quickAnswer ? 55 : 0) + (flags.keyTakeaways ? 45 : 0),
    definition: flags.definition ? 100 : 0,
    faq: flags.faq ? 100 : 0,
    entities: internalLinks >= 5 ? 100 : internalLinks * 20,
    structure: Math.min(100, headingCount * 15) * 0.5 + (bulletCount >= 4 ? 50 : bulletCount * 12),
    citation: (flags.definition ? 25 : 0) + (flags.faq ? 25 : 0) + (flags.applications ? 25 : 0) + (flags.examples ? 25 : 0),
    schema: (it.seo_title && it.seo_description ? 60 : 0) + (it.featured_image ? 20 : 0) + (flags.faq ? 20 : 0),
    metadata: (it.seo_title ? 25 : 0) + (it.seo_description ? 25 : 0) + (it.focus_topic ? 25 : 0) + (it.category_id ? 25 : 0),
  };
  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length);

  return { ...flags, headingCount, bulletCount, wc, internalLinks, scores, overall };
}

export const getAiSearchDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data } = await s.from("content_items")
      .select("id, title, slug, type, status, updated_at, seo_title, seo_description, featured_image, focus_topic, category_id, body_markdown")
      .eq("status", "published");
    const items = data ?? [];
    const analyzed = items.map((i: any) => ({ id: i.id, title: i.title, slug: i.slug, type: i.type, updated_at: i.updated_at, ...analyzeItem(i) }));

    const avg = (k: keyof typeof analyzed[0]["scores"]) =>
      analyzed.length ? Math.round(analyzed.reduce((a, b) => a + b.scores[k], 0) / analyzed.length) : 0;
    const pct = (fn: (a: any) => boolean) =>
      analyzed.length ? Math.round((analyzed.filter(fn).length / analyzed.length) * 100) : 0;

    return {
      total: analyzed.length,
      readiness: {
        overall: analyzed.length ? Math.round(analyzed.reduce((a, b) => a + b.overall, 0) / analyzed.length) : 0,
        summary: avg("summary"),
        definition: avg("definition"),
        faq: avg("faq"),
        entities: avg("entities"),
        structure: Math.round(avg("structure")),
        citation: avg("citation"),
        schema: avg("schema"),
        metadata: avg("metadata"),
      },
      coverage: {
        quickAnswer: pct((a) => a.quickAnswer),
        keyTakeaways: pct((a) => a.keyTakeaways),
        definition: pct((a) => a.definition),
        faq: pct((a) => a.faq),
        prerequisites: pct((a) => a.prerequisites),
        learningTime: pct((a) => a.learningTime),
        careerRelevance: pct((a) => a.careerRelevance),
        applications: pct((a) => a.applications),
        examples: pct((a) => a.examples),
        tables: pct((a) => a.table),
      },
      weakest: analyzed.sort((a, b) => a.overall - b.overall).slice(0, 12),
      strongest: analyzed.sort((a, b) => b.overall - a.overall).slice(0, 8),
    };
  });

export const getAiSearchTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data } = await s.from("content_items")
      .select("id, title, slug, type, updated_at, seo_title, seo_description, featured_image, focus_topic, body_markdown")
      .eq("status", "published");
    const items = data ?? [];
    const tasks: Array<{ id: string; title: string; slug: string; type: string; missing: string[] }> = [];
    for (const it of items) {
      const a = analyzeItem(it);
      const missing: string[] = [];
      if (!a.quickAnswer) missing.push("Quick Answer");
      if (!a.keyTakeaways) missing.push("Key Takeaways");
      if (!a.definition) missing.push("Definition");
      if (!a.faq) missing.push("FAQ block");
      if (!it.seo_title || !it.seo_description) missing.push("SEO meta");
      if (a.internalLinks < 3) missing.push("Internal links");
      if (!a.applications) missing.push("Applications");
      if (missing.length) tasks.push({ id: it.id, title: it.title, slug: it.slug, type: it.type, missing });
    }
    return { tasks: tasks.slice(0, 200), total: tasks.length };
  });

const LLMS_SECTIONS = [
  { key: "programs", label: "Programs", path: "/programs", auto: true },
  { key: "learn", label: "Learn Guides", path: "/learn", auto: true },
  { key: "glossary", label: "Glossary", path: "/glossary", auto: true },
  { key: "career", label: "Career Guides", path: "/career-maps", auto: true },
  { key: "roadmaps", label: "Roadmaps", path: "/learning-paths", auto: true },
  { key: "blog", label: "Blog Library", path: "/blog", auto: true },
  { key: "topics", label: "Topics", path: "/topics", auto: true },
  { key: "entities", label: "Entity Directory", path: "/entities", auto: true },
  { key: "docs", label: "Documentation", path: "/learn/topics", auto: true },
  { key: "policies", label: "Policies & Legal", path: "/legal", auto: false },
];

export const getLlmsConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { count: contentCount } = await s.from("content_items").select("id", { count: "exact", head: true }).eq("status", "published");
    return { sections: LLMS_SECTIONS, publishedContent: contentCount ?? 0, lastGenerated: new Date().toISOString() };
  });
