// Campaign Orchestrator — background tick worker.
// Runs whichever step each campaign needs next: planning, generation,
// scheduling, publishing, analytics rollup, and optimization.
// Called via /api/public/hooks/campaign-tick (pg_cron) or ad-hoc.
//
// All AI runs through aiChat (OpenAI via central AI Router). No Lovable AI.

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCampaignPlan, defaultTaskKindsFor } from "./planner.server";
import { generateForTask } from "./content.server";
import { buildSchedule, publishScheduleEntry, nextRetryAt } from "./scheduler.server";
import { generateRecommendations } from "./optimizer.server";
import { rollupCampaign, computeCtr, computeRoi } from "./analytics.server";
import type { CampaignInput, CampaignPlan, TaskBrief, TaskKind } from "./types";

const MAX_TASKS_PER_TICK = 6;
const MAX_PUBLISH_PER_TICK = 10;

export interface TickResult {
  planned: number;
  generated: number;
  scheduled: number;
  published: number;
  rolled: number;
  optimized: number;
}

export async function runCampaignTick(supa: SupabaseClient): Promise<TickResult> {
  const result: TickResult = { planned: 0, generated: 0, scheduled: 0, published: 0, rolled: 0, optimized: 0 };

  // 1) Advance draft/planning campaigns
  const { data: planning } = await supa
    .from("co_campaigns")
    .select("*")
    .in("status", ["planning"])
    .order("priority", { ascending: false })
    .limit(3);

  for (const c of (planning as Array<Record<string, unknown>> | null) ?? []) {
    try {
      const input = campaignRowToInput(c);
      const plan = await generateCampaignPlan(input);
      await seedTasksFromPlan(supa, String(c.id), input, plan);
      await supa.from("co_campaigns")
        .update({ plan: plan as unknown as Record<string, unknown>, status: "generating", kpis: plan.kpis })
        .eq("id", c.id);
      result.planned += 1;
    } catch (e) {
      await supa.from("co_campaigns").update({ status: "failed", meta: { error: String(e) } }).eq("id", c.id);
    }
  }

  // 2) Generate queued tasks
  const { data: queued } = await supa
    .from("co_tasks")
    .select("*, co_campaigns!inner(id,name,kind,prompt,objective,audience,geo,language,primary_cta,secondary_cta,brand_kit_id,keywords,hashtags,landing_goal)")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(MAX_TASKS_PER_TICK);

  for (const t of (queued as Array<Record<string, unknown>> | null) ?? []) {
    const brief = t.brief as TaskBrief;
    const camp = (t as { co_campaigns?: Record<string, unknown> }).co_campaigns ?? {};
    const ctx = buildCampaignContext(camp);
    await supa.from("co_tasks").update({ status: "generating" }).eq("id", t.id);
    try {
      const out = await generateForTask({ ...brief, kind: t.kind as TaskKind }, ctx);
      // Persist asset
      const { data: asset } = await supa.from("co_assets").insert({
        campaign_id: t.campaign_id,
        task_id: t.id,
        asset_type: t.kind,
        channel: t.channel ?? null,
        brand_kit_id: (camp as { brand_kit_id?: string }).brand_kit_id ?? null,
        content: out as unknown as Record<string, unknown>,
      }).select("id").maybeSingle();

      await supa.from("co_tasks").update({
        status: "ready",
        output: out as unknown as Record<string, unknown>,
        asset_id: asset?.id ?? null,
      }).eq("id", t.id);
      result.generated += 1;
    } catch (e) {
      const retries = Number((t as { retries?: number }).retries ?? 0);
      const max = Number((t as { max_retries?: number }).max_retries ?? 3);
      const nextStatus = retries + 1 >= max ? "failed" : "queued";
      await supa.from("co_tasks").update({
        status: nextStatus,
        retries: retries + 1,
        error: e instanceof Error ? e.message : String(e),
      }).eq("id", t.id);
    }
  }

  // 3) Build schedule for approved campaigns that have none yet
  const { data: approved } = await supa
    .from("co_campaigns")
    .select("id, plan, starts_at, ends_at")
    .eq("status", "approved")
    .limit(3);
  for (const c of (approved as Array<Record<string, unknown>> | null) ?? []) {
    const plan = c.plan as CampaignPlan | null;
    if (!plan?.contentCalendar?.length) continue;
    const start = c.starts_at ? new Date(String(c.starts_at)) : new Date();
    const end = c.ends_at ? new Date(String(c.ends_at)) : new Date(Date.now() + 14 * 86_400_000);
    const slots = buildSchedule(plan, start, end);
    if (!slots.length) continue;
    await supa.from("co_schedule").insert(slots.map(s => ({
      campaign_id: c.id,
      channel: s.channel,
      scheduled_at: s.scheduledAt,
      publish_status: "pending",
    })));
    await supa.from("co_campaigns").update({ status: "scheduled" }).eq("id", c.id);
    result.scheduled += slots.length;
  }

  // 4) Publish due schedule entries
  const nowIso = new Date().toISOString();
  const { data: due } = await supa
    .from("co_schedule")
    .select("id, channel, asset_id, attempts, campaign_id, co_assets(id,content)")
    .eq("publish_status", "pending")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(MAX_PUBLISH_PER_TICK);

  for (const row of (due as Array<Record<string, unknown>> | null) ?? []) {
    const asset = (row as { co_assets?: { content?: Record<string, unknown> } }).co_assets;
    const content = asset?.content ?? {};
    const res = await publishScheduleEntry({ id: String(row.id), channel: String(row.channel), content });
    if (res.ok) {
      await supa.from("co_schedule").update({
        publish_status: "published", published_at: new Date().toISOString(),
        external_id: res.externalId ?? null, external_url: res.externalUrl ?? null,
      }).eq("id", row.id);
      result.published += 1;
    } else {
      const attempts = Number((row as { attempts?: number }).attempts ?? 0) + 1;
      const retryAt = nextRetryAt(attempts);
      await supa.from("co_schedule").update({
        publish_status: attempts >= 5 ? "failed" : "pending",
        scheduled_at: retryAt.toISOString(),
        attempts,
        last_error: res.error ?? null,
      }).eq("id", row.id);
    }
  }

  // 5) Analytics rollup + AI optimization for running campaigns
  const { data: running } = await supa
    .from("co_campaigns")
    .select("id, name, kind, audience")
    .in("status", ["scheduled", "publishing", "running"])
    .limit(3);

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

  for (const c of (running as Array<Record<string, unknown>> | null) ?? []) {
    try {
      const rows = await rollupCampaign(supa, String(c.id), weekAgo, today);
      for (const r of rows) {
        const ctr = computeCtr(r.metrics);
        const roi = computeRoi(r.metrics);
        await supa.from("co_analytics").upsert({
          campaign_id: c.id, day: r.day, channel: r.channel,
          ...r.metrics, ctr, roi,
        } as unknown as Record<string, unknown>, { onConflict: "campaign_id,day,channel" });
        result.rolled += 1;
      }

      const recs = await generateRecommendations({
        campaignName: String(c.name),
        kind: String(c.kind),
        audience: (c.audience as Record<string, unknown>) ?? {},
        recentAnalytics: rows.slice(-30),
        currentAssetsSummary: `Campaign ${c.name} is running`,
      });
      if (recs.length) {
        await supa.from("co_optimizations").insert(recs.map(r => ({
          campaign_id: c.id,
          category: r.category, severity: r.severity, title: r.title,
          detail: r.detail, recommended_action: r.recommendedAction,
        })));
        result.optimized += recs.length;
      }
    } catch {
      /* rollup errors are non-fatal for other campaigns */
    }
  }

  return result;
}

// -- helpers ------------------------------------------------------------
function campaignRowToInput(c: Record<string, unknown>): CampaignInput {
  return {
    name: String(c.name),
    kind: c.kind as CampaignInput["kind"],
    objective: (c.objective as string | undefined) ?? undefined,
    prompt: (c.prompt as string | undefined) ?? undefined,
    audience: (c.audience as CampaignInput["audience"]) ?? {},
    geo: (c.geo as CampaignInput["geo"]) ?? {},
    language: (c.language as string | undefined) ?? "en",
    budget: (c.budget as number | undefined) ?? undefined,
    currency: (c.currency as string | undefined) ?? "INR",
    platforms: (c.platforms as string[] | undefined) ?? [],
    startsAt: (c.starts_at as string | undefined) ?? undefined,
    endsAt: (c.ends_at as string | undefined) ?? undefined,
    durationDays: (c.duration_days as number | undefined) ?? undefined,
    brandKitId: (c.brand_kit_id as string | undefined) ?? undefined,
    primaryCta: (c.primary_cta as string | undefined) ?? undefined,
    secondaryCta: (c.secondary_cta as string | undefined) ?? undefined,
    keywords: (c.keywords as string[] | undefined) ?? [],
    hashtags: (c.hashtags as string[] | undefined) ?? [],
    landingGoal: (c.landing_goal as string | undefined) ?? undefined,
    offer: (c.offer as Record<string, unknown>) ?? {},
    couponCode: (c.coupon_code as string | undefined) ?? undefined,
    priority: (c.priority as number | undefined) ?? 3,
  };
}

function buildCampaignContext(c: Record<string, unknown>): string {
  return [
    `Campaign: ${c.name}`,
    `Kind: ${c.kind}`,
    c.objective ? `Objective: ${c.objective}` : null,
    c.prompt ? `Brief: ${c.prompt}` : null,
    c.primary_cta ? `Primary CTA: ${c.primary_cta}` : null,
    c.language ? `Language: ${c.language}` : null,
  ].filter(Boolean).join("\n");
}

async function seedTasksFromPlan(
  supa: SupabaseClient,
  campaignId: string,
  input: CampaignInput,
  _plan: CampaignPlan,
) {
  const kinds = defaultTaskKindsFor(input.kind);
  const rows = kinds.map(kind => ({
    campaign_id: campaignId,
    kind,
    channel: channelForKind(kind),
    brief: {
      kind,
      channel: channelForKind(kind),
      angle: input.prompt,
      keywords: input.keywords ?? [],
      hashtags: input.hashtags ?? [],
      cta: input.primaryCta ?? "Enroll now",
      brandKitId: input.brandKitId,
      language: input.language ?? "en",
      extras: { landingGoal: input.landingGoal, offer: input.offer },
    } as TaskBrief,
  }));
  if (rows.length) await supa.from("co_tasks").insert(rows);
}

function channelForKind(kind: TaskKind): string | null {
  if (kind.startsWith("linkedin_")) return "linkedin";
  if (kind.startsWith("instagram_")) return "instagram";
  if (kind === "facebook_post") return "facebook";
  if (kind === "telegram_message") return "telegram";
  if (kind === "whatsapp_message") return "whatsapp";
  if (kind === "x_post") return "x";
  if (kind === "threads_post") return "threads";
  if (kind === "youtube_community") return "youtube";
  if (kind.startsWith("email_") || kind === "newsletter") return "email";
  if (kind === "landing_page" || kind === "blog" || kind === "seo_meta" || kind === "faq") return "web";
  if (kind === "push_notification") return "push";
  if (kind.startsWith("video_")) return "video";
  if (kind === "voice_narration") return "voice";
  return null; // creatives
}
