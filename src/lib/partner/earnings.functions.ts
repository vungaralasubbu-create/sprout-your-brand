import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLAN_LABELS, type PaymentPlan } from "@/lib/partner/payment-links.functions";

/**
 * Earnings statuses mapped from commission_status:
 *   pending_verification  -> shown from partner_payment_submissions (no commission yet)
 *   approved              -> commissions.status = 'approved'
 *   payout_processing     -> commissions.status = 'payout_processing'
 *   paid                  -> commissions.status = 'paid'
 *   on_hold               -> commissions.status = 'on_hold'
 *   cancelled             -> commissions.status = 'cancelled'
 */
export type EarningStatus =
  | "pending_verification"
  | "approved"
  | "payout_processing"
  | "paid"
  | "on_hold"
  | "cancelled";

export const EARNING_STATUS_LABEL: Record<EarningStatus, string> = {
  pending_verification: "Pending Verification",
  approved: "Approved",
  payout_processing: "Payout Processing",
  paid: "Paid",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

async function resolvePartnerId(supabase: any, userId: string) {
  const { data } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id as string | undefined;
}

/** Summary cards + full earnings history for the partner Earnings page. */
export const getPartnerEarnings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);

    const empty = {
      summary: {
        totalEarnings: 0,
        pendingVerification: 0,
        approvedEarnings: 0,
        payoutProcessing: 0,
        paidEarnings: 0,
        referralBonus: 0,
      },
      earnings: [] as EarningRow[],
      pending: [] as PendingRow[],
    };
    if (!partnerId) return empty;

    // Verified/approved/paid/on-hold earnings (commissions)
    const { data: commRows } = await supabase
      .from("commissions")
      .select(
        "id, submission_id, lead_id, plan, gross_revenue, commission_amount, revenue_share_pct, lead_type, status, verified_at, approved_at, payout_target_at, payout_at, payout_reference, hold_reason, admin_notes, partner_leads:lead_id(full_name), courses:course_id(name)",
      )
      .eq("partner_id", partnerId)
      .order("verified_at", { ascending: false });

    // Pending / rejected payment submissions (never turn into commissions until verified)
    const { data: subRows } = await supabase
      .from("partner_payment_submissions")
      .select(
        "id, plan, amount, status, submitted_at, partner_leads:lead_id(full_name), courses:course_id(name)",
      )
      .eq("partner_id", partnerId)
      .in("status", ["pending_verification", "under_review", "needs_more_info"])
      .order("submitted_at", { ascending: false });

    const earnings: EarningRow[] = (commRows ?? []).map((r: any) => ({
      id: r.id as string,
      submission_id: (r.submission_id as string | null) ?? null,
      lead_name: (r.partner_leads?.full_name as string) ?? "—",
      program_name: (r.courses?.name as string) ?? "—",
      plan: (r.plan as PaymentPlan) ?? "self_paced_edge",
      plan_label: PLAN_LABELS[(r.plan as PaymentPlan) ?? "self_paced_edge"] ?? "—",
      sale_amount: Number(r.gross_revenue ?? 0),
      commission_amount: Number(r.commission_amount ?? 0),
      revenue_share_pct: Number(r.revenue_share_pct ?? 0),
      lead_type: (r.lead_type as "own" | "glintr_provided") ?? "glintr_provided",
      status: (r.status as EarningStatus) ?? "approved",
      status_label: EARNING_STATUS_LABEL[(r.status as EarningStatus) ?? "approved"],
      verified_at: (r.verified_at as string | null) ?? (r.approved_at as string | null),
      payout_target_at: (r.payout_target_at as string | null) ?? null,
      paid_at: (r.payout_at as string | null) ?? null,
      payout_reference: (r.payout_reference as string | null) ?? null,
      hold_reason: (r.hold_reason as string | null) ?? null,
      admin_notes: (r.admin_notes as string | null) ?? null,
    }));

    const pending: PendingRow[] = (subRows ?? []).map((r: any) => ({
      id: r.id as string,
      lead_name: (r.partner_leads?.full_name as string) ?? "—",
      program_name: (r.courses?.name as string) ?? "—",
      plan: r.plan as PaymentPlan,
      plan_label: PLAN_LABELS[r.plan as PaymentPlan] ?? "—",
      sale_amount: Number(r.amount ?? 0),
      status: r.status as string,
      submitted_at: r.submitted_at as string,
    }));

    // Sum by status
    const sumByStatus = (s: EarningStatus) =>
      earnings.filter((e) => e.status === s).reduce((a, b) => a + b.commission_amount, 0);

    const approvedEarnings = sumByStatus("approved");
    const payoutProcessing = sumByStatus("payout_processing");
    const paidEarnings = sumByStatus("paid");
    // "Pending Verification" summary = potential 70/50% earnings on unverified sales,
    // computed defensively as 50% of pending sale amount (conservative estimate).
    const pendingVerification = pending.reduce((a, r) => a + r.sale_amount * 0.5, 0);
    const totalEarnings = approvedEarnings + payoutProcessing + paidEarnings;

    return {
      summary: {
        totalEarnings,
        pendingVerification,
        approvedEarnings,
        payoutProcessing,
        paidEarnings,
        referralBonus: 0, // not built in this task
      },
      earnings,
      pending,
    };
  });

export type EarningRow = {
  id: string;
  submission_id: string | null;
  lead_name: string;
  program_name: string;
  plan: PaymentPlan;
  plan_label: string;
  sale_amount: number;
  commission_amount: number;
  revenue_share_pct: number;
  lead_type: "own" | "glintr_provided";
  status: EarningStatus;
  status_label: string;
  verified_at: string | null;
  payout_target_at: string | null;
  paid_at: string | null;
  payout_reference: string | null;
  hold_reason: string | null;
  admin_notes: string | null;
};

export type PendingRow = {
  id: string;
  lead_name: string;
  program_name: string;
  plan: PaymentPlan;
  plan_label: string;
  sale_amount: number;
  status: string;
  submitted_at: string;
};

/** Small earnings summary used by the dashboard Overview. */
export const getOverviewEarnings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) {
      return {
        estimatedEarnings: 0,
        approvedEarnings: 0,
        payoutProcessing: 0,
        paidEarnings: 0,
        ownLeadCount: 0,
        glintrLeadCount: 0,
      };
    }
    const { data: comm } = await supabase
      .from("commissions")
      .select("commission_amount, status, lead_type")
      .eq("partner_id", partnerId);

    let approved = 0;
    let processing = 0;
    let paid = 0;
    let own = 0;
    let glintr = 0;
    for (const r of (comm ?? []) as any[]) {
      const amt = Number(r.commission_amount ?? 0);
      if (r.status === "approved") approved += amt;
      else if (r.status === "payout_processing") processing += amt;
      else if (r.status === "paid") paid += amt;
      if (r.lead_type === "own") own += 1;
      else if (r.lead_type === "glintr_provided") glintr += 1;
    }
    return {
      estimatedEarnings: approved + processing + paid,
      approvedEarnings: approved,
      payoutProcessing: processing,
      paidEarnings: paid,
      ownLeadCount: own,
      glintrLeadCount: glintr,
    };
  });
