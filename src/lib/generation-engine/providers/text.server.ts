/**
 * Text provider — delegates to the centralized AI Router.
 * Never calls OpenAI/Google/Anthropic directly.
 */
import { executeChat } from "@/lib/ai/router/failover.server";
import type { EngineContext, EngineProvider, GenerationOutput, GenerationRequest, ProviderEstimate } from "../types";

function makeAdapter(key: string, quality: "fast" | "balanced" | "premium"): EngineProvider {
  return {
    key,
    category: "text",
    validate(req) {
      if (!req.prompt || req.prompt.trim().length < 2) return { ok: false, message: "Prompt is required" };
      return { ok: true };
    },
    estimateCost(): ProviderEstimate {
      return { cents: quality === "premium" ? 8 : quality === "balanced" ? 3 : 1, credits: 1, seconds: 5 };
    },
    estimateTime() { return quality === "premium" ? 12 : 5; },
    capabilities() { return { structured: true, streaming: true, tools: true, quality }; },
    async health() { return { status: "healthy" }; },
    async generate(req: GenerationRequest, ctx: EngineContext): Promise<GenerationOutput[]> {
      const system = [ctx.brandSystemPrompt, ctx.campaignSummary].filter(Boolean).join("\n\n");
      const result = await executeChat(
        { kind: "chat", quality: req.quality ?? quality },
        {
          messages: [
            ...(system ? [{ role: "system" as const, content: system }] : []),
            { role: "user" as const, content: req.prompt },
          ],
          temperature: req.creativity,
        } as Parameters<typeof executeChat>[1],
      );
      if (!result.ok) throw new Error(result.error?.message ?? "Text generation failed");
      const r = result.result as { content?: string; text?: string };
      const text = r.content ?? r.text ?? "";
      return [{ kind: req.contentType === "landing_page" ? "html" : "text", textContent: text }];
    },
  };
}

export const textProvider: EngineProvider = makeAdapter("router.text.openai", "balanced");
