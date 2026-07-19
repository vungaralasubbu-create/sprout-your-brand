// Campaign Orchestrator — Analytics rollup.
// Aggregates cross-module metrics (soc_analytics, mkt_analytics, email_logs)
// per campaign per day. Called from the tick worker.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface DailyMetrics {
  views: number; reach: number; impressions: number; clicks: number;
  conversions: number; enrollments: number; revenue: number;
  shares: number; likes: number; comments: number;
  watch_time_seconds: number; open_rate: number | null; bounce_rate: number | null;
  cost: number;
}

export function emptyMetrics(): DailyMetrics {
  return {
    views: 0, reach: 0, impressions: 0, clicks: 0,
    conversions: 0, enrollments: 0, revenue: 0,
    shares: 0, likes: 0, comments: 0,
    watch_time_seconds: 0, open_rate: null, bounce_rate: null, cost: 0,
  };
}

export function computeCtr(m: DailyMetrics): number | null {
  if (!m.impressions) return null;
  return Math.round((m.clicks / m.impressions) * 10000) / 10000;
}

export function computeRoi(m: DailyMetrics): number | null {
  if (!m.cost) return null;
  return Math.round(((m.revenue - m.cost) / m.cost) * 1000) / 1000;
}

/** Rollup one campaign's cross-module metrics for a given day range. */
export async function rollupCampaign(
  supa: SupabaseClient,
  campaignId: string,
  fromDay: string,
  toDay: string,
): Promise<Array<{ day: string; channel: string; metrics: DailyMetrics }>> {
  const rows: Array<{ day: string; channel: string; metrics: DailyMetrics }> = [];

  // Social — soc_analytics is keyed by (post_id, day).
  const { data: soc } = await supa
    .from("soc_analytics")
    .select("day, channel, impressions, reach, clicks, shares, likes, comments, watch_time_seconds")
    .gte("day", fromDay).lte("day", toDay)
    .eq("campaign_id", campaignId);
  for (const r of (soc as Array<Record<string, unknown>> | null) ?? []) {
    const m = emptyMetrics();
    m.impressions = Number(r.impressions ?? 0);
    m.reach = Number(r.reach ?? 0);
    m.clicks = Number(r.clicks ?? 0);
    m.shares = Number(r.shares ?? 0);
    m.likes = Number(r.likes ?? 0);
    m.comments = Number(r.comments ?? 0);
    m.watch_time_seconds = Number(r.watch_time_seconds ?? 0);
    rows.push({ day: String(r.day), channel: String(r.channel ?? "social"), metrics: m });
  }

  // Marketing/mkt_analytics.
  const { data: mkt } = await supa
    .from("mkt_analytics")
    .select("day, channel, views, clicks, conversions, revenue, cost")
    .gte("day", fromDay).lte("day", toDay)
    .eq("campaign_id", campaignId);
  for (const r of (mkt as Array<Record<string, unknown>> | null) ?? []) {
    const m = emptyMetrics();
    m.views = Number(r.views ?? 0);
    m.clicks = Number(r.clicks ?? 0);
    m.conversions = Number(r.conversions ?? 0);
    m.revenue = Number(r.revenue ?? 0);
    m.cost = Number(r.cost ?? 0);
    rows.push({ day: String(r.day), channel: String(r.channel ?? "web"), metrics: m });
  }

  return rows;
}
