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
        "id, display_name, first_name, email, mobile, partner_code, status, lead_model, sales_model_selection, default_revenue_share, onboarding_completed_at, payout_min_threshold, bank_account_last4, bank_name, payout_details_verified, work_model, work_model_status",
      )
      .eq("user_id", userId)
      .maybeSingle();

    // Employment profile presence (for Full-Time employees)
    let employeeProfile: { id: string; employee_code: string } | null = null;
    if (partner && partner.work_model === "full_time") {
      const { data: emp } = await supabase
        .from("employee_profiles")
        .select("id, employee_code")
        .eq("partner_id", partner.id)
        .maybeSingle();
      employeeProfile = emp ?? null;
    }

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

type PaymentStatus = "pending" | "verified" | "rejected";

/** Sales Overview page — KPIs, chart series, and recent payments. */
export const getOverviewStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const empty = {
      totalSales: 0,
      totalCollected: 0,
      pendingVerification: 0,
      verifiedPayments: 0,
      leadsAssigned: 0,
      leadsContacted: 0,
      leadsNotAnswered: 0,
      referralEarnings: 0,
      daily: [] as { date: string; amount: number; sales: number }[],
      monthly: [] as { month: string; amount: number; sales: number }[],
      recentPayments: [] as {
        id: string;
        student_name: string;
        program_title: string;
        amount: number;
        status: PaymentStatus;
        enrolled_at: string;
      }[],
    };
    if (!partner) return empty;

    const partnerId = partner.id;

    const [enrollmentsRes, leadsRes, referralRes, recentRes] = await Promise.all([
      supabase
        .from("enrollments")
        .select("id, gross_revenue, status, verified_at, enrolled_at")
        .eq("partner_id", partnerId),
      supabase
        .from("partner_leads")
        .select("id, status")
        .or(`owner_partner_id.eq.${partnerId},assigned_partner_id.eq.${partnerId}`),
      supabase
        .from("commissions")
        .select("commission_amount, status")
        .eq("partner_id", partnerId)
        .eq("status", "paid"),
      supabase
        .from("enrollments")
        .select("id, student_name, program_title, gross_revenue, status, verified_at, enrolled_at")
        .eq("partner_id", partnerId)
        .order("enrolled_at", { ascending: false })
        .limit(5),
    ]);

    const enrollments = enrollmentsRes.data ?? [];
    const leads = leadsRes.data ?? [];
    const referrals = referralRes.data ?? [];
    const recent = recentRes.data ?? [];

    const statusOf = (row: { status: string; verified_at: string | null }): PaymentStatus => {
      if (row.status === "verified" || row.verified_at) return "verified";
      if (["cancelled", "refund_full", "refund_partial", "fraud_review", "duplicate"].includes(row.status)) return "rejected";
      return "pending";
    };

    const totalSales = enrollments.length;
    let totalCollected = 0;
    let pendingVerification = 0;
    let verifiedPayments = 0;
    for (const e of enrollments) {
      const s = statusOf(e as any);
      const amt = Number(e.gross_revenue ?? 0);
      if (s === "verified") {
        verifiedPayments += 1;
        totalCollected += amt;
      } else if (s === "pending") {
        pendingVerification += 1;
      }
    }

    const contactedStatuses = new Set([
      "contacted",
      "interested",
      "follow_up",
      "application_started",
      "application_submitted",
      "payment_pending",
      "enrolled",
    ]);
    const leadsAssigned = leads.length;
    let leadsContacted = 0;
    let leadsNotAnswered = 0;
    for (const l of leads) {
      if (contactedStatuses.has(l.status as string)) leadsContacted += 1;
      else if (l.status === "new") leadsNotAnswered += 1;
    }

    const referralEarnings = referrals.reduce(
      (a, r) => a + Number(r.commission_amount ?? 0),
      0,
    );

    // Daily series (last 30 days)
    const dailyMap = new Map<string, { amount: number; sales: number }>();
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { amount: 0, sales: 0 });
    }
    const monthlyMap = new Map<string, { amount: number; sales: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, { amount: 0, sales: 0 });
    }
    for (const e of enrollments) {
      if (!e.enrolled_at) continue;
      const amt = Number(e.gross_revenue ?? 0);
      const dayKey = new Date(e.enrolled_at).toISOString().slice(0, 10);
      if (dailyMap.has(dayKey)) {
        const v = dailyMap.get(dayKey)!;
        v.amount += amt;
        v.sales += 1;
      }
      const d = new Date(e.enrolled_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(monthKey)) {
        const v = monthlyMap.get(monthKey)!;
        v.amount += amt;
        v.sales += 1;
      }
    }

    const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v }));
    const monthly = Array.from(monthlyMap.entries()).map(([month, v]) => ({ month, ...v }));

    const recentPayments = recent.map((e) => ({
      id: e.id,
      student_name: e.student_name,
      program_title: e.program_title,
      amount: Number(e.gross_revenue ?? 0),
      status: statusOf(e as any),
      enrolled_at: e.enrolled_at,
    }));

    return {
      totalSales,
      totalCollected,
      pendingVerification,
      verifiedPayments,
      leadsAssigned,
      leadsContacted,
      leadsNotAnswered,
      referralEarnings,
      daily,
      monthly,
      recentPayments,
    };
  });

