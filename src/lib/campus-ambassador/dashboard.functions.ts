import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns the origin used to build ambassador referral links.
 * Falls back to glintr.com if request context is unavailable.
 */
function siteOrigin() {
  return process.env.PUBLIC_SITE_URL || "https://www.glintr.com";
}

async function loadApprovedAmbassador(context: any) {
  const { supabase, userId } = context;
  const { data: profile } = await supabase
    .from("campus_ambassador_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return { profile: null, gate: "not_approved" as const };

  // Status: 'active' | 'suspended' | 'inactive' | 'terminated'
  const status = (profile.status as string) || "active";
  return { profile, gate: status as "active" | "suspended" | "inactive" | "terminated" };
}

function buildReferralLink(profile: any) {
  const code = profile?.referral_code;
  if (!code) return null;
  if (profile.referral_link) return profile.referral_link as string;
  return `${siteOrigin()}/ref/${code}`;
}

const NON_REVERSED = [
  "approved",
  "available",
  "payout_processing",
  "paid",
] as const;

const PENDING_STATUSES = [
  "pending_verification",
  "eligible",
  "on_hold",
] as const;

export const getAmbassadorDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { profile, gate } = await loadApprovedAmbassador(context);
    if (!profile) return { gate, profile: null };

    const referralLink = buildReferralLink(profile);

    // Referral metrics
    const [visitsRes, leadsRes, enrollmentsRes] = await Promise.all([
      supabase
        .from("ambassador_referral_visits")
        .select("id", { count: "exact", head: true })
        .eq("ambassador_id", profile.id),
      supabase
        .from("ambassador_referral_leads")
        .select("id, status", { count: "exact" })
        .eq("ambassador_id", profile.id),
      supabase
        .from("enrollments")
        .select("id, status, verified_at")
        .eq("ambassador_id", profile.id),
    ]);

    const totalVisits = visitsRes.count ?? 0;
    const totalLeads = leadsRes.count ?? 0;
    const enrollments = enrollmentsRes.data ?? [];
    const verifiedEnrollments = enrollments.filter(
      (e) => e.status === "verified" || !!e.verified_at,
    ).length;
    const pendingEnrollments = enrollments.length - verifiedEnrollments;
    const conversionRate =
      totalLeads > 0 ? Math.round((verifiedEnrollments / totalLeads) * 100 * 10) / 10 : 0;

    // Commission totals
    const { data: commissions } = await supabase
      .from("ambassador_commissions")
      .select("status, calculated_commission")
      .eq("ambassador_id", profile.id);

    let commissionEarned = 0; // approved / available / payout_processing / paid
    let availableEarnings = 0;
    let pendingCommission = 0;
    let paidEarnings = 0;
    for (const row of commissions ?? []) {
      const amt = Number(row.calculated_commission ?? 0);
      if ((NON_REVERSED as readonly string[]).includes(row.status)) commissionEarned += amt;
      if (row.status === "available" || row.status === "payout_processing") availableEarnings += amt;
      if ((PENDING_STATUSES as readonly string[]).includes(row.status)) pendingCommission += amt;
      if (row.status === "paid") paidEarnings += amt;
    }

    return {
      gate,
      profile: {
        id: profile.id,
        user_id: profile.user_id,
        ambassador_code: profile.ambassador_code,
        full_name: profile.full_name,
        college_name: profile.college_name,
        campus_city: profile.campus_city,
        state: profile.state,
        status: profile.status,
        approved_at: profile.approved_at,
        commission_ack_at: profile.commission_ack_at,
        referral_code: profile.referral_code,
        referral_link: referralLink,
        created_at: profile.created_at,
      },
      metrics: {
        totalVisits,
        totalReferrals: totalLeads,
        pendingEnrollments,
        verifiedEnrollments,
        conversionRate,
      },
      earnings: {
        commissionEarned,
        availableEarnings,
        pendingCommission,
        paidEarnings,
      },
      _unused: userId, // keep var used
    };
  });

export const getAmbassadorReferralTrend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      period: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { profile, gate } = await loadApprovedAmbassador(context);
    if (!profile || gate === "terminated" || gate === "inactive") return { points: [] };

    const now = new Date();
    let start: Date | null = null;
    if (data.period === "7d") start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    else if (data.period === "30d") start = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    else if (data.period === "90d") start = new Date(now.getTime() - 90 * 24 * 3600 * 1000);

    let q = context.supabase
      .from("ambassador_referral_visits")
      .select("created_at")
      .eq("ambassador_id", profile.id);
    if (start) q = q.gte("created_at", start.toISOString());
    const { data: visits } = await q;

    let eq = context.supabase
      .from("enrollments")
      .select("created_at, verified_at, status")
      .eq("ambassador_id", profile.id);
    if (start) eq = eq.gte("created_at", start.toISOString());
    const { data: enrollmentRows } = await eq;

    const buckets = new Map<string, { date: string; visits: number; enrollments: number }>();
    const bump = (date: string, key: "visits" | "enrollments") => {
      const b = buckets.get(date) ?? { date, visits: 0, enrollments: 0 };
      b[key] += 1;
      buckets.set(date, b);
    };
    for (const v of visits ?? []) bump(String(v.created_at).slice(0, 10), "visits");
    for (const e of enrollmentRows ?? []) {
      if (e.verified_at || e.status === "verified") {
        bump(String(e.verified_at ?? e.created_at).slice(0, 10), "enrollments");
      }
    }

    const points = Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
    return { points };
  });

export const getAmbassadorRecentActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { profile, gate } = await loadApprovedAmbassador(context);
    if (!profile) return { items: [], gate };

    const { data: leads } = await context.supabase
      .from("ambassador_referral_leads")
      .select("id, lead_code, display_name, program_id, status, created_at")
      .eq("ambassador_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: comms } = await context.supabase
      .from("ambassador_commissions")
      .select("id, transaction_code, program_id, status, calculated_commission, created_at, approved_at, available_at, paid_at, reversed_at")
      .eq("ambassador_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const items: {
      id: string;
      type: string;
      title: string;
      subtitle: string;
      when: string;
    }[] = [];

    for (const l of leads ?? []) {
      items.push({
        id: `lead-${l.id}`,
        type: "referral_lead",
        title: "Referral Lead Created",
        subtitle: [
          l.display_name || l.lead_code || "Referral Lead",
          l.program_id,
        ].filter(Boolean).join(" • "),
        when: l.created_at,
      });
    }
    for (const c of comms ?? []) {
      const map: Record<string, string> = {
        pending_verification: "Commission Pending",
        eligible: "Commission Eligible",
        approved: "Commission Approved",
        available: "Commission Available",
        payout_processing: "Payout Processing",
        paid: "Commission Paid",
        on_hold: "Commission On Hold",
        reversed: "Commission Reversed",
        ineligible: "Commission Ineligible",
      };
      items.push({
        id: `comm-${c.id}`,
        type: "commission",
        title: map[c.status] ?? "Commission Update",
        subtitle: [c.transaction_code, c.program_id, `₹${Number(c.calculated_commission ?? 0).toLocaleString("en-IN")}`]
          .filter(Boolean).join(" • "),
        when: c.reversed_at || c.paid_at || c.available_at || c.approved_at || c.created_at,
      });
    }

    items.sort((a, b) => (a.when < b.when ? 1 : -1));
    return { items: items.slice(0, 10), gate };
  });

export const getAmbassadorRecentEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { profile } = await loadApprovedAmbassador(context);
    if (!profile) return { items: [] };
    const { data: enrollments } = await context.supabase
      .from("enrollments")
      .select("id, program_id, program_title, student_name, status, enrolled_at, verified_at, gross_revenue, eligible_revenue, created_at")
      .eq("ambassador_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Attach commission info per enrollment
    const enrollmentIds = (enrollments ?? []).map((e) => e.id);
    let commMap = new Map<string, any>();
    if (enrollmentIds.length > 0) {
      const { data: comms } = await context.supabase
        .from("ambassador_commissions")
        .select("enrollment_id, status, calculated_commission")
        .in("enrollment_id", enrollmentIds);
      for (const c of comms ?? []) {
        commMap.set(String(c.enrollment_id), c);
      }
    }

    const items = (enrollments ?? []).map((e) => {
      const displayName = privacySafeName(e.student_name);
      const c = commMap.get(String(e.id));
      return {
        id: e.id,
        program_id: e.program_id,
        program_title: e.program_title,
        display_name: displayName,
        payment_status: e.verified_at || e.status === "verified" ? "Payment Verified" : "Payment Verification Pending",
        enrollment_status: e.status,
        enrolled_at: e.enrolled_at ?? e.created_at,
        commission_status: c?.status ?? "pending_verification",
        commission_amount: c ? Number(c.calculated_commission ?? 0) : null,
      };
    });
    return { items };
  });

export const getAmbassadorCommissionStructure = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rules } = await context.supabase
      .from("ambassador_commission_rules")
      .select("id, rule_code, name, program_id, pricing_plan, campaign_id, commission_percentage, base_definition, is_active, effective_from, effective_to")
      .eq("is_active", true)
      .order("commission_percentage", { ascending: false });
    return { rules: rules ?? [] };
  });

export const getAmbassadorCommissionDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { profile } = await loadApprovedAmbassador(context);
    if (!profile) throw new Error("Ambassador access required");
    const { data: c } = await context.supabase
      .from("ambassador_commissions")
      .select("*")
      .eq("id", data.id)
      .eq("ambassador_id", profile.id)
      .maybeSingle();
    if (!c) throw new Error("Commission transaction not found");
    return c;
  });

export const recordAmbassadorActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      event: z.enum([
        "ambassador_dashboard_opened",
        "referral_link_copied",
        "referral_link_shared",
        "referral_code_copied",
        "referral_qr_downloaded",
        "referral_qr_shared",
        "commission_details_viewed",
        "commission_structure_viewed",
      ]),
      detail: z.string().max(400).optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { profile } = await loadApprovedAmbassador(context);
    if (!profile) return { ok: false };

    // De-dupe dashboard_opened per hour
    if (data.event === "ambassador_dashboard_opened") {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: existing } = await context.supabase
        .from("campus_ambassador_activity")
        .select("id")
        .eq("ambassador_profile_id", profile.id)
        .eq("event", data.event)
        .gte("created_at", oneHourAgo)
        .limit(1);
      if (existing && existing.length > 0) return { ok: true, deduped: true };
    }

    await context.supabase.from("campus_ambassador_activity").insert({
      ambassador_profile_id: profile.id,
      user_id: context.userId,
      actor_role: "ambassador",
      event: data.event,
      detail: data.detail ?? null,
    });
    return { ok: true };
  });

function privacySafeName(name: string | null | undefined) {
  if (!name) return "Referral Lead";
  const trimmed = name.trim();
  if (!trimmed) return "Referral Lead";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
