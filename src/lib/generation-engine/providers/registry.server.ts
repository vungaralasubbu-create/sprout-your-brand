/**
 * Provider Registry — server-only.
 *
 * Registers every EngineProvider by key. Selection resolves the best
 * available provider for a given ContentType, honoring `requestedProvider`
 * when supplied, then falling back through the registry priority list.
 * All providers ultimately delegate to the AI Router — none call
 * providers directly.
 */

import type { ContentType, EngineProvider } from "../types";
import { textProvider } from "./text.server";
import { imageProvider } from "./image.server";
import { videoStubProvider } from "./video.server";
import { voiceStubProvider } from "./voice.server";
import { documentStubProvider } from "./document.server";

const REGISTRY = new Map<string, EngineProvider>();

function register(p: EngineProvider) {
  REGISTRY.set(p.key, p);
}

register(textProvider);
register(imageProvider);
register(videoStubProvider);
register(voiceStubProvider);
register(documentStubProvider);

const CONTENT_TYPE_ROUTE: Record<ContentType, string[]> = {
  // Text-like
  text:          ["router.text.openai", "router.text.google", "router.text.anthropic"],
  landing_page:  ["router.text.openai", "router.text.google"],
  // Image-like
  image:         ["router.image.openai"],
  advertisement: ["router.image.openai"],
  banner:        ["router.image.openai"],
  logo:          ["router.image.openai"],
  illustration:  ["router.image.openai"],
  certificate:   ["router.image.openai"],
  // Rich media (stubbed, ready for future connectors)
  video:         ["video.runway", "video.veo", "video.kling"],
  voice:         ["audio.elevenlabs"],
  document:      ["document.pdfkit"],
  pdf:           ["document.pdfkit"],
  presentation:  ["presentation.builder"],
};

export function listProviders(): EngineProvider[] {
  return Array.from(REGISTRY.values());
}

export function getProvider(key: string): EngineProvider | undefined {
  return REGISTRY.get(key);
}

/**
 * Pick an ordered chain of providers to try for a given request.
 * Honors `requestedProvider` first, then walks the ContentType route.
 */
export function planProviderChain(
  contentType: ContentType,
  requestedProvider?: string | null,
): EngineProvider[] {
  const chain: EngineProvider[] = [];
  if (requestedProvider) {
    const req = REGISTRY.get(requestedProvider);
    if (req) chain.push(req);
  }
  for (const key of CONTENT_TYPE_ROUTE[contentType] ?? []) {
    const p = REGISTRY.get(key);
    if (p && !chain.includes(p)) chain.push(p);
  }
  return chain;
}
