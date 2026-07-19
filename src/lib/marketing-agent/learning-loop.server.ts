// Learning loop — reads recent published assets/posts/emails, computes a
// simple performance score, and writes the top performers into ma_knowledge
// so tomorrow's planner has winning patterns to imitate.

// New ma_* tables aren't in generated Database types yet; use permissive client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;
import { remember } from "./knowledge-base.server";

type Admin = AnySupabase;

function ctrScore(impressions: number, clicks: number, weight = 1) {
  if (impressions <= 0) return 0;
  return (clicks / impressions) * 100 * weight;
}

export async function runLearningLoop(admin: Admin, agentId: string) {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Winning social posts by CTR.
  const { data: socialRows } = await admin
    .from("soc_analytics")
    .select("post_id, impressions, clicks, reactions, shares, comments, day")
    .gte("day", since.slice(0, 10))
    .limit(500);
  const bySocialPost = new Map<string, { imp: number; clk: number }>();
  for (const r of socialRows ?? []) {
    const row = r as Record<string, unknown>;
    const id = String(row.post_id ?? "");
    if (!id) continue;
    const b = bySocialPost.get(id) ?? { imp: 0, clk: 0 };
    b.imp += Number(row.impressions ?? 0);
    b.clk += Number(row.clicks ?? 0);
    bySocialPost.set(id, b);
  }
  for (const [postId, b] of bySocialPost) {
    const score = ctrScore(b.imp, b.clk);
    if (score <= 0) continue;
    await remember(admin, agentId, "winning_creative", `soc:${postId}`, { post_id: postId, impressions: b.imp, clicks: b.clk }, score);
  }

  // Winning email subjects by open+click rate.
  const { data: emails } = await admin
    .from("engage_messages")
    .select("id, subject, opened_at, clicked_at")
    .gte("created_at", since)
    .limit(2000);
  const bySubject = new Map<string, { sent: number; open: number; click: number }>();
  for (const r of emails ?? []) {
    const row = r as { subject?: string | null; opened_at?: string | null; clicked_at?: string | null };
    const s = (row.subject ?? "").trim();
    if (!s) continue;
    const b = bySubject.get(s) ?? { sent: 0, open: 0, click: 0 };
    b.sent += 1;
    if (row.opened_at) b.open += 1;
    if (row.clicked_at) b.click += 1;
    bySubject.set(s, b);
  }
  for (const [subject, b] of bySubject) {
    if (b.sent < 5) continue;
    const score = (b.open / b.sent) * 60 + (b.click / b.sent) * 40;
    await remember(admin, agentId, "winning_subject", subject.slice(0, 200), { subject, ...b }, score);
  }
}
