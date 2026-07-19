/**
 * Quota Manager
 * -------------
 * Enforces per-role/per-user usage quotas backed by `usage_quotas` +
 * `usage_counters`. Fixed-period windows (day/week/month) computed in UTC.
 *
 *   const q = await checkQuota({ userId, role, quotaKey: "ai_chat_requests" });
 *   if (!q.ok) throw new Error("Quota exceeded");
 *   ... call model ...
 *   await recordQuotaUsage({ userId, quotaKey: "ai_chat_requests", delta: 1 });
 */

import type { AppRole, QuotaCheck } from "./types";

function periodStart(period: "day" | "week" | "month"): string {
  const d = new Date();
  if (period === "day") {
    d.setUTCHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - day);
    d.setUTCHours(0, 0, 0, 0);
  } else {
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
  }
  return d.toISOString();
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

interface CheckInput {
  userId: string;
  role?: AppRole;
  quotaKey: string;
}

/** Resolve applicable quota: user-specific > organization > role-based. */
export async function resolveQuota(input: CheckInput): Promise<{
  limit: number;
  period: "day" | "week" | "month";
  hardStop: boolean;
} | null> {
  const supabaseAdmin = await admin();
  const { data: userQuota } = await supabaseAdmin
    .from("usage_quotas")
    .select("limit_value, period, hard_stop")
    .eq("scope", "user")
    .eq("subject_id", input.userId)
    .eq("quota_key", input.quotaKey)
    .maybeSingle();
  if (userQuota) return { limit: Number(userQuota.limit_value), period: userQuota.period as any, hardStop: userQuota.hard_stop };

  if (input.role) {
    const { data: roleQuota } = await supabaseAdmin
      .from("usage_quotas")
      .select("limit_value, period, hard_stop")
      .eq("scope", "role")
      .eq("subject_role", input.role)
      .eq("quota_key", input.quotaKey)
      .maybeSingle();
    if (roleQuota) return { limit: Number(roleQuota.limit_value), period: roleQuota.period as any, hardStop: roleQuota.hard_stop };
  }
  return null;
}

export async function checkQuota(input: CheckInput): Promise<QuotaCheck> {
  const q = await resolveQuota(input);
  if (!q) {
    return { ok: true, quotaKey: input.quotaKey, limit: Infinity, used: 0, remaining: Infinity, periodStart: periodStart("day"), hardStop: false };
  }
  const ps = periodStart(q.period);
  const supabaseAdmin = await admin();
  const { data: counter } = await supabaseAdmin
    .from("usage_counters")
    .select("used")
    .eq("user_id", input.userId)
    .eq("quota_key", input.quotaKey)
    .eq("period_start", ps)
    .maybeSingle();
  const used = Number(counter?.used ?? 0);
  const remaining = Math.max(0, q.limit - used);
  const ok = q.hardStop ? used < q.limit : true;
  return { ok, quotaKey: input.quotaKey, limit: q.limit, used, remaining, periodStart: ps, hardStop: q.hardStop };
}

export async function recordQuotaUsage(params: {
  userId: string;
  quotaKey: string;
  delta?: number;
  role?: AppRole;
}) {
  const q = await resolveQuota({ userId: params.userId, quotaKey: params.quotaKey, role: params.role });
  const period = q?.period ?? "day";
  const ps = periodStart(period);
  const delta = params.delta ?? 1;
  const supabaseAdmin = await admin();

  const { data: existing } = await supabaseAdmin
    .from("usage_counters")
    .select("id, used")
    .eq("user_id", params.userId)
    .eq("quota_key", params.quotaKey)
    .eq("period_start", ps)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("usage_counters")
      .update({ used: Number(existing.used) + delta, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("usage_counters").insert({
      user_id: params.userId,
      quota_key: params.quotaKey,
      period_start: ps,
      used: delta,
    });
  }
}
