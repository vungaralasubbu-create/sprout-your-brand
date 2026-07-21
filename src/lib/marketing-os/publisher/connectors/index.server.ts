// Connector registry — the ONLY dispatch table the Publishing Engine uses.
// Add a new platform by registering its connector here; the engine, queue,
// and UI need no code changes.
import type { PlatformConnector, PlatformKey, PublishInput, PublishResult, ValidationIssue } from "./types";
import { invokeEdgeAs, classifyError } from "./edge-invoke.server";

function buildCaption(i: PublishInput, opts: { maxLen: number | null; appendTags?: boolean; appendCta?: boolean } = { maxLen: null, appendTags: true, appendCta: true }) {
  const parts: string[] = [];
  if (i.body?.trim()) parts.push(i.body.trim());
  if (opts.appendCta !== false && i.cta) parts.push(i.cta);
  if (opts.appendTags !== false && i.hashtags.length) parts.push(i.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "));
  let text = parts.join("\n\n");
  if (opts.maxLen && text.length > opts.maxLen) text = text.slice(0, opts.maxLen - 1) + "…";
  return text;
}

async function edgePublish(fn: string, ownerId: string, body: Record<string, unknown>): Promise<PublishResult> {
  try {
    const { status, json } = await invokeEdgeAs(fn, ownerId, body);
    if (status >= 200 && status < 300 && json && typeof json === "object") {
      const j = json as Record<string, unknown>;
      const result = (j.result && typeof j.result === "object" ? j.result : {}) as Record<string, unknown>;
      const root = (result.root && typeof result.root === "object" ? result.root : {}) as Record<string, unknown>;
      const post = (j.post_id ?? j.id ?? j.platform_post_id ?? result.post_id ?? result.id ?? root.id ?? null) as string | null;
      const url = (j.url ?? j.permalink ?? j.platform_url ?? result.url ?? result.permalink ?? root.url ?? null) as string | null;
      return { ok: true, platformPostId: post ? String(post) : null, platformUrl: url ? String(url) : null, response: j };
    }
    const err = classifyError(status, json);
    return { ok: false, errorCode: err.code, errorMessage: err.message, response: json, retryable: err.retryable };
  } catch (e) {
    return { ok: false, errorCode: "network", errorMessage: e instanceof Error ? e.message : String(e), retryable: true };
  }
}

const facebook: PlatformConnector = {
  key: "facebook",
  label: "Facebook",
  capabilities: { requiresMedia: false, supportsImages: true, supportsVideo: true, supportsThread: false, captionLimit: 63206, hashtagLimit: 30 },
  validate: (i) => {
    const issues: ValidationIssue[] = [];
    if (!i.body?.trim() && i.mediaUrls.length === 0) issues.push({ code: "empty", message: "Facebook post needs text or media", fatal: true });
    return issues;
  },
  publish: (i) => edgePublish("publish-facebook", i.ownerId, {
    account_id: i.accountId,
    message: buildCaption(i, { maxLen: 63206 }),
    image_url: i.mediaUrls[0],
    image_urls: i.mediaUrls,
    link: (i.metadata.link as string) ?? undefined,
  }),
};

const instagram: PlatformConnector = {
  key: "instagram",
  label: "Instagram",
  capabilities: { requiresMedia: true, supportsImages: true, supportsVideo: true, supportsThread: false, captionLimit: 2200, hashtagLimit: 30 },
  validate: (i) => {
    const issues: ValidationIssue[] = [];
    if (i.mediaUrls.length === 0) issues.push({ code: "media_required", message: "Instagram requires at least one image or video", fatal: true });
    if (i.hashtags.length > 30) issues.push({ code: "hashtag_limit", message: "Instagram caps hashtags at 30", fatal: false });
    return issues;
  },
  publish: (i) => edgePublish("publish-instagram", i.ownerId, {
    account_id: i.accountId,
    caption: buildCaption(i, { maxLen: 2200 }),
    image_url: i.mediaUrls[0],
    image_urls: i.mediaUrls,
    video_url: (i.metadata.video_url as string) ?? undefined,
  }),
};

const linkedin: PlatformConnector = {
  key: "linkedin",
  label: "LinkedIn",
  capabilities: { requiresMedia: false, supportsImages: true, supportsVideo: false, supportsThread: false, captionLimit: 3000, hashtagLimit: 10 },
  validate: (i) => {
    const issues: ValidationIssue[] = [];
    if (!i.body?.trim() && !i.mediaUrls[0]) issues.push({ code: "empty", message: "LinkedIn post needs text or an image", fatal: true });
    return issues;
  },
  publish: (i) => edgePublish("publish-linkedin", i.ownerId, {
    account_id: i.accountId,
    message: buildCaption(i, { maxLen: 3000 }),
    image_url: i.mediaUrls[0],
    // Optional per-request author override (Company Page vs Personal).
    // When omitted, the edge function falls back to the account's saved default.
    author_urn: (i.metadata.author_urn as string | undefined) ?? undefined,
    author_kind: (i.metadata.author_kind as "person" | "organization" | undefined) ?? undefined,
  }),
};

const x: PlatformConnector = {
  key: "x",
  label: "X",
  capabilities: { requiresMedia: false, supportsImages: true, supportsVideo: false, supportsThread: true, captionLimit: 280, hashtagLimit: 5 },
  validate: (i) => {
    const issues: ValidationIssue[] = [];
    const text = buildCaption(i, { maxLen: null });
    const first = i.thread?.[0] ?? text;
    if (!first && i.mediaUrls.length === 0) issues.push({ code: "empty", message: "X tweet needs text or media", fatal: true });
    if (!i.thread?.length && first.length > 280) issues.push({ code: "too_long", message: "Tweet exceeds 280 chars — split into a thread", fatal: true });
    if (i.thread) for (const seg of i.thread) if (seg.length > 280) issues.push({ code: "too_long", message: `Thread segment >280 chars: ${seg.slice(0, 40)}…`, fatal: true });
    return issues;
  },
  publish: (i) => {
    const message = i.thread?.[0] ?? buildCaption(i, { maxLen: 280 });
    const rest = (i.thread ?? []).slice(1);
    return edgePublish("publish-x", i.ownerId, {
      account_id: i.accountId,
      message,
      image_url: i.mediaUrls[0],
      image_urls: i.mediaUrls.slice(0, 4),
      thread: rest.length ? rest : undefined,
    });
  },
};

const REGISTRY: Partial<Record<PlatformKey, PlatformConnector>> = {
  facebook, instagram, linkedin, x,
  // Future connectors register here — no other code changes required:
  // threads, pinterest, youtube, tiktok, gbp
};

export function getConnector(key: string): PlatformConnector | null {
  const norm = key.toLowerCase() as PlatformKey;
  return REGISTRY[norm] ?? null;
}
export function listConnectors(): PlatformConnector[] {
  return Object.values(REGISTRY) as PlatformConnector[];
}
