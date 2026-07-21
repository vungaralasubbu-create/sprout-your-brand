import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callLovableAiJson, isAiAvailable } from "@/lib/ai-gateway.server";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

const TYPES = [
  "learn_guide","glossary","comparison","faq","roadmap",
  "career_guide","interview_guide","cheat_sheet","learning_path","program_support",
] as const;

const DEPTHS = ["quick","standard","comprehensive","master"] as const;
const AUDIENCES = ["beginner","intermediate","advanced","professional"] as const;

const DEPTH_TARGETS: Record<string, { minWords: number; maxWords: number; sections: number }> = {
  quick: { minWords: 500, maxWords: 800, sections: 4 },
  standard: { minWords: 900, maxWords: 1400, sections: 6 },
  comprehensive: { minWords: 1500, maxWords: 2200, sections: 8 },
  master: { minWords: 2400, maxWords: 3600, sections: 12 },
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 90);
}
function wordCount(s: string) {
  return s.replace(/`{1,3}[\s\S]*?`{1,3}/g, " ").replace(/[#>*_\-\[\]()!]/g, " ").split(/\s+/).filter(Boolean).length;
}
function readingTime(wc: number) { return Math.max(1, Math.round(wc / 220)); }

// ============= DASHBOARD =============

export const getAiFactoryDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;

    const [total, review, approved, scheduled, published, aiRows, allPublished] = await Promise.all([
      s.from("content_items").select("id", { count: "exact", head: true }),
      s.from("content_items").select("id", { count: "exact", head: true }).eq("status", "in_review"),
      s.from("content_items").select("id", { count: "exact", head: true }).eq("status", "approved"),
      s.from("content_items").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
      s.from("content_items").select("id", { count: "exact", head: true }).eq("status", "published"),
      s.from("content_items")
        .select("id, title, type, status, updated_at, metadata, word_count, seo_title, seo_description, focus_topic, category_id, featured_image, body_markdown, reading_time_min")
        .not("metadata", "is", null)
        .order("updated_at", { ascending: false })
        .limit(60),
      s.from("content_items").select("word_count, reading_time_min, seo_title, seo_description, featured_image, focus_topic, category_id, body_markdown").eq("status", "published"),
    ]);

    // Filter AI-generated (metadata.generated_by === "ai_writer")
    const aiOnly = (aiRows.data ?? []).filter((r: any) => r?.metadata?.generated_by === "ai_writer");

    // Scoring
    const scoreItem = (it: any) => {
      const md = String(it.body_markdown ?? "");
      const wc = it.word_count ?? 0;
      const headings = (md.match(/^#{1,3}\s.+$/gm) ?? []).length;
      const links = (md.match(/\[([^\]]+)\]\(([^)]+)\)/g) ?? []);
      const internalLinks = links.filter((l) => !/\]\(https?:/.test(l)).length;
      const images = (md.match(/!\[([^\]]*)\]\(([^)]+)\)/g) ?? []).length;
      const missingAlt = (md.match(/!\[\s*\]\(/g) ?? []).length;
      const seoT = (it.seo_title ?? "").length;
      const seoD = (it.seo_description ?? "").length;
      const readability = wc > 500 && wc < 3200 ? 100 : wc < 500 ? Math.round((wc / 500) * 100) : Math.max(50, 100 - Math.round((wc - 3200) / 40));
      const structure = Math.min(100, headings * 15);
      const seo = (seoT >= 30 && seoT <= 70 ? 50 : 20) + (seoD >= 120 && seoD <= 160 ? 50 : 20);
      const linking = Math.min(100, internalLinks * 25);
      const completeness = (it.featured_image ? 30 : 0) + (it.focus_topic ? 30 : 0) + (it.category_id ? 20 : 0) + (wc >= 500 ? 20 : 0);
      const accessibility = images === 0 ? 80 : Math.max(0, 100 - (missingAlt / Math.max(1, images)) * 100);
      return {
        readability, structure, seo, linking, completeness, accessibility,
        overall: Math.round((readability + structure + seo + linking + completeness + accessibility) / 6),
      };
    };

    const published_rows = allPublished.data ?? [];
    let avgSeo = 0, avgLink = 0, avgReadT = 0, avgOverall = 0;
    let needsImprovement = 0;
    for (const it of published_rows) {
      const sc = scoreItem(it);
      avgSeo += sc.seo;
      avgLink += sc.linking;
      avgReadT += it.reading_time_min ?? 0;
      avgOverall += sc.overall;
      if (sc.overall < 60) needsImprovement += 1;
    }
    const n = Math.max(1, published_rows.length);
    return {
      kpis: {
        aiGenerated: aiOnly.length,
        pendingReview: review.count ?? 0,
        approved: approved.count ?? 0,
        scheduled: scheduled.count ?? 0,
        published: published.count ?? 0,
        needsImprovement,
        seoScore: Math.round(avgSeo / n),
        linkScore: Math.round(avgLink / n),
        avgReadingTimeMin: Math.round(avgReadT / n * 10) / 10,
        qualityScore: Math.round(avgOverall / n),
        totalContent: total.count ?? 0,
      },
      recentAi: aiOnly.slice(0, 8).map((r: any) => ({
        id: r.id, title: r.title, type: r.type, status: r.status, updated_at: r.updated_at, word_count: r.word_count,
      })),
    };
  });

// ============= WIZARD OUTLINE =============

export const generateAiOutline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    type: z.enum(TYPES),
    topic: z.string().min(2).max(240),
    depth: z.enum(DEPTHS).default("standard"),
    audience: z.enum(AUDIENCES).default("intermediate"),
    focusKeywords: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (!isAiAvailable()) throw new Error("AI service not configured");

    // Duplicate check
    const { data: existing } = await context.supabase
      .from("content_items")
      .select("id, title, slug, type, status")
      .eq("type", data.type)
      .ilike("title", `%${data.topic.slice(0, 40)}%`)
      .limit(5);

    const dupWarnings = (existing ?? []).map((e: any) => ({
      id: e.id, title: e.title, slug: e.slug, status: e.status,
    }));

    const target = DEPTH_TARGETS[data.depth];
    const sys = `You are Glintr's senior editorial strategist. Return ONLY valid JSON. Never fabricate statistics, brand names, certifications, partnerships, or quotes. Do not include copyrighted material. Content must always be reviewed by a human — mark uncertain claims with "needs_verification": true.`;
    const usr = `Design a ${data.depth} outline for a ${data.type.replace(/_/g, " ")} on: "${data.topic}"
Audience: ${data.audience}
Target length: ${target.minWords}–${target.maxWords} words, roughly ${target.sections} sections.
${data.focusKeywords?.length ? `Focus keywords: ${data.focusKeywords.join(", ")}` : ""}
${data.notes ? `Editor notes: ${data.notes}` : ""}

Return JSON with:
- title (<= 70 chars, includes topic naturally)
- slug (kebab-case)
- summary (2–3 sentences)
- seo_title (40–65 chars)
- seo_description (130–158 chars)
- focus_topic (string)
- schema_type (one of: Article | DefinedTerm | HowTo | FAQPage | Course)
- outline (array of ${target.sections} sections: { heading, level (2 or 3), summary, points (3–6 short bullets), needs_verification (boolean) })
- faqs (array of 6–10 { question, answer })
- glossary_suggestions (3–8 term names)
- comparison_opportunities (2–4 "X vs Y" strings)
- roadmap_suggestions (2–4 short strings)
- related_program_slugs_or_names (3–6 strings — pick natural fits, don't invent Glintr programs)
- related_blog_topics (3–6 strings)
- visual_suggestions (3–6 { type: "illustration"|"infographic"|"flowchart"|"timeline"|"diagram"|"comparison_table"|"interactive_widget", description })
- external_reference_ideas (2–5 strings — types of authoritative sources, NOT actual URLs)
- content_quality_notes (1–3 short editorial cautions)

Return valid JSON only.`;

    const out = await callLovableAiJson<any>({
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      temperature: 0.5,
    });
    return {
      outline: out,
      duplicates: dupWarnings,
      targets: target,
    };
  });

// ============= WIZARD BODY =============

export const generateAiBody = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    type: z.enum(TYPES),
    topic: z.string().min(2).max(240),
    depth: z.enum(DEPTHS).default("standard"),
    audience: z.enum(AUDIENCES).default("intermediate"),
    outline: z.any(),
    focusKeywords: z.array(z.string()).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (!isAiAvailable()) throw new Error("AI service not configured.");
    const t = DEPTH_TARGETS[data.depth];
    const sys = `You write high-quality, factual educational content for Glintr. NEVER fabricate statistics, quotes, certifications, or partnerships. Do NOT reproduce copyrighted content. Return ONLY JSON.`;
    const usr = `Write the full markdown body for this article.
Type: ${data.type}
Topic: ${data.topic}
Depth: ${data.depth} (${t.minWords}–${t.maxWords} words)
Audience: ${data.audience}
Outline: ${JSON.stringify(data.outline?.outline ?? [])}
Focus keywords (use naturally, no stuffing): ${(data.focusKeywords ?? []).join(", ")}

Rules:
- Use H2/H3 headings from the outline.
- Include at least 2 bulleted lists and 1 comparison table (Markdown table).
- Include at least 3 internal-linkable phrases as [phrase](/glossary/slug) or [phrase](/learn/slug) using plausible kebab-case slugs.
- Add a short "Quick answer" paragraph at the top for AI search.
- Avoid marketing hype. Do not include unverified numbers.
- End with a "What's next" section suggesting 2–3 related resources.

Return JSON:
- body_markdown (string, full article)
- internal_link_map (array of { anchor, path })
- image_alt_texts (array of 2–4 { placement, alt })
- warnings (array of short strings about anything the editor should verify)`;

    const out = await callLovableAiJson<any>({
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      temperature: 0.55,
    });
    return out;
  });

// ============= SAVE AS DRAFT (WIZARD FINISH) =============

export const saveAiDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    type: z.enum(TYPES),
    depth: z.enum(DEPTHS),
    audience: z.enum(AUDIENCES),
    outline: z.any(),
    body_markdown: z.string(),
    warnings: z.array(z.string()).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const o = data.outline?.outline ?? data.outline ?? {};
    const wc = wordCount(data.body_markdown);
    const rt = readingTime(wc);
    const payload: any = {
      type: data.type,
      status: "draft",
      title: o.title ?? "Untitled AI draft",
      slug: slugify(o.slug ?? o.title ?? "untitled"),
      summary: o.summary ?? null,
      body_markdown: data.body_markdown,
      seo_title: o.seo_title ?? null,
      seo_description: o.seo_description ?? null,
      focus_topic: o.focus_topic ?? null,
      schema_type: o.schema_type ?? null,
      related_topics: o.related_blog_topics ?? [],
      outline: o.outline ?? [],
      word_count: wc,
      reading_time_min: rt,
      metadata: {
        generated_by: "ai_writer",
        depth: data.depth,
        audience: data.audience,
        warnings: data.warnings ?? [],
        suggestions: {
          faqs: o.faqs ?? [],
          glossary: o.glossary_suggestions ?? [],
          comparisons: o.comparison_opportunities ?? [],
          roadmaps: o.roadmap_suggestions ?? [],
          programs: o.related_program_slugs_or_names ?? [],
          blogs: o.related_blog_topics ?? [],
          visuals: o.visual_suggestions ?? [],
          references: o.external_reference_ideas ?? [],
          notes: o.content_quality_notes ?? [],
        },
      },
      created_by: context.userId,
      last_edited_by: context.userId,
    };
    const { data: row, error } = await context.supabase.from("content_items").insert(payload).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return { id: (row as any)?.id };
  });

// ============= CONTENT SCORE =============

export const scoreContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: it } = await context.supabase.from("content_items").select("*").eq("id", data.id).maybeSingle();
    if (!it) throw new Error("Not found");

    const md = String((it as any).body_markdown ?? "");
    const wc = (it as any).word_count ?? 0;
    const headings = (md.match(/^#{1,3}\s.+$/gm) ?? []).length;
    const links = md.match(/\[([^\]]+)\]\(([^)]+)\)/g) ?? [];
    const internalLinks = links.filter((l: string) => !/\]\(https?:/.test(l)).length;
    const externalLinks = links.length - internalLinks;
    const images = (md.match(/!\[([^\]]*)\]\(([^)]+)\)/g) ?? []).length;
    const missingAlt = (md.match(/!\[\s*\]\(/g) ?? []).length;
    const seoT = ((it as any).seo_title ?? "").length;
    const seoD = ((it as any).seo_description ?? "").length;

    // Uniqueness: compare to published items with similar focus_topic / type
    const { data: siblings } = await context.supabase
      .from("content_items")
      .select("id, title, focus_topic, body_markdown, summary")
      .eq("type", (it as any).type)
      .eq("status", "published")
      .neq("id", data.id)
      .limit(80);

    const targetWords = new Set(
      md.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 5).slice(0, 400)
    );
    let maxOverlap = 0;
    let mostSimilar: any = null;
    for (const s of (siblings ?? [])) {
      const other = String((s as any).body_markdown ?? "").toLowerCase();
      let hit = 0;
      for (const w of targetWords) if (other.includes(w)) hit += 1;
      const overlap = hit / Math.max(1, targetWords.size);
      if (overlap > maxOverlap) { maxOverlap = overlap; mostSimilar = s; }
    }

    const readability = wc >= 500 && wc <= 3200 ? 100 : wc < 500 ? Math.round((wc / 500) * 100) : Math.max(40, 100 - Math.round((wc - 3200) / 30));
    const structure = Math.min(100, headings * 15);
    const seo = (seoT >= 30 && seoT <= 70 ? 50 : 20) + (seoD >= 120 && seoD <= 160 ? 50 : 20);
    const linking = Math.min(100, internalLinks * 25);
    const completeness = ((it as any).featured_image ? 30 : 0) + ((it as any).focus_topic ? 30 : 0) + ((it as any).category_id ? 20 : 0) + (wc >= 500 ? 20 : 0);
    const accessibility = images === 0 ? 80 : Math.max(0, Math.round(100 - (missingAlt / Math.max(1, images)) * 100));
    const uniqueness = Math.max(0, Math.round((1 - maxOverlap) * 100));
    const overall = Math.round((readability + structure + seo + linking + completeness + accessibility + uniqueness) / 7);

    // Store on the row
    await context.supabase.from("content_items").update({
      metadata: { ...(it as any).metadata, last_score: { readability, structure, seo, linking, completeness, accessibility, uniqueness, overall, computed_at: new Date().toISOString() } },
    }).eq("id", data.id);

    return {
      scores: { readability, structure, seo, linking, completeness, accessibility, uniqueness, overall },
      counts: { wc, headings, internalLinks, externalLinks, images, missingAlt },
      similar: mostSimilar ? { id: mostSimilar.id, title: mostSimilar.title, overlap: Math.round(maxOverlap * 100) } : null,
    };
  });

// ============= TOPIC CLUSTERS =============

const CLUSTER_KEYWORDS: Record<string, string[]> = {
  "Artificial Intelligence": ["ai","chatgpt","gpt","claude","gemini","llm","llms","artificial","intelligence","genai","prompt","embedding","transformer","openai","anthropic"],
  "Programming": ["react","javascript","typescript","python","node","frontend","backend","fullstack","api","framework","code","developer","programming","git","docker"],
  "Engineering": ["vlsi","embedded","chip","semiconductor","electronics","hardware","robotics","mechanical","civil","structural"],
  "Business": ["sales","entrepreneur","startup","business","revenue","partner","monetization","strategy","market","product"],
  "Healthcare": ["medical","coding","healthcare","clinical","nursing","pharma","biotech","health"],
  "Finance": ["finance","financial","model","modeling","valuation","accounting","cfa","investment","banking","stock","equity"],
  "Marketing": ["marketing","seo","brand","content","social","advertising","funnel","conversion","copywriting"],
  "Cloud": ["cloud","aws","azure","gcp","kubernetes","devops","serverless","container"],
  "Cyber Security": ["security","cyber","hacking","penetration","forensics","vulnerability","encryption","firewall"],
};

export const listTopicClusters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data: rows } = await context.supabase
      .from("content_items")
      .select("id, title, slug, type, status, focus_topic, tag_slugs, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);

    const clusters: Record<string, any[]> = {};
    for (const k of Object.keys(CLUSTER_KEYWORDS)) clusters[k] = [];
    clusters["Other"] = [];

    for (const r of (rows ?? [])) {
      const hay = `${(r as any).title} ${(r as any).focus_topic ?? ""} ${((r as any).tag_slugs ?? []).join(" ")}`.toLowerCase();
      let assigned = false;
      for (const [cluster, kw] of Object.entries(CLUSTER_KEYWORDS)) {
        if (kw.some((k) => hay.includes(k))) { clusters[cluster].push(r); assigned = true; break; }
      }
      if (!assigned) clusters["Other"].push(r);
    }

    return Object.entries(clusters).map(([name, items]) => ({ name, count: items.length, items: items.slice(0, 20) }));
  });

// ============= CONTENT CALENDAR =============

export const getContentCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const now = new Date();
    const start = data.start ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = data.end ?? new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    const [scheduled, publishedRecent, overdue] = await Promise.all([
      context.supabase.from("content_items")
        .select("id, title, type, slug, scheduled_for, status")
        .eq("status", "scheduled")
        .gte("scheduled_for", start).lte("scheduled_for", end)
        .order("scheduled_for", { ascending: true }),
      context.supabase.from("content_items")
        .select("id, title, type, slug, published_at, status")
        .eq("status", "published")
        .gte("published_at", start).lte("published_at", end)
        .order("published_at", { ascending: false }),
      context.supabase.from("content_items")
        .select("id, title, type, slug, scheduled_for, status")
        .eq("status", "scheduled")
        .lt("scheduled_for", now.toISOString()),
    ]);

    const today = now.toISOString().slice(0, 10);
    const todaysList = (scheduled.data ?? []).filter((r: any) => (r.scheduled_for ?? "").slice(0, 10) === today);

    return {
      today: todaysList,
      upcoming: scheduled.data ?? [],
      published: publishedRecent.data ?? [],
      missed: overdue.data ?? [],
    };
  });

// ============= CONTENT SUGGESTIONS =============

export const generateContentSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    // Programs that don't have a related program_support / learn_guide
    const [programs, learnGuides, glossary, comparisons] = await Promise.all([
      context.supabase.from("courses").select("id, name, slug").eq("status", "published").limit(100),
      context.supabase.from("content_items").select("title, slug, focus_topic").eq("type", "learn_guide"),
      context.supabase.from("content_items").select("title, slug").eq("type", "glossary"),
      context.supabase.from("content_items").select("title").eq("type", "comparison"),
    ]);

    const learnTopics = new Set((learnGuides.data ?? []).map((r: any) => (r.focus_topic ?? r.title ?? "").toLowerCase()));
    const glossaryTerms = new Set((glossary.data ?? []).map((r: any) => (r.slug ?? "").toLowerCase()));
    const existingComparisons = new Set((comparisons.data ?? []).map((r: any) => (r.title ?? "").toLowerCase()));

    // Missing learn guides for programs
    const missingProgramGuides = (programs.data ?? [])
      .filter((p: any) => !learnTopics.has((p.name ?? "").toLowerCase()))
      .slice(0, 12)
      .map((p: any) => ({
        kind: "learn_guide",
        title: `${p.name} — complete beginner's guide`,
        rationale: `You have a program "${p.name}" but no matching learn guide. This closes the loop from search to enrollment.`,
        source: { program_slug: p.slug, program_id: p.id },
      }));

    // Missing comparisons — pair popular programs
    const compIdeas: any[] = [];
    const list = (programs.data ?? []).slice(0, 20);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const title = `${list[i].name} vs ${list[j].name}`;
        if (!existingComparisons.has(title.toLowerCase()) && compIdeas.length < 8) {
          compIdeas.push({ kind: "comparison", title, rationale: "Comparison articles capture bottom-of-funnel search intent.", source: { a: list[i].slug, b: list[j].slug } });
        }
      }
    }

    // Missing glossary terms based on common technical vocabulary in programs
    const glossaryCandidates = [
      "large language model","transformer","fine-tuning","prompt engineering","embedding","semantic search","retrieval augmented generation","vector database",
      "tokenization","hallucination","few-shot learning","chain of thought","reinforcement learning from human feedback",
      "unit testing","docker container","kubernetes pod","cicd pipeline","load balancer","microservices","monorepo","event driven architecture",
    ].filter((t) => !glossaryTerms.has(t.replace(/\s+/g, "-"))).slice(0, 10).map((t) => ({
      kind: "glossary",
      title: t,
      rationale: "Glossary entries rank quickly and feed AI search citations.",
      source: {},
    }));

    // Trending / roadmap suggestions (curated)
    const roadmapIdeas = [
      { kind: "roadmap", title: "Become an AI Product Manager in 12 weeks", rationale: "High search volume, low competition on Glintr.", source: {} },
      { kind: "roadmap", title: "Zero to job-ready Full Stack Engineer", rationale: "Evergreen intent. Feeds into engineering programs.", source: {} },
      { kind: "career_guide", title: "How to switch from support to sales", rationale: "Directly aligns to Glintr's 70/50 partner models.", source: {} },
      { kind: "interview_guide", title: "AI interview questions asked at product companies", rationale: "Interview intent converts to program interest.", source: {} },
    ];

    return {
      program_gaps: missingProgramGuides,
      comparisons: compIdeas,
      glossary: glossaryCandidates,
      trending: roadmapIdeas,
    };
  });

// ============= AI REVIEW ACTIONS =============

export const submitAiReviewAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid(),
    action: z.enum(["approve","reject","request_changes"]),
    note: z.string().max(1000).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    // On approve → publish (status='published') so the article becomes visible.
    // On reject → archive. On request_changes → back to draft.
    const nextStatus =
      data.action === "approve" ? "published"
      : data.action === "reject" ? "archived"
      : "draft";
    const now = new Date().toISOString();

    // Fetch item first so we can mirror it into blog_posts for the public site.
    const { data: item, error: fetchErr } = await context.supabase
      .from("content_items")
      .select("id, type, title, slug, summary, body_markdown, seo_title, seo_description, featured_image, focus_topic, reading_time_min, metadata")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!item) throw new Error("Content item not found");

    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      last_edited_by: context.userId,
    };
    if (data.action === "approve") updatePayload.published_at = now;

    const { error: updErr } = await (context.supabase as any)
      .from("content_items")
      .update(updatePayload)
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    let blogPostId: string | null = null;
    let blogSlug: string | null = null;
    // Bridge: mirror approved article to blog_posts so /blog displays it.
    if (data.action === "approve") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const it = item as any;
        const title = String(it.title ?? "Untitled Post");
        const body = String(it.body_markdown ?? "");
        const summary = String(it.summary ?? it.seo_description ?? title).slice(0, 300);
        const baseSlug = slugify(String(it.slug ?? title) || "post") || "post";
        const rt = Number(it.reading_time_min ?? readingTime(wordCount(body))) || 1;
        const keywords: string[] = Array.isArray(it.metadata?.suggestions?.blogs)
          ? it.metadata.suggestions.blogs.filter((k: unknown) => typeof k === "string")
          : [];
        const faqs = Array.isArray(it.metadata?.suggestions?.faqs) ? it.metadata.suggestions.faqs : [];

        const insertRow = (slug: string) => (context.supabase as any)
          .from("blog_posts")
          .insert({
            slug,
            title,
            short_summary: summary,
            content_markdown: body || summary || title,
            seo_title: it.seo_title ?? title,
            seo_description: it.seo_description ?? summary,
            featured_image_url: it.featured_image ?? null,
            keywords,
            faqs,
            status: "published",
            is_published: true,
            published_at: now,
            reading_time_minutes: rt,
          })
          .select("id, slug")
          .maybeSingle();

        let { data: post, error: bErr } = await insertRow(baseSlug);
        if (bErr && /duplicate|unique/i.test(bErr.message)) {
          const suffix = Date.now().toString(36).slice(-4);
          ({ data: post, error: bErr } = await insertRow(`${baseSlug}-${suffix}`));
        }
        if (bErr) {
          console.error(`[ai-content.approve] blog_posts insert failed id=${data.id}: ${bErr.message}`);
        } else if (post) {
          blogPostId = post.id;
          blogSlug = post.slug;
          console.log(`[ai-content.approve] published to /blog/${post.slug} (item=${data.id})`);
        }
      } catch (e) {
        console.error(`[ai-content.approve] bridge error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (data.note) {
      await context.supabase.from("content_comments").insert({
        content_id: data.id,
        body: `[${data.action.toUpperCase().replace("_", " ")}] ${data.note}`,
        author_user_id: context.userId,
      });
    }
    return { ok: true, status: nextStatus, blog_post_id: blogPostId, blog_slug: blogSlug };
  });

// ============= REVIEW QUEUE =============

export const getAiReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data: rows } = await context.supabase
      .from("content_items")
      .select("id, title, slug, type, status, updated_at, word_count, metadata, seo_title, seo_description")
      .in("status", ["in_review","approved"])
      .order("updated_at", { ascending: false })
      .limit(80);
    return rows ?? [];
  });
