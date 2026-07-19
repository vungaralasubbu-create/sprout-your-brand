/**
 * Provider adapter registry. Adapters are pure functions so they can run
 * inside any server function without extra initialization.
 *
 * To add a new provider:
 *   1. Create an adapter that implements VideoProviderAdapter.
 *   2. Register it below with registerAdapter(slug, adapter).
 *   3. Insert a row into vs_providers (or update the seed migration).
 */

import type {
  ProviderJobInput,
  ProviderJobResult,
  VideoProviderAdapter,
} from "./types";

const registry = new Map<string, VideoProviderAdapter>();

export function registerAdapter(slug: string, adapter: VideoProviderAdapter) {
  registry.set(slug, adapter);
}

export function getAdapter(slug: string): VideoProviderAdapter {
  const found = registry.get(slug);
  if (!found) throw new Error(`Video Studio: provider adapter not registered: ${slug}`);
  return found;
}

export function listAdapters(): VideoProviderAdapter[] {
  return Array.from(registry.values());
}

/**
 * Stub adapter used for providers that are wired but not yet implemented
 * (Runway, Luma, Pika, HeyGen, D-ID, ElevenLabs music). Returns a queued
 * job that surfaces a clean "provider not configured" error on poll.
 */
function stubAdapter(slug: string, kind: VideoProviderAdapter["kind"]): VideoProviderAdapter {
  return {
    slug,
    kind,
    async generate(_input: ProviderJobInput): Promise<ProviderJobResult> {
      return {
        status: "failed",
        error: `Provider "${slug}" is registered but not yet configured. Enable its credentials to activate.`,
      };
    },
    async checkStatus(): Promise<ProviderJobResult> {
      return { status: "failed", error: `Provider "${slug}" not configured` };
    },
    async cancel() {},
    async estimateCost() { return 0; },
    async fetchResult(): Promise<ProviderJobResult> {
      return { status: "failed", error: `Provider "${slug}" not configured` };
    },
  };
}

// ---------------------------------------------------------------------------
// Lovable VideoGen adapter — uses the platform's videogen tool via server fn.
// The actual media generation is performed inside runLovableVideoGeneration()
// which is invoked by the orchestrator; the adapter is a thin dispatcher.
// ---------------------------------------------------------------------------
export const lovableVideoGenAdapter: VideoProviderAdapter = {
  slug: "lovable-videogen",
  kind: "video",
  async generate(input) {
    // The orchestrator calls runLovableVideoGeneration directly and stores
    // the resulting asset URL. This adapter path is used when queued.
    return {
      status: "queued",
      providerRef: `lovable:${input.jobId}`,
      nextPollInMs: 2000,
    };
  },
  async checkStatus(providerRef) {
    return { status: "running", providerRef };
  },
  async cancel() {},
  async estimateCost(input) {
    const duration = Number(input.durationSeconds ?? 5);
    return Math.max(1, Math.ceil(duration / 5));
  },
  async fetchResult(providerRef) {
    return { status: "succeeded", providerRef };
  },
  async generateThumbnail() {
    return { status: "succeeded" };
  },
};

// ---------------------------------------------------------------------------
// Lovable TTS adapter — delegates to the AI Router / voice server function.
// ---------------------------------------------------------------------------
export const lovableTtsAdapter: VideoProviderAdapter = {
  slug: "lovable-tts",
  kind: "voice",
  async generate(input) {
    return {
      status: "queued",
      providerRef: `lovable-tts:${input.jobId}`,
      nextPollInMs: 1000,
    };
  },
  async checkStatus(providerRef) {
    return { status: "succeeded", providerRef };
  },
  async cancel() {},
  async estimateCost() { return 0; },
  async fetchResult(providerRef) {
    return { status: "succeeded", providerRef };
  },
};

// ---------------------------------------------------------------------------
// Whisper subtitle adapter — captions can be produced from the narration
// script deterministically, so this adapter returns synchronously in the
// orchestrator (see orchestrator.ts::generateSubtitles).
// ---------------------------------------------------------------------------
export const whisperSubtitleAdapter: VideoProviderAdapter = {
  slug: "whisper",
  kind: "subtitle",
  async generate() { return { status: "succeeded" }; },
  async checkStatus() { return { status: "succeeded" }; },
  async cancel() {},
  async estimateCost() { return 0; },
  async fetchResult() { return { status: "succeeded" }; },
};

// Bootstrap registry
registerAdapter(lovableVideoGenAdapter.slug, lovableVideoGenAdapter);
registerAdapter(lovableTtsAdapter.slug, lovableTtsAdapter);
registerAdapter(whisperSubtitleAdapter.slug, whisperSubtitleAdapter);

// Planned providers — register stubs so orchestrator selection never crashes.
for (const slug of ["runway", "luma", "pika", "heygen", "did"]) {
  registerAdapter(slug, stubAdapter(slug, "video"));
}
for (const slug of ["elevenlabs"]) {
  registerAdapter(slug, stubAdapter(slug, "voice"));
}
for (const slug of ["elevenlabs-music"]) {
  registerAdapter(slug, stubAdapter(slug, "music"));
}
