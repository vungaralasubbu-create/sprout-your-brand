/**
 * AI Content Engine — Campaign CRUD.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CAMPAIGN_STATUSES } from "./types";

const CampaignInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional().nullable(),
  goal: z.string().max(500).optional().nullable(),
  audience: z.string().max(500).optional().nullable(),
  platforms: z.array(z.string()).default([]),
  status: z.enum(CAMPAIGN_STATUSES).default("draft"),
  scheduledAt: z.string().datetime().optional().nullable(),
  language: z.string().min(2).max(10).default("en"),
  tone: z.string().max(60).optional().nullable(),
  brandId: z.string().uuid().optional().nullable(),
  meta: z.record(z.any()).default({}),
});

export const upsertCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CampaignInput.parse(input))
  .handler(async ({ data, context }) => {
    const row = {
      owner_id: context.userId,
      title: data.title,
      description: data.description ?? null,
      goal: data.goal ?? null,
      audience: data.audience ?? null,
      platforms: data.platforms,
      status: data.status,
      scheduled_at: data.scheduledAt ?? null,
      language: data.language,
      tone: data.tone ?? null,
      brand_id: data.brandId ?? null,
      meta: data.meta,
    };
    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("ce_campaigns")
        .update(row)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return { campaign: updated };
    }
    const { data: created, error } = await context.supabase
      .from("ce_campaigns")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return { campaign: created };
  });

export const getCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: campaign, error } = await context.supabase
      .from("ce_campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return { campaign };
  });

const ListInput = z.object({
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const listCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListInput.parse(input))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("ce_campaigns")
      .select("id, title, description, goal, platforms, status, scheduled_at, language, tone, updated_at", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    const { data: rows, error, count } = await q;
    if (error) throw error;
    return { campaigns: rows ?? [], total: count ?? 0 };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ce_campaigns").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const setCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), status: z.enum(CAMPAIGN_STATUSES) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ce_campaigns")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Dashboard aggregates: counts by status + recent items. */
export const campaignDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const buckets: Record<string, number> = {};
    for (const s of CAMPAIGN_STATUSES) {
      const { count } = await context.supabase
        .from("ce_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", s);
      buckets[s] = count ?? 0;
    }
    const { data: recent } = await context.supabase
      .from("ce_campaigns")
      .select("id, title, status, updated_at, platforms")
      .order("updated_at", { ascending: false })
      .limit(10);
    const { data: scheduled } = await context.supabase
      .from("ce_campaigns")
      .select("id, title, scheduled_at, platforms")
      .eq("status", "scheduled")
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: true })
      .limit(10);
    const { count: totalGenerations } = await context.supabase
      .from("ce_generations")
      .select("id", { count: "exact", head: true });
    const { count: publishedGenerations } = await context.supabase
      .from("ce_generations")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    return {
      counts: buckets,
      recent: recent ?? [],
      scheduled: scheduled ?? [],
      analytics: {
        totalGenerations: totalGenerations ?? 0,
        publishedGenerations: publishedGenerations ?? 0,
      },
    };
  });
