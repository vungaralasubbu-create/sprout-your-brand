import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FollowUpFilter =
  | "today"
  | "overdue"
  | "not_contacted"
  | "no_answer_retry"
  | "payment_follow_up"
  | "all";

const CONTACTED_STATUSES = [
  "contacted",
  "interested",
  "follow_up",
  "application_started",
  "application_submitted",
  "payment_pending",
  "enrolled",
];

async function resolvePartnerId(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

function startOfDayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function endOfDayISO() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/** Counts for dashboard "Needs Your Attention" and header alerts. */
export const getFollowUpCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const partnerId = await resolvePartnerId(context.supabase, context.userId);
    const zero = {
      today: 0,
      overdue: 0,
      not_contacted: 0,
      no_answer_retry: 0,
      payment_follow_up: 0,
      total: 0,
    };
    if (!partnerId) return zero;
    const supabase = context.supabase;
    const nowISO = new Date().toISOString();
    const todayStart = startOfDayISO();
    const todayEnd = endOfDayISO();

    const [todayRes, overdueRes, notContactedRes, noAnswerRes, paymentFURes] = await Promise.all([
      // Today scheduled follow-ups still due
      supabase
        .from("partner_follow_ups")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partnerId)
        .eq("status", "scheduled")
        .gte("due_at", todayStart)
        .lte("due_at", todayEnd),
      // Overdue = scheduled + due_at < now
      supabase
        .from("partner_follow_ups")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partnerId)
        .eq("status", "scheduled")
        .lt("due_at", nowISO),
      // Not contacted: leads assigned/own where status = 'new'
      supabase
        .from("partner_leads")
        .select("id", { count: "exact", head: true })
        .or(`owner_partner_id.eq.${partnerId},assigned_partner_id.eq.${partnerId}`)
        .eq("status", "new"),
      // No answer retry: leads with status = 'no_answer' AND has a scheduled follow-up
      supabase
        .from("partner_leads")
        .select("id", { count: "exact", head: true })
        .or(`owner_partner_id.eq.${partnerId},assigned_partner_id.eq.${partnerId}`)
        .eq("status", "no_answer"),
      // Payment follow-up: leads with payment_pending status
      supabase
        .from("partner_leads")
        .select("id", { count: "exact", head: true })
        .or(`owner_partner_id.eq.${partnerId},assigned_partner_id.eq.${partnerId}`)
        .in("status", ["payment_pending", "application_submitted"]),
    ]);

    const counts = {
      today: todayRes.count ?? 0,
      overdue: overdueRes.count ?? 0,
      not_contacted: notContactedRes.count ?? 0,
      no_answer_retry: noAnswerRes.count ?? 0,
      payment_follow_up: paymentFURes.count ?? 0,
    };
    return { ...counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
  });

/** List leads for the one-lead-at-a-time workspace matching a filter. */
export const listLeadsForFilter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { filter: FollowUpFilter }) => input)
  .handler(async ({ data, context }) => {
    const partnerId = await resolvePartnerId(context.supabase, context.userId);
    if (!partnerId) return { leads: [] as any[] };
    const supabase = context.supabase;
    const nowISO = new Date().toISOString();

    let leadIds: string[] | null = null;

    if (data.filter === "today" || data.filter === "overdue") {
      const fuQ = supabase
        .from("partner_follow_ups")
        .select("lead_id, due_at")
        .eq("partner_id", partnerId)
        .eq("status", "scheduled")
        .order("due_at", { ascending: true });
      if (data.filter === "today") {
        fuQ.gte("due_at", startOfDayISO()).lte("due_at", endOfDayISO());
      } else {
        fuQ.lt("due_at", nowISO);
      }
      const { data: fus } = await fuQ;
      leadIds = Array.from(new Set((fus ?? []).map((f: any) => f.lead_id)));
      if (leadIds.length === 0) return { leads: [] };
    }

    let query = supabase
      .from("partner_leads")
      .select(
        "id, full_name, mobile, email, city, program_interest, status, priority, next_follow_up_at, last_activity_at, lead_ownership_type, notes, created_at",
      )
      .or(`owner_partner_id.eq.${partnerId},assigned_partner_id.eq.${partnerId}`)
      .order("next_follow_up_at", { ascending: true, nullsFirst: false })
      .limit(200);

    if (leadIds) {
      query = query.in("id", leadIds);
    } else if (data.filter === "not_contacted") {
      query = query.eq("status", "new");
    } else if (data.filter === "no_answer_retry") {
      query = query.eq("status", "no_answer");
    } else if (data.filter === "payment_follow_up") {
      query = query.in("status", ["payment_pending", "application_submitted"]);
    }

    const { data: leads } = await query;
    return { leads: (leads ?? []) as any[] };
  });

/** Full lead detail for the workspace: lead, follow-ups history, activity timeline, call attempts. */
export const getLeadDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { lead_id: string }) => input)
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const [leadRes, fuRes, actRes] = await Promise.all([
      supabase.from("partner_leads").select("*").eq("id", data.lead_id).maybeSingle(),
      supabase
        .from("partner_follow_ups")
        .select("id, due_at, type, status, notes, result, completed_at, created_at")
        .eq("lead_id", data.lead_id)
        .order("due_at", { ascending: false }),
      supabase
        .from("partner_lead_activities")
        .select("id, activity_type, content, metadata, created_at")
        .eq("lead_id", data.lead_id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const activities = (actRes.data ?? []) as any[];
    const callAttempts = activities.filter(
      (a) => a.activity_type === "note" && (a.content ?? "").toLowerCase().startsWith("no answer"),
    ).length;

    return {
      lead: leadRes.data as any,
      followUps: (fuRes.data ?? []) as any[],
      activities,
      callAttempts,
    };
  });

/** Schedule a follow-up. Required when status is set to follow_up or call back. */
export const scheduleFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      lead_id: string;
      due_at: string; // ISO
      type?: "call" | "whatsapp" | "email" | "meeting" | "other";
      notes?: string;
      set_status?: "follow_up" | "no_answer" | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const partnerId = await resolvePartnerId(supabase, context.userId);
    if (!partnerId) throw new Error("Partner not found");
    if (!data.due_at || isNaN(Date.parse(data.due_at))) throw new Error("Follow-up date/time is required");

    const { data: fu, error } = await supabase
      .from("partner_follow_ups")
      .insert({
        lead_id: data.lead_id,
        partner_id: partnerId,
        due_at: data.due_at,
        type: data.type ?? "call",
        notes: data.notes ?? null,
        status: "scheduled",
      })
      .select("id")
      .single();
    if (error) throw error;

    // Update the lead's next_follow_up_at + optional status
    const patch: Record<string, unknown> = {
      next_follow_up_at: data.due_at,
      last_activity_at: new Date().toISOString(),
    };
    if (data.set_status) patch.status = data.set_status;
    await supabase.from("partner_leads").update(patch).eq("id", data.lead_id);

    await supabase.from("partner_lead_activities").insert({
      lead_id: data.lead_id,
      partner_id: partnerId,
      activity_type: "follow_up_scheduled",
      content: `Follow-up scheduled for ${new Date(data.due_at).toLocaleString("en-IN")}`,
      metadata: { follow_up_id: fu.id, type: data.type ?? "call" },
    });
    return { id: fu.id };
  });

/** Mark a scheduled/overdue follow-up completed. */
export const completeFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { follow_up_id: string; result?: string }) => input)
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const partnerId = await resolvePartnerId(supabase, context.userId);
    if (!partnerId) throw new Error("Partner not found");

    const { data: fu } = await supabase
      .from("partner_follow_ups")
      .select("id, lead_id")
      .eq("id", data.follow_up_id)
      .maybeSingle();
    if (!fu) throw new Error("Follow-up not found");

    await supabase
      .from("partner_follow_ups")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result: data.result ?? null,
      })
      .eq("id", data.follow_up_id);

    await supabase.from("partner_lead_activities").insert({
      lead_id: fu.lead_id,
      partner_id: partnerId,
      activity_type: "follow_up_completed",
      content: data.result ?? "Follow-up completed",
      metadata: { follow_up_id: data.follow_up_id },
    });
    return { ok: true };
  });

/** Mark lead as No Answer, log an attempt, and schedule a retry. */
export const markNoAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      lead_id: string;
      retry: "later_today" | "tomorrow" | "custom";
      custom_at?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const partnerId = await resolvePartnerId(supabase, context.userId);
    if (!partnerId) throw new Error("Partner not found");

    let dueAt: Date;
    if (data.retry === "later_today") {
      dueAt = new Date();
      dueAt.setHours(dueAt.getHours() + 3);
    } else if (data.retry === "tomorrow") {
      dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + 1);
      dueAt.setHours(10, 0, 0, 0);
    } else {
      if (!data.custom_at) throw new Error("Retry date/time required");
      dueAt = new Date(data.custom_at);
    }

    // Log No Answer note (used for attempt counting)
    await supabase.from("partner_lead_activities").insert({
      lead_id: data.lead_id,
      partner_id: partnerId,
      activity_type: "note",
      content: "No Answer",
      metadata: { retry: data.retry },
    });

    // Update lead status
    await supabase
      .from("partner_leads")
      .update({
        status: "no_answer",
        next_follow_up_at: dueAt.toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", data.lead_id);

    // Create scheduled follow-up
    const { data: fu } = await supabase
      .from("partner_follow_ups")
      .insert({
        lead_id: data.lead_id,
        partner_id: partnerId,
        due_at: dueAt.toISOString(),
        type: "call",
        status: "scheduled",
        notes: "Retry after No Answer",
      })
      .select("id")
      .single();

    await supabase.from("partner_lead_activities").insert({
      lead_id: data.lead_id,
      partner_id: partnerId,
      activity_type: "follow_up_scheduled",
      content: `Retry scheduled for ${dueAt.toLocaleString("en-IN")}`,
      metadata: { follow_up_id: fu?.id, reason: "no_answer" },
    });

    return { ok: true, due_at: dueAt.toISOString() };
  });

/** Change lead status + log activity (used from workspace). */
export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      lead_id: string;
      status:
        | "new"
        | "contacted"
        | "interested"
        | "follow_up"
        | "application_started"
        | "application_submitted"
        | "payment_pending"
        | "enrolled"
        | "not_interested"
        | "lost"
        | "no_answer";
      note?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const partnerId = await resolvePartnerId(supabase, context.userId);
    if (!partnerId) throw new Error("Partner not found");

    await supabase
      .from("partner_leads")
      .update({ status: data.status, last_activity_at: new Date().toISOString() })
      .eq("id", data.lead_id);

    await supabase.from("partner_lead_activities").insert({
      lead_id: data.lead_id,
      partner_id: partnerId,
      activity_type: "stage_change",
      content: data.note ?? `Status changed to ${data.status.replace(/_/g, " ")}`,
      metadata: { status: data.status },
    });
    return { ok: true };
  });
