import type { ProviderId } from "../config.ts";
import type { AIProvider } from "../types.ts";
import { openAiProvider } from "./openai.ts";
import { anthropicProvider } from "./anthropic.ts";
import { geminiProvider } from "./gemini.ts";

// Central registry. To add a new provider (DeepSeek, Grok, Azure OpenAI):
//   1. Create providers/<name>.ts exporting an AIProvider.
//   2. Add its id to CONFIG.providers in ../config.ts.
//   3. Register it here.
// No other code needs to change.
export const PROVIDERS: Record<ProviderId, AIProvider> = {
  openai: openAiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
};

/** Returns the requested provider, or the first configured one as fallback. */
export function resolveProvider(preferred?: ProviderId): AIProvider | null {
  if (preferred && PROVIDERS[preferred]) return PROVIDERS[preferred];
  for (const p of Object.values(PROVIDERS)) if (p.isConfigured()) return p;
  return null;
}
