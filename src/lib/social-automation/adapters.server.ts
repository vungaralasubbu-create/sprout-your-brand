// Provider adapters for each social platform.
// Each adapter exposes: publish(), fetchAnalytics(), fetchComments(), refreshToken().
// Real API integrations are wired via connectors/webhooks; stubs here return
// deterministic results so the queue/retry pipeline is fully exercisable and
// future integrations require minimal code changes.

import type { SocPlatform, SocPublishResult, SocVariantContent } from "./types";

export type AdapterContext = {
  accessToken: string;
  refreshToken?: string;
  accountExternalId?: string | null;
  organization?: string | null;
  metadata?: Record<string, unknown>;
};

export type PublishInput = {
  content: SocVariantContent;
  postType: string;
  language: string;
};

export type SocialAdapter = {
  platform: SocPlatform;
  publish: (ctx: AdapterContext, input: PublishInput) => Promise<SocPublishResult>;
  fetchAnalytics?: (ctx: AdapterContext, externalPostId: string) => Promise<Record<string, number>>;
  fetchComments?: (
    ctx: AdapterContext,
    externalPostId: string,
  ) => Promise<Array<{ external_id: string; author: string; content: string; at: string }>>;
  refreshToken?: (ctx: AdapterContext) => Promise<{ accessToken: string; refreshToken?: string; expiresAt?: string }>;
};

function stubPublish(platform: SocPlatform): SocialAdapter["publish"] {
  return async (_ctx, input) => {
    // Deterministic simulated post id; real adapters replace with actual API calls.
    const external_post_id = `${platform}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      ok: true,
      external_post_id,
      external_url: `https://example.invalid/${platform}/${external_post_id}`,
      raw: { simulated: true, chars: input.content.caption.length },
    };
  };
}

function stubAnalytics(): NonNullable<SocialAdapter["fetchAnalytics"]> {
  return async () => ({
    reach: 0,
    impressions: 0,
    likes: 0,
    comments_count: 0,
    shares: 0,
    saves: 0,
    views: 0,
    clicks: 0,
  });
}

const REGISTRY: Partial<Record<SocPlatform, SocialAdapter>> = {};

function register(a: SocialAdapter) {
  REGISTRY[a.platform] = a;
}

// Register a stub adapter per platform. Real integrations override these.
(
  [
    "linkedin",
    "facebook",
    "instagram",
    "threads",
    "x",
    "telegram",
    "whatsapp_channel",
    "youtube_community",
    "pinterest",
    "blog",
    "email",
  ] as SocPlatform[]
).forEach((p) => {
  register({
    platform: p,
    publish: stubPublish(p),
    fetchAnalytics: stubAnalytics(),
    fetchComments: async () => [],
  });
});

export function getAdapter(platform: SocPlatform): SocialAdapter {
  const a = REGISTRY[platform];
  if (!a) throw new Error(`No adapter registered for platform: ${platform}`);
  return a;
}

export function registerAdapter(a: SocialAdapter) {
  register(a);
}

export function listAdapters(): SocPlatform[] {
  return Object.keys(REGISTRY) as SocPlatform[];
}
