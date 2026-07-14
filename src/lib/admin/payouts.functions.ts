import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  EARNING_STATUS_LABEL,
  type EarningStatus,
} from "@/lib/partner/earnings.functions";
import { PLAN_LABELS, type PaymentPlan } from "@/lib/partner/payment-links.functions";

async function requireAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const listInput = z.object({
  status: z
    .enum([
      "all",
      "approved",
      "due_soon",
      "payout_processing",
      "paid",
      "on_hold",
      "overdue",
    ])
    .optional()
    .default("all"),
  search: z.string().trim().max(120).optional().nullable(),
});

export const adminListPartnerPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    let q = supabase
      .from("commissions")
      .select(
        "id, partner_id, submission_id, plan, gross_revenue, commission_amount, revenue_share_pct, lead_type, status, verified_at, approved_at, payout_target_at, payout_at, payout_reference, hold_reason, partners:partner_id(partner_code, display_name, first_name, email), partner_leads:lead_id(full_name), courses:course_id(name), partner_payment_submissions:submission_id(utr_reference)",
      )
      .not("submission_id", "is", null)
      .order("verified_at", { ascending: false })
      .limit(500);

    const now = new Date().toISOString();

    if (data.status === "approved") q = q.eq("status", "approved");
    else if (data.status === "payout_processing") q = q.eq("status", "payout_processing");
    else if (data.status === "paid") q = q.eq("status", "paid");
    else if (data.status === "on_hold") q = q.eq("status", "on_hold");
    else if (data.status === "due_soon")
      q = q.eq("status", "approved").lte("payout_target_at", nowPlus(24));
    else if (data.status === "overdue")
      q = q.eq("status", "approved").lt("payout_target_at", now);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let out = (rows ?? []) as any[];

    const search = (data.search ?? "").trim();
    if (search) {
      const s = search.toLowerCase();
      const digits = search.replace(/\D/g, "");
      out = out.filter((r) => {
        const name = String(r.partners?.display_name || r.partners?.first_name || "")
          .toLowerCase();
        const code = String(r.partners?.partner_code ?? "").toLowerCase();
        const lead = String(r.partner_leads?.full_name ?? "").toLowerCase();
        const prog = String(r.courses?.name ?? "").toLowerCase();
        const utr = String(r.partner_payment_submissions?.utr_reference ?? "").toLowerCase();
        return (
          name.includes(s) ||
          code.includes(s) ||
          lead.includes(s) ||
          prog.includes(s) ||
          utr.includes(s) ||
          (digits.length >= 4 && utr.includes(digits))
        );
      });
    }

    return out.map((r: any) => ({
      id: r.id as string,
      partner_id: r.partner_id as string,
      partner_code: (r.partners?.partner_code as string) ?? "—",
      partner_name:
        ((r.partners?.display_name || r.partners?.first_name) as string) ?? "—",
      partner_email: (r.partners?.email as string) ?? "",
      lead_name: (r.partner_leads?.full_name as string) ?? "—",
      program_name: (r.courses?.name as string) ?? "—",
      plan: r.plan as PaymentPlan,
      plan_label: PLAN_LABELS[r.plan as PaymentPlan] ?? "—",
      sale_amount: Number(r.gross_revenue ?? 0),
      commission_amount: Number(r.commission_amount ?? 0),
      revenue_share_pct: Number(r.revenue_share_pct ?? 0),
      lead_type: r.lead_type as "own" | "glintr_provided",
      status: r.status as EarningStatus,
      status_label: EARNING_STATUS_LABEL[r.status as EarningStatus] ?? String(r.status),
      verified_at: r.verified_at as string | null,
      payout_target_at: r.payout_target_at as string | null,
      paid_at: r.payout_at as string | null,
      payout_reference: (r.payout_reference as string | null) ?? null,
      hold_reason: (r.hold_reason as string | null) ?? null,
      utr_reference:
        (r.partner_payment_submissions?.utr_reference as string | null) ?? null,
    }));
  });

function nowPlus(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export const adminPayoutSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data } = await supabase
      .from("commissions")
      .select("status, commission_amount, payout_target_at")
      .not("submission_id", "is", null);

    const counts = { approved: 0, payout_processing: 0, paid: 0, on_hold: 0, overdue: 0 };
    const totals = { approved: 0, payout_processing: 0, paid: 0, on_hold: 0 };
    const now = Date.now();
    for (const r of (data ?? []) as any[]) {
      const s = r.status as keyof typeof totals;
      const amt = Number(r.commission_amount ?? 0);
      if (s in counts) counts[s as keyof typeof counts]++;
      if (s in totals) totals[s] += amt;
      if (
        r.status === "approved" &&
        r.payout_target_at &&
        new Date(r.payout_target_at).getTime() < now
      )
        counts.overdue++;
    }
    return { counts, totals };
  });

const actionInput = z.object({
  id: z.string().uuid(),
  action: z.enum(["mark_processing", "mark_paid", "hold", "resume"]),
  payout_reference: z.string().trim().max(120).optional().nullable(),
  paid_date: z.string().optional().nullable(), // ISO date
  message: z.string().trim().max(2000).optional().nullable(),
});

const NEXT: Record<string, EarningStatus> = {
  mark_processing: "payout_processing",
  mark_paid: "paid",
  hold: "on_hold",
  resume: "approved",
};

export const adminActOnPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => actionInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const next = NEXT[data.action];
    if (data.action === "mark_paid" && !data.payout_reference?.trim()) {
      throw new Error("Payout reference is required to mark as paid.");
    }
    if (data.action === "hold" && !data.message?.trim()) {
      throw new Error("A reason is required to place a payout on hold.");
    }

    const { data: cur, error: curErr } = await supabase
      .from("commissions")
      .select("id, status, partner_id, commission_amount")
      .eq("id", data.id)
      .maybeSingle();
    if (curErr) throw new Error(curErr.message);
    if (!cur) throw new Error("Earning record not found");
    if (cur.status === "paid" && data.action !== "mark_paid") {
      throw new Error("Paid payouts cannot be changed.");
    }

    const updates: any = { status: next, updated_at: new Date().toISOString() };
    if (data.action === "mark_paid") {
      updates.payout_at = data.paid_date
        ? new Date(data.paid_date).toISOString()
        : new Date().toISOString();
      updates.payout_reference = data.payout_reference!.trim();
      updates.paid_by = userId;
      updates.hold_reason = null;
    } else if (data.action === "hold") {
      updates.hold_reason = data.message!.trim();
    } else if (data.action === "resume") {
      updates.hold_reason = null;
    } else if (data.action === "mark_processing") {
      updates.hold_reason = null;
    }
    if (data.message?.trim() && data.action !== "hold") {
      updates.admin_notes = data.message.trim();
    }

    const { error: upErr } = await supabase
      .from("commissions")
      .update(updates)
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    return { id: cur.id as string, status: next };
  });
