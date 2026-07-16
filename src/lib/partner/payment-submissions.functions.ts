import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PLAN_LABELS, type PaymentPlan } from "./payment-links.functions";

const PAYMENT_METHODS = ["upi", "bank_transfer", "payment_gateway", "card", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  payment_gateway: "Payment Gateway",
  card: "Card",
  other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  pending_verification: "Pending Verification",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  needs_more_info: "Needs More Information",
  duplicate_flagged: "Duplicate — Needs Review",
};

export function paymentStatusLabel(s: string) {
  return STATUS_LABELS[s] ?? s;
}

async function resolvePartnerId(supabase: any, userId: string) {
  const { data } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id as string | undefined;
}

function normalizeUtr(v: string) {
  return (v ?? "").toString().replace(/\s+/g, "").toLowerCase();
}

/** Partner id for the current user (browser needs it to build storage paths). */
export const getPartnerIdentity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const partnerId = await resolvePartnerId(context.supabase, context.userId);
    return { partner_id: partnerId ?? null };
  });

/**
 * One call for the Payment Verification page: partner card data + summary
 * metrics (total submitted, verified, pending, rejected, verified amount,
 * average review time in hours).
 */
export const getMyPaymentVerificationOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select(
        "id, display_name, partner_code, sales_model_selection, default_revenue_share, created_at, onboarding_completed_at",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (!partner) {
      return {
        partner: null,
        totalEarnings: 0,
        metrics: {
          total: 0,
          pending: 0,
          verified: 0,
          rejected: 0,
          needsInfo: 0,
          duplicate: 0,
          verifiedAmount: 0,
          avgReviewHours: null as number | null,
        },
      };
    }

    const { data: earnings } = await supabase
      .from("commissions")
      .select("commission_amount, status")
      .eq("partner_id", partner.id)
      .in("status", ["paid", "approved", "available_for_payout"]);

    const totalEarnings = (earnings ?? []).reduce(
      (s: number, r: any) => s + Number(r.commission_amount ?? 0),
      0,
    );

    const { data: rows } = await supabase
      .from("partner_payment_submissions")
      .select("status, is_duplicate_flag, amount, submitted_at, reviewed_at")
      .eq("partner_id", partner.id);

    let pending = 0, verified = 0, rejected = 0, needsInfo = 0, duplicate = 0;
    let verifiedAmount = 0;
    let reviewMsSum = 0, reviewCount = 0;
    for (const r of rows ?? []) {
      const s = r.status as string;
      if (s === "verified") { verified++; verifiedAmount += Number(r.amount ?? 0); }
      else if (s === "rejected") rejected++;
      else if (s === "needs_more_info") needsInfo++;
      else if (s === "duplicate_flagged" || r.is_duplicate_flag) { duplicate++; pending++; }
      else if (s === "pending_verification" || s === "under_review") pending++;
      if (r.reviewed_at && r.submitted_at) {
        const ms = new Date(r.reviewed_at as string).getTime() - new Date(r.submitted_at as string).getTime();
        if (Number.isFinite(ms) && ms >= 0) { reviewMsSum += ms; reviewCount++; }
      }
    }

    return {
      partner: {
        id: partner.id as string,
        display_name: partner.display_name as string,
        partner_code: (partner.partner_code as string | null) ?? null,
        sales_model_selection: (partner.sales_model_selection as string | null) ?? null,
        default_revenue_share: Number(partner.default_revenue_share ?? 0),
        joined_at: (partner.onboarding_completed_at as string | null) ?? (partner.created_at as string | null) ?? null,
      },
      totalEarnings,
      metrics: {
        total: (rows ?? []).length,
        pending,
        verified,
        rejected,
        needsInfo,
        duplicate,
        verifiedAmount,
        avgReviewHours: reviewCount ? Math.round((reviewMsSum / reviewCount) / 36e5 * 10) / 10 : null,
      },
    };
  });

/** Lead + all payment-link context the form needs, in one call. */
export const getLeadPaymentContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ lead_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) throw new Error("Partner profile not found.");

    const { data: lead, error: leadErr } = await supabase
      .from("partner_leads")
      .select("id, full_name, mobile, program_interest, course_id, owner_partner_id, assigned_partner_id, courses:course_id(id, name)")
      .eq("id", data.lead_id)
      .maybeSingle();
    if (leadErr) throw new Error(leadErr.message);
    if (!lead) throw new Error("Lead not found.");
    if (lead.owner_partner_id !== partnerId && lead.assigned_partner_id !== partnerId) {
      throw new Error("You are not authorised to view this lead.");
    }

    // Payment links previously assigned to this lead by this partner
    const { data: assignments } = await supabase
      .from("partner_lead_payment_links")
      .select("id, payment_link_id, course_id, plan, amount, url, assigned_at, courses:course_id(name)")
      .eq("partner_id", partnerId)
      .eq("lead_id", data.lead_id)
      .order("assigned_at", { ascending: false });

    // Active master links (fallback if none assigned yet)
    const { data: activeLinks } = await supabase
      .from("payment_links")
      .select("id, course_id, plan, amount, url, is_active, courses:course_id(id, name, status, is_published)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return {
      lead: {
        id: lead.id as string,
        full_name: lead.full_name as string,
        mobile: lead.mobile as string,
        program_interest: (lead.program_interest as string | null) ?? null,
        course_id: (lead.course_id as string | null) ?? null,
        course_name: (lead.courses?.name as string | null) ?? null,
      },
      assignments: (assignments ?? []).map((a: any) => ({
        id: a.id as string,
        payment_link_id: a.payment_link_id as string,
        course_id: a.course_id as string,
        course_name: a.courses?.name as string,
        plan: a.plan as PaymentPlan,
        plan_label: PLAN_LABELS[a.plan as PaymentPlan],
        amount: Number(a.amount),
        url: a.url as string,
        assigned_at: a.assigned_at as string,
      })),
      active_links: (activeLinks ?? [])
        .filter((r: any) => r.courses?.status === "published" && r.courses?.is_published)
        .map((r: any) => ({
          id: r.id as string,
          course_id: r.course_id as string,
          course_name: r.courses?.name as string,
          plan: r.plan as PaymentPlan,
          plan_label: PLAN_LABELS[r.plan as PaymentPlan],
          amount: Number(r.amount),
          url: r.url as string,
        })),
    };
  });

const submitInput = z.object({
  lead_id: z.string().uuid(),
  course_id: z.string().uuid(),
  plan: z.enum(["self_paced_edge", "career_launch", "career_pro"]),
  amount: z.number().nonnegative().max(10_000_000),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  payment_method: z.enum(PAYMENT_METHODS),
  utr_reference: z.string().trim().min(4).max(120),
  payment_link_id: z.string().uuid().nullable().optional(),
  lead_payment_link_id: z.string().uuid().nullable().optional(),
  partner_notes: z.string().trim().max(2000).optional().nullable(),
  proof_path: z.string().min(3).max(500),
  proof_mime: z.string().max(120).optional().nullable(),
  proof_size_bytes: z.number().int().nonnegative().max(10 * 1024 * 1024).optional().nullable(),
});

export const submitPaymentProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submitInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) throw new Error("Partner profile not found.");

    // Verify lead ownership
    const { data: lead, error: leadErr } = await supabase
      .from("partner_leads")
      .select("id, owner_partner_id, assigned_partner_id")
      .eq("id", data.lead_id)
      .maybeSingle();
    if (leadErr) throw new Error(leadErr.message);
    if (!lead) throw new Error("Lead not found.");
    if (lead.owner_partner_id !== partnerId && lead.assigned_partner_id !== partnerId) {
      throw new Error("You are not authorised to submit for this lead.");
    }

    // Storage path must be scoped to partner_id folder
    if (!data.proof_path.startsWith(`${partnerId}/`)) {
      throw new Error("Invalid proof file path.");
    }

    const utrNorm = normalizeUtr(data.utr_reference);

    // Duplicate UTR check across all submissions
    const { data: dup } = await supabase
      .from("partner_payment_submissions")
      .select("id")
      .eq("utr_normalized", utrNorm)
      .limit(1)
      .maybeSingle();
    const isDuplicate = !!dup;

    const { data: inserted, error: insErr } = await supabase
      .from("partner_payment_submissions")
      .insert({
        partner_id: partnerId,
        lead_id: data.lead_id,
        course_id: data.course_id,
        plan: data.plan,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        utr_reference: data.utr_reference.trim(),
        payment_link_id: data.payment_link_id ?? null,
        lead_payment_link_id: data.lead_payment_link_id ?? null,
        partner_notes: data.partner_notes ?? null,
        proof_bucket: "payment-proofs",
        proof_path: data.proof_path,
        proof_mime: data.proof_mime ?? null,
        proof_size_bytes: data.proof_size_bytes ?? null,
        status: isDuplicate ? "duplicate_flagged" : "pending_verification",
        is_duplicate_flag: isDuplicate,
      })
      .select("id, status, submitted_at, amount, plan")
      .single();
    if (insErr) throw new Error(insErr.message);

    // Timeline activity
    await supabase.from("partner_lead_activities").insert({
      lead_id: data.lead_id,
      partner_id: partnerId,
      activity_type: "payment_recorded",
      content: isDuplicate
        ? `Payment proof submitted — duplicate UTR, flagged for review`
        : `Payment proof submitted`,
      metadata: {
        kind: "payment_submission",
        submission_id: inserted.id,
        amount: Number(inserted.amount),
        plan: inserted.plan,
        plan_label: PLAN_LABELS[inserted.plan as PaymentPlan],
        status: inserted.status,
        duplicate: isDuplicate,
      },
    });

    await supabase
      .from("partner_leads")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", data.lead_id);

    return {
      id: inserted.id as string,
      status: inserted.status as string,
      duplicate: isDuplicate,
    };
  });

const listInput = z.object({
  status: z
    .enum([
      "all",
      "pending_verification",
      "under_review",
      "verified",
      "rejected",
      "needs_more_info",
    ])
    .optional()
    .default("all"),
});

export const listMyPaymentSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) return [];

    let q = supabase
      .from("partner_payment_submissions")
      .select(
        "id, plan, amount, utr_reference, status, submitted_at, is_duplicate_flag, courses:course_id(name), partner_leads:lead_id(full_name, mobile)",
      )
      .eq("partner_id", partnerId)
      .order("submitted_at", { ascending: false })
      .limit(200);

    if (data.status === "pending_verification") {
      q = q.in("status", ["pending_verification", "duplicate_flagged"]);
    } else if (data.status !== "all") {
      q = q.eq("status", data.status);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      id: r.id as string,
      plan: r.plan as PaymentPlan,
      plan_label: PLAN_LABELS[r.plan as PaymentPlan],
      amount: Number(r.amount),
      utr_reference: r.utr_reference as string,
      status: r.status as string,
      status_label: paymentStatusLabel(r.status),
      submitted_at: r.submitted_at as string,
      is_duplicate_flag: !!r.is_duplicate_flag,
      course_name: (r.courses?.name as string) ?? "—",
      lead_name: (r.partner_leads?.full_name as string) ?? "—",
      lead_mobile: (r.partner_leads?.mobile as string) ?? "",
    }));
  });

export const getMyPaymentSubmissionDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const partnerId = await resolvePartnerId(supabase, userId);
    if (!partnerId) throw new Error("Partner profile not found.");

    const { data: row, error } = await supabase
      .from("partner_payment_submissions")
      .select(
        "id, partner_id, plan, amount, payment_date, payment_method, utr_reference, partner_notes, proof_bucket, proof_path, proof_mime, status, submitted_at, is_duplicate_flag, admin_notes, courses:course_id(name), partner_leads:lead_id(full_name, mobile)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.partner_id !== partnerId) throw new Error("Not found.");

    // Signed URL for the private proof file
    const { data: signed } = await supabase.storage
      .from(row.proof_bucket as string)
      .createSignedUrl(row.proof_path as string, 60 * 10); // 10 min

    return {
      id: row.id as string,
      plan: row.plan as PaymentPlan,
      plan_label: PLAN_LABELS[row.plan as PaymentPlan],
      amount: Number(row.amount),
      payment_date: row.payment_date as string,
      payment_method: row.payment_method as PaymentMethod,
      payment_method_label: PAYMENT_METHOD_LABELS[row.payment_method as PaymentMethod],
      utr_reference: row.utr_reference as string,
      partner_notes: (row.partner_notes as string | null) ?? null,
      admin_notes: (row.admin_notes as string | null) ?? null,
      status: row.status as string,
      status_label: paymentStatusLabel(row.status as string),
      submitted_at: row.submitted_at as string,
      is_duplicate_flag: !!row.is_duplicate_flag,
      course_name: (row.courses?.name as string) ?? "—",
      lead_name: (row.partner_leads?.full_name as string) ?? "—",
      lead_mobile: (row.partner_leads?.mobile as string) ?? "",
      proof_url: signed?.signedUrl ?? null,
      proof_mime: (row.proof_mime as string | null) ?? null,
    };
  });
