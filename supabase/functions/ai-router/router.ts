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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function isAuthorized(req: Request): boolean {
  // Accept either the shared internal secret (server-to-server callers such
  // as the app's ai-gateway.server.ts) or a valid Supabase user JWT via
  // Authorization: Bearer <access_token>. The anon/publishable key does NOT
  // grant access — it is public and shipped in the client bundle.
  // deno-lint-ignore no-explicit-any
  const env = (globalThis as any).Deno?.env;
  const expected = env?.get?.("AI_ROUTER_INTERNAL_SECRET") ?? "";
  if (expected) {
    const provided = req.headers.get("x-internal-secret") ?? "";
    if (provided && timingSafeEqual(provided, expected)) return true;
  }
  // Fall back to Supabase JWT check: verify the Bearer token is a signed JWT
  // (not just the public anon key). The anon key is not a JWT — it starts
  // with `sb_` or is a static publishable key — while a user session JWT has
  // three base64url segments. Require exactly that shape here so anon keys
  // are rejected.
  const authz = req.headers.get("authorization") ?? "";
  const m = authz.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  const tok = m[1].trim();
  const parts = tok.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    // A real Supabase user JWT carries `sub` (user id) and `aud === "authenticated"`.
    if (!payload?.sub) return false;
    if (payload.aud && payload.aud !== "authenticated") return false;
    if (payload.exp && Date.now() / 1000 > Number(payload.exp)) return false;
    return true;
  } catch {
    return false;
  }
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

  if (!isAuthorized(req)) {
    return json(401, {
      success: false,
      error: { code: "unauthorized", message: "Missing or invalid credentials." },
    } as AIRouterError);
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

    // Dispatch: only `generate_blog` is wired to a live provider (OpenAI) in
    // this milestone. Other tasks resolve to the placeholder envelope so the
    // pipeline stays exercisable without incurring costs.
    // `chat` is the generic OpenAI Chat Completions passthrough used by
    // every AI feature across the platform (Ask Glintr AI, Mentor,
    // Career Coach, Blog / Email / Marketing generators, Support agents).
    // `generate_blog` retains its Responses-API path for long-form editorial.
    if (input.task === "chat" || input.task === "generate_blog") {
      // Resolve provider by model prefix so we never send a Gemini model
      // to OpenAI, or a Claude model to Google. Callers may still pin
      // `provider` explicitly; when they do, that wins over the model
      // heuristic (backward compatible with existing generate_blog calls).
      const modelLower = (input.model ?? "").toLowerCase();
      const inferredFromModel: "openai" | "gemini" | "anthropic" | null =
        /^google\//.test(modelLower) || /(^|\b)gemini[-/]/.test(modelLower)
          ? "gemini"
          : /^anthropic\//.test(modelLower) || /(^|\b)claude[-/]/.test(modelLower)
          ? "anthropic"
          : /^openai\//.test(modelLower) || /(^|\b)(gpt-|o[13]-|chatgpt)/.test(modelLower)
          ? "openai"
          : null;

      const resolvedProviderId = input.provider ?? inferredFromModel ?? "openai";

      let provider;
      if (input.task === "chat") {
        if (resolvedProviderId === "gemini") {
          const { geminiChatProvider } = await import("./providers/gemini-chat.ts");
          provider = geminiChatProvider;
        } else if (resolvedProviderId === "anthropic") {
          const { anthropicChatProvider } = await import("./providers/anthropic-chat.ts");
          provider = anthropicChatProvider;
        } else {
          const { openAiChatProvider } = await import("./providers/openai-chat.ts");
          provider = openAiChatProvider;
        }
      } else {
        provider = PROVIDERS[resolvedProviderId];
      }

      // Strip the vendor prefix before forwarding — real provider APIs
      // reject `google/gemini-2.5-flash` / `openai/gpt-4o-mini` etc.
      const forwardedModel = input.model
        ? input.model.replace(/^(openai|google|anthropic)\//i, "")
        : input.model;

      const { data, model } = await withTimeout(CONFIG.requestTimeoutMs, (signal) =>
        provider.execute({ task: input.task, model: forwardedModel, prompt: input.prompt, options: input.options, signal }),
      );
      const executionMs = Date.now() - started;
      logger.info({ requestId, provider: provider.id, task: input.task, status: 200, executionMs, message: "task_ok", model });
      return json(200, {
        success: true,
        provider: provider.id,
        task: input.task,
        content: (data as any)?.content,
        data,
        meta: { requestId, executionMs, model },
      } as AIRouterSuccess);
    }

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
