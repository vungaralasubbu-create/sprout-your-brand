import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function loadActiveAmbassador(context: any) {
  const { supabase, userId } = context;
  const { data: profile } = await supabase
    .from("campus_ambassador_profiles")
    .select("id, full_name, status, referral_code, referral_link, ambassador_code")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return null;
  const status = (profile.status as string) || "active";
  if (status === "terminated" || status === "inactive") return null;
  return { profile, active: status === "active" };
}

function safeDisplayName(row: any) {
  const raw = row?.display_name || row?.student_name;
  if (raw && String(raw).trim().length > 0) {
    const parts = String(raw).trim().split(/\s+/);
    const first = parts[0];
    const last = parts[1] ? parts[1][0].toUpperCase() + "." : "";
    return last ? `${first} ${last}` : first;
  }
  const code = row?.enrollment_code || row?.id;
  return `Learner ${String(code).slice(-4).toUpperCase()}`;
}

function rangeFrom(range: string, fromDate?: string, toDate?: string) {
  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = null;
  if (range === "today") { from = new Date(now); from.setHours(0, 0, 0, 0); }
  else if (range === "7d") { from = new Date(now.getTime() - 7 * 864e5); }
  else if (range === "30d") { from = new Date(now.getTime() - 30 * 864e5); }
  else if (range === "90d") { from = new Date(now.getTime() - 90 * 864e5); }
  else if (range === "custom") {
    if (fromDate) from = new Date(fromDate);
    if (toDate) { to = new Date(toDate); to.setHours(23, 59, 59, 999); }
  }
  return { from, to };
}

// Map enrollment_status enum + latest payment submission into a public ambassador-facing state
function derivePaymentStatus(enr: any, latestSub: any) {
  const s = String(enr?.status ?? "");
  if (s === "cancelled") return "cancelled";
  if (s === "refund_full" || s === "refund_partial") return "refunded";
  if (s === "verified") return "verified";
  if (latestSub) {
    const ps = String(latestSub.status);
    if (ps === "verified") return "verified";
    if (ps === "rejected") return "failed";
    if (ps === "duplicate_flagged") return "failed";
    if (ps === "needs_more_info") return "verification_pending";
    if (ps === "under_review") return "verification_pending";
    return "payment_submitted";
  }
  if (s === "under_verification") return "verification_pending";
  if (s === "received") return "payment_pending";
  return "not_started";
}

function deriveEnrollmentStatus(enr: any, latestSub: any) {
  const s = String(enr?.status ?? "");
  if (s === "cancelled") return "cancelled";
  if (s === "refund_full" || s === "refund_partial") return "refunded";
  if (s === "verified") return "enrollment_confirmed";
  if (s === "under_verification") return "payment_verification_pending";
  if (s === "fraud_review") return "payment_verification_pending";
  if (s === "duplicate") return "ineligible";
  if (latestSub) return "payment_verification_pending";
  return "enrollment_submitted";
}

// -------- Summary --------
export const getEnrollmentSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { gate: "not_active" as const };
    const { supabase } = context;

    const { data: enrs } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("ambassador_id", amb.profile.id);

    const list = enrs ?? [];
    const total = list.length;
    let paymentPending = 0, verificationPending = 0, verified = 0, confirmed = 0;
    for (const e of list) {
      const s = String(e.status);
      if (s === "received") paymentPending += 1;
      if (s === "under_verification" || s === "fraud_review") verificationPending += 1;
      if (s === "verified") { verified += 1; confirmed += 1; }
    }

    const { count: commissionEligibleCount } = await supabase
      .from("ambassador_commissions")
      .select("id", { count: "exact", head: true })
      .eq("ambassador_id", amb.profile.id)
      .eq("eligibility_status", "eligible");

    return {
      gate: amb.active ? ("active" as const) : ("suspended" as const),
      summary: {
        total,
        paymentPending,
        verificationPending,
        verified,
        confirmed,
        commissionEligible: commissionEligibleCount ?? 0,
      },
    };
  });

// -------- Funnel --------
export const getEnrollmentFunnel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { funnel: null, gate: "not_active" as const };
    const { supabase } = context;

    const { data: enrs } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("ambassador_id", amb.profile.id);
    const enrIds = (enrs ?? []).map((r: any) => r.id);

    let submissions: any[] = [];
    if (enrIds.length > 0) {
      // partner_payment_submissions has course_id / lead_id but not enrollment_id directly.
      // Ambassadors don't see submissions — funnel just measures state via enrollment.status.
    }

    const { data: leads } = await supabase
      .from("ambassador_referral_leads")
      .select("status, enrollment_id")
      .eq("ambassador_id", amb.profile.id);

    let leadsStarted = 0, leadsSubmitted = 0;
    for (const l of leads ?? []) {
      const s = String(l.status);
      if (["enrollment_started","enrollment_submitted","payment_pending","payment_verification_pending","payment_verified","enrollment_confirmed"].includes(s)) leadsStarted += 1;
      if (["enrollment_submitted","payment_pending","payment_verification_pending","payment_verified","enrollment_confirmed"].includes(s)) leadsSubmitted += 1;
    }

    let paymentPending = 0, paymentSubmitted = 0, verificationPending = 0, verified = 0, confirmed = 0;
    for (const e of enrs ?? []) {
      const s = String(e.status);
      if (s === "received") { paymentPending += 1; paymentSubmitted += 1; }
      if (s === "under_verification" || s === "fraud_review") { paymentSubmitted += 1; verificationPending += 1; }
      if (s === "verified") { paymentSubmitted += 1; verified += 1; confirmed += 1; }
    }

    const { data: comms } = await supabase
      .from("ambassador_commissions")
      .select("eligibility_status, status")
      .eq("ambassador_id", amb.profile.id);
    let eligibilityReview = 0, eligible = 0;
    for (const c of comms ?? []) {
      const es = String(c.eligibility_status);
      if (es === "pending_review") eligibilityReview += 1;
      if (es === "eligible") eligible += 1;
    }

    return {
      gate: amb.active ? ("active" as const) : ("suspended" as const),
      funnel: {
        enrollmentStarted: leadsStarted,
        enrollmentSubmitted: leadsSubmitted,
        paymentPending,
        paymentSubmitted,
        verificationPending,
        paymentVerified: verified,
        enrollmentConfirmed: confirmed,
        eligibilityReview,
        commissionEligible: eligible,
      },
    };
  });

// -------- Programs filter options --------
export const getEnrolledPrograms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { programs: [] as { id: string; title: string }[] };
    const { supabase } = context;
    const { data } = await supabase
      .from("enrollments")
      .select("program_id, program_title")
      .eq("ambassador_id", amb.profile.id);
    const map = new Map<string, string>();
    for (const r of data ?? []) if (r.program_id) map.set(r.program_id, r.program_title || r.program_id);
    return { programs: Array.from(map.entries()).map(([id, title]) => ({ id, title })) };
  });

// -------- List --------
const ListInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(50).default(20),
  status: z.string().optional(),           // enrollment status filter
  commissionStatus: z.string().optional(), // ambassador_commissions.status
  program: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest","oldest","updated","program","payment","enrollment","commission"]).default("newest"),
  range: z.enum(["today","7d","30d","90d","all","custom"]).default("all"),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const listEnrollments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => ListInput.parse(raw))
  .handler(async ({ data, context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { rows: [], total: 0, page: 1, pageSize: data.pageSize, gate: "not_active" as const };
    const { supabase } = context;

    let q = supabase
      .from("enrollments")
      .select(
        "id, enrollment_code, program_id, program_title, student_name, status, enrolled_at, verified_at, created_at, updated_at, gross_revenue",
        { count: "exact" },
      )
      .eq("ambassador_id", amb.profile.id);

    if (data.status) {
      // Map ambassador-facing status filter to enrollments.status
      const s = data.status;
      if (s === "confirmed") q = q.eq("status", "verified");
      else if (s === "verification_pending") q = q.in("status", ["under_verification","fraud_review"]);
      else if (s === "payment_pending") q = q.eq("status", "received");
      else if (s === "cancelled") q = q.eq("status", "cancelled");
      else if (s === "refunded") q = q.in("status", ["refund_full","refund_partial"]);
      else if (s === "ineligible") q = q.eq("status", "duplicate");
      // "enrollment_started" / "enrollment_submitted" have no separate enrollment.status column
      // and are only meaningful at the referral-lead layer; when selected we return an empty subset.
      else if (s === "enrollment_started" || s === "enrollment_submitted") {
        q = q.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    }
    if (data.program) q = q.eq("program_id", data.program);

    const { from, to } = rangeFrom(data.range, data.fromDate, data.toDate);
    if (from) q = q.gte("created_at", from.toISOString());
    if (to) q = q.lte("created_at", to.toISOString());

    if (data.search && data.search.trim()) {
      const s = data.search.trim().replace(/,/g, " ");
      q = q.or([
        `enrollment_code.ilike.%${s}%`,
        `program_title.ilike.%${s}%`,
        `program_id.ilike.%${s}%`,
        `student_name.ilike.%${s}%`,
      ].join(","));
    }

    switch (data.sort) {
      case "oldest": q = q.order("created_at", { ascending: true }); break;
      case "updated": q = q.order("updated_at", { ascending: false }); break;
      case "program": q = q.order("program_title", { ascending: true, nullsFirst: false }); break;
      case "enrollment": q = q.order("status", { ascending: true }); break;
      case "payment": q = q.order("status", { ascending: true }); break;
      default: q = q.order("created_at", { ascending: false });
    }

    const start = (data.page - 1) * data.pageSize;
    q = q.range(start, start + data.pageSize - 1);

    const { data: rows, count, error } = await q;
    if (error) throw error;

    const enrIds = (rows ?? []).map((r: any) => r.id);
    const commByEnr = new Map<string, any>();
    if (enrIds.length > 0) {
      const { data: comms } = await supabase
        .from("ambassador_commissions")
        .select("enrollment_id, status, eligibility_status, calculated_commission")
        .eq("ambassador_id", amb.profile.id)
        .in("enrollment_id", enrIds);
      for (const c of comms ?? []) if (c.enrollment_id) commByEnr.set(c.enrollment_id, c);
    }

    // Also fetch attached lead pricing plans
    const leadsByEnr = new Map<string, any>();
    if (enrIds.length > 0) {
      const { data: ls } = await supabase
        .from("ambassador_referral_leads")
        .select("enrollment_id, pricing_plan, lead_code")
        .eq("ambassador_id", amb.profile.id)
        .in("enrollment_id", enrIds);
      for (const l of ls ?? []) if (l.enrollment_id) leadsByEnr.set(l.enrollment_id, l);
    }

    let mapped = (rows ?? []).map((r: any) => {
      const com = commByEnr.get(r.id);
      const lead = leadsByEnr.get(r.id);
      return {
        id: r.id,
        enrollment_code: r.enrollment_code,
        display_name: safeDisplayName(r),
        program_id: r.program_id,
        program_title: r.program_title,
        pricing_plan: lead?.pricing_plan ?? null,
        referral_lead_code: lead?.lead_code ?? null,
        enrolled_at: r.enrolled_at,
        created_at: r.created_at,
        updated_at: r.updated_at,
        gross_revenue: r.gross_revenue,
        payment_status: derivePaymentStatus(r, null),
        enrollment_status: deriveEnrollmentStatus(r, null),
        commission_status: com?.status ?? null,
        eligibility_status: com?.eligibility_status ?? null,
        commission_amount: com?.calculated_commission ?? null,
      };
    });

    if (data.commissionStatus) {
      mapped = mapped.filter((r) =>
        data.commissionStatus === "not_calculated"
          ? !r.commission_status
          : r.commission_status === data.commissionStatus,
      );
    }

    if (data.sort === "commission") {
      mapped.sort((a, b) => String(a.commission_status ?? "zz").localeCompare(String(b.commission_status ?? "zz")));
    }

    return {
      rows: mapped,
      total: count ?? mapped.length,
      page: data.page,
      pageSize: data.pageSize,
      gate: amb.active ? ("active" as const) : ("suspended" as const),
    };
  });

// -------- Details --------
export const getEnrollmentDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { gate: "not_active" as const };
    const { supabase } = context;

    const { data: enr } = await supabase
      .from("enrollments")
      .select("id, enrollment_code, program_id, program_title, student_name, status, enrolled_at, verified_at, created_at, updated_at, gross_revenue")
      .eq("id", data.id)
      .eq("ambassador_id", amb.profile.id)
      .maybeSingle();
    if (!enr) return { gate: "restricted" as const };

    // Related referral lead
    const { data: lead } = await supabase
      .from("ambassador_referral_leads")
      .select("id, lead_code, pricing_plan, campaign_id, status, attribution_status, attribution_public_reason, lead_source, created_at")
      .eq("ambassador_id", amb.profile.id)
      .eq("enrollment_id", enr.id)
      .maybeSingle();

    // Commission
    const { data: com } = await supabase
      .from("ambassador_commissions")
      .select("id, transaction_code, status, eligibility_status, eligibility_public_reason, eligibility_checked_at, calculated_commission, commission_percentage, eligible_base_amount, public_reason, approved_at, available_at, paid_at, reversed_at, created_at")
      .eq("ambassador_id", amb.profile.id)
      .eq("enrollment_id", enr.id)
      .maybeSingle();

    // Events (privacy-safe)
    let eventsQ = supabase
      .from("ambassador_referral_events")
      .select("id, event_type, event_label, event_source, related_entity_type, related_entity_id, created_at")
      .eq("ambassador_id", amb.profile.id);
    if (lead?.id) eventsQ = eventsQ.eq("referral_lead_id", lead.id);
    else eventsQ = eventsQ.eq("enrollment_id", enr.id);
    const { data: events } = await eventsQ.order("created_at", { ascending: true });

    // Privacy-safe payment reference: use last 4 of enrollment_code as a placeholder token
    const paymentRef = enr.enrollment_code ? `PAY-…${String(enr.enrollment_code).slice(-4)}` : null;

    return {
      gate: amb.active ? ("active" as const) : ("suspended" as const),
      enrollment: {
        id: enr.id,
        enrollment_code: enr.enrollment_code,
        display_name: safeDisplayName(enr),
        program_id: enr.program_id,
        program_title: enr.program_title,
        enrolled_at: enr.enrolled_at,
        verified_at: enr.verified_at,
        created_at: enr.created_at,
        updated_at: enr.updated_at,
        gross_revenue: enr.gross_revenue,
        payment_status: derivePaymentStatus(enr, null),
        enrollment_status: deriveEnrollmentStatus(enr, null),
        payment_reference_masked: paymentRef,
      },
      lead: lead ? {
        id: lead.id,
        lead_code: lead.lead_code,
        pricing_plan: lead.pricing_plan,
        campaign_id: lead.campaign_id,
        attribution_status: lead.attribution_status,
        attribution_public_reason: lead.attribution_public_reason,
        lead_source: lead.lead_source,
        created_at: lead.created_at,
      } : null,
      commission: com ?? null,
      events: events ?? [],
    };
  });

// -------- Activity feed --------
export const listEnrollmentActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      scope: z.enum(["all","enrollment","payment","verification","eligibility","commission","cancellation"]).default("all"),
      range: z.enum(["today","7d","30d","90d","all","custom"]).default("30d"),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      limit: z.number().int().min(10).max(100).default(30),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { items: [] };
    const { supabase } = context;

    // Only events with an enrollment_id (or that are enrollment-related types)
    let q = supabase
      .from("ambassador_referral_events")
      .select("id, event_type, event_label, event_source, referral_lead_id, enrollment_id, created_at")
      .eq("ambassador_id", amb.profile.id)
      .not("enrollment_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    const { from, to } = rangeFrom(data.range, data.fromDate, data.toDate);
    if (from) q = q.gte("created_at", from.toISOString());
    if (to) q = q.lte("created_at", to.toISOString());

    if (data.scope !== "all") {
      const map: Record<string, string[]> = {
        enrollment: ["enrollment_started","enrollment_submitted","enrollment_confirmed","enrollment_cancelled","enrollment_refunded"],
        payment: ["payment_submitted","payment_pending","payment_reversed"],
        verification: ["payment_verification_started","payment_verification_pending","payment_verified","payment_failed"],
        eligibility: ["commission_eligibility_review","commission_eligible","commission_ineligible","commission_on_hold"],
        commission: ["commission_approved","commission_available","commission_paid","commission_reversed"],
        cancellation: ["enrollment_cancelled","enrollment_refunded","commission_reversed","payment_reversed"],
      };
      const types = map[data.scope];
      if (types) q = q.in("event_type", types);
    }

    const { data: rows } = await q;
    return { items: rows ?? [] };
  });
