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
    const sb: any = context.supabase;
    const { data: created, error } = await sb
      .from("marketing_projects")
      .insert({
        created_by: context.userId,
        brand_id: data.brand_id ?? null,
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
    const { data: proj, error } = await context.supabase
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
    const { data, error } = await context.supabase
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
    const { data: src } = await context.supabase
      .from("marketing_projects")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!src) throw new Error("Not found");
    const { data: copy, error } = await context.supabase
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
    const { error } = await context.supabase
      .from("marketing_projects")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- run step ----------------
type StepEntry = { key: string; label: string; status: string };

async function loadBrandContext(
  supabase: any,
  ownerId: string,
): Promise<string | undefined> {
  try {
    return await buildBrandSystemPrompt(supabase, ownerId);
  } catch {
    return undefined;
  }
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
    const { supabase, userId } = context;
    const { data: proj, error: pErr } = await supabase
      .from("marketing_projects")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (pErr || !proj) throw new Error(pErr?.message ?? "Project not found");

    const steps: StepEntry[] = Array.isArray(proj.steps) ? [...proj.steps] : [];
    const idx = steps.findIndex((s) => s.key === data.step);
    if (idx >= 0) steps[idx] = { ...steps[idx], status: "running" };

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
          const { data: camp, error: cErr } = await supabase
            .from("mkt_campaigns")
            .insert({
              brand_id: proj.brand_id,
              name: brief.suggested_name || proj.name,
              objective: brief.objective ?? null,
              description: proj.prompt,
              target_platforms: Array.isArray(brief.platforms) ? brief.platforms : [],
              status: "planning",
              timeline_stage: "planning",
              created_by: userId,
            })
            .select()
            .single();
          if (cErr) throw new Error(cErr.message);
          result.campaign = camp;
          await supabase
            .from("marketing_projects")
            .update({ campaign_id: camp.id })
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

      if (idx >= 0) steps[idx] = { ...steps[idx], status: "done" };
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
        })
        .eq("id", proj.id);
      return { ok: true, progress, step: data.step };
    } catch (e: any) {
      if (idx >= 0) steps[idx] = { ...steps[idx], status: "error" };
      await supabase
        .from("marketing_projects")
        .update({ steps, status: "error", error: e?.message ?? String(e) })
        .eq("id", proj.id);
      throw e;
    }
  });
