import { createServerFn } from "@tanstack/react-start";
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
  status: string;
  created_at: string;
};

const SELECT_COLS =
  "id, category, notif_type, title, message, related_entity_type, related_entity_id, action_type, action_route, read_at, status, created_at";

export const listAmbassadorNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { onlyUnread?: boolean; limit?: number; offset?: number }) => ({
    onlyUnread: Boolean(input?.onlyUnread),
    limit: Math.min(Math.max(input?.limit ?? 20, 1), 50),
    offset: Math.max(input?.offset ?? 0, 0),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("ambassador_notifications")
      .select(SELECT_COLS, { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.onlyUnread) q = q.is("read_at", null);
    const { data: rows, count, error } = await q;
    if (error) throw error;
    return {
      items: (rows ?? []) as AmbassadorNotification[],
      total: count ?? 0,
    };
  });

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

export const markAmbassadorNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id || typeof input.id !== "string") throw new Error("id required");
    return { id: input.id };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ambassador_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId)
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

// Safe route resolution — never trust raw stored URLs
const CATEGORY_ROUTES: Record<string, string> = {
  referral: "/ambassador/referrals",
  enrollment: "/ambassador/enrollments",
  payment_verification: "/ambassador/enrollments",
  commission: "/ambassador/earnings",
  earnings: "/ambassador/earnings",
  payout: "/ambassador/payouts",
  campaign: "/ambassador/leaderboard?tab=campaigns",
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
  // Only allow internal ambassador routes
  if (n.action_route && n.action_route.startsWith("/ambassador/")) return n.action_route;
  return CATEGORY_ROUTES[n.category] ?? "/ambassador/dashboard";
}
