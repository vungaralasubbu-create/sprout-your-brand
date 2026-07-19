import { CONFIG } from "./config.ts";
import { AIRouterHttpError, UpstreamTimeoutError } from "./errors.ts";
import { withCors } from "./helpers/cors.ts";
import { logger } from "./helpers/logger.ts";
import { withTimeout } from "./helpers/retry.ts";
import { PROVIDERS } from "./providers/index.ts";
import type { AIRouterError, AIRouterResponse, AIRouterSuccess } from "./types.ts";
import { validateRequest } from "./validators.ts";

function json<T>(status: number, payload: AIRouterResponse<T>, extra?: HeadersInit): Response {
  const headers = withCors({ "content-type": "application/json; charset=utf-8", ...(extra ?? {}) });
  return new Response(JSON.stringify(payload), { status, headers });
}

function newRequestId(req: Request): string {
  return req.headers.get("x-request-id") ??
    (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
}

export async function handle(req: Request): Promise<Response> {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: withCors() });
  }
  if (req.method !== "POST") {
    return json(405, {
      success: false,
      error: { code: "method_not_allowed", message: "Only POST is supported." },
    } as AIRouterError, { "allow": "POST, OPTIONS" });
  }

  const requestId = newRequestId(req);
  const started = Date.now();
  let taskLabel: string | null = null;
  let providerLabel: string | null = null;

  try {
    // Parse JSON
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, {
        success: false,
        error: { code: "invalid_json", message: "Request body must be valid JSON." },
        meta: { requestId, executionMs: Date.now() - started },
      });
    }

    // Validate
    const input = validateRequest(body);
    taskLabel = input.task;
    providerLabel = input.provider ?? null;

    // NOTE: Infrastructure-only milestone. This router intentionally does
    // NOT invoke any provider yet — it validates the pipeline and returns
    // a readiness envelope. Future prompts will call PROVIDERS[...].execute()
    // inside withTimeout(CONFIG.requestTimeoutMs, ...) and stream results.
    void PROVIDERS;
    void withTimeout;

    const response: AIRouterSuccess = {
      success: true,
      provider: input.provider ?? null,
      task: input.task,
      message: "AI Router Ready",
      meta: { requestId, executionMs: Date.now() - started, model: input.model },
    };

    logger.info({
      requestId,
      provider: providerLabel,
      task: taskLabel,
      status: 200,
      executionMs: response.meta!.executionMs,
      message: "router_ready",
    });

    return json(200, response);
  } catch (err) {
    const executionMs = Date.now() - started;

    if (err instanceof AIRouterHttpError) {
      logger.warn({
        requestId,
        provider: providerLabel,
        task: taskLabel,
        status: err.status,
        errorCode: err.code,
        message: err.message,
        executionMs,
      });
      return json(err.status, {
        success: false,
        error: { code: err.code, message: err.message, details: err.details },
        meta: { requestId, executionMs },
      });
    }

    if (err instanceof DOMException && err.name === "AbortError") {
      const to = new UpstreamTimeoutError(CONFIG.requestTimeoutMs);
      logger.error({
        requestId,
        provider: providerLabel,
        task: taskLabel,
        status: to.status,
        errorCode: to.code,
        message: to.message,
        executionMs,
      });
      return json(to.status, {
        success: false,
        error: { code: to.code, message: to.message },
        meta: { requestId, executionMs },
      });
    }

    logger.error({
      requestId,
      provider: providerLabel,
      task: taskLabel,
      status: 500,
      errorCode: "internal_error",
      message: err instanceof Error ? err.message : String(err),
      executionMs,
    });
    return json(500, {
      success: false,
      error: { code: "internal_error", message: "An unexpected error occurred." },
      meta: { requestId, executionMs },
    });
  }
}
