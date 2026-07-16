/**
 * CMS-driven course platform — server functions.
 *
 * Two responsibilities:
 *   1. Hydrate a course record with every related CMS entity into a single DTO
 *      that the public Program Detail template can consume.
 *   2. Provide AI generation endpoints (overview, curriculum, projects, FAQs,
 *      SEO, career data, etc.) that populate the course record + related
 *      tables. Each is idempotent and audited via `course_ai_generations`.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CourseCmsPayload {
  course: Record<string, any> | null;
  modules: Array<Record<string, any>>;
  lessons: Array<Record<string, any>>;
  projects: Array<Record<string, any>>;
  tools: Array<Record<string, any>>;
  skills: Array<Record<string, any>>;
  faqs: Array<Record<string, any>>;
  topics: Array<Record<string, any>>;
  hiring_partners: Array<Record<string, any>>;
  learning_path_stages: Array<Record<string, any>>;
  salary_stages: Array<Record<string, any>>;
  career_roles: Array<Record<string, any>>;
  certifications: Array<Record<string, any>>;
  related: Array<Record<string, any>>;
  category: Record<string, any> | null;
}

/**
 * Hydrate a course by (category slug, course slug). Returns null when the
 * course does not exist. Called by the public route loader (via the resolver)
 * and by the admin CMS editor.
 */
export const getCourseCmsBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const value = input as { category?: string; slug?: string };
    if (!value?.category || !value?.slug) throw new Error("category and slug required");
    return { category: String(value.category), slug: String(value.slug) };
  })
  .handler(async ({ data }): Promise<CourseCmsPayload | null> => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: category } = await supabase
      .from("course_categories")
      .select("*")
      .eq("slug", data.category)
      .maybeSingle();
    if (!category) return null;

    const { data: course } = await supabase
      .from("courses")
      .select("*")
      .eq("slug", data.slug)
      .eq("category_id", (category as { id: string }).id)
      .maybeSingle();
    if (!course) return null;

    const courseId = (course as { id: string }).id;
    const [
      modules, lessons, projects, tools, skills, faqs, topics,
      hiring_partners, learning_path_stages, salary_stages,
      career_roles, certifications, related,
    ] = await Promise.all([
      supabase.from("course_modules").select("*").eq("course_id", courseId).order("display_order", { ascending: true }),
      supabase.from("course_lessons").select("*").eq("course_id", courseId).order("display_order", { ascending: true }),
      supabase.from("course_projects").select("*").eq("course_id", courseId).order("display_order", { ascending: true }),
      supabase.from("course_tools").select("*, tool:tools(*)").eq("course_id", courseId),
      supabase.from("course_skills").select("*, skill:skills(*)").eq("course_id", courseId),
      supabase.from("course_faqs").select("*").eq("course_id", courseId).order("display_order", { ascending: true }),
      supabase.from("course_topics").select("*").eq("course_id", courseId).order("display_order", { ascending: true }),
      supabase.from("course_hiring_partners").select("*").eq("course_id", courseId).order("sort_order", { ascending: true }),
      supabase.from("course_learning_path_stages").select("*").eq("course_id", courseId).order("position", { ascending: true }),
      supabase.from("course_salary_stages").select("*").eq("course_id", courseId).order("position", { ascending: true }),
      supabase.from("course_career_roles").select("*, role:career_roles(*)").eq("course_id", courseId),
      supabase.from("course_certifications").select("*").eq("course_id", courseId).order("display_order", { ascending: true }),
      supabase.from("course_related").select("*").eq("course_id", courseId),
    ]);

    return {
      course: course as Record<string, any>,
      modules: (modules.data ?? []) as Array<Record<string, any>>,
      lessons: (lessons.data ?? []) as Array<Record<string, any>>,
      projects: (projects.data ?? []) as Array<Record<string, any>>,
      tools: (tools.data ?? []) as Array<Record<string, any>>,
      skills: (skills.data ?? []) as Array<Record<string, any>>,
      faqs: (faqs.data ?? []) as Array<Record<string, any>>,
      topics: (topics.data ?? []) as Array<Record<string, any>>,
      hiring_partners: (hiring_partners.data ?? []) as Array<Record<string, any>>,
      learning_path_stages: (learning_path_stages.data ?? []) as Array<Record<string, any>>,
      salary_stages: (salary_stages.data ?? []) as Array<Record<string, any>>,
      career_roles: (career_roles.data ?? []) as Array<Record<string, any>>,
      certifications: (certifications.data ?? []) as Array<Record<string, any>>,
      related: (related.data ?? []) as Array<Record<string, any>>,
      category: category as Record<string, any>,
    };
  });

// ────────────────────────────────────────────────────────────────────────────
// AI generation
// ────────────────────────────────────────────────────────────────────────────

type GenKind =
  | "overview"
  | "curriculum"
  | "learning_outcomes"
  | "skills"
  | "projects"
  | "career_data"
  | "tools"
  | "faqs"
  | "seo"
  | "blog_suggestions";

async function callGateway(prompt: string, systemPrompt?: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash",
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI Gateway ${res.status}: ${await res.text().catch(() => "")}`);
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "{}";
}

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    // Strip common fencing patterns Gemini emits.
    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

const KIND_PROMPTS: Record<GenKind, (ctx: { name: string; category: string; description?: string }) => string> = {
  overview: (c) => `Write JSON with keys hero_title, hero_subtitle, short_description (≤160 chars), full_description (200-350 words), highlights (array of 6 strings), who_should_join (array of 5 audience strings), prerequisites (array of 4-6 strings). Course: "${c.name}" (${c.category}).`,
  curriculum: (c) => `Design a curriculum for "${c.name}" (${c.category}). JSON: { modules: [{ title, description, duration_hours, lessons: [{ title, summary, duration_minutes }] }] }. 6-10 modules, 3-6 lessons each.`,
  learning_outcomes: (c) => `List 8 concrete learning outcomes as JSON { outcomes: string[] } for "${c.name}" (${c.category}). Each starts with an action verb.`,
  skills: (c) => `List 10-14 skills a learner gains from "${c.name}" (${c.category}). JSON { skills: [{ name, category }] }.`,
  projects: (c) => `Propose 6 portfolio projects for "${c.name}" (${c.category}). JSON { projects: [{ title, description, difficulty, tools: string[], deliverables: string[] }] }.`,
  career_data: (c) => `For "${c.name}" (${c.category}) provide JSON { roles: [{ title, description }], salary_stages: [{ stage, range_label, low, high, note }], learning_path: [{ stage, note }], hiring_partners: [{ company_name }] }. 5 roles, 4 salary stages (entry/mid/senior/lead), 5 path stages, 12 partner names. INR figures in absolute rupees.`,
  tools: (c) => `List 8-12 tools taught in "${c.name}" (${c.category}). JSON { tools: [{ name, description }] }.`,
  faqs: (c) => `Write 10 category-unique FAQs for "${c.name}" (${c.category}). JSON { faqs: [{ question, answer }] }. Answers 2-4 sentences.`,
  seo: (c) => `Generate SEO for "${c.name}" (${c.category}). JSON { seo_title (≤60), seo_description (≤160), keywords: string[10-15] }.`,
  blog_suggestions: (c) => `Suggest 6 blog article ideas for "${c.name}" (${c.category}). JSON { articles: [{ title, slug, angle, target_keyword }] }.`,
};

async function recordGeneration(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  courseId: string,
  kind: GenKind,
  status: "success" | "error",
  output: unknown,
  errorMsg?: string,
) {
  await supabase.from("course_ai_generations").insert({
    course_id: courseId,
    kind,
    output: output as never,
    model: "google/gemini-3.1-flash",
    status,
    error_message: errorMsg ?? null,
  });
}

async function assertAdmin(context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

/** Run a single AI generation for a course. Persists to DB + audit log. */
export const generateCourseSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = input as { courseId?: string; kind?: GenKind };
    if (!v?.courseId || !v?.kind) throw new Error("courseId and kind required");
    return { courseId: String(v.courseId), kind: v.kind };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: course, error } = await context.supabase
      .from("courses")
      .select("id, name, short_description, category:course_categories(name, slug)")
      .eq("id", data.courseId)
      .single();
    if (error || !course) throw new Error("Course not found");

    const c = course as unknown as { id: string; name: string; short_description: string | null; category: { name: string } | null };
    const ctx = { name: c.name, category: c.category?.name ?? "General", description: c.short_description ?? undefined };

    try {
      const raw = await callGateway(KIND_PROMPTS[data.kind](ctx), "You output strictly valid JSON. No commentary. No markdown fences.");
      const parsed = safeParseJson<Record<string, any>>(raw, {});
      await applyGenerationToCourse(context.supabase, data.courseId, data.kind, parsed);
      await recordGeneration(context.supabase, data.courseId, data.kind, "success", parsed);
      return { ok: true as const, kind: data.kind, output: parsed };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await recordGeneration(context.supabase, data.courseId, data.kind, "error", null, msg);
      throw err;
    }
  });

async function applyGenerationToCourse(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  courseId: string,
  kind: GenKind,
  output: Record<string, any>,
) {
  switch (kind) {
    case "overview": {
      await supabase.from("courses").update({
        short_description: output.short_description ?? undefined,
        full_description: output.full_description ?? undefined,
        highlights: output.highlights ?? [],
        who_should_join: output.who_should_join ?? [],
        learning_outcomes: output.learning_outcomes ?? undefined,
      }).eq("id", courseId);
      break;
    }
    case "learning_outcomes": {
      await supabase.from("courses").update({ learning_outcomes: output.outcomes ?? [] }).eq("id", courseId);
      break;
    }
    case "faqs": {
      const faqs = (output.faqs as Array<{ question: string; answer: string }> | undefined) ?? [];
      if (faqs.length) {
        await supabase.from("course_faqs").delete().eq("course_id", courseId);
        await supabase.from("course_faqs").insert(faqs.map((f, i) => ({
          course_id: courseId, question: f.question, answer: f.answer, display_order: i,
        })));
      }
      break;
    }
    case "career_data": {
      const partners = (output.hiring_partners as Array<{ company_name: string }> | undefined) ?? [];
      const salary = (output.salary_stages as Array<{ stage: string; range_label?: string; low?: number; high?: number; note?: string }> | undefined) ?? [];
      const path = (output.learning_path as Array<{ stage: string; note?: string }> | undefined) ?? [];
      if (partners.length) {
        await supabase.from("course_hiring_partners").delete().eq("course_id", courseId);
        await supabase.from("course_hiring_partners").insert(partners.map((p, i) => ({
          course_id: courseId, company_name: p.company_name, sort_order: i,
        })));
      }
      if (salary.length) {
        await supabase.from("course_salary_stages").delete().eq("course_id", courseId);
        await supabase.from("course_salary_stages").insert(salary.map((s, i) => ({
          course_id: courseId, stage: s.stage, range_label: s.range_label ?? null,
          low: s.low ?? null, high: s.high ?? null, note: s.note ?? null, position: i,
        })));
      }
      if (path.length) {
        await supabase.from("course_learning_path_stages").delete().eq("course_id", courseId);
        await supabase.from("course_learning_path_stages").insert(path.map((s, i) => ({
          course_id: courseId, stage: s.stage, note: s.note ?? null, position: i,
        })));
      }
      break;
    }
    case "seo": {
      await supabase.from("courses").update({
        seo_title: output.seo_title ?? undefined,
        seo_description: output.seo_description ?? undefined,
        seo_keywords: output.keywords ?? undefined,
      }).eq("id", courseId);
      break;
    }
    case "curriculum":
    case "projects":
    case "tools":
    case "skills":
    case "blog_suggestions":
      // These write to their own tables via separate insert routines (existing admin
      // workflow). For now, the raw JSON lives in the audit log for review.
      break;
  }

  await supabase.from("courses").update({
    ai_generated_at: new Date().toISOString(),
    ai_generation_status: "ready_for_review",
  }).eq("id", courseId);
}

/** Run every generation kind in parallel. Best-effort — errors are recorded per section. */
export const generateCourseAll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = input as { courseId?: string };
    if (!v?.courseId) throw new Error("courseId required");
    return { courseId: String(v.courseId) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const kinds: GenKind[] = ["overview", "learning_outcomes", "skills", "faqs", "career_data", "seo"];
    const results = await Promise.allSettled(
      kinds.map((kind) =>
        generateCourseSection({ data: { courseId: data.courseId, kind } as never }),
      ),
    );
    return {
      results: results.map((r, i) => ({
        kind: kinds[i],
        status: r.status,
        error: r.status === "rejected" ? String(r.reason?.message ?? r.reason) : undefined,
      })),
    };
  });

/** List recent AI generation audit rows for a course. */
export const getCourseAiHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = input as { courseId?: string };
    if (!v?.courseId) throw new Error("courseId required");
    return { courseId: String(v.courseId) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows } = await context.supabase
      .from("course_ai_generations")
      .select("id, kind, status, error_message, model, created_at")
      .eq("course_id", data.courseId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { rows: rows ?? [] };
  });
