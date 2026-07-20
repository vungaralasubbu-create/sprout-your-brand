/**
 * Video provider stub — implements the full EngineProvider interface so
 * future connectors (Runway, Veo, Kling, Pika, Luma, MiniMax) can drop in
 * without touching callers. Currently returns "unavailable" — the UI
 * surfaces this cleanly via provider health.
 */
import type { EngineContext, EngineProvider, GenerationOutput, GenerationRequest } from "../types";

export const videoStubProvider: EngineProvider = {
  key: "video.runway",
  category: "video",
  validate(req) {
    if (!req.prompt) return { ok: false, message: "Prompt required" };
    if ((req.durationSeconds ?? 0) > 10) return { ok: false, message: "Max 10s in preview" };
    return { ok: true };
  },
  estimateCost(req) {
    const secs = req.durationSeconds ?? 4;
    return { cents: 50 * secs, credits: secs, seconds: 30 * secs };
  },
  estimateTime(req) { return 30 * (req.durationSeconds ?? 4); },
  capabilities() { return { resolutions: ["720p", "1080p"], maxDurationSec: 10 }; },
  async health() { return { status: "unknown", message: "Connector not configured" }; },
  async generate(_req: GenerationRequest, _ctx: EngineContext): Promise<GenerationOutput[]> {
    throw new Error("Video provider not configured. Enable Runway/Veo/Kling to use video generation.");
  },
  async cancel() { /* future */ },
  async status() { return "queued"; },
  async retry() { /* future */ },
};
