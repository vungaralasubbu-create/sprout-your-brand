/**
 * Budget Manager
 * --------------
 * Cost-based governance in Lovable credits. Supports user, role,
 * organization, and global budgets. Records events to `budget_events`
 * for auditability. Returns whether a call would exceed the budget
 * and whether the alert threshold has been crossed.
 */

import type { AppRole, BudgetCheck } from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function periodStart(period: "day" | "week" | "month"): string {
  const d = new Date();
  if (period === "day") d.setUTCHours(0, 0, 0, 0);
  else if (period === "week") { d.setUTCDate(d.getUTCDate() - d.getUTCDay()); d.setUTCHours(0, 0, 0, 0); }
  else { d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); }
  return d.toISOString();
}

interface Ctx { userId?: string; role?: AppRole; organizationId?: string }

async function pickBudget(ctx: Ctx) {
  const supabaseAdmin = await admin();
  // Priority: user > organization > role > global
  const orderedFilters: Array<{ subject_type: string; subject_id?: string; subject_role?: string }> = [];
  if (ctx.userId) orderedFilters.push({ subject_type: "user", subject_id: ctx.userId });
  if (ctx.organizationId) orderedFilters.push({ subject_type: "organization", subject_id: ctx.organizationId });
  if (ctx.role) orderedFilters.push({ subject_type: "role", subject_role: ctx.role });
  orderedFilters.push({ subject_type: "global" });

  for (const f of orderedFilters) {
    let q = supabaseAdmin.from("budgets").select("*").eq("enabled", true).eq("subject_type", f.subject_type);
    if (f.subject_id) q = q.eq("subject_id", f.subject_id);
    if (f.subject_role) q = q.eq("subject_role", f.subject_role);
    const { data } = await q.maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function checkBudget(ctx: Ctx, projectedCredits = 0): Promise<BudgetCheck> {
  const budget = await pickBudget(ctx);
  if (!budget) {
    return { ok: true, limitCredits: Infinity, usedCredits: 0, remainingCredits: Infinity, hardStop: false, alertTriggered: false };
  }
  const ps = periodStart(budget.period as "day" | "week" | "month");
  const supabaseAdmin = await admin();
  const { data: rows } = await supabaseAdmin
    .from("budget_events")
    .select("credits")
    .eq("budget_id", budget.id)
    .gte("period_start", ps);
  const used = (rows ?? []).reduce((s, r: any) => s + Number(r.credits ?? 0), 0);
  const limit = Number(budget.limit_credits);
  const projected = used + projectedCredits;
  const ok = budget.hard_stop ? projected <= limit : true;
  return {
    ok,
    budgetId: budget.id,
    limitCredits: limit,
    usedCredits: used,
    remainingCredits: Math.max(0, limit - used),
    hardStop: budget.hard_stop,
    alertTriggered: projected >= limit * Number(budget.alert_threshold ?? 0.8),
  };
}

export async function recordBudgetEvent(params: {
  ctx: Ctx;
  credits: number;
  source: string;
  requestId?: string;
}) {
  const budget = await pickBudget(params.ctx);
  if (!budget) return;
  const ps = periodStart(budget.period as "day" | "week" | "month");
  const supabaseAdmin = await admin();
  await supabaseAdmin.from("budget_events").insert({
    budget_id: budget.id,
    user_id: params.ctx.userId ?? null,
    credits: params.credits,
    source: params.source,
    request_id: params.requestId,
    period_start: ps,
  });
}
