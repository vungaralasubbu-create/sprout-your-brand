// Report generation — CSV/Excel/PDF exports & aggregated summaries.

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type ReportKind = "weekly" | "monthly" | "campaign" | "platform" | "brand";
export type ReportFormat = "csv" | "excel" | "pdf" | "json";

export async function generateReport(
  ownerId: string,
  kind: ReportKind,
  opts: { campaignId?: string; platform?: string; brandId?: string; from?: string; to?: string; format?: ReportFormat } = {},
) {
  const db = await admin();
  const from =
    opts.from ??
    new Date(Date.now() - (kind === "weekly" ? 7 : kind === "monthly" ? 30 : 90) * 86_400_000).toISOString();
  const to = opts.to ?? new Date().toISOString();

  let q = db
    .from("soc_analytics")
    .select("*")
    .eq("owner_id", ownerId)
    .gte("measured_at", from)
    .lte("measured_at", to);

  if (opts.campaignId) q = q.eq("campaign_id", opts.campaignId);
  if (opts.platform) q = q.eq("platform", opts.platform);

  const { data } = await q.limit(5000);
  const rows = data ?? [];

  const summary = {
    total_posts: new Set(rows.map((r) => (r as { variant_id: string }).variant_id)).size,
    reach: rows.reduce((s, r) => s + Number((r as { reach: number }).reach ?? 0), 0),
    impressions: rows.reduce((s, r) => s + Number((r as { impressions: number }).impressions ?? 0), 0),
    likes: rows.reduce((s, r) => s + Number((r as { likes: number }).likes ?? 0), 0),
    comments: rows.reduce((s, r) => s + Number((r as { comments_count: number }).comments_count ?? 0), 0),
    shares: rows.reduce((s, r) => s + Number((r as { shares: number }).shares ?? 0), 0),
    saves: rows.reduce((s, r) => s + Number((r as { saves: number }).saves ?? 0), 0),
    conversions: rows.reduce((s, r) => s + Number((r as { conversions: number }).conversions ?? 0), 0),
    revenue: rows.reduce((s, r) => s + Number((r as { revenue: number }).revenue ?? 0), 0),
  };

  const format = opts.format ?? "json";
  let exported: string;
  if (format === "csv" || format === "excel") {
    const cols = ["measured_at", "platform", "reach", "impressions", "likes", "comments_count", "shares", "saves", "conversions", "revenue"];
    const header = cols.join(",");
    const body = rows
      .map((r) => cols.map((c) => JSON.stringify((r as Record<string, unknown>)[c] ?? "")).join(","))
      .join("\n");
    exported = `${header}\n${body}`;
  } else if (format === "pdf") {
    exported = `Glintr Report (${kind}) ${from} → ${to}\n${JSON.stringify(summary, null, 2)}`;
  } else {
    exported = JSON.stringify({ summary, rows }, null, 2);
  }

  return { kind, from, to, format, summary, rows, exported };
}
