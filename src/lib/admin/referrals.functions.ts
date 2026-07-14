import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden");
}

export const adminListReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string; search?: string } | undefined) => input ?? {})
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    let q = supabase
      .from("partner_referrals")
      .select(
        "id, referrer_partner_id, referred_partner_id, referral_code, status, bonus_amount, signed_up_at, qualified_at, bonus_approved_at, bonus_paid_at, payout_reference, admin_note, rejection_reason"
      )
      .order("signed_up_at", { ascending: false });
    if (data.status && data.status !== "all") q = q.eq("status", data.status);

    const { data: rows } = await q;
    const referrerIds = Array.from(new Set((rows ?? []).map((r: any) => r.referrer_partner_id)));
    const referredIds = Array.from(
      new Set((rows ?? []).map((r: any) => r.referred_partner_id).filter(Boolean))
    );

    const idSet = new Set([...referrerIds, ...referredIds]);
    let partnersMap: Record<string, { name: string; code: string }> = {};
    if (idSet.size) {
      const { data: ps } = await supabase
        .from("partners")
        .select("id, display_name, partner_code")
        .in("id", Array.from(idSet));
      (ps ?? []).forEach((p: any) => {
        partnersMap[p.id] = { name: p.display_name ?? "—", code: p.partner_code ?? "—" };
      });
    }

    // Verified sales / revenue per referred partner
    let salesMap: Record<string, { count: number; revenue: number }> = {};
    if (referredIds.length) {
      const { data: coms } = await supabase
        .from("commissions")
        .select("partner_id, gross_revenue, status")
        .in("partner_id", referredIds)
        .in("status", ["approved", "payout_processing", "paid"]);
      (coms ?? []).forEach((c: any) => {
        const m = salesMap[c.partner_id] ?? { count: 0, revenue: 0 };
        m.count += 1;
        m.revenue += Number(c.gross_revenue || 0);
        salesMap[c.partner_id] = m;
      });
    }

    const rowsOut = (rows ?? []).map((r: any) => {
      const referrer = partnersMap[r.referrer_partner_id];
      const referred = r.referred_partner_id ? partnersMap[r.referred_partner_id] : null;
      const sales = r.referred_partner_id ? salesMap[r.referred_partner_id] : null;
      return {
        id: r.id,
        referrerName: referrer?.name ?? "—",
        referrerPartnerCode: referrer?.code ?? "—",
        referredName: referred?.name ?? "—",
        referredPartnerCode: referred?.code ?? "—",
        referralCode: r.referral_code,
        status: r.status,
        bonusAmount: Number(r.bonus_amount || 0),
        signedUpAt: r.signed_up_at,
        qualifiedAt: r.qualified_at,
        bonusApprovedAt: r.bonus_approved_at,
        bonusPaidAt: r.bonus_paid_at,
        payoutReference: r.payout_reference,
        adminNote: r.admin_note,
        rejectionReason: r.rejection_reason,
        verifiedSales: sales?.count ?? 0,
        revenueGenerated: sales?.revenue ?? 0,
      };
    });

    const search = (data.search ?? "").trim().toLowerCase();
    const filtered = search
      ? rowsOut.filter(
          (r) =>
            r.referrerName.toLowerCase().includes(search) ||
            r.referredName.toLowerCase().includes(search) ||
            r.referralCode.toLowerCase().includes(search) ||
            r.referrerPartnerCode.toLowerCase().includes(search) ||
            r.referredPartnerCode.toLowerCase().includes(search)
        )
      : rowsOut;

    return { rows: filtered };
  });

export const adminGetReferralSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data } = await supabase
      .from("referral_program_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    return { settings: data };
  });

export const adminUpdateReferralSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    is_active: boolean;
    bonus_amount: number;
    min_verified_sales: number;
    min_revenue_generated: number;
    qualification_period_days: number;
  }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase
      .from("referral_program_settings")
      .update({
        is_active: data.is_active,
        bonus_amount: data.bonus_amount,
        min_verified_sales: data.min_verified_sales,
        min_revenue_generated: data.min_revenue_generated,
        qualification_period_days: data.qualification_period_days,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminActOnReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id: string;
    action: "approve" | "reject" | "mark_paid";
    reason?: string;
    payout_reference?: string;
    paid_date?: string;
    admin_note?: string;
    bonus_amount?: number;
  }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: cur } = await supabase
      .from("partner_referrals")
      .select("id, status, bonus_amount")
      .eq("id", data.id)
      .maybeSingle();
    if (!cur) throw new Error("Referral not found");

    const now = new Date().toISOString();
    const updates: Record<string, any> = {};

    if (data.action === "approve") {
      if (cur.status !== "bonus_pending_approval" && cur.status !== "qualified") {
        throw new Error("Only pending/qualified referrals can be approved");
      }
      updates.status = "bonus_approved";
      updates.bonus_approved_at = now;
      updates.bonus_approved_by = userId;
      if (typeof data.bonus_amount === "number") updates.bonus_amount = data.bonus_amount;
      if (data.admin_note) updates.admin_note = data.admin_note;
    } else if (data.action === "reject") {
      if (!data.reason?.trim()) throw new Error("Rejection reason is required");
      updates.status = "rejected";
      updates.rejection_reason = data.reason.trim();
    } else if (data.action === "mark_paid") {
      if (cur.status !== "bonus_approved") throw new Error("Only approved bonuses can be marked paid");
      if (!data.payout_reference?.trim()) throw new Error("Payout reference is required");
      if (!data.paid_date) throw new Error("Paid date is required");
      updates.status = "bonus_paid";
      updates.bonus_paid_at = new Date(data.paid_date).toISOString();
      updates.bonus_paid_by = userId;
      updates.payout_reference = data.payout_reference.trim();
      if (data.admin_note) updates.admin_note = data.admin_note;
    }

    const { error } = await supabase.from("partner_referrals").update(updates).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
