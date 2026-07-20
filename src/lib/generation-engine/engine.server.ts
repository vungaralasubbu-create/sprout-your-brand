/**
 * Enterprise AI Generation Engine — central gateway.
 *
 *   Marketing OS → Generation Engine → AI Router → Provider Adapter → Provider
 *
 * Every AI generation request anywhere inside Glintr must pass through
 * `submitGeneration`. Providers are selected via the registry; no module
 * imports a provider directly.
 *
 * Pipeline: validate → brand ctx → campaign ctx → user ctx →
 *           provider selection → AI Router → generation → storage →
 *           media library → approval queue
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EngineContext,
  GenerationJobRecord,
  GenerationOutput,
  GenerationRequest,
} from "./types";
import { planProviderChain } from "./providers/registry.server";
import { buildEngineContext } from "./pipeline/context.server";
import { persistOutput } from "./pipeline/storage.server";

async function logEvent(
  supabase: SupabaseClient,
  jobId: string,
  userId: string,
  event: string,
  extra: { provider?: string; model?: string; latency_ms?: number; level?: "info" | "warn" | "error"; message?: string; data?: unknown } = {},
) {
  await supabase.from("generation_logs").insert({
    job_id: jobId,
    owner_id: userId,
    event,
    provider: extra.provider,
    model: extra.model,
    latency_ms: extra.latency_ms,
    level: extra.level ?? "info",
    message: extra.message,
    data: extra.data as never,
  });
}

/**
 * Submit a generation request. Runs the full pipeline synchronously for
 * text/image; video/voice can be extended to async queue mode later.
 */
export async function submitGeneration(
  supabase: SupabaseClient,
  userId: string,
  req: GenerationRequest,
): Promise<GenerationJobRecord> {
  // 1. Create job row
  const { data: jobRow, error: jobErr } = await supabase
    .from("generation_jobs")
    .insert({
      owner_id: userId,
      workspace_id: req.workspaceId ?? null,
      brand_id: req.brandId ?? null,
      campaign_id: req.campaignId ?? null,
      content_type: req.contentType,
      mode: req.mode ?? "single",
      prompt: req.prompt,
      negative_prompt: req.negativePrompt,
      language: req.language,
      country: req.country,
      platform: req.platform,
      aspect_ratio: req.aspectRatio,
      duration_seconds: req.durationSeconds,
      resolution: req.resolution,
      voice: req.voice,
      quality: req.quality ?? "balanced",
      creativity: req.creativity,
      requested_provider: req.requestedProvider,
      requested_model: req.requestedModel,
      scheduled_at: req.scheduledAt ?? null,
      status: "preparing",
      metadata: (req.metadata ?? {}) as never,
    })
    .select("id")
    .single();
  if (jobErr || !jobRow) throw new Error(jobErr?.message ?? "Failed to create job");
  const jobId = jobRow.id as string;

  const finalize = async (patch: Record<string, unknown>) => {
    await supabase.from("generation_jobs").update(patch).eq("id", jobId);
  };

  try {
    // 2. Build context (brand + campaign)
    const { brandSystemPrompt, campaignSummary } = await buildEngineContext(supabase, userId, req.campaignId);
    await logEvent(supabase, jobId, userId, "context_built");

    // 3. Plan provider chain
    const chain = planProviderChain(req.contentType, req.requestedProvider);
    if (chain.length === 0) throw new Error(`No provider available for ${req.contentType}`);

    // 4. Try each provider with failover
    let outputs: GenerationOutput[] = [];
    let chosenKey: string | undefined;
    let lastError: Error | undefined;

    const ctx: EngineContext = { jobId, userId, brandSystemPrompt, campaignSummary, supabase };

    await finalize({ status: "generating", started_at: new Date().toISOString(), brand_context: brandSystemPrompt ? { present: true } : null });
    await logEvent(supabase, jobId, userId, "routed", { data: { chain: chain.map((p) => p.key) } });

    for (const provider of chain) {
      const validation = provider.validate(req);
      if (!validation.ok) {
        await logEvent(supabase, jobId, userId, "validated", { level: "warn", provider: provider.key, message: validation.message });
        continue;
      }
      const t0 = Date.now();
      try {
        outputs = await provider.generate(req, ctx);
        const latency = Date.now() - t0;
        chosenKey = provider.key;
        await logEvent(supabase, jobId, userId, "generated", { provider: provider.key, latency_ms: latency });
        await supabase.from("generation_usage").insert({
          job_id: jobId,
          owner_id: userId,
          provider: provider.key,
          model: req.requestedModel ?? provider.key,
          credits_used: provider.estimateCost(req).credits,
          estimated_cost_cents: provider.estimateCost(req).cents,
          actual_cost_cents: provider.estimateCost(req).cents,
          latency_ms: latency,
          units: outputs.length,
        });
        break;
      } catch (err) {
        const latency = Date.now() - t0;
        lastError = err instanceof Error ? err : new Error(String(err));
        await logEvent(supabase, jobId, userId, "failed", { provider: provider.key, latency_ms: latency, level: "error", message: lastError.message });
      }
    }

    if (!chosenKey || outputs.length === 0) {
      await finalize({ status: "failed", completed_at: new Date().toISOString(), error_message: lastError?.message ?? "All providers failed" });
      return { id: jobId, status: "failed", outputs: [], error: { code: "all_failed", message: lastError?.message ?? "All providers failed" } };
    }

    // 5. Persist outputs (to media_assets when relevant)
    const persisted: GenerationOutput[] = [];
    for (const out of outputs) {
      const stored = await persistOutput(
        supabase, userId, jobId,
        req.brandId ?? null, req.campaignId ?? null,
        out, req.prompt, chosenKey,
        req.saveToMediaLibrary ?? true,
      );
      persisted.push(stored);
    }
    await logEvent(supabase, jobId, userId, "stored");

    // 6. Optional approval queue enqueue
    if (req.approvalRequired) {
      await supabase.from("approval_queue").insert({
        owner_id: userId,
        campaign_id: req.campaignId,
        brand_id: req.brandId,
        content_type: req.contentType,
        prompt: req.prompt,
        status: "pending",
        source: "generation-engine",
        metadata: { jobId } as never,
      }).select().maybeSingle().then(() => void 0).catch(() => void 0);
      await logEvent(supabase, jobId, userId, "approved", { message: "queued for review" });
    }

    await finalize({
      status: "completed",
      completed_at: new Date().toISOString(),
      chosen_provider: chosenKey,
      chosen_model: req.requestedModel ?? chosenKey,
      progress: 100,
    });

    return { id: jobId, status: "completed", outputs: persisted, chosenProvider: chosenKey, chosenModel: req.requestedModel ?? chosenKey };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finalize({ status: "failed", completed_at: new Date().toISOString(), error_message: message });
    await logEvent(supabase, jobId, userId, "failed", { level: "error", message });
    return { id: jobId, status: "failed", outputs: [], error: { code: "engine_error", message } };
  }
}
