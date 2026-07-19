/**
 * Provider Health Monitor
 * -----------------------
 * - Records per-request events (latency, success, tokens, errors) to
 *   `ai_provider_events`.
 * - Maintains a rolling snapshot in `ai_provider_health` (p50/p95 latency,
 *   success/error rate, daily counters, status: healthy | degraded | down).
 * - Exposes `getHealthSnapshot()` for the router and `pingAll()` for
 *   scheduled checks.
 */

import { GatewayError } from "../providers/base-adapter";
import { getProviderRegistry } from "../providers/registry.server";
import type { ProviderId } from "../providers/types";
import type { ProviderHealthSnapshot } from "./smart-router";

interface RollingWindow {
  latencies: number[];
  successes: number;
  errors: number;
}

const WINDOW_SIZE = 50;
const rolling: Record<ProviderId, RollingWindow> = {
  openai: { latencies: [], successes: 0, errors: 0 },
  anthropic: { latencies: [], successes: 0, errors: 0 },
  google: { latencies: [], successes: 0, errors: 0 },
};

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function deriveStatus(errorRate: number, p95: number): "healthy" | "degraded" | "down" {
  if (errorRate > 0.5) return "down";
  if (errorRate > 0.15 || p95 > 15_000) return "degraded";
  return "healthy";
}

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface RecordEventInput {
  provider: ProviderId;
  model?: string;
  task?: string;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  tokensIn?: number;
  tokensOut?: number;
  costCredits?: number;
  userId?: string;
}

export async function recordProviderEvent(evt: RecordEventInput): Promise<void> {
  // Update in-memory rolling window first (never fails).
  const w = rolling[evt.provider];
  w.latencies.push(evt.latencyMs);
  if (w.latencies.length > WINDOW_SIZE) w.latencies.shift();
  if (evt.success) w.successes++; else w.errors++;
  if (w.successes + w.errors > WINDOW_SIZE) {
    // decay counts proportionally
    const total = w.successes + w.errors;
    w.successes = Math.round((w.successes / total) * WINDOW_SIZE);
    w.errors = WINDOW_SIZE - w.successes;
  }

  // Persist event + refresh health snapshot (best-effort; swallow errors).
  try {
    const admin = await getAdmin();
    await admin.from("ai_provider_events").insert({
      provider: evt.provider,
      model: evt.model,
      task: evt.task,
      latency_ms: evt.latencyMs,
      success: evt.success,
      error_code: evt.errorCode,
      error_message: evt.errorMessage?.slice(0, 500),
      tokens_in: evt.tokensIn,
      tokens_out: evt.tokensOut,
      cost_credits: evt.costCredits,
      user_id: evt.userId,
    });

    const p50 = Math.round(percentile(w.latencies, 50));
    const p95 = Math.round(percentile(w.latencies, 95));
    const total = Math.max(1, w.successes + w.errors);
    const successRate = w.successes / total;
    const errorRate = w.errors / total;
    const status = deriveStatus(errorRate, p95);

    const { data: existing } = await admin
      .from("ai_provider_health")
      .select("requests_today, errors_today")
      .eq("provider", evt.provider)
      .maybeSingle();
    await admin.from("ai_provider_health").upsert({
      provider: evt.provider,
      status,
      latency_ms_p50: p50,
      latency_ms_p95: p95,
      success_rate: successRate,
      error_rate: errorRate,
      requests_today: (existing?.requests_today ?? 0) + 1,
      errors_today: (existing?.errors_today ?? 0) + (evt.success ? 0 : 1),
      last_error: evt.success ? null : evt.errorMessage?.slice(0, 500) ?? null,
      last_checked_at: new Date().toISOString(),
    }, { onConflict: "provider" });
  } catch {
    /* health telemetry is best-effort */
  }
}

export async function getHealthSnapshot(): Promise<ProviderHealthSnapshot[]> {
  try {
    const admin = await getAdmin();
    const { data } = await admin
      .from("ai_provider_health")
      .select("provider, status, latency_ms_p95, error_rate");
    if (data?.length) {
      return data.map((r: any) => ({
        provider: r.provider,
        status: r.status,
        latencyP95Ms: r.latency_ms_p95 ?? undefined,
        errorRate: r.error_rate ?? undefined,
      }));
    }
  } catch { /* fall through to in-memory */ }

  return (Object.keys(rolling) as ProviderId[]).map((p) => {
    const w = rolling[p];
    const total = Math.max(1, w.successes + w.errors);
    const errorRate = w.errors / total;
    const p95 = percentile(w.latencies, 95);
    return { provider: p, status: deriveStatus(errorRate, p95), latencyP95Ms: p95, errorRate };
  });
}

/** Ping every provider (used by scheduled health checks / admin dashboard). */
export async function pingAll(): Promise<Array<{ provider: ProviderId; latencyMs?: number; ok: boolean; error?: string }>> {
  const registry = getProviderRegistry();
  const results: Array<{ provider: ProviderId; latencyMs?: number; ok: boolean; error?: string }> = [];
  for (const provider of Object.keys(registry) as ProviderId[]) {
    const adapter = registry[provider];
    if (!adapter) continue;
    try {
      const latencyMs = await adapter.ping();
      await recordProviderEvent({ provider, latencyMs, success: true, task: "healthcheck" });
      results.push({ provider, latencyMs, ok: true });
    } catch (e) {
      const err = e instanceof GatewayError ? e : new GatewayError(String(e), 0, "network", true);
      await recordProviderEvent({
        provider,
        latencyMs: 0,
        success: false,
        errorCode: err.code,
        errorMessage: err.message,
        task: "healthcheck",
      });
      results.push({ provider, ok: false, error: err.message });
    }
  }
  return results;
}
