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
  if (row.display_name && String(row.display_name).trim().length > 0) return row.display_name;
  const code = row.lead_code || row.id;
  return `Referral Lead ${String(code).slice(-4).toUpperCase()}`;
}

const AMBASSADOR_STATUSES = new Set([
  "new",
  "interested",
  "enrollment_started",
  "enrollment_submitted",
  "payment_pending",
  "payment_verification_pending",
  "payment_verified",
  "enrollment_confirmed",
  "cancelled",
  "refunded",
  "reversed",
  "ineligible",
]);

// ---------- Summary ----------
export const getReferralSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { gate: "not_active" as const };
    const { supabase } = context;

    const { data: leads } = await supabase
      .from("ambassador_referral_leads")
      .select("status, attribution_status")
      .eq("ambassador_id", amb.profile.id);

    const summary = {
      total: leads?.length ?? 0,
      newReferrals: 0,
      enrollmentStarted: 0,
      paymentPending: 0,
      verificationPending: 0,
      verified: 0,
      cancelled: 0,
      ineligible: 0,
    };
    for (const l of leads ?? []) {
      const s = String(l.status);
      if (s === "new" || s === "interested") summary.newReferrals += 1;
      if (s === "enrollment_started" || s === "enrollment_submitted") summary.enrollmentStarted += 1;
      if (s === "payment_pending") summary.paymentPending += 1;
      if (s === "payment_verification_pending") summary.verificationPending += 1;
      if (s === "payment_verified" || s === "enrollment_confirmed") summary.verified += 1;
      if (s === "cancelled" || s === "refunded" || s === "reversed") summary.cancelled += 1;
      if (s === "ineligible" || l.attribution_status === "invalid" || l.attribution_status === "expired")
        summary.ineligible += 1;
    }

    // Funnel counts
    const { count: visitCount } = await supabase
      .from("ambassador_referral_visits")
      .select("id", { count: "exact", head: true })
      .eq("ambassador_id", amb.profile.id);

    const enrollmentIds = new Set<string>();
    let paymentSubmitted = 0;
    let paymentVerified = 0;
    let enrollmentConfirmed = 0;
    for (const l of leads ?? []) {
      const s = String(l.status);
      if (s === "enrollment_submitted" || s === "payment_pending" || s === "payment_verification_pending"
        || s === "payment_verified" || s === "enrollment_confirmed") paymentSubmitted += 1;
      if (s === "payment_verified" || s === "enrollment_confirmed") paymentVerified += 1;
      if (s === "enrollment_confirmed") enrollmentConfirmed += 1;
    }

    const { count: commissionEligible } = await supabase
      .from("ambassador_commissions")
      .select("id", { count: "exact", head: true })
      .eq("ambassador_id", amb.profile.id)
      .in("status", ["eligible", "approved", "available", "payout_processing", "paid"]);

    const funnel = {
      visits: visitCount ?? 0,
      leads: summary.total,
      enrollmentStarted: (leads ?? []).filter(
        (l: any) => ["enrollment_started", "enrollment_submitted", "payment_pending",
          "payment_verification_pending", "payment_verified", "enrollment_confirmed"].includes(String(l.status))
      ).length,
      paymentSubmitted,
      paymentVerified,
      enrollmentConfirmed,
      commissionEligible: commissionEligible ?? 0,
    };

    return { gate: amb.active ? "active" as const : "suspended" as const, summary, funnel };
  });

// ---------- Programs referred ----------
export const getReferredPrograms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { programs: [] };
    const { supabase } = context;
    const { data } = await supabase
      .from("ambassador_referral_leads")
      .select("program_id")
      .eq("ambassador_id", amb.profile.id)
      .not("program_id", "is", null);
    const ids = Array.from(new Set((data ?? []).map((r: any) => r.program_id).filter(Boolean)));
    return { programs: ids as string[] };
  });

// ---------- List ----------
const ListInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(50).default(20),
  status: z.string().optional(),
  program: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest", "updated", "program", "status"]).default("newest"),
  range: z.enum(["today", "7d", "30d", "90d", "all", "custom"]).default("all"),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

function rangeFrom(range: string, fromDate?: string, toDate?: string) {
  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = null;
  if (range === "today") {
    from = new Date(now); from.setHours(0, 0, 0, 0);
  } else if (range === "7d") { from = new Date(now.getTime() - 7 * 864e5); }
  else if (range === "30d") { from = new Date(now.getTime() - 30 * 864e5); }
  else if (range === "90d") { from = new Date(now.getTime() - 90 * 864e5); }
  else if (range === "custom") {
    if (fromDate) from = new Date(fromDate);
    if (toDate) { to = new Date(toDate); to.setHours(23, 59, 59, 999); }
  }
  return { from, to };
}

export const listReferrals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => ListInput.parse(raw))
  .handler(async ({ data, context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { rows: [], total: 0, page: 1, pageSize: data.pageSize, gate: "not_active" as const };
    const { supabase } = context;

    let q = supabase
      .from("ambassador_referral_leads")
      .select(
        "id, lead_code, display_name, program_id, pricing_plan, status, attribution_status, attribution_public_reason, created_at, updated_at, enrollment_id, lead_reference",
        { count: "exact" },
      )
      .eq("ambassador_id", amb.profile.id);

    if (data.status && AMBASSADOR_STATUSES.has(data.status)) {
      if (data.status === "cancelled") q = q.in("status", ["cancelled", "refunded", "reversed"]);
      else if (data.status === "verified") q = q.in("status", ["payment_verified", "enrollment_confirmed"]);
      else q = q.eq("status", data.status);
    } else if (data.status === "verified") {
      q = q.in("status", ["payment_verified", "enrollment_confirmed"]);
    } else if (data.status === "cancelled_group") {
      q = q.in("status", ["cancelled", "refunded", "reversed"]);
    }
    if (data.program) q = q.eq("program_id", data.program);

    const { from, to } = rangeFrom(data.range, data.fromDate, data.toDate);
    if (from) q = q.gte("created_at", from.toISOString());
    if (to) q = q.lte("created_at", to.toISOString());

    if (data.search && data.search.trim()) {
      const s = data.search.trim().replace(/,/g, " ");
      q = q.or(
        [
          `lead_code.ilike.%${s}%`,
          `display_name.ilike.%${s}%`,
          `program_id.ilike.%${s}%`,
          `lead_reference.ilike.%${s}%`,
        ].join(","),
      );
    }

    switch (data.sort) {
      case "oldest": q = q.order("created_at", { ascending: true }); break;
      case "updated": q = q.order("updated_at", { ascending: false }); break;
      case "program": q = q.order("program_id", { ascending: true, nullsFirst: false }); break;
      case "status": q = q.order("status", { ascending: true }); break;
      default: q = q.order("created_at", { ascending: false });
    }

    const start = (data.page - 1) * data.pageSize;
    q = q.range(start, start + data.pageSize - 1);

    const { data: rows, count, error } = await q;
    if (error) throw error;

    // Fetch enrollment payment info + program titles in one shot
    const enrollmentIds = Array.from(new Set((rows ?? []).map((r: any) => r.enrollment_id).filter(Boolean)));
    const enrollmentsById = new Map<string, any>();
    if (enrollmentIds.length > 0) {
      const { data: enrs } = await supabase
        .from("enrollments")
        .select("id, program_title, status, verified_at, gross_revenue")
        .in("id", enrollmentIds);
      for (const e of enrs ?? []) enrollmentsById.set(e.id, e);
    }

    const leadIds = (rows ?? []).map((r: any) => r.id);
    const commissionByEnrollment = new Map<string, any>();
    if (enrollmentIds.length > 0) {
      const { data: comms } = await supabase
        .from("ambassador_commissions")
        .select("enrollment_id, status, calculated_commission")
        .eq("ambassador_id", amb.profile.id)
        .in("enrollment_id", enrollmentIds);
      for (const c of comms ?? []) if (c.enrollment_id) commissionByEnrollment.set(c.enrollment_id, c);
    }

    const mapped = (rows ?? []).map((r: any) => {
      const enr = r.enrollment_id ? enrollmentsById.get(r.enrollment_id) : null;
      const com = r.enrollment_id ? commissionByEnrollment.get(r.enrollment_id) : null;
      return {
        id: r.id,
        lead_code: r.lead_code,
        display_name: safeDisplayName(r),
        program_id: r.program_id,
        program_title: enr?.program_title ?? r.program_id ?? "Program",
        pricing_plan: r.pricing_plan,
        status: r.status,
        attribution_status: r.attribution_status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        enrollment_id: r.enrollment_id,
        enrollment_status: enr?.status ?? null,
        commission_status: com?.status ?? null,
        commission_amount: com?.calculated_commission ?? null,
      };
    });

    return {
      rows: mapped,
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      gate: amb.active ? "active" as const : "suspended" as const,
    };
  });

// ---------- Details ----------
export const getReferralDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { gate: "not_active" as const };
    const { supabase } = context;

    const { data: lead } = await supabase
      .from("ambassador_referral_leads")
      .select("*")
      .eq("id", data.id)
      .eq("ambassador_id", amb.profile.id)
      .maybeSingle();
    if (!lead) return { gate: "restricted" as const };

    let enrollment: any = null;
    if (lead.enrollment_id) {
      const { data: enr } = await supabase
        .from("enrollments")
        .select("id, program_title, program_id, status, enrolled_at, verified_at, gross_revenue")
        .eq("id", lead.enrollment_id)
        .maybeSingle();
      enrollment = enr;
    }
    let commission: any = null;
    if (lead.enrollment_id) {
      const { data: com } = await supabase
        .from("ambassador_commissions")
        .select("id, transaction_code, status, calculated_commission, commission_percentage, eligible_base_amount, public_reason, approved_at, available_at, paid_at, reversed_at, created_at")
        .eq("ambassador_id", amb.profile.id)
        .eq("enrollment_id", lead.enrollment_id)
        .maybeSingle();
      commission = com;
    }

    const { data: events } = await supabase
      .from("ambassador_referral_events")
      .select("id, event_type, event_label, event_source, related_entity_type, related_entity_id, created_at, metadata")
      .eq("ambassador_id", amb.profile.id)
      .eq("referral_lead_id", lead.id)
      .order("created_at", { ascending: true });

    return {
      gate: amb.active ? "active" as const : "suspended" as const,
      lead: {
        id: lead.id,
        lead_code: lead.lead_code,
        display_name: safeDisplayName(lead),
        program_id: lead.program_id,
        pricing_plan: lead.pricing_plan,
        campaign_id: lead.campaign_id,
        status: lead.status,
        attribution_status: lead.attribution_status,
        attribution_model: lead.attribution_model,
        attribution_public_reason: lead.attribution_public_reason,
        lead_source: lead.lead_source,
        lead_reference: lead.lead_reference,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
      },
      enrollment,
      commission,
      events: events ?? [],
    };
  });

// ---------- Activity feed ----------
export const listReferralActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      scope: z.enum(["all", "referrals", "enrollments", "verification", "attribution", "commission"]).default("all"),
      range: z.enum(["today", "7d", "30d", "90d", "all", "custom"]).default("30d"),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      limit: z.number().int().min(10).max(100).default(30),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const amb = await loadActiveAmbassador(context);
    if (!amb) return { items: [] };
    const { supabase } = context;
    let q = supabase
      .from("ambassador_referral_events")
      .select("id, event_type, event_label, event_source, related_entity_type, related_entity_id, referral_lead_id, enrollment_id, created_at")
      .eq("ambassador_id", amb.profile.id)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    const { from, to } = rangeFrom(data.range, data.fromDate, data.toDate);
    if (from) q = q.gte("created_at", from.toISOString());
    if (to) q = q.lte("created_at", to.toISOString());

    if (data.scope !== "all") {
      const map: Record<string, string[]> = {
        referrals: ["referral_created", "referral_lead", "program_enquiry_submitted"],
        enrollments: ["enrollment_started", "enrollment_submitted", "enrollment_confirmed"],
        verification: ["payment_submitted", "payment_verification_started", "payment_verified"],
        attribution: ["attribution_review", "attribution_confirmed", "attribution_invalid", "attribution_expired"],
        commission: ["commission_eligibility_review", "commission_eligible", "commission_approved", "commission_available", "commission_paid", "commission_reversed"],
      };
      const types = map[data.scope];
      if (types) q = q.in("event_type", types);
    }

    const { data: rows } = await q;
    return { items: rows ?? [] };
  });
