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

interface AIHealthResponse {
  secretExists: boolean;
  secretLength: number;
  startsWith: string;
  endsWith: string;
  providerReachable: boolean;
  openaiError: string | null;
  malformedReasons?: string[];
  authorizationHeaderValid: boolean;
  authorizationHeaderShape: "Authorization: Bearer <OPENAI_API_KEY>";
}

function json(status: number, payload: unknown, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: withCors({ "content-type": "application/json; charset=utf-8", ...(extra ?? {}) }),
  });
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
          max_output_tokens: 1,
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

  const diagnostics = publicOpenAiSecretDiagnostics();
  const ping = await pingOpenAi();
  const payload: AIHealthResponse = {
    secretExists: diagnostics.secretExists,
    secretLength: diagnostics.secretLength,
    startsWith: diagnostics.startsWith,
    endsWith: diagnostics.endsWith,
    providerReachable: ping.providerReachable,
    openaiError: diagnostics.secretExists && diagnostics.malformedReasons.length > 0
      ? `OPENAI_API_KEY is malformed: ${diagnostics.malformedReasons.join(" ")}`
      : ping.openaiError,
    malformedReasons: diagnostics.malformedReasons,
    authorizationHeaderValid: ping.authorizationHeaderValid,
    authorizationHeaderShape: diagnostics.authorizationHeaderShape,
  };

  logger.info({
    provider: "openai",
    task: "ai_health",
    message: "ai_health_diagnostics",
    secretExists: payload.secretExists,
    secretLength: payload.secretLength,
    startsWith: payload.startsWith,
    endsWith: payload.endsWith,
    providerReachable: payload.providerReachable,
    authorizationHeaderValid: payload.authorizationHeaderValid,
    malformedReasons: payload.malformedReasons,
  });

  return json(200, payload);
}

// deno-lint-ignore no-explicit-any
(globalThis as any).Deno?.serve?.((req: Request) => handle(req));