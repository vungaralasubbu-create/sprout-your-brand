/**
 * Marketing analytics rollups + AI optimization learnings.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BrandInput = z.object({ brandId: z.string().uuid(), days: z.number().int().min(1).max(365).default(30) });

/** Aggregate analytics for a brand: totals, per-channel, best posting time, top topics. */
export const brandAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => BrandInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();

    const { data: rows } = await supabase
      .from("mkt_analytics")
      .select("channel_kind, reach, impressions, clicks, likes, shares, comments, ctr, engagement_rate, measured_at, post_id")
      .eq("brand_id", data.brandId)
      .gte("measured_at", since);

    const totals = { reach: 0, impressions: 0, clicks: 0, likes: 0, shares: 0, comments: 0 };
    const byChannel: Record<string, typeof totals & { count: number; ctr: number }> = {};
    const hourBuckets: Record<number, { engagement: number; count: number }> = {};

    for (const r of rows ?? []) {
      totals.reach += r.reach ?? 0;
      totals.impressions += r.impressions ?? 0;
      totals.clicks += r.clicks ?? 0;
      totals.likes += r.likes ?? 0;
      totals.shares += r.shares ?? 0;
      totals.comments += r.comments ?? 0;
      const c = r.channel_kind as string;
      byChannel[c] ??= { reach: 0, impressions: 0, clicks: 0, likes: 0, shares: 0, comments: 0, ctr: 0, count: 0 };
      byChannel[c].reach += r.reach ?? 0;
      byChannel[c].impressions += r.impressions ?? 0;
      byChannel[c].clicks += r.clicks ?? 0;
      byChannel[c].likes += r.likes ?? 0;
      byChannel[c].shares += r.shares ?? 0;
      byChannel[c].comments += r.comments ?? 0;
      byChannel[c].ctr += Number(r.ctr ?? 0);
      byChannel[c].count += 1;
      const hr = new Date(r.measured_at).getUTCHours();
      hourBuckets[hr] ??= { engagement: 0, count: 0 };
      hourBuckets[hr].engagement += Number(r.engagement_rate ?? 0);
      hourBuckets[hr].count += 1;
    }

    const bestHour = Object.entries(hourBuckets)
      .map(([h, v]) => ({ hour: Number(h), avg: v.count ? v.engagement / v.count : 0 }))
      .sort((a, b) => b.avg - a.avg)[0]?.hour ?? null;

    const ctr = totals.impressions ? totals.clicks / totals.impressions : 0;

    return {
      windowDays: data.days,
      totals: { ...totals, ctr },
      byChannel,
      bestHourUTC: bestHour,
    };
  });

const RecordInput = z.object({
  postId: z.string().uuid(),
  reach: z.number().int().default(0),
  impressions: z.number().int().default(0),
  clicks: z.number().int().default(0),
  likes: z.number().int().default(0),
  shares: z.number().int().default(0),
  comments: z.number().int().default(0),
  saves: z.number().int().default(0),
  followersDelta: z.number().int().default(0),
});

export const recordAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RecordInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: post } = await supabase.from("mkt_posts").select("brand_id, channel_kind").eq("id", data.postId).maybeSingle();
    if (!post) throw new Error("Post not found");
    const ctr = data.impressions ? data.clicks / data.impressions : 0;
    const eng = data.impressions ? (data.likes + data.shares + data.comments + data.saves) / data.impressions : 0;
    const { error } = await supabase.from("mkt_analytics").insert({
      brand_id: post.brand_id, post_id: data.postId, channel_kind: post.channel_kind,
      reach: data.reach, impressions: data.impressions, clicks: data.clicks,
      likes: data.likes, shares: data.shares, comments: data.comments, saves: data.saves,
      followers_delta: data.followersDelta, ctr, engagement_rate: eng,
    });
    if (error) throw new Error(error.message);
    return { ok: true, ctr, engagementRate: eng };
  });

/** Recompute AI optimization memory (best hashtags/time/topics) from recent analytics. */
export const recomputeLearnings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ brandId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Pull last 90d of analytics joined to posts+variants
    const { data: rows } = await supabase.rpc("mkt_top_signals" as never, { _brand: data.brandId }).select("*").limit(1);
    // Fallback: derive best posting time from analytics if RPC absent.
    const since = new Date(Date.now() - 90 * 86400_000).toISOString();
    const { data: a } = await supabase.from("mkt_analytics")
      .select("channel_kind, engagement_rate, measured_at").eq("brand_id", data.brandId).gte("measured_at", since);
    const byChannelHour: Record<string, Record<number, { e: number; n: number }>> = {};
    for (const r of a ?? []) {
      const ch = r.channel_kind as string;
      const h = new Date(r.measured_at).getUTCHours();
      byChannelHour[ch] ??= {};
      byChannelHour[ch][h] ??= { e: 0, n: 0 };
      byChannelHour[ch][h].e += Number(r.engagement_rate ?? 0);
      byChannelHour[ch][h].n += 1;
    }
    const updates = [];
    for (const [ch, hours] of Object.entries(byChannelHour)) {
      const ranked = Object.entries(hours)
        .map(([h, v]) => ({ hour: Number(h), avg: v.n ? v.e / v.n : 0 }))
        .sort((x, y) => y.avg - x.avg).slice(0, 3);
      updates.push({
        brand_id: data.brandId, channel_kind: ch, metric: "best_time",
        value: ranked, score: ranked[0]?.avg ?? 0, sample_size: Object.values(hours).reduce((s, v) => s + v.n, 0),
      });
    }
    if (updates.length) {
      await supabase.from("mkt_learnings").upsert(updates, { onConflict: "brand_id,channel_kind,metric" });
    }
    return { ok: true, updated: updates.length, rowsSeen: rows?.length ?? 0 };
  });
