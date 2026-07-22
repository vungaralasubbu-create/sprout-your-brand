// Social Media Automation — client-callable server functions.
// Backend-only surface: create accounts, campaigns, posts, variants, run AI
// generation, schedule, approve, publish, collect analytics, recycle, report.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type {
  SocFrequency,
  SocPlatform,
  SocPostType,
  SocStatus,
} from "./types";
import { SOC_PLATFORMS, SOC_POST_TYPES } from "./types";
import { encryptToken } from "./crypto.server";
import { generateVariant, suggestReply } from "./ai.server";
import { publishVariant, drainQueue } from "./publisher.server";
import { detectHighPerformers, recycleVariant } from "./recycling.server";
import { computeInsights } from "./optimization.server";
import { generateReport } from "./reports.server";
import { nextFireAt } from "./scheduler.server";

const platformEnum = z.enum(SOC_PLATFORMS as readonly [SocPlatform, ...SocPlatform[]]);
const postTypeEnum = z.enum(SOC_POST_TYPES as readonly [SocPostType, ...SocPostType[]]);

async function canManagePlatformSocialAccounts(supabase: any, userId: string): Promise<boolean> {
  const [{ data: isSuper }, { data: isAdmin }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
  ]);
  return !!isSuper || !!isAdmin;
}

// -------------------- Accounts --------------------

const connectAccountSchema = z.object({
  platform: platformEnum,
  account_name: z.string().min(1).max(200),
  account_external_id: z.string().max(200).optional(),
  organization: z.string().max(200).optional(),
  access_token: z.string().min(1),
  refresh_token: z.string().optional(),
  token_expires_at: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  brand_id: z.string().uuid().optional(),
});

export const connectSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => connectAccountSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("soc_accounts")
      .insert({
        owner_id: context.userId,
        brand_id: data.brand_id ?? null,
        platform: data.platform,
        account_name: data.account_name,
        account_external_id: data.account_external_id ?? null,
        organization: data.organization ?? null,
        access_token_ciphertext: encryptToken(data.access_token),
        refresh_token_ciphertext: data.refresh_token ? encryptToken(data.refresh_token) : null,
        token_expires_at: data.token_expires_at ?? null,
        permissions: data.permissions,
        connection_status: "connected",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

export const listSocialAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const canManageAll = await canManagePlatformSocialAccounts(context.supabase as any, context.userId);
    const db = canManageAll
      ? (await import("@/integrations/supabase/client.server")).supabaseAdmin
      : context.supabase;
    const { data, error } = await (db as any)
      .from("soc_accounts")
      .select("id, owner_id, platform, account_name, account_external_id, organization, connection_status, webhook_status, token_expires_at, refresh_token_ciphertext, brand_id, metadata, last_synced_at, created_at")
      .in("platform", ["facebook", "instagram", "linkedin", "x"])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const disconnectSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("soc_accounts")
      .update({ connection_status: "disconnected", access_token_ciphertext: null, refresh_token_ciphertext: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------------------- Campaigns --------------------

const campaignSchema = z.object({
  name: z.string().min(1).max(200),
  objective: z.string().max(500).optional(),
  audience: z.record(z.string(), z.unknown()).default({}),
  platforms: z.array(platformEnum).default([]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  frequency: z.enum(["once", "daily", "weekly", "monthly", "quarterly", "custom"]).default("once"),
  frequency_config: z.record(z.string(), z.unknown()).default({}),
  timezone: z.string().default("UTC"),
  brand_kit_id: z.string().uuid().optional(),
  brand_id: z.string().uuid().optional(),
  language: z.string().default("en"),
  tone: z.string().optional(),
  approval_mode: z.enum(["auto", "manual", "team_review"]).default("manual"),
  reviewers: z.array(z.string().uuid()).default([]),
  holiday_awareness: z.boolean().default(true),
  festival_awareness: z.boolean().default(true),
});

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => campaignSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("soc_campaigns")
      .insert({ ...data, owner_id: context.userId, approval_status: "draft" } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("soc_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["draft", "pending_review", "approved", "rejected", "active", "paused", "completed", "archived"]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("soc_campaigns")
      .update({ approval_status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------------------- Posts + AI generation --------------------

const createPostSchema = z.object({
  campaign_id: z.string().uuid().optional(),
  post_type: postTypeEnum,
  topic: z.string().min(1).max(500),
  base_prompt: z.string().max(4000).optional(),
  target_platforms: z.array(platformEnum).min(1),
  scheduled_at: z.string().optional(),
  brand_kit_id: z.string().uuid().optional(),
  language: z.string().default("en"),
  tone: z.string().optional(),
  brand_voice: z.string().optional(),
  auto_generate: z.boolean().default(true),
});

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => createPostSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: post, error } = await context.supabase
      .from("soc_posts")
      .insert({
        owner_id: context.userId,
        campaign_id: data.campaign_id ?? null,
        post_type: data.post_type,
        topic: data.topic,
        base_prompt: data.base_prompt ?? null,
        target_platforms: data.target_platforms,
        scheduled_at: data.scheduled_at ?? null,
        brand_kit_id: data.brand_kit_id ?? null,
        language: data.language,
        tone: data.tone ?? null,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const postId = (post as { id: string }).id;

    if (data.auto_generate) {
      const variants = await Promise.all(
        data.target_platforms.map(async (platform) => {
          const content = await generateVariant({
            platform,
            postType: data.post_type,
            topic: data.topic,
            basePrompt: data.base_prompt,
            language: data.language,
            tone: data.tone,
            brandVoice: data.brand_voice,
          });
          return {
            post_id: postId,
            owner_id: context.userId,
            platform,
            caption: content.caption,
            hashtags: content.hashtags,
            cta: content.cta,
            media: content.media as never,
            best_time_at: content.best_time_at ?? null,
            suggested_comments: (content.suggested_comments ?? []) as never,
            suggested_replies: (content.suggested_replies ?? []) as never,
            status: "ai_generated",
          };
        }),
      );
      const { error: vErr } = await context.supabase.from("soc_post_variants").insert(variants as never);
      if (vErr) throw new Error(vErr.message);
      await context.supabase.from("soc_posts").update({ status: "ai_generated" }).eq("id", postId);
    }
    return { id: postId };
  });

export const regenerateVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ variant_id: z.string().uuid(), extra_instructions: z.string().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: v, error } = await context.supabase
      .from("soc_post_variants")
      .select("id, platform, post_id, soc_posts(post_type, topic, base_prompt, language, tone)")
      .eq("id", data.variant_id)
      .maybeSingle();
    if (error || !v) throw new Error(error?.message ?? "variant not found");
    const post = (v as { soc_posts: { post_type: SocPostType; topic: string; base_prompt: string | null; language: string; tone: string | null } | null }).soc_posts;
    if (!post) throw new Error("parent post not found");
    const content = await generateVariant({
      platform: (v as { platform: SocPlatform }).platform,
      postType: post.post_type,
      topic: post.topic,
      basePrompt: [post.base_prompt, data.extra_instructions].filter(Boolean).join("\n"),
      language: post.language,
      tone: post.tone ?? undefined,
    });
    await context.supabase
      .from("soc_post_variants")
      .update({
        caption: content.caption,
        hashtags: content.hashtags,
        cta: content.cta,
        media: content.media as never,
        status: "ai_generated",
      })
      .eq("id", data.variant_id);
    return { ok: true };
  });

// -------------------- Approvals --------------------

export const submitForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ post_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("soc_posts")
      .update({ status: "pending_review" })
      .eq("id", data.post_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const decideApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        post_id: z.string().uuid(),
        decision: z.enum(["approved", "rejected", "changes_requested"]),
        notes: z.string().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await context.supabase.from("soc_approvals").insert({
      post_id: data.post_id,
      owner_id: context.userId,
      reviewer_id: context.userId,
      decision: data.decision,
      notes: data.notes ?? null,
    });
    const nextStatus: SocStatus =
      data.decision === "approved" ? "approved" : data.decision === "rejected" ? "rejected" : "pending_review";
    const { error } = await context.supabase
      .from("soc_posts")
      .update({ status: nextStatus, reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.post_id);
    if (error) throw new Error(error.message);
    return { ok: true, status: nextStatus };
  });

// -------------------- Scheduling --------------------

export const schedulePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        post_id: z.string().uuid(),
        scheduled_at: z.string().optional(),
        frequency: z.enum(["once", "daily", "weekly", "monthly", "quarterly", "custom"]).optional(),
        frequency_config: z.record(z.string(), z.unknown()).optional(),
        timezone: z.string().default("UTC"),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    let at = data.scheduled_at;
    if (!at && data.frequency && data.frequency !== "custom") {
      const next = nextFireAt(Date.now(), data.frequency as SocFrequency, data.frequency_config ?? {}, data.timezone);
      at = next ? next.toISOString() : undefined;
    }
    const { error } = await context.supabase
      .from("soc_posts")
      .update({ status: "scheduled", scheduled_at: at ?? null, timezone: data.timezone })
      .eq("id", data.post_id);
    if (error) throw new Error(error.message);
    return { ok: true, scheduled_at: at };
  });

export const publishNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ variant_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    // Ensure caller owns the variant.
    const { data: v } = await context.supabase
      .from("soc_post_variants")
      .select("owner_id")
      .eq("id", data.variant_id)
      .maybeSingle();
    if (!v || (v as { owner_id: string }).owner_id !== context.userId) throw new Error("Forbidden");
    return publishVariant(data.variant_id);
  });

export const drainScheduledQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ max: z.number().int().min(1).max(200).default(25) }).parse(raw))
  .handler(async ({ data }) => drainQueue(data.max));

// -------------------- Comments --------------------

export const listComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("soc_comments")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const generateCommentReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ comment_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: c, error } = await context.supabase
      .from("soc_comments")
      .select("*")
      .eq("id", data.comment_id)
      .maybeSingle();
    if (error || !c) throw new Error(error?.message ?? "comment not found");
    const cmt = c as { content: string; platform: SocPlatform };
    const r = await suggestReply({ platform: cmt.platform, comment: cmt.content });
    await context.supabase
      .from("soc_comments")
      .update({ ai_suggested_reply: r.reply, sentiment: r.sentiment, is_spam: r.is_spam })
      .eq("id", data.comment_id);
    return r;
  });

export const replyToComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ comment_id: z.string().uuid(), reply: z.string().min(1).max(4000) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("soc_comments")
      .update({ reply_text: data.reply, reply_status: "replied" })
      .eq("id", data.comment_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assignComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ comment_id: z.string().uuid(), assignee: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("soc_comments")
      .update({ assigned_to: data.assignee })
      .eq("id", data.comment_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------------------- Recycling & optimization --------------------

export const scanRecyclingCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ min_score: z.number().default(5000) }).parse(raw))
  .handler(async ({ data, context }) => detectHighPerformers(context.userId, data.min_score));

export const runRecycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        candidate_id: z.string().uuid(),
        action: z.enum(["rewrite", "refresh", "carousel", "blog", "email", "variations"]),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => recycleVariant(data.candidate_id, data.action));

export const refreshOptimizationInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => computeInsights(context.userId));

// -------------------- Analytics & reports --------------------

export const ingestAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        variant_id: z.string().uuid(),
        platform: platformEnum,
        campaign_id: z.string().uuid().optional(),
        metrics: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).default({}),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("soc_analytics").insert({
      owner_id: context.userId,
      variant_id: data.variant_id,
      campaign_id: data.campaign_id ?? null,
      platform: data.platform,
      ...data.metrics,
      raw: data.metrics as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        kind: z.enum(["weekly", "monthly", "campaign", "platform", "brand"]),
        campaign_id: z.string().uuid().optional(),
        platform: platformEnum.optional(),
        brand_id: z.string().uuid().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        format: z.enum(["csv", "excel", "pdf", "json"]).default("json"),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) =>
    generateReport(context.userId, data.kind, {
      campaignId: data.campaign_id,
      platform: data.platform,
      brandId: data.brand_id,
      from: data.from,
      to: data.to,
      format: data.format,
    }),
  );

// -------------------- Calendar --------------------

export const getCalendar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("soc_posts")
      .select("id, topic, status, scheduled_at, target_platforms, campaign_id, brand_kit_id")
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// -------------------- Notifications --------------------

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("soc_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("soc_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
