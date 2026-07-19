/**
 * Provider registry — creates and memoizes native provider adapters for the
 * current server process.
 *
 * Providers are configured through native API keys (set via the admin
 * secrets UI). Only providers with a configured key are registered; when
 * an unconfigured provider is requested, `getProvider` throws and the
 * failover chain moves on to the next provider.
 *
 * No provider routes through the Lovable AI Gateway. All traffic is
 * provider-native (api.openai.com, api.anthropic.com,
 * generativelanguage.googleapis.com).
 */

import { AnthropicAdapter } from "./anthropic-adapter";
import { GoogleAdapter } from "./google-adapter";
import { OpenAIAdapter } from "./openai-adapter";
import type { ProviderAdapter, ProviderId } from "./types";

type Registry = Partial<Record<ProviderId, ProviderAdapter>>;

let cached: Registry | null = null;

function buildRegistry(): Registry {
  const reg: Registry = {};

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    reg.openai = new OpenAIAdapter({
      apiKey: openaiKey,
      baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      requestTimeoutMs: 60_000,
      maxRetries: 2,
    });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    reg.anthropic = new AnthropicAdapter({
      apiKey: anthropicKey,
      baseUrl: process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1",
      authHeader: "x-api-key",
      extraHeaders: { "anthropic-version": "2023-06-01" },
      requestTimeoutMs: 60_000,
      maxRetries: 2,
    });
  }

  const googleKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (googleKey) {
    reg.google = new GoogleAdapter({
      apiKey: googleKey,
      baseUrl:
        process.env.GOOGLE_BASE_URL ??
        "https://generativelanguage.googleapis.com/v1beta",
      authHeader: "x-goog-api-key",
      requestTimeoutMs: 60_000,
      maxRetries: 2,
    });
  }

  return reg;
}

export function getProviderRegistry(): Registry {
  if (!cached) cached = buildRegistry();
  return cached;
}

export function getProvider(id: ProviderId): ProviderAdapter {
  const reg = getProviderRegistry();
  const adapter = reg[id];
  if (!adapter) {
    throw new Error(
      `Provider "${id}" is not configured. Add its native API key (e.g. OPENAI_API_KEY) via the admin secrets UI.`,
    );
  }
  return adapter;
}

export function listConfiguredProviders(): ProviderId[] {
  return Object.keys(getProviderRegistry()) as ProviderId[];
}
