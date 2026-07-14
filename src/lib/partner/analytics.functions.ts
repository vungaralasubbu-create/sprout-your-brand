import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Grouping = "daily" | "weekly" | "monthly";

export type AnalyticsInput = {
  startDate: string; // ISO date (yyyy-mm-dd)
  endDate: string; // ISO date inclusive
  grouping?: Grouping;
};

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}
function isoMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function isoWeek(d: Date) {
  // ISO week key YYYY-Www
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const ANSWERED_STATUSES = [
  "contacted",
  "interested",
  "follow_up",
  "application_started",
  "application_submitted",
  "payment_pending",
  "enrolled",
];

const INTERESTED_STATUSES = [
  "interested",
  "follow_up",
  "application_started",
  "application_submitted",
  "payment_pending",
  "enrolled",
];

export const getPartnerAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AnalyticsInput) => data)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const grouping: Grouping = data.grouping ?? "daily";
    const startISO = new Date(`${data.startDate}T00:00:00.000Z`).toISOString();
    const endISO = new Date(`${data.endDate}T23:59:59.999Z`).toISOString();

    const { data: partner } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const empty = {
      summary: {
        totalLeads: 0,
        leadsContacted: 0,
        answeredLeads: 0,
        noAnswerLeads: 0,
        followUpLeads: 0,
        interestedLeads: 0,
        paymentLinksAssigned: 0,
        paymentProofsSubmitted: 0,
        verifiedSales: 0,
        conversionRate: 0,
        verifiedRevenue: 0,
        totalEarnings: 0,
      },
      salesSeries: [] as { bucket: string; sales: number; revenue: number }[],
      leadStatus: [] as { status: string; label: string; count: number }[],
      funnel: [] as { stage: string; count: number; pct: number | null }[],
      programs: [] as {
        courseId: string;
        program: string;
        sales: number;
        revenue: number;
        avgSaleValue: number;
        earnings: number;
      }[],
      leadSource: [] as {
        source: "own_leads" | "company_leads";
        label: string;
        totalLeads: number;
        contacted: number;
        converted: number;
        conversionRate: number;
        verifiedRevenue: number;
        earnings: number;
      }[],
      paymentLinks: [] as {
        program: string;
        plan: string;
        amount: number;
        linksAssigned: number;
        proofsSubmitted: number;
        verifiedPayments: number;
        verifiedRevenue: number;
      }[],
      answered: { answered: 0, noAnswer: 0, total: 0 },
      earningsTrend: [] as { bucket: string; approved: number; processing: number; paid: number }[],
      recentActivity: [] as {
        id: string;
        kind: string;
        label: string;
        program: string | null;
        lead: string | null;
        at: string;
      }[],
    };
    if (!partner) return empty;

    const partnerId = partner.id;

    const [leadsRes, enrollmentsRes, commissionsRes, submissionsRes, linkAssignRes] =
      await Promise.all([
        supabase
          .from("partner_leads")
          .select("id, full_name, status, lead_model, created_at, course_id")
          .or(`owner_partner_id.eq.${partnerId},assigned_partner_id.eq.${partnerId}`)
          .gte("created_at", startISO)
          .lte("created_at", endISO),
        supabase
          .from("enrollments")
          .select(
            "id, program_id, program_title, student_name, gross_revenue, status, verified_at, enrolled_at, lead_source, course_id",
          )
          .eq("partner_id", partnerId)
          .gte("enrolled_at", startISO)
          .lte("enrolled_at", endISO),
        supabase
          .from("commissions")
          .select(
            "id, commission_amount, gross_revenue, status, lead_type, course_id, created_at, approved_at, payout_at",
          )
          .eq("partner_id", partnerId)
          .gte("created_at", startISO)
          .lte("created_at", endISO),
        supabase
          .from("partner_payment_submissions")
          .select("id, course_id, plan, amount, status, submitted_at, lead_id, payment_link_id")
          .eq("partner_id", partnerId)
          .gte("submitted_at", startISO)
          .lte("submitted_at", endISO),
        supabase
          .from("partner_lead_payment_links")
          .select("id, course_id, plan, amount, payment_link_id, assigned_at, lead_id")
          .eq("partner_id", partnerId)
          .gte("assigned_at", startISO)
          .lte("assigned_at", endISO),
      ]);

    const leads = leadsRes.data ?? [];
    const enrollments = enrollmentsRes.data ?? [];
    const commissions = commissionsRes.data ?? [];
    const submissions = submissionsRes.data ?? [];
    const linkAssign = linkAssignRes.data ?? [];

    // Course id → title map
    const courseIds = new Set<string>();
    for (const r of enrollments) if (r.course_id) courseIds.add(r.course_id);
    for (const r of submissions) if (r.course_id) courseIds.add(r.course_id);
    for (const r of linkAssign) if (r.course_id) courseIds.add(r.course_id);
    for (const r of commissions) if (r.course_id) courseIds.add(r.course_id);
    let courseMap = new Map<string, string>();
    if (courseIds.size) {
      const { data: courses } = await supabase
        .from("courses")
        .select("id, name")
        .in("id", Array.from(courseIds));
      courseMap = new Map((courses ?? []).map((c) => [c.id, c.name]));
    }

    // ---- SUMMARY ----
    const totalLeads = leads.length;
    const answeredLeads = leads.filter((l) => ANSWERED_STATUSES.includes(l.status as string))
      .length;
    const noAnswerLeads = leads.filter((l) => l.status === "new").length;
    const leadsContacted = answeredLeads;
    const followUpLeads = leads.filter((l) => l.status === "follow_up").length;
    const interestedLeads = leads.filter((l) => INTERESTED_STATUSES.includes(l.status as string))
      .length;

    const verifiedEnrollments = enrollments.filter(
      (e) => e.status === "verified" || e.verified_at,
    );
    const verifiedSales = verifiedEnrollments.length;
    const verifiedRevenue = verifiedEnrollments.reduce(
      (a, e) => a + Number(e.gross_revenue ?? 0),
      0,
    );

    const totalEarnings = commissions
      .filter((c) => ["approved", "payout_processing", "paid"].includes(c.status as string))
      .reduce((a, c) => a + Number(c.commission_amount ?? 0), 0);

    const conversionRate = totalLeads > 0 ? (verifiedSales / totalLeads) * 100 : 0;

    const paymentLinksAssigned = linkAssign.length;
    const paymentProofsSubmitted = submissions.length;

    // ---- SALES SERIES ----
    const bucketKey = (iso: string) => {
      const d = new Date(iso);
      if (grouping === "monthly") return isoMonth(d);
      if (grouping === "weekly") return isoWeek(d);
      return isoDay(d);
    };
    const salesMap = new Map<string, { sales: number; revenue: number }>();
    for (const e of verifiedEnrollments) {
      const at = e.verified_at ?? e.enrolled_at;
      if (!at) continue;
      const k = bucketKey(at);
      const cur = salesMap.get(k) ?? { sales: 0, revenue: 0 };
      cur.sales += 1;
      cur.revenue += Number(e.gross_revenue ?? 0);
      salesMap.set(k, cur);
    }
    const salesSeries = Array.from(salesMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([bucket, v]) => ({ bucket, ...v }));

    // ---- LEAD STATUS ----
    const statusLabels: Record<string, string> = {
      new: "New / Not Contacted",
      contacted: "Answered / Contacted",
      follow_up: "Follow-Up",
      interested: "Interested",
      application_started: "Application Started",
      application_submitted: "Application Submitted",
      payment_pending: "Payment Pending",
      enrolled: "Converted",
      not_interested: "Not Interested",
      lost: "Lost",
      invalid: "Invalid",
      duplicate: "Duplicate",
      refunded: "Refunded",
    };
    const statusCounts = new Map<string, number>();
    for (const l of leads) {
      const s = l.status as string;
      statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
    }
    const leadStatus = Array.from(statusCounts.entries())
      .map(([status, count]) => ({ status, label: statusLabels[status] ?? status, count }))
      .sort((a, b) => b.count - a.count);

    // ---- FUNNEL ----
    const submittedLeadIds = new Set(submissions.map((s) => s.lead_id));
    const verifiedSubmissionLeadIds = new Set(
      submissions.filter((s) => s.status === "verified").map((s) => s.lead_id),
    );
    const funnelStages = [
      { stage: "Total Leads", count: totalLeads },
      { stage: "Contacted", count: leadsContacted },
      { stage: "Answered", count: answeredLeads },
      { stage: "Interested", count: interestedLeads },
      { stage: "Payment Submitted", count: submittedLeadIds.size },
      { stage: "Payment Verified", count: verifiedSubmissionLeadIds.size },
      { stage: "Converted", count: verifiedSales },
    ];
    const funnel = funnelStages.map((s, i) => {
      const prev = i === 0 ? null : funnelStages[i - 1].count;
      const pct = prev && prev > 0 ? (s.count / prev) * 100 : i === 0 ? null : 0;
      return { ...s, pct };
    });

    // ---- PROGRAMS ----
    const programMap = new Map<
      string,
      { program: string; sales: number; revenue: number; earnings: number }
    >();
    for (const e of verifiedEnrollments) {
      const cid = e.course_id ?? e.program_id ?? "unknown";
      const title = e.program_title ?? courseMap.get(cid) ?? "Program";
      const cur = programMap.get(cid) ?? { program: title, sales: 0, revenue: 0, earnings: 0 };
      cur.sales += 1;
      cur.revenue += Number(e.gross_revenue ?? 0);
      programMap.set(cid, cur);
    }
    for (const c of commissions) {
      if (!["approved", "payout_processing", "paid"].includes(c.status as string)) continue;
      const cid = c.course_id ?? "unknown";
      const cur = programMap.get(cid) ?? {
        program: courseMap.get(cid) ?? "Program",
        sales: 0,
        revenue: 0,
        earnings: 0,
      };
      cur.earnings += Number(c.commission_amount ?? 0);
      programMap.set(cid, cur);
    }
    const programs = Array.from(programMap.entries()).map(([courseId, v]) => ({
      courseId,
      program: v.program,
      sales: v.sales,
      revenue: v.revenue,
      avgSaleValue: v.sales > 0 ? v.revenue / v.sales : 0,
      earnings: v.earnings,
    }));

    // ---- LEAD SOURCE ----
    const bySource = (model: "own_leads" | "company_leads") => {
      const sLeads = leads.filter((l) => l.lead_model === model);
      const sContacted = sLeads.filter((l) => ANSWERED_STATUSES.includes(l.status as string))
        .length;
      const sEnroll = verifiedEnrollments.filter((e) =>
        model === "own_leads" ? e.lead_source === "own_leads" : e.lead_source !== "own_leads",
      );
      const sRevenue = sEnroll.reduce((a, e) => a + Number(e.gross_revenue ?? 0), 0);
      const sEarnings = commissions
        .filter(
          (c) =>
            ["approved", "payout_processing", "paid"].includes(c.status as string) &&
            (model === "own_leads" ? c.lead_type === "own_leads" : c.lead_type !== "own_leads"),
        )
        .reduce((a, c) => a + Number(c.commission_amount ?? 0), 0);
      return {
        source: model,
        label: model === "own_leads" ? "Own Leads" : "Glintr Provided Leads",
        totalLeads: sLeads.length,
        contacted: sContacted,
        converted: sEnroll.length,
        conversionRate: sLeads.length > 0 ? (sEnroll.length / sLeads.length) * 100 : 0,
        verifiedRevenue: sRevenue,
        earnings: sEarnings,
      };
    };
    const leadSource = [bySource("own_leads"), bySource("company_leads")];

    // ---- PAYMENT LINK PERFORMANCE ----
    type PLK = {
      courseId: string;
      plan: string;
      amount: number;
      program: string;
      linksAssigned: number;
      proofsSubmitted: number;
      verifiedPayments: number;
      verifiedRevenue: number;
    };
    const plMap = new Map<string, PLK>();
    const keyOf = (cid: string | null, plan: string) => `${cid ?? ""}::${plan}`;
    for (const a of linkAssign) {
      const cid = a.course_id ?? "";
      const k = keyOf(cid, a.plan as string);
      const cur = plMap.get(k) ?? {
        courseId: cid,
        plan: a.plan as string,
        amount: Number(a.amount ?? 0),
        program: courseMap.get(cid) ?? "Program",
        linksAssigned: 0,
        proofsSubmitted: 0,
        verifiedPayments: 0,
        verifiedRevenue: 0,
      };
      cur.linksAssigned += 1;
      plMap.set(k, cur);
    }
    for (const s of submissions) {
      const cid = s.course_id ?? "";
      const k = keyOf(cid, s.plan as string);
      const cur = plMap.get(k) ?? {
        courseId: cid,
        plan: s.plan as string,
        amount: Number(s.amount ?? 0),
        program: courseMap.get(cid) ?? "Program",
        linksAssigned: 0,
        proofsSubmitted: 0,
        verifiedPayments: 0,
        verifiedRevenue: 0,
      };
      cur.proofsSubmitted += 1;
      if (s.status === "verified") {
        cur.verifiedPayments += 1;
        cur.verifiedRevenue += Number(s.amount ?? 0);
      }
      plMap.set(k, cur);
    }
    const paymentLinks = Array.from(plMap.values()).sort(
      (a, b) => b.verifiedRevenue - a.verifiedRevenue,
    );

    // ---- EARNINGS TREND ----
    const trendMap = new Map<
      string,
      { approved: number; processing: number; paid: number }
    >();
    for (const c of commissions) {
      const at = c.approved_at ?? c.payout_at ?? c.created_at;
      if (!at) continue;
      const k = bucketKey(at);
      const cur = trendMap.get(k) ?? { approved: 0, processing: 0, paid: 0 };
      const amt = Number(c.commission_amount ?? 0);
      if (c.status === "approved") cur.approved += amt;
      else if (c.status === "payout_processing") cur.processing += amt;
      else if (c.status === "paid") cur.paid += amt;
      trendMap.set(k, cur);
    }
    const earningsTrend = Array.from(trendMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([bucket, v]) => ({ bucket, ...v }));

    // ---- RECENT ACTIVITY ----
    const leadNameMap = new Map(leads.map((l) => [l.id, l.full_name]));
    const activities: {
      id: string;
      kind: string;
      label: string;
      program: string | null;
      lead: string | null;
      at: string;
    }[] = [];

    for (const s of submissions) {
      activities.push({
        id: `sub-${s.id}`,
        kind: "payment_proof",
        label:
          s.status === "verified"
            ? "Payment verified"
            : s.status === "rejected"
              ? "Payment rejected"
              : "Payment proof submitted",
        program: s.course_id ? (courseMap.get(s.course_id) ?? null) : null,
        lead: leadNameMap.get(s.lead_id) ?? null,
        at: s.submitted_at,
      });
    }
    for (const a of linkAssign) {
      activities.push({
        id: `link-${a.id}`,
        kind: "link_assigned",
        label: "Payment link assigned",
        program: a.course_id ? (courseMap.get(a.course_id) ?? null) : null,
        lead: leadNameMap.get(a.lead_id) ?? null,
        at: a.assigned_at,
      });
    }
    for (const e of verifiedEnrollments) {
      activities.push({
        id: `enr-${e.id}`,
        kind: "sale_converted",
        label: "Sale converted",
        program: e.program_title ?? (e.course_id ? (courseMap.get(e.course_id) ?? null) : null),
        lead: e.student_name ?? null,
        at: e.verified_at ?? e.enrolled_at,
      });
    }
    for (const c of commissions) {
      if (c.status === "approved" && c.approved_at) {
        activities.push({
          id: `com-a-${c.id}`,
          kind: "earning_approved",
          label: "Earning approved",
          program: c.course_id ? (courseMap.get(c.course_id) ?? null) : null,
          lead: null,
          at: c.approved_at,
        });
      }
      if (c.status === "paid" && c.payout_at) {
        activities.push({
          id: `com-p-${c.id}`,
          kind: "payout_paid",
          label: "Payout marked Paid",
          program: c.course_id ? (courseMap.get(c.course_id) ?? null) : null,
          lead: null,
          at: c.payout_at,
        });
      }
    }
    activities.sort((a, b) => (a.at < b.at ? 1 : -1));
    const recentActivity = activities.slice(0, 10);

    return {
      summary: {
        totalLeads,
        leadsContacted,
        answeredLeads,
        noAnswerLeads,
        followUpLeads,
        interestedLeads,
        paymentLinksAssigned,
        paymentProofsSubmitted,
        verifiedSales,
        conversionRate,
        verifiedRevenue,
        totalEarnings,
      },
      salesSeries,
      leadStatus,
      funnel,
      programs,
      leadSource,
      paymentLinks,
      answered: { answered: answeredLeads, noAnswer: noAnswerLeads, total: totalLeads },
      earningsTrend,
      recentActivity,
    };
  });
