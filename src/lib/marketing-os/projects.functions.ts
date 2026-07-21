/**
 * AI-first Marketing Projects — orchestrator on top of existing services.
 *
 * Reuses:
 *  - Central AI Router (aiChat)
 *  - Existing mkt_campaigns table
 *  - Existing Brand Kit context (buildBrandSystemPrompt)
 *
 * Persists everything into marketing_projects.result (jsonb). No duplicate tables.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { aiChat } from "@/lib/ai/router.server";
import { buildBrandSystemPrompt } from "@/lib/marketing-os/brand-context.server";

export const PROJECT_STEPS = [
  { key: "understand", label: "Understanding request" },
  { key: "campaign", label: "Creating campaign" },
  { key: "strategy", label: "Generating strategy" },
  { key: "content", label: "Generating content" },
  { key: "posters", label: "Generating posters" },
  { key: "landing", label: "Generating landing page" },
  { key: "forms", label: "Generating forms" },
  { key: "email", label: "Generating email campaign" },
  { key: "calendar", label: "Creating calendar" },
  { key: "workflow", label: "Connecting workflow" },
  { key: "save", label: "Saving project" },
] as const;

export type ProjectStepKey = (typeof PROJECT_STEPS)[number]["key"];

export type MarketingProject = {
  id: string;
  brand_id: string | null;
  campaign_id: string | null;
  created_by: string;
  name: string;
  prompt: string;
  status: string;
  progress: number;
  current_step: string | null;
  steps: Array<{ key: string; label: string; status: string }>;
  result: Record<string, any>;
  error: string | null;
  created_at: string;
  updated_at: string;
};

// ---------------- create ----------------
export const createMarketingProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        prompt: z.string().min(4).max(2000),
        brand_id: z.string().uuid().optional().nullable(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const steps = PROJECT_STEPS.map((s) => ({ ...s, status: "pending" }));
    const sb: any = (context.supabase as any);
    const brandId = await ensureDefaultBrand(sb, context.userId, data.brand_id);
    const { data: created, error } = await sb
      .from("marketing_projects")
      .insert({
        created_by: context.userId,
        brand_id: brandId,
        name: data.prompt.slice(0, 80),
        prompt: data.prompt,
        status: "running",
        progress: 0,
        steps,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { project: created as MarketingProject };
  });

// ---------------- get ----------------
export const getMarketingProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: proj, error } = await (context.supabase as any)
      .from("marketing_projects")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!proj) throw new Error("Project not found");
    return { project: proj as MarketingProject };
  });

// ---------------- list ----------------
export const listMarketingProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("marketing_projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return { projects: (data ?? []) as MarketingProject[] };
  });

// ---------------- duplicate ----------------
export const duplicateMarketingProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: src } = await (context.supabase as any)
      .from("marketing_projects")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!src) throw new Error("Not found");
    const { data: copy, error } = await (context.supabase as any)
      .from("marketing_projects")
      .insert({
        created_by: context.userId,
        brand_id: src.brand_id,
        name: `${src.name} (copy)`,
        prompt: src.prompt,
        status: src.status,
        progress: src.progress,
        steps: src.steps,
        result: src.result,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { project: copy as MarketingProject };
  });

// ---------------- delete ----------------
export const deleteMarketingProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("marketing_projects")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- rename ----------------
export const renameMarketingProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), name: z.string().min(1).max(200) }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("marketing_projects")
      .update({ name: data.name })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- patch project result (approvals, review notes, etc.) ----------------
export const patchProjectResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: z.record(z.any()) }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase as any;
    const { data: proj, error: gErr } = await sb
      .from("marketing_projects")
      .select("result")
      .eq("id", data.id)
      .maybeSingle();
    if (gErr) throw new Error(gErr.message);
    const nextResult = { ...(proj?.result ?? {}), ...data.patch };
    const { error } = await sb
      .from("marketing_projects")
      .update({ result: nextResult })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, result: nextResult };
  });

// ---------------- copilot chat ----------------
type CopilotMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

function summarizeProjectForCopilot(project: any): string {
  const r = project.result ?? {};
  const brief = r.brief ?? {};
  const content = Array.isArray(r.content) ? r.content : [];
  const posters = Array.isArray(r.posters) ? r.posters : [];
  const emails = Array.isArray(r.emails) ? r.emails : [];
  const calendar = Array.isArray(r.calendar) ? r.calendar : [];
  const byPlatform: Record<string, number> = {};
  for (const p of content) {
    const k = String(p?.platform ?? "unknown").toLowerCase();
    byPlatform[k] = (byPlatform[k] ?? 0) + 1;
  }
  return [
    `Project: ${project.name}`,
    `Prompt: ${project.prompt}`,
    `Status: ${project.status}`,
    brief.audience ? `Audience: ${brief.audience}` : "",
    brief.goals ? `Goals: ${Array.isArray(brief.goals) ? brief.goals.join(", ") : brief.goals}` : "",
    brief.summary ? `Summary: ${brief.summary}` : "",
    r.campaign?.name ? `Campaign: ${r.campaign.name}` : "",
    `Assets — posts: ${content.length} (${Object.entries(byPlatform).map(([k, v]) => `${k}:${v}`).join(", ") || "none"}), posters: ${posters.length}, emails: ${emails.length}, calendar entries: ${calendar.length}, landing: ${r.landing ? "yes" : "no"}, form: ${r.form ? "yes" : "no"}, workflow: ${r.workflow ? "yes" : "no"}`,
  ].filter(Boolean).join("\n");
}

export const chatWithCopilot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      projectId: z.string().uuid(),
      message: z.string().min(1).max(4000),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { data: project, error } = await supabase
      .from("marketing_projects")
      .select("*")
      .eq("id", data.projectId)
      .single();
    if (error || !project) throw new Error(error?.message ?? "Project not found");

    const result: any = project.result ?? {};
    const history: CopilotMessage[] = Array.isArray(result.copilot_messages)
      ? result.copilot_messages.slice(-16)
      : [];

    const brand = await loadBrandContext(supabase, context.userId);
    const contextSummary = summarizeProjectForCopilot(project);
    const system = [
      brand ?? "",
      "You are Glintr AI Copilot — a dedicated marketing teammate embedded inside a Marketing Project workspace.",
      "You have full context of the project below. Never ask the user for information already present.",
      "Answer with concise markdown. Use lists, tables, and code blocks where helpful.",
      "When the user asks you to create, update, regenerate, or publish assets, describe the plan clearly and end your reply with a line: `ACTION: <step>` where <step> is one of: understand, campaign, strategy, content, posters, landing, forms, email, calendar, workflow. Only include ACTION when a regeneration is truly needed.",
      "",
      "PROJECT CONTEXT:",
      contextSummary,
    ].filter(Boolean).join("\n");

    const userMsg: CopilotMessage = {
      role: "user", content: data.message, createdAt: new Date().toISOString(),
    };

    const reply = (await aiChat({
      system,
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: data.message },
      ],
      temperature: 0.6,
      maxTokens: 900,
    })) as string;

    const replyText = typeof reply === "string" ? reply : JSON.stringify(reply);
    const actionMatch = replyText.match(/ACTION:\s*([a-z_]+)/i);
    const suggestedAction = actionMatch ? actionMatch[1].toLowerCase() : null;
    const cleanText = replyText.replace(/ACTION:\s*[a-z_]+\s*$/i, "").trim();

    const assistantMsg: CopilotMessage = {
      role: "assistant", content: cleanText, createdAt: new Date().toISOString(),
    };

    const nextMessages = [...(result.copilot_messages ?? []), userMsg, assistantMsg].slice(-100);
    await supabase
      .from("marketing_projects")
      .update({ result: { ...result, copilot_messages: nextMessages } })
      .eq("id", data.projectId);

    return { message: assistantMsg, suggestedAction };
  });

export const getCopilotMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ projectId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: p, error } = await (context.supabase as any)
      .from("marketing_projects")
      .select("result")
      .eq("id", data.projectId)
      .single();
    if (error) throw new Error(error.message);
    const msgs = Array.isArray(p?.result?.copilot_messages) ? p.result.copilot_messages : [];
    return { messages: msgs as CopilotMessage[] };
  });

export const clearCopilotMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ projectId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { data: p } = await supabase.from("marketing_projects").select("result").eq("id", data.projectId).single();
    const result = p?.result ?? {};
    delete result.copilot_messages;
    await supabase.from("marketing_projects").update({ result }).eq("id", data.projectId);
    return { ok: true };
  });

// ---------------- run step ----------------
type StepEntry = { key: string; label: string; status: string; error?: string | null; started_at?: string; ended_at?: string };

async function loadBrandContext(
  supabase: any,
  ownerId: string,
  query?: string,
): Promise<string | undefined> {
  try {
    const { buildAiContext } = await import("@/lib/marketing-os/brand-context-engine.server");
    const { systemPrompt } = await buildAiContext(supabase, ownerId, { query });
    if (systemPrompt) return systemPrompt;
    return await buildBrandSystemPrompt(supabase, ownerId);
  } catch {
    return undefined;
  }
}

/**
 * Brand Context Loader — always resolves a valid mkt_brands row the caller
 * owns (or a staff member can access), auto-creating a default brand if the
 * caller has none. Guarantees the "campaign" step never fails on RLS due to
 * a missing/foreign brand_id.
 */
async function ensureDefaultBrand(
  supabase: any,
  userId: string,
  preferredBrandId?: string | null,
): Promise<string> {
  if (preferredBrandId) {
    const { data: existing } = await supabase
      .from("mkt_brands")
      .select("id")
      .eq("id", preferredBrandId)
      .maybeSingle();
    if (existing?.id) return existing.id as string;
  }

  const { data: kit } = await supabase
    .from("mkt_brand_kits")
    .select("id,brand_id,business_name,name,tone_of_voice,colors,logos,updated_at")
    .eq("owner_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (kit?.brand_id) {
    const { data: kitBrand } = await supabase
      .from("mkt_brands")
      .select("id")
      .eq("id", kit.brand_id)
      .maybeSingle();
    if (kitBrand?.id) return kitBrand.id as string;
  }

  const { data: own } = await supabase
    .from("mkt_brands")
    .select("id, updated_at")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (own?.id) return own.id as string;

  // Seed a default brand for this user, reusing any Brand Kit data present.
  let brandName = "My Brand";
  let tone: string | null = null;
  let primaryColor: string | null = null;
  let logoUrl: string | null = null;
  if (kit) {
    brandName = (kit.business_name || kit.name || brandName) as string;
    if (Array.isArray(kit.tone_of_voice) && kit.tone_of_voice.length) {
      tone = String(kit.tone_of_voice[0]);
    }
    const colors = (kit.colors ?? {}) as Record<string, unknown>;
    if (typeof (colors as any)?.primary === "string") primaryColor = (colors as any).primary;
    const logos = (kit.logos ?? {}) as Record<string, unknown>;
    if (typeof (logos as any)?.primary === "string") logoUrl = (logos as any).primary;
  }

  const { data: created, error: bErr } = await supabase
    .from("mkt_brands")
    .insert({
      owner_id: userId,
      name: brandName,
      tone,
      primary_color: primaryColor,
      logo_url: logoUrl,
    })
    .select("id")
    .single();
  if (bErr || !created?.id) {
    throw new Error(
      `Unable to prepare a brand workspace: ${bErr?.message ?? "unknown error"}`,
    );
  }
  if (kit?.id) {
    await supabase
      .from("mkt_brand_kits")
      .update({ brand_id: created.id })
      .eq("id", kit.id)
      .eq("owner_id", userId);
  }
  return created.id as string;
}

async function aiJson(system: string | undefined, user: string): Promise<Record<string, any>> {
  const res = await aiChat({
    system,
    messages: [{ role: "user", content: user }],
    responseFormat: "json",
    temperature: 0.7,
    maxTokens: 1400,
  });
  return (typeof res === "object" ? res : {}) as Record<string, any>;
}

export const runProjectStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        step: z.enum(
          PROJECT_STEPS.map((s) => s.key) as [ProjectStepKey, ...ProjectStepKey[]],
        ),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabase: any = (context.supabase as any);
    const { data: proj, error: pErr } = await supabase
      .from("marketing_projects")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (pErr || !proj) throw new Error(pErr?.message ?? "Project not found");

    const steps: StepEntry[] = Array.isArray(proj.steps) ? [...proj.steps] as StepEntry[] : [];
    const idx = steps.findIndex((s) => s.key === data.step);
    if (idx >= 0) steps[idx] = { ...steps[idx], status: "running", error: null, started_at: new Date().toISOString() };

    const result: Record<string, any> = { ...(proj.result || {}) };
    const brandSystem = await loadBrandContext(supabase, userId);

    try {
      switch (data.step) {
        case "understand": {
          const parsed = await aiJson(
            brandSystem,
            `Extract a marketing brief from this request. Respond as JSON with keys: objective (string), audience (string), platforms (array of one or more of: instagram, linkedin, facebook, x, youtube, email), tone (string), key_message (string), suggested_name (short campaign name).\n\nRequest: ${proj.prompt}`,
          );
          result.brief = parsed;
          break;
        }
        case "campaign": {
          const brief = result.brief || {};
          // Always resolve a valid, RLS-accessible brand before insert.
          const brandId = await ensureDefaultBrand(supabase, userId, proj.brand_id);
          const { data: camp, error: cErr } = await supabase
            .from("mkt_campaigns")
            .insert({
              brand_id: brandId,
              name: brief.suggested_name || proj.name,
              objective: brief.objective ?? null,
              description: proj.prompt,
              target_platforms: Array.isArray(brief.platforms) ? brief.platforms : [],
              status: "planning",
              timeline_stage: "planning",
              created_by: userId,
              owner_id: userId,
            })
            .select()
            .single();
          if (cErr) {
            throw new Error(
              `Campaign creation failed: ${cErr.message}. brand_id=${brandId}`,
            );
          }
          result.campaign = camp;
          await supabase
            .from("marketing_projects")
            .update({ campaign_id: camp.id, brand_id: brandId })
            .eq("id", proj.id);
          break;
        }
        case "strategy": {
          const brief = result.brief || {};
          result.strategy = await aiJson(
            brandSystem,
            `Create a 30-day marketing strategy. Respond as JSON with keys: pillars (array of {name, description}), phases (array of {week, focus, kpis}), channels (array of {platform, cadence, note}). Brief: ${JSON.stringify(brief)}. Request: ${proj.prompt}`,
          );
          break;
        }
        case "content": {
          const brief = result.brief || {};
          const raw = await aiJson(
            brandSystem,
            `Generate 8 social media posts for this campaign. Respond as JSON: { posts: [ { platform, hook, body, cta, hashtags: [] } ] }. Brief: ${JSON.stringify(brief)}. Request: ${proj.prompt}`,
          );
          result.content = Array.isArray(raw.posts) ? raw.posts : [];
          break;
        }
        case "posters": {
          const brief = result.brief || {};
          const raw = await aiJson(
            brandSystem,
            `Generate 6 poster concepts. Respond as JSON: { posters: [ { title, concept, style, dominant_colors: [], layout_note } ] }. Brief: ${JSON.stringify(brief)}.`,
          );
          result.posters = Array.isArray(raw.posters) ? raw.posters : [];
          break;
        }
        case "landing": {
          const brief = result.brief || {};
          result.landing = await aiJson(
            brandSystem,
            `Design a landing page. Respond as JSON: { hero: {headline, sub, cta}, features: [{title,desc}], testimonials: [{quote, name}], faq: [{q,a}], closing_cta }. Brief: ${JSON.stringify(brief)}.`,
          );
          break;
        }
        case "forms": {
          const brief = result.brief || {};
          const raw = await aiJson(
            brandSystem,
            `Design a lead capture form. Respond as JSON: { title, description, fields: [ { name, label, type, required } ], submit_label, thank_you }. Brief: ${JSON.stringify(brief)}.`,
          );
          result.form = raw;
          break;
        }
        case "email": {
          const brief = result.brief || {};
          const raw = await aiJson(
            brandSystem,
            `Generate a 3-email nurture sequence. Respond as JSON: { emails: [ { day, subject, preheader, body, cta } ] }. Brief: ${JSON.stringify(brief)}.`,
          );
          result.emails = Array.isArray(raw.emails) ? raw.emails : [];
          break;
        }
        case "calendar": {
          const posts = Array.isArray(result.content) ? result.content : [];
          const startDate = new Date();
          const entries = posts.map((p: any, i: number) => {
            const d = new Date(startDate);
            d.setDate(d.getDate() + Math.floor((i * 30) / Math.max(1, posts.length)));
            return {
              date: d.toISOString().slice(0, 10),
              platform: p.platform ?? "instagram",
              hook: p.hook ?? "",
              status: "scheduled",
            };
          });
          result.calendar = entries;
          break;
        }
        case "workflow": {
          result.workflow = {
            trigger: "form.submitted",
            nodes: [
              { type: "wait", value: "0m" },
              { type: "send_email", ref: "email_1" },
              { type: "wait", value: "2d" },
              { type: "send_email", ref: "email_2" },
              { type: "wait", value: "3d" },
              { type: "send_email", ref: "email_3" },
              { type: "tag_lead", value: "nurtured" },
            ],
          };
          break;
        }
        case "save": {
          result.saved_at = new Date().toISOString();
          break;
        }
      }

      if (idx >= 0) steps[idx] = { ...steps[idx], status: "done", error: null, ended_at: new Date().toISOString() };
      const done = steps.filter((s) => s.status === "done").length;
      const progress = Math.round((done / steps.length) * 100);
      const isFinal = data.step === "save";
      await supabase
        .from("marketing_projects")
        .update({
          steps,
          result,
          progress,
          current_step: data.step,
          status: isFinal ? "completed" : "running",
          error: null,
        })
        .eq("id", proj.id);
      return { ok: true, progress, step: data.step };
    } catch (e: any) {
      const message = e?.message ?? String(e);
      if (idx >= 0) steps[idx] = { ...steps[idx], status: "error", error: message, ended_at: new Date().toISOString() };
      // Do NOT throw — surface the error so the client can continue remaining
      // steps and show inline retry. Project status stays "running" unless the
      // failure is the final step.
      await supabase
        .from("marketing_projects")
        .update({
          steps,
          status: data.step === "save" ? "error" : "running",
          error: message,
          current_step: data.step,
        })
        .eq("id", proj.id);
      return { ok: false, step: data.step, error: message };
    }
  });
