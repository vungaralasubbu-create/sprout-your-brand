/**
 * ai-router — Central AI Gateway Edge Function
 *
 * Production-ready infrastructure for routing AI requests to multiple providers.
 * Currently returns a readiness acknowledgement; provider execution (OpenAI,
 * Claude, Gemini) plugs into the `providers` registry without touching the
 * request pipeline.
 *
 * Deno runtime (Supabase Edge Functions).
 */
import { corsHeaders, handleCors } from "./lib/cors.ts";
import { logger } from "./lib/logger.ts";
import { validateRequest, type AiRouterRequest } from "./lib/validate.ts";
import { jsonResponse, errorResponse } from "./lib/response.ts";
import { router } from "./lib/router.ts";

const REQUEST_TIMEOUT_MS = 30_000;

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  const log = logger.child({ requestId, path: "/ai-router" });

  // CORS preflight
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    log.warn("method_not_allowed", { method: req.method });
    return errorResponse("method_not_allowed", "Only POST is supported", 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    log.warn("invalid_json_body");
    return errorResponse("invalid_json", "Request body must be valid JSON", 400);
  }

  const validation = validateRequest(body);
  if (!validation.ok) {
    log.warn("validation_failed", { issues: validation.issues });
    return errorResponse("validation_failed", validation.issues.join("; "), 400);
  }

  const payload: AiRouterRequest = validation.value;
  log.info("request_accepted", { task: payload.task });

  // Enforce a hard timeout on downstream work.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const result = await router.handle(payload, {
      signal: controller.signal,
      log,
      requestId,
    });
    log.info("request_completed", { task: payload.task });
    return jsonResponse(result, 200);
  } catch (err) {
    if (controller.signal.aborted) {
      log.error("request_timeout", { task: payload.task });
      return errorResponse("timeout", "Upstream provider timed out", 504);
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error("request_failed", { task: payload.task, message });
    return errorResponse("internal_error", message, 500);
  } finally {
    clearTimeout(timer);
  }
});

// Re-export for local type consumers / tests.
export { corsHeaders };
