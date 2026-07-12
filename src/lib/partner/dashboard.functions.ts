import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Partner profile snapshot for the workspace shell. */
export const getPartnerContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select(
        "id, display_name, first_name, email, mobile, partner_code, status, lead_model, sales_model_selection, default_revenue_share, onboarding_completed_at, payout_min_threshold, bank_account_last4, bank_name, payout_details_verified",
      )
      .eq("user_id", userId)
      .maybeSingle();

    // Notification unread count
    let unreadNotifications = 0;
    if (partner) {
      const { count } = await supabase
        .from("partner_notifications")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partner.id)
        .eq("is_read", false);
      unreadNotifications = count ?? 0;
    }

    return { partner: partner ?? null, unreadNotifications };
  });

/** KPI counts + today's follow-ups for /partner/dashboard. */
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!partner) return null;

    const partnerId = partner.id;
    const activeLeadStatuses = [
      "new",
      "contacted",
      "interested",
      "follow_up",
      "application_started",
      "application_submitted",
      "payment_pending",
    ] as const;

    const [
      activeLeads,
      eligibleSales,
      pendingRevenue,
      availablePayout,
      todayFollowUps,
    ] = await Promise.all([
      supabase
        .from("partner_leads")
        .select("id", { count: "exact", head: true })
        .or(`owner_partner_id.eq.${partnerId},assigned_partner_id.eq.${partnerId}`)
        .in("status", activeLeadStatuses),
      supabase
        .from("commissions")
        .select("commission_amount", { count: "exact" })
        .eq("partner_id", partnerId)
        .in("status", ["approved", "payout_processing", "paid"]),
      supabase
        .from("commissions")
        .select("commission_amount")
        .eq("partner_id", partnerId)
        .in("status", ["calculated", "under_verification"]),
      supabase
        .from("commissions")
        .select("commission_amount")
        .eq("partner_id", partnerId)
        .eq("status", "approved"),
      supabase
        .from("partner_follow_ups")
        .select("id, due_at, type, notes, lead_id, partner_leads(full_name)")
        .eq("partner_id", partnerId)
        .eq("status", "scheduled")
        .gte("due_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .lte("due_at", new Date(new Date().setHours(23, 59, 59, 999)).toISOString())
        .order("due_at", { ascending: true })
        .limit(10),
    ]);

    const sum = (rows: { commission_amount: number }[] | null) =>
      (rows ?? []).reduce((a, r) => a + Number(r.commission_amount ?? 0), 0);

    return {
      activeLeads: activeLeads.count ?? 0,
      eligibleSales: eligibleSales.count ?? 0,
      pendingRevenue: sum(pendingRevenue.data as never),
      availablePayout: sum(availablePayout.data as never),
      todayFollowUps: (todayFollowUps.data ?? []) as Array<{
        id: string;
        due_at: string;
        type: string;
        notes: string | null;
        lead_id: string;
        partner_leads: { full_name: string } | null;
      }>,
    };
  });
