import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- helpers ----------
async function loadAmbassador(context: any) {
  const { supabase, userId } = context;
  const { data: profile } = await supabase
    .from("campus_ambassador_profiles")
    .select("id, full_name, status, ambassador_code")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return null;
  const status = (profile.status as string) || "active";
  if (status === "terminated" || status === "inactive") return null;
  return profile;
}

export type CommissionStatus =
  | "pending_verification"
  | "eligible"
  | "approved"
  | "available"
  | "payout_processing"
  | "paid"
  | "on_hold"
  | "reversed"
  | "ineligible";

const EARNED_STATUSES: CommissionStatus[] = ["approved", "available", "payout_processing", "paid"];
const PENDING_STATUSES: CommissionStatus[] = ["pending_verification", "eligible", "approved", "on_hold"];

function safeDisplayName(row: any) {
  const raw = row?.student_name || row?.display_name;
  if (raw && String(raw).trim().length > 0) {
    const parts = String(raw).trim().split(/\s+/);
    const first = parts[0];
    const last = parts[1] ? parts[1][0].toUpperCase() + "." : "";
    return last ? `${first} ${last}` : first;
  }
  return "Learner";
}

function rangeFrom(range?: string, from?: string, to?: string) {
  const now = new Date();
  let f: Date | null = null;
  let t: Date | null = null;
  switch (range) {
    case "today": f = new Date(now); f.setHours(0, 0, 0, 0); break;
    case "7d": f = new Date(now.getTime() - 7 * 864e5); break;
    case "30d": f = new Date(now.getTime() - 30 * 864e5); break;
    case "90d": f = new Date(now.getTime() - 90 * 864e5); break;
    case "6m": f = new Date(now.getTime() - 180 * 864e5); break;
    case "1y": f = new Date(now.getTime() - 365 * 864e5); break;
    case "this_month": f = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case "last_month": {
      f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      t = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case "custom":
      if (from) f = new Date(from);
      if (to) { t = new Date(to); t.setHours(23, 59, 59, 999); }
      break;
    default: break;
  }
  return { from: f, to: t };
}

function sumAmount(rows: any[], statuses: CommissionStatus[]) {
  return rows
    .filter((r) => statuses.includes(r.status))
    .reduce((s, r) => s + Number(r.calculated_commission ?? 0), 0);
}

// ---------- summary + wallet + trend + programs + rates + monthly ----------
export const getEarningsOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      trendRange: z.enum(["7d", "30d", "90d", "6m", "1y", "all"]).optional().default("30d"),
    }).parse(v ?? {})
  )
  .handler(async ({ context, data }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: rows } = await supabase
      .from("ambassador_commissions")
      .select("id, status, calculated_commission, commission_percentage, program_id, created_at, approved_at, available_at, paid_at, reversed_at, transaction_type")
      .eq("ambassador_id", profile.id);
    const commissions = rows ?? [];

    // Summary
    const summary = {
      total_earned: sumAmount(commissions, EARNED_STATUSES),
      available: sumAmount(commissions, ["available"]),
      pending: sumAmount(commissions, PENDING_STATUSES),
      pending_breakdown: {
        pending_verification: sumAmount(commissions, ["pending_verification"]),
        eligible: sumAmount(commissions, ["eligible"]),
        approved: sumAmount(commissions, ["approved"]),
        on_hold: sumAmount(commissions, ["on_hold"]),
      },
      payout_processing: sumAmount(commissions, ["payout_processing"]),
      paid: sumAmount(commissions, ["paid"]),
      reversed: sumAmount(commissions, ["reversed"]),
      counts: commissions.length,
    };

    // Trend — by approved_at (or created_at fallback), amounts of EARNED_STATUSES
    const { from } = rangeFrom(data.trendRange === "all" ? undefined : data.trendRange);
    const trend: Record<string, number> = {};
    const days = data.trendRange === "7d" ? 7 : data.trendRange === "30d" ? 30 : data.trendRange === "90d" ? 90 : data.trendRange === "6m" ? 180 : data.trendRange === "1y" ? 365 : 90;
    const start = from ?? new Date(Date.now() - days * 864e5);
    for (let i = 0; i <= days; i++) {
      const d = new Date(start.getTime() + i * 864e5);
      trend[d.toISOString().slice(0, 10)] = 0;
    }
    for (const r of commissions) {
      if (!EARNED_STATUSES.includes(r.status as CommissionStatus)) continue;
      const dateStr = (r.approved_at || r.created_at || "").slice(0, 10);
      if (!dateStr) continue;
      if (dateStr in trend) trend[dateStr] += Number(r.calculated_commission ?? 0);
    }
    const trendPoints = Object.entries(trend).map(([date, amount]) => ({ date, amount }));

    // Programs
    const programIds = Array.from(new Set(commissions.map((r) => r.program_id).filter((x: any): x is string => !!x)));
    const programNameMap: Record<string, string> = {};
    if (programIds.length) {
      const { data: courses } = await supabase
        .from("courses")
        .select("id, name")
        .in("id", programIds);
      for (const c of courses ?? []) programNameMap[c.id] = c.name;
    }
    const byProgram: Record<string, { program_id: string; program_name: string; verified: number; earned: number; available: number; paid: number }> = {};
    for (const r of commissions) {
      const pid = r.program_id ?? "unknown";
      const key = String(pid);
      if (!byProgram[key]) {
        byProgram[key] = {
          program_id: key,
          program_name: programNameMap[key] || "Program",
          verified: 0, earned: 0, available: 0, paid: 0,
        };
      }
      if (EARNED_STATUSES.includes(r.status as CommissionStatus)) byProgram[key].verified++;
      if (EARNED_STATUSES.includes(r.status as CommissionStatus)) byProgram[key].earned += Number(r.calculated_commission ?? 0);
      if (r.status === "available") byProgram[key].available += Number(r.calculated_commission ?? 0);
      if (r.status === "paid") byProgram[key].paid += Number(r.calculated_commission ?? 0);
    }
    const programs = Object.values(byProgram).sort((a, b) => b.earned - a.earned).slice(0, 5);
    const programsTotal = Object.keys(byProgram).length;

    // Commission rates used
    const byRate: Record<string, { rate: number; count: number; total: number }> = {};
    for (const r of commissions) {
      if (!EARNED_STATUSES.includes(r.status as CommissionStatus)) continue;
      const rate = Number(r.commission_percentage ?? 0);
      const key = rate.toFixed(2);
      if (!byRate[key]) byRate[key] = { rate, count: 0, total: 0 };
      byRate[key].count++;
      byRate[key].total += Number(r.calculated_commission ?? 0);
    }
    const rates = Object.values(byRate).sort((a, b) => b.rate - a.rate);

    // Monthly
    const monthly: Record<string, { month: string; earned: number; available: number; paid: number; reversed: number }> = {};
    for (const r of commissions) {
      const date = new Date(r.approved_at || r.created_at);
      if (isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { month: key, earned: 0, available: 0, paid: 0, reversed: 0 };
      if (EARNED_STATUSES.includes(r.status as CommissionStatus)) monthly[key].earned += Number(r.calculated_commission);
      if (r.status === "available") monthly[key].available += Number(r.calculated_commission);
      if (r.status === "paid") monthly[key].paid += Number(r.calculated_commission);
      if (r.status === "reversed") monthly[key].reversed += Number(r.calculated_commission);
    }
    const months = Object.values(monthly).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6);

    return {
      gate: "ok" as const,
      profile: { id: profile.id, ambassador_code: profile.ambassador_code, full_name: profile.full_name },
      summary,
      trend: trendPoints,
      programs,
      programs_total: programsTotal,
      rates,
      months,
    };
  });

// ---------- history list ----------
export const listCommissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      status: z.string().optional(),
      programId: z.string().optional(),
      range: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      search: z.string().optional(),
      sort: z.enum(["newest", "oldest", "highest", "lowest", "recently_updated", "program", "status"]).optional().default("newest"),
      page: z.number().min(1).optional().default(1),
      pageSize: z.number().min(1).max(50).optional().default(20),
    }).parse(v ?? {})
  )
  .handler(async ({ context, data }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const, rows: [], total: 0, programs: [] };
    const { supabase } = context;

    let q = supabase
      .from("ambassador_commissions")
      .select("id, transaction_code, enrollment_id, program_id, pricing_plan, eligible_base_amount, commission_percentage, calculated_commission, status, transaction_type, created_at, updated_at, approved_at, available_at, paid_at, reversed_at", { count: "exact" })
      .eq("ambassador_id", profile.id);

    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    if (data.programId && data.programId !== "all") q = q.eq("program_id", data.programId);

    const { from: dfrom, to: dto } = rangeFrom(data.range, data.from, data.to);
    if (dfrom) q = q.gte("created_at", dfrom.toISOString());
    if (dto) q = q.lte("created_at", dto.toISOString());

    // Sort
    switch (data.sort) {
      case "oldest": q = q.order("created_at", { ascending: true }); break;
      case "highest": q = q.order("calculated_commission", { ascending: false }); break;
      case "lowest": q = q.order("calculated_commission", { ascending: true }); break;
      case "recently_updated": q = q.order("updated_at", { ascending: false }); break;
      case "program": q = q.order("program_id", { ascending: true }); break;
      case "status": q = q.order("status", { ascending: true }); break;
      default: q = q.order("created_at", { ascending: false });
    }

    const offset = (data.page - 1) * data.pageSize;
    q = q.range(offset, offset + data.pageSize - 1);

    const { data: rows, count } = await q;
    const enrollmentIds = Array.from(new Set((rows ?? []).map((r) => r.enrollment_id).filter((x: any): x is string => !!x)));
    const programIds = Array.from(new Set((rows ?? []).map((r) => r.program_id).filter((x: any): x is string => !!x)));

    const [enrRes, courseRes] = await Promise.all([
      enrollmentIds.length
        ? supabase.from("enrollments").select("id, enrollment_code, student_name").in("id", enrollmentIds)
        : Promise.resolve({ data: [] as any[] }),
      programIds.length
        ? supabase.from("courses").select("id, name, slug").in("id", programIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const enrMap: Record<string, any> = {};
    for (const e of enrRes.data ?? []) enrMap[e.id] = e;
    const courseMap: Record<string, any> = {};
    for (const c of courseRes.data ?? []) courseMap[c.id] = c;

    let list = (rows ?? []).map((r) => {
      const enr = enrMap[r.enrollment_id!] || null;
      const course = courseMap[r.program_id!] || null;
      return {
        id: r.id,
        transaction_code: r.transaction_code,
        enrollment_code: enr?.enrollment_code ?? null,
        student_display_name: enr ? safeDisplayName(enr) : "—",
        program_id: r.program_id,
        program_name: course?.name ?? "Program",
        pricing_plan: r.pricing_plan,
        eligible_base_amount: Number(r.eligible_base_amount),
        commission_percentage: Number(r.commission_percentage),
        calculated_commission: Number(r.calculated_commission),
        status: r.status as CommissionStatus,
        transaction_type: r.transaction_type,
        created_at: r.created_at,
      };
    });

    // Client-side search (works within page; also apply search server-side by transaction_code)
    if (data.search && data.search.trim()) {
      const s = data.search.trim().toLowerCase();
      list = list.filter((r) =>
        (r.transaction_code || "").toLowerCase().includes(s) ||
        (r.enrollment_code || "").toLowerCase().includes(s) ||
        r.student_display_name.toLowerCase().includes(s) ||
        r.program_name.toLowerCase().includes(s)
      );
    }

    // Programs list for filter
    const { data: allProgramRows } = await supabase
      .from("ambassador_commissions")
      .select("program_id")
      .eq("ambassador_id", profile.id);
    const filterProgramIds = Array.from(new Set((allProgramRows ?? []).map((r: any) => r.program_id).filter((x: any): x is string => !!x)));
    const filterCourses = filterProgramIds.length
      ? (await supabase.from("courses").select("id, name").in("id", filterProgramIds)).data ?? []
      : [];

    return {
      gate: "ok" as const,
      rows: list,
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      programs: filterCourses.map((c: any) => ({ id: c.id, name: c.name })),
    };
  });

// ---------- details ----------
export const getCommissionDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const };
    const { supabase } = context;

    const { data: c } = await supabase
      .from("ambassador_commissions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (!c) return { gate: "not_found" as const };
    if (c.ambassador_id !== profile.id) return { gate: "forbidden" as const };

    const [enrRes, courseRes, histRes] = await Promise.all([
      c.enrollment_id
        ? supabase.from("enrollments").select("id, enrollment_code, student_name, verified_at, enrolled_at, created_at, ambassador_referral_code").eq("id", c.enrollment_id).maybeSingle()
        : Promise.resolve({ data: null }),
      c.program_id
        ? supabase.from("courses").select("id, name, slug").eq("id", c.program_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("ambassador_commission_status_history")
        .select("id, from_status, to_status, event_type, public_note, created_at")
        .eq("commission_id", c.id)
        .order("created_at", { ascending: true }),
    ]);
    const enr = enrRes.data;
    const course = courseRes.data;

    return {
      gate: "ok" as const,
      commission: {
        id: c.id,
        transaction_code: c.transaction_code,
        transaction_type: c.transaction_type,
        pricing_plan: c.pricing_plan,
        eligible_base_amount: Number(c.eligible_base_amount),
        commission_percentage: Number(c.commission_percentage),
        calculated_commission: Number(c.calculated_commission),
        status: c.status as CommissionStatus,
        eligibility_status: c.eligibility_status,
        eligibility_public_reason: c.eligibility_public_reason,
        public_reason: c.public_reason,
        adjustment_public_note: c.adjustment_public_note,
        payout_reference: c.payout_reference,
        payout_processing_at: c.payout_processing_at,
        created_at: c.created_at,
        approved_at: c.approved_at,
        available_at: c.available_at,
        paid_at: c.paid_at,
        reversed_at: c.reversed_at,
        reversal_public_reason: c.public_reason,
      },
      enrollment: enr
        ? {
            id: enr.id,
            enrollment_code: enr.enrollment_code,
            student_display_name: safeDisplayName(enr),
            enrolled_at: enr.enrolled_at,
            verified_at: enr.verified_at,
            referral_code: enr.ambassador_referral_code,
          }
        : null,
      program: course ? { id: course.id, name: course.name, slug: course.slug } : null,
      history: histRes.data ?? [],
    };
  });

// ---------- CSV export ----------
export const exportCommissionsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      status: z.string().optional(),
      programId: z.string().optional(),
      range: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }).parse(v ?? {})
  )
  .handler(async ({ context, data }) => {
    const profile = await loadAmbassador(context);
    if (!profile) return { gate: "not_approved" as const, csv: "" };
    const { supabase } = context;

    let q = supabase
      .from("ambassador_commissions")
      .select("id, transaction_code, enrollment_id, program_id, pricing_plan, eligible_base_amount, commission_percentage, calculated_commission, status, created_at, approved_at, available_at, paid_at")
      .eq("ambassador_id", profile.id);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    if (data.programId && data.programId !== "all") q = q.eq("program_id", data.programId);
    const { from: dfrom, to: dto } = rangeFrom(data.range, data.from, data.to);
    if (dfrom) q = q.gte("created_at", dfrom.toISOString());
    if (dto) q = q.lte("created_at", dto.toISOString());
    q = q.order("created_at", { ascending: false }).limit(5000);
    const { data: rows } = await q;

    const enrIds = Array.from(new Set((rows ?? []).map((r) => r.enrollment_id).filter((x: any): x is string => !!x)));
    const progIds = Array.from(new Set((rows ?? []).map((r) => r.program_id).filter((x: any): x is string => !!x)));
    const [enrRes, courseRes] = await Promise.all([
      enrIds.length ? supabase.from("enrollments").select("id, enrollment_code").in("id", enrIds) : Promise.resolve({ data: [] as any[] }),
      progIds.length ? supabase.from("courses").select("id, name").in("id", progIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const enrMap: Record<string, any> = {}; for (const e of enrRes.data ?? []) enrMap[e.id] = e;
    const courseMap: Record<string, any> = {}; for (const c of courseRes.data ?? []) courseMap[c.id] = c;

    const header = [
      "Commission Transaction ID","Enrollment Reference","Program","Pricing Plan",
      "Commission Base","Commission Rate","Commission Amount","Commission Status",
      "Created Date","Approved Date","Available Date","Paid Date",
    ];
    const esc = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(",")];
    for (const r of rows ?? []) {
      lines.push([
        r.transaction_code ?? "",
        enrMap[r.enrollment_id!]?.enrollment_code ?? "",
        courseMap[r.program_id!]?.name ?? "",
        r.pricing_plan ?? "",
        r.eligible_base_amount,
        `${r.commission_percentage}%`,
        r.calculated_commission,
        r.status,
        r.created_at ?? "",
        r.approved_at ?? "",
        r.available_at ?? "",
        r.paid_at ?? "",
      ].map(esc).join(","));
    }
    return { gate: "ok" as const, csv: lines.join("\n") };
  });
