// AI Router diagnostics — admin-only, read-only observability.
// Returns router configuration + provider health snapshot so the admin
// dashboard can show which providers are healthy/degraded/down without
// exposing any secrets. Additive — no existing surface changes.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function requireAdmin(ctx: Ctx) {
  for (const role of ["super_admin", "admin"] as const) {
    const { data } = await ctx.supabase.rpc("has_role", {
      _user_id: ctx.userId,
      _role: role,
    });
    if (data === true) return true;
  }
  throw new Error("Forbidden: AI Router diagnostics require admin role");
}

export interface AiRouterDiagnostics {
  router: {
    edgeFunction: "ai-router";
    supabaseUrlConfigured: boolean;
    supabasePublishableKeyConfigured: boolean;
    internalSecretConfigured: boolean;
  };
  providers: {
    openaiConfigured: boolean;
    anthropicConfigured: boolean;
    googleConfigured: boolean;
  };
  health: Array<{
    provider: string;
    status: "healthy" | "degraded" | "down" | "unknown";
    latencyP50Ms?: number;
    latencyP95Ms?: number;
    successRate?: number;
    errorRate?: number;
    requestsToday?: number;
    errorsToday?: number;
    lastError?: string | null;
    lastCheckedAt?: string | null;
  }>;
  recentEvents: Array<{
    provider: string;
    model?: string;
    task?: string;
    latencyMs: number;
    success: boolean;
    errorCode?: string;
    createdAt: string;
  }>;
}

export const getAiRouterDiagnostics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AiRouterDiagnostics> => {
    await requireAdmin(context as Ctx);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [healthRes, eventsRes] = await Promise.all([
      supabaseAdmin
        .from("ai_provider_health")
        .select(
          "provider, status, latency_ms_p50, latency_ms_p95, success_rate, error_rate, requests_today, errors_today, last_error, last_checked_at",
        ),
      supabaseAdmin
        .from("ai_provider_events")
        .select("provider, model, task, latency_ms, success, error_code, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    const health = (healthRes.data ?? []).map((r: any) => ({
      provider: r.provider,
      status: (r.status ?? "unknown") as "healthy" | "degraded" | "down" | "unknown",
      latencyP50Ms: r.latency_ms_p50 ?? undefined,
      latencyP95Ms: r.latency_ms_p95 ?? undefined,
      successRate: r.success_rate ?? undefined,
      errorRate: r.error_rate ?? undefined,
      requestsToday: r.requests_today ?? undefined,
      errorsToday: r.errors_today ?? undefined,
      lastError: r.last_error ?? null,
      lastCheckedAt: r.last_checked_at ?? null,
    }));

    const recentEvents = (eventsRes.data ?? []).map((r: any) => ({
      provider: r.provider,
      model: r.model ?? undefined,
      task: r.task ?? undefined,
      latencyMs: r.latency_ms ?? 0,
      success: Boolean(r.success),
      errorCode: r.error_code ?? undefined,
      createdAt: r.created_at,
    }));

    return {
      router: {
        edgeFunction: "ai-router",
        supabaseUrlConfigured: Boolean(process.env.SUPABASE_URL),
        supabasePublishableKeyConfigured: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY),
        internalSecretConfigured: Boolean(process.env.AI_ROUTER_INTERNAL_SECRET),
      },
      providers: {
        openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
        anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
        googleConfigured: Boolean(process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY),
      },
      health,
      recentEvents,
    };
  });
