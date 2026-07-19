/**
 * Smart Model Routing
 * -------------------
 * Given a task profile (kind, length, quality, tools, latency target)
 * plus current provider health, pick an ordered failover chain of
 * (provider, model) pairs.
 *
 * The chain is consumed by `executeWithFailover`.
 */

import type { ProviderId, TaskKind } from "../providers/types";

export type QualityTier = "fast" | "balanced" | "premium";

export interface RoutingProfile {
  kind: TaskKind;
  quality?: QualityTier;
  needsTools?: boolean;
  needsStructured?: boolean;
  needsStreaming?: boolean;
  estimatedInputTokens?: number;
  latencyBudgetMs?: number;
  preferredProvider?: ProviderId;
  preferredModel?: string;
}

export interface RoutingChoice {
  provider: ProviderId;
  model: string;
  reason: string;
}

export interface ProviderHealthSnapshot {
  provider: ProviderId;
  status: "healthy" | "degraded" | "down";
  latencyP95Ms?: number;
  errorRate?: number;
}

// ---- Model catalog (cost = relative, latency = relative ms baseline) --------

interface CatalogEntry {
  provider: ProviderId;
  model: string;
  kinds: TaskKind[];
  quality: QualityTier;
  contextTokens: number;
  cost: number;   // relative units
  latency: number; // relative ms baseline
  tools: boolean;
  structured: boolean;
}

const CATALOG: CatalogEntry[] = [
  // OpenAI — chat / structured / tools
  { provider: "openai", model: "openai/gpt-5.4-nano",  kinds: ["chat","tool_call","structured","streaming"], quality: "fast",     contextTokens: 200_000, cost: 1, latency: 400, tools: true, structured: true },
  { provider: "openai", model: "openai/gpt-5.4-mini",  kinds: ["chat","tool_call","structured","streaming"], quality: "balanced", contextTokens: 200_000, cost: 3, latency: 700, tools: true, structured: true },
  { provider: "openai", model: "openai/gpt-5.5",       kinds: ["chat","tool_call","structured","streaming"], quality: "premium",  contextTokens: 200_000, cost: 10, latency: 1400, tools: true, structured: true },
  // OpenAI — embeddings + images
  { provider: "openai", model: "openai/text-embedding-3-small", kinds: ["embedding"], quality: "fast", contextTokens: 8000, cost: 1, latency: 200, tools: false, structured: false },
  { provider: "openai", model: "openai/text-embedding-3-large", kinds: ["embedding"], quality: "premium", contextTokens: 8000, cost: 4, latency: 400, tools: false, structured: false },
  { provider: "openai", model: "openai/gpt-image-1",   kinds: ["image"], quality: "balanced", contextTokens: 0, cost: 8, latency: 4000, tools: false, structured: false },

  // Google — chat, huge context, embeddings, images
  { provider: "google", model: "google/gemini-3.1-flash-lite", kinds: ["chat","tool_call","structured","streaming"], quality: "fast",     contextTokens: 1_000_000, cost: 1, latency: 350, tools: true, structured: true },
  { provider: "google", model: "google/gemini-3.5-flash",      kinds: ["chat","tool_call","structured","streaming"], quality: "balanced", contextTokens: 1_000_000, cost: 2, latency: 600, tools: true, structured: true },
  { provider: "google", model: "google/gemini-3.1-pro-preview",kinds: ["chat","tool_call","structured","streaming"], quality: "premium",  contextTokens: 1_000_000, cost: 8, latency: 1600, tools: true, structured: true },
  { provider: "google", model: "google/gemini-embedding-001",  kinds: ["embedding"], quality: "balanced", contextTokens: 8000, cost: 1, latency: 250, tools: false, structured: false },
  { provider: "google", model: "google/gemini-3-pro-image",    kinds: ["image"], quality: "premium", contextTokens: 0, cost: 9, latency: 5000, tools: false, structured: false },

  // Anthropic — chat only
  { provider: "anthropic", model: "anthropic/claude-haiku-4",  kinds: ["chat","tool_call","structured","streaming"], quality: "fast",     contextTokens: 200_000, cost: 2, latency: 500, tools: true, structured: true },
  { provider: "anthropic", model: "anthropic/claude-sonnet-4", kinds: ["chat","tool_call","structured","streaming"], quality: "balanced", contextTokens: 200_000, cost: 6, latency: 900, tools: true, structured: true },
  { provider: "anthropic", model: "anthropic/claude-opus-4",   kinds: ["chat","tool_call","structured","streaming"], quality: "premium",  contextTokens: 200_000, cost: 15, latency: 1800, tools: true, structured: true },
];

function isEligible(entry: CatalogEntry, profile: RoutingProfile): boolean {
  if (!entry.kinds.includes(profile.kind)) return false;
  if (profile.needsTools && !entry.tools) return false;
  if (profile.needsStructured && !entry.structured) return false;
  if (profile.needsStreaming && !entry.kinds.includes("streaming")) return false;
  if (profile.estimatedInputTokens && entry.contextTokens > 0 && profile.estimatedInputTokens > entry.contextTokens * 0.8) return false;
  return true;
}

function scoreFor(entry: CatalogEntry, profile: RoutingProfile, health: Map<ProviderId, ProviderHealthSnapshot>): number {
  const h = health.get(entry.provider);
  if (h?.status === "down") return Number.POSITIVE_INFINITY;
  const quality = profile.quality ?? "balanced";
  const qualityMismatch = quality === entry.quality ? 0 : quality === "premium" && entry.quality === "fast" ? 6 : 2;
  const costWeight = quality === "fast" ? 3 : quality === "premium" ? 0.5 : 1;
  const latencyWeight = profile.latencyBudgetMs ? Math.max(0, entry.latency - profile.latencyBudgetMs) / 200 : 0;
  const healthPenalty = h?.status === "degraded" ? 5 : (h?.errorRate ?? 0) * 10;
  return qualityMismatch + entry.cost * costWeight + latencyWeight + healthPenalty;
}

export function planRoute(
  profile: RoutingProfile,
  healthSnapshots: ProviderHealthSnapshot[] = [],
): RoutingChoice[] {
  const health = new Map(healthSnapshots.map((h) => [h.provider, h] as const));
  const eligible = CATALOG.filter((e) => isEligible(e, profile));

  // Pin: honor explicit preferences by boosting to head of chain when eligible.
  const preferred = eligible.find(
    (e) => profile.preferredModel && e.model === profile.preferredModel,
  );
  const preferredProvider = profile.preferredProvider
    ? eligible.filter((e) => e.provider === profile.preferredProvider)
    : [];

  const ranked = eligible
    .map((e) => ({ e, score: scoreFor(e, profile, health) }))
    .sort((a, b) => a.score - b.score);

  const ordered: CatalogEntry[] = [];
  const seen = new Set<string>();
  const push = (e?: CatalogEntry, reason?: string) => {
    if (!e) return;
    const key = `${e.provider}:${e.model}`;
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(e);
    (ordered[ordered.length - 1] as any).__reason = reason;
  };

  if (preferred) push(preferred, "user_preferred_model");
  for (const e of preferredProvider) push(e, "user_preferred_provider");
  for (const { e } of ranked) push(e, "smart_score");

  // Ensure we have distinct providers up the failover chain (best per provider).
  const bestPerProvider = new Map<ProviderId, CatalogEntry>();
  for (const e of ordered) {
    if (!bestPerProvider.has(e.provider)) bestPerProvider.set(e.provider, e);
  }

  // Final chain: top choice first, then best-of the other providers as fallbacks.
  const chain: RoutingChoice[] = [];
  const primary = ordered[0];
  if (primary) chain.push({ provider: primary.provider, model: primary.model, reason: (primary as any).__reason ?? "primary" });
  for (const [provider, entry] of bestPerProvider) {
    if (provider === primary?.provider) continue;
    chain.push({ provider, model: entry.model, reason: "failover" });
  }
  return chain;
}
