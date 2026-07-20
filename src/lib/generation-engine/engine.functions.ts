/**
 * Public server functions for the Generation Engine.
 * Every module inside Glintr calls submitGeneration through this file.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { submitGeneration as submitGenerationInternal } from "./engine.server";
import type { GenerationRequest } from "./types";

const ContentTypeSchema = z.enum([
  "text","image","video","voice","presentation","document","pdf",
  "landing_page","advertisement","banner","logo","illustration","certificate",
]);

const RequestSchema = z.object({
  contentType: ContentTypeSchema,
  prompt: z.string().min(2),
  negativePrompt: z.string().optional(),
  mode: z.enum(["single","bulk","campaign","scheduled","workflow","api"]).optional(),
  workspaceId: z.string().uuid().nullish(),
  brandId: z.string().uuid().nullish(),
  campaignId: z.string().uuid().nullish(),
  approvalRequired: z.boolean().optional(),
  saveToMediaLibrary: z.boolean().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  platform: z.string().optional(),
  aspectRatio: z.string().optional(),
  durationSeconds: z.number().optional(),
  resolution: z.string().optional(),
  voice: z.string().optional(),
  quality: z.enum(["fast","balanced","premium"]).optional(),
  creativity: z.number().min(0).max(2).optional(),
  requestedProvider: z.string().optional(),
  requestedModel: z.string().optional(),
  bulkCount: z.number().int().min(1).max(500).optional(),
  scheduledAt: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const submitGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => RequestSchema.parse(v))
  .handler(async ({ data, context }) => {
    return submitGenerationInternal(context.supabase, context.userId, data as GenerationRequest);
  });

export const listGenerationJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    contentType: ContentTypeSchema.optional(),
    status: z.string().optional(),
    limit: z.number().int().min(1).max(200).default(50),
  }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("generation_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.contentType) q = q.eq("content_type", data.contentType);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { jobs: rows ?? [] };
  });

export const getGenerationJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const [job, outputs, logs, usage] = await Promise.all([
      context.supabase.from("generation_jobs").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("generation_outputs").select("*").eq("job_id", data.id).order("created_at", { ascending: true }),
      context.supabase.from("generation_logs").select("*").eq("job_id", data.id).order("created_at", { ascending: true }),
      context.supabase.from("generation_usage").select("*").eq("job_id", data.id),
    ]);
    if (job.error) throw new Error(job.error.message);
    return { job: job.data, outputs: outputs.data ?? [], logs: logs.data ?? [], usage: usage.data ?? [] };
  });

export const cancelGenerationJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("generation_jobs")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", data.id)
      .in("status", ["queued", "preparing", "generating", "retrying"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const retryGenerationJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: orig, error } = await context.supabase.from("generation_jobs").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!orig) throw new Error("Job not found");
    return submitGenerationInternal(context.supabase, context.userId, {
      contentType: orig.content_type,
      prompt: orig.prompt ?? "",
      negativePrompt: orig.negative_prompt ?? undefined,
      mode: orig.mode,
      brandId: orig.brand_id,
      campaignId: orig.campaign_id,
      language: orig.language ?? undefined,
      country: orig.country ?? undefined,
      platform: orig.platform ?? undefined,
      aspectRatio: orig.aspect_ratio ?? undefined,
      durationSeconds: orig.duration_seconds ?? undefined,
      resolution: orig.resolution ?? undefined,
      voice: orig.voice ?? undefined,
      quality: orig.quality ?? "balanced",
      requestedProvider: orig.requested_provider ?? undefined,
      requestedModel: orig.requested_model ?? undefined,
    } as GenerationRequest);
  });

export const listGenerationProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("generation_providers")
      .select("*")
      .order("category", { ascending: true })
      .order("priority", { ascending: true });
    if (error) throw new Error(error.message);
    return { providers: data ?? [] };
  });

export const getGenerationUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    since: z.string().optional(),
  }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    const since = data.since ?? new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const [usage, jobs] = await Promise.all([
      context.supabase.from("generation_usage").select("provider, credits_used, estimated_cost_cents, latency_ms, created_at").gte("created_at", since),
      context.supabase.from("generation_jobs").select("status, content_type, chosen_provider, created_at").gte("created_at", since),
    ]);
    return { usage: usage.data ?? [], jobs: jobs.data ?? [] };
  });
