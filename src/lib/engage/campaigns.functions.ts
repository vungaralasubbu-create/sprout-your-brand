/**
 * Campaign CRUD + send-now dispatch.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  brand_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  template_key: z.string().min(1),
  segment_id: z.string().uuid().optional().nullable(),
  channel: z.enum(["email", "push", "inapp"]).default("email"),
  schedule_type: z.enum(["immediate", "scheduled", "recurring", "best_time"]).default("immediate"),
  scheduled_at: z.string().optional().nullable(),
  timezone: z.string().optional().default("UTC"),
});

export const listEngageCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ brand_id: z.string().uuid().optional().nullable() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("engage_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (data.brand_id) query = query.eq("brand_id", data.brand_id);
    else query = query.eq("tenant_scope", "platform");
    const { data: rows, error } = await query.limit(500);
    if (error) return { ok: false as const, error: error.message, campaigns: [] };
    return { ok: true as const, campaigns: rows ?? [] };
  });

export const upsertEngageCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const tenant_scope = data.brand_id ? `brand:${data.brand_id}` : "platform";
    const payload = {
      tenant_scope,
      brand_id: data.brand_id ?? null,
      name: data.name,
      description: data.description ?? null,
      template_key: data.template_key,
      segment_id: data.segment_id ?? null,
      channel: data.channel,
      schedule_type: data.schedule_type,
      scheduled_at: data.scheduled_at ?? null,
      timezone: data.timezone ?? "UTC",
      status: data.schedule_type === "scheduled" ? "scheduled" : "draft",
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase.from("engage_campaigns").update(payload).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("engage_campaigns")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: row?.id };
  });

export const dispatchEngageCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    // Role guard: only admins/brand owners can send.
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: isSuper } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: campaign, error } = await supabaseAdmin
      .from("engage_campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !campaign) return { ok: false as const, error: error?.message ?? "Campaign not found" };

    if (campaign.brand_id) {
      const { data: pbp } = await supabaseAdmin
        .from("partner_brand_profiles")
        .select("user_id")
        .eq("id", campaign.brand_id)
        .maybeSingle();
      const ownedByCaller = pbp?.user_id === context.userId;
      if (!isAdmin && !isSuper && !ownedByCaller) {
        return { ok: false as const, error: "Not authorized to send this campaign." };
      }
    } else if (!isAdmin && !isSuper) {
      return { ok: false as const, error: "Only admins can send platform campaigns." };
    }

    // Resolve recipients from the linked segment, if any.
    let recipients: Array<{ user_id: string | null; email: string; first_name?: string | null }> = [];
    if (campaign.segment_id) {
      const { data: segRow } = await supabaseAdmin
        .from("engage_segments")
        .select("audience, rules")
        .eq("id", campaign.segment_id)
        .maybeSingle();
      if (segRow) {
        const { evaluateSegment } = await import("./segments.server");
        const evaluated = await evaluateSegment(
          segRow.audience as "students",
          segRow.rules as never,
          campaign.brand_id,
        );
        recipients = evaluated.recipients;
      }
    }

    await supabaseAdmin
      .from("engage_campaigns")
      .update({ status: "sending", total_recipients: recipients.length, sent_at: new Date().toISOString() })
      .eq("id", data.id);

    // Send in batches of 25.
    const { sendViaEngage } = await import("./send.server");
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < recipients.length; i += 25) {
      const batch = recipients.slice(i, i + 25);
      await Promise.all(
        batch.map(async (r) => {
          const res = await sendViaEngage({
            templateKey: campaign.template_key ?? "newsletter",
            recipient: r.email,
            userId: r.user_id,
            brandId: campaign.brand_id,
            campaignId: campaign.id,
            channel: campaign.channel as "email",
            category: "promotional",
            idempotencyKey: `campaign:${campaign.id}:${r.email}`,
            context: {
              recipient: r.email,
              first_name: r.first_name ?? "there",
              brand_name: "Glintr",
              app_url: process.env.APP_URL ?? "https://glintr.com",
            },
          });
          if (res.ok) sent++;
          else failed++;
        }),
      );
    }

    await supabaseAdmin
      .from("engage_campaigns")
      .update({ status: "sent", sent_count: sent })
      .eq("id", data.id);

    return { ok: true as const, sent, failed, total: recipients.length };
  });
