// Marketing Agent master tick — one bounded pass per invocation. Executes
// the daily workflow the user described: review analytics → learn → plan →
// decide → execute (subject to approval level) → generate reports.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentRow } from "./types";
import { reviewYesterday } from "./analytics-review.server";
import { runLearningLoop } from "./learning-loop.server";
import { generatePlan, coerceDailyPlan } from "./planner.server";
import { proposeDecisions, recordDecision, executeDecision } from "./decision-engine.server";
import { generateGrowthRecommendations } from "./growth-engine.server";
import { recommendSocialStrategy } from "./social-engine.server";
import { runSeoSweep } from "./seo-engine.server";
import { generateReport } from "./reporting.server";
import { topWins } from "./knowledge-base.server";

type Admin = SupabaseClient<never, "public", "public", never, never>;

const MAX_AGENTS_PER_TICK = 5;
const MAX_DECISIONS_EXECUTED_PER_TICK = 20;

function nextTickAt(agent: AgentRow): string {
  // Daily cadence — next tick 6 hours from now to allow multiple passes.
  return new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
}

export async function runMarketingAgentTick(admin: Admin) {
  const nowIso = new Date().toISOString();
  const { data: dueAgents } = await admin
    .from("ma_agents")
    .select("*")
    .eq("status", "active")
    .or(`next_tick_at.is.null,next_tick_at.lte.${nowIso}`)
    .order("next_tick_at", { ascending: true, nullsFirst: true })
    .limit(MAX_AGENTS_PER_TICK);

  const stats = { agents: 0, decisions_proposed: 0, decisions_executed: 0, plans: 0, reports: 0 };

  for (const row of (dueAgents ?? []) as AgentRow[]) {
    stats.agents += 1;
    try {
      // 1) Analytics review
      const metrics = await reviewYesterday(admin, row.id);

      // 2) Learning loop — turn recent performance into memory
      await runLearningLoop(admin, row.id);

      // 3) Daily plan (always) + one specialized plan per tick
      const wins = await topWins(admin, row.id, "winning_subject", 5);
      const dailyRaw = await generatePlan(row, "daily", { yesterdayMetrics: metrics, recentWins: wins as never });
      const daily = coerceDailyPlan(dailyRaw);
      await admin.from("ma_plans").insert({
        agent_id: row.id,
        horizon: "daily",
        period_start: daily.date,
        period_end: daily.date,
        status: "active",
        plan: daily as never,
      });
      stats.plans += 1;

      // Rotate through weekly/monthly on Mondays/1st.
      const now = new Date();
      if (now.getUTCDay() === 1) {
        const weekly = await generatePlan(row, "weekly", { yesterdayMetrics: metrics });
        const end = new Date(now); end.setDate(now.getDate() + 6);
        await admin.from("ma_plans").insert({
          agent_id: row.id, horizon: "weekly",
          period_start: now.toISOString().slice(0, 10),
          period_end: end.toISOString().slice(0, 10),
          status: "active", plan: weekly as never,
        });
        stats.plans += 1;
      }

      // 4) Social + Growth + SEO recommendations
      if (row.auto_social || row.approval_level !== "suggest_only") {
        await recommendSocialStrategy(admin, row, metrics);
      }
      await generateGrowthRecommendations(admin, row);
      await runSeoSweep(admin, row.id);

      // 5) Decision engine
      const proposals = await proposeDecisions(row, metrics);
      stats.decisions_proposed += proposals.length;
      const decisionIds: string[] = [];
      for (const p of proposals) {
        const id = await recordDecision(admin, row, p);
        if (id) decisionIds.push(id);
      }

      // 6) Execute approved decisions up to per-tick cap
      const { data: approved } = await admin
        .from("ma_decisions")
        .select("id")
        .eq("agent_id", row.id)
        .eq("state", "approved")
        .order("created_at", { ascending: true })
        .limit(MAX_DECISIONS_EXECUTED_PER_TICK);
      for (const d of approved ?? []) {
        const r = await executeDecision(admin, (d as { id: string }).id);
        if (r.ok) stats.decisions_executed += 1;
      }

      // 7) Morning brief once per day
      const { data: todayBrief } = await admin
        .from("ma_reports")
        .select("id")
        .eq("agent_id", row.id)
        .eq("kind", "morning_brief")
        .gte("created_at", new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString())
        .maybeSingle();
      if (!todayBrief) {
        await generateReport(admin, row, "morning_brief");
        stats.reports += 1;
      }

      await admin.from("ma_agents").update({
        last_tick_at: nowIso,
        next_tick_at: nextTickAt(row),
      }).eq("id", row.id);
    } catch (e) {
      await admin.from("ma_agents").update({
        last_tick_at: nowIso,
        next_tick_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }).eq("id", row.id);
      // Non-fatal; log via decision so it's visible in the timeline.
      await admin.from("ma_decisions").insert({
        agent_id: row.id,
        kind: "other",
        action: { error: e instanceof Error ? e.message : String(e) } as never,
        rationale: "tick_failure",
        confidence: 0,
        state: "failed",
      });
    }
  }
  return stats;
}
