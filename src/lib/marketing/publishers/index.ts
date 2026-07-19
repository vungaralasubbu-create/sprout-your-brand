/**
 * Channel publisher registry.
 * Each publisher receives a post + resolved content and returns
 * { externalId?, externalUrl?, raw? } or throws.
 *
 * Adapters use existing platform connectors when available; otherwise they
 * fall back to a "queued" state that records the payload for manual dispatch.
 */
import type { MktChannel } from "../types";

export type PublishInput = {
  post: {
    id: string;
    brand_id: string;
    channel_id: string | null;
    channel_kind: MktChannel;
    variant_id: string | null;
    content_id: string;
    meta: Record<string, unknown>;
  };
  variant: {
    id: string;
    caption: string | null;
    body: string | null;
    cta: string | null;
    hashtags: string[] | null;
    seo_title: string | null;
    seo_description: string | null;
    headline: string | null;
  } | null;
  content: {
    id: string;
    title: string | null;
    brief: string | null;
    meta: Record<string, unknown>;
  };
  asset: { url: string; kind: string } | null;
  channel: { kind: MktChannel; handle: string | null; config: Record<string, unknown>; credentials_ref: string | null } | null;
};

export type PublishResult = {
  externalId?: string;
  externalUrl?: string;
  raw?: unknown;
};

export type Publisher = (input: PublishInput) => Promise<PublishResult>;

/** Compose caption + hashtags for social channels. */
export function composeSocialText(input: PublishInput, maxChars: number): string {
  const v = input.variant;
  const base = v?.caption ?? v?.body ?? input.content.title ?? "";
  const cta = v?.cta ? `\n\n${v.cta}` : "";
  const tags = (v?.hashtags ?? []).slice(0, 20).map((t) => t.startsWith("#") ? t : `#${t}`).join(" ");
  const combined = [base, cta, tags && `\n\n${tags}`].filter(Boolean).join("").trim();
  return combined.length > maxChars ? combined.slice(0, maxChars - 1) + "…" : combined;
}

// ---- Publishers ------------------------------------------------------------

/** Telegram — uses TELEGRAM_BOT_TOKEN + channel chat_id from channel.config.chat_id. */
const telegramPublisher: Publisher = async (input) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = (input.channel?.config as { chat_id?: string })?.chat_id
    ?? (input.channel?.handle ? `@${input.channel.handle.replace(/^@/, "")}` : undefined);
  if (!token || !chatId) throw new Error("Telegram not configured (TELEGRAM_BOT_TOKEN or chat_id missing)");
  const text = composeSocialText(input, 4000);
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: false }),
  });
  const json = await res.json() as { ok: boolean; result?: { message_id: number }; description?: string };
  if (!json.ok) throw new Error(`Telegram: ${json.description}`);
  return { externalId: String(json.result?.message_id), raw: json };
};

/** LinkedIn — via LINKEDIN connector gateway (Person or Organization). */
const linkedinPublisher: Publisher = async (input) => {
  const key = process.env.LOVABLE_API_KEY;
  const conn = process.env.LINKEDIN_API_KEY;
  if (!key || !conn) throw new Error("LinkedIn connector not linked");
  const author = (input.channel?.config as { author?: string })?.author;
  if (!author) throw new Error("LinkedIn channel.config.author required (urn:li:person:... or urn:li:organization:...)");
  const text = composeSocialText(input, 3000);
  const body = {
    author, lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: input.asset?.url ? "IMAGE" : "NONE",
        ...(input.asset?.url ? { media: [{ status: "READY", originalUrl: input.asset.url }] } : {}),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const res = await fetch("https://connector-gateway.lovable.dev/linkedin/v2/ugcPosts", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${key}`,
      "x-connection-api-key": conn,
      "content-type": "application/json",
      "x-restli-protocol-version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`LinkedIn [${res.status}]: ${raw}`);
  const json = JSON.parse(raw) as { id?: string };
  return { externalId: json.id, externalUrl: json.id ? `https://www.linkedin.com/feed/update/${json.id}` : undefined, raw: json };
};

/** Facebook Page — requires FACEBOOK_PAGE_TOKEN + page id in channel.config.page_id. */
const facebookPublisher: Publisher = async (input) => {
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  const pageId = (input.channel?.config as { page_id?: string })?.page_id;
  if (!token || !pageId) throw new Error("Facebook page not configured");
  const message = composeSocialText(input, 2000);
  const params = new URLSearchParams({ message, access_token: token });
  if (input.asset?.url) params.set("link", input.asset.url);
  const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, { method: "POST", body: params });
  const json = await res.json() as { id?: string; error?: { message: string } };
  if (json.error) throw new Error(`Facebook: ${json.error.message}`);
  return { externalId: json.id, raw: json };
};

/** Instagram Business — requires IG_ACCESS_TOKEN + ig_user_id, and an image URL. */
const instagramPublisher: Publisher = async (input) => {
  const token = process.env.IG_ACCESS_TOKEN;
  const igUserId = (input.channel?.config as { ig_user_id?: string })?.ig_user_id;
  if (!token || !igUserId) throw new Error("Instagram not configured");
  if (!input.asset?.url) throw new Error("Instagram post requires an image asset");
  const caption = composeSocialText(input, 2200);
  const c = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
    method: "POST",
    body: new URLSearchParams({ image_url: input.asset.url, caption, access_token: token }),
  }).then((r) => r.json()) as { id?: string; error?: { message: string } };
  if (!c.id) throw new Error(`Instagram create failed: ${c.error?.message}`);
  const p = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: c.id, access_token: token }),
  }).then((r) => r.json()) as { id?: string; error?: { message: string } };
  if (!p.id) throw new Error(`Instagram publish failed: ${p.error?.message}`);
  return { externalId: p.id, raw: { creation: c, publish: p } };
};

/** Blog — persists to the internal blog_posts table as a draft. */
const blogPublisher: Publisher = async (input) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const v = input.variant;
  const slug = (input.content.title ?? v?.seo_title ?? "post-" + input.post.id.slice(0, 8))
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  const { data, error } = await supabaseAdmin.from("blog_posts").insert({
    title: v?.seo_title ?? input.content.title ?? "Untitled",
    slug: `${slug}-${input.post.id.slice(0, 6)}`,
    short_summary: (v?.seo_description ?? input.content.brief ?? "").slice(0, 500),
    content_markdown: v?.body ?? v?.caption ?? input.content.brief ?? "",
    seo_title: v?.seo_title ?? null,
    seo_description: v?.seo_description ?? null,
    status: "draft",
    is_published: false,
  }).select("id, slug").single();
  if (error) throw new Error(`Blog: ${error.message}`);
  return { externalId: data!.id as string, externalUrl: `/blogs/${data!.slug}`, raw: data };
};

/** Email — queues into engage_messages; delivery handled by existing engage stack. */
const emailPublisher: Publisher = async (input) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const v = input.variant;
  const recipient = (input.channel?.config as { recipient?: string })?.recipient ?? "list@queued";
  const { data, error } = await supabaseAdmin.from("engage_messages").insert({
    channel: "email",
    recipient,
    subject: v?.seo_title ?? v?.headline ?? input.content.title ?? "Update",
    status: "queued",
    tenant_scope: "marketing",
    metadata: { source: "marketing_automation", post_id: input.post.id, body_html: v?.body ?? v?.caption ?? "" },
  }).select("id").maybeSingle();
  if (error) throw new Error(`Email: ${error.message}`);
  return { externalId: (data?.id ?? undefined) as string | undefined, raw: data };
};

/** Fallback publisher: records the payload for manual dispatch. */
const queuedPublisher: Publisher = async (input) => {
  return {
    externalId: undefined,
    raw: {
      queued: true,
      channel: input.post.channel_kind,
      text: composeSocialText(input, 4000),
      asset: input.asset?.url,
    },
  };
};

export const PUBLISHERS: Record<MktChannel, Publisher> = {
  linkedin: linkedinPublisher,
  instagram: instagramPublisher,
  facebook: facebookPublisher,
  twitter: queuedPublisher,          // X API v2 requires per-user OAuth; queue by default
  threads: queuedPublisher,          // Threads API is limited/preview
  youtube_community: queuedPublisher,// No public API for community posts
  telegram: telegramPublisher,
  whatsapp_channel: queuedPublisher, // WhatsApp Channels API is not publicly available
  blog: blogPublisher,
  email: emailPublisher,
};
