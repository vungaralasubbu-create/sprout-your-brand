import { withCors } from "../_shared/http/cors.ts";
import { logger } from "../_shared/http/logger.ts";
import { withTimeout } from "../_shared/http/timeout.ts";
import {
  getOpenAiAuthHeader,
  getOpenAiSecretForAuth,
  isOpenAiAuthHeaderExact,
  OPENAI_RESPONSES_URL,
  publicOpenAiSecretDiagnostics,
  readOpenAiError,
} from "../_shared/ai/openai-diagnostics.ts";

// deno-lint-ignore no-explicit-any
const envGet = (name: string): string | undefined => (globalThis as any).Deno?.env?.get?.(name) ?? undefined;

interface AIHealthResponse {
  configured: boolean;
  providerReachable: boolean;
  openaiError: string | null;
  authorizationHeaderValid: boolean;
}

function json(status: number, payload: unknown, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: withCors({ "content-type": "application/json; charset=utf-8", ...(extra ?? {}) }),
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function isAuthorizedAdmin(req: Request): Promise<boolean> {
  // Internal secret path (server-to-server / ops tooling).
  const expected = envGet("AI_ROUTER_INTERNAL_SECRET") ?? "";
  if (expected) {
    const provided = req.headers.get("x-internal-secret") ?? "";
    if (provided && timingSafeEqual(provided, expected)) return true;
  }

  // Supabase user path: verify the bearer JWT identifies a real user AND
  // that user has the admin role (via the public.is_admin RPC).
  const authz = req.headers.get("authorization") ?? "";
  const m = authz.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  const token = m[1].trim();
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  let payload: { sub?: string; exp?: number; aud?: string } | null = null;
  try {
    payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return false;
  }
  if (!payload?.sub) return false;
  if (payload.aud && payload.aud !== "authenticated") return false;
  if (payload.exp && Date.now() / 1000 > Number(payload.exp)) return false;

  const url = envGet("SUPABASE_URL");
  const anon = envGet("SUPABASE_ANON_KEY") ?? envGet("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !anon) return false;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/is_admin`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: anon,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ _user_id: payload.sub }),
    });
    if (!res.ok) return false;
    const body = await res.json().catch(() => null);
    return body === true;
  } catch {
    return false;
  }
}

async function pingOpenAi(): Promise<Pick<AIHealthResponse, "providerReachable" | "openaiError" | "authorizationHeaderValid">> {
  try {
    const { value: apiKey } = getOpenAiSecretForAuth();
    const authorization = getOpenAiAuthHeader(apiKey);
    const authorizationHeaderValid = isOpenAiAuthHeaderExact(apiKey, authorization);

    if (!authorizationHeaderValid) {
      return {
        providerReachable: false,
        openaiError: "Authorization header is not exactly 'Bearer <OPENAI_API_KEY>'.",
        authorizationHeaderValid,
      };
    }

    const response = await withTimeout(10_000, (signal) =>
      fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          "authorization": authorization,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          input: [{ role: "user", content: "Return ok." }],
          max_output_tokens: 16,
          temperature: 0,
        }),
      })
    );

    if (!response.ok) {
      const openaiError = await readOpenAiError(response);
      return {
        providerReachable: false,
        openaiError: openaiError.message,
        authorizationHeaderValid,
      };
    }

    return { providerReachable: true, openaiError: null, authorizationHeaderValid };
  } catch (err) {
    return {
      providerReachable: false,
      openaiError: err instanceof Error ? err.message : "OpenAI health check failed.",
      authorizationHeaderValid: false,
    };
  }
}

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: withCors() });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Only POST is supported." }, { "allow": "POST, OPTIONS" });
  }

  if (!(await isAuthorizedAdmin(req))) {
    return json(401, { error: "Unauthorized" });
  }

  const diagnostics = publicOpenAiSecretDiagnostics();
  const ping = await pingOpenAi();
  // IMPORTANT: never return key length, prefix, or suffix — a single
  // boolean is enough for a health check and cannot narrow brute-force
  // search space for the live API key.
  const payload: AIHealthResponse = {
    configured: diagnostics.secretExists && diagnostics.malformedReasons.length === 0,
    providerReachable: ping.providerReachable,
    openaiError: diagnostics.secretExists && diagnostics.malformedReasons.length > 0
      ? "OPENAI_API_KEY is malformed."
      : ping.openaiError,
    authorizationHeaderValid: ping.authorizationHeaderValid,
  };

  logger.info({
    provider: "openai",
    task: "ai_health",
    message: "ai_health_diagnostics",
    configured: payload.configured,
    providerReachable: payload.providerReachable,
    authorizationHeaderValid: payload.authorizationHeaderValid,
  });

  return json(200, payload);
}

// deno-lint-ignore no-explicit-any
(globalThis as any).Deno?.serve?.((req: Request) => handle(req));
