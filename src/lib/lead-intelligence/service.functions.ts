/**
 * Lead Intelligence server API — computes/persists scores, list & profile.
 * Reusable microservice: swap `scoreLead` for an ML model without touching UI.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  scoreLead,
  DEFAULT_WEIGHTS,
  DEFAULT_THRESHOLDS,
  type ScoringConfig,
  type ScoringResult,
} from "./scoring";

async function loadConfig(supabase: {
  from: (t: string) => {
    select: (c: string) => {
      order: (
        col: string,
        opts: { ascending: boolean },
      ) => { limit: (n: number) => { maybeSingle: () => Promise<{ data: unknown }> } };
    };
  };
}): Promise<ScoringConfig> {
  const { data } = await supabase
    .from("lead_scoring_config")
    .select("weights, thresholds")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as { weights?: Record<string, number>; thresholds?: Record<string, number> } | null;
  return {
    weights: { ...DEFAULT_WEIGHTS, ...(row?.weights ?? {}) },
    thresholds: { ...DEFAULT_THRESHOLDS, ...(row?.thresholds ?? {}) },
  };
}

interface ScoreOutput {
  score: number;
  category: string;
  probability: number;
  summary: string;
  next_action: string;
  reason: string;
  signals: ScoringResult["signals"];
}

/** Recompute one lead's score. Called after events/lead changes. */
export const recomputeLeadScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<ScoreOutput> => {
    const { supabase } = context;
    const [{ data: leadRaw, error: leadErr }, { data: eventsRaw }] = await Promise.all([
      supabase.from("platform_leads").select("*").eq("id", data.leadId).maybeSingle(),
      supabase
        .from("platform_lead_events")
        .select("*")
        .eq("lead_id", data.leadId)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);
    if (leadErr || !leadRaw) throw new Error("Lead not found");
    const config = await loadConfig(supabase as never);

    const result = scoreLead(
      leadRaw as never,
      (eventsRaw ?? []) as never[],
      config,
    );

    await supabase
      .from("platform_leads")
      .update({
        score: result.score,
        score_category: result.category,
        score_updated_at: new Date().toISOString(),
        probability: result.probability,
        ai_summary: result.summary,
        ai_next_action: result.next_action,
        predicted_course: result.signals.dominantCourse,
        event_count: (eventsRaw ?? []).length,
        last_activity_at: (eventsRaw ?? []).at(-1)?.created_at ?? null,
      } as never)
      .eq("id", data.leadId);

    await supabase.from("lead_score_snapshots").insert({
      lead_id: data.leadId,
      score: result.score,
      category: result.category,
      probability: result.probability,
      breakdown: result.breakdown as never,
      reason: result.reason,
    } as never);

    return {
      score: result.score,
      category: result.category,
      probability: result.probability,
      summary: result.summary,
      next_action: result.next_action,
      reason: result.reason,
      signals: result.signals,
    };
  });

/** Bulk recompute — used by admin dashboard refresh. */
export const recomputeAllLeadScores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ updated: number }> => {
    const { supabase } = context;
    const config = await loadConfig(supabase as never);
    const { data: leads } = await supabase
      .from("platform_leads")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(500);
    let updated = 0;
    for (const l of (leads ?? []) as { id: string }[]) {
      const { data: leadRaw } = await supabase.from("platform_leads").select("*").eq("id", l.id).maybeSingle();
      const { data: eventsRaw } = await supabase
        .from("platform_lead_events")
        .select("*")
        .eq("lead_id", l.id)
        .order("created_at", { ascending: true })
        .limit(500);
      if (!leadRaw) continue;
      const result = scoreLead(leadRaw as never, (eventsRaw ?? []) as never[], config);
      await supabase
        .from("platform_leads")
        .update({
          score: result.score,
          score_category: result.category,
          score_updated_at: new Date().toISOString(),
          probability: result.probability,
          ai_summary: result.summary,
          ai_next_action: result.next_action,
          predicted_course: result.signals.dominantCourse,
          event_count: (eventsRaw ?? []).length,
          last_activity_at: (eventsRaw ?? []).at(-1)?.created_at ?? null,
        } as never)
        .eq("id", l.id);
      updated++;
    }
    return { updated };
  });

export interface LeadIntelligenceRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  interested_course: string | null;
  score: number;
  score_category: string;
  probability: number;
  ai_summary: string | null;
  ai_next_action: string | null;
  predicted_course: string | null;
  source: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  last_activity_at: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  country: string | null;
  event_count: number;
}

/** List leads with intelligence, sorted by score. */
export const listLeadIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        category: z.enum(["hot", "warm", "nurture", "cold", "all"]).default("all"),
        source: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        minScore: z.number().optional(),
        maxScore: z.number().optional(),
        limit: z.number().max(500).default(200),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<LeadIntelligenceRow[]> => {
    let q = context.supabase
      .from("platform_leads")
      .select(
        "id,name,email,phone,interested_course,score,score_category,probability,ai_summary,ai_next_action,predicted_course,source,status,assigned_to,created_at,last_activity_at,utm_source,utm_campaign,country,event_count",
      )
      .order("score", { ascending: false })
      .limit(data.limit);
    if (data.category !== "all") q = q.eq("score_category", data.category);
    if (data.source) q = q.eq("source", data.source);
    if (data.status) q = q.eq("status", data.status);
    if (typeof data.minScore === "number") q = q.gte("score", data.minScore);
    if (typeof data.maxScore === "number") q = q.lte("score", data.maxScore);
    if (data.search) {
      const s = `%${data.search.replace(/[%_]/g, "")}%`;
      q = q.or(`name.ilike.${s},email.ilike.${s},phone.ilike.${s},interested_course.ilike.${s}`);
    }
    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? []) as LeadIntelligenceRow[];
  });

export interface LeadDashboardStats {
  total: number;
  today: number;
  hot: number;
  warm: number;
  nurture: number;
  cold: number;
  converted: number;
  lost: number;
  averageScore: number;
  predictedConversion: number;
}

export const getLeadIntelligenceStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LeadDashboardStats> => {
    const { data: rows } = await context.supabase
      .from("platform_leads")
      .select("score,score_category,status,created_at,probability")
      .limit(5000);
    const list = (rows ?? []) as {
      score: number;
      score_category: string;
      status: string;
      created_at: string;
      probability: number;
    }[];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    const stat = {
      total: list.length,
      today: list.filter((r) => r.created_at >= todayIso).length,
      hot: list.filter((r) => r.score_category === "hot").length,
      warm: list.filter((r) => r.score_category === "warm").length,
      nurture: list.filter((r) => r.score_category === "nurture").length,
      cold: list.filter((r) => r.score_category === "cold").length,
      converted: list.filter((r) => r.status === "converted").length,
      lost: list.filter((r) => r.status === "lost").length,
      averageScore: list.length
        ? Math.round(list.reduce((a, r) => a + (r.score || 0), 0) / list.length)
        : 0,
      predictedConversion: list.length
        ? Math.round(list.reduce((a, r) => a + Number(r.probability || 0), 0) / list.length)
        : 0,
    };
    return stat;
  });

export interface LeadTimelineEvent {
  id: string;
  event_type: string;
  page_path: string | null;
  source: string | null;
  metadata_json: string;
  created_at: string;
}

export type LeadProfile = {
  lead_json: string;
  events: LeadTimelineEvent[];
  snapshots: { id: string; score: number; category: string; created_at: string; reason: string | null }[];
};



export const getLeadProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<LeadProfile> => {
    const { supabase } = context;
    const [{ data: lead }, { data: events }, { data: snapshots }] = await Promise.all([
      supabase.from("platform_leads").select("*").eq("id", data.leadId).maybeSingle(),
      supabase
        .from("platform_lead_events")
        .select("id,event_type,page_path,source,metadata,created_at")
        .eq("lead_id", data.leadId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("lead_score_snapshots")
        .select("id,score,category,created_at,reason")
        .eq("lead_id", data.leadId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (!lead) throw new Error("Lead not found");
    return {
      lead_json: JSON.stringify(lead),
      events: ((events ?? []) as { id: string; event_type: string; page_path: string | null; source: string | null; metadata: unknown; created_at: string }[]).map((e) => ({
        id: e.id,
        event_type: e.event_type,
        page_path: e.page_path,
        source: e.source,
        metadata_json: JSON.stringify(e.metadata ?? {}),
        created_at: e.created_at,
      })),
      snapshots: (snapshots ?? []) as never[],
    };

  });

export const updateLeadIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        status: z.string().max(30).optional(),
        assigned_to: z.string().uuid().nullable().optional(),
        notes: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.assigned_to !== undefined) patch.assigned_to = data.assigned_to;
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await context.supabase
      .from("platform_leads")
      .update(patch as never)
      .eq("id", data.leadId);
    if (error) throw error;
    return { ok: true };
  });

export interface ScoringConfigRow {
  id: string;
  weights: Record<string, number>;
  thresholds: { hot: number; warm: number; nurture: number };
  automation: Record<string, boolean>;
  updated_at: string;
}

export const getScoringConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ScoringConfigRow> => {
    const { data } = await context.supabase
      .from("lead_scoring_config")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as never) ?? {
      id: "",
      weights: DEFAULT_WEIGHTS,
      thresholds: DEFAULT_THRESHOLDS,
      automation: { auto_assign_hot: true, auto_assign_warm: true, nurture_campaign: true },
      updated_at: new Date().toISOString(),
    };
  });

export const updateScoringConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        weights: z.record(z.string(), z.number()).optional(),
        thresholds: z
          .object({ hot: z.number(), warm: z.number(), nurture: z.number() })
          .optional(),
        automation: z.record(z.string(), z.boolean()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("lead_scoring_config")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase
        .from("lead_scoring_config")
        .update({
          ...(data.weights ? { weights: data.weights as never } : {}),
          ...(data.thresholds ? { thresholds: data.thresholds as never } : {}),
          ...(data.automation ? { automation: data.automation as never } : {}),
          updated_by: context.userId,
        } as never)
        .eq("id", (existing as { id: string }).id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("lead_scoring_config").insert({
        weights: (data.weights ?? DEFAULT_WEIGHTS) as never,
        thresholds: (data.thresholds ?? DEFAULT_THRESHOLDS) as never,
        automation: (data.automation ?? {
          auto_assign_hot: true,
          auto_assign_warm: true,
          nurture_campaign: true,
        }) as never,
        updated_by: context.userId,
      } as never);
      if (error) throw error;
    }
    return { ok: true };
  });
