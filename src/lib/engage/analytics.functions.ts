/**
 * Analytics for the Admin/Brand Engage dashboards. Aggregates engage_messages
 * events over a rolling window.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getEngageAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      brand_id: z.string().uuid().optional().nullable(),
      days: z.number().min(1).max(365).default(30),
    }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();
    let query = context.supabase
      .from("engage_messages")
      .select("status, opened_at, clicked_at, bounced_at, unsubscribed_at, queued_at, campaign_id")
      .gte("queued_at", since);
    if (data.brand_id) query = query.eq("brand_id", data.brand_id);
    else query = query.eq("tenant_scope", "platform");
    const { data: rows, error } = await query.limit(50000);
    if (error) return { ok: false as const, error: error.message };

    const total = rows?.length ?? 0;
    const sent = (rows ?? []).filter((r) => ["sent", "delivered", "opened", "clicked"].includes(r.status ?? "")).length;
    const delivered = (rows ?? []).filter((r) => ["delivered", "opened", "clicked"].includes(r.status ?? "")).length;
    const opened = (rows ?? []).filter((r) => r.opened_at).length;
    const clicked = (rows ?? []).filter((r) => r.clicked_at).length;
    const bounced = (rows ?? []).filter((r) => r.bounced_at).length;
    const unsub = (rows ?? []).filter((r) => r.unsubscribed_at).length;

    return {
      ok: true as const,
      window_days: data.days,
      metrics: {
        total,
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed: unsub,
        open_rate: sent ? Math.round((opened / sent) * 1000) / 10 : 0,
        click_rate: sent ? Math.round((clicked / sent) * 1000) / 10 : 0,
        bounce_rate: sent ? Math.round((bounced / sent) * 1000) / 10 : 0,
      },
    };
  });
