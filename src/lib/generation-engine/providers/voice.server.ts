/**
 * Voice provider stub — ready for ElevenLabs / OpenAI TTS.
 */
import type { EngineContext, EngineProvider, GenerationOutput, GenerationRequest } from "../types";

export const voiceStubProvider: EngineProvider = {
  key: "audio.elevenlabs",
  category: "audio",
  validate(req) {
    if (!req.prompt) return { ok: false, message: "Text required" };
    return { ok: true };
  },
  estimateCost(req) {
    const chars = req.prompt.length;
    return { cents: Math.max(1, Math.ceil(chars / 100)), credits: 1, seconds: 4 };
  },
  estimateTime() { return 4; },
  capabilities() { return { voices: "library", formats: ["mp3", "wav"] }; },
  async health() { return { status: "unknown", message: "Connector not configured" }; },
  async generate(_req: GenerationRequest, _ctx: EngineContext): Promise<GenerationOutput[]> {
    throw new Error("Voice provider not configured. Enable ElevenLabs to use voice generation.");
  },
};
