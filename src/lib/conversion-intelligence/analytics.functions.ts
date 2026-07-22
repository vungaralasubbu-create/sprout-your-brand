/**
 * Conversion Intelligence — admin analytics server functions.
 * Admin-gated via requireSupabaseAuth + is_admin check.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FUNNEL_STAGES, type FunnelStage } from "./channel";

async function ensureAdmin(supabase: any, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const RangeInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

function rangeDefaults(from?: string, to?: string): { fromIso: string; toIso: string } {
  const toIso = to ?? new Date().toISOString();
  const fromIso =
    from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return { fromIso, toIso };
}

export const getFunnelSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RangeInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { fromIso, toIso } = rangeDefaults(data.from, data.to);

    // Count distinct sessions per stage in range
    const { data: rows, error } = await (context.supabase as any)
      .from("ci_funnel_events")
      .select("stage, session_id")
      .gte("occurred_at", fromIso)
      .lte("occurred_at", toIso)
      .limit(50_000);
    if (error) throw new Error(error.message);

    const bySession = new Map<string, Set<string>>();
    for (const r of (rows ?? []) as Array<{ stage: string; session_id: string }>) {
      let set = bySession.get(r.stage);
      if (!set) {
        set = new Set();
        bySession.set(r.stage, set);
      }
      set.add(r.session_id);
    }

    const stages = FUNNEL_STAGES.map((stage) => ({
      stage,
      sessions: bySession.get(stage)?.size ?? 0,
    }));

    const withDropoff = stages.map((s, i) => {
      const prev = i === 0 ? s.sessions : stages[i - 1].sessions;
      const dropoffPct = prev > 0 ? Math.max(0, Math.round(((prev - s.sessions) / prev) * 1000) / 10) : 0;
      const conversionPct = prev > 0 ? Math.round((s.sessions / prev) * 1000) / 10 : 0;
      return { ...s, dropoffPct, conversionPct };
    });

    const overall = stages[0].sessions > 0
      ? Math.round((stages[stages.length - 1].sessions / stages[0].sessions) * 1000) / 10
      : 0;

    return { stages: withDropoff, overall, from: fromIso, to: toIso };
  });

export const getAttributionBreakdown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RangeInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { fromIso, toIso } = rangeDefaults(data.from, data.to);

    const { data: rows, error } = await (context.supabase as any)
      .from("ci_sessions")
      .select("first_channel, last_channel, first_campaign, first_source")
      .gte("first_seen_at", fromIso)
      .lte("first_seen_at", toIso)
      .limit(20_000);
    if (error) throw new Error(error.message);

    const first = new Map<string, number>();
    const last = new Map<string, number>();
    const campaigns = new Map<string, number>();

    for (const r of (rows ?? []) as Array<{
      first_channel: string | null;
      last_channel: string | null;
      first_campaign: string | null;
      first_source: string | null;
    }>) {
      const fc = r.first_channel ?? "direct";
      const lc = r.last_channel ?? fc;
      first.set(fc, (first.get(fc) ?? 0) + 1);
      last.set(lc, (last.get(lc) ?? 0) + 1);
      if (r.first_campaign) {
        campaigns.set(r.first_campaign, (campaigns.get(r.first_campaign) ?? 0) + 1);
      }
    }

    const toArr = (m: Map<string, number>) =>
      Array.from(m.entries())
        .map(([channel, sessions]) => ({ channel, sessions }))
        .sort((a, b) => b.sessions - a.sessions);

    return {
      firstTouch: toArr(first),
      lastTouch: toArr(last),
      topCampaigns: toArr(campaigns).slice(0, 10),
      totalSessions: rows?.length ?? 0,
      from: fromIso,
      to: toIso,
    };
  });

export const getConversionsByChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RangeInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { fromIso, toIso } = rangeDefaults(data.from, data.to);

    const { data: events, error } = await (context.supabase as any)
      .from("ci_funnel_events")
      .select("stage, session_id, channel, revenue_cents")
      .in("stage", ["form_submit", "payment", "enrollment"] as FunnelStage[])
      .gte("occurred_at", fromIso)
      .lte("occurred_at", toIso)
      .limit(50_000);
    if (error) throw new Error(error.message);

    type Agg = { channel: string; formSubmits: number; payments: number; enrollments: number; revenueCents: number };
    const byChannel = new Map<string, Agg>();
    for (const e of (events ?? []) as Array<{ stage: string; channel: string | null; revenue_cents: number | null }>) {
      const ch = e.channel ?? "direct";
      let a = byChannel.get(ch);
      if (!a) {
        a = { channel: ch, formSubmits: 0, payments: 0, enrollments: 0, revenueCents: 0 };
        byChannel.set(ch, a);
      }
      if (e.stage === "form_submit") a.formSubmits += 1;
      if (e.stage === "payment") a.payments += 1;
      if (e.stage === "enrollment") a.enrollments += 1;
      a.revenueCents += e.revenue_cents ?? 0;
    }

    return {
      rows: Array.from(byChannel.values()).sort((a, b) => b.revenueCents - a.revenueCents),
      from: fromIso,
      to: toIso,
    };
  });
