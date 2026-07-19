/**
 * AI Career Hub — programmatic SEO page generator.
 * 8 page types: roadmap, salary_guide, job_description, interview_questions,
 * resume_tips, career_switch, skill, trending_tech.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLovableAiJson } from "@/lib/ai-gateway.server";
import { z } from "zod";

async function assertAdmin(context: any) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw new Error("Admin access required");
}

const PAGE_TYPES = [
  "roadmap", "salary_guide", "job_description", "interview_questions",
  "resume_tips", "career_switch", "skill", "trending_tech",
] as const;
type PageType = typeof PAGE_TYPES[number];

const TYPE_LABEL: Record<PageType, string> = {
  roadmap: "Career Roadmap",
  salary_guide: "Salary Guide",
  job_description: "Job Description",
  interview_questions: "Interview Questions",
  resume_tips: "Resume Tips",
  career_switch: "Career Switch Guide",
  skill: "Skill Deep-Dive",
  trending_tech: "Trending Technology Guide",
};

const TYPE_PATH: Record<PageType, string> = {
  roadmap: "roadmap",
  salary_guide: "salary",
  job_description: "job",
  interview_questions: "interview",
  resume_tips: "resume",
  career_switch: "switch",
  skill: "skill",
  trending_tech: "trending",
};

function slugify(s: string) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function buildPrompt(pageType: PageType, seed: string) {
  const label = TYPE_LABEL[pageType];
  return `You are an SEO content engineer. Write a comprehensive, factually accurate, India-first "${label}" page for the topic: "${seed}".

Return STRICT JSON only, matching this shape (no extra keys, no prose):
{
  "title": "H1 for the page, under 70 chars",
  "subtitle": "one-line hook",
  "category": "broad category (e.g. Engineering, Data, Design, Marketing, Sales, Product, Cybersecurity, AI/ML, Cloud, Finance)",
  "hero_emoji": "1 emoji",
  "summary": "150-200 words plain-language overview, no lists",
  "content": {
    "sections": [
      {"heading":"H2","body":"markdown paragraphs and bullets, 150-300 words each"}
    ]
  },
  "roadmap": [
    {"stage":"0-3 months","focus":"...","topics":["...","..."],"outcome":"..."},
    {"stage":"3-6 months","focus":"...","topics":["..."],"outcome":"..."},
    {"stage":"6-12 months","focus":"...","topics":["..."],"outcome":"..."},
    {"stage":"12+ months","focus":"...","topics":["..."],"outcome":"..."}
  ],
  "learning_path": [
    {"step":1,"title":"...","resource_type":"course|book|project|video","duration_weeks":4,"notes":"..."}
  ],
  "recommended_courses": [
    {"title":"...","provider":"Glintr|Coursera|Udemy|edX","level":"beginner|intermediate|advanced","url_hint":"/courses"}
  ],
  "projects": [
    {"title":"...","description":"...","skills":["..."],"difficulty":"easy|medium|hard"}
  ],
  "certifications": [
    {"name":"...","issuer":"...","level":"foundation|associate|professional","recommended":true}
  ],
  "faqs": [
    {"q":"...","a":"3-5 sentence answer"}
  ],
  "salary_data": {
    "currency":"INR",
    "fresher_lpa":"3-6",
    "mid_lpa":"8-16",
    "senior_lpa":"18-35",
    "top_cities":["Bengaluru","Hyderabad","Pune","Mumbai","Delhi NCR"],
    "top_companies":["...","..."]
  },
  "keywords": ["primary keyword","secondary","long-tail 1","long-tail 2","related 1","related 2","related 3","related 4"],
  "seo_title":"under 60 chars, include primary keyword",
  "seo_description":"under 155 chars, action-oriented",
  "related_slugs":["kebab-case related topic 1","kebab-case related topic 2","kebab-case related topic 3","kebab-case related topic 4"]
}

Rules:
- Give at least 6 content sections, 8 FAQs, 6 roadmap topics per stage, 5 projects, 5 certifications, 5 recommended courses.
- Salary numbers must reflect India market ranges realistically for the topic.
- All strings are plain text/markdown; do NOT wrap in \`\`\`.
- If the topic is not career-related, still produce the closest career interpretation.`;
}

async function generateOne(pageType: PageType, seed: string) {
  const out = await callLovableAiJson<any>({
    model: "google/gemini-3.5-flash",
    messages: [
      { role: "system", content: "You are an SEO content engine. Return JSON only, no code fences, no commentary." },
      { role: "user", content: buildPrompt(pageType, seed) },
    ],
  });

  const title = String(out.title || seed).slice(0, 140);
  const slug = slugify(seed);
  const seoTitle = String(out.seo_title || title).slice(0, 70);
  const seoDesc = String(out.seo_description || out.summary || "").slice(0, 160);

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": pageType === "interview_questions" ? "FAQPage" : "Article",
    headline: title,
    description: seoDesc,
    author: { "@type": "Organization", name: "Glintr" },
    publisher: { "@type": "Organization", name: "Glintr", logo: { "@type": "ImageObject", url: "https://glintr.com/logo.png" } },
    datePublished: new Date().toISOString(),
  };
  if (Array.isArray(out.faqs) && out.faqs.length) {
    jsonLd.mainEntity = out.faqs.slice(0, 20).map((f: any) => ({
      "@type": "Question", name: String(f.q || "").slice(0, 240),
      acceptedAnswer: { "@type": "Answer", text: String(f.a || "").slice(0, 1200) },
    }));
    if (pageType !== "interview_questions") jsonLd["@type"] = "Article";
  }
  if (out.salary_data && pageType === "salary_guide") {
    jsonLd.occupation = { "@type": "Occupation", name: title, estimatedSalary: { "@type": "MonetaryAmountDistribution", currency: out.salary_data.currency || "INR" } };
  }

  const related = Array.isArray(out.related_slugs) ? out.related_slugs.slice(0, 8).map(slugify).filter(Boolean) : [];
  const internal_links = [
    { label: "Explore Programs", url: "/programs" },
    { label: "Career Roadmaps", url: "/career-hub/roadmap" },
    { label: "Salary Guides", url: "/career-hub/salary" },
    { label: "Interview Questions", url: "/career-hub/interview" },
    { label: "Success Stories", url: "/success-stories" },
    { label: "Read our Blog", url: "/blog" },
  ];

  return {
    page_type: pageType,
    slug,
    title,
    subtitle: out.subtitle || null,
    category: out.category || null,
    hero_emoji: out.hero_emoji || "🎯",
    summary: out.summary || null,
    content: out.content || {},
    faqs: out.faqs || [],
    roadmap: out.roadmap || [],
    learning_path: out.learning_path || [],
    recommended_courses: out.recommended_courses || [],
    projects: out.projects || [],
    certifications: out.certifications || [],
    related_slugs: related,
    internal_links,
    seo_title: seoTitle,
    seo_description: seoDesc,
    seo_keywords: Array.isArray(out.keywords) ? out.keywords.slice(0, 15) : [],
    json_ld: jsonLd,
    published: true,
    ai_model: "google/gemini-3.5-flash",
    ai_generated_at: new Date().toISOString(),
  };
}

// ---------- LIST / GET / UPDATE / DELETE ----------
export const listCareerPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    page_type: z.enum(PAGE_TYPES).optional(),
    search: z.string().optional(),
    published: z.enum(["all", "true", "false"]).default("all"),
    limit: z.number().min(1).max(500).default(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase.from("career_hub_pages")
      .select("id, page_type, slug, title, subtitle, category, hero_emoji, published, featured, view_count, ai_generated_at, updated_at", { count: "exact" })
      .order("updated_at", { ascending: false }).limit(data.limit);
    if (data.page_type) q = q.eq("page_type", data.page_type);
    if (data.published !== "all") q = q.eq("published", data.published === "true");
    if (data.search) q = q.or(`title.ilike.%${data.search}%,slug.ilike.%${data.search}%,category.ilike.%${data.search}%`);
    const { data: rows, count, error } = await q;
    if (error) throw error;
    return { rows: rows || [], total: count || 0 };
  });

export const updateCareerPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    patch: z.record(z.any()),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const allowed = ["title", "subtitle", "summary", "published", "featured", "seo_title", "seo_description", "category", "hero_emoji"];
    const clean: any = {};
    for (const k of allowed) if (k in data.patch) clean[k] = data.patch[k];
    const { data: row, error } = await context.supabase.from("career_hub_pages").update(clean).eq("id", data.id).select("id, published, featured, title").single();
    if (error) throw error;
    return row;
  });

export const deleteCareerPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("career_hub_pages").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- SINGLE + BULK GENERATE ----------
export const generateCareerPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    page_type: z.enum(PAGE_TYPES),
    seed: z.string().min(2).max(160),
    overwrite: z.boolean().default(false),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = await generateOne(data.page_type, data.seed);
    const { data: existing } = await context.supabase.from("career_hub_pages")
      .select("id").eq("page_type", data.page_type).eq("slug", row.slug).maybeSingle();
    if (existing && !data.overwrite) throw new Error("Page with this slug already exists");
    if (existing) {
      const { data: updated, error } = await context.supabase.from("career_hub_pages").update(row).eq("id", existing.id).select("id, slug, title").single();
      if (error) throw error;
      return { id: updated.id, slug: updated.slug, title: updated.title, url: `/career-hub/${TYPE_PATH[data.page_type]}/${updated.slug}` };
    }
    const { data: inserted, error } = await context.supabase.from("career_hub_pages")
      .insert({ ...row, created_by: context.userId })
      .select("id, slug, title").single();
    if (error) throw error;
    return { id: inserted.id, slug: inserted.slug, title: inserted.title, url: `/career-hub/${TYPE_PATH[data.page_type]}/${inserted.slug}` };
  });

export const bulkGenerateCareerPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    page_type: z.enum(PAGE_TYPES),
    seeds: z.array(z.string().min(2).max(160)).min(1).max(50),
    overwrite: z.boolean().default(false),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: job, error: jErr } = await context.supabase.from("career_hub_generation_jobs")
      .insert({
        page_type: data.page_type, seeds: data.seeds, status: "running",
        total: data.seeds.length, created_by: context.userId,
      }).select("id").single();
    if (jErr) throw jErr;

    const results: any[] = [];
    const errors: any[] = [];
    let succ = 0, fail = 0;

    for (const seed of data.seeds) {
      try {
        const row = await generateOne(data.page_type, seed);
        const { data: existing } = await context.supabase.from("career_hub_pages")
          .select("id").eq("page_type", data.page_type).eq("slug", row.slug).maybeSingle();
        if (existing && !data.overwrite) {
          errors.push({ seed, error: "duplicate slug" }); fail++;
        } else if (existing) {
          await context.supabase.from("career_hub_pages").update(row).eq("id", existing.id);
          results.push({ seed, slug: row.slug, action: "updated" }); succ++;
        } else {
          const { error } = await context.supabase.from("career_hub_pages")
            .insert({ ...row, created_by: context.userId });
          if (error) { errors.push({ seed, error: error.message }); fail++; }
          else { results.push({ seed, slug: row.slug, action: "created" }); succ++; }
        }
      } catch (e: any) {
        errors.push({ seed, error: e.message || String(e) });
        fail++;
      }
      await context.supabase.from("career_hub_generation_jobs").update({
        processed: succ + fail, succeeded: succ, failed: fail,
      }).eq("id", job.id);
    }

    await context.supabase.from("career_hub_generation_jobs").update({
      status: fail === 0 ? "completed" : succ === 0 ? "failed" : "partial",
      processed: data.seeds.length, succeeded: succ, failed: fail,
      errors, results,
    }).eq("id", job.id);

    return { job_id: job.id, succeeded: succ, failed: fail, results, errors };
  });

// ---------- PUBLIC READ FUNCTIONS ----------
function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const url = process.env.SUPABASE_URL!;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: any, init: any) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPublicCareerPage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    page_type: z.enum(PAGE_TYPES),
    slug: z.string().min(1).max(120),
  }).parse(d))
  .handler(async ({ data }) => {
    const supa = publicClient();
    const { data: page } = await supa.from("career_hub_pages")
      .select("*").eq("page_type", data.page_type).eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!page) return { page: null, related: [] };
    // fire-and-forget view increment
    supa.from("career_hub_pages").update({ view_count: (page.view_count || 0) + 1 }).eq("id", page.id).then(() => {});
    const { data: related } = await supa.from("career_hub_pages")
      .select("page_type, slug, title, subtitle, hero_emoji, category")
      .eq("page_type", data.page_type).eq("published", true).neq("id", page.id).limit(6);
    return { page, related: related || [] };
  });

export const listPublicCareerPages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    page_type: z.enum(PAGE_TYPES).optional(),
    limit: z.number().min(1).max(200).default(48),
  }).parse(d))
  .handler(async ({ data }) => {
    const supa = publicClient();
    let q = supa.from("career_hub_pages")
      .select("page_type, slug, title, subtitle, hero_emoji, category, updated_at")
      .eq("published", true).order("featured", { ascending: false }).order("updated_at", { ascending: false }).limit(data.limit);
    if (data.page_type) q = q.eq("page_type", data.page_type);
    const { data: rows } = await q;
    return { pages: rows || [] };
  });

export const listCareerSitemapUrls = createServerFn({ method: "GET" })
  .handler(async () => {
    const supa = publicClient();
    const { data } = await supa.from("career_hub_pages")
      .select("page_type, slug, updated_at").eq("published", true).limit(5000);
    return (data || []).map((r: any) => ({
      path: `/career-hub/${TYPE_PATH[r.page_type as PageType]}/${r.slug}`,
      lastmod: r.updated_at,
    }));
  });

export const CAREER_PAGE_TYPES = PAGE_TYPES;
export const CAREER_TYPE_PATH = TYPE_PATH;
export const CAREER_TYPE_LABEL = TYPE_LABEL;
