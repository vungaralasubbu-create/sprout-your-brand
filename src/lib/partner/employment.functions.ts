import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getEmployeeByUser(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("employee_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Fetch the current employee's full workspace snapshot. */
export const getEmployeeWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const employee = await getEmployeeByUser(supabase, userId);
    if (!employee) return { employee: null };

    // Auto-touch today's attendance
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await touchAttendance(supabaseAdmin, employee.id);

    const [
      { data: settings },
      { data: today },
      { data: structure },
      { data: pf },
      { data: partner },
    ] = await Promise.all([
      supabase.from("attendance_settings").select("*").maybeSingle(),
      supabase
        .from("employee_attendance")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("attendance_date", new Date().toISOString().slice(0, 10))
        .maybeSingle(),
      supabase.from("salary_structures").select("*").eq("employee_id", employee.id).maybeSingle(),
      supabase.from("pf_preferences").select("*").eq("employee_id", employee.id).maybeSingle(),
      supabase
        .from("partners")
        .select("id, display_name, partner_code, first_name")
        .eq("id", employee.partner_id)
        .maybeSingle(),
    ]);

    const { data: benefits } = await supabase
      .from("employee_benefits")
      .select("*, benefit_types(id, code, label, description, is_active)")
      .eq("employee_id", employee.id);

    const { data: latestPayroll } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("employee_id", employee.id)
      .in("status", ["slip_generated", "paid"])
      .order("payroll_year", { ascending: false })
      .order("payroll_month", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      employee,
      partner,
      settings,
      todayAttendance: today ?? null,
      salaryStructure: structure ?? null,
      pfPreference: pf ?? null,
      benefits: benefits ?? [],
      latestPayroll: latestPayroll ?? null,
    };
  });

/** List employee's attendance for a given month. */
export const listMyAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { year: number; month: number }) =>
    z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const employee = await getEmployeeByUser(supabase, userId);
    if (!employee) return { records: [], summary: emptySummary() };

    const start = new Date(Date.UTC(data.year, data.month - 1, 1));
    const end = new Date(Date.UTC(data.year, data.month, 0));
    const startS = start.toISOString().slice(0, 10);
    const endS = end.toISOString().slice(0, 10);

    const { data: records, error } = await supabase
      .from("employee_attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .gte("attendance_date", startS)
      .lte("attendance_date", endS)
      .order("attendance_date", { ascending: true });
    if (error) throw new Error(error.message);

    const summary = summarize(records ?? []);
    return { records: records ?? [], summary };
  });

/** List employee's salary slips (only status slip_generated / paid). */
export const listMySalarySlips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const employee = await getEmployeeByUser(supabase, userId);
    if (!employee) return [];
    const { data, error } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("employee_id", employee.id)
      .in("status", ["slip_generated", "paid"])
      .order("payroll_year", { ascending: false })
      .order("payroll_month", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Fetch a single salary slip for the employee (must be slip_generated or paid). */
export const getMySalarySlip = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const employee = await getEmployeeByUser(supabase, userId);
    if (!employee) throw new Error("Not an employee");
    const { data: slip, error } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("id", data.id)
      .eq("employee_id", employee.id)
      .in("status", ["slip_generated", "paid"])
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!slip) throw new Error("Salary slip not available");

    const [{ data: partner }, { data: payout }] = await Promise.all([
      supabase
        .from("partners")
        .select("display_name, first_name, partner_code")
        .eq("id", employee.partner_id)
        .maybeSingle(),
      supabase
        .from("partner_payout_details")
        .select("account_last4, pan_masked, bank_name")
        .eq("partner_id", employee.partner_id)
        .maybeSingle(),
    ]);
    return { slip, employee, partner, payout };
  });

/** Submit or update PF preference (before admin review). */
export const submitPfPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { preference: "interested" | "not_interested" }) =>
    z.object({ preference: z.enum(["interested", "not_interested"]) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const employee = await getEmployeeByUser(supabase, userId);
    if (!employee) throw new Error("Not an employee");

    const { data: existing } = await supabase
      .from("pf_preferences")
      .select("id, status")
      .eq("employee_id", employee.id)
      .maybeSingle();

    if (existing) {
      if (!["submitted", "under_review"].includes(existing.status)) {
        throw new Error("PF preference is locked after admin review.");
      }
      const { error } = await supabase
        .from("pf_preferences")
        .update({ preference: data.preference, status: "submitted" })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("pf_preferences").insert({
        employee_id: employee.id,
        preference: data.preference,
        status: "submitted",
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Flexible partner monthly earnings statement. */
export const getMyMonthlyEarningsStatement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { year: number; month: number }) =>
    z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("partners")
      .select("id, display_name, partner_code, first_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (!partner) return null;

    const start = new Date(Date.UTC(data.year, data.month - 1, 1));
    const end = new Date(Date.UTC(data.year, data.month, 0, 23, 59, 59));
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const [{ data: commissions }, { data: referrals }] = await Promise.all([
      supabase
        .from("commissions")
        .select("id, gross_revenue, partner_share_amount, status, verified_at, paid_at")
        .eq("partner_id", partner.id)
        .gte("verified_at", startIso)
        .lte("verified_at", endIso),
      supabase
        .from("partner_referrals")
        .select("bonus_amount, status, qualified_at, paid_at")
        .eq("referrer_partner_id", partner.id)
        .gte("qualified_at", startIso)
        .lte("qualified_at", endIso),
    ]);

    const verifiedSales = (commissions ?? []).filter((c) =>
      ["approved", "paid"].includes(c.status),
    ).length;
    const revenueShare = (commissions ?? [])
      .filter((c) => ["approved", "paid"].includes(c.status))
      .reduce((s, c) => s + Number(c.partner_share_amount ?? 0), 0);
    const payoutsPaid = (commissions ?? [])
      .filter((c) => c.status === "paid")
      .reduce((s, c) => s + Number(c.partner_share_amount ?? 0), 0);
    const payoutsPending = revenueShare - payoutsPaid;
    const referralBonus = (referrals ?? [])
      .filter((r) => ["paid", "bonus_pending_approval", "qualified"].includes(r.status))
      .reduce((s, r) => s + Number(r.bonus_amount ?? 0), 0);

    return {
      partner,
      year: data.year,
      month: data.month,
      verifiedSales,
      revenueShare,
      referralBonus,
      payoutsPaid,
      payoutsPending,
      totalEarnings: revenueShare + referralBonus,
    };
  });

/* ----------------------------- helpers ----------------------------------- */

function emptySummary() {
  return {
    present: 0,
    late: 0,
    half_day: 0,
    absent: 0,
    leave: 0,
    weekly_off: 0,
    holiday: 0,
  };
}
function summarize(records: Array<{ status: string }>) {
  const s = emptySummary() as Record<string, number>;
  for (const r of records) s[r.status] = (s[r.status] ?? 0) + 1;
  return s;
}

async function touchAttendance(supabaseAdmin: any, employeeId: string) {
  // Read settings for status calc
  const { data: settings } = await supabaseAdmin
    .from("attendance_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (!settings || settings.is_active === false) return;

  const nowIso = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const dow = new Date().getUTCDay();
  const isWeeklyOff = (settings.weekly_off_days ?? []).includes(dow);

  const { data: existing } = await supabaseAdmin
    .from("employee_attendance")
    .select("id, first_login_at, admin_override, status")
    .eq("employee_id", employeeId)
    .eq("attendance_date", today)
    .maybeSingle();

  if (existing) {
    if (!existing.admin_override) {
      const patch: Record<string, unknown> = { last_activity_at: nowIso };
      // Recompute status if we have first_login and settings
      if (existing.first_login_at) {
        const status = computeStatus(existing.first_login_at, nowIso, settings, isWeeklyOff);
        patch.status = status;
        patch.working_minutes = Math.max(
          0,
          Math.round((new Date(nowIso).getTime() - new Date(existing.first_login_at).getTime()) / 60000),
        );
      }
      await supabaseAdmin.from("employee_attendance").update(patch).eq("id", existing.id);
    }
  } else {
    const status = isWeeklyOff
      ? "weekly_off"
      : computeStatus(nowIso, nowIso, settings, isWeeklyOff);
    await supabaseAdmin.from("employee_attendance").insert({
      employee_id: employeeId,
      attendance_date: today,
      first_login_at: isWeeklyOff ? null : nowIso,
      last_activity_at: isWeeklyOff ? null : nowIso,
      is_weekly_off: isWeeklyOff,
      status,
      working_minutes: 0,
    });
  }
}

function computeStatus(
  firstLoginIso: string,
  lastActivityIso: string,
  settings: any,
  isWeeklyOff: boolean,
): string {
  if (isWeeklyOff) return "weekly_off";
  const firstLogin = new Date(firstLoginIso);
  const lastAct = new Date(lastActivityIso);
  const hours = Math.max(0, (lastAct.getTime() - firstLogin.getTime()) / 3_600_000);

  const [lateH, lateM] = String(settings.late_mark_time ?? "10:30").split(":").map(Number);
  const lateBoundary = new Date(firstLogin);
  lateBoundary.setUTCHours(lateH, lateM, 0, 0);

  const isLateLogin = firstLogin.getTime() > lateBoundary.getTime();

  if (hours >= Number(settings.min_hours_full_day ?? 8)) {
    return isLateLogin ? "late" : "present";
  }
  if (hours >= Number(settings.min_hours_half_day ?? 4)) return "half_day";
  return "present"; // still active today; do not mark absent until admin runs payroll
}
