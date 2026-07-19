/**
 * Ad-Hoc Rate Limiter
 * -------------------
 * NOTE: The Lovable backend does not ship a standard rate-limiting
 * primitive yet. This is an application-level fixed-window counter backed
 * by `rate_limit_buckets` + the `rate_limit_incr` SQL function (atomic
 * upsert + increment). Adequate for enterprise policy enforcement; not a
 * substitute for edge-layer DDoS protection.
 */

import type { RateLimitResult } from "./types";

export interface RateLimitOptions {
  key: string;                 // logical bucket, e.g. "ai_chat:user:<uid>"
  limit: number;               // requests per window
  windowSeconds: number;       // e.g. 60
  increment?: number;          // default 1
}

function windowStart(windowSeconds: number): Date {
  const now = Date.now();
  const bucket = Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
  return new Date(bucket);
}

export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const ws = windowStart(opts.windowSeconds);
  const delta = opts.increment ?? 1;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("rate_limit_incr", {
      _bucket_key: opts.key,
      _window_start: ws.toISOString(),
      _delta: delta,
    });
    if (error) throw error;
    const count = typeof data === "number" ? data : Number(data ?? 0);
    const ok = count <= opts.limit;
    const retryAfterMs = ok ? undefined : Math.max(0, ws.getTime() + opts.windowSeconds * 1000 - Date.now());
    return {
      ok,
      bucketKey: opts.key,
      count,
      limit: opts.limit,
      windowSeconds: opts.windowSeconds,
      retryAfterMs,
    };
  } catch {
    // Fail-open on limiter infra errors so a DB blip does not kill product features.
    return { ok: true, bucketKey: opts.key, count: 0, limit: opts.limit, windowSeconds: opts.windowSeconds };
  }
}

/** Composite helper: user + route bucket. */
export async function limitByUserAndRoute(userId: string, route: string, limit: number, windowSeconds = 60) {
  return checkRateLimit({ key: `${route}:user:${userId}`, limit, windowSeconds });
}

/** Global (per-IP) fallback bucket for unauthenticated surfaces. */
export async function limitByIp(ip: string, route: string, limit: number, windowSeconds = 60) {
  return checkRateLimit({ key: `${route}:ip:${ip}`, limit, windowSeconds });
}
