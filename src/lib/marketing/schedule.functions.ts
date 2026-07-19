/**
 * Marketing Scheduler
 * -------------------
 * Turns approved content + schedule rules into queued mkt_posts rows.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MKT_CHANNELS } from "./types";

const ScheduleInput = z.object({
  contentId: z.string().uuid(),
  channels: z.array(z.enum(MKT_CHANNELS)).min(1),
  mode: z.enum(["immediate","once","daily","weekly","monthly","cron","campaign"]).default("immediate"),
  runAt: z.string().datetime().optional(),
  cron: z.string().optional(),
  timezone: z.string().default("Asia/Kolkata"),
});

/**
 * scheduleContent — enqueues posts and (for recurring modes) records the schedule.
 */
export const scheduleContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ScheduleInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: content, error: cErr } = await supabase
      .from("mkt_content_items")
      .select("id, brand_id, campaign_id, status, approval_mode")
      .eq("id", data.contentId).maybeSingle();
    if (cErr || !content) throw new Error("Content not found");
    if (content.status !== "approved" && content.approval_mode !== "auto") {
      throw new Error("Content must be approved before scheduling");
    }

    const { data: variants } = await supabase
      .from("mkt_content_variants")
      .select("id, channel_kind")
      .eq("content_id", data.contentId);
    const variantByChannel = new Map((variants ?? []).map((v) => [v.channel_kind, v.id]));

    const { data: brandChannels } = await supabase
      .from("mkt_channels").select("id, kind, enabled, auto_publish")
      .eq("brand_id", content.brand_id).eq("enabled", true);
    const channelByKind = new Map((brandChannels ?? []).map((c) => [c.kind, c]));

    const dueAt = data.mode === "immediate" ? new Date().toISOString()
      : (data.runAt ?? new Date(Date.now() + 60_000).toISOString());

    const rows = data.channels.map((k) => ({
      brand_id: content.brand_id,
      campaign_id: content.campaign_id,
      content_id: content.id,
      variant_id: variantByChannel.get(k) ?? null,
      channel_id: channelByKind.get(k)?.id ?? null,
      channel_kind: k,
      status: "scheduled" as const,
      due_at: dueAt,
      meta: { mode: data.mode, timezone: data.timezone },
    }));

    const { data: posts, error: pErr } = await supabase.from("mkt_posts").insert(rows).select("id, channel_kind, due_at");
    if (pErr) throw new Error(pErr.message);

    if (data.mode !== "immediate" && data.mode !== "once") {
      await supabase.from("mkt_schedules").insert({
        brand_id: content.brand_id,
        campaign_id: content.campaign_id,
        content_id: content.id,
        mode: data.mode,
        run_at: data.runAt ?? null,
        cron: data.cron ?? null,
        timezone: data.timezone,
        channels: data.channels,
        next_run_at: dueAt,
      });
    }

    await supabase.from("mkt_content_items").update({ status: "scheduled" }).eq("id", content.id);
    return { queued: posts?.length ?? 0, posts };
  });

const ApproveInput = z.object({
  contentId: z.string().uuid(),
  decision: z.enum(["approved","rejected"]),
  note: z.string().optional(),
});

export const decideApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ApproveInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("mkt_approvals").insert({
      content_id: data.contentId, reviewer_id: userId,
      decision: data.decision, note: data.note ?? null, decided_at: new Date().toISOString(),
    });
    await supabase.from("mkt_content_items")
      .update({ status: data.decision === "approved" ? "approved" : "rejected" })
      .eq("id", data.contentId);
    return { ok: true };
  });
