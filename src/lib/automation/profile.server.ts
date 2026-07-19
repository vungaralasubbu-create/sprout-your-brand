/**
 * Server-only helpers to roll automation_events into automation_user_profiles.
 * Not imported at module scope by client code.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Sb = SupabaseClient<Database>;

const INACTIVITY_DAYS = 30;

export async function rollupUserProfile(supabase: Sb, userId: string): Promise<void> {
  // Aggregate recent events for this user
  const { data: events } = await supabase
    .from("automation_events")
    .select("event_name, properties, occurred_at")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(500);

  const rows = events ?? [];
  if (rows.length === 0) return;

  const lastActive = rows[0].occurred_at;
  const totalLogins = rows.filter((r) => r.event_name === "login").length;
  const totalPageViews = rows.filter((r) => r.event_name === "page_view").length;
  const totalCourseViews = rows.filter((r) => r.event_name === "course_view").length;
  const payments = rows.filter((r) => r.event_name === "payment");
  const revenue = payments.reduce((sum, p) => {
    const props = (p.properties ?? {}) as Record<string, unknown>;
    const amt = typeof props.amount === "number" ? props.amount : 0;
    return sum + amt;
  }, 0);

  // Interest extraction: most-viewed categories from course_view events
  const interestCounts = new Map<string, number>();
  for (const r of rows.filter((r) => r.event_name === "course_view")) {
    const props = (r.properties ?? {}) as Record<string, unknown>;
    const cat = typeof props.category === "string" ? props.category : null;
    if (cat) interestCounts.set(cat, (interestCounts.get(cat) ?? 0) + 1);
  }
  const topInterests = [...interestCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  // Engagement score (0-100): mix of recency, frequency, revenue
  const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / 86400000;
  const recency = Math.max(0, 40 - daysSinceActive * 1.3);
  const frequency = Math.min(30, totalPageViews * 0.5 + totalCourseViews * 1.2 + totalLogins * 1.5);
  const monetization = Math.min(30, revenue / 200);
  const engagementScore = Math.round(Math.min(100, recency + frequency + monetization));

  const segments: string[] = [];
  if (daysSinceActive > INACTIVITY_DAYS) segments.push("inactive");
  if (totalCourseViews >= 5) segments.push("high_intent");
  if (payments.length >= 1) segments.push("customer");
  if (payments.length >= 3) segments.push("repeat_customer");
  if (rows.some((r) => r.event_name === "certificate_earned")) segments.push("certified");
  if (rows.some((r) => r.event_name === "wishlist_add")) segments.push("wishlist_active");

  await supabase.from("automation_user_profiles").upsert({
    user_id: userId,
    last_active_at: lastActive,
    total_course_views: totalCourseViews,
    total_page_views: totalPageViews,
    total_logins: totalLogins,
    top_interests: topInterests as never,
    lifetime_revenue: revenue,
    engagement_score: engagementScore,
    ai_segment_labels: segments,
  });
}

export async function rollupActiveProfiles(supabase: Sb, limit = 200): Promise<number> {
  // Users with events in the last 24h
  const since = new Date(Date.now() - 86400000).toISOString();
  const { data: recent } = await supabase
    .from("automation_events")
    .select("user_id")
    .gte("occurred_at", since)
    .limit(2000);

  const ids = new Set<string>();
  for (const r of recent ?? []) if (r.user_id) ids.add(r.user_id);
  const list = [...ids].slice(0, limit);

  let done = 0;
  for (const id of list) {
    try {
      await rollupUserProfile(supabase, id);
      done += 1;
    } catch (err) {
      console.error("[automation] rollup failed", id, err);
    }
  }
  return done;
}
