/**
 * Video Studio — TanStack Start server functions.
 *
 * These are the app-internal RPC endpoints for the AI Video Studio.
 * No UI files are modified. All AI content is generated via the centralized
 * AI Router (aiChat) and provider adapters registered in ./providers.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

import {
  buildSubtitles,
  generateBrief,
  generateStoryboard,
  suggest,
} from "./content";
import { getAdapter } from "./providers";
import type { GenerateVideoInput, VideoFormat, Storyboard } from "./types";
import { FORMAT_SPECS } from "./types";

// ----- Any-cast helpers for tables not yet in the generated types ---------
type Sb = { from: (t: string) => any };
const sb = (s: unknown) => s as Sb;

const VideoFormatEnum = z.enum([
  "instagram_reel","youtube_short","tiktok","linkedin_video","facebook_video",
  "course_promo","webinar_promo","workshop_promo","internship_promo","hiring",
  "explainer","product_demo","feature_announcement","success_story","testimonial",
  "corporate","avatar","slideshow","educational","animated_presentation",
]);

// ============================================================
// Project CRUD
// ============================================================

const CreateProjectInput = z.object({
  title: z.string().min(1),
  format: VideoFormatEnum,
  topic: z.string().min(1),
  goal: z.string().optional(),
  audience: z.string().optional(),
  durationSeconds: z.number().int().positive().max(600).optional(),
  language: z.string().optional(),
  brandKitId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  style: z.string().optional(),
  platform: z.string().optional(),
  cta: z.string().optional(),
  script: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  logoUrl: z.string().url().optional(),
  voiceId: z.string().optional(),
  sourceType: z.string().optional(),
  sourceId: z.string().uuid().optional(),
});

export const createVideoProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateProjectInput.parse(i))
  .handler(async ({ data, context }) => {
    const spec = FORMAT_SPECS[data.format as VideoFormat];
    const duration = Math.min(
      Math.max(data.durationSeconds ?? spec.defaultDurationSec, spec.minDurationSec),
      spec.maxDurationSec,
    );
    const { data: proj, error } = await sb(context.supabase)
      .from("vs_projects")
      .insert({
        owner_id: context.userId,
        title: data.title,
        format: data.format,
        topic: data.topic,
        goal: data.goal ?? null,
        target_audience: data.audience ?? null,
        duration_seconds: duration,
        language: data.language ?? "en",
        style: data.style ?? null,
        platform: data.platform ?? spec.platform,
        aspect_ratio: spec.aspect,
        resolution: spec.resolution,
        cta: data.cta ?? null,
        script: data.script ?? null,
        brand_kit_id: data.brandKitId ?? null,
        template_id: data.templateId ?? null,
        source_type: data.sourceType ?? null,
        source_id: data.sourceId ?? null,
        metadata: {
          imageUrls: data.imageUrls ?? [],
          logoUrl: data.logoUrl ?? null,
          voiceId: data.voiceId ?? null,
        },
        status: "draft",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return proj;
  });

export const listVideoProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await sb(context.supabase)
      .from("vs_projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data;
  });

export const getVideoProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const [{ data: project }, { data: scenes }, { data: assets }, { data: jobs }] =
      await Promise.all([
        sb(context.supabase).from("vs_projects").select("*").eq("id", data.projectId).single(),
        sb(context.supabase).from("vs_scenes").select("*").eq("project_id", data.projectId).order("scene_number"),
        sb(context.supabase).from("vs_assets").select("*").eq("project_id", data.projectId),
        sb(context.supabase).from("vs_jobs").select("*").eq("project_id", data.projectId).order("created_at", { ascending: false }).limit(50),
      ]);
    return { project, scenes: scenes ?? [], assets: assets ?? [], jobs: jobs ?? [] };
  });

export const updateVideoProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string().uuid(),
    patch: z.record(z.string(), z.unknown()),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await sb(context.supabase)
      .from("vs_projects")
      .update(data.patch)
      .eq("id", data.projectId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const deleteVideoProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await sb(context.supabase).from("vs_projects").delete().eq("id", data.projectId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// Brief & Storyboard generation (AI Router)
// ============================================================

export const generateVideoBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p, error } = await sb(context.supabase)
      .from("vs_projects").select("*").eq("id", data.projectId).single();
    if (error || !p) throw new Error(error?.message ?? "Project not found");

    const input: GenerateVideoInput = {
      title: p.title, format: p.format, topic: p.topic, goal: p.goal,
      audience: p.target_audience, durationSeconds: p.duration_seconds,
      language: p.language, style: p.style, platform: p.platform, cta: p.cta,
      script: p.script,
    };
    const brief = await generateBrief(input);
    await sb(context.supabase).from("vs_projects")
      .update({ brief, status: "brief" }).eq("id", data.projectId);
    return brief;
  });

export const generateVideoStoryboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p, error } = await sb(context.supabase)
      .from("vs_projects").select("*").eq("id", data.projectId).single();
    if (error || !p) throw new Error(error?.message ?? "Project not found");

    const input: GenerateVideoInput = {
      title: p.title, format: p.format, topic: p.topic, goal: p.goal,
      audience: p.target_audience, durationSeconds: p.duration_seconds,
      language: p.language, style: p.style, platform: p.platform, cta: p.cta,
      script: p.script,
    };
    const brief = p.brief && Object.keys(p.brief).length ? p.brief : await generateBrief(input);
    const storyboard = await generateStoryboard(input, brief);

    // Persist storyboard + replace scenes atomically-ish
    await sb(context.supabase).from("vs_projects").update({
      brief,
      storyboard,
      status: "storyboard",
      seo: {
        title: storyboard.title,
        description: storyboard.description,
        hashtags: storyboard.hashtags,
        keywords: storyboard.seoKeywords,
      },
    }).eq("id", data.projectId);

    await sb(context.supabase).from("vs_scenes").delete().eq("project_id", data.projectId);
    if (storyboard.scenes.length) {
      await sb(context.supabase).from("vs_scenes").insert(
        storyboard.scenes.map((s) => ({
          project_id: data.projectId,
          scene_number: s.sceneNumber,
          duration_seconds: s.durationSeconds,
          narration: s.narration,
          visual_prompt: s.visualPrompt,
          video_prompt: s.videoPrompt,
          transition: s.transition,
          camera_movement: s.cameraMovement,
          animation_type: s.animationType,
          overlay_text: s.overlayText,
          background_audio: s.backgroundAudio,
          brand_assets: s.brandAssets,
        })),
      );
    }
    return storyboard as Storyboard;
  });

// ============================================================
// Queue: enqueue generation jobs per scene
// ============================================================

const EnqueueInput = z.object({
  projectId: z.string().uuid(),
  providerSlug: z.string().default("lovable-videogen"),
  voiceProviderSlug: z.string().default("lovable-tts"),
});

export const enqueueVideoGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => EnqueueInput.parse(i))
  .handler(async ({ data, context }) => {
    const { data: scenes, error } = await sb(context.supabase)
      .from("vs_scenes").select("*").eq("project_id", data.projectId).order("scene_number");
    if (error) throw new Error(error.message);
    if (!scenes?.length) throw new Error("Storyboard has no scenes. Generate storyboard first.");

    // Validate adapter registration up-front.
    getAdapter(data.providerSlug);
    getAdapter(data.voiceProviderSlug);

    const rows = scenes.flatMap((s: any) => ([
      {
        owner_id: context.userId,
        project_id: data.projectId,
        scene_id: s.id,
        kind: "scene_video",
        provider_slug: data.providerSlug,
        input: {
          prompt: s.video_prompt || s.visual_prompt,
          durationSeconds: Math.min(10, Math.max(5, Math.round(s.duration_seconds))),
          aspectRatio: (s.metadata?.aspectRatio) || undefined,
        },
        priority: 100,
      },
      {
        owner_id: context.userId,
        project_id: data.projectId,
        scene_id: s.id,
        kind: "scene_voice",
        provider_slug: data.voiceProviderSlug,
        input: { text: s.narration, language: s.metadata?.language ?? "en" },
        priority: 90,
      },
    ]));

    const { data: inserted, error: e2 } = await sb(context.supabase)
      .from("vs_jobs").insert(rows).select();
    if (e2) throw new Error(e2.message);

    await sb(context.supabase).from("vs_projects")
      .update({ status: "generating" }).eq("id", data.projectId);

    return { queued: inserted?.length ?? 0 };
  });

// ============================================================
// Queue: worker step — pull a queued job, dispatch to adapter, update state
// ============================================================

export const processNextVideoJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    let q = sb(context.supabase).from("vs_jobs")
      .select("*")
      .eq("owner_id", context.userId)
      .in("status", ["queued", "retrying"])
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1);
    if (data.projectId) q = q.eq("project_id", data.projectId);
    const { data: jobs, error } = await q;
    if (error) throw new Error(error.message);
    const job = (jobs ?? [])[0];
    if (!job) return { picked: null };

    await sb(context.supabase).from("vs_jobs")
      .update({ status: "running", started_at: new Date().toISOString(), attempts: job.attempts + 1 })
      .eq("id", job.id);

    try {
      const adapter = getAdapter(job.provider_slug);
      const res = await adapter.generate({
        jobId: job.id,
        ownerId: context.userId,
        projectId: job.project_id,
        sceneId: job.scene_id,
        input: job.input,
      });
      await sb(context.supabase).from("vs_jobs").update({
        status: res.status,
        provider_ref: res.providerRef ?? null,
        output: res.output ?? {},
        error: res.error ?? null,
        cost_credits: res.costCredits ?? 0,
        finished_at: res.status === "queued" || res.status === "running" ? null : new Date().toISOString(),
        next_poll_at: res.nextPollInMs
          ? new Date(Date.now() + res.nextPollInMs).toISOString()
          : null,
      }).eq("id", job.id);
      return { picked: job.id, status: res.status };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const shouldRetry = job.attempts + 1 < job.max_attempts;
      await sb(context.supabase).from("vs_jobs").update({
        status: shouldRetry ? "retrying" : "failed",
        error: message,
        finished_at: shouldRetry ? null : new Date().toISOString(),
      }).eq("id", job.id);
      return { picked: job.id, status: shouldRetry ? "retrying" : "failed", error: message };
    }
  });

export const retryVideoJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ jobId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await sb(context.supabase).from("vs_jobs")
      .update({ status: "queued", error: null }).eq("id", data.jobId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelVideoJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ jobId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: job } = await sb(context.supabase).from("vs_jobs")
      .select("*").eq("id", data.jobId).single();
    if (job?.provider_ref) {
      try { await getAdapter(job.provider_slug).cancel(job.provider_ref); } catch { /* noop */ }
    }
    await sb(context.supabase).from("vs_jobs")
      .update({ status: "cancelled", finished_at: new Date().toISOString() }).eq("id", data.jobId);
    return { ok: true };
  });

// ============================================================
// Subtitles
// ============================================================

export const generateVideoSubtitles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: scenes } = await sb(context.supabase)
      .from("vs_scenes").select("*").eq("project_id", data.projectId).order("scene_number");
    const mapped = (scenes ?? []).map((s: any) => ({
      sceneNumber: s.scene_number,
      durationSeconds: Number(s.duration_seconds),
      narration: s.narration ?? "",
      visualPrompt: s.visual_prompt ?? "",
      videoPrompt: s.video_prompt ?? "",
      transition: s.transition ?? "",
      cameraMovement: s.camera_movement ?? "",
      animationType: s.animation_type ?? "",
      overlayText: s.overlay_text ?? "",
      backgroundAudio: s.background_audio ?? "",
      brandAssets: s.brand_assets ?? {},
    }));
    const { srt, vtt } = buildSubtitles(mapped);
    await sb(context.supabase).from("vs_assets").insert([
      { owner_id: context.userId, project_id: data.projectId, kind: "subtitle_srt",
        mime_type: "application/x-subrip",
        metadata: { format: "srt" },
        url: null, storage_path: null,
      },
      { owner_id: context.userId, project_id: data.projectId, kind: "subtitle_vtt",
        mime_type: "text/vtt", metadata: { format: "vtt" },
        url: null, storage_path: null,
      },
    ]);
    return { srt, vtt };
  });

// ============================================================
// AI Assistant suggestions
// ============================================================

export const suggestVideoImprovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string().uuid(),
    kind: z.enum([
      "better_hook","stronger_cta","shorter_version","longer_version",
      "better_scene_order","better_thumbnail","better_title",
      "better_description","seo_keywords",
    ]),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p } = await sb(context.supabase)
      .from("vs_projects").select("title, topic, brief, storyboard, seo, format")
      .eq("id", data.projectId).single();
    const text = await suggest(data.kind, p ?? {});
    return { suggestion: text };
  });

// ============================================================
// Brand kits
// ============================================================

const UpsertBrandKit = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  logoUrl: z.string().url().optional(),
  watermarkUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  toneOfVoice: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const upsertVideoBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertBrandKit.parse(i))
  .handler(async ({ data, context }) => {
    const row = {
      owner_id: context.userId,
      name: data.name,
      logo_url: data.logoUrl ?? null,
      watermark_url: data.watermarkUrl ?? null,
      primary_color: data.primaryColor ?? null,
      secondary_color: data.secondaryColor ?? null,
      accent_color: data.accentColor ?? null,
      font_heading: data.fontHeading ?? null,
      font_body: data.fontBody ?? null,
      tone_of_voice: data.toneOfVoice ?? null,
      is_default: data.isDefault ?? false,
    };
    const q = data.id
      ? sb(context.supabase).from("vs_brand_kits").update(row).eq("id", data.id).select().single()
      : sb(context.supabase).from("vs_brand_kits").insert(row).select().single();
    const { data: saved, error } = await q;
    if (error) throw new Error(error.message);
    return saved;
  });

export const listVideoBrandKits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await sb(context.supabase)
      .from("vs_brand_kits").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ============================================================
// Templates
// ============================================================

export const listVideoTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await sb(context.supabase)
      .from("vs_templates").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ============================================================
// Providers & voices
// ============================================================

export const listVideoProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await sb(context.supabase)
      .from("vs_providers").select("*").order("priority");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listVoiceCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await sb(context.supabase)
      .from("vs_voices").select("*").eq("is_active", true);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ============================================================
// Versions
// ============================================================

export const snapshotVideoVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid(), notes: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p } = await sb(context.supabase).from("vs_projects").select("*").eq("id", data.projectId).single();
    const { data: scenes } = await sb(context.supabase).from("vs_scenes").select("*").eq("project_id", data.projectId);
    const { data: last } = await sb(context.supabase)
      .from("vs_versions").select("version_number").eq("project_id", data.projectId)
      .order("version_number", { ascending: false }).limit(1);
    const next = ((last?.[0]?.version_number as number | undefined) ?? 0) + 1;
    const { data: v, error } = await sb(context.supabase).from("vs_versions").insert({
      project_id: data.projectId,
      version_number: next,
      snapshot: { project: p, scenes },
      notes: data.notes ?? null,
      created_by: context.userId,
    }).select().single();
    if (error) throw new Error(error.message);
    return v;
  });

// ============================================================
// Analytics
// ============================================================

export const recordVideoAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string().uuid(),
    channel: z.string().optional(),
    views: z.number().int().nonnegative().optional(),
    watchTimeSeconds: z.number().int().nonnegative().optional(),
    completionRate: z.number().min(0).max(1).optional(),
    ctr: z.number().min(0).max(1).optional(),
    engagement: z.number().min(0).optional(),
    shares: z.number().int().nonnegative().optional(),
    likes: z.number().int().nonnegative().optional(),
    comments: z.number().int().nonnegative().optional(),
    conversions: z.number().int().nonnegative().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await sb(context.supabase).from("vs_analytics").insert({
      owner_id: context.userId,
      project_id: data.projectId,
      channel: data.channel ?? null,
      views: data.views ?? 0,
      watch_time_seconds: data.watchTimeSeconds ?? 0,
      completion_rate: data.completionRate ?? 0,
      ctr: data.ctr ?? 0,
      engagement: data.engagement ?? 0,
      shares: data.shares ?? 0,
      likes: data.likes ?? 0,
      comments: data.comments ?? 0,
      conversions: data.conversions ?? 0,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const summarizeVideoAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await sb(context.supabase)
      .from("vs_analytics").select("*").eq("project_id", data.projectId);
    if (error) throw new Error(error.message);
    const totals = (rows ?? []).reduce((acc: any, r: any) => ({
      views: acc.views + (r.views || 0),
      watch: acc.watch + (r.watch_time_seconds || 0),
      shares: acc.shares + (r.shares || 0),
      likes: acc.likes + (r.likes || 0),
      comments: acc.comments + (r.comments || 0),
      conversions: acc.conversions + (r.conversions || 0),
    }), { views: 0, watch: 0, shares: 0, likes: 0, comments: 0, conversions: 0 });
    return { totals, samples: rows?.length ?? 0 };
  });

// ============================================================
// Automation sources (auto-generate from Course/Blog/Event/etc.)
// ============================================================

export const createVideoAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    sourceType: z.enum(["course","blog","landing_page","event","campaign","certificate","student_story"]),
    sourceId: z.string().uuid(),
    format: VideoFormatEnum,
    config: z.record(z.string(), z.unknown()).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await sb(context.supabase).from("vs_automation_sources").insert({
      owner_id: context.userId,
      source_type: data.sourceType,
      source_id: data.sourceId,
      format: data.format,
      config: data.config ?? {},
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });
