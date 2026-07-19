// Publishing engine — reads scheduled variants, publishes via adapter,
// records attempts, applies retry ladder, updates status, and emits notifications.
//
// Server-only. Uses supabaseAdmin because it runs in background workers /
// cron routes. Callers must have already authorized the write.

import type { SocPlatform, SocRetryTier, SocVariantContent } from "./types";
import { SOC_RETRY_DELAYS_MS, SOC_RETRY_LADDER } from "./types";
import { getAdapter } from "./adapters.server";
import { decryptToken } from "./crypto.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function insertNotification(
  ownerId: string,
  kind: string,
  title: string,
  body: string,
  ref: { type: string; id: string } | null,
  severity: "info" | "warning" | "error" | "success" = "info",
) {
  const db = await admin();
  await db.from("soc_notifications").insert({
    owner_id: ownerId,
    kind,
    title,
    body,
    ref_type: ref?.type ?? null,
    ref_id: ref?.id ?? null,
    severity,
  });
}

export async function publishVariant(variantId: string): Promise<{ ok: boolean; error?: string }> {
  const db = await admin();

  const { data: variant, error: vErr } = await db
    .from("soc_post_variants")
    .select("*, soc_accounts(*), soc_posts(*)")
    .eq("id", variantId)
    .maybeSingle();
  if (vErr || !variant) return { ok: false, error: vErr?.message || "variant not found" };

  const account = (variant as { soc_accounts: Record<string, unknown> | null }).soc_accounts;
  const post = (variant as { soc_posts: Record<string, unknown> | null }).soc_posts;
  if (!account) return { ok: false, error: "no account linked" };

  const ownerId = String((variant as { owner_id: string }).owner_id);
  const platform = String((variant as { platform: SocPlatform }).platform) as SocPlatform;

  // Determine attempt number for retry ladder.
  const { count } = await db
    .from("soc_publish_attempts")
    .select("id", { count: "exact", head: true })
    .eq("variant_id", variantId);
  const attemptNumber = (count ?? 0) + 1;

  await db.from("soc_posts").update({ status: "publishing" }).eq("id", String((variant as { post_id: string }).post_id));

  const startedAt = new Date().toISOString();
  const content: SocVariantContent = {
    caption: String((variant as { caption: string | null }).caption ?? ""),
    hashtags: ((variant as { hashtags: string[] | null }).hashtags ?? []) as string[],
    cta: String((variant as { cta: string | null }).cta ?? ""),
    media: ((variant as { media: unknown[] | null }).media ?? []) as SocVariantContent["media"],
  };

  const adapter = getAdapter(platform);
  const accessToken = decryptToken((account as { access_token_ciphertext: string | null }).access_token_ciphertext);
  const refreshToken = decryptToken((account as { refresh_token_ciphertext: string | null }).refresh_token_ciphertext);

  let result;
  try {
    result = await adapter.publish(
      {
        accessToken,
        refreshToken,
        accountExternalId: (account as { account_external_id: string | null }).account_external_id,
        organization: (account as { organization: string | null }).organization,
        metadata: (account as { metadata: Record<string, unknown> | null }).metadata ?? {},
      },
      {
        content,
        postType: String((post as { post_type: string } | null)?.post_type ?? "text_only"),
        language: String((post as { language: string } | null)?.language ?? "en"),
      },
    );
  } catch (e) {
    result = { ok: false, error_code: "adapter_exception", error_message: String((e as Error).message) };
  }

  const finishedAt = new Date().toISOString();

  if (result.ok) {
    await db.from("soc_publish_attempts").insert({
      variant_id: variantId,
      post_id: String((variant as { post_id: string }).post_id),
      owner_id: ownerId,
      attempt_number: attemptNumber,
      status: "success",
      response_payload: (result.raw ?? {}) as never,
      started_at: startedAt,
      finished_at: finishedAt,
    });
    await db
      .from("soc_post_variants")
      .update({
        status: "published",
        external_post_id: result.external_post_id ?? null,
        external_url: result.external_url ?? null,
      })
      .eq("id", variantId);
    await db
      .from("soc_posts")
      .update({ status: "published", published_at: finishedAt, last_error: null })
      .eq("id", String((variant as { post_id: string }).post_id));
    return { ok: true };
  }

  // Failure — apply retry ladder.
  const nextTier: SocRetryTier | null =
    attemptNumber - 1 < SOC_RETRY_LADDER.length ? SOC_RETRY_LADDER[attemptNumber - 1] : null;
  const nextRetryAt = nextTier ? new Date(Date.now() + SOC_RETRY_DELAYS_MS[nextTier]).toISOString() : null;

  await db.from("soc_publish_attempts").insert({
    variant_id: variantId,
    post_id: String((variant as { post_id: string }).post_id),
    owner_id: ownerId,
    attempt_number: attemptNumber,
    status: nextTier ? "failed" : "abandoned",
    retry_tier: nextTier,
    next_retry_at: nextRetryAt,
    error_code: result.error_code ?? "unknown_error",
    error_message: result.error_message ?? "Adapter returned ok=false",
    started_at: startedAt,
    finished_at: finishedAt,
  });

  await db
    .from("soc_posts")
    .update({
      status: nextTier ? "scheduled" : "failed",
      retry_count: attemptNumber,
      last_error: result.error_message ?? "publish failed",
      scheduled_at: nextRetryAt ?? undefined,
    })
    .eq("id", String((variant as { post_id: string }).post_id));

  await insertNotification(
    ownerId,
    "publishing_failed",
    `Publishing failed on ${platform}`,
    result.error_message ?? "Unknown publishing error",
    { type: "soc_post_variant", id: variantId },
    nextTier ? "warning" : "error",
  );

  return { ok: false, error: result.error_message };
}

// Drain scheduled/retry-ready variants. Call from a cron server route.
export async function drainQueue(maxItems = 25): Promise<{ processed: number; succeeded: number; failed: number }> {
  const db = await admin();
  const now = new Date().toISOString();

  const { data: due } = await db
    .from("soc_posts")
    .select("id")
    .in("status", ["scheduled", "approved"])
    .lte("scheduled_at", now)
    .limit(maxItems);

  const ids = (due ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return { processed: 0, succeeded: 0, failed: 0 };

  const { data: variants } = await db.from("soc_post_variants").select("id").in("post_id", ids);

  let succeeded = 0;
  let failed = 0;
  for (const v of variants ?? []) {
    const r = await publishVariant((v as { id: string }).id);
    if (r.ok) succeeded++;
    else failed++;
  }
  return { processed: variants?.length ?? 0, succeeded, failed };
}
