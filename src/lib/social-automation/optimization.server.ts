// Learn best posting hour / weekday / hashtags / CTA / caption length / topics
// from historical analytics and store as soc_optimization_insights rows.

import type { SocPlatform } from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type AnalyticsRow = {
  variant_id: string;
  platform: SocPlatform;
  reach: number;
  likes: number;
  shares: number;
  saves: number;
  ctr: number;
  measured_at: string;
};

type VariantRow = {
  id: string;
  platform: SocPlatform;
  caption: string;
  hashtags: string[];
  cta: string;
  best_time_at: string | null;
};

function scoreOf(a: AnalyticsRow) {
  return (a.reach ?? 0) + (a.likes ?? 0) * 2 + (a.shares ?? 0) * 5 + (a.saves ?? 0) * 4 + (a.ctr ?? 0) * 1000;
}

export async function computeInsights(ownerId: string) {
  const db = await admin();
  const { data: analytics } = await db
    .from("soc_analytics")
    .select("variant_id, platform, reach, likes, shares, saves, ctr, measured_at")
    .eq("owner_id", ownerId)
    .limit(2000);
  const rows = (analytics ?? []) as AnalyticsRow[];
  if (rows.length === 0) return { insights: 0 };

  const variantIds = [...new Set(rows.map((r) => r.variant_id).filter(Boolean))];
  const { data: variants } = await db
    .from("soc_post_variants")
    .select("id, platform, caption, hashtags, cta, best_time_at")
    .in("id", variantIds);
  const vMap = new Map((variants ?? []).map((v) => [(v as VariantRow).id, v as VariantRow]));

  const buckets = {
    hour: new Map<string, { total: number; n: number }>(),
    weekday: new Map<string, { total: number; n: number }>(),
    hashtag: new Map<string, { total: number; n: number }>(),
    cta: new Map<string, { total: number; n: number }>(),
    capLen: new Map<string, { total: number; n: number }>(),
  };

  for (const r of rows) {
    const v = vMap.get(r.variant_id);
    if (!v) continue;
    const s = scoreOf(r);
    const at = v.best_time_at ? new Date(v.best_time_at) : new Date(r.measured_at);
    const push = (m: Map<string, { total: number; n: number }>, key: string) => {
      const cur = m.get(key) ?? { total: 0, n: 0 };
      m.set(key, { total: cur.total + s, n: cur.n + 1 });
    };
    push(buckets.hour, `${v.platform}|${at.getUTCHours()}`);
    push(buckets.weekday, `${v.platform}|${at.getUTCDay()}`);
    (v.hashtags ?? []).forEach((h) => push(buckets.hashtag, `${v.platform}|${h.toLowerCase()}`));
    if (v.cta) push(buckets.cta, `${v.platform}|${v.cta.toLowerCase()}`);
    const capBucket = v.caption.length < 120 ? "short" : v.caption.length < 500 ? "medium" : "long";
    push(buckets.capLen, `${v.platform}|${capBucket}`);
  }

  const insightRows: Array<Record<string, unknown>> = [];
  const topFrom = (m: Map<string, { total: number; n: number }>, type: string) => {
    const arr = [...m.entries()].map(([k, v]) => {
      const [platform, key] = k.split("|");
      const avg = v.total / v.n;
      return { platform, key, avg, n: v.n, type };
    });
    // Best per platform
    const byPlatform = new Map<string, typeof arr>();
    arr.forEach((x) => {
      const list = byPlatform.get(x.platform) ?? [];
      list.push(x);
      byPlatform.set(x.platform, list);
    });
    byPlatform.forEach((list, platform) => {
      list.sort((a, b) => b.avg - a.avg);
      const top = list[0];
      if (!top) return;
      insightRows.push({
        owner_id: ownerId,
        platform,
        insight_type: type,
        key: top.key,
        value: { avg_score: top.avg },
        confidence: Math.min(1, top.n / 20),
        sample_size: top.n,
      });
    });
  };

  topFrom(buckets.hour, "best_hour");
  topFrom(buckets.weekday, "best_weekday");
  topFrom(buckets.hashtag, "best_hashtag");
  topFrom(buckets.cta, "best_cta");
  topFrom(buckets.capLen, "best_caption_length");

  if (insightRows.length) await db.from("soc_optimization_insights").insert(insightRows);
  return { insights: insightRows.length };
}
