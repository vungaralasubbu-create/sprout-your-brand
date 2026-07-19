/**
 * Provider registry. Add Claude / Gemini by implementing the AiProvider
 * interface and registering below. The router is provider-agnostic.
 *
 * Providers are not invoked in the current infrastructure milestone — they
 * are wired up but the router short-circuits with a readiness response. The
 * scaffolding is here so future work is a drop-in addition.
 */
import type { Logger } from "./logger.ts";
import type { AiRouterRequest } from "./validate.ts";

export interface ProviderContext {
  signal: AbortSignal;
  log: Logger;
  requestId: string;
}

export interface AiProviderResult {
  content: string;
  raw?: unknown;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export interface AiProvider {
  readonly name: string;
  isConfigured(): boolean;
  complete(req: AiRouterRequest, ctx: ProviderContext): Promise<AiProviderResult>;
  // Future: stream(req, ctx): AsyncIterable<string>
}

class OpenAiProvider implements AiProvider {
  readonly name = "openai";

  isConfigured(): boolean {
    return !!Deno.env.get("OPENAI_API_KEY");
  }

  complete(_req: AiRouterRequest, _ctx: ProviderContext): Promise<AiProviderResult> {
    // Intentionally not implemented in this milestone — infrastructure only.
    // When enabled, this method should:
    //  - read Deno.env.get("OPENAI_API_KEY") inside the function
    //  - call https://api.openai.com/v1/chat/completions with fetch
    //  - wrap the call in withRetry() from ./retry.ts
    //  - respect ctx.signal for timeout propagation
    //  - never log the API key or full prompt at info level
    throw new Error("openai_not_implemented");
  }
}

// Placeholders — implement analogously when adding these providers.
class ClaudeProvider implements AiProvider {
  readonly name = "claude";
  isConfigured(): boolean {
    return !!Deno.env.get("ANTHROPIC_API_KEY");
  }
  complete(): Promise<AiProviderResult> {
    throw new Error("claude_not_implemented");
  }
}

class GeminiProvider implements AiProvider {
  readonly name = "gemini";
  isConfigured(): boolean {
    return !!Deno.env.get("GEMINI_API_KEY");
  }
  complete(): Promise<AiProviderResult> {
    throw new Error("gemini_not_implemented");
  }
}

export const providers: Record<string, AiProvider> = {
  openai: new OpenAiProvider(),
  claude: new ClaudeProvider(),
  gemini: new GeminiProvider(),
};

export const DEFAULT_PROVIDER = "openai";
