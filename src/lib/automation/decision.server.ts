/**
 * AI Decision Engine — decides the next-best action per user based on their
 * behavior profile, and writes automation_recommendations.
 *
 * Uses Lovable AI Gateway (google/gemini-3.5-flash) to score candidate actions
 * from a rule catalog, then persists top picks.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Sb = SupabaseClient<Database>;

interface RuleCandidate {
  kind: string;
  title: string;
  reason: string;
  baseScore: number;
  matches: (profile: ProfileRow, latestEvents: EventRow[]) => boolean;
}

type ProfileRow = Database["public"]["Tables"]["automation_user_profiles"]["Row"];
type EventRow = Pick<Database["public"]["Tables"]["automation_events"]["Row"], "event_name" | "occurred_at" | "properties">;

/**
 * Static rule catalog implementing the campaigns from the product spec.
 * Each rule is a candidate action; the AI ranker refines final scoring.
 */
const RULES: RuleCandidate[] = [
  {
    kind: "welcome_back",
    title: "Welcome back — pick up where you left off",
    reason: "You signed up but haven't logged in recently.",
    baseScore: 65,
    matches: (p) => p.total_logins <= 1 && (p.total_page_views ?? 0) > 0,
  },
  {
    kind: "ai_course_recommendation",
    title: "AI courses that match your interest",
    reason: "You've viewed AI programs multiple times.",
    baseScore: 82,
    matches: (p) => {
      const interests = (p.top_interests ?? []) as Array<{ category: string; count: number }>;
      return interests.some((i) => /ai|artificial|ml|data/i.test(i.category) && i.count >= 3);
    },
  },
  {
    kind: "internship_after_course",
    title: "Ready for a paid internship?",
    reason: "You completed a course — apply for the aligned internship.",
    baseScore: 88,
    matches: (_p, e) => e.some((r) => r.event_name === "certificate_earned"),
  },
  {
    kind: "placement_program",
    title: "Move to a placement program",
    reason: "You earned a certificate — unlock placement support.",
    baseScore: 90,
    matches: (p, e) => e.some((r) => r.event_name === "certificate_earned") && p.lifetime_revenue > 0,
  },
  {
    kind: "winback",
    title: "We miss you — a fresh offer just for you",
    reason: "Inactive for over 30 days.",
    baseScore: 70,
    matches: (p) => (p.ai_segment_labels ?? []).includes("inactive"),
  },
  {
    kind: "premium_subscription",
    title: "Unlock unlimited AI programs",
    reason: "You've engaged with several AI courses — Premium fits.",
    baseScore: 78,
    matches: (p) => (p.ai_segment_labels ?? []).includes("repeat_customer"),
  },
];

async function callLovableAIJson<T>(prompt: string): Promise<T | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: "You are an expert lifecycle marketing AI for an EdTech platform. Return ONLY valid JSON with the requested keys." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const content: string = body?.choices?.[0]?.message?.content ?? "";
    const cleaned = content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export async function decideForUser(supabase: Sb, userId: string): Promise<number> {
  const { data: profile } = await supabase
    .from("automation_user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return 0;

  const { data: events } = await supabase
    .from("automation_events")
    .select("event_name, occurred_at, properties")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  const eventRows = (events ?? []) as EventRow[];
  const candidates = RULES.filter((r) => r.matches(profile as ProfileRow, eventRows));
  if (candidates.length === 0) return 0;

  // AI re-rank + rewrite copy for the top candidates
  const summary = {
    engagement_score: profile.engagement_score,
    segments: profile.ai_segment_labels,
    top_interests: profile.top_interests,
    lifetime_revenue: profile.lifetime_revenue,
    total_course_views: profile.total_course_views,
    last_active_at: profile.last_active_at,
  };

  const ranked = await callLovableAIJson<{ ranked: Array<{ kind: string; score: number; reason: string; title: string }> }>(
    `User signals:\n${JSON.stringify(summary)}\n\nCandidate actions:\n${JSON.stringify(candidates.map((c) => ({ kind: c.kind, title: c.title, reason: c.reason, base: c.baseScore })))}\n\nReturn: { "ranked": [{ "kind": "...", "score": 0-100, "title": "...", "reason": "..." }] } — sorted by score desc, up to 3 items.`,
  );

  const finalPicks = ranked?.ranked?.length
    ? ranked.ranked
    : candidates.slice(0, 3).map((c) => ({ kind: c.kind, score: c.baseScore, title: c.title, reason: c.reason }));

  // Clear stale recs, insert new
  await supabase.from("automation_recommendations").delete().eq("user_id", userId).is("dismissed_at", null);
  const rows = finalPicks.slice(0, 3).map((p) => ({
    user_id: userId,
    brand_id: profile.brand_id,
    kind: p.kind,
    title: p.title,
    reason: p.reason,
    score: p.score,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  }));
  if (rows.length) await supabase.from("automation_recommendations").insert(rows);

  // Update next_best_action on profile
  await supabase
    .from("automation_user_profiles")
    .update({ next_best_action: rows[0] ? (rows[0] as never) : null })
    .eq("user_id", userId);

  return rows.length;
}

export async function decideForActiveUsers(supabase: Sb, limit = 50): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from("automation_user_profiles")
    .select("user_id")
    .gte("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(limit);
  let total = 0;
  for (const row of data ?? []) {
    try {
      total += await decideForUser(supabase, row.user_id);
    } catch (err) {
      console.error("[automation] decide failed", row.user_id, err);
    }
  }
  return total;
}
