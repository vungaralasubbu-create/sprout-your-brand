// Analytics rollup helpers for pSEO pages.
import { getAdmin } from "./service-client.server";

export async function upsertDailyAnalytics(rows: Array<{
  page_id: string; day: string; impressions?: number; clicks?: number;
  ctr?: number; avg_position?: number; views?: number; bounce_rate?: number;
  conversions?: number; leads?: number;
}>): Promise<{ upserted: number }> {
  if (!rows.length) return { upserted: 0 };
  const admin = await getAdmin();
  await admin.from("pseo_analytics_daily").upsert(rows, { onConflict: "page_id,day" });
  return { upserted: rows.length };
}

export async function topPerformingPages(days = 30, limit = 50) {
  const admin = await getAdmin();
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const { data } = await admin
    .from("pseo_analytics_daily")
    .select("page_id, impressions, clicks, conversions, leads")
    .gte("day", since);
  const bucket = new Map<string, { impressions: number; clicks: number; conversions: number; leads: number }>();
  for (const r of data ?? []) {
    const k = r.page_id as string;
    const cur = bucket.get(k) ?? { impressions: 0, clicks: 0, conversions: 0, leads: 0 };
    cur.impressions += Number(r.impressions ?? 0);
    cur.clicks += Number(r.clicks ?? 0);
    cur.conversions += Number(r.conversions ?? 0);
    cur.leads += Number(r.leads ?? 0);
    bucket.set(k, cur);
  }
  const ranked = [...bucket.entries()]
    .map(([page_id, m]) => ({ page_id, ...m, ctr: m.impressions ? m.clicks / m.impressions : 0 }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
  if (!ranked.length) return [];
  const { data: pages } = await admin.from("pseo_pages")
    .select("id, slug, title, page_type").in("id", ranked.map((r) => r.page_id));
  const map = new Map((pages ?? []).map((p) => [p.id as string, p]));
  return ranked.map((r) => ({ ...r, page: map.get(r.page_id) ?? null }));
}

export async function decliningPages(days = 30, limit = 50) {
  const admin = await getAdmin();
  const half = Math.floor(days / 2);
  const nowIso = new Date().toISOString().slice(0, 10);
  const midIso = new Date(Date.now() - half * 86400000).toISOString().slice(0, 10);
  const startIso = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const { data } = await admin.from("pseo_analytics_daily")
    .select("page_id, day, clicks").gte("day", startIso);
  const before = new Map<string, number>();
  const after = new Map<string, number>();
  for (const r of data ?? []) {
    const key = r.page_id as string;
    if ((r.day as string) < midIso) before.set(key, (before.get(key) ?? 0) + Number(r.clicks ?? 0));
    else after.set(key, (after.get(key) ?? 0) + Number(r.clicks ?? 0));
  }
  const rows = [...new Set([...before.keys(), ...after.keys()])].map((id) => {
    const b = before.get(id) ?? 0, a = after.get(id) ?? 0;
    return { page_id: id, before: b, after: a, delta: a - b };
  }).filter((x) => x.before >= 5 && x.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, limit);
  void nowIso;
  return rows;
}
