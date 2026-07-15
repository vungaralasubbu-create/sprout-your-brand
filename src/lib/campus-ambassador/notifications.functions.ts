import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AmbassadorNotification = {
  id: string;
  category: string;
  notif_type: string;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  action_type: string | null;
  action_route: string | null;
  read_at: string | null;
  archived_at: string | null;
  status: string;
  created_at: string;
};

const SELECT_COLS =
  "id, category, notif_type, title, message, related_entity_type, related_entity_id, action_type, action_route, read_at, archived_at, status, created_at";

export const NOTIFICATION_CATEGORIES = [
  "referral",
  "enrollment",
  "payment_verification",
  "commission",
  "earnings",
  "payout",
  "campaign",
  "milestone",
  "badge",
  "level",
  "leaderboard",
  "recognition",
  "marketing_resources",
  "account",
  "system",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

async function loadAmbassadorId(context: any): Promise<string | null> {
  const { supabase, userId } = context;
  const { data } = await supabase
    .from("campus_ambassador_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

// ============================================================
// LIST
// ============================================================
export const listAmbassadorNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        filter: z.enum(["all", "unread", "read", "archived"]).optional(),
        category: z.string().max(40).optional().nullable(),
        limit: z.number().int().min(1).max(50).optional(),
        offset: z.number().int().min(0).optional(),
        // legacy
        onlyUnread: z.boolean().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const filter = data.filter ?? (data.onlyUnread ? "unread" : "all");
    const limit = data.limit ?? 20;
    const offset = data.offset ?? 0;

    let q = supabase
      .from("ambassador_notifications")
      .select(SELECT_COLS, { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === "archived") {
      q = q.eq("status", "archived");
    } else {
      q = q.eq("status", "active");
      if (filter === "unread") q = q.is("read_at", null);
      if (filter === "read") q = q.not("read_at", "is", null);
    }
    if (data.category && (NOTIFICATION_CATEGORIES as readonly string[]).includes(data.category)) {
      q = q.eq("category", data.category);
    }

    const { data: rows, count, error } = await q;
    if (error) throw error;
    return {
      items: (rows ?? []) as AmbassadorNotification[],
      total: count ?? 0,
    };
  });

// ============================================================
// UNREAD COUNT  (active + unread only — never archived)
// ============================================================
export const getAmbassadorUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { count, error } = await supabase
      .from("ambassador_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active")
      .is("read_at", null);
    if (error) throw error;
    return { unread: count ?? 0 };
  });

// ============================================================
// MARK READ / MARK ALL READ
// ============================================================
export const markAmbassadorNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ambassador_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId)
      .eq("status", "active")
      .is("read_at", null);
    if (error) throw error;
    return { ok: true };
  });

export const markAllAmbassadorNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ambassador_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "active")
      .is("read_at", null);
    if (error) throw error;
    return { ok: true };
  });

// ============================================================
// ARCHIVE / RESTORE
// ============================================================
export const archiveAmbassadorNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ambassador_notifications")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId)
      .eq("status", "active");
    if (error) throw error;
    return { ok: true };
  });

export const restoreAmbassadorNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ambassador_notifications")
      .update({ status: "active", archived_at: null })
      .eq("id", data.id)
      .eq("user_id", userId)
      .eq("status", "archived");
    if (error) throw error;
    return { ok: true };
  });

export const archiveReadAmbassadorNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error, count } = await supabase
      .from("ambassador_notifications")
      .update(
        { status: "archived", archived_at: new Date().toISOString() },
        { count: "exact" },
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .not("read_at", "is", null);
    if (error) throw error;
    return { archived: count ?? 0 };
  });

// ============================================================
// PREFERENCES + CATEGORIES CONFIG
// ============================================================
export type NotificationCategoryConfig = {
  category_key: string;
  label: string;
  description: string | null;
  is_optional: boolean;
  in_app_default: boolean;
  pref_column: string | null;
  display_order: number;
};

export const getNotificationCategoriesAndPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const ambassadorId = await loadAmbassadorId(context);
    if (!ambassadorId) return { gate: "no_profile" as const };

    const [{ data: cats, error: e1 }, { data: prefs, error: e2 }] = await Promise.all([
      supabase
        .from("ambassador_notification_categories")
        .select("category_key,label,description,is_optional,in_app_default,pref_column,display_order")
        .order("display_order", { ascending: true }),
      supabase
        .from("ambassador_notification_preferences")
        .select("*")
        .eq("ambassador_id", ambassadorId)
        .maybeSingle(),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const p: Record<string, any> = prefs ?? {};
    const items = (cats ?? []).map((c: NotificationCategoryConfig) => {
      let enabled: boolean;
      if (!c.is_optional || !c.pref_column) {
        enabled = true;
      } else if (prefs && c.pref_column in p) {
        enabled = Boolean(p[c.pref_column]);
      } else {
        enabled = c.in_app_default;
      }
      return { ...c, enabled, mandatory: !c.is_optional };
    });
    return {
      gate: "ok" as const,
      items,
      channelInApp: prefs?.channel_in_app ?? true,
    };
  });

const PREF_COLUMN_WHITELIST = new Set([
  "referral_updates",
  "enrollment_updates",
  "commission_updates",
  "payout_updates",
  "campaign_updates",
  "marketing_updates",
  "level_badge_updates",
  "earnings_updates",
  "milestone_updates",
  "badge_updates",
  "level_updates",
  "leaderboard_updates",
  "recognition_updates",
  "channel_in_app",
]);

export const updateNotificationCategoryPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        category_key: z.string().min(1).max(40),
        enabled: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const ambassadorId = await loadAmbassadorId(context);
    if (!ambassadorId) return { gate: "no_profile" as const };

    // Resolve category → pref column via config; enforce mandatory rule server-side
    const { data: cat, error: eCat } = await supabase
      .from("ambassador_notification_categories")
      .select("category_key,is_optional,pref_column,in_app_default")
      .eq("category_key", data.category_key)
      .maybeSingle();
    if (eCat) throw eCat;
    if (!cat) return { gate: "unknown_category" as const };
    if (!cat.is_optional || !cat.pref_column) {
      return { gate: "mandatory" as const };
    }
    if (!PREF_COLUMN_WHITELIST.has(cat.pref_column)) {
      return { gate: "invalid_pref" as const };
    }

    const patch: Record<string, any> = {
      ambassador_id: ambassadorId,
      [cat.pref_column]: data.enabled,
    };
    const { error } = await supabase
      .from("ambassador_notification_preferences")
      .upsert(patch, { onConflict: "ambassador_id" });
    if (error) return { gate: "error" as const, message: error.message };
    return { gate: "ok" as const };
  });

// ============================================================
// SAFE ROUTE RESOLUTION
// ============================================================
const CATEGORY_ROUTES: Record<string, string> = {
  referral: "/ambassador/referrals",
  enrollment: "/ambassador/enrollments",
  payment_verification: "/ambassador/enrollments",
  commission: "/ambassador/earnings",
  earnings: "/ambassador/earnings",
  payout: "/ambassador/payouts",
  campaign: "/ambassador/leaderboard",
  milestone: "/ambassador/dashboard",
  badge: "/ambassador/profile",
  level: "/ambassador/profile",
  leaderboard: "/ambassador/leaderboard",
  recognition: "/ambassador/recognition",
  marketing_resources: "/ambassador/marketing-resources",
  account: "/ambassador/settings",
  system: "/ambassador/dashboard",
};

export function resolveNotificationRoute(n: AmbassadorNotification): string {
  // Only allow internal ambassador routes stored on the record
  if (n.action_route && n.action_route.startsWith("/ambassador/")) return n.action_route;
  return CATEGORY_ROUTES[n.category] ?? "/ambassador/dashboard";
}
