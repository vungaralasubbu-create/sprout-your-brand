// Campaign Orchestrator — server functions.
// Authenticated CRUD + orchestration entrypoints. All AI runs through the
// centralized AI Router (OpenAI native). No Lovable AI.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { CampaignInput, CampaignKind } from "./types";

const CAMPAIGN_KINDS: CampaignKind[] = [
  "course_launch","admissions","internship","hiring","scholarship",
  "live_class","masterclass","discount","festival","referral",
  "certification","partner_announcement","placement_drive","brand_awareness",
  "email_campaign","webinar","bootcamp","ai_news","tech_update","success_story","custom",
];

const CreateSchema = z.object({
  name: z.string().min(2).max(200),
  kind: z.enum(CAMPAIGN_KINDS as [CampaignKind, ...CampaignKind[]]),
  objective: z.string().max(500).optional(),
  prompt: z.string().max(4000).optional(),
  audience: z.record(z.string(), z.unknown()).optional(),
  geo: z.object({
    country: z.string().max(80).optional(),
    state: z.string().max(80).optional(),
    city: z.string().max(80).optional(),
  }).optional(),
  language: z.string().max(10).optional(),
  budget: z.number().nonnegative().optional(),
  currency: z.string().max(6).optional(),
  platforms: z.array(z.string().max(40)).max(20).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
  brandKitId: z.string().uuid().optional(),
  primaryCta: z.string().max(120).optional(),
  secondaryCta: z.string().max(120).optional(),
  keywords: z.array(z.string().max(60)).max(50).optional(),
  hashtags: z.array(z.string().max(60)).max(50).optional(),
  landingGoal: z.string().max(160).optional(),
  offer: z.record(z.string(), z.unknown()).optional(),
  couponCode: z.string().max(60).optional(),
  priority: z.number().int().min(1).max(5).optional(),
});

/** Create a campaign and immediately move it to 'planning' so the tick
 *  worker generates the plan on the next run. */
export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CreateSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const input = data as CampaignInput;
    const { data: row, error } = await context.supabase.from("co_campaigns").insert({
      owner_id: context.userId,
      name: input.name,
      kind: input.kind,
      status: "planning",
      priority: input.priority ?? 3,
      objective: input.objective ?? null,
      prompt: input.prompt ?? null,
      audience: input.audience ?? {},
      geo: input.geo ?? {},
      language: input.language ?? "en",
      budget: input.budget ?? null,
      currency: input.currency ?? "INR",
      platforms: input.platforms ?? [],
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
      duration_days: input.durationDays ?? null,
      brand_kit_id: input.brandKitId ?? null,
      primary_cta: input.primaryCta ?? null,
      secondary_cta: input.secondaryCta ?? null,
      keywords: input.keywords ?? [],
      hashtags: input.hashtags ?? [],
      landing_goal: input.landingGoal ?? null,
      offer: input.offer ?? {},
      coupon_code: input.couponCode ?? null,
    }).select("id, status").maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

const StatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "draft","planning","generating","review","approved","scheduled",
    "publishing","running","paused","completed","archived","failed",
  ]),
});

/** Update the top-level campaign status (approve, pause, resume, archive). */
export const setCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StatusSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("co_campaigns")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** List the caller's campaigns (admins/super-admins see all — RLS handles it). */
export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("co_campaigns")
      .select("id, name, kind, status, priority, starts_at, ends_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const IdSchema = z.object({ id: z.string().uuid() });

/** Full campaign detail including plan, tasks, schedule, analytics. */
export const getCampaign = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => IdSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const [c, tasks, sched, analytics, opts, ab] = await Promise.all([
      context.supabase.from("co_campaigns").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("co_tasks").select("*").eq("campaign_id", data.id).order("created_at", { ascending: true }),
      context.supabase.from("co_schedule").select("*").eq("campaign_id", data.id).order("scheduled_at", { ascending: true }),
      context.supabase.from("co_analytics").select("*").eq("campaign_id", data.id).order("day", { ascending: false }).limit(60),
      context.supabase.from("co_optimizations").select("*").eq("campaign_id", data.id).order("created_at", { ascending: false }).limit(50),
      context.supabase.from("co_ab_tests").select("*").eq("campaign_id", data.id),
    ]);
    if (c.error) throw new Error(c.error.message);
    return {
      campaign: c.data,
      tasks: tasks.data ?? [],
      schedule: sched.data ?? [],
      analytics: analytics.data ?? [],
      optimizations: opts.data ?? [],
      abTests: ab.data ?? [],
    };
  });

const ApprovalSchema = z.object({
  campaignId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  stage: z.enum(["marketing", "seo", "brand", "final"]),
  state: z.enum(["pending", "approved", "rejected", "changes_requested"]),
  notes: z.string().max(2000).optional(),
});

export const submitApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ApprovalSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("co_approvals").insert({
      campaign_id: data.campaignId,
      task_id: data.taskId ?? null,
      stage: data.stage,
      state: data.state,
      reviewer_id: context.userId,
      notes: data.notes ?? null,
      decided_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);

    // Auto-advance: if this is the FINAL approval and it's approved, move
    // the campaign to 'approved' so the tick worker builds the schedule.
    if (data.stage === "final" && data.state === "approved") {
      await context.supabase.from("co_campaigns").update({ status: "approved" }).eq("id", data.campaignId);
    }
    return { ok: true };
  });

const RegenerateSchema = z.object({ taskId: z.string().uuid() });

/** Requeue a single task for regeneration (e.g. after a reviewer rejects). */
export const regenerateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RegenerateSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("co_tasks")
      .update({ status: "queued", retries: 0, error: null })
      .eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AbSchema = z.object({
  campaignId: z.string().uuid(),
  metric: z.string().max(40),
  hypothesis: z.string().max(500).optional(),
  variantAssetIds: z.array(z.string().uuid()).min(2).max(6),
});

export const createAbTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => AbSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("co_ab_tests").insert({
      campaign_id: data.campaignId,
      metric: data.metric,
      hypothesis: data.hypothesis ?? null,
      variant_asset_ids: data.variantAssetIds,
    }).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

/** Trigger a synchronous tick (admin only). Useful for on-demand runs from
 *  the admin console. */
export const runTickNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "super_admin",
    });
    if (!isAdmin && !isSuper) throw new Error("Forbidden");

    const { runCampaignTick } = await import("./tick.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return await runCampaignTick(supabaseAdmin);
  });
