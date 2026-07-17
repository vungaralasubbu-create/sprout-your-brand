/**
 * AI Enrollment Brain — the central decision engine of Glintr.
 *
 * Continuously scores every active lead into a `brain_decisions` row that
 * drives the enrollment dashboard: priority, best channel, best time,
 * recommended course, expected revenue/close date, scholarship, urgency,
 * counsellor assignment, drop-off reason, parent mode, health score.
 *
 * Also produces: forecast snapshots, drop-off analyses, real-time alerts
 * (hot lead returns, no-follow-up escalation, payment failed, etc.),
 * counsellor routing recommendations, nurture queueing, and a free-form
 * "Ask the Brain" answer surface.
 *
 * All functions are guarded by `is_copilot_user` so students/partners
 * cannot access brain data.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callLovableAiJson, callLovableAiText, isAiAvailable } from "@/lib/ai-gateway.server";

const BRAIN_MODEL = "google/gemini-3.5-flash";

async function assertBrainAccess(context: {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };
  userId: string;
}) {
  const { data, error } = await context.supabase.rpc("is_copilot_user", { _uid: context.userId });
  if (error || !data) throw new Error("Forbidden: Enrollment Brain is restricted.");
}

// ============================================================
// Types
// ============================================================
export interface BrainDecision {
  lead_id: string;
  priority: "critical" | "very_high" | "high" | "medium" | "low" | "dormant";
  urgency: "immediate" | "same_day" | "this_week" | "normal" | "nurture";
  best_channel: "phone" | "whatsapp" | "email" | "sms" | "video_meeting" | "parent_call" | "no_contact";
  best_time_window: "morning" | "afternoon" | "evening" | "weekend" | "any";
  best_time_reason: string;
  recommended_course: string;
  secondary_course?: string;
  expected_close_date: string; // ISO date
  expected_revenue: number;
  scholarship_pct: number; // 0,5,10,15,20
  scholarship_type: "none" | "flat" | "merit" | "referral" | "festival" | "corporate";
  scholarship_reason: string;
  health_score: number; // 0-100
  engagement_score: number; // 0-100
  buying_intent: "very_high" | "high" | "medium" | "low" | "very_low";
  probability_pct: number;
  needs_parent_mode: boolean;
  drop_off_reason?: string;
  reasoning: string;
}

// ============================================================
// Helpers
// ============================================================
function compactEvents(events: Array<Record<string, unknown>>): string {
  return events
    .slice(0, 25)
    .map((e) => `${String(e.created_at).slice(0, 16)} ${e.event_type}${e.page_path ? " " + e.page_path : ""}`)
    .join("\n");
}

function summariseLead(lead: Record<string, unknown>, events: Array<Record<string, unknown>>): string {
  return [
    `Name: ${lead.name ?? "-"} | Phone: ${lead.phone ?? "-"} | Email: ${lead.email ?? "-"}`,
    `Interest: ${lead.interested_course ?? lead.predicted_course ?? "-"} | Career: ${lead.career_interest ?? "-"}`,
    `Budget: ${lead.budget_range ?? "-"} | Timing: ${lead.preferred_timing ?? "-"}`,
    `Region: ${lead.country ?? "-"} ${lead.city ?? ""} | Source: ${lead.source ?? "-"}`,
    `Score: ${lead.score ?? 0} (${lead.score_category ?? "?"}) | Probability: ${lead.probability ?? 0}%`,
    `Visits: ${lead.visit_count ?? 0} | Events: ${lead.event_count ?? 0} | Status: ${lead.status ?? "-"}`,
    `Last activity: ${lead.last_activity_at ?? "-"}`,
    `Recent behaviour:\n${compactEvents(events)}`,
  ].join("\n");
}

const DECISION_SCHEMA_PROMPT = `Return strictly this JSON:
{
 "priority": "critical|very_high|high|medium|low|dormant",
 "urgency": "immediate|same_day|this_week|normal|nurture",
 "best_channel": "phone|whatsapp|email|sms|video_meeting|parent_call|no_contact",
 "best_time_window": "morning|afternoon|evening|weekend|any",
 "best_time_reason": string,
 "recommended_course": string,
 "secondary_course": string,
 "expected_close_date": "YYYY-MM-DD",
 "expected_revenue": number,
 "scholarship_pct": 0|5|10|15|20,
 "scholarship_type": "none|flat|merit|referral|festival|corporate",
 "scholarship_reason": string,
 "health_score": 0-100,
 "engagement_score": 0-100,
 "buying_intent": "very_high|high|medium|low|very_low",
 "probability_pct": 0-100,
 "needs_parent_mode": boolean,
 "drop_off_reason": string,
 "reasoning": string
}
Rules:
- Never over-discount. Default scholarship_pct=0 unless there is clear evidence (budget objection, competitor comparison, EMI focus).
- expected_close_date is realistic (7-45 days from today for warm leads).
- expected_revenue uses ₹35,000-₹150,000 typical range for Indian EdTech.
- If phone missing → best_channel cannot be phone/whatsapp/sms; use email.
- If lead mentions parent OR is student age → needs_parent_mode=true.
- reasoning is 2-3 sentences, actionable.`;

// ============================================================
// analyzeSingleLead — build one decision (used inside tick + on demand)
// ============================================================
async function computeDecision(supabase: never, leadId: string): Promise<BrainDecision | null> {
  const client = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, v: string) => {
          maybeSingle: () => Promise<{ data: unknown }>;
          order?: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> };
        };
      };
    };
  };
  const { data: lead } = (await client.from("platform_leads").select("*").eq("id", leadId).maybeSingle()) as {
    data: Record<string, unknown> | null;
  };
  if (!lead) return null;
  const { data: events } = (await client
    .from("platform_lead_events")
    .select("event_type,page_path,metadata,created_at")
    .eq("lead_id", leadId)
    .order!("created_at", { ascending: false })
    .limit(30)) as { data: Array<Record<string, unknown>> | null };

  if (!isAiAvailable()) throw new Error("LOVABLE_API_KEY missing");

  const decision = await callLovableAiJson<Omit<BrainDecision, "lead_id">>({
    model: BRAIN_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are the Glintr AI Enrollment Brain — the central decision engine choosing what to do next for every lead. Be decisive, honest, and never invent facts. " +
          DECISION_SCHEMA_PROMPT,
      },
      { role: "user", content: summariseLead(lead, events ?? []) },
    ],
  });
  return { ...decision, lead_id: leadId };
}

async function persistDecision(supabase: unknown, d: BrainDecision) {
  const client = supabase as { from: (t: string) => { upsert: (row: unknown, opts?: unknown) => Promise<unknown> } };
  await client.from("brain_decisions").upsert(
    {
      lead_id: d.lead_id,
      priority: d.priority,
      urgency: d.urgency,
      best_channel: d.best_channel,
      best_time_window: d.best_time_window,
      best_time_reason: d.best_time_reason,
      recommended_course: d.recommended_course,
      secondary_course: d.secondary_course ?? null,
      expected_close_date: d.expected_close_date,
      expected_revenue: d.expected_revenue,
      scholarship_pct: d.scholarship_pct,
      scholarship_type: d.scholarship_type,
      scholarship_reason: d.scholarship_reason,
      health_score: d.health_score,
      engagement_score: d.engagement_score,
      buying_intent: d.buying_intent,
      probability_pct: d.probability_pct,
      needs_parent_mode: d.needs_parent_mode,
      drop_off_reason: d.drop_off_reason ?? null,
      reasoning: d.reasoning,
      model: BRAIN_MODEL,
      computed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "lead_id" },
  );

  if (d.drop_off_reason) {
    await (client.from("brain_dropoffs") as unknown as { insert: (r: unknown) => Promise<unknown> }).insert({
      lead_id: d.lead_id,
      reason: d.drop_off_reason,
      evidence: d.reasoning,
    });
  }
}

// ============================================================
// Public: manually recompute decision for one lead
// ============================================================
export const recomputeLeadDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ leadId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertBrainAccess(context as never);
    const decision = await computeDecision(context.supabase as never, data.leadId);
    if (!decision) throw new Error("Lead not found");
    await persistDecision(context.supabase, decision);
    return decision;
  });

// ============================================================
// Auto counsellor matching
// ============================================================
export const autoAssignCounsellor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ leadId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertBrainAccess(context as never);
    const supabase = context.supabase as never as {
      from: (t: string) => {
        select: (c: string) => {
          eq?: (col: string, v: string) => { maybeSingle: () => Promise<{ data: unknown }> };
          order?: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> };
        };
        update?: (r: unknown) => { eq: (c: string, v: string) => Promise<unknown> };
      };
    };
    const { data: lead } = (await supabase.from("platform_leads").select("*").eq!("id", data.leadId).maybeSingle()) as {
      data: Record<string, unknown> | null;
    };
    if (!lead) throw new Error("Lead not found");

    const { data: profiles } = (await supabase
      .from("counsellor_profiles")
      .select("*")
      .eq!("active", "true")
      .maybeSingle
      ? await supabase.from("counsellor_profiles").select("*").eq!("active", "true").maybeSingle()
      : { data: [] }) as { data: unknown };
    // Simpler safe list query:
    const { data: activeCounsellors } = (await (
      supabase.from("counsellor_profiles") as unknown as {
        select: (c: string) => {
          order: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> };
        };
      }
    )
      .select("*")
      .order("conversion_rate", { ascending: false })
      .limit(50)) as { data: Array<Record<string, unknown>> | null };

    const pool = (activeCounsellors ?? []).filter((c) => c.active !== false);
    if (pool.length === 0) return { assigned: null, reason: "No active counsellors available." };

    // Score each counsellor
    const interest = String(lead.interested_course ?? lead.predicted_course ?? "").toLowerCase();
    const region = String(lead.country ?? "").toLowerCase();
    let best: Record<string, unknown> | null = null;
    let bestScore = -1;
    let bestReason = "";
    for (const c of pool) {
      const workloadRatio = (c.current_workload as number) / Math.max(1, c.capacity as number);
      if (workloadRatio >= 1) continue;
      const specialtyMatch = (c.specialties as string[])?.some((s) => interest.includes(s.toLowerCase())) ? 30 : 0;
      const regionMatch = region && String(c.region ?? "").toLowerCase() === region ? 10 : 0;
      const conv = Number(c.conversion_rate ?? 0);
      const response = Math.max(0, 10 - Math.floor(Number(c.avg_response_seconds ?? 600) / 60));
      const load = Math.round((1 - workloadRatio) * 20);
      const score = specialtyMatch + regionMatch + conv + response + load;
      if (score > bestScore) {
        bestScore = score;
        best = c;
        bestReason = [
          specialtyMatch ? "course specialty match" : null,
          regionMatch ? "region match" : null,
          `${conv}% conversion`,
          `${Math.round((1 - workloadRatio) * 100)}% free capacity`,
        ]
          .filter(Boolean)
          .join(" · ");
      }
    }
    if (!best) return { assigned: null, reason: "All counsellors at capacity." };

    await (supabase.from("brain_decisions") as unknown as {
      update: (r: unknown) => { eq: (c: string, v: string) => Promise<unknown> };
    })
      .update({ assigned_counsellor_id: best.user_id, assignment_reason: bestReason })
      .eq("lead_id", data.leadId);

    await (supabase.from("counsellor_profiles") as unknown as {
      update: (r: unknown) => { eq: (c: string, v: string) => Promise<unknown> };
    })
      .update({ current_workload: (best.current_workload as number) + 1 })
      .eq("user_id", best.user_id as string);

    return {
      assigned: String(best.user_id ?? ""),
      name: String(best.display_name ?? ""),
      reason: bestReason,
    };
  });

// ============================================================
// Ask the Brain
// ============================================================
export const askEnrollmentBrain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ question: z.string().min(2).max(400) }).parse(i))
  .handler(async ({ data, context }): Promise<{ answer: string }> => {
    await assertBrainAccess(context as never);
    const supabase = context.supabase as never as {
      from: (t: string) => {
        select: (c: string) => {
          order: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> };
        };
      };
    };
    const { data: topDecisions } = (await supabase
      .from("brain_decisions")
      .select("lead_id,priority,best_channel,recommended_course,expected_revenue,expected_close_date,scholarship_pct,probability_pct,reasoning")
      .order("probability_pct", { ascending: false })
      .limit(30)) as { data: unknown[] };

    const answer = await callLovableAiText({
      model: BRAIN_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are the Glintr AI Enrollment Brain. Answer the counsellor/manager's question in <=140 words using ONLY the decisions listed. Use short bullets, be direct, cite lead ids or courses when useful.",
        },
        { role: "user", content: `DECISIONS:\n${JSON.stringify(topDecisions).slice(0, 6000)}\n\nQUESTION: ${data.question}` },
      ],
    });
    return { answer };
  });

// ============================================================
// Batch tick — runs from cron and from manual "Run brain now" button.
// ============================================================
export interface BrainTickResult {
  scanned: number;
  decided: number;
  forecast: {
    today: number;
    week: number;
    month: number;
    quarter: number;
    admissions: number;
    avg_ticket: number;
    conversion_rate: number;
  };
  alerts: number;
}

export async function runBrainTick(
  supabase: unknown,
  opts: { limit?: number; forceAll?: boolean } = {},
): Promise<BrainTickResult> {
  const client = supabase as never as {
    from: (t: string) => {
      select: (c: string, opts?: unknown) => {
        order?: (col: string, opts: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: unknown; count?: number }>;
        };
        gte?: (col: string, v: string) => {
          order: (col: string, opts: { ascending: boolean }) => {
            limit: (n: number) => Promise<{ data: unknown }>;
          };
        };
        in?: (col: string, values: string[]) => Promise<{ data: unknown }>;
      };
      insert?: (r: unknown) => Promise<unknown>;
    };
  };

  const limit = opts.limit ?? 20;
  // Pull top-priority active leads: hot/warm or updated in last 7 days
  const cutoff = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data: leads } = (await client
    .from("platform_leads")
    .select("id,score,score_category,last_activity_at,status,phone,email")
    .gte!("last_activity_at", cutoff)
    .order("score", { ascending: false })
    .limit(limit * 3)) as { data: Array<Record<string, unknown>> | null };

  const candidates = (leads ?? [])
    .filter((l) => String(l.status ?? "") !== "enrolled" && String(l.status ?? "") !== "lost")
    .slice(0, limit);

  // Skip leads decided in the last 30 min unless forceAll
  const { data: recent } = (await (client.from("brain_decisions") as unknown as {
    select: (c: string) => { in: (col: string, v: string[]) => Promise<{ data: unknown }> };
  })
    .select("lead_id,updated_at")
    .in(
      "lead_id",
      candidates.map((c) => c.id as string),
    )) as { data: Array<{ lead_id: string; updated_at: string }> | null };
  const recentMap = new Map((recent ?? []).map((r) => [r.lead_id, new Date(r.updated_at).getTime()]));
  const cutoffMs = Date.now() - 30 * 60_000;

  let decided = 0;
  for (const l of candidates) {
    if (!opts.forceAll) {
      const t = recentMap.get(l.id as string);
      if (t && t > cutoffMs) continue;
    }
    try {
      const d = await computeDecision(supabase as never, l.id as string);
      if (d) {
        await persistDecision(supabase, d);
        decided++;
      }
    } catch (err) {
      console.error("[brain-tick] decision failed", l.id, err);
    }
  }

  // Aggregate forecast from all decisions
  const { data: allDecisions } = (await (client.from("brain_decisions") as unknown as {
    select: (c: string) => {
      order: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> };
    };
  })
    .select("expected_revenue,expected_close_date,probability_pct,priority")
    .order("computed_at", { ascending: false })
    .limit(500)) as { data: Array<Record<string, unknown>> | null };

  const today = new Date();
  const day = 86400_000;
  const inRange = (d: string, days: number) => {
    const t = new Date(d).getTime();
    return t >= today.getTime() && t < today.getTime() + days * day;
  };

  const forecast = { today: 0, week: 0, month: 0, quarter: 0, admissions: 0, sum: 0, count: 0 };
  for (const d of allDecisions ?? []) {
    const rev = Number(d.expected_revenue ?? 0);
    const p = Number(d.probability_pct ?? 0) / 100;
    const ev = rev * p;
    const close = String(d.expected_close_date ?? "");
    if (inRange(close, 1)) forecast.today += ev;
    if (inRange(close, 7)) forecast.week += ev;
    if (inRange(close, 30)) {
      forecast.month += ev;
      forecast.admissions += p > 0.5 ? 1 : 0;
    }
    if (inRange(close, 90)) forecast.quarter += ev;
    forecast.sum += rev;
    forecast.count++;
  }
  const avg = forecast.count > 0 ? forecast.sum / forecast.count : 0;
  const conversion = forecast.count > 0 ? (forecast.admissions / forecast.count) * 100 : 0;

  await client.from("brain_forecasts").insert!({
    scope: "rolling",
    expected_revenue: Math.round(forecast.month),
    expected_admissions: forecast.admissions,
    avg_ticket_size: Math.round(avg),
    conversion_rate: Math.round(conversion * 100) / 100,
    hot_leads: candidates.filter((c) => c.score_category === "hot").length,
    warm_leads: candidates.filter((c) => c.score_category === "warm").length,
    breakdown: {
      today: Math.round(forecast.today),
      week: Math.round(forecast.week),
      month: Math.round(forecast.month),
      quarter: Math.round(forecast.quarter),
    },
  });

  // Rule-based alerts
  let alerts = 0;
  for (const l of candidates) {
    const score = Number(l.score ?? 0);
    if (score >= 90) {
      const lastActivity = l.last_activity_at ? new Date(l.last_activity_at as string).getTime() : 0;
      if (Date.now() - lastActivity < 30 * 60_000) {
        await client.from("brain_alerts").insert!({
          lead_id: l.id,
          type: "hot_lead_returned",
          severity: "critical",
          title: "🔥 Hot lead is on the site right now",
          message: `Score ${score}. Call within 5 minutes for best conversion.`,
        });
        alerts++;
      }
    }
  }

  // Auto-escalation: score >90 AND no follow-up within 4 hours
  const fourHrsAgo = Date.now() - 4 * 3600_000;
  for (const l of candidates) {
    if (Number(l.score ?? 0) < 90) continue;
    const { data: recentCall } = (await (client.from("counsellor_call_logs") as unknown as {
      select: (c: string) => {
        eq: (c: string, v: string) => {
          order: (c: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> };
        };
      };
    })
      .select("id,created_at")
      .eq("lead_id", l.id as string)
      .order("created_at", { ascending: false })
      .limit(1)) as { data: Array<{ created_at: string }> | null };
    const lastFollowUp = recentCall?.[0]?.created_at ? new Date(recentCall[0].created_at).getTime() : 0;
    if (lastFollowUp > fourHrsAgo) continue;

    // Reassign to senior counsellor
    const { data: seniors } = (await (client.from("counsellor_profiles") as unknown as {
      select: (c: string) => { eq: (c: string, v: boolean) => { limit: (n: number) => Promise<{ data: unknown }> } };
    })
      .select("user_id,display_name")
      .eq("is_senior", true)
      .limit(1)) as { data: Array<{ user_id: string; display_name: string }> | null };
    const senior = seniors?.[0];

    if (senior) {
      await (client.from("brain_decisions") as unknown as {
        update: (r: unknown) => { eq: (c: string, v: string) => Promise<unknown> };
      })
        .update({ assigned_counsellor_id: senior.user_id, assignment_reason: "Auto-escalation: score>90, no follow-up 4h" })
        .eq("lead_id", l.id as string);
    }
    await client.from("brain_alerts").insert!({
      lead_id: l.id,
      type: "escalation",
      severity: "critical",
      title: "⚠️ Escalated to senior counsellor",
      message: `Hot lead (score ${l.score}) had no follow-up in 4h. ${senior ? `Reassigned to ${senior.display_name}.` : "No senior counsellor available — team lead attention required."}`,
    });
    alerts++;
  }

  return {
    scanned: candidates.length,
    decided,
    forecast: {
      today: Math.round(forecast.today),
      week: Math.round(forecast.week),
      month: Math.round(forecast.month),
      quarter: Math.round(forecast.quarter),
      admissions: forecast.admissions,
      avg_ticket: Math.round(avg),
      conversion_rate: Math.round(conversion * 100) / 100,
    },
    alerts,
  };
}

export const triggerBrainTick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ limit: z.number().min(1).max(50).optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await assertBrainAccess(context as never);
    return runBrainTick(context.supabase, { limit: data.limit ?? 15, forceAll: true });
  });

// ============================================================
// Dashboard data
// ============================================================
export const getBrainDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertBrainAccess(context as never);
    const supabase = context.supabase as never as {
      from: (t: string) => {
        select: (c: string, opts?: unknown) => {
          order?: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> };
          eq?: (col: string, v: string) => { order: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> } };
          gte?: (col: string, v: string) => Promise<{ data: unknown; count?: number }>;
        };
      };
    };

    const [priorityRes, forecastRes, alertsRes, dropoffsRes] = await Promise.all([
      (supabase.from("brain_decisions") as never as { select: (c: string) => { order: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> } } })
        .select(
          "lead_id,priority,urgency,best_channel,best_time_window,recommended_course,expected_revenue,expected_close_date,scholarship_pct,probability_pct,health_score,reasoning,needs_parent_mode",
        )
        .order("probability_pct", { ascending: false })
        .limit(50),
      (supabase.from("brain_forecasts") as never as { select: (c: string) => { order: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> } } })
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(1),
      (supabase.from("brain_alerts") as never as { select: (c: string) => { eq: (col: string, v: string) => { order: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> } } } })
        .select("*")
        .eq("acknowledged", "false")
        .order("created_at", { ascending: false })
        .limit(20),
      (supabase.from("brain_dropoffs") as never as { select: (c: string) => { order: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> } } })
        .select("reason")
        .order("detected_at", { ascending: false })
        .limit(200),
    ]);

    const dropoffRows = ((dropoffsRes as { data: Array<{ reason: string }> | null }).data ?? []);
    const dropoffCounts: Record<string, number> = {};
    dropoffRows.forEach((r) => {
      dropoffCounts[r.reason] = (dropoffCounts[r.reason] ?? 0) + 1;
    });

    return {
      priorityLeadsJson: JSON.stringify((priorityRes as { data: unknown[] }).data ?? []),
      forecast: ((forecastRes as { data: unknown[] }).data ?? [null])[0] ?? null,
      alertsJson: JSON.stringify((alertsRes as { data: unknown[] }).data ?? []),
      dropoffs: Object.entries(dropoffCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([reason, count]) => ({ reason, count })),
    };
  });

export const acknowledgeAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ alertId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertBrainAccess(context as never);
    await (context.supabase.from("brain_alerts") as unknown as {
      update: (r: unknown) => { eq: (c: string, v: string) => Promise<unknown> };
    })
      .update({
        acknowledged: true,
        acknowledged_by: (context as { userId: string }).userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", data.alertId);
    return { ok: true };
  });

// ============================================================
// Win-back / nurture queue
// ============================================================
export const queueWinBack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ inactiveDays: z.enum(["7", "14", "30"]).default("14") }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertBrainAccess(context as never);
    const days = Number(data.inactiveDays);
    const cutoff = new Date(Date.now() - days * 86400_000).toISOString();
    const supabase = context.supabase as never as {
      from: (t: string) => {
        select: (c: string) => {
          lt: (col: string, v: string) => { limit: (n: number) => Promise<{ data: unknown }> };
        };
        insert: (r: unknown) => Promise<unknown>;
      };
    };
    const { data: inactive } = (await supabase
      .from("platform_leads")
      .select("id,name,phone,email,interested_course")
      .lt("last_activity_at", cutoff)
      .limit(50)) as { data: Array<Record<string, unknown>> | null };

    const rows = (inactive ?? []).map((l) => ({
      lead_id: l.id,
      campaign: `winback_${days}d`,
      channel: l.phone ? "whatsapp" : "email",
      subject: `We saved your seat, ${(l.name as string)?.split(" ")[0] || "there"}`,
      body: `Your ${l.interested_course ?? "program"} spot is still open. Reply 'YES' for a personalised counselling call this week.`,
      status: "queued",
    }));
    if (rows.length) await supabase.from("brain_nurture_deliveries").insert(rows);
    return { queued: rows.length };
  });

// ============================================================
// Executive Dashboard (CEO view)
// ============================================================
export const getExecutiveDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertBrainAccess(context as never);
    const sb = context.supabase as never as {
      from: (t: string) => {
        select: (c: string, opts?: unknown) => {
          gte?: (col: string, v: string) => Promise<{ data: unknown; count?: number | null }>;
          order?: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> };
        };
      };
    };

    const now = Date.now();
    const day = 86400_000;
    const dISO = (offset: number) => new Date(now - offset * day).toISOString();

    const [enrolls30, enrolls90, decisionsRes, forecastRes, sourcesRes, leadsAll, counsellorsRes] = await Promise.all([
      (sb.from("enrollments") as never as { select: (c: string, o?: unknown) => { gte: (c: string, v: string) => Promise<{ data: unknown; count: number | null }> } })
        .select("id,course_id,enrolled_at,status", { count: "exact" } as never)
        .gte("enrolled_at", dISO(30)),
      (sb.from("enrollments") as never as { select: (c: string, o?: unknown) => { gte: (c: string, v: string) => Promise<{ data: unknown; count: number | null }> } })
        .select("id,enrolled_at", { count: "exact" } as never)
        .gte("enrolled_at", dISO(90)),
      (sb.from("brain_decisions") as never as { select: (c: string) => { order: (c: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> } } })
        .select("recommended_course,expected_revenue,probability_pct,scholarship_pct,assigned_counsellor_id,priority")
        .order("computed_at", { ascending: false })
        .limit(500),
      (sb.from("brain_forecasts") as never as { select: (c: string) => { order: (c: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> } } })
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(1),
      (sb.from("platform_leads") as never as { select: (c: string, o?: unknown) => { gte: (c: string, v: string) => Promise<{ data: unknown }> } })
        .select("source,status,score,created_at")
        .gte("created_at", dISO(30)),
      (sb.from("platform_leads") as never as { select: (c: string, o?: unknown) => { gte: (c: string, v: string) => Promise<{ data: unknown; count: number | null }> } })
        .select("status", { count: "exact" } as never)
        .gte("created_at", dISO(30)),
      (sb.from("counsellor_profiles") as never as { select: (c: string) => { order: (c: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> } } })
        .select("user_id,display_name,conversion_rate,avg_response_seconds,current_workload")
        .order("conversion_rate", { ascending: false })
        .limit(10),
    ]);

    const decisions = (decisionsRes?.data ?? []) as Array<Record<string, unknown>>;
    const forecast = ((forecastRes?.data ?? []) as Array<Record<string, unknown>>)[0] ?? null;

    // Best-performing courses (from decisions weighted by revenue*probability)
    const courseMap = new Map<string, { revenue: number; count: number }>();
    for (const d of decisions) {
      const c = String(d.recommended_course ?? "");
      if (!c) continue;
      const ev = Number(d.expected_revenue ?? 0) * (Number(d.probability_pct ?? 0) / 100);
      const cur = courseMap.get(c) ?? { revenue: 0, count: 0 };
      cur.revenue += ev;
      cur.count += 1;
      courseMap.set(c, cur);
    }
    const bestCourses = [...courseMap.entries()]
      .map(([course, v]) => ({ course, expected_revenue: Math.round(v.revenue), pipeline_count: v.count }))
      .sort((a, b) => b.expected_revenue - a.expected_revenue)
      .slice(0, 8);

    // Lead sources breakdown
    const sourceMap = new Map<string, { total: number; converted: number }>();
    for (const l of (sourcesRes?.data ?? []) as Array<Record<string, unknown>>) {
      const s = String(l.source ?? "direct");
      const cur = sourceMap.get(s) ?? { total: 0, converted: 0 };
      cur.total++;
      if (l.status === "enrolled") cur.converted++;
      sourceMap.set(s, cur);
    }
    const leadSources = [...sourceMap.entries()]
      .map(([source, v]) => ({ source, leads: v.total, converted: v.converted, conversion_pct: v.total ? Math.round((v.converted / v.total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.leads - a.leads);

    // Conversion funnel
    const funnelBuckets = { visitor: 0, lead: 0, qualified: 0, consultation: 0, enrolled: 0 };
    for (const l of (leadsAll?.data ?? []) as Array<Record<string, unknown>>) {
      funnelBuckets.lead++;
      const status = String(l.status ?? "");
      if (["qualified", "consultation", "demo", "enrolled"].includes(status)) funnelBuckets.qualified++;
      if (["consultation", "demo", "enrolled"].includes(status)) funnelBuckets.consultation++;
      if (status === "enrolled") funnelBuckets.enrolled++;
    }

    // Scholarship impact
    let scholarshipGiven = 0;
    let scholarshipPipelineRevenue = 0;
    let scholarshipCount = 0;
    for (const d of decisions) {
      const sp = Number(d.scholarship_pct ?? 0);
      if (sp > 0) {
        scholarshipCount++;
        scholarshipGiven += sp;
        scholarshipPipelineRevenue += Number(d.expected_revenue ?? 0) * (Number(d.probability_pct ?? 0) / 100);
      }
    }
    const avgScholarship = scholarshipCount ? Math.round((scholarshipGiven / scholarshipCount) * 10) / 10 : 0;

    // Best counsellors
    const bestCounsellors = ((counsellorsRes?.data ?? []) as Array<Record<string, unknown>>).map((c) => ({
      user_id: c.user_id,
      name: c.display_name,
      conversion_rate: Number(c.conversion_rate ?? 0),
      avg_response_seconds: Number(c.avg_response_seconds ?? 0),
      workload: Number(c.current_workload ?? 0),
    }));

    const admissions30 = (enrolls30 as unknown as { count: number | null })?.count ?? 0;
    const admissions90 = (enrolls90 as unknown as { count: number | null })?.count ?? 0;

    return {
      revenue: {
        forecast_today: forecast ? Number((forecast.breakdown as Record<string, unknown> | null)?.today ?? 0) : 0,
        forecast_week: forecast ? Number((forecast.breakdown as Record<string, unknown> | null)?.week ?? 0) : 0,
        forecast_month: forecast ? Number(forecast.expected_revenue ?? 0) : 0,
        forecast_quarter: forecast ? Number((forecast.breakdown as Record<string, unknown> | null)?.quarter ?? 0) : 0,
        avg_ticket: forecast ? Number(forecast.avg_ticket_size ?? 0) : 0,
      },
      admissions: {
        last_30_days: admissions30,
        last_90_days: admissions90,
        predicted_month: forecast ? Number(forecast.expected_admissions ?? 0) : 0,
        avg_enrollment_days: admissions90 > 0 ? Math.round((90 / Math.max(admissions90, 1)) * 10) / 10 : null,
      },
      lead_sources: leadSources,
      best_courses: bestCourses,
      best_counsellors: bestCounsellors,
      funnel: funnelBuckets,
      conversion_rate: forecast ? Number(forecast.conversion_rate ?? 0) : 0,
      scholarship_impact: {
        leads_with_scholarship: scholarshipCount,
        avg_scholarship_pct: avgScholarship,
        pipeline_revenue: Math.round(scholarshipPipelineRevenue),
      },
    };
  });
