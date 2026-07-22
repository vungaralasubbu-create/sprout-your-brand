/**
 * Client-side funnel tracker for Conversion Intelligence.
 * Fire-and-forget; failures are logged and never block UX.
 * Reuses the automation session id so journeys can be stitched together.
 */
import { supabase } from "@/integrations/supabase/client";
import { classifyChannel, type FunnelStage, type TouchContext } from "./channel";

const SESSION_KEY = "glintr.session_id";
const FIRST_TOUCH_KEY = "glintr.first_touch";
const STAGE_MEMO_KEY = "glintr.ci.stage_memo";

interface FirstTouch {
  channel: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
  device: string;
  seen_at: string;
}

function readSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let v = window.sessionStorage.getItem(SESSION_KEY);
    if (!v) {
      v = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      window.sessionStorage.setItem(SESSION_KEY, v);
    }
    return v;
  } catch {
    return "";
  }
}

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function readTouchContext(): TouchContext {
  if (typeof window === "undefined") return {};
  try {
    const q = new URLSearchParams(window.location.search);
    return {
      utm_source: q.get("utm_source"),
      utm_medium: q.get("utm_medium"),
      utm_campaign: q.get("utm_campaign"),
      utm_content: q.get("utm_content"),
      utm_term: q.get("utm_term"),
      referrer: document.referrer || null,
      landing_path: window.location.pathname + window.location.search,
    };
  } catch {
    return {};
  }
}

function getOrCreateFirstTouch(): FirstTouch {
  if (typeof window === "undefined") {
    return {
      channel: "direct",
      source: null,
      medium: null,
      campaign: null,
      referrer: null,
      landing_path: null,
      device: "unknown",
      seen_at: new Date().toISOString(),
    };
  }
  try {
    const cached = window.localStorage.getItem(FIRST_TOUCH_KEY);
    if (cached) return JSON.parse(cached) as FirstTouch;
  } catch {
    // fall through
  }
  const ctx = readTouchContext();
  const first: FirstTouch = {
    channel: classifyChannel(ctx),
    source: ctx.utm_source ?? null,
    medium: ctx.utm_medium ?? null,
    campaign: ctx.utm_campaign ?? null,
    referrer: ctx.referrer ?? null,
    landing_path: ctx.landing_path ?? null,
    device: detectDevice(),
    seen_at: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(first));
  } catch {
    // ignore quota
  }
  return first;
}

function alreadyFired(sessionId: string, stage: FunnelStage, entityId?: string | null): boolean {
  if (typeof window === "undefined") return true;
  try {
    const key = `${STAGE_MEMO_KEY}:${sessionId}`;
    const raw = window.sessionStorage.getItem(key);
    const set = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    const memo = `${stage}::${entityId ?? ""}`;
    if (set.has(memo)) return true;
    set.add(memo);
    window.sessionStorage.setItem(key, JSON.stringify(Array.from(set)));
    return false;
  } catch {
    return false;
  }
}

async function upsertSession(sessionId: string, first: FirstTouch, lastCtx: TouchContext, lastChannel: string) {
  const nowIso = new Date().toISOString();
  const payload = {
    session_id: sessionId,
    first_channel: first.channel,
    first_source: first.source,
    first_medium: first.medium,
    first_campaign: first.campaign,
    first_referrer: first.referrer,
    first_landing_path: first.landing_path,
    first_seen_at: first.seen_at,
    last_channel: lastChannel,
    last_source: lastCtx.utm_source ?? first.source,
    last_medium: lastCtx.utm_medium ?? first.medium,
    last_campaign: lastCtx.utm_campaign ?? first.campaign,
    last_referrer: lastCtx.referrer ?? first.referrer,
    last_seen_at: nowIso,
    device: first.device,
    updated_at: nowIso,
  };
  // upsert via insert-on-conflict — anon-safe
  const { error } = await (supabase as any)
    .from("ci_sessions")
    .upsert(payload, { onConflict: "session_id" });
  if (error) throw error;
}

export interface TrackFunnelInput {
  stage: FunnelStage;
  entityId?: string | null;
  pagePath?: string | null;
  leadId?: string | null;
  revenueCents?: number;
  metadata?: Record<string, unknown>;
}

export async function trackFunnel(input: TrackFunnelInput): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    const sessionId = readSessionId();
    if (!sessionId) return;
    if (alreadyFired(sessionId, input.stage, input.entityId)) return;

    const first = getOrCreateFirstTouch();
    const lastCtx = readTouchContext();
    const lastChannel = classifyChannel(lastCtx);

    await upsertSession(sessionId, first, lastCtx, lastChannel);

    const { error } = await (supabase as any).from("ci_funnel_events").insert({
      session_id: sessionId,
      stage: input.stage,
      entity_id: input.entityId ?? null,
      page_path: input.pagePath ?? window.location.pathname,
      lead_id: input.leadId ?? null,
      revenue_cents: input.revenueCents ?? 0,
      channel: lastChannel,
      source: lastCtx.utm_source ?? first.source,
      medium: lastCtx.utm_medium ?? first.medium,
      campaign: lastCtx.utm_campaign ?? first.campaign,
      metadata: input.metadata ?? {},
    });
    if (error && error.code !== "23505") throw error;
  } catch (err) {
    if (typeof console !== "undefined") console.debug("[ci] trackFunnel failed", err);
  }
}
