import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PLAN_LABELS, type PaymentPlan } from "@/lib/partner/payment-links.functions";
import {
  PAYMENT_METHOD_LABELS,
  paymentStatusLabel,
  type PaymentMethod,
} from "@/lib/partner/payment-submissions.functions";

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function normalizeUtr(v: string) {
  return (v ?? "").toString().replace(/\s+/g, "").toLowerCase();
}

const STATUS_FILTERS = [
  "all",
  "pending_verification",
  "under_review",
  "verified",
  "rejected",
  "needs_more_info",
  "duplicate_flagged",
] as const;

const listInput = z.object({
  status: z.enum(STATUS_FILTERS).optional().default("all"),
  search: z.string().trim().max(120).optional().nullable(),
});

export const adminListPaymentSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    let q = supabase
      .from("partner_payment_submissions")
      .select(
        "id, partner_id, plan, amount, utr_reference, status, submitted_at, is_duplicate_flag, courses:course_id(name), partner_leads:lead_id(full_name, mobile, mobile_normalized), partners:partner_id(partner_code, user_id, profiles:user_id(full_name))",
      )
      .order("submitted_at", { ascending: false })
      .limit(300);

    if (data.status !== "all") q = q.eq("status", data.status);

    const search = (data.search ?? "").trim();
    if (search) {
      // Try UTR / partner code / lead mobile / name search on the primary table columns
      const digits = search.replace(/\D/g, "");
      const or: string[] = [`utr_reference.ilike.%${search}%`];
      if (digits.length >= 4) or.push(`utr_normalized.ilike.%${digits}%`);
      q = q.or(or.join(","));
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let filtered = (rows ?? []) as any[];
    if (search) {
      const s = search.toLowerCase();
      const digits = search.replace(/\D/g, "");
      filtered = filtered.filter((r) => {
        const utr = String(r.utr_reference ?? "").toLowerCase();
        const name = String(r.partner_leads?.full_name ?? "").toLowerCase();
        const mob = String(r.partner_leads?.mobile_normalized ?? "");
        const code = String(r.partners?.partner_code ?? "").toLowerCase();
        return (
          utr.includes(s) ||
          name.includes(s) ||
          (digits.length >= 4 && mob.includes(digits)) ||
          code.includes(s)
        );
      });
    }

    return filtered.map((r: any) => ({
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
      partner_code: (r.partners?.partner_code as string) ?? "—",
      partner_name: (r.partners?.profiles?.full_name as string) ?? "—",
    }));
  });

export const adminPaymentSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data } = await supabase
      .from("partner_payment_submissions")
      .select("status, is_duplicate_flag");
    const rows = (data ?? []) as any[];
    const counts = {
      pending_verification: 0,
      under_review: 0,
      verified: 0,
      rejected: 0,
      needs_more_info: 0,
      duplicate_flagged: 0,
    };
    for (const r of rows) {
      if (r.status && r.status in counts) counts[r.status as keyof typeof counts]++;
    }
    return counts;
  });

export const adminGetPaymentSubmission = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const { data: row, error } = await supabase
      .from("partner_payment_submissions")
      .select(
        "id, partner_id, lead_id, course_id, plan, amount, payment_date, payment_method, utr_reference, utr_normalized, payment_link_id, partner_notes, admin_notes, proof_bucket, proof_path, proof_mime, status, submitted_at, is_duplicate_flag, reviewed_by, reviewed_at, courses:course_id(name), partner_leads:lead_id(full_name, mobile, status), partners:partner_id(partner_code, user_id), payment_links:payment_link_id(url)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Submission not found");

    // Fetch partner profile separately (no FK between partners.user_id and profiles)
    const partnerUserId = (row.partners as any)?.user_id as string | undefined;
    let partnerProfile: { full_name?: string | null; email?: string | null } | null = null;
    if (partnerUserId) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", partnerUserId)
        .maybeSingle();
      partnerProfile = prof ?? null;
    }

    // Duplicate UTR: any other submission with same normalized UTR
    const { data: dups } = await supabase
      .from("partner_payment_submissions")
      .select("id, status, amount, submitted_at, partners:partner_id(partner_code)")
      .eq("utr_normalized", row.utr_normalized as string)
      .neq("id", row.id as string)
      .order("submitted_at", { ascending: false })
      .limit(5);

    const { data: history } = await supabase
      .from("partner_payment_actions")
      .select("id, action, from_status, to_status, actor_role, message, created_at")
      .eq("submission_id", row.id as string)
      .order("created_at", { ascending: true });

    // Signed proof URL
    const { data: signed } = await supabase.storage
      .from(row.proof_bucket as string)
      .createSignedUrl(row.proof_path as string, 60 * 15);

    return {
      id: row.id as string,
      status: row.status as string,
      status_label: paymentStatusLabel(row.status as string),
      plan: row.plan as PaymentPlan,
      plan_label: PLAN_LABELS[row.plan as PaymentPlan],
      amount: Number(row.amount),
      payment_date: row.payment_date as string,
      payment_method: row.payment_method as PaymentMethod,
      payment_method_label: PAYMENT_METHOD_LABELS[row.payment_method as PaymentMethod],
      utr_reference: row.utr_reference as string,
      partner_notes: (row.partner_notes as string | null) ?? null,
      admin_notes: (row.admin_notes as string | null) ?? null,
      submitted_at: row.submitted_at as string,
      reviewed_at: (row.reviewed_at as string | null) ?? null,
      is_duplicate_flag: !!row.is_duplicate_flag,
      course_id: row.course_id as string,
      course_name: (row.courses?.name as string) ?? "—",
      lead_id: row.lead_id as string,
      lead_name: (row.partner_leads?.full_name as string) ?? "—",
      lead_mobile: (row.partner_leads?.mobile as string) ?? "",
      lead_status: (row.partner_leads?.status as string) ?? "",
      partner_id: row.partner_id as string,
      partner_code: (row.partners?.partner_code as string) ?? "—",
      partner_name: (row.partners?.profiles?.full_name as string) ?? "—",
      partner_email: (row.partners?.profiles?.email as string) ?? "",
      payment_link_url: (row.payment_links?.url as string | null) ?? null,
      proof_url: signed?.signedUrl ?? null,
      proof_mime: (row.proof_mime as string | null) ?? null,
      duplicates: (dups ?? []).map((d: any) => ({
        id: d.id as string,
        status: d.status as string,
        status_label: paymentStatusLabel(d.status),
        amount: Number(d.amount),
        submitted_at: d.submitted_at as string,
        partner_code: (d.partners?.partner_code as string) ?? "—",
      })),
      history: (history ?? []).map((h: any) => ({
        id: h.id as string,
        action: h.action as string,
        from_status: (h.from_status as string | null) ?? null,
        to_status: h.to_status as string,
        to_status_label: paymentStatusLabel(h.to_status),
        actor_role: h.actor_role as string,
        message: (h.message as string | null) ?? null,
        created_at: h.created_at as string,
      })),
    };
  });

const actionInput = z.object({
  id: z.string().uuid(),
  action: z.enum(["mark_under_review", "verify", "reject", "request_info"]),
  message: z.string().trim().max(2000).optional().nullable(),
});

const NEXT_STATUS: Record<string, "under_review" | "verified" | "rejected" | "needs_more_info"> = {
  mark_under_review: "under_review",
  verify: "verified",
  reject: "rejected",
  request_info: "needs_more_info",
};

export const adminActOnPaymentSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => actionInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const nextStatus = NEXT_STATUS[data.action];
    if ((data.action === "reject" || data.action === "request_info") && !data.message?.trim()) {
      throw new Error(
        data.action === "reject" ? "Rejection reason is required." : "Admin message is required.",
      );
    }

    // Load current submission
    const { data: cur, error: curErr } = await supabase
      .from("partner_payment_submissions")
      .select("id, status, lead_id, partner_id, amount, plan, utr_normalized")
      .eq("id", data.id)
      .maybeSingle();
    if (curErr) throw new Error(curErr.message);
    if (!cur) throw new Error("Submission not found");

    // Idempotency: don't do anything if already in the target state
    if (cur.status === nextStatus) {
      return { id: cur.id as string, status: cur.status as string, noop: true };
    }

    // Verified is terminal — cannot re-verify or move away silently
    if (cur.status === "verified") {
      throw new Error("This payment is already verified and cannot be changed.");
    }

    // Extra guard for verify: another submission with same UTR already verified?
    if (data.action === "verify") {
      const { data: dupVerified } = await supabase
        .from("partner_payment_submissions")
        .select("id")
        .eq("utr_normalized", cur.utr_normalized as string)
        .eq("status", "verified")
        .neq("id", cur.id as string)
        .limit(1)
        .maybeSingle();
      if (dupVerified) {
        throw new Error(
          "Another submission with the same UTR is already verified. Reject this one instead.",
        );
      }
    }

    const updates: any = {
      status: nextStatus,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    };
    if (data.message?.trim()) updates.admin_notes = data.message.trim();

    const { error: updErr } = await supabase
      .from("partner_payment_submissions")
      .update(updates)
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    // Record action history
    await supabase.from("partner_payment_actions").insert({
      submission_id: data.id,
      action: data.action,
      from_status: cur.status,
      to_status: nextStatus,
      actor_user_id: userId,
      actor_role: "admin",
      message: data.message?.trim() || null,
    });

    // On verify: mark lead as enrolled (closest to "converted" in partner_lead_status)
    if (data.action === "verify") {
      await supabase
        .from("partner_leads")
        .update({ status: "enrolled", last_activity_at: new Date().toISOString() })
        .eq("id", cur.lead_id as string);

      await supabase.from("partner_lead_activities").insert({
        lead_id: cur.lead_id,
        partner_id: cur.partner_id,
        activity_type: "payment_recorded",
        content: "Payment verified by admin — sale confirmed",
        metadata: {
          kind: "payment_verified",
          submission_id: cur.id,
          amount: Number(cur.amount),
          plan: cur.plan,
        },
      });
    } else if (data.action === "reject" || data.action === "request_info") {
      await supabase.from("partner_lead_activities").insert({
        lead_id: cur.lead_id,
        partner_id: cur.partner_id,
        activity_type: "payment_recorded",
        content:
          data.action === "reject"
            ? `Payment rejected by admin${data.message ? `: ${data.message}` : ""}`
            : `Admin requested more information${data.message ? `: ${data.message}` : ""}`,
        metadata: {
          kind: data.action,
          submission_id: cur.id,
          status: nextStatus,
        },
      });
    }

    return { id: cur.id as string, status: nextStatus, noop: false };
  });
