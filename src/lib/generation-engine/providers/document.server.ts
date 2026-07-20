/**
 * Document / PDF provider stub — future PDFKit / HTML→PDF pipeline.
 */
import type { EngineContext, EngineProvider, GenerationOutput, GenerationRequest } from "../types";

export const documentStubProvider: EngineProvider = {
  key: "document.pdfkit",
  category: "document",
  validate(req) {
    if (!req.prompt) return { ok: false, message: "Prompt required" };
    return { ok: true };
  },
  estimateCost() { return { cents: 2, credits: 1, seconds: 8 }; },
  estimateTime() { return 8; },
  capabilities() { return { formats: ["pdf", "html"] }; },
  async health() { return { status: "unknown", message: "Connector not configured" }; },
  async generate(_req: GenerationRequest, _ctx: EngineContext): Promise<GenerationOutput[]> {
    throw new Error("Document provider not configured.");
  },
};
