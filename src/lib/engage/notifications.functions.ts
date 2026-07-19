/**
 * In-app notification center + web push subscription management.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listInAppNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      limit: z.number().min(1).max(200).default(50),
      include_archived: z.boolean().default(false),
    }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("engage_inapp_notifications")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (!data.include_archived) query = query.is("archived_at", null);
    const { data: rows, error } = await query;
    if (error) return { ok: false as const, error: error.message, notifications: [], unread: 0 };
    const unread = (rows ?? []).filter((r) => !r.read_at).length;
    return { ok: true as const, notifications: rows ?? [], unread };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("engage_inapp_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", data.ids)
      .eq("user_id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => (data ?? {}) as Record<string, never>)
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("engage_inapp_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const archiveNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("engage_inapp_notifications")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("engage_inapp_notifications")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const createInAppNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      title: z.string().min(1).max(200),
      body: z.string().max(2000).optional().nullable(),
      category: z.string().default("general"),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      action_url: z.string().url().optional().nullable(),
      action_label: z.string().max(80).optional().nullable(),
      brand_id: z.string().uuid().optional().nullable(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: isSuper } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    const isSelf = data.user_id === context.userId;
    if (!isAdmin && !isSuper && !isSelf) return { ok: false as const, error: "Not authorized." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("engage_inapp_notifications").insert({
      user_id: data.user_id,
      brand_id: data.brand_id ?? null,
      title: data.title,
      body: data.body ?? null,
      category: data.category,
      priority: data.priority,
      action_url: data.action_url ?? null,
      action_label: data.action_label ?? null,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const subscribeToPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      endpoint: z.string().url(),
      keys: z.object({ p256dh: z.string(), auth: z.string() }),
      user_agent: z.string().optional().nullable(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("engage_push_subscriptions")
      .upsert(
        {
          user_id: context.userId,
          endpoint: data.endpoint,
          keys: data.keys as never,
          user_agent: data.user_agent ?? null,
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" as never },
      );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const unsubscribeFromPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ endpoint: z.string().url() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("engage_push_subscriptions")
      .update({ is_active: false })
      .eq("endpoint", data.endpoint)
      .eq("user_id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
