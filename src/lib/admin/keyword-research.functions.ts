import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callLovableAiJson, isAiAvailable } from "@/lib/ai-gateway.server";

const SUBJECT_TYPES = [
  "course", "internship", "technology", "programming_language",
  "career", "skill", "college", "university", "job_role",
  "city", "state", "country",
] as const;

const KEYWORD_CATEGORIES = [
  "primary", "secondary", "long_tail", "question",
  "transactional", "commercial", "informational",
  "comparison", "trending",
] as const;

type Category = typeof KEYWORD_CATEGORIES[number];

async function ensureAccess(context: any, projectId?: string) {
  if (!projectId) return { isAdmin: true };
  const { data: adminOk } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (adminOk) return { isAdmin: true };
  const { data: proj } = await context.supabase
    .from("keyword_research_projects").select("id, owner_id").eq("id", projectId).maybeSingle();
  if (!proj) throw new Error("Project not found");
  if (proj.owner_id !== context.userId) throw new Error("Forbidden");
  return { isAdmin: false };
}

// ============= LIST / CREATE / DELETE PROJECTS =============

export const listKeywordProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("keyword_research_projects")
      .select("id, name, subject_type, seed_query, location, status, updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const createKeywordProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    name: z.string().min(2).max(120),
    subject_type: z.enum(SUBJECT_TYPES),
    seed_query: z.string().min(2).max(200),
    location: z.string().max(80).optional(),
    language: z.string().max(10).optional().default("en"),
    notes: z.string().max(500).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("keyword_research_projects")
      .insert({
        owner_id: context.userId,
        name: data.name,
        subject_type: data.subject_type,
        seed_query: data.seed_query,
        location: data.location ?? null,
        language: data.language ?? "en",
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const deleteKeywordProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.id);
    const { error } = await context.supabase.from("keyword_research_projects").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============= GET PROJECT + KEYWORDS + PLAN =============

export const getKeywordProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.id);
    const [projRes, kwRes, planRes] = await Promise.all([
      context.supabase.from("keyword_research_projects").select("*").eq("id", data.id).single(),
      context.supabase.from("keyword_research_keywords").select("*").eq("project_id", data.id).order("priority", { ascending: false }),
      context.supabase.from("keyword_content_plan").select("*").eq("project_id", data.id).order("month", { ascending: true }),
    ]);
    if (projRes.error) throw projRes.error;
    return {
      project: projRes.data,
      keywords: kwRes.data ?? [],
      plan: planRes.data ?? [],
    };
  });

// ============= AI KEYWORD DISCOVERY =============

function buildDiscoveryPrompt(p: {
  name: string; subject_type: string; seed_query: string; location?: string | null; language?: string | null;
}) {
  return [
    `You are an elite SEO strategist for an EdTech platform (Glintr).`,
    `Generate a comprehensive keyword research pack for:`,
    `- Subject type: ${p.subject_type}`,
    `- Seed query: "${p.seed_query}"`,
    `- Target location: ${p.location || "Global (India-primary)"}`,
    `- Language: ${p.language || "en"}`,
    ``,
    `Return STRICT JSON with this exact shape:`,
    `{`,
    `  "summary": { "opportunity": string, "audience": string, "positioning": string },`,
    `  "keywords": [`,
    `    {`,
    `      "keyword": string,`,
    `      "category": "primary"|"secondary"|"long_tail"|"question"|"transactional"|"commercial"|"informational"|"comparison"|"trending",`,
    `      "intent": "informational"|"navigational"|"transactional"|"commercial",`,
    `      "cluster": string,`,
    `      "monthly_volume": number,`,
    `      "competition": "low"|"medium"|"high",`,
    `      "difficulty": number,`,
    `      "cpc": number,`,
    `      "seasonality": "steady"|"spring"|"summer"|"fall"|"winter"|"exam_season"|"hiring_season",`,
    `      "estimated_traffic": number,`,
    `      "business_value": number,`,
    `      "conversion_score": number,`,
    `      "priority": number,`,
    `      "suggested_content_type": "pillar"|"blog"|"faq"|"landing"|"comparison"|"career_guide"|"course_page"|"internship_page"`,
    `    }`,
    `  ]`,
    ``,
    `Rules:`,
    `- Generate AT LEAST 40 keywords balanced across ALL 9 categories.`,
    `- monthly_volume, difficulty (0-100), cpc, estimated_traffic, business_value (0-100), conversion_score (0-100), priority (0-100) must be realistic numeric estimates.`,
    `- Cluster keywords into 4-8 topical clusters.`,
    `- Prefer high-intent, India-relevant queries for career/course subjects.`,
    `- Return ONLY the JSON object, no prose.`,
  ].join("\n");
}

type DiscoveryResponse = {
  summary: { opportunity: string; audience: string; positioning: string };
  keywords: Array<{
    keyword: string; category: Category; intent: string; cluster: string;
    monthly_volume: number; competition: string; difficulty: number; cpc: number;
    seasonality: string; estimated_traffic: number; business_value: number;
    conversion_score: number; priority: number; suggested_content_type: string;
  }>;
};

export const discoverKeywords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ project_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.project_id);
    if (!isAiAvailable()) throw new Error("AI service not configured");

    const { data: proj, error: pErr } = await context.supabase
      .from("keyword_research_projects").select("*").eq("id", data.project_id).single();
    if (pErr || !proj) throw new Error("Project not found");

    const prompt = buildDiscoveryPrompt(proj);
    const ai = await callLovableAiJson<DiscoveryResponse>({
      messages: [
        { role: "system", content: "You are a rigorous SEO strategist. Always return valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      bypassCache: true,
    });

    // Wipe old keywords for a fresh discovery
    await context.supabase.from("keyword_research_keywords").delete().eq("project_id", data.project_id);

    const rows = (ai.keywords || []).slice(0, 120).map((k) => ({
      project_id: data.project_id,
      keyword: String(k.keyword).slice(0, 200),
      category: KEYWORD_CATEGORIES.includes(k.category as Category) ? k.category : "informational",
      intent: k.intent ?? null,
      cluster: k.cluster ?? null,
      monthly_volume: Math.max(0, Math.round(Number(k.monthly_volume) || 0)),
      competition: k.competition ?? null,
      difficulty: Math.max(0, Math.min(100, Math.round(Number(k.difficulty) || 0))),
      cpc: Number(k.cpc) || 0,
      seasonality: k.seasonality ?? null,
      estimated_traffic: Math.max(0, Math.round(Number(k.estimated_traffic) || 0)),
      business_value: Math.max(0, Math.min(100, Math.round(Number(k.business_value) || 0))),
      conversion_score: Math.max(0, Math.min(100, Math.round(Number(k.conversion_score) || 0))),
      priority: Math.max(0, Math.min(100, Math.round(Number(k.priority) || 0))),
      suggested_content_type: k.suggested_content_type ?? null,
    }));

    if (rows.length) {
      const { error: iErr } = await context.supabase.from("keyword_research_keywords").insert(rows);
      if (iErr) throw iErr;
    }

    await context.supabase.from("keyword_research_projects")
      .update({ summary: ai.summary ?? null, updated_at: new Date().toISOString() })
      .eq("id", data.project_id);

    return { keywords_generated: rows.length, summary: ai.summary ?? null };
  });

// ============= AI CONTENT CALENDAR =============

export const generateContentCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ project_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.project_id);
    if (!isAiAvailable()) throw new Error("AI service not configured");

    const [{ data: proj }, { data: kws }] = await Promise.all([
      context.supabase.from("keyword_research_projects").select("*").eq("id", data.project_id).single(),
      context.supabase.from("keyword_research_keywords").select("keyword, category, cluster, priority, business_value, suggested_content_type").eq("project_id", data.project_id).order("priority", { ascending: false }).limit(60),
    ]);
    if (!proj) throw new Error("Project not found");
    if (!kws?.length) throw new Error("Discover keywords first");

    const prompt = [
      `Build a 12-month editorial calendar for the SEO project "${proj.name}" (subject: ${proj.subject_type}, seed: "${proj.seed_query}").`,
      `Use these prioritised keywords:`,
      JSON.stringify(kws, null, 2),
      ``,
      `Return STRICT JSON:`,
      `{ "calendar": [ { "month": 1-12, "title": string, "content_type": "blog"|"pillar"|"landing"|"course_update"|"news"|"industry_report"|"career_guide"|"faq"|"comparison", "target_keyword": string, "supporting_keywords": string[], "cluster": string, "priority": 0-100, "business_value": 0-100, "internal_links": [ { "to_type": "blog"|"course"|"internship"|"landing"|"tool", "anchor": string } ] } ] }`,
      ``,
      `Rules: produce 24-36 items spread evenly across months. Cover pillar pages, supporting blogs, FAQs, landing pages, comparisons, career guides, course/internship pages. Return ONLY JSON.`,
    ].join("\n");

    const ai = await callLovableAiJson<{ calendar: any[] }>({
      messages: [
        { role: "system", content: "You are an editorial planning AI. Always return valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      bypassCache: true,
    });

    await context.supabase.from("keyword_content_plan").delete().eq("project_id", data.project_id);

    const items = (ai.calendar || []).slice(0, 60).map((c) => ({
      project_id: data.project_id,
      month: Math.max(1, Math.min(12, Math.round(Number(c.month) || 1))),
      title: String(c.title || "Untitled").slice(0, 200),
      content_type: c.content_type || "blog",
      target_keyword: c.target_keyword ?? null,
      supporting_keywords: Array.isArray(c.supporting_keywords) ? c.supporting_keywords.slice(0, 12) : [],
      cluster: c.cluster ?? null,
      priority: Math.max(0, Math.min(100, Math.round(Number(c.priority) || 0))),
      business_value: Math.max(0, Math.min(100, Math.round(Number(c.business_value) || 0))),
      internal_links: c.internal_links ?? [],
    }));

    if (items.length) {
      const { error } = await context.supabase.from("keyword_content_plan").insert(items);
      if (error) throw error;
    }

    return { items_generated: items.length };
  });

// ============= SEO OPPORTUNITY REPORT =============

export const generateOpportunityReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ project_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.project_id);
    const [{ data: proj }, { data: kws }, { data: plan }] = await Promise.all([
      context.supabase.from("keyword_research_projects").select("*").eq("id", data.project_id).single(),
      context.supabase.from("keyword_research_keywords").select("*").eq("project_id", data.project_id),
      context.supabase.from("keyword_content_plan").select("*").eq("project_id", data.project_id),
    ]);
    if (!proj) throw new Error("Project not found");

    const kwList = kws ?? [];
    const totalVolume = kwList.reduce((s, k) => s + (k.monthly_volume || 0), 0);
    const totalTraffic = kwList.reduce((s, k) => s + (k.estimated_traffic || 0), 0);
    const avgDifficulty = kwList.length ? Math.round(kwList.reduce((s, k) => s + (k.difficulty || 0), 0) / kwList.length) : 0;

    const byCategory: Record<string, number> = {};
    const byCluster: Record<string, number> = {};
    kwList.forEach((k) => {
      byCategory[k.category] = (byCategory[k.category] || 0) + 1;
      if (k.cluster) byCluster[k.cluster] = (byCluster[k.cluster] || 0) + 1;
    });

    const topOpportunities = [...kwList]
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 15)
      .map((k) => ({
        keyword: k.keyword, category: k.category, volume: k.monthly_volume,
        difficulty: k.difficulty, priority: k.priority, business_value: k.business_value,
        intent: k.intent, cluster: k.cluster,
      }));

    const quickWins = [...kwList]
      .filter((k) => (k.difficulty || 100) < 40 && (k.monthly_volume || 0) > 100)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 10)
      .map((k) => ({ keyword: k.keyword, volume: k.monthly_volume, difficulty: k.difficulty }));

    return {
      project: proj,
      totals: {
        keywords: kwList.length,
        total_monthly_volume: totalVolume,
        estimated_monthly_traffic: totalTraffic,
        average_difficulty: avgDifficulty,
        content_planned: plan?.length ?? 0,
      },
      distribution: { by_category: byCategory, by_cluster: byCluster },
      top_opportunities: topOpportunities,
      quick_wins: quickWins,
      summary: (proj as any).summary ?? null,
      generated_at: new Date().toISOString(),
    };
  });

// ============= INTERNAL LINK SUGGESTIONS =============

export const suggestInternalLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ project_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.project_id);
    if (!isAiAvailable()) throw new Error("AI service not configured");

    const [{ data: proj }, { data: plan }] = await Promise.all([
      context.supabase.from("keyword_research_projects").select("name, subject_type, seed_query").eq("id", data.project_id).single(),
      context.supabase.from("keyword_content_plan").select("title, content_type, cluster, target_keyword").eq("project_id", data.project_id),
    ]);
    if (!proj) throw new Error("Project not found");
    if (!plan?.length) throw new Error("Generate the calendar first");

    const prompt = [
      `Suggest a graph of internal links between these planned pages for "${proj.name}":`,
      JSON.stringify(plan, null, 2),
      ``,
      `Return STRICT JSON:`,
      `{ "links": [ { "from": string (title), "to": string (title), "anchor": string, "reason": string } ] }`,
      `Generate 15-30 high-value links. Prefer hub-and-spoke (pillar -> supporting) and cross-cluster bridges. JSON only.`,
    ].join("\n");

    const ai = await callLovableAiJson<{ links: any[] }>({
      messages: [
        { role: "system", content: "You are an internal linking strategist. Return JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });
    return { links: (ai.links || []).slice(0, 60) };
  });
