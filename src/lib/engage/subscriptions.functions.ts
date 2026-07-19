/**
 * Preference-center subscriptions. Signed-in users manage from /notifications;
 * unsubscribe links use a token-based public page.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { NOTIFICATION_CATEGORIES } from "./constants";

export const listMySubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => (data ?? {}) as Record<string, never>)
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("engage_subscriptions")
      .select("category, channel, is_subscribed")
      .eq("user_id", context.userId);
    if (error) return { ok: false as const, error: error.message, categories: NOTIFICATION_CATEGORIES, subs: [] };
    return { ok: true as const, categories: NOTIFICATION_CATEGORIES, subs: data ?? [] };
  });

export const setMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      category: z.string(),
      channel: z.enum(["email", "push", "inapp"]).default("email"),
      is_subscribed: z.boolean(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    // Get user's email for insertions that need it.
    const { data: profile } = await context.supabase
      .from("student_profiles")
      .select("email")
      .eq("user_id", context.userId)
      .maybeSingle();
    const email = profile?.email ?? null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("engage_subscriptions").upsert(
      {
        user_id: context.userId,
        email,
        category: data.category,
        channel: data.channel,
        is_subscribed: data.is_subscribed,
      },
      { onConflict: "user_id,category,channel" as never },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
