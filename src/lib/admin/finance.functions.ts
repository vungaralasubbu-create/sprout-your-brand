import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

async function logAction(context: any, action: string, targetType: string, targetId: string, reason?: string, metadata?: any) {
  await context.supabase.from("admin_finance_actions").insert({
    action, target_type: targetType, target_id: targetId, reason, metadata, actor_user_id: context.userId,
  });
}

/* ============================================================
 * LEADS
 * ============================================================ */

export const listAdminLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    search?: string; leadModel?: string; stage?: string; attribution?: string;
    partnerId?: string; courseId?: string; from?: string; to?: string; limit?: number;
  }) => data)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    let q = context.supabase
      .from("partner_leads")
      .select("id, full_name, mobile, email, program_interest, course_id, lead_model, source, status, attribution_status, priority, owner_partner_id, assigned_partner_id, last_activity_at, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.leadModel) q = q.eq("lead_model", data.leadModel as any);
    if (data.stage) q = q.eq("status", data.stage as any);
    if (data.attribution) q = q.eq("attribution_status", data.attribution as any);
    if (data.partnerId) q = q.or(`owner_partner_id.eq.${data.partnerId},assigned_partner_id.eq.${data.partnerId}`);
    if (data.courseId) q = q.eq("course_id", data.courseId);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.search) {
      const s = data.search.trim();
      q = q.or(`full_name.ilike.%${s}%,mobile.ilike.%${s}%,email.ilike.%${s}%,id.eq.${s.match(/^[0-9a-f-]{36}$/i) ? s : "00000000-0000-0000-0000-000000000000"}`);
    }
    const { data: leads, error } = await q;
    if (error) throw error;

    const partnerIds = Array.from(new Set(
      (leads ?? []).flatMap((l: any) => [l.owner_partner_id, l.assigned_partner_id].filter(Boolean))
    ));
    const courseIds = Array.from(new Set((leads ?? []).map((l: any) => l.course_id).filter(Boolean)));

    const [{ data: partners }, { data: courses }] = await Promise.all([
      partnerIds.length ? context.supabase.from("partners").select("id, display_name, email, first_name").in("id", partnerIds) : Promise.resolve({ data: [] as any[] }),
      courseIds.length ? context.supabase.from("courses").select("id, title, slug").in("id", courseIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const pmap = new Map((partners ?? []).map((p: any) => [p.id, p]));
    const cmap = new Map((courses ?? []).map((c: any) => [c.id, c]));

    return (leads ?? []).map((l: any) => ({
      ...l,
      email_masked: l.email ? l.email.replace(/(.).*?(@)/, "$1***$2") : null,
      mobile_masked: l.mobile ? l.mobile.replace(/.(?=.{4})/g, "*") : null,
      owner: l.owner_partner_id ? pmap.get(l.owner_partner_id) : null,
      assigned: l.assigned_partner_id ? pmap.get(l.assigned_partner_id) : null,
      course: l.course_id ? cmap.get(l.course_id) : null,
    }));
  });

/* ============================================================
 * ASSIGNED LEADS
 * ============================================================ */

export const listAssignmentQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const [{ data: unassigned }, { data: assigned }, { data: partners }] = await Promise.all([
      context.supabase.from("partner_leads")
        .select("id, full_name, mobile, email, course_id, program_interest, source, status, priority, created_at")
        .eq("lead_model", "supported")
        .is("assigned_partner_id", null)
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase.from("partner_leads")
        .select("id, full_name, course_id, program_interest, source, status, priority, assigned_partner_id, last_activity_at, created_at")
        .eq("lead_model", "supported")
        .not("assigned_partner_id", "is", null)
        .order("last_activity_at", { ascending: false, nullsFirst: false })
        .limit(200),
      context.supabase.from("partners")
        .select("id, full_name, email, selected_sales_model, sales_model_approval_status, status")
        .eq("status", "active"),
    ]);
    const pmap = new Map((partners ?? []).map((p: any) => [p.id, p]));
    return {
      unassigned: unassigned ?? [],
      assigned: (assigned ?? []).map((l: any) => ({ ...l, assigned: pmap.get(l.assigned_partner_id) })),
      partners: (partners ?? []).filter((p: any) =>
        p.selected_sales_model === "supported" || p.selected_sales_model === "dual" || p.selected_sales_model === "not_sure"),
    };
  });

export const assignLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string; partnerId: string | null; reason?: string; priority?: "low"|"medium"|"high" }) =>
    z.object({
      leadId: z.string().uuid(),
      partnerId: z.string().uuid().nullable(),
      reason: z.string().max(500).optional(),
      priority: z.enum(["low","medium","high"]).optional(),
    }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: existing } = await context.supabase
      .from("partner_leads").select("assigned_partner_id").eq("id", data.leadId).maybeSingle();
    const from_partner_id = existing?.assigned_partner_id ?? null;

    const patch: any = { assigned_partner_id: data.partnerId, last_activity_at: new Date().toISOString() };
    if (data.priority) patch.priority = data.priority;

    const { error } = await context.supabase.from("partner_leads").update(patch).eq("id", data.leadId);
    if (error) throw error;

    const action = data.partnerId ? (from_partner_id ? "reassigned" : "assigned") : "unassigned";
    await context.supabase.from("lead_assignment_history").insert({
      lead_id: data.leadId, from_partner_id, to_partner_id: data.partnerId,
      action, reason: data.reason, actor_user_id: context.userId,
    });
    await context.supabase.from("partner_lead_activities").insert({
      lead_id: data.leadId, activity_type: action === "reassigned" ? "reassigned" : "assigned",
      content: data.reason ?? null,
    });
    return { ok: true };
  });

export const setLeadPriority = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string; priority: "low"|"medium"|"high"; note?: string }) =>
    z.object({ leadId: z.string().uuid(), priority: z.enum(["low","medium","high"]), note: z.string().max(500).optional() }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    await context.supabase.from("partner_leads").update({ priority: data.priority }).eq("id", data.leadId);
    await context.supabase.from("lead_assignment_history").insert({
      lead_id: data.leadId, action: "priority_changed", reason: data.note, actor_user_id: context.userId,
      metadata: { priority: data.priority },
    });
    return { ok: true };
  });

export const holdLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string; reason: string }) =>
    z.object({ leadId: z.string().uuid(), reason: z.string().min(3).max(500) }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    await context.supabase.from("lead_assignment_history").insert({
      lead_id: data.leadId, action: "hold", reason: data.reason, actor_user_id: context.userId,
    });
    return { ok: true };
  });

export const getLeadHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string }) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: rows } = await context.supabase.from("lead_assignment_history")
      .select("*").eq("lead_id", data.leadId).order("created_at", { ascending: false });
    return rows ?? [];
  });

/* ============================================================
 * ATTRIBUTION REVIEWS
 * ============================================================ */

export const listAttributionReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { status?: string }) => data)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    let q = context.supabase
      .from("partner_lead_attribution_reviews")
      .select("id, lead_id, existing_lead_id, claiming_partner_id, status, reason, admin_notes, resolved_at, created_at")
      .order("created_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status as any);
    const { data: rows, error } = await q;
    if (error) throw error;

    const leadIds = Array.from(new Set((rows ?? []).flatMap((r: any) => [r.lead_id, r.existing_lead_id].filter(Boolean))));
    const partnerIds = Array.from(new Set((rows ?? []).map((r: any) => r.claiming_partner_id).filter(Boolean)));

    const [{ data: leads }, { data: partners }] = await Promise.all([
      leadIds.length ? context.supabase.from("partner_leads").select("id, full_name, source, course_id, program_interest, created_at, owner_partner_id, assigned_partner_id").in("id", leadIds) : Promise.resolve({ data: [] as any[] }),
      partnerIds.length ? context.supabase.from("partners").select("id, display_name, email, first_name").in("id", partnerIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const lmap = new Map((leads ?? []).map((l: any) => [l.id, l]));
    const pmap = new Map((partners ?? []).map((p: any) => [p.id, p]));
    return (rows ?? []).map((r: any) => ({
      ...r,
      lead: lmap.get(r.lead_id),
      existing_lead: r.existing_lead_id ? lmap.get(r.existing_lead_id) : null,
      claiming_partner: pmap.get(r.claiming_partner_id),
    }));
  });

export const resolveAttributionReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    reviewId: string;
    decision: "confirmed" | "rejected" | "conflict" | "admin_review" | "duplicate_review";
    notes?: string;
    newOwnerPartnerId?: string | null;
  }) => z.object({
    reviewId: z.string().uuid(),
    decision: z.enum(["confirmed","rejected","conflict","admin_review","duplicate_review"]),
    notes: z.string().max(1000).optional(),
    newOwnerPartnerId: z.string().uuid().nullable().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: review } = await context.supabase
      .from("partner_lead_attribution_reviews")
      .select("id, lead_id, claiming_partner_id")
      .eq("id", data.reviewId).maybeSingle();
    if (!review) throw new Error("Review not found");

    const resolvedTerminal = ["confirmed","rejected","conflict"].includes(data.decision);
    await context.supabase.from("partner_lead_attribution_reviews").update({
      status: data.decision as any, admin_notes: data.notes,
      resolved_at: resolvedTerminal ? new Date().toISOString() : null,
      resolved_by: resolvedTerminal ? context.userId : null,
    }).eq("id", data.reviewId);

    // Reflect on lead
    await context.supabase.from("partner_leads").update({ attribution_status: data.decision as any }).eq("id", review.lead_id);

    if (data.decision === "confirmed") {
      const newOwner = data.newOwnerPartnerId ?? review.claiming_partner_id;
      await context.supabase.from("partner_leads").update({ owner_partner_id: newOwner }).eq("id", review.lead_id);
    }

    await logAction(context, `attribution_${data.decision}`, "attribution_review", data.reviewId, data.notes);
    return { ok: true };
  });

/* ============================================================
 * REVENUE / COMMISSIONS
 * ============================================================ */

export const listRevenueRecords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { status?: string; partnerId?: string; search?: string; verifyOnly?: boolean }) => data)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    let q = context.supabase
      .from("commissions")
      .select("id, partner_id, enrollment_id, program_id, gross_revenue, eligible_revenue, revenue_share_rule_id, revenue_share_pct, commission_amount, status, refund_adjustment, lead_source, verified_at, approved_at, payout_at, created_at, admin_notes")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status as any);
    if (data.partnerId) q = q.eq("partner_id", data.partnerId);
    if (data.verifyOnly) q = q.in("status", ["calculated","under_verification","pending_verification","tracking"]);
    const { data: rows, error } = await q;
    if (error) throw error;

    const partnerIds = Array.from(new Set((rows ?? []).map((r: any) => r.partner_id).filter(Boolean)));
    const enrollmentIds = Array.from(new Set((rows ?? []).map((r: any) => r.enrollment_id).filter(Boolean)));
    const ruleIds = Array.from(new Set((rows ?? []).map((r: any) => r.revenue_share_rule_id).filter(Boolean)));

    const [{ data: partners }, { data: enrollments }, { data: rules }] = await Promise.all([
      partnerIds.length ? context.supabase.from("partners").select("id, display_name, email, first_name").in("id", partnerIds) : Promise.resolve({ data: [] as any[] }),
      enrollmentIds.length ? context.supabase.from("enrollments").select("id, program_title, student_name, gross_revenue, status, enrolled_at").in("id", enrollmentIds) : Promise.resolve({ data: [] as any[] }),
      ruleIds.length ? context.supabase.from("revenue_share_rules").select("id, name, program_id, partner_type, share_percentage, effective_from, effective_to").in("id", ruleIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const pmap = new Map((partners ?? []).map((p: any) => [p.id, p]));
    const emap = new Map((enrollments ?? []).map((e: any) => [e.id, e]));
    const rmap = new Map((rules ?? []).map((r: any) => [r.id, r]));

    let out = (rows ?? []).map((r: any) => ({
      ...r,
      partner: pmap.get(r.partner_id),
      enrollment: emap.get(r.enrollment_id),
      rule: r.revenue_share_rule_id ? rmap.get(r.revenue_share_rule_id) : null,
    }));
    if (data.search) {
      const s = data.search.toLowerCase();
      out = out.filter((r: any) =>
        r.id.startsWith(s) ||
        r.program_id.toLowerCase().includes(s) ||
        r.enrollment?.student_name?.toLowerCase().includes(s) ||
        r.partner?.full_name?.toLowerCase().includes(s));
    }
    return out;
  });

export const setRevenueStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    commissionId: string;
    action: "approve" | "hold" | "reject" | "request_review" | "mark_eligible" | "mark_available";
    reason?: string;
  }) => z.object({
    commissionId: z.string().uuid(),
    action: z.enum(["approve","hold","reject","request_review","mark_eligible","mark_available"]),
    reason: z.string().max(1000).optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if ((data.action === "reject" || data.action === "hold") && !data.reason) {
      throw new Error("Reason required");
    }
    const now = new Date().toISOString();
    const map: Record<string, any> = {
      approve: { status: "approved", approved_at: now, verified_at: now },
      hold: { status: "on_hold" },
      reject: { status: "rejected" },
      request_review: { status: "under_verification" },
      mark_eligible: { status: "eligible", verified_at: now },
      mark_available: { status: "available_for_payout", approved_at: now },
    };
    const patch = { ...map[data.action], admin_notes: data.reason ?? undefined };
    const { error } = await context.supabase.from("commissions").update(patch).eq("id", data.commissionId);
    if (error) throw error;
    await logAction(context, `revenue_${data.action}`, "commission", data.commissionId, data.reason);
    return { ok: true };
  });

/* ============================================================
 * PAYOUTS
 * ============================================================ */

export const listPayouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { status?: string; partnerId?: string; from?: string; to?: string; minAmount?: number; maxAmount?: number }) => data)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    let q = context.supabase
      .from("payouts")
      .select("id, partner_id, amount, requested_amount, approved_amount, payout_method, payment_reference, requested_at, processed_at, status, reference, created_at")
      .order("created_at", { ascending: false }).limit(300);
    if (data.status) q = q.eq("status", data.status as any);
    if (data.partnerId) q = q.eq("partner_id", data.partnerId);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.minAmount != null) q = q.gte("amount", data.minAmount);
    if (data.maxAmount != null) q = q.lte("amount", data.maxAmount);
    const { data: rows, error } = await q;
    if (error) throw error;

    const partnerIds = Array.from(new Set((rows ?? []).map((r: any) => r.partner_id)));
    const { data: partners } = partnerIds.length
      ? await context.supabase.from("partners").select("id, display_name, email, status, first_name").in("id", partnerIds)
      : { data: [] as any[] };
    const pmap = new Map((partners ?? []).map((p: any) => [p.id, p]));
    return (rows ?? []).map((r: any) => ({ ...r, partner: pmap.get(r.partner_id) }));
  });

export const getPayoutDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { payoutId: string }) => z.object({ payoutId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: payout, error } = await context.supabase.from("payouts").select("*").eq("id", data.payoutId).maybeSingle();
    if (error) throw error;
    if (!payout) throw new Error("Payout not found");
    const [{ data: partner }, { data: bank }, { data: items }, { data: history }] = await Promise.all([
      context.supabase.from("partners").select("id, display_name, email, first_name, status, kyc_completed, sales_model_approval_status").eq("id", payout.partner_id).maybeSingle(),
      context.supabase.from("partner_payout_details").select("*").eq("partner_id", payout.partner_id).maybeSingle(),
      context.supabase.from("payout_items").select("id, commission_id, amount").eq("payout_id", data.payoutId),
      context.supabase.from("admin_finance_actions").select("*").eq("target_type", "payout").eq("target_id", data.payoutId).order("created_at", { ascending: false }),
    ]);

    const commissionIds = (items ?? []).map((i: any) => i.commission_id);
    const { data: commissions } = commissionIds.length
      ? await context.supabase.from("commissions").select("id, program_id, commission_amount, gross_revenue, status").in("id", commissionIds)
      : { data: [] as any[] };
    const cmap = new Map((commissions ?? []).map((c: any) => [c.id, c]));

    const mask = (v?: string | null) => v ? v.replace(/.(?=.{4})/g, "•") : null;

    return {
      payout,
      partner,
      bank: bank ? {
        account_holder_name: bank.account_holder_name,
        bank_name: bank.bank_name,
        bank_account_number_masked: mask(bank.bank_account_number),
        ifsc_code: bank.ifsc_code,
        upi_id: bank.upi_id ? bank.upi_id.replace(/^(.).*(@)/, "$1***$2") : null,
        pan_masked: mask(bank.pan),
      } : null,
      items: (items ?? []).map((i: any) => ({ ...i, commission: cmap.get(i.commission_id) })),
      history: history ?? [],
    };
  });

export const setPayoutStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    payoutId: string;
    action: "start_review" | "approve" | "reject" | "hold" | "processing" | "paid" | "failed" | "reverse";
    approvedAmount?: number;
    paymentReference?: string;
    processedAt?: string;
    paymentMethod?: string;
    reason?: string;
  }) => z.object({
    payoutId: z.string().uuid(),
    action: z.enum(["start_review","approve","reject","hold","processing","paid","failed","reverse"]),
    approvedAmount: z.number().nonnegative().optional(),
    paymentReference: z.string().max(200).optional(),
    processedAt: z.string().optional(),
    paymentMethod: z.string().max(80).optional(),
    reason: z.string().max(1000).optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);

    const { data: payout } = await context.supabase.from("payouts").select("id, status, amount, approved_amount").eq("id", data.payoutId).maybeSingle();
    if (!payout) throw new Error("Payout not found");

    if (data.action === "paid") {
      if (!data.paymentReference || !data.paymentMethod || !data.processedAt) {
        throw new Error("Payment reference, method, and processed date are required to mark paid");
      }
      // Duplicate payout guard: any prior paid payout with the same reference
      const { data: dup } = await context.supabase
        .from("payouts").select("id").eq("payment_reference", data.paymentReference).neq("id", data.payoutId).limit(1);
      if (dup && dup.length) throw new Error("Duplicate payment reference — already used on another payout");
    }
    if ((data.action === "reject" || data.action === "hold") && !data.reason) {
      throw new Error("Reason required");
    }

    const now = new Date().toISOString();
    const map: Record<string, any> = {
      start_review: { status: "under_review" },
      approve: { status: "approved", approved_amount: data.approvedAmount ?? payout.amount },
      reject: { status: "rejected", rejection_reason: data.reason },
      hold: { status: "on_hold", hold_reason: data.reason },
      processing: { status: "processing" },
      paid: {
        status: "paid", payment_reference: data.paymentReference, payout_method: data.paymentMethod,
        processed_at: data.processedAt, processed_by: context.userId, reference: data.paymentReference,
      },
      failed: { status: "failed" },
      reverse: { status: "reversed" },
    };
    const { error } = await context.supabase.from("payouts").update(map[data.action]).eq("id", data.payoutId);
    if (error) throw error;

    if (data.action === "paid") {
      // Mark included commissions as paid
      const { data: items } = await context.supabase.from("payout_items").select("commission_id").eq("payout_id", data.payoutId);
      const ids = (items ?? []).map((i: any) => i.commission_id);
      if (ids.length) {
        await context.supabase.from("commissions").update({ status: "paid", payout_at: now }).in("id", ids);
      }
    }
    if (data.action === "reverse") {
      const { data: items } = await context.supabase.from("payout_items").select("commission_id").eq("payout_id", data.payoutId);
      const ids = (items ?? []).map((i: any) => i.commission_id);
      if (ids.length) {
        await context.supabase.from("commissions").update({ status: "available_for_payout", payout_at: null }).in("id", ids);
      }
    }

    await logAction(context, `payout_${data.action}`, "payout", data.payoutId, data.reason, {
      approvedAmount: data.approvedAmount, paymentReference: data.paymentReference, paymentMethod: data.paymentMethod,
    });
    return { ok: true };
  });

/* ============================================================
 * ADJUSTMENTS
 * ============================================================ */

export const listAdjustments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { status?: string; type?: string }) => data)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    let q = context.supabase.from("refund_adjustments")
      .select("id, commission_id, enrollment_id, reason, adjustment_amount, original_amount, adjustment_type, approval_status, approved_at, notes, created_at, created_by")
      .order("created_at", { ascending: false }).limit(300);
    if (data.status) q = q.eq("approval_status", data.status as any);
    if (data.type) q = q.eq("adjustment_type", data.type as any);
    const { data: rows, error } = await q;
    if (error) throw error;

    const commissionIds = Array.from(new Set((rows ?? []).map((r: any) => r.commission_id).filter(Boolean)));
    const { data: commissions } = commissionIds.length
      ? await context.supabase.from("commissions").select("id, partner_id, program_id, commission_amount, status").in("id", commissionIds)
      : { data: [] as any[] };
    const cmap = new Map((commissions ?? []).map((c: any) => [c.id, c]));
    return (rows ?? []).map((r: any) => ({ ...r, commission: cmap.get(r.commission_id) }));
  });

export const createAdjustment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    commissionId: string;
    adjustmentType: "full_refund"|"partial_refund"|"chargeback"|"cancelled_enrollment"|"failed_payment"|"duplicate_enrollment"|"fraud_review"|"manual_adjustment";
    adjustmentAmount: number;
    reason: string;
    notes?: string;
  }) => z.object({
    commissionId: z.string().uuid(),
    adjustmentType: z.enum(["full_refund","partial_refund","chargeback","cancelled_enrollment","failed_payment","duplicate_enrollment","fraud_review","manual_adjustment"]),
    adjustmentAmount: z.number().nonnegative(),
    reason: z.string().min(3).max(1000),
    notes: z.string().max(1000).optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: commission } = await context.supabase.from("commissions")
      .select("id, commission_amount, enrollment_id").eq("id", data.commissionId).maybeSingle();
    if (!commission) throw new Error("Commission not found");

    const { error } = await context.supabase.from("refund_adjustments").insert({
      commission_id: data.commissionId,
      enrollment_id: commission.enrollment_id,
      adjustment_type: data.adjustmentType,
      adjustment_amount: data.adjustmentAmount,
      original_amount: commission.commission_amount,
      reason: data.reason,
      notes: data.notes,
      approval_status: "pending",
      created_by: context.userId,
    });
    if (error) throw error;
    await logAction(context, "adjustment_created", "commission", data.commissionId, data.reason, { type: data.adjustmentType, amount: data.adjustmentAmount });
    return { ok: true };
  });

export const decideAdjustment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { adjustmentId: string; decision: "approved"|"rejected"; notes?: string }) =>
    z.object({ adjustmentId: z.string().uuid(), decision: z.enum(["approved","rejected"]), notes: z.string().max(1000).optional() }).parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: adj } = await context.supabase.from("refund_adjustments")
      .select("id, commission_id, adjustment_amount").eq("id", data.adjustmentId).maybeSingle();
    if (!adj) throw new Error("Adjustment not found");

    await context.supabase.from("refund_adjustments").update({
      approval_status: data.decision, approved_by: context.userId, approved_at: new Date().toISOString(), notes: data.notes,
    }).eq("id", data.adjustmentId);

    if (data.decision === "approved") {
      // Apply to commission: reduce commission_amount, mark refund_adjustment
      const { data: c } = await context.supabase.from("commissions")
        .select("commission_amount, refund_adjustment").eq("id", adj.commission_id).maybeSingle();
      if (c) {
        const newAdj = Number(c.refund_adjustment ?? 0) + Number(adj.adjustment_amount);
        const newAmount = Math.max(0, Number(c.commission_amount) - Number(adj.adjustment_amount));
        await context.supabase.from("commissions").update({
          refund_adjustment: newAdj,
          commission_amount: newAmount,
          status: "refund_adjusted",
        }).eq("id", adj.commission_id);
        await context.supabase.from("refund_adjustments").update({ approval_status: "applied" }).eq("id", data.adjustmentId);
      }
    }
    await logAction(context, `adjustment_${data.decision}`, "adjustment", data.adjustmentId, data.notes);
    return { ok: true };
  });

/* ============================================================
 * FINANCE SUMMARY
 * ============================================================ */

export const getFinanceSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

    const [pv, ap, av, pp, pm, oh, rv] = await Promise.all([
      context.supabase.from("commissions").select("commission_amount").in("status", ["pending_verification","under_verification","calculated","tracking"]),
      context.supabase.from("commissions").select("commission_amount").in("status", ["approved","eligible"]),
      context.supabase.from("commissions").select("commission_amount").eq("status", "available_for_payout"),
      context.supabase.from("payouts").select("amount, approved_amount").in("status", ["processing","approved","under_review","requested"]),
      context.supabase.from("payouts").select("amount, approved_amount").eq("status", "paid").gte("processed_at", startOfMonth.toISOString()),
      context.supabase.from("commissions").select("commission_amount").eq("status", "on_hold"),
      context.supabase.from("commissions").select("commission_amount").in("status", ["reversed","refund_adjusted"]),
    ]);

    const sum = (rows: any[] | null, key: string) => (rows ?? []).reduce((s, r) => s + Number(r[key] ?? 0), 0);
    return {
      pendingVerification: sum(pv.data, "commission_amount"),
      approvedRevenue: sum(ap.data, "commission_amount"),
      availableForPayout: sum(av.data, "commission_amount"),
      payoutProcessing: (pp.data ?? []).reduce((s, r) => s + Number(r.approved_amount ?? r.amount ?? 0), 0),
      paidThisMonth: (pm.data ?? []).reduce((s, r) => s + Number(r.approved_amount ?? r.amount ?? 0), 0),
      onHold: sum(oh.data, "commission_amount"),
      reversedRevenue: sum(rv.data, "commission_amount"),
    };
  });

export const listPartnersLiteFinance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data } = await context.supabase.from("partners").select("id, display_name, email, first_name").order("display_name").limit(500);
    return data ?? [];
  });
