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
import { generateImageBase64, isImageProviderAvailable } from "@/lib/ai/image.server";
// NOTE: approval-sync.server is dynamically imported inside handlers only.
// Static import from a client-reachable *.functions.ts leaks a .server.*
// module into the browser bundle guard and breaks the module load, which
// silently kills every server fn exported here (Planner submit, image gen,
// project pipeline, etc.). Do not hoist this back to a top-level import.
import {
  designBrief as cdDesignBrief,
  proposeConcepts as cdProposeConcepts,
  filterAndRank as cdFilterAndRank,
  scorePoster as cdScorePoster,
  type CreativeConcept,
} from "@/lib/marketing-os/creative-direction.server";

const CREATIVE_SCORE_THRESHOLD = Number(process.env.POSTER_MIN_SCORE ?? 55);
const CREATIVE_CONCEPT_COUNT = 6;

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
    const { resolveOwnedBrandId } = await import("@/lib/marketing-os/campaign-service.server");
    const brandId = await resolveOwnedBrandId(sb, context.userId, data.brand_id);
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
    // Surface state from dedicated columns as if it lived inside `result`,
    // so existing UI (which reads `result.post_states` / `result.publish`)
    // keeps working after the storage split.
    const p: any = proj;
    const merged = {
      ...(p.result ?? {}),
      post_states: { ...((p.result ?? {}).post_states ?? {}), ...(p.post_states ?? {}) },
      publish: { ...((p.result ?? {}).publish ?? {}), ...(p.publish_state ?? {}) },
    };
    return { project: { ...p, result: merged } as MarketingProject };
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
 * Backward-compatible wrapper — delegates to the single shared brand
 * resolver in `campaign-service.server`. Do not add logic here; extend
 * `resolveOwnedBrandId` instead.
 */
async function ensureDefaultBrand(
  supabase: any,
  userId: string,
  preferredBrandId?: string | null,
): Promise<string> {
  const { resolveOwnedBrandId } = await import("@/lib/marketing-os/campaign-service.server");
  return resolveOwnedBrandId(supabase, userId, preferredBrandId ?? null);
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
          // Single validated campaign-creation service — enforces RLS-safe brand_id.
          const { createCampaignForUser } = await import("@/lib/marketing-os/campaign-service.server");
          const camp = await createCampaignForUser(
            supabase,
            userId,
            {
              name: brief.suggested_name || proj.name,
              objective: brief.objective ?? null,
              description: proj.prompt,
              target_platforms: Array.isArray(brief.platforms) ? brief.platforms : [],
              status: "planning",
              timeline_stage: "planning",
            },
            { preferredBrandId: proj.brand_id },
          );
          result.campaign = camp;
          await supabase
            .from("marketing_projects")
            .update({ campaign_id: camp.id, brand_id: camp.brand_id })
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
          const marketingBrief = result.brief || {};
          const posterStart = Date.now();
          const telemetry: Array<Record<string, unknown>> = [];
          const providerReady = isImageProviderAvailable();
          console.log(
            `[posters] project=${proj.id} started providerReady=${providerReady}`,
          );
          if (!providerReady) {
            // Surface a clear reason instead of silently marking every concept failed.
            throw new Error(
              "Image provider not configured (OPENAI_API_KEY missing). Text assets were generated; posters skipped.",
            );
          }

          // Step 1 — Design Brief (creative direction)
          let dBrief: any = {};
          try {
            dBrief = await cdDesignBrief(brandSystem, marketingBrief, proj.prompt);
          } catch (e: any) {
            console.error(`[posters] design_brief failed: ${e?.message ?? e}`);
            dBrief = {};
          }
          result.design_brief = dBrief;

          // Step 2 — Propose N distinct creative concepts
          let concepts: CreativeConcept[] = [];
          try {
            concepts = await cdProposeConcepts(
              brandSystem,
              dBrief,
              marketingBrief,
              CREATIVE_CONCEPT_COUNT,
            );
          } catch (e: any) {
            console.error(`[posters] propose_concepts failed: ${e?.message ?? e}`);
            concepts = [];
          }

          let ranked = cdFilterAndRank(concepts, CREATIVE_SCORE_THRESHOLD);
          if (ranked.kept.length < 3) {
            try {
              const more = await cdProposeConcepts(
                brandSystem,
                dBrief,
                marketingBrief,
                CREATIVE_CONCEPT_COUNT,
              );
              ranked = cdFilterAndRank([...ranked.kept, ...more], CREATIVE_SCORE_THRESHOLD);
            } catch {
              /* keep whatever we have */
            }
          }
          const finalConcepts = (ranked.kept.length ? ranked.kept : concepts).slice(
            0,
            CREATIVE_CONCEPT_COUNT,
          );

          // Step 3 — Generate ONLY the artwork background for each concept.
          const rendered = await Promise.allSettled(
            finalConcepts.map(async (c: CreativeConcept, i: number) => {
              const brandLine = brandSystem
                ? `Follow this brand system strictly for palette and mood:\n${brandSystem}\n\n`
                : "";
              const colors = Array.isArray(c?.dominant_colors) && c.dominant_colors.length
                ? ` Palette: ${c.dominant_colors.join(", ")}.`
                : "";
              const style = c?.style ? ` Style: ${c.style}.` : "";
              const direction = c?.creative_direction
                ? ` Creative direction: ${c.creative_direction}.`
                : "";
              const mood = dBrief?.visual_mood ? ` Mood: ${dBrief.visual_mood}.` : "";
              const backgroundPrompt = c?.background_prompt ?? c?.concept ?? c?.title ?? "";
              const prompt =
                `${brandLine}Design an ABSTRACT background artwork for a social media poster.` +
                ` ${backgroundPrompt}.${direction}${style}${colors}${mood}` +
                ` Square 1:1 composition, production-quality, cinematic lighting,` +
                ` intentional negative space for headline overlay.` +
                ` STRICT: absolutely NO text, NO letters, NO numbers, NO logos,` +
                ` NO typography, NO watermarks, NO captions. Pure artwork only —` +
                ` all copy will be overlaid separately by the design system.`;
              const t0 = Date.now();
              console.log(`[posters] concept=${i} started style=${c?.style ?? "?"}`);
              try {
                const b64 = await generateImageBase64(prompt, {
                  size: "1024x1024",
                  quality: "low",
                });
                const ms = Date.now() - t0;
                telemetry.push({ index: i, status: "completed", duration_ms: ms, style: c?.style });
                console.log(`[posters] concept=${i} completed in ${ms}ms`);
                return { ...c, image_url: `data:image/png;base64,${b64}` };
              } catch (imgErr: any) {
                const ms = Date.now() - t0;
                const msg = imgErr?.message ?? "Image generation failed";
                telemetry.push({ index: i, status: "failed", duration_ms: ms, error: msg, style: c?.style });
                console.error(`[posters] concept=${i} FAILED in ${ms}ms: ${msg}`);
                return { ...c, image_error: msg };
              }
            }),
          );

          // Step 6 (post-render) — attach final scores.
          result.posters = rendered.map((r, i) => {
            const base =
              r.status === "fulfilled"
                ? r.value
                : { ...finalConcepts[i], image_error: (r as PromiseRejectedResult).reason?.message ?? "Image generation failed" };
            const s = cdScorePoster(base);
            return {
              ...base,
              score: s.score,
              score_breakdown: s.breakdown,
              score_notes: s.notes,
            };
          });
          result.rejected_posters = ranked.rejected;
          result.poster_telemetry = telemetry;
          const okCount = telemetry.filter((t) => t.status === "completed").length;
          const failCount = telemetry.filter((t) => t.status === "failed").length;
          console.log(
            `[posters] project=${proj.id} finished total=${telemetry.length} ok=${okCount} failed=${failCount} totalMs=${Date.now() - posterStart}`,
          );
          if (okCount === 0 && failCount > 0) {
            const firstErr = telemetry.find((t) => t.status === "failed")?.error ?? "unknown";
            throw new Error(`All poster image generations failed. First error: ${firstErr}`);
          }
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

      // ---- Auto-sync generated assets to the Approval Center (best-effort) ----
      // Runs after every step that can add assets; never throws so pipeline
      // continues even if the mirror fails.
      const ASSET_STEPS = new Set(["content", "posters", "email", "landing", "save"]);
      if (ASSET_STEPS.has(data.step)) {
        try {
          // Dynamic import keeps the .server.* module out of the client bundle.
          const { syncProjectToApprovalQueue } = await import("@/lib/marketing-os/approval-sync.server");
          const summary = await syncProjectToApprovalQueue(supabase, userId, proj.id);
          console.log(
            `[project.step=${data.step}] approval sync project=${proj.id} inserted=${summary.inserted} updated=${summary.updated} skipped=${summary.skipped}`,
          );
        } catch (syncErr: any) {
          console.error(
            `[project.step=${data.step}] approval sync FAILED project=${proj.id}: ${syncErr?.message ?? syncErr}`,
          );
        }
      }

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
