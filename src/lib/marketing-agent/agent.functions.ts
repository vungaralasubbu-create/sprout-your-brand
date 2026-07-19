// Marketing Agent — authenticated server functions (CRUD + controls +
// manual triggers). No UI is added; these are backend endpoints the existing
// admin surfaces can call. All AI operations happen server-side via the
// centralized AI Router (no Lovable AI, no client-side provider calls).

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ApprovalLevel = z.enum(["suggest_only", "ai_plus_human", "fully_auto"]);
const AgentStatus = z.enum(["active", "paused", "archived"]);

const CreateSchema = z.object({
  name: z.string().min(2).max(160),
  brandId: z.string().uuid().nullable().optional(),
  approvalLevel: ApprovalLevel.optional(),
  timezone: z.string().max(60).optional(),
  language: z.string().max(10).optional(),
  channels: z.array(z.string().max(40)).max(30).optional(),
  goals: z.record(z.string(), z.unknown()).optional(),
  budgetMonthly: z.number().nonnegative().nullable().optional(),
  autoPublish: z.boolean().optional(),
  autoOptimize: z.boolean().optional(),
  autoEmail: z.boolean().optional(),
  autoBlog: z.boolean().optional(),
  autoVideo: z.boolean().optional(),
  autoLanding: z.boolean().optional(),
  autoSocial: z.boolean().optional(),
});

export const createMarketingAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CreateSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("ma_agents").insert({
      owner_id: context.userId,
      brand_id: data.brandId ?? null,
      name: data.name,
      approval_level: data.approvalLevel ?? "ai_plus_human",
      timezone: data.timezone ?? "Asia/Kolkata",
      language: data.language ?? "en",
      channels: data.channels ?? [],
      goals: (data.goals ?? {}) as never,
      budget_monthly: data.budgetMonthly ?? null,
      auto_publish: data.autoPublish ?? false,
      auto_optimize: data.autoOptimize ?? true,
      auto_email: data.autoEmail ?? false,
      auto_blog: data.autoBlog ?? false,
      auto_video: data.autoVideo ?? false,
      auto_landing: data.autoLanding ?? false,
      auto_social: data.autoSocial ?? false,
    }).select("id, name, status").maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

const UpdateSchema = z.object({
  id: z.string().uuid(),
  patch: z.object({
    status: AgentStatus.optional(),
    approvalLevel: ApprovalLevel.optional(),
    autoPublish: z.boolean().optional(),
    autoOptimize: z.boolean().optional(),
    autoEmail: z.boolean().optional(),
    autoBlog: z.boolean().optional(),
    autoVideo: z.boolean().optional(),
    autoLanding: z.boolean().optional(),
    autoSocial: z.boolean().optional(),
    goals: z.record(z.string(), z.unknown()).optional(),
    channels: z.array(z.string().max(40)).max(30).optional(),
    budgetMonthly: z.number().nonnegative().nullable().optional(),
  }),
});

export const updateMarketingAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => UpdateSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const p = data.patch;
    const upd: Record<string, unknown> = {};
    if (p.status) upd.status = p.status;
    if (p.approvalLevel) upd.approval_level = p.approvalLevel;
    if (p.autoPublish !== undefined) upd.auto_publish = p.autoPublish;
    if (p.autoOptimize !== undefined) upd.auto_optimize = p.autoOptimize;
    if (p.autoEmail !== undefined) upd.auto_email = p.autoEmail;
    if (p.autoBlog !== undefined) upd.auto_blog = p.autoBlog;
    if (p.autoVideo !== undefined) upd.auto_video = p.autoVideo;
    if (p.autoLanding !== undefined) upd.auto_landing = p.autoLanding;
    if (p.autoSocial !== undefined) upd.auto_social = p.autoSocial;
    if (p.goals) upd.goals = p.goals as never;
    if (p.channels) upd.channels = p.channels;
    if (p.budgetMonthly !== undefined) upd.budget_monthly = p.budgetMonthly;
    const { error } = await context.supabase.from("ma_agents").update(upd as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMarketingAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ma_agents")
      .select("id, name, status, approval_level, last_tick_at, next_tick_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const IdSchema = z.object({ id: z.string().uuid() });

export const getMarketingAgent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => IdSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const [agent, plans, decisions, reco, reports, snaps] = await Promise.all([
      context.supabase.from("ma_agents").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("ma_plans").select("id, horizon, period_start, period_end, status, plan, created_at").eq("agent_id", data.id).order("created_at", { ascending: false }).limit(30),
      context.supabase.from("ma_decisions").select("*").eq("agent_id", data.id).order("created_at", { ascending: false }).limit(60),
      context.supabase.from("ma_recommendations").select("*").eq("agent_id", data.id).order("created_at", { ascending: false }).limit(60),
      context.supabase.from("ma_reports").select("id, kind, title, summary, period_start, period_end, created_at").eq("agent_id", data.id).order("created_at", { ascending: false }).limit(30),
      context.supabase.from("ma_metrics_snapshots").select("day, metrics").eq("agent_id", data.id).order("day", { ascending: false }).limit(30),
    ]);
    if (agent.error) throw new Error(agent.error.message);
    return {
      agent: agent.data,
      plans: plans.data ?? [],
      decisions: decisions.data ?? [],
      recommendations: reco.data ?? [],
      reports: reports.data ?? [],
      metrics: snaps.data ?? [],
    };
  });

const DecisionActionSchema = z.object({
  decisionId: z.string().uuid(),
  action: z.enum(["approve", "reject", "rollback"]),
  notes: z.string().max(1000).optional(),
});

export const actOnDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => DecisionActionSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const state = data.action === "approve" ? "approved"
                : data.action === "reject" ? "rejected"
                : "rolled_back";
    const upd: Record<string, unknown> = {
      state, reviewer_id: context.userId,
    };
    if (data.action === "rollback") upd.rolled_back_at = new Date().toISOString();
    const { error } = await context.supabase.from("ma_decisions").update(upd as never).eq("id", data.decisionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const RecommendationActionSchema = z.object({
  recommendationId: z.string().uuid(),
  action: z.enum(["approve", "dismiss", "action"]),
});

export const actOnRecommendation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RecommendationActionSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const state = data.action === "approve" ? "approved" : data.action === "dismiss" ? "dismissed" : "actioned";
    const patch: Record<string, unknown> = { state };
    if (data.action === "action") patch.actioned_at = new Date().toISOString();
    const { error } = await context.supabase.from("ma_recommendations").update(patch as never).eq("id", data.recommendationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin/super_admin trigger to run the tick immediately. */
export const runMarketingAgentTickNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
    ]);
    if (!isAdmin && !isSuper) throw new Error("Forbidden");
    const { runMarketingAgentTick } = await import("./tick.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return await runMarketingAgentTick(supabaseAdmin);
  });

const ReportSchema = z.object({
  agentId: z.string().uuid(),
  kind: z.enum(["morning_brief", "weekly", "monthly", "quarterly", "annual", "campaign_summary", "executive", "seo", "social", "email"]),
});

export const generateAgentReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ReportSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: agent, error } = await context.supabase.from("ma_agents").select("*").eq("id", data.agentId).maybeSingle();
    if (error || !agent) throw new Error(error?.message ?? "Agent not found");
    const { generateReport } = await import("./reporting.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = await generateReport(supabaseAdmin, agent as never, data.kind);
    return { ok: true, id };
  });
