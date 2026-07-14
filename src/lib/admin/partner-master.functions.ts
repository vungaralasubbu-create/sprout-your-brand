import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

// ============================================================
// 1 + 2. Summary list with search + filters
// ============================================================
export const listPartnerMasterSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    q?: string;
    account_status?: string;   // active | under_review | suspended | inactive | all
    work_model?: string;       // flexible | full_time | all
    brand_type?: string;       // glintr | own | partnered | all
  }) => d ?? {})
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;

    let q = s.from("partners").select(
      "id, partner_code, display_name, first_name, email, mobile, account_status, status, work_model, work_model_status, brand_selling_model, referral_code, created_at",
    ).order("created_at", { ascending: false }).limit(500);

    if (data.q) {
      const like = `%${data.q}%`;
      q = q.or(
        `display_name.ilike.${like},first_name.ilike.${like},email.ilike.${like},mobile.ilike.${like},partner_code.ilike.${like},referral_code.ilike.${like}`,
      );
    }
    if (data.account_status && data.account_status !== "all") q = q.eq("account_status", data.account_status);
    if (data.work_model && data.work_model !== "all") q = q.eq("work_model", data.work_model);

    const { data: partners, error } = await q;
    if (error) throw error;
    let rows = partners ?? [];

    // Brand filter — filter partners whose latest brand profile matches
    if (data.brand_type && data.brand_type !== "all") {
      const ids = rows.map((p: any) => p.id);
      if (ids.length) {
        const { data: brands } = await s.from("partner_brand_profiles").select("partner_id, brand_type, status").in("partner_id", ids);
        const set = new Set((brands ?? []).filter((b: any) => b.brand_type === data.brand_type).map((b: any) => b.partner_id));
        rows = rows.filter((p: any) => set.has(p.id));
      }
    }

    // If brand name search matched, we should include those partners too.
    if (data.q) {
      const { data: brandMatches } = await s
        .from("partner_brand_profiles")
        .select("partner_id")
        .ilike("brand_name", `%${data.q}%`);
      const brandPartnerIds = new Set((brandMatches ?? []).map((b: any) => b.partner_id));
      if (brandPartnerIds.size) {
        const known = new Set(rows.map((r: any) => r.id));
        const extras = [...brandPartnerIds].filter((id) => !known.has(id));
        if (extras.length) {
          const { data: extraPartners } = await s.from("partners").select(
            "id, partner_code, display_name, first_name, email, mobile, account_status, status, work_model, work_model_status, brand_selling_model, referral_code, created_at",
          ).in("id", extras);
          rows = [...rows, ...(extraPartners ?? [])];
        }
      }
    }

    if (rows.length === 0) return [];
    const ids = rows.map((p: any) => p.id);

    // Aggregate metrics
    const [leadsAgg, submissionsAgg, commissionsAgg, lastActivity] = await Promise.all([
      s.from("partner_leads").select("id, owner_partner_id, assigned_partner_id").or(
        `owner_partner_id.in.(${ids.join(",")}),assigned_partner_id.in.(${ids.join(",")})`,
      ),
      s.from("partner_payment_submissions").select("partner_id, status, amount").in("partner_id", ids),
      s.from("commissions").select("partner_id, status, commission_amount, gross_revenue").in("partner_id", ids),
      s.from("partner_lead_activities").select("partner_id, created_at").in("partner_id", ids).order("created_at", { ascending: false }).limit(1000),
    ]);

    const leadCount: Record<string, number> = {};
    (leadsAgg.data ?? []).forEach((l: any) => {
      const owner = l.owner_partner_id, assignee = l.assigned_partner_id;
      if (owner) leadCount[owner] = (leadCount[owner] ?? 0) + 1;
      if (assignee && assignee !== owner) leadCount[assignee] = (leadCount[assignee] ?? 0) + 1;
    });

    const verifiedSales: Record<string, number> = {};
    const verifiedRevenue: Record<string, number> = {};
    (submissionsAgg.data ?? []).forEach((sub: any) => {
      if (sub.status === "verified") {
        verifiedSales[sub.partner_id] = (verifiedSales[sub.partner_id] ?? 0) + 1;
        verifiedRevenue[sub.partner_id] = (verifiedRevenue[sub.partner_id] ?? 0) + Number(sub.amount ?? 0);
      }
    });

    const approvedEarnings: Record<string, number> = {};
    (commissionsAgg.data ?? []).forEach((c: any) => {
      if (c.status === "approved" || c.status === "paid") {
        approvedEarnings[c.partner_id] = (approvedEarnings[c.partner_id] ?? 0) + Number(c.commission_amount ?? 0);
      }
    });

    const lastActivityMap: Record<string, string> = {};
    (lastActivity.data ?? []).forEach((a: any) => {
      if (!lastActivityMap[a.partner_id]) lastActivityMap[a.partner_id] = a.created_at;
    });

    return rows.map((p: any) => {
      const total = leadCount[p.id] ?? 0;
      const vs = verifiedSales[p.id] ?? 0;
      return {
        id: p.id,
        partner_code: p.partner_code,
        display_name: p.display_name ?? p.first_name ?? "—",
        email: p.email,
        mobile: p.mobile,
        account_status: p.account_status,
        status: p.status,
        work_model: p.work_model,
        work_model_status: p.work_model_status,
        brand_selling_model: p.brand_selling_model,
        referral_code: p.referral_code,
        created_at: p.created_at,
        total_leads: total,
        verified_sales: vs,
        verified_revenue: verifiedRevenue[p.id] ?? 0,
        conversion_rate: total > 0 ? Math.round((vs / total) * 1000) / 10 : 0,
        approved_earnings: approvedEarnings[p.id] ?? 0,
        last_activity_at: lastActivityMap[p.id] ?? null,
      };
    });
  });

// ============================================================
// 3+ Master Profile aggregate
// ============================================================
export const getPartnerMasterProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; range?: "today" | "7d" | "30d" | "month" | "all" }) =>
    z.object({
      id: z.string().uuid(),
      range: z.enum(["today", "7d", "30d", "month", "all"]).default("30d"),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;

    const partnerRes = await s.from("partners").select("*").eq("id", data.id).maybeSingle();
    if (partnerRes.error) throw partnerRes.error;
    if (!partnerRes.data) throw new Error("Partner not found");
    const p: any = partnerRes.data;

    // Look up last sign-in via admin client (auth.users is not reachable via PostgREST)
    let lastSignInAt: string | null = null;
    let signupAt: string | null = null;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (p.user_id) {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(p.user_id);
        lastSignInAt = (u?.user as any)?.last_sign_in_at ?? null;
        signupAt = (u?.user as any)?.created_at ?? null;
      }
    } catch { /* non-fatal */ }

    const [
      leads,
      submissions,
      commissions,
      payouts,
      referrals,
      brandProfiles,
      activities,
      paymentLinks,
      followUps,
      fullTimeApp,
      employee,
      notes,
    ] = await Promise.all([
      s.from("partner_leads")
        .select("id, owner_partner_id, assigned_partner_id, lead_ownership_type, status, course_id, program_interest, created_at, last_activity_at, next_follow_up_at")
        .or(`owner_partner_id.eq.${data.id},assigned_partner_id.eq.${data.id}`),
      s.from("partner_payment_submissions")
        .select("id, lead_id, course_id, plan, amount, utr_reference, status, is_duplicate_flag, submitted_at, reviewed_at, courses:course_id(name)")
        .eq("partner_id", data.id).order("submitted_at", { ascending: false }),
      s.from("commissions")
        .select("id, program_id, course_id, plan, lead_type, gross_revenue, commission_amount, revenue_share_pct, status, created_at, payout_at, payout_reference")
        .eq("partner_id", data.id).order("created_at", { ascending: false }),
      s.from("payouts")
        .select("id, amount, approved_amount, status, reference, payment_reference, processed_at, scheduled_for, created_at")
        .eq("partner_id", data.id).order("created_at", { ascending: false }).limit(50),
      s.from("partner_referrals")
        .select("id, referral_code, referred_partner_id, referred_application_id, status, bonus_amount, qualified_at, created_at")
        .eq("referrer_partner_id", data.id).order("created_at", { ascending: false }),
      s.from("partner_brand_profiles").select("*").eq("partner_id", data.id).order("submitted_at", { ascending: false }),
      s.from("partner_lead_activities")
        .select("id, lead_id, activity_type, content, created_at, partner_leads:lead_id(full_name)")
        .eq("partner_id", data.id).order("created_at", { ascending: false }).limit(200),
      s.from("partner_lead_payment_links")
        .select("id, lead_id, course_id, plan, amount, url, status, assigned_at")
        .eq("partner_id", data.id).order("assigned_at", { ascending: false }).limit(200),
      s.from("partner_follow_ups")
        .select("id, lead_id, due_at, status, type, created_at").eq("partner_id", data.id),
      s.from("partner_full_time_applications").select("*").eq("partner_id", data.id).order("created_at", { ascending: false }).limit(1),
      s.from("employee_profiles").select("*").eq("partner_id", data.id).maybeSingle(),
      s.from("admin_partner_notes").select("id, note, admin_user_id, created_at").eq("partner_id", data.id).order("created_at", { ascending: false }),
    ]);

    // ============ Performance summary ============
    const leadRows = leads.data ?? [];
    const ownLeads = leadRows.filter((l: any) => l.lead_ownership_type === "partner_own");
    const glintrLeads = leadRows.filter((l: any) => l.lead_ownership_type === "glintr_provided");

    const activityRows = activities.data ?? [];
    const activityByLead = new Map<string, any[]>();
    activityRows.forEach((a: any) => {
      if (!a.lead_id) return;
      const arr = activityByLead.get(a.lead_id) ?? [];
      arr.push(a);
      activityByLead.set(a.lead_id, arr);
    });
    const contactedLeadIds = new Set<string>();
    let answered = 0, noAnswer = 0;
    activityRows.forEach((a: any) => {
      const t = String(a.activity_type ?? "");
      if (["call", "sms", "whatsapp", "email", "note"].includes(t) && a.lead_id) contactedLeadIds.add(a.lead_id);
      if (t === "call") {
        const c = String(a.content ?? "").toLowerCase();
        if (c.includes("no answer") || c.includes("did not pick")) noAnswer++;
        else answered++;
      }
    });

    const contacted = contactedLeadIds.size;
    const interestedLeads = leadRows.filter((l: any) => ["interested", "qualified", "converted"].includes(l.status)).length;
    const followUpLeads = leadRows.filter((l: any) => !!l.next_follow_up_at).length;

    const submissionRows = submissions.data ?? [];
    const verifiedSubs = submissionRows.filter((s: any) => s.status === "verified");
    const verifiedRevenue = verifiedSubs.reduce((a: number, r: any) => a + Number(r.amount ?? 0), 0);
    const verifiedSales = verifiedSubs.length;
    const conversion = leadRows.length ? Math.round((verifiedSales / leadRows.length) * 1000) / 10 : 0;
    const avgSaleValue = verifiedSales ? Math.round(verifiedRevenue / verifiedSales) : 0;
    const paymentProofsSubmitted = submissionRows.length;
    const paymentLinksAssigned = (paymentLinks.data ?? []).length;

    // ============ Lead performance rates ============
    const ownContacted = ownLeads.filter((l: any) => contactedLeadIds.has(l.id)).length;
    const glintrContacted = glintrLeads.filter((l: any) => contactedLeadIds.has(l.id)).length;
    const ownConverted = verifiedSubs.filter((sub: any) => ownLeads.some((l: any) => l.id === sub.lead_id)).length;
    const glintrConverted = verifiedSubs.filter((sub: any) => glintrLeads.some((l: any) => l.id === sub.lead_id)).length;

    const followUpRows = followUps.data ?? [];
    const now = Date.now();
    const overdueFollowUps = followUpRows.filter((f: any) => f.status === "scheduled" && f.due_at && new Date(f.due_at).getTime() < now).length;
    const completedFollowUps = followUpRows.filter((f: any) => f.status === "completed").length;
    const notContacted = leadRows.filter((l: any) => !contactedLeadIds.has(l.id)).length;

    // ============ Sales trend (by submission verified_at) ============
    const trendMap = new Map<string, { sales: number; revenue: number }>();
    verifiedSubs.forEach((sub: any) => {
      const d = new Date(sub.reviewed_at ?? sub.submitted_at);
      const key = d.toISOString().slice(0, 10);
      const cur = trendMap.get(key) ?? { sales: 0, revenue: 0 };
      cur.sales += 1;
      cur.revenue += Number(sub.amount ?? 0);
      trendMap.set(key, cur);
    });
    const trend = [...trendMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));

    // ============ Program performance ============
    const programMap = new Map<string, { name: string; interested: number; links: number; sales: number; revenue: number; earnings: number }>();
    const courseNameRes = await s.from("courses").select("id, name").in(
      "id",
      Array.from(new Set([...leadRows.map((l: any) => l.course_id), ...submissionRows.map((r: any) => r.course_id)].filter(Boolean))) as any,
    );
    const courseNames: Record<string, string> = {};
    (courseNameRes.data ?? []).forEach((c: any) => { courseNames[c.id] = c.name; });

    leadRows.forEach((l: any) => {
      if (!l.course_id) return;
      const cur = programMap.get(l.course_id) ?? { name: courseNames[l.course_id] ?? "Program", interested: 0, links: 0, sales: 0, revenue: 0, earnings: 0 };
      cur.interested += 1;
      programMap.set(l.course_id, cur);
    });
    (paymentLinks.data ?? []).forEach((pl: any) => {
      if (!pl.course_id) return;
      const cur = programMap.get(pl.course_id) ?? { name: courseNames[pl.course_id] ?? "Program", interested: 0, links: 0, sales: 0, revenue: 0, earnings: 0 };
      cur.links += 1;
      programMap.set(pl.course_id, cur);
    });
    verifiedSubs.forEach((sub: any) => {
      if (!sub.course_id) return;
      const cur = programMap.get(sub.course_id) ?? { name: courseNames[sub.course_id] ?? "Program", interested: 0, links: 0, sales: 0, revenue: 0, earnings: 0 };
      cur.sales += 1;
      cur.revenue += Number(sub.amount ?? 0);
      programMap.set(sub.course_id, cur);
    });
    (commissions.data ?? []).forEach((c: any) => {
      if (!c.course_id) return;
      if (!(c.status === "approved" || c.status === "paid")) return;
      const cur = programMap.get(c.course_id) ?? { name: courseNames[c.course_id] ?? "Program", interested: 0, links: 0, sales: 0, revenue: 0, earnings: 0 };
      cur.earnings += Number(c.commission_amount ?? 0);
      programMap.set(c.course_id, cur);
    });
    const programs = [...programMap.entries()].map(([id, v]) => ({
      course_id: id, ...v,
      conversion_rate: v.interested > 0 ? Math.round((v.sales / v.interested) * 1000) / 10 : 0,
    }));

    // ============ Earnings breakdown ============
    const commissionsData = commissions.data ?? [];
    const totalEarnings = commissionsData.reduce((a: number, c: any) => a + Number(c.commission_amount ?? 0), 0);
    const approvedEarnings = commissionsData.filter((c: any) => c.status === "approved").reduce((a: number, c: any) => a + Number(c.commission_amount ?? 0), 0);
    const paidEarnings = commissionsData.filter((c: any) => c.status === "paid").reduce((a: number, c: any) => a + Number(c.commission_amount ?? 0), 0);
    const holdEarnings = commissionsData.filter((c: any) => c.status === "on_hold").reduce((a: number, c: any) => a + Number(c.commission_amount ?? 0), 0);
    const ownShareEarnings = commissionsData.filter((c: any) => c.lead_type === "own" && (c.status === "approved" || c.status === "paid")).reduce((a: number, c: any) => a + Number(c.commission_amount ?? 0), 0);
    const supportedShareEarnings = commissionsData.filter((c: any) => (c.lead_type === "supported" || c.lead_type === "glintr_provided") && (c.status === "approved" || c.status === "paid")).reduce((a: number, c: any) => a + Number(c.commission_amount ?? 0), 0);
    const payoutProcessing = (payouts.data ?? []).filter((p: any) => ["queued", "processing"].includes(p.status)).reduce((a: number, p: any) => a + Number(p.amount ?? 0), 0);

    // ============ Referral summary ============
    const referralRows = referrals.data ?? [];
    const referralSummary = {
      referral_code: p.referral_code,
      total: referralRows.length,
      active: referralRows.filter((r: any) => ["signed_up", "active", "qualification_pending"].includes(r.status)).length,
      qualified: referralRows.filter((r: any) => ["bonus_pending_approval", "bonus_approved", "bonus_paid"].includes(r.status)).length,
      pending_bonus: referralRows.filter((r: any) => r.status === "bonus_pending_approval").reduce((a: number, r: any) => a + Number(r.bonus_amount ?? 0), 0),
      approved_bonus: referralRows.filter((r: any) => r.status === "bonus_approved").reduce((a: number, r: any) => a + Number(r.bonus_amount ?? 0), 0),
      paid_bonus: referralRows.filter((r: any) => r.status === "bonus_paid").reduce((a: number, r: any) => a + Number(r.bonus_amount ?? 0), 0),
    };

    // ============ Work activity today ============
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const todayIso = startOfDay.toISOString();
    const activityToday = activityRows.filter((a: any) => a.created_at >= todayIso);
    const followUpsCompletedToday = followUpRows.filter((f: any) => f.status === "completed" && f.created_at >= todayIso).length;
    const followUpsMissedRecent = followUpRows.filter((f: any) => f.status === "missed").length;

    // Currently active brand
    const activeBrand = (brandProfiles.data ?? []).find((b: any) => b.status === "approved") ?? (brandProfiles.data ?? [])[0] ?? null;

    return {
      partner: {
        ...p,
        // sanitize sensitive fields
        bank_account_last4: p.bank_account_last4 ?? null,
      },
      auth: { last_sign_in_at: lastSignInAt, signup_at: signupAt ?? p.created_at },
      performance: {
        total_leads: leadRows.length,
        own_leads: ownLeads.length,
        glintr_leads: glintrLeads.length,
        contacted, answered, no_answer: noAnswer,
        follow_up_leads: followUpLeads,
        interested_leads: interestedLeads,
        payment_links_assigned: paymentLinksAssigned,
        payment_proofs_submitted: paymentProofsSubmitted,
        verified_sales: verifiedSales,
        verified_revenue: verifiedRevenue,
        conversion_rate: conversion,
        average_sale_value: avgSaleValue,
      },
      lead_performance: {
        own_conversion: ownLeads.length ? Math.round((ownConverted / ownLeads.length) * 1000) / 10 : 0,
        glintr_conversion: glintrLeads.length ? Math.round((glintrConverted / glintrLeads.length) * 1000) / 10 : 0,
        contact_rate: leadRows.length ? Math.round((contacted / leadRows.length) * 1000) / 10 : 0,
        answered_rate: (answered + noAnswer) ? Math.round((answered / (answered + noAnswer)) * 1000) / 10 : 0,
        no_answer_rate: (answered + noAnswer) ? Math.round((noAnswer / (answered + noAnswer)) * 1000) / 10 : 0,
        follow_up_completion: (completedFollowUps + overdueFollowUps + followUpsMissedRecent) > 0
          ? Math.round((completedFollowUps / (completedFollowUps + overdueFollowUps + followUpsMissedRecent)) * 1000) / 10
          : 0,
        overdue_follow_ups: overdueFollowUps,
        not_contacted: notContacted,
      },
      sales_trend: trend,
      programs,
      payments: submissionRows.map((r: any) => ({
        id: r.id, lead_id: r.lead_id, course_name: r.courses?.name ?? "—",
        plan: r.plan, amount: r.amount, utr_reference: r.utr_reference,
        status: r.status, is_duplicate_flag: r.is_duplicate_flag,
        submitted_at: r.submitted_at, reviewed_at: r.reviewed_at,
      })),
      earnings: {
        total: totalEarnings, approved: approvedEarnings, paid: paidEarnings,
        payout_processing: payoutProcessing, on_hold: holdEarnings,
        referral_bonus: referralSummary.paid_bonus + referralSummary.approved_bonus + referralSummary.pending_bonus,
        own_share: ownShareEarnings, supported_share: supportedShareEarnings,
      },
      payouts: payouts.data ?? [],
      referrals: {
        summary: referralSummary,
        rows: referralRows,
      },
      brands: {
        active: activeBrand,
        all: brandProfiles.data ?? [],
      },
      activity: {
        rows: activityRows.slice(0, 60),
        work_today: {
          leads_viewed_today: 0, // no viewed event tracked
          actions_today: activityToday.length,
          call_actions: activityToday.filter((a: any) => a.activity_type === "call").length,
          follow_ups_completed_today: followUpsCompletedToday,
          follow_ups_missed: followUpsMissedRecent,
          payment_links_assigned_today: (paymentLinks.data ?? []).filter((l: any) => l.assigned_at >= todayIso).length,
          payment_proofs_submitted_today: submissionRows.filter((r: any) => r.submitted_at >= todayIso).length,
          last_lead_activity_at: activityRows[0]?.created_at ?? null,
          flag_no_activity_today: activityToday.length === 0,
          flag_high_overdue: overdueFollowUps >= 5,
          flag_not_contacted: notContacted >= 5,
          flag_repeated_missed: followUpsMissedRecent >= 3,
        },
      },
      full_time_application: fullTimeApp.data?.[0] ?? null,
      employee: employee.data ?? null,
      notes: notes.data ?? [],
    };
  });

// ============================================================
// Admin notes
// ============================================================
export const addPartnerNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { partner_id: string; note: string }) =>
    z.object({ partner_id: z.string().uuid(), note: z.string().trim().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.from("admin_partner_notes").insert({
      partner_id: data.partner_id, admin_user_id: context.userId, note: data.note,
    });
    if (error) throw error;
    return { ok: true };
  });

// ============================================================
// Account actions with reason logging
// ============================================================
export const partnerAccountAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    partner_id: string;
    action: "suspend" | "reactivate" | "request_info";
    reason?: string;
  }) => z.object({
    partner_id: z.string().uuid(),
    action: z.enum(["suspend", "reactivate", "request_info"]),
    reason: z.string().trim().max(2000).optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const s = context.supabase;

    if (data.action === "suspend") {
      if (!data.reason || data.reason.trim().length < 3) throw new Error("A reason is required to suspend a partner");
      const { error } = await s.from("partners").update({
        account_status: "suspended", status: "suspended",
      }).eq("id", data.partner_id);
      if (error) throw error;
    } else if (data.action === "reactivate") {
      const { error } = await s.from("partners").update({
        account_status: "active", status: "active",
      }).eq("id", data.partner_id);
      if (error) throw error;
    } else if (data.action === "request_info") {
      const { error } = await s.from("partners").update({
        account_status: "under_review",
      }).eq("id", data.partner_id);
      if (error) throw error;
    }

    await s.from("admin_activity_log").insert({
      actor_user_id: context.userId,
      event_type: `partner_${data.action}`,
      entity_type: "partner",
      entity_id: data.partner_id,
      title: `Partner ${data.action.replace("_", " ")}`,
      summary: data.reason ?? null,
    });
    return { ok: true };
  });
