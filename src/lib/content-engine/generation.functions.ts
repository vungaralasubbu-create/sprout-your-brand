/**
 * AI Content Engine — Generation service.
 *
 * Uses the centralized AI Router (`executeChat`) via the shared failover
 * layer, resolves the active prompt version from the Prompt Registry,
 * persists each output as a `ce_generations` row, and supports:
 *   - single-asset generation
 *   - full-campaign multi-asset generation
 *   - manual edit of a generation before publish
 *   - regeneration (chains via parent_generation_id, preserving history)
 *   - approval / scheduling / publishing lifecycle
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ASSET_TYPES,
  ASSET_TYPE_SPECS,
  GENERATION_STATUSES,
  type AssetType,
  type CampaignContext,
  renderTemplate,
} from "./types";
import { resolveActivePrompt } from "./prompt-registry.functions";

async function runAsset(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  campaignId: string,
  campaign: CampaignContext,
  assetType: AssetType,
  parentGenerationId?: string | null,
) {
  const spec = ASSET_TYPE_SPECS[assetType];
  const prompt = await resolveActivePrompt(supabase, assetType);
  const rendered = renderTemplate(prompt.template, {
    title: campaign.title,
    description: campaign.description ?? "",
    goal: campaign.goal ?? "brand awareness",
    audience: campaign.audience ?? "general audience",
    tone: campaign.tone ?? "professional",
    language: campaign.language ?? "en",
    brandName: campaign.brandName ?? "Glintr",
    platforms: (campaign.platforms ?? []).join(", "),
  });

  const { executeChat } = await import("@/lib/ai/router/failover.server");
  const res = await executeChat(
    { kind: "chat", quality: prompt.modelPreference.quality ?? spec.quality },
    {
      messages: [{ role: "user", content: rendered }],
      maxTokens: spec.maxTokens,
      temperature: 0.7,
    },
  );

  const content = res.ok && res.result ? res.result.content ?? "" : "";
  const status = res.ok ? "draft" : "draft";
  const usage = res.result?.usage ?? {};

  const { data: gen, error } = await supabase
    .from("ce_generations")
    .insert({
      campaign_id: campaignId,
      owner_id: userId,
      asset_type: assetType,
      content,
      status,
      prompt_version_id: prompt.promptVersionId,
      model_used: res.chosen?.model ?? null,
      provider: res.chosen?.provider ?? null,
      parent_generation_id: parentGenerationId ?? null,
      usage,
      meta: { error: res.ok ? null : res.error ?? "unknown" },
    })
    .select()
    .single();
  if (error) throw error;
  return gen;
}

async function loadCampaign(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  campaignId: string,
): Promise<CampaignContext & { id: string; owner_id: string }> {
  const { data: c, error } = await supabase
    .from("ce_campaigns")
    .select("id, owner_id, title, description, goal, audience, platforms, language, tone, brand_id")
    .eq("id", campaignId)
    .single();
  if (error) throw error;
  let brandName: string | null = null;
  if (c.brand_id) {
    const { data: b } = await supabase.from("mkt_brands").select("name").eq("id", c.brand_id).maybeSingle();
    brandName = b?.name ?? null;
  }
  return { ...c, brandName };
}

/** Generate ONE asset for a campaign. */
export const generateAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      campaignId: z.string().uuid(),
      assetType: z.enum(ASSET_TYPES),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const campaign = await loadCampaign(context.supabase, data.campaignId);
    const gen = await runAsset(context.supabase, context.userId, campaign.id, campaign, data.assetType);
    return { generation: gen };
  });

/** Generate ALL 13 asset types for a campaign. */
export const generateCampaignAll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      campaignId: z.string().uuid(),
      assetTypes: z.array(z.enum(ASSET_TYPES)).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const campaign = await loadCampaign(context.supabase, data.campaignId);
    const types = data.assetTypes ?? [...ASSET_TYPES];
    const generations: Array<Record<string, unknown>> = [];
    for (const t of types) {
      try {
        const g = await runAsset(context.supabase, context.userId, campaign.id, campaign, t);
        generations.push(g);
      } catch (e) {
        generations.push({ asset_type: t, error: (e as Error).message });
      }
    }
    return { generations };
  });

/** Regenerate an existing asset. Chains new row with parent_generation_id. */
export const regenerateAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ generationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: parent, error } = await context.supabase
      .from("ce_generations")
      .select("id, campaign_id, asset_type")
      .eq("id", data.generationId)
      .single();
    if (error) throw error;
    const campaign = await loadCampaign(context.supabase, parent.campaign_id);
    const gen = await runAsset(
      context.supabase,
      context.userId,
      parent.campaign_id,
      campaign,
      parent.asset_type as AssetType,
      parent.id,
    );
    return { generation: gen };
  });

/** Manual edit — sets edited=true, status='edited' unless caller specifies. */
export const editGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      content: z.string(),
      status: z.enum(GENERATION_STATUSES).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {
      content: data.content,
      edited: true,
    };
    if (data.status) patch.status = data.status;
    else patch.status = "edited";
    const { data: updated, error } = await context.supabase
      .from("ce_generations")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return { generation: updated };
  });

export const setGenerationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(GENERATION_STATUSES),
      scheduledAt: z.string().datetime().optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "published") patch.published_at = new Date().toISOString();
    if (data.status === "scheduled") patch.scheduled_at = data.scheduledAt ?? null;
    const { data: updated, error } = await context.supabase
      .from("ce_generations")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return { generation: updated };
  });

export const listCampaignGenerations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ campaignId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("ce_generations")
      .select("id, asset_type, content, status, model_used, provider, edited, parent_generation_id, scheduled_at, published_at, created_at, updated_at")
      .eq("campaign_id", data.campaignId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { generations: rows ?? [] };
  });

/** Full version history for one asset (self + ancestors via parent chain). */
export const getGenerationHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const history: Array<Record<string, unknown>> = [];
    let cursor: string | null = data.id;
    // Walk ancestors
    while (cursor) {
      const { data: row, error } = await context.supabase
        .from("ce_generations")
        .select("id, content, status, model_used, provider, edited, parent_generation_id, created_at")
        .eq("id", cursor)
        .maybeSingle();
      if (error) throw error;
      if (!row) break;
      history.push(row);
      cursor = (row.parent_generation_id as string | null) ?? null;
      if (history.length > 50) break;
    }
    return { history };
  });
