import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

const rangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  groupBy: z.enum(["day", "week", "month"]).default("day"),
});

type RangeInput = z.infer<typeof rangeSchema>;

function startOfBucket(iso: string, group: "day" | "week" | "month") {
  const d = new Date(iso);
  if (group === "day") { d.setUTCHours(0, 0, 0, 0); return d.toISOString().slice(0, 10); }
  if (group === "week") {
    const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = dt.getUTCDay();
    const diff = (day + 6) % 7; // Monday start
    dt.setUTCDate(dt.getUTCDate() - diff);
    return dt.toISOString().slice(0, 10);
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// =============================================================
// TOP METRICS (Today + This Month + operational counts)
// =============================================================
export const getCommandTopMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setUTCHours(0, 0, 0, 0);
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const dayISO = startOfDay.toISOString();
    const monthISO = startOfMonth.toISOString();
    const nowISO = now.toISOString();

    const [
      todaySales,
      monthSales,
      pendingVerification,
      underReview,
      activePartners,
      leadsAssignedToday,
      leadsNotContacted,
      overdueFollowUps,
      approvedPayouts,
    ] = await Promise.all([
      s.from("partner_payment_submissions")
        .select("amount", { count: "exact" })
        .eq("status", "verified")
        .gte("reviewed_at", dayISO),
      s.from("partner_payment_submissions")
        .select("amount", { count: "exact" })
        .eq("status", "verified")
        .gte("reviewed_at", monthISO),
      s.from("partner_payment_submissions").select("id", { count: "exact", head: true })
        .eq("status", "pending_verification"),
      s.from("partner_payment_submissions").select("id", { count: "exact", head: true })
        .in("status", ["under_review", "needs_more_info", "duplicate_flagged"]),
      s.from("partners").select("id", { count: "exact", head: true }).eq("status", "active"),
      s.from("partner_leads").select("id", { count: "exact", head: true })
        .gte("assigned_at", dayISO),
      s.from("partner_leads").select("id", { count: "exact", head: true })
        .eq("status", "new")
        .is("updated_at", null),
      s.from("partner_follow_ups").select("id", { count: "exact", head: true })
        .eq("status", "scheduled")
        .lt("due_at", nowISO),
      s.from("payouts").select("approved_amount, amount")
        .in("status", ["approved", "queued"]),
    ]);

    const todayVerifiedRevenue = (todaySales.data ?? []).reduce((a: number, r: any) => a + Number(r.amount ?? 0), 0);
    const monthVerifiedRevenue = (monthSales.data ?? []).reduce((a: number, r: any) => a + Number(r.amount ?? 0), 0);
    const approvedPayoutsDue = (approvedPayouts.data ?? []).reduce(
      (a: number, r: any) => a + Number(r.approved_amount ?? r.amount ?? 0), 0,
    );

    return {
      todayVerifiedSales: todaySales.count ?? 0,
      todayVerifiedRevenue,
      monthVerifiedRevenue,
      pendingVerification: pendingVerification.count ?? 0,
      underReview: underReview.count ?? 0,
      activePartners: activePartners.count ?? 0,
      leadsAssignedToday: leadsAssignedToday.count ?? 0,
      leadsNotContacted: leadsNotContacted.count ?? 0,
      overdueFollowUps: overdueFollowUps.count ?? 0,
      approvedPayoutsDue,
      approvedPayoutsCount: (approvedPayouts.data ?? []).length,
    };
  });

// =============================================================
// MAIN COMMAND ANALYTICS (date-range + groupBy driven)
// =============================================================
export const getCommandAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: RangeInput) => rangeSchema.parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { from, to, groupBy } = data;

    // Verified submissions in range
    const { data: submissions, error: subErr } = await s
      .from("partner_payment_submissions")
      .select("id, partner_id, course_id, lead_id, amount, plan, reviewed_at, submitted_at, status")
      .eq("status", "verified")
      .gte("reviewed_at", from)
      .lte("reviewed_at", to);
    if (subErr) throw subErr;

    // Commissions in range (verified/approved/paid) — for partner earnings & lead-type split
    const { data: commissions } = await s
      .from("commissions")
      .select("partner_id, course_id, commission_amount, revenue_share_pct, gross_revenue, lead_type, status, verified_at, created_at, lead_id")
      .in("status", ["approved", "paid", "under_verification", "calculated"])
      .gte("created_at", from)
      .lte("created_at", to);

    const salesSeriesMap = new Map<string, { bucket: string; sales: number; revenue: number }>();
    for (const r of submissions ?? []) {
      const at = (r as any).reviewed_at ?? (r as any).submitted_at;
      if (!at) continue;
      const bucket = startOfBucket(at, groupBy);
      const cur = salesSeriesMap.get(bucket) ?? { bucket, sales: 0, revenue: 0 };
      cur.sales += 1;
      cur.revenue += Number((r as any).amount ?? 0);
      salesSeriesMap.set(bucket, cur);
    }
    const salesSeries = [...salesSeriesMap.values()].sort((a, b) => (a.bucket < b.bucket ? -1 : 1));

    // Totals
    const totalVerifiedSales = (submissions ?? []).length;
    const totalVerifiedRevenue = (submissions ?? []).reduce((a, r: any) => a + Number(r.amount ?? 0), 0);

    // Top Partners
    const partnerAgg = new Map<string, { partnerId: string; sales: number; revenue: number; earnings: number }>();
    for (const r of submissions ?? []) {
      const key = (r as any).partner_id;
      const cur = partnerAgg.get(key) ?? { partnerId: key, sales: 0, revenue: 0, earnings: 0 };
      cur.sales += 1;
      cur.revenue += Number((r as any).amount ?? 0);
      partnerAgg.set(key, cur);
    }
    for (const c of commissions ?? []) {
      const key = (c as any).partner_id;
      const cur = partnerAgg.get(key) ?? { partnerId: key, sales: 0, revenue: 0, earnings: 0 };
      cur.earnings += Number((c as any).commission_amount ?? 0);
      partnerAgg.set(key, cur);
    }
    const partnerIds = [...partnerAgg.keys()];
    let partnerMeta: any[] = [];
    if (partnerIds.length) {
      const { data: pm } = await s
        .from("partners")
        .select("id, partner_code, display_name, first_name, mobile")
        .in("id", partnerIds);
      partnerMeta = pm ?? [];
    }
    // Assigned leads per partner in range (for conversion)
    let assignedLeadsMap = new Map<string, number>();
    if (partnerIds.length) {
      const { data: leadsRows } = await s
        .from("partner_leads")
        .select("owner_partner_id, assigned_partner_id")
        .or(`owner_partner_id.in.(${partnerIds.join(",")}),assigned_partner_id.in.(${partnerIds.join(",")})`)
        .gte("created_at", from)
        .lte("created_at", to);
      for (const l of leadsRows ?? []) {
        const pid = (l as any).assigned_partner_id ?? (l as any).owner_partner_id;
        if (!pid) continue;
        assignedLeadsMap.set(pid, (assignedLeadsMap.get(pid) ?? 0) + 1);
      }
    }
    const topPartners = [...partnerAgg.values()]
      .map((p) => {
        const meta: any = partnerMeta.find((m) => m.id === p.partnerId) ?? {};
        const leads = assignedLeadsMap.get(p.partnerId) ?? 0;
        return {
          partnerId: p.partnerId,
          partnerCode: meta.partner_code ?? "—",
          name: meta.display_name ?? meta.first_name ?? "Partner",
          mobile: meta.mobile ?? null,
          sales: p.sales,
          revenue: p.revenue,
          earnings: p.earnings,
          leads,
          conversionRate: leads ? (p.sales / leads) * 100 : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    // Program-wise sales
    const programAgg = new Map<string, { courseId: string; sales: number; revenue: number }>();
    for (const r of submissions ?? []) {
      const key = (r as any).course_id;
      const cur = programAgg.get(key) ?? { courseId: key, sales: 0, revenue: 0 };
      cur.sales += 1;
      cur.revenue += Number((r as any).amount ?? 0);
      programAgg.set(key, cur);
    }
    const courseIds = [...programAgg.keys()];
    let courseMeta: any[] = [];
    let paymentLinkCounts = new Map<string, number>();
    if (courseIds.length) {
      const [{ data: cm }, { data: pls }] = await Promise.all([
        s.from("courses").select("id, name, slug").in("id", courseIds),
        s.from("partner_lead_payment_links")
          .select("course_id")
          .in("course_id", courseIds)
          .gte("created_at", from)
          .lte("created_at", to),
      ]);
      courseMeta = cm ?? [];
      for (const p of pls ?? []) {
        const k = (p as any).course_id;
        paymentLinkCounts.set(k, (paymentLinkCounts.get(k) ?? 0) + 1);
      }
    }
    const programPerformance = [...programAgg.values()].map((p) => {
      const meta: any = courseMeta.find((m) => m.id === p.courseId) ?? {};
      const linksAssigned = paymentLinkCounts.get(p.courseId) ?? 0;
      return {
        courseId: p.courseId,
        name: meta.name ?? "Untitled program",
        slug: meta.slug ?? null,
        sales: p.sales,
        revenue: p.revenue,
        avgSaleValue: p.sales ? p.revenue / p.sales : 0,
        linksAssigned,
        conversionRate: linksAssigned ? (p.sales / linksAssigned) * 100 : 0,
      };
    });

    // Lead source split (own vs glintr_provided) — from leads created in range
    const { data: leadsInRange } = await s
      .from("partner_leads")
      .select("id, lead_ownership_type, status, updated_at, assigned_partner_id, owner_partner_id, created_at")
      .gte("created_at", from)
      .lte("created_at", to);
    const source = {
      partner_own: { total: 0, contacted: 0, answered: 0, interested: 0, converted: 0 },
      glintr_provided: { total: 0, contacted: 0, answered: 0, interested: 0, converted: 0 },
    };
    const CONTACTED = new Set(["contacted", "interested", "follow_up", "application_started", "application_submitted", "payment_pending", "enrolled", "not_interested"]);
    const ANSWERED = new Set(["contacted", "interested", "follow_up", "application_started", "application_submitted", "payment_pending", "enrolled"]);
    const INTERESTED = new Set(["interested", "application_started", "application_submitted", "payment_pending", "enrolled"]);
    const CONVERTED = new Set(["enrolled"]);
    for (const l of leadsInRange ?? []) {
      const t = ((l as any).lead_ownership_type ?? "partner_own") as "partner_own" | "glintr_provided";
      const bucket = source[t];
      if (!bucket) continue;
      bucket.total += 1;
      const st = (l as any).status as string;
      if (CONTACTED.has(st)) bucket.contacted += 1;
      if (ANSWERED.has(st)) bucket.answered += 1;
      if (INTERESTED.has(st)) bucket.interested += 1;
      if (CONVERTED.has(st)) bucket.converted += 1;
    }
    // Revenue + earnings split by lead_type from commissions
    const leadTypeSplit = {
      partner_own: { revenue: 0, earnings: 0 },
      glintr_provided: { revenue: 0, earnings: 0 },
    };
    for (const c of commissions ?? []) {
      const t: string = ((c as any).lead_type as string) || "partner_own";
      const bucket = (leadTypeSplit as any)[t] ?? leadTypeSplit.partner_own;
      bucket.revenue += Number((c as any).gross_revenue ?? 0);
      bucket.earnings += Number((c as any).commission_amount ?? 0);
    }

    const leadSourcePerformance = [
      { key: "partner_own", label: "Sales Partner Own Leads", sharePct: 70, ...source.partner_own, revenue: leadTypeSplit.partner_own.revenue, earnings: leadTypeSplit.partner_own.earnings },
      { key: "glintr_provided", label: "Glintr Provided Leads", sharePct: 50, ...source.glintr_provided, revenue: leadTypeSplit.glintr_provided.revenue, earnings: leadTypeSplit.glintr_provided.earnings },
    ];

    // Funnel — company-wide, based on leads created in range
    const funnelBase = leadsInRange ?? [];
    const totalLeads = funnelBase.length;
    const contacted = funnelBase.filter((l: any) => CONTACTED.has(l.status)).length;
    const answered = funnelBase.filter((l: any) => ANSWERED.has(l.status)).length;
    const interested = funnelBase.filter((l: any) => INTERESTED.has(l.status)).length;

    // Payment link + submission counts for full funnel
    const [{ count: paymentLinkAssigned }, { count: proofsSubmitted }, { count: proofsVerified }] = await Promise.all([
      s.from("partner_lead_payment_links").select("id", { count: "exact", head: true })
        .gte("created_at", from).lte("created_at", to),
      s.from("partner_payment_submissions").select("id", { count: "exact", head: true })
        .gte("submitted_at", from).lte("submitted_at", to),
      s.from("partner_payment_submissions").select("id", { count: "exact", head: true })
        .eq("status", "verified")
        .gte("reviewed_at", from).lte("reviewed_at", to),
    ]);

    const funnel = [
      { stage: "Total Leads", count: totalLeads },
      { stage: "Contacted", count: contacted },
      { stage: "Answered", count: answered },
      { stage: "Interested", count: interested },
      { stage: "Payment Link Assigned", count: paymentLinkAssigned ?? 0 },
      { stage: "Payment Proof Submitted", count: proofsSubmitted ?? 0 },
      { stage: "Payment Verified", count: proofsVerified ?? 0 },
      { stage: "Converted", count: funnelBase.filter((l: any) => CONVERTED.has(l.status)).length },
    ];

    // Revenue breakdown from commissions in range
    const revenueBreakdown = {
      totalVerifiedRevenue,
      ownLeadRevenue: leadTypeSplit.partner_own.revenue,
      glintrLeadRevenue: leadTypeSplit.glintr_provided.revenue,
      earnings70: leadTypeSplit.partner_own.earnings,
      earnings50: leadTypeSplit.glintr_provided.earnings,
      paidEarnings: (commissions ?? []).filter((c: any) => c.status === "paid").reduce((a, c: any) => a + Number(c.commission_amount ?? 0), 0),
      pendingPayouts: (commissions ?? []).filter((c: any) => c.status === "approved").reduce((a, c: any) => a + Number(c.commission_amount ?? 0), 0),
    };

    return {
      totalVerifiedSales,
      totalVerifiedRevenue,
      salesSeries,
      topPartners,
      programPerformance,
      leadSourcePerformance,
      funnel,
      revenueBreakdown,
    };
  });

// =============================================================
// QUEUES + MONITORING (independent from date range)
// =============================================================
export const getCommandOperational = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setUTCHours(0, 0, 0, 0);
    const soonISO = new Date(now.getTime() + 3 * 86400_000).toISOString();
    const nowISO = now.toISOString();
    const dayISO = startOfDay.toISOString();

    // Payment verification queue (latest 5 needing attention)
    const { data: submissions } = await s.from("partner_payment_submissions")
      .select("id, partner_id, lead_id, course_id, amount, status, submitted_at")
      .in("status", ["pending_verification", "under_review", "needs_more_info", "duplicate_flagged"])
      .order("submitted_at", { ascending: false })
      .limit(5);

    // Payout attention
    const { data: payoutsDueToday } = await s.from("payouts")
      .select("id", { count: "exact" })
      .in("status", ["approved", "queued"])
      .lte("scheduled_for", nowISO);
    const { data: payoutsDueSoon } = await s.from("payouts")
      .select("id", { count: "exact" })
      .in("status", ["approved", "queued"])
      .gt("scheduled_for", nowISO).lte("scheduled_for", soonISO);
    const { data: overduePayoutsRows } = await s.from("payouts")
      .select("id", { count: "exact" })
      .in("status", ["queued", "processing", "requested"])
      .lt("scheduled_for", dayISO);
    const { data: onHoldRows } = await s.from("payouts")
      .select("id", { count: "exact" })
      .eq("status", "on_hold");

    const { data: payoutsLatest } = await s.from("payouts")
      .select("id, partner_id, amount, approved_amount, status, scheduled_for, requested_at, created_at")
      .in("status", ["queued", "processing", "requested", "approved", "on_hold"])
      .order("created_at", { ascending: false })
      .limit(6);

    // Sales Team Status
    const [
      { count: activeNow },
      { count: activeToday },
      { count: noActivityToday },
      { count: flexible },
      { count: fullTime },
      { count: suspended },
    ] = await Promise.all([
      s.from("partners").select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("updated_at", new Date(now.getTime() - 15 * 60_000).toISOString()),
      s.from("partners").select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("updated_at", dayISO),
      s.from("partners").select("id", { count: "exact", head: true })
        .eq("status", "active")
        .or(`updated_at.is.null,updated_at.lt.${dayISO}`),
      s.from("partners").select("id", { count: "exact", head: true })
        .eq("status", "active").eq("work_model", "flexible"),
      s.from("partners").select("id", { count: "exact", head: true })
        .eq("status", "active").eq("work_model", "full_time"),
      s.from("partners").select("id", { count: "exact", head: true })
        .eq("status", "suspended"),
    ]);

    // Referral bonuses approved (all-time count)
    const { data: refBonus } = await s.from("partner_referrals")
      .select("bonus_amount")
      .in("status", ["bonus_approved", "bonus_paid"]);
    const referralBonusesApproved = (refBonus ?? []).reduce((a, r: any) => a + Number(r.bonus_amount ?? 0), 0);

    // Lookup metadata for submissions & payouts (single batch)
    const partnerIds = new Set<string>();
    const leadIds = new Set<string>();
    const courseIds = new Set<string>();
    (submissions ?? []).forEach((r: any) => {
      partnerIds.add(r.partner_id); leadIds.add(r.lead_id); courseIds.add(r.course_id);
    });
    (payoutsLatest ?? []).forEach((r: any) => partnerIds.add(r.partner_id));

    const [{ data: partnersMeta }, { data: leadsMeta }, { data: coursesMeta }] = await Promise.all([
      partnerIds.size ? s.from("partners").select("id, display_name, partner_code, first_name")
        .in("id", [...partnerIds]) : Promise.resolve({ data: [] as any[] }),
      leadIds.size ? s.from("partner_leads").select("id, full_name").in("id", [...leadIds]) : Promise.resolve({ data: [] as any[] }),
      courseIds.size ? s.from("courses").select("id, name").in("id", [...courseIds]) : Promise.resolve({ data: [] as any[] }),
    ]);
    const pmap = new Map((partnersMeta ?? []).map((p: any) => [p.id, p]));
    const lmap = new Map((leadsMeta ?? []).map((p: any) => [p.id, p]));
    const cmap = new Map((coursesMeta ?? []).map((p: any) => [p.id, p]));

    const queue = (submissions ?? []).map((r: any) => ({
      id: r.id,
      partnerId: r.partner_id,
      partnerName: (pmap.get(r.partner_id) as any)?.display_name ?? "Partner",
      leadId: r.lead_id,
      leadName: (lmap.get(r.lead_id) as any)?.full_name ?? "Lead",
      courseName: (cmap.get(r.course_id) as any)?.name ?? "Program",
      amount: Number(r.amount ?? 0),
      status: r.status,
      submittedAt: r.submitted_at,
    }));

    const payouts = (payoutsLatest ?? []).map((r: any) => ({
      id: r.id,
      partnerId: r.partner_id,
      partnerName: (pmap.get(r.partner_id) as any)?.display_name ?? "Partner",
      amount: Number(r.approved_amount ?? r.amount ?? 0),
      status: r.status,
      target: r.scheduled_for ?? r.requested_at ?? r.created_at,
    }));

    return {
      queue,
      queueCounts: {
        pending_verification: (submissions ?? []).filter((r: any) => r.status === "pending_verification").length,
        under_review: (submissions ?? []).filter((r: any) => r.status === "under_review").length,
        duplicate_flagged: (submissions ?? []).filter((r: any) => r.status === "duplicate_flagged").length,
        needs_more_info: (submissions ?? []).filter((r: any) => r.status === "needs_more_info").length,
      },
      payouts,
      payoutCounts: {
        dueToday: payoutsDueToday?.length ?? 0,
        dueSoon: payoutsDueSoon?.length ?? 0,
        overdue: overduePayoutsRows?.length ?? 0,
        onHold: onHoldRows?.length ?? 0,
      },
      team: {
        activeNow: activeNow ?? 0,
        activeToday: activeToday ?? 0,
        noActivityToday: noActivityToday ?? 0,
        flexible: flexible ?? 0,
        fullTime: fullTime ?? 0,
        suspended: suspended ?? 0,
      },
      referralBonusesApproved,
    };
  });

// =============================================================
// LEAD WORK MONITORING (partner-level metrics)
// =============================================================
export const getSalesWorkMonitoring = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay); endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
    const dayISO = startOfDay.toISOString();
    const nowISO = now.toISOString();
    const endOfDayISO = endOfDay.toISOString();

    const { data: partners } = await s.from("partners")
      .select("id, partner_code, display_name, first_name, updated_at")
      .eq("status", "active")
      .limit(200);

    const partnerIds = (partners ?? []).map((p: any) => p.id);
    if (!partnerIds.length) return [];

    const [
      { data: assignedLeads },
      { data: notContactedLeads },
      { data: todayFollowUps },
      { data: overdueFollowUps },
      { data: noAnswerLeads },
    ] = await Promise.all([
      s.from("partner_leads").select("assigned_partner_id, owner_partner_id, status, updated_at").in("assigned_partner_id", partnerIds),
      s.from("partner_leads").select("assigned_partner_id, owner_partner_id").in("assigned_partner_id", partnerIds).eq("status", "new").is("updated_at", null),
      s.from("partner_follow_ups").select("partner_id").eq("status", "scheduled").gte("due_at", dayISO).lt("due_at", endOfDayISO).in("partner_id", partnerIds),
      s.from("partner_follow_ups").select("partner_id").eq("status", "scheduled").lt("due_at", nowISO).in("partner_id", partnerIds),
      s.from("partner_leads").select("assigned_partner_id, owner_partner_id").in("assigned_partner_id", partnerIds).eq("status", "no_answer"),
    ]);

    const countBy = (rows: any[] | null | undefined, key: string) => {
      const m = new Map<string, number>();
      (rows ?? []).forEach((r) => {
        const k = r[key];
        if (!k) return;
        m.set(k, (m.get(k) ?? 0) + 1);
      });
      return m;
    };
    const assignedMap = countBy(assignedLeads, "assigned_partner_id");
    const notContactedMap = countBy(notContactedLeads, "assigned_partner_id");
    const todayFuMap = countBy(todayFollowUps, "partner_id");
    const overdueFuMap = countBy(overdueFollowUps, "partner_id");
    const noAnswerMap = countBy(noAnswerLeads, "assigned_partner_id");

    return (partners ?? []).map((p: any) => ({
      partnerId: p.id,
      partnerCode: p.partner_code ?? "—",
      name: p.display_name ?? p.first_name ?? "Partner",
      lastActivity: p.updated_at ?? null,
      assigned: assignedMap.get(p.id) ?? 0,
      notContacted: notContactedMap.get(p.id) ?? 0,
      todayFollowUps: todayFuMap.get(p.id) ?? 0,
      overdueFollowUps: overdueFuMap.get(p.id) ?? 0,
      noAnswer: noAnswerMap.get(p.id) ?? 0,
    })).sort((a, b) => (b.overdueFollowUps + b.notContacted) - (a.overdueFollowUps + a.notContacted));
  });

// =============================================================
// RECENT SALES ACTIVITY (from admin_activity_log + submissions)
// =============================================================
export const getRecentSalesActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;

    const [logs, subs, links, follow] = await Promise.all([
      s.from("admin_activity_log")
        .select("id, event_type, title, summary, created_at, entity_type, entity_id")
        .in("event_type", [
          "payment_verified", "payment_rejected", "payment_under_review",
          "payout_paid", "payout_approved", "commission_approved", "lead_assigned",
        ])
        .order("created_at", { ascending: false })
        .limit(15),
      s.from("partner_payment_submissions")
        .select("id, partner_id, status, amount, submitted_at, reviewed_at")
        .order("submitted_at", { ascending: false })
        .limit(10),
      s.from("partner_lead_payment_links")
        .select("id, partner_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      s.from("partner_leads")
        .select("id, assigned_partner_id, owner_partner_id, status, updated_at, full_name")
        .in("status", ["interested", "enrolled"])
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);

    const partnerIds = new Set<string>();
    (subs.data ?? []).forEach((r: any) => partnerIds.add(r.partner_id));
    (links.data ?? []).forEach((r: any) => partnerIds.add(r.partner_id));
    (follow.data ?? []).forEach((r: any) => {
      if (r.assigned_partner_id) partnerIds.add(r.assigned_partner_id);
      if (r.owner_partner_id) partnerIds.add(r.owner_partner_id);
    });
    const { data: partnersMeta } = partnerIds.size
      ? await s.from("partners").select("id, display_name, first_name").in("id", [...partnerIds])
      : { data: [] as any[] };
    const pmap = new Map((partnersMeta ?? []).map((p: any) => [p.id, p.display_name ?? p.first_name ?? "Partner"]));

    const feed: Array<{ id: string; kind: string; title: string; partner?: string; at: string }> = [];
    (logs.data ?? []).forEach((l: any) => feed.push({
      id: `l-${l.id}`, kind: l.event_type, title: l.title,
      partner: undefined, at: l.created_at,
    }));
    (subs.data ?? []).forEach((r: any) => feed.push({
      id: `s-${r.id}`,
      kind: r.status === "verified" ? "payment_verified" : "payment_submitted",
      title: r.status === "verified"
        ? `Payment verified · ₹${Number(r.amount).toLocaleString("en-IN")}`
        : `Payment proof submitted · ₹${Number(r.amount).toLocaleString("en-IN")}`,
      partner: pmap.get(r.partner_id),
      at: r.reviewed_at ?? r.submitted_at,
    }));
    (links.data ?? []).forEach((r: any) => feed.push({
      id: `pl-${r.id}`, kind: "payment_link_assigned",
      title: "Payment link assigned",
      partner: pmap.get(r.partner_id), at: r.created_at,
    }));
    (follow.data ?? []).forEach((r: any) => feed.push({
      id: `fl-${r.id}`,
      kind: r.status === "enrolled" ? "sale_converted" : "lead_interested",
      title: r.status === "enrolled" ? `Sale converted · ${r.full_name}` : `Lead marked Interested · ${r.full_name}`,
      partner: pmap.get(r.assigned_partner_id ?? r.owner_partner_id ?? ""),
      at: r.updated_at,
    }));
    feed.sort((a, b) => (a.at < b.at ? 1 : -1));
    return feed.slice(0, 15);
  });
