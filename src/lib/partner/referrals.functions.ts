import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReferralStatus =
  | "signed_up"
  | "active"
  | "qualification_pending"
  | "qualified"
  | "bonus_pending_approval"
  | "bonus_approved"
  | "bonus_paid"
  | "rejected";

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  signed_up: "Signed Up",
  active: "Active",
  qualification_pending: "Qualification Pending",
  qualified: "Qualified",
  bonus_pending_approval: "Bonus Pending Approval",
  bonus_approved: "Bonus Approved",
  bonus_paid: "Bonus Paid",
  rejected: "Rejected",
};

async function resolvePartner(supabase: any, userId: string) {
  const { data } = await supabase
    .from("partners")
    .select("id, referral_code, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  return data as { id: string; referral_code: string | null; display_name: string | null } | null;
}

export const getPartnerReferralOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const partner = await resolvePartner(supabase, userId);
    const { data: settings } = await supabase
      .from("referral_program_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    const empty = {
      partner: partner
        ? { id: partner.id, referralCode: partner.referral_code, displayName: partner.display_name }
        : null,
      settings: settings ?? null,
      summary: {
        totalReferrals: 0,
        activeReferrals: 0,
        qualifiedReferrals: 0,
        pendingBonus: 0,
        approvedBonus: 0,
        paidBonus: 0,
      },
      referrals: [] as any[],
    };
    if (!partner) return empty;

    const { data: rows } = await supabase
      .from("partner_referrals")
      .select("id, referred_partner_id, referral_code, status, bonus_amount, signed_up_at, qualified_at, bonus_approved_at, bonus_paid_at")
      .eq("referrer_partner_id", partner.id)
      .order("signed_up_at", { ascending: false });

    const referred = (rows ?? []) as any[];
    const partnerIds = referred.map((r) => r.referred_partner_id).filter(Boolean);
    let names: Record<string, { name: string; code: string }> = {};
    if (partnerIds.length) {
      const { data: ps } = await supabase
        .from("partners")
        .select("id, display_name, partner_code")
        .in("id", partnerIds);
      (ps ?? []).forEach((p: any) => {
        names[p.id] = { name: p.display_name, code: p.partner_code };
      });
    }

    let total = 0,
      active = 0,
      qualified = 0,
      pending = 0,
      approved = 0,
      paid = 0;
    for (const r of referred) {
      total += 1;
      const amt = Number(r.bonus_amount || 0);
      if (r.status === "active" || r.status === "qualification_pending") active += 1;
      if (r.status === "qualified" || r.status === "bonus_pending_approval" || r.status === "bonus_approved" || r.status === "bonus_paid") qualified += 1;
      if (r.status === "bonus_pending_approval") pending += amt;
      if (r.status === "bonus_approved") approved += amt;
      if (r.status === "bonus_paid") paid += amt;
    }

    return {
      partner: {
        id: partner.id,
        referralCode: partner.referral_code,
        displayName: partner.display_name,
      },
      settings: settings ?? null,
      summary: {
        totalReferrals: total,
        activeReferrals: active,
        qualifiedReferrals: qualified,
        pendingBonus: pending,
        approvedBonus: approved,
        paidBonus: paid,
      },
      referrals: referred.map((r) => ({
        id: r.id,
        referredName: r.referred_partner_id ? names[r.referred_partner_id]?.name ?? "—" : "—",
        referredCode: r.referred_partner_id ? names[r.referred_partner_id]?.code ?? "—" : "—",
        referralCode: r.referral_code,
        status: r.status as ReferralStatus,
        bonusAmount: Number(r.bonus_amount || 0),
        signedUpAt: r.signed_up_at,
        qualifiedAt: r.qualified_at,
        bonusApprovedAt: r.bonus_approved_at,
        bonusPaidAt: r.bonus_paid_at,
      })),
    };
  });
