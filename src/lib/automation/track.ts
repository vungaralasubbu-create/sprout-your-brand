/**
 * Client-side helper: fire an automation event.
 * Fire-and-forget; failures are logged but never block user flows.
 * Also collects device/UTM passively.
 */
import { trackAutomationEvent } from "./track.functions";

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const q = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const v = q.get(k);
      if (v) utm[k] = v;
    }
    return utm;
  } catch {
    return {};
  }
}

function readSession(): string {
  if (typeof window === "undefined") return "";
  try {
    const key = "glintr.session_id";
    let v = window.sessionStorage.getItem(key);
    if (!v) {
      v = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      window.sessionStorage.setItem(key, v);
    }
    return v;
  } catch {
    return "";
  }
}

export interface TrackInput {
  event: string;
  properties?: Record<string, unknown>;
  brandId?: string | null;
}

export async function track({ event, properties, brandId }: TrackInput): Promise<void> {
  try {
    await trackAutomationEvent({
      data: {
        event_name: event,
        properties: properties ?? {},
        brand_id: brandId ?? null,
        session_id: readSession(),
        device: detectDevice(),
        utm: readUtm(),
      },
    });
  } catch (err) {
    // best-effort — never surface to user
    if (typeof console !== "undefined") console.debug("[automation] track failed", err);
  }
}
