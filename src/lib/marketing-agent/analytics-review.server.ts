// Reviews yesterday's performance across all Glintr surfaces and produces a
// compact metrics snapshot the planner + learning loop consume. Reads only —
// no side effects beyond persisting the ma_metrics_snapshots row.

// New ma_* tables aren't in generated Database types yet; use permissive client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

type Admin = AnySupabase;

function ymd(d: Date): string { return d.toISOString().slice(0, 10); }

export async function reviewYesterday(admin: Admin, agentId: string) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const day = ymd(yesterday);

  // Cheap parallel reads across marketing surfaces. Missing tables/columns
  // simply return zeros — the agent still makes a decision.
  const [social, marketing, blog, email, enroll, seo] = await Promise.all([
    admin.from("soc_analytics").select("impressions,clicks,reactions,comments,shares,day").gte("day", day).lte("day", day),
    admin.from("mkt_analytics").select("impressions,clicks,conversions,cost,revenue,day").gte("day", day).lte("day", day),
    admin.from("blog_analytics_daily").select("views,unique_views,ctr,day").gte("day", day).lte("day", day),
    admin.from("engage_messages").select("id,status,opened_at,clicked_at,created_at").gte("created_at", `${day}T00:00:00Z`).lt("created_at", `${day}T23:59:59Z`),
    admin.from("enrollments").select("id,created_at").gte("created_at", `${day}T00:00:00Z`).lt("created_at", `${day}T23:59:59Z`),
    admin.from("blog_seo_scores").select("score,day:updated_at").limit(20),
  ]);

  const sum = (rows: unknown[] | null | undefined, key: string): number =>
    (rows ?? []).reduce<number>(
      (n, r) => n + Number((r as Record<string, unknown>)[key] ?? 0),
      0,
    );

  const emails = (email.data ?? []) as Array<{ status?: string; opened_at?: string | null; clicked_at?: string | null }>;
  const metrics = {
    day,
    social: {
      impressions: sum(social.data as unknown[], "impressions"),
      clicks: sum(social.data as unknown[], "clicks"),
      reactions: sum(social.data as unknown[], "reactions"),
      comments: sum(social.data as unknown[], "comments"),
      shares: sum(social.data as unknown[], "shares"),
    },
    campaigns: {
      impressions: sum(marketing.data as unknown[], "impressions"),
      clicks: sum(marketing.data as unknown[], "clicks"),
      conversions: sum(marketing.data as unknown[], "conversions"),
      cost: sum(marketing.data as unknown[], "cost"),
      revenue: sum(marketing.data as unknown[], "revenue"),
    },
    blog: {
      views: sum(blog.data as unknown[], "views"),
      unique_views: sum(blog.data as unknown[], "unique_views"),
    },
    email: {
      sent: emails.length,
      opens: emails.filter((r) => !!r.opened_at).length,
      clicks: emails.filter((r) => !!r.clicked_at).length,
      failed: emails.filter((r) => r.status === "failed").length,
    },
    enrollments: (enroll.data ?? []).length,
    seo_avg_score: (() => {
      const rows = (seo.data ?? []) as Array<{ score?: number }>;
      if (!rows.length) return 0;
      return rows.reduce((n, r) => n + Number(r.score ?? 0), 0) / rows.length;
    })(),
  };

  await admin.from("ma_metrics_snapshots").upsert(
    { agent_id: agentId, day, metrics: metrics as never },
    { onConflict: "agent_id,day" },
  );
  return metrics;
}
