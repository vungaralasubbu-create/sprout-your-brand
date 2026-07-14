import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden");
}

/** Ensure an employee_profile exists for a partner. Idempotent. */
export const ensureEmployeeProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { partner_id: string; joining_date?: string; payroll_entity?: string }) =>
    z
      .object({
        partner_id: z.string().uuid(),
        joining_date: z.string().optional(),
        payroll_entity: z.string().max(160).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: partner, error: pErr } = await supabaseAdmin
      .from("partners")
      .select("id, user_id, work_model, work_model_status")
      .eq("id", data.partner_id)
      .maybeSingle();
    if (pErr || !partner) throw new Error("Partner not found");
    if (partner.work_model !== "full_time")
      throw new Error("Partner is not on Full-Time work model");

    const { data: existing } = await supabaseAdmin
      .from("employee_profiles")
      .select("*")
      .eq("partner_id", partner.id)
      .maybeSingle();
    if (existing) return { profile: existing, created: false };

    const { data: code } = await supabaseAdmin.rpc("generate_employee_code");
    const { data: created, error } = await supabaseAdmin
      .from("employee_profiles")
      .insert({
        partner_id: partner.id,
        user_id: partner.user_id,
        employee_code: code as string,
        joining_date: data.joining_date ?? new Date().toISOString().slice(0, 10),
        payroll_entity_name: data.payroll_entity ?? null,
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { profile: created, created: true };
  });

/** List employees for the admin table. */
export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: employees } = await supabaseAdmin
      .from("employee_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!employees || employees.length === 0) return [];

    const ids = employees.map((e) => e.id);
    const partnerIds = employees.map((e) => e.partner_id);

    const [{ data: partners }, { data: structures }, { data: pfs }, { data: benefits }, { data: latestPayrolls }] =
      await Promise.all([
        supabaseAdmin.from("partners").select("id, display_name, partner_code").in("id", partnerIds),
        supabaseAdmin.from("salary_structures").select("employee_id, monthly_gross").in("employee_id", ids),
        supabaseAdmin.from("pf_preferences").select("employee_id, preference, status").in("employee_id", ids),
        supabaseAdmin.from("employee_benefits").select("employee_id, status").in("employee_id", ids),
        supabaseAdmin
          .from("payroll_runs")
          .select("employee_id, status, payroll_year, payroll_month")
          .in("employee_id", ids)
          .order("payroll_year", { ascending: false })
          .order("payroll_month", { ascending: false }),
      ]);

    const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]));
    const structureMap = new Map((structures ?? []).map((s) => [s.employee_id, s]));
    const pfMap = new Map((pfs ?? []).map((p) => [p.employee_id, p]));
    const benefitCount = new Map<string, number>();
    for (const b of benefits ?? [])
      benefitCount.set(b.employee_id, (benefitCount.get(b.employee_id) ?? 0) + (b.status === "active" ? 1 : 0));
    const latestPayrollMap = new Map<string, any>();
    for (const p of latestPayrolls ?? [])
      if (!latestPayrollMap.has(p.employee_id)) latestPayrollMap.set(p.employee_id, p);

    return employees.map((e) => ({
      ...e,
      partner: partnerMap.get(e.partner_id) ?? null,
      structure: structureMap.get(e.id) ?? null,
      pf_preference: pfMap.get(e.id) ?? null,
      active_benefits_count: benefitCount.get(e.id) ?? 0,
      latest_payroll: latestPayrollMap.get(e.id) ?? null,
    }));
  });

/** Fetch a single employee with all related data (admin view). */
export const getEmployeeById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: employee } = await supabaseAdmin
      .from("employee_profiles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!employee) throw new Error("Employee not found");

    const [{ data: partner }, { data: structure }, { data: pf }, { data: benefits }, { data: benefitTypes }] =
      await Promise.all([
        supabaseAdmin
          .from("partners")
          .select("id, display_name, partner_code, mobile, email")
          .eq("id", employee.partner_id)
          .maybeSingle(),
        supabaseAdmin.from("salary_structures").select("*").eq("employee_id", employee.id).maybeSingle(),
        supabaseAdmin.from("pf_preferences").select("*").eq("employee_id", employee.id).maybeSingle(),
        supabaseAdmin
          .from("employee_benefits")
          .select("*, benefit_types(id, code, label)")
          .eq("employee_id", employee.id),
        supabaseAdmin.from("benefit_types").select("*").order("sort_order"),
      ]);
    return { employee, partner, structure, pfPreference: pf, benefits: benefits ?? [], benefitTypes: benefitTypes ?? [] };
  });

/** Save salary structure for an employee. */
export const saveSalaryStructure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    employee_id: string;
    monthly_gross: number;
    basic: number;
    hra: number;
    special_allowance: number;
    performance_incentive: number;
    other_earnings: number;
    pf_applicable: boolean;
    employee_pf_amount: number;
    employer_pf_amount: number;
    professional_tax: number;
    tds: number;
    other_deductions: number;
  }) =>
    z
      .object({
        employee_id: z.string().uuid(),
        monthly_gross: z.number().min(0),
        basic: z.number().min(0),
        hra: z.number().min(0),
        special_allowance: z.number().min(0),
        performance_incentive: z.number().min(0),
        other_earnings: z.number().min(0),
        pf_applicable: z.boolean(),
        employee_pf_amount: z.number().min(0),
        employer_pf_amount: z.number().min(0),
        professional_tax: z.number().min(0),
        tds: z.number().min(0),
        other_deductions: z.number().min(0),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("salary_structures")
      .select("id")
      .eq("employee_id", data.employee_id)
      .maybeSingle();
    const payload = { ...data, updated_by: context.userId };
    if (existing) {
      const { error } = await supabaseAdmin.from("salary_structures").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("salary_structures").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Save or update PF preference from admin. */
export const reviewPfPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    employee_id: string;
    status: "under_review" | "approved" | "rejected" | "not_applicable";
    admin_notes?: string;
  }) =>
    z
      .object({
        employee_id: z.string().uuid(),
        status: z.enum(["under_review", "approved", "rejected", "not_applicable"]),
        admin_notes: z.string().max(1000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pf_preferences")
      .update({
        status: data.status,
        admin_notes: data.admin_notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("employee_id", data.employee_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Set an employee benefit status. */
export const setEmployeeBenefit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    employee_id: string;
    benefit_type_id: string;
    status: "available" | "requested" | "under_review" | "active" | "not_eligible";
    admin_notes?: string;
  }) =>
    z
      .object({
        employee_id: z.string().uuid(),
        benefit_type_id: z.string().uuid(),
        status: z.enum(["available", "requested", "under_review", "active", "not_eligible"]),
        admin_notes: z.string().max(1000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("employee_benefits")
      .select("id")
      .eq("employee_id", data.employee_id)
      .eq("benefit_type_id", data.benefit_type_id)
      .maybeSingle();
    const patch = {
      status: data.status,
      admin_notes: data.admin_notes ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: context.userId,
      activated_at: data.status === "active" ? new Date().toISOString() : null,
    };
    if (existing) {
      const { error } = await supabaseAdmin.from("employee_benefits").update(patch).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("employee_benefits").insert({
        employee_id: data.employee_id,
        benefit_type_id: data.benefit_type_id,
        ...patch,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ------------------------- Attendance settings ---------------------------- */

export const getAttendanceSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("attendance_settings").select("*").eq("id", 1).maybeSingle();
    return data;
  });

export const updateAttendanceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    is_active: boolean;
    work_start_time: string;
    late_mark_time: string;
    min_hours_full_day: number;
    min_hours_half_day: number;
    working_days: number[];
    weekly_off_days: number[];
  }) =>
    z
      .object({
        is_active: z.boolean(),
        work_start_time: z.string().regex(/^\d{2}:\d{2}$/),
        late_mark_time: z.string().regex(/^\d{2}:\d{2}$/),
        min_hours_full_day: z.number().min(0).max(24),
        min_hours_half_day: z.number().min(0).max(24),
        working_days: z.array(z.number().int().min(0).max(6)),
        weekly_off_days: z.array(z.number().int().min(0).max(6)),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("attendance_settings")
      .update({ ...data, updated_by: context.userId })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------ Payroll ---------------------------------- */

export const listPayrollRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { year: number; month: number; status?: string }) =>
    z
      .object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
        status: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // All active employees
    const { data: employees } = await supabaseAdmin
      .from("employee_profiles")
      .select("id, employee_code, joining_date, partner_id")
      .eq("employment_status", "active");
    if (!employees || employees.length === 0) return [];

    const partnerIds = employees.map((e) => e.partner_id);
    const empIds = employees.map((e) => e.id);
    const [{ data: partners }, { data: runs }] = await Promise.all([
      supabaseAdmin.from("partners").select("id, display_name").in("id", partnerIds),
      supabaseAdmin
        .from("payroll_runs")
        .select("*")
        .in("employee_id", empIds)
        .eq("payroll_year", data.year)
        .eq("payroll_month", data.month),
    ]);
    const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]));
    const runMap = new Map((runs ?? []).map((r) => [r.employee_id, r]));

    let out = employees.map((e) => ({
      employee: e,
      partner: partnerMap.get(e.partner_id) ?? null,
      run: runMap.get(e.id) ?? null,
    }));
    if (data.status) out = out.filter((r) => (r.run?.status ?? "pending") === data.status);
    return out;
  });

/** Prepare (or update-preparation of) a payroll run: computes attendance summary and defaults from structure. */
export const preparePayrollRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { employee_id: string; year: number; month: number }) =>
    z
      .object({
        employee_id: z.string().uuid(),
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: structure } = await supabaseAdmin
      .from("salary_structures")
      .select("*")
      .eq("employee_id", data.employee_id)
      .maybeSingle();

    // Attendance summary
    const start = new Date(Date.UTC(data.year, data.month - 1, 1));
    const end = new Date(Date.UTC(data.year, data.month, 0));
    const startS = start.toISOString().slice(0, 10);
    const endS = end.toISOString().slice(0, 10);
    const { data: att } = await supabaseAdmin
      .from("employee_attendance")
      .select("status")
      .eq("employee_id", data.employee_id)
      .gte("attendance_date", startS)
      .lte("attendance_date", endS);
    const summary = { present: 0, late: 0, half_day: 0, absent: 0, leave: 0, weekly_off: 0, holiday: 0 } as Record<string, number>;
    for (const r of att ?? []) summary[r.status] = (summary[r.status] ?? 0) + 1;
    const payableDays = summary.present + summary.late + 0.5 * summary.half_day + summary.leave + summary.weekly_off + summary.holiday;

    const s = structure ?? ({} as any);
    const basic = Number(s.basic ?? 0);
    const hra = Number(s.hra ?? 0);
    const sa = Number(s.special_allowance ?? 0);
    const inc = Number(s.performance_incentive ?? 0);
    const other = Number(s.other_earnings ?? 0);
    const gross = basic + hra + sa + inc + other;
    const empPf = s.pf_applicable ? Number(s.employee_pf_amount ?? 0) : 0;
    const emplPf = s.pf_applicable ? Number(s.employer_pf_amount ?? 0) : 0;
    const pt = Number(s.professional_tax ?? 0);
    const tds = Number(s.tds ?? 0);
    const otherDed = Number(s.other_deductions ?? 0);
    const totalDed = empPf + pt + tds + otherDed;
    const net = gross - totalDed;

    const payload = {
      employee_id: data.employee_id,
      payroll_year: data.year,
      payroll_month: data.month,
      status: "prepared" as const,
      present_days: summary.present,
      late_days: summary.late,
      half_days: summary.half_day,
      absent_days: summary.absent,
      leave_days: summary.leave,
      weekly_off_days: summary.weekly_off,
      holiday_days: summary.holiday,
      payable_days: payableDays,
      basic, hra, special_allowance: sa, performance_incentive: inc, other_earnings: other,
      gross_earnings: gross,
      employee_pf: empPf, employer_pf: emplPf,
      professional_tax: pt, tds, other_deductions: otherDed,
      total_deductions: totalDed, net_pay: net,
    };

    const { data: existing } = await supabaseAdmin
      .from("payroll_runs")
      .select("id, status")
      .eq("employee_id", data.employee_id)
      .eq("payroll_year", data.year)
      .eq("payroll_month", data.month)
      .maybeSingle();
    if (existing) {
      if (["approved", "slip_generated", "paid"].includes(existing.status))
        throw new Error("Payroll already approved. Edit values instead.");
      const { error } = await supabaseAdmin.from("payroll_runs").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    }
    const { data: created, error } = await supabaseAdmin.from("payroll_runs").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

/** Manually edit payroll values (only before approval). */
export const updatePayrollValues = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    id: string;
    basic: number; hra: number; special_allowance: number; performance_incentive: number; other_earnings: number;
    employee_pf: number; professional_tax: number; tds: number; other_deductions: number;
    admin_notes?: string;
  }) =>
    z
      .object({
        id: z.string().uuid(),
        basic: z.number().min(0),
        hra: z.number().min(0),
        special_allowance: z.number().min(0),
        performance_incentive: z.number().min(0),
        other_earnings: z.number().min(0),
        employee_pf: z.number().min(0),
        professional_tax: z.number().min(0),
        tds: z.number().min(0),
        other_deductions: z.number().min(0),
        admin_notes: z.string().max(1000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: run } = await supabaseAdmin.from("payroll_runs").select("status").eq("id", data.id).maybeSingle();
    if (!run) throw new Error("Payroll not found");
    if (["approved", "slip_generated", "paid"].includes(run.status))
      throw new Error("Payroll is locked after approval");
    const gross = data.basic + data.hra + data.special_allowance + data.performance_incentive + data.other_earnings;
    const totalDed = data.employee_pf + data.professional_tax + data.tds + data.other_deductions;
    const net = gross - totalDed;
    const { error } = await supabaseAdmin
      .from("payroll_runs")
      .update({
        basic: data.basic, hra: data.hra, special_allowance: data.special_allowance,
        performance_incentive: data.performance_incentive, other_earnings: data.other_earnings,
        employee_pf: data.employee_pf, professional_tax: data.professional_tax,
        tds: data.tds, other_deductions: data.other_deductions,
        gross_earnings: gross, total_deductions: totalDed, net_pay: net,
        admin_notes: data.admin_notes ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Transition payroll status: approve / generate slip / mark paid. */
export const transitionPayroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    id: string;
    action: "approve" | "generate_slip" | "mark_paid" | "cancel";
    payment_reference?: string;
    payment_date?: string;
    admin_notes?: string;
  }) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "generate_slip", "mark_paid", "cancel"]),
        payment_reference: z.string().max(160).optional(),
        payment_date: z.string().optional(),
        admin_notes: z.string().max(1000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();

    const { data: run } = await supabaseAdmin.from("payroll_runs").select("status").eq("id", data.id).maybeSingle();
    if (!run) throw new Error("Payroll not found");

    let patch: Record<string, unknown> = { admin_notes: data.admin_notes ?? null };
    if (data.action === "approve") {
      if (run.status !== "prepared") throw new Error("Payroll must be prepared before approval");
      patch = { ...patch, status: "approved", approved_at: now, approved_by: context.userId };
    } else if (data.action === "generate_slip") {
      if (run.status !== "approved") throw new Error("Approve payroll before generating slip");
      patch = { ...patch, status: "slip_generated", slip_generated_at: now };
    } else if (data.action === "mark_paid") {
      if (!["approved", "slip_generated"].includes(run.status))
        throw new Error("Payroll must be approved or slip generated before marking paid");
      if (!data.payment_reference) throw new Error("Payment reference is required");
      if (!data.payment_date) throw new Error("Payment date is required");
      patch = {
        ...patch,
        status: "paid",
        paid_at: now,
        payment_reference: data.payment_reference,
        payment_date: data.payment_date,
      };
    } else if (data.action === "cancel") {
      patch = { ...patch, status: "cancelled" };
    }
    const { error } = await supabaseAdmin.from("payroll_runs").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: fetch full payroll detail for a run. */
export const getPayrollDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: run } = await supabaseAdmin.from("payroll_runs").select("*").eq("id", data.id).maybeSingle();
    if (!run) throw new Error("Payroll not found");
    const { data: employee } = await supabaseAdmin
      .from("employee_profiles")
      .select("*")
      .eq("id", run.employee_id)
      .maybeSingle();
    const { data: partner } = employee
      ? await supabaseAdmin
          .from("partners")
          .select("display_name, partner_code")
          .eq("id", employee.partner_id)
          .maybeSingle()
      : { data: null };
    return { run, employee, partner };
  });
