/**
 * Provider registry — creates and memoizes the adapter instances for the
 * current server process. Reads LOVABLE_API_KEY inside the accessor (not
 * at module scope) so Workers env injection happens correctly.
 *
 * Server-only: this file is `.server.ts` and never bundles to the client.
 */

import { AnthropicAdapter } from "./anthropic-adapter";
import { GoogleAdapter } from "./google-adapter";
import { OpenAIAdapter } from "./openai-adapter";
import type { ProviderAdapter, ProviderId } from "./types";

let cached: Record<ProviderId, ProviderAdapter> | null = null;

export function getProviderRegistry(): Record<ProviderId, ProviderAdapter> {
  if (cached) return cached;
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
  const init = { apiKey, requestTimeoutMs: 60_000, maxRetries: 2 };
  cached = {
    openai: new OpenAIAdapter(init),
    anthropic: new AnthropicAdapter(init),
    google: new GoogleAdapter(init),
  };
  return cached;
}

export function getProvider(id: ProviderId): ProviderAdapter {
  return getProviderRegistry()[id];
}
