/**
 * Publishing worker — dispatches due mkt_posts, retries failures with backoff.
 * Server-only. Invoked by the cron endpoint at /api/public/hooks/mkt-publish.
 */
import { PUBLISHERS, type PublishInput } from "./publishers";
import type { MktChannel } from "./types";

const LOCK_MINUTES = 5;
const BACKOFF_MINUTES = [1, 5, 15, 60, 240]; // per attempt

export async function runPublishWorker(limit = 25): Promise<{
  processed: number; succeeded: number; failed: number; retried: number;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();

  // Atomic-ish claim: fetch due, then update locked_until with row filter.
  const { data: due } = await supabaseAdmin
    .from("mkt_posts")
    .select("id")
    .in("status", ["scheduled", "failed"])
    .lte("due_at", now)
    .or(`locked_until.is.null,locked_until.lt.${now}`)
    .lt("attempts", 5)
    .order("due_at", { ascending: true })
    .limit(limit);

  const ids = (due ?? []).map((r) => r.id as string);
  if (!ids.length) return { processed: 0, succeeded: 0, failed: 0, retried: 0 };

  const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
  await supabaseAdmin.from("mkt_posts")
    .update({ locked_until: lockUntil, status: "publishing" })
    .in("id", ids);

  const { data: posts } = await supabaseAdmin
    .from("mkt_posts")
    .select("id, brand_id, channel_id, channel_kind, variant_id, content_id, meta, attempts")
    .in("id", ids);

  let succeeded = 0, failed = 0, retried = 0;

  for (const post of posts ?? []) {
    try {
      const [{ data: variant }, { data: content }, { data: channel }, { data: assets }] = await Promise.all([
        post.variant_id
          ? supabaseAdmin.from("mkt_content_variants").select("*").eq("id", post.variant_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabaseAdmin.from("mkt_content_items").select("id, title, brief, meta").eq("id", post.content_id).maybeSingle(),
        post.channel_id
          ? supabaseAdmin.from("mkt_channels").select("kind, handle, config, credentials_ref").eq("id", post.channel_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabaseAdmin.from("mkt_assets").select("url, kind").eq("content_id", post.content_id).order("created_at", { ascending: false }).limit(1),
      ]);

      const input: PublishInput = {
        post: {
          id: post.id as string,
          brand_id: post.brand_id as string,
          channel_id: (post.channel_id as string | null) ?? null,
          channel_kind: post.channel_kind as MktChannel,
          variant_id: (post.variant_id as string | null) ?? null,
          content_id: post.content_id as string,
          meta: (post.meta as Record<string, unknown>) ?? {},
        },
        variant: variant as PublishInput["variant"],
        content: content as PublishInput["content"],
        asset: (assets && assets[0]) ? { url: assets[0].url as string, kind: assets[0].kind as string } : null,
        channel: channel as PublishInput["channel"],
      };

      const pub = PUBLISHERS[post.channel_kind as MktChannel];
      const result = await pub(input);

      await supabaseAdmin.from("mkt_posts").update({
        status: "published",
        published_at: new Date().toISOString(),
        external_id: result.externalId ?? null,
        external_url: result.externalUrl ?? null,
        provider_response: result.raw ? JSON.parse(JSON.stringify(result.raw)) : null,
        locked_until: null,
        last_error: null,
      }).eq("id", post.id);
      succeeded++;
    } catch (err) {
      const attempts = (post.attempts as number ?? 0) + 1;
      const backoff = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
      const nextDue = new Date(Date.now() + backoff * 60_000).toISOString();
      const exhausted = attempts >= 5;
      await supabaseAdmin.from("mkt_posts").update({
        status: exhausted ? "failed" : "scheduled",
        attempts,
        due_at: exhausted ? new Date().toISOString() : nextDue,
        locked_until: null,
        last_error: err instanceof Error ? err.message : String(err),
      }).eq("id", post.id);
      if (exhausted) failed++; else retried++;
    }
  }

  return { processed: (posts ?? []).length, succeeded, failed, retried };
}
