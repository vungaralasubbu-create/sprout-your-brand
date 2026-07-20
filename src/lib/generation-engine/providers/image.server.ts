/**
 * Image provider — routes through the AI Router's image path via the
 * existing image.server.ts helper. This is the ONE gateway for image
 * generation. Direct callers of generateImageBase64 remain compatible
 * because that helper stays; new code should use the Engine.
 */
import { generateImageBase64 } from "@/lib/ai/image.server";
import type { EngineContext, EngineProvider, GenerationOutput, GenerationRequest, ProviderEstimate } from "../types";

function sizeFromAspect(aspect?: string): "1024x1024" | "1024x1536" | "1536x1024" {
  if (!aspect) return "1024x1024";
  if (aspect.includes("9:16") || aspect === "portrait") return "1024x1536";
  if (aspect.includes("16:9") || aspect === "landscape") return "1536x1024";
  return "1024x1024";
}

export const imageProvider: EngineProvider = {
  key: "router.image.openai",
  category: "image",
  validate(req) {
    if (!req.prompt) return { ok: false, message: "Prompt required" };
    return { ok: true };
  },
  estimateCost(req): ProviderEstimate {
    const cents = req.quality === "premium" ? 20 : req.quality === "fast" ? 4 : 10;
    return { cents, credits: 1, seconds: 15 };
  },
  estimateTime(req) { return req.quality === "premium" ? 30 : 12; },
  capabilities() {
    return { sizes: ["1024x1024", "1024x1536", "1536x1024"], quality: ["low", "medium", "high"] };
  },
  async health() { return { status: "healthy" }; },
  async generate(req: GenerationRequest, ctx: EngineContext): Promise<GenerationOutput[]> {
    const brandedPrompt = [ctx.brandSystemPrompt, ctx.campaignSummary, req.prompt].filter(Boolean).join("\n\n");
    const size = sizeFromAspect(req.aspectRatio);
    const quality =
      req.quality === "premium" ? "high" :
      req.quality === "fast"    ? "low"  : "medium";
    const b64 = await generateImageBase64(brandedPrompt, { size, quality });
    const [w, h] = size.split("x").map((n) => Number(n));
    return [{
      kind: "image",
      mimeType: "image/png",
      width: w,
      height: h,
      metadata: { b64, size, quality },
    }];
  },
};
