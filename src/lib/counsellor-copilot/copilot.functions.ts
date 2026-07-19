/**
 * AI Counsellor Copilot — enterprise sales assistant for counsellors.
 *
 * Provides a reusable microservice that:
 *   - Analyses a lead and returns a structured Copilot report
 *     (summary, intent, personality, objections, recommended course,
 *      sales script, follow-up timing, next best action, buying signals).
 *   - Generates channel-specific outreach (email / WhatsApp / SMS).
 *   - Summarises call notes into action items.
 *   - Answers free-form counsellor questions grounded in the lead's data.
 *
 * All Copilot server functions gate access to Super Admin / Admin /
 * Counsellor / Brand Owner via `is_copilot_user` before touching data.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callLovableAiJson, callLovableAiText, isAiAvailable } from "@/lib/ai-gateway.server";

const COPILOT_MODEL = "google/gemini-3.5-flash";

async function assertCopilotAccess(context: {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };
  userId: string;
}) {
  const { data, error } = await context.supabase.rpc("is_copilot_user", { _uid: context.userId });
  if (error || !data) {
    throw new Error("Forbidden: Copilot is restricted to counsellors, brand owners and admins.");
  }
}

// ============================================================
// Types
// ============================================================

export interface CopilotAnalysis {
  headline: string;
  summary: string;
  buying_intent: "very_high" | "high" | "medium" | "low" | "very_low";
  priority: "urgent" | "high" | "medium" | "low";
  buying_signals: string[];
  personality: string[];
  objections: string[];
  recommended_course: { primary: string; secondary?: string; upsell?: string; cross_sell?: string };
  sales_script: string;
  offer_recommendation: {
    type: "scholarship" | "coupon" | "discount" | "emi" | "referral" | "no_offer";
    reason: string;
  };
  follow_up: {
    timing: "call_now" | "call_today" | "call_tomorrow" | "whatsapp_now" | "email_first" | "weekend" | "no_action";
    reason: string;
  };
  next_best_action: string;
  expected_revenue: number;
  hot_lead_alert: boolean;
}

// ============================================================
// Lead context loader — one query, everything the AI needs
// ============================================================

async function loadLeadContext(
  supabase: {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, v: string) => {
          maybeSingle: () => Promise<{ data: unknown }>;
          order?: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown }> };
        };
      };
    };
  },
  leadId: string,
) {
  const leadPromise = supabase.from("platform_leads").select("*").eq("id", leadId).maybeSingle();
  const eventsPromise = supabase
    .from("platform_lead_events")
    .select("event_type,page_path,metadata,created_at")
    .eq("lead_id", leadId)
    .order!("created_at", { ascending: false })
    .limit(50);
  const callsPromise = supabase
    .from("counsellor_call_logs")
    .select("channel,ai_summary,outcome,created_at")
    .eq("lead_id", leadId)
    .order!("created_at", { ascending: false })
    .limit(10);

  const [{ data: lead }, { data: events }, { data: calls }] = (await Promise.all([
    leadPromise,
    eventsPromise,
    callsPromise,
  ])) as Array<{ data: unknown }>;

  return { lead, events: (events as unknown[]) ?? [], calls: (calls as unknown[]) ?? [] };
}

function buildLeadContextPrompt(input: {
  lead: Record<string, unknown> | null;
  events: unknown[];
  calls: unknown[];
}): string {
  const l = input.lead ?? {};
  const eventSummary = (input.events as Array<Record<string, unknown>>)
    .slice(0, 30)
    .map((e) => `${e.created_at} ${e.event_type}${e.page_path ? " " + e.page_path : ""}`)
    .join("\n");
  const callHistory = (input.calls as Array<Record<string, unknown>>)
    .map((c) => `${c.created_at} ${c.channel} · ${c.outcome ?? ""} · ${c.ai_summary ?? ""}`)
    .join("\n");

  return [
    "LEAD PROFILE",
    `Name: ${l.name ?? "Unknown"}`,
    `Phone: ${l.phone ?? "-"}`,
    `Email: ${l.email ?? "-"}`,
    `Interested course: ${l.interested_course ?? l.predicted_course ?? "-"}`,
    `Career interest: ${l.career_interest ?? "-"}`,
    `Budget: ${l.budget_range ?? "-"}`,
    `Preferred timing: ${l.preferred_timing ?? "-"}`,
    `Source: ${l.source ?? "-"} · UTM: ${l.utm_source ?? "-"}/${l.utm_campaign ?? "-"}`,
    `Country/City: ${l.country ?? "-"} ${l.city ?? ""}`,
    `Visits: ${l.visit_count ?? 0} · Events: ${l.event_count ?? 0}`,
    `Score: ${l.score ?? 0}/100 (${l.score_category ?? "?"}) · Probability: ${l.probability ?? 0}%`,
    `Existing AI summary: ${l.ai_summary ?? "-"}`,
    `Existing next action: ${l.ai_next_action ?? "-"}`,
    `Status: ${l.status ?? "-"} · Notes: ${(l.notes as string) ?? "-"}`,
    "",
    "RECENT BEHAVIOUR (newest first)",
    eventSummary || "(no events)",
    "",
    "CALL HISTORY",
    callHistory || "(no calls yet)",
  ].join("\n");
}

// ============================================================
// analyzeLead — produces the full Copilot report
// ============================================================

export const analyzeLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ leadId: z.string().uuid(), force: z.boolean().optional() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ analysis: CopilotAnalysis; cached: boolean }> => {
    await assertCopilotAccess(context as never);
    const { supabase } = context;

    // Serve cache if fresh (< 15min) unless force
    if (!data.force) {
      const { data: cached } = (await supabase
        .from("counsellor_ai_analyses")
        .select("analysis,updated_at")
        .eq("lead_id", data.leadId)
        .maybeSingle()) as { data: { analysis: unknown; updated_at: string } | null };
      if (cached?.analysis) {
        const ageMin = (Date.now() - new Date(cached.updated_at).getTime()) / 60000;
        if (ageMin < 15) {
          return { analysis: cached.analysis as CopilotAnalysis, cached: true };
        }
      }
    }

    const ctx = await loadLeadContext(supabase as never, data.leadId);
    if (!ctx.lead) throw new Error("Lead not found");

    if (!isAiAvailable()) {
      throw new Error("AI service not configured");
    }

    const contextBlock = buildLeadContextPrompt(ctx as never);
    const systemPrompt = [
      "You are the Glintr AI Counsellor Copilot — a senior admissions strategist coaching counsellors to close more enrollments.",
      "Analyse the lead precisely. Never invent facts not present in the profile or behaviour.",
      "Return strictly this JSON schema (all fields required):",
      `{
  "headline": string,           // one-line diagnosis, <=90 chars
  "summary": string,            // 3-5 sentence human-like paragraph
  "buying_intent": "very_high"|"high"|"medium"|"low"|"very_low",
  "priority": "urgent"|"high"|"medium"|"low",
  "buying_signals": string[],   // e.g. Returning Visitor, Viewed Pricing, Downloaded Brochure
  "personality": string[],      // e.g. Career Focused, Price Sensitive, Needs Parent Approval
  "objections": string[],       // e.g. Too Expensive, Needs EMI, Needs Placement Assurance
  "recommended_course": { "primary": string, "secondary": string, "upsell": string, "cross_sell": string },
  "sales_script": string,       // personalized 4-6 sentence opener the counsellor can read verbatim
  "offer_recommendation": { "type": "scholarship"|"coupon"|"discount"|"emi"|"referral"|"no_offer", "reason": string },
  "follow_up": { "timing": "call_now"|"call_today"|"call_tomorrow"|"whatsapp_now"|"email_first"|"weekend"|"no_action", "reason": string },
  "next_best_action": string,   // one imperative sentence: Book Demo / Send Brochure / Schedule Counselling / Offer Scholarship / Connect Parent / Arrange Faculty Call / Invite Webinar
  "expected_revenue": number,   // INR, realistic based on interest + budget
  "hot_lead_alert": boolean
}`,
      "Sales script must reference at least two specific behaviours the lead has shown. Never generic.",
    ].join("\n");

    const analysis = await callLovableAiJson<CopilotAnalysis>({
      model: COPILOT_MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contextBlock },
      ],
    });

    await supabase
      .from("counsellor_ai_analyses")
      .upsert(
        {
          lead_id: data.leadId,
          analysis: analysis as never,
          model: COPILOT_MODEL,
          generated_by: (context as { userId: string }).userId,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "lead_id" } as never,
      );

    return { analysis, cached: false };
  });

// ============================================================
// generateMessage — email / whatsapp / sms
// ============================================================

export const generateCopilotMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        channel: z.enum(["email", "whatsapp", "sms"]),
        intent: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCopilotAccess(context as never);
    const { supabase } = context;
    const ctx = await loadLeadContext(supabase as never, data.leadId);
    if (!ctx.lead) throw new Error("Lead not found");

    const limits: Record<string, string> = {
      email: "Subject line + 120-180 word body. Warm, specific, single CTA. Sign off as 'Glintr Admissions Team'. Return JSON {subject, body}.",
      whatsapp: "60-100 words. Personal, warm, one clear next step. Use emojis sparingly (max 2). Return JSON {subject: null, body}.",
      sms: "<=160 characters. Direct, personalised, one CTA. Return JSON {subject: null, body}.",
    };

    const systemPrompt = [
      "You are the Glintr Counsellor Copilot writing on behalf of a human counsellor.",
      "Never use generic scripts. Reference concrete signals the lead has shown.",
      `Channel: ${data.channel}. ${limits[data.channel]}`,
      data.intent ? `Counsellor intent: ${data.intent}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await callLovableAiJson<{ subject: string | null; body: string }>({
      model: COPILOT_MODEL,
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildLeadContextPrompt(ctx as never) },
      ],
    });

    const { data: saved, error } = (await supabase
      .from("counsellor_generated_messages")
      .insert({
        lead_id: data.leadId,
        counsellor_id: (context as { userId: string }).userId,
        channel: data.channel,
        subject: result.subject,
        body: result.body,
        status: "draft",
      } as never)
      .select("id")
      .maybeSingle()) as { data: { id: string } | null; error: unknown };
    if (error) throw error;

    return { id: saved?.id ?? null, subject: result.subject, body: result.body };
  });

// ============================================================
// saveCallNotes — AI summarises and extracts tasks
// ============================================================

export const saveCallNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        rawNotes: z.string().min(3).max(4000),
        outcome: z.string().optional(),
        durationSeconds: z.number().optional(),
        channel: z.enum(["call", "meeting", "whatsapp", "email"]).default("call"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCopilotAccess(context as never);

    const result = await callLovableAiJson<{
      summary: string;
      tasks: Array<{ title: string; due_at?: string; priority?: string }>;
    }>({
      model: COPILOT_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Summarise counsellor call notes crisply (max 60 words) as third-person bullet-style prose, then extract 1-4 concrete follow-up tasks with an ISO due_at (today, tomorrow, or specific weekday if mentioned) and priority (high|medium|low). Return JSON {summary, tasks}.",
        },
        { role: "user", content: data.rawNotes },
      ],
    });

    const { supabase } = context;
    const userId = (context as { userId: string }).userId;

    const { data: log, error } = (await supabase
      .from("counsellor_call_logs")
      .insert({
        lead_id: data.leadId,
        counsellor_id: userId,
        channel: data.channel,
        raw_notes: data.rawNotes,
        ai_summary: result.summary,
        ai_tasks: result.tasks as never,
        duration_seconds: data.durationSeconds ?? null,
        outcome: data.outcome ?? null,
      } as never)
      .select("id")
      .maybeSingle()) as { data: { id: string } | null; error: unknown };
    if (error) throw error;

    // Persist tasks
    if (result.tasks?.length) {
      const rows = result.tasks.map((t) => ({
        lead_id: data.leadId,
        counsellor_id: userId,
        title: t.title,
        due_at: t.due_at ?? null,
        priority: t.priority ?? "medium",
        source: "ai_call_summary",
      }));
      await supabase.from("counsellor_tasks").insert(rows as never);
    }

    return { id: log?.id ?? null, summary: result.summary, tasks: result.tasks ?? [] };
  });

// ============================================================
// askCopilot — free-form Q&A grounded in the lead
// ============================================================

export const askCopilot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ leadId: z.string().uuid(), question: z.string().min(2).max(500) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ answer: string }> => {
    await assertCopilotAccess(context as never);
    const ctx = await loadLeadContext((context as never as { supabase: never }).supabase, data.leadId);
    if (!ctx.lead) throw new Error("Lead not found");

    const answer = await callLovableAiText({
      model: COPILOT_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are the Glintr Counsellor Copilot. Answer the counsellor's tactical question in <=120 words, grounded strictly in the lead profile provided. Be direct and actionable. Use short bullet points when helpful.",
        },
        {
          role: "user",
          content: `${buildLeadContextPrompt(ctx as never)}\n\nQUESTION: ${data.question}`,
        },
      ],
    });
    return { answer };
  });

// ============================================================
// Dashboard: today's tasks, hot leads, kpis
// ============================================================

export interface CopilotDashboardData {
  hotLeadsJson: string;
  tasksJson: string;
  kpis: {
    hot_leads: number;
    tasks_today: number;
    calls_this_week: number;
    messages_this_week: number;
  };
}

export const getCopilotDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CopilotDashboardData> => {
    await assertCopilotAccess(context as never);
    const { supabase } = context;
    const userId = (context as { userId: string }).userId;

    const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
    const tomorrow = new Date(Date.now() + 86400_000).toISOString();

    const [hotLeadsRes, tasksRes, callsRes, messagesRes] = await Promise.all([
      supabase
        .from("platform_leads")
        .select("id,name,phone,email,score,score_category,interested_course,ai_next_action")
        .in("score_category", ["hot", "warm"])
        .order("score", { ascending: false })
        .limit(15),
      supabase
        .from("counsellor_tasks")
        .select("id,title,due_at,priority,status,lead_id")
        .eq("counsellor_id", userId)
        .eq("status", "pending")
        .lte("due_at", tomorrow)
        .order("due_at", { ascending: true })
        .limit(30),
      supabase
        .from("counsellor_call_logs")
        .select("id", { count: "exact", head: true } as never)
        .eq("counsellor_id", userId)
        .gte("created_at", weekAgo),
      supabase
        .from("counsellor_generated_messages")
        .select("id", { count: "exact", head: true } as never)
        .eq("counsellor_id", userId)
        .gte("created_at", weekAgo),
    ]);

    const hot = (hotLeadsRes as { data: unknown[] }).data ?? [];
    const tasks = (tasksRes as { data: unknown[] }).data ?? [];

    return {
      hotLeadsJson: JSON.stringify(hot),
      tasksJson: JSON.stringify(tasks),
      kpis: {
        hot_leads: hot.length,
        tasks_today: tasks.length,
        calls_this_week: Number((callsRes as { count?: number }).count ?? 0),
        messages_this_week: Number((messagesRes as { count?: number }).count ?? 0),
      },
    };
  });

// ============================================================
// Lead history — for the profile side panel
// ============================================================

export const getCopilotLeadHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCopilotAccess(context as never);
    const { supabase } = context;

    const [callsRes, msgsRes, tasksRes] = await Promise.all([
      supabase
        .from("counsellor_call_logs")
        .select("id,channel,ai_summary,outcome,created_at")
        .eq("lead_id", data.leadId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("counsellor_generated_messages")
        .select("id,channel,subject,body,status,created_at")
        .eq("lead_id", data.leadId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("counsellor_tasks")
        .select("id,title,due_at,status,priority,created_at")
        .eq("lead_id", data.leadId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return {
      callsJson: JSON.stringify((callsRes as { data: unknown[] }).data ?? []),
      messagesJson: JSON.stringify((msgsRes as { data: unknown[] }).data ?? []),
      tasksJson: JSON.stringify((tasksRes as { data: unknown[] }).data ?? []),
    };
  });

export const completeCopilotTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ taskId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCopilotAccess(context as never);
    await context.supabase
      .from("counsellor_tasks")
      .update({ status: "done", completed_at: new Date().toISOString() } as never)
      .eq("id", data.taskId);
    return { ok: true };
  });
