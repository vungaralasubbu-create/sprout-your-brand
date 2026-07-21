// Server-only AI client. Every AI request across the Glintr platform is
// funneled through this module, which in turn calls the centralized
// AI Router edge function at /functions/v1/ai-router (backed by the
// workspace's own OpenAI API key). Lovable AI Gateway is no longer used.
import { AiJsonParseError, parseAiJson } from "./ai-json";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const DEFAULT_MODEL = "gpt-4o-mini";
const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 200;

type CacheEntry = { value: string; expiresAt: number };
const responseCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string>>();

function cacheKey(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  jsonMode: boolean;
}): string {
  return JSON.stringify({
    m: opts.model ?? DEFAULT_MODEL,
    t: opts.temperature ?? 0.6,
    j: opts.jsonMode,
    x: opts.messages,
  });
}

function readCache(key: string): string | undefined {
  const hit = responseCache.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) {
    responseCache.delete(key);
    return undefined;
  }
  return hit.value;
}

function writeCache(key: string, value: string): void {
  if (responseCache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = responseCache.keys().next().value as string | undefined;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function isAiAvailable(): boolean {
  // The centralized router provisions its own OPENAI_API_KEY at the
  // edge-function environment. On the app tier we only need the Supabase
  // URL / publishable key to reach the router.
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

function routerUrl(): string {
  const base = process.env.SUPABASE_URL;
  if (!base) throw new Error("SUPABASE_URL not configured");
  return `${base.replace(/\/$/, "")}/functions/v1/ai-router`;
}

function routerAuthHeaders(): Record<string, string> {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("SUPABASE_PUBLISHABLE_KEY not configured");
  const headers: Record<string, string> = { apikey: key, authorization: `Bearer ${key}` };
  // Server-to-server callers authenticate to the AI Router via a shared
  // internal secret. The apikey/anon key alone is NOT accepted by the
  // router (it is public and would allow anonymous OpenAI credit drain).
  const internal = process.env.AI_ROUTER_INTERNAL_SECRET;
  if (internal) headers["x-internal-secret"] = internal;
  return headers;
}

/**
 * Pre-flight validation for the app-side gateway. Fails fast with a clear
 * message before the edge function is even called, so callers see the real
 * problem (empty prompt / invalid role / bad temperature) instead of an
 * opaque 400 from downstream.
 */
const VALID_ROLES = new Set(["system", "user", "assistant", "tool"]);
const MAX_PROMPT_CHARS = 200_000;

function validateChatInput(opts: {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
}): void {
  if (!Array.isArray(opts.messages) || opts.messages.length === 0) {
    throw new Error("AI Router: `messages` must be a non-empty array.");
  }
  let totalChars = 0;
  for (let i = 0; i < opts.messages.length; i++) {
    const m = opts.messages[i] as ChatMessage & { role?: unknown; content?: unknown };
    if (!m || typeof m !== "object") {
      throw new Error(`AI Router: messages[${i}] must be an object.`);
    }
    if (typeof m.role !== "string" || !VALID_ROLES.has(m.role)) {
      throw new Error(
        `AI Router: messages[${i}].role must be one of system|user|assistant|tool.`,
      );
    }
    if (typeof m.content !== "string") {
      throw new Error(`AI Router: messages[${i}].content must be a string.`);
    }
    totalChars += m.content.length;
  }
  if (totalChars === 0) {
    throw new Error("AI Router: prompt is empty — every message has empty content.");
  }
  if (totalChars > MAX_PROMPT_CHARS) {
    throw new Error(
      `AI Router: total message length ${totalChars} exceeds max ${MAX_PROMPT_CHARS} chars.`,
    );
  }
  if (opts.temperature !== undefined) {
    const t = opts.temperature;
    if (typeof t !== "number" || Number.isNaN(t) || t < 0 || t > 2) {
      throw new Error("AI Router: `temperature` must be a number between 0 and 2.");
    }
  }
  if (opts.model !== undefined && (typeof opts.model !== "string" || !opts.model.trim())) {
    throw new Error("AI Router: `model` must be a non-empty string when provided.");
  }
}

/**
 * Low-level: call the centralized AI Router `chat` task and return the
 * raw assistant content as a string. Every AI feature in the platform
 * ultimately routes through here.
 */
async function callRouterChat(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  response_format?: { type: "json_object" | "text" };
  bypassCache?: boolean;
}): Promise<string> {
  // Pre-flight: catch malformed requests before hitting the edge function.
  validateChatInput(opts);

  const jsonMode = opts.response_format?.type === "json_object";
  const cKey = cacheKey({ ...opts, jsonMode });

  if (!opts.bypassCache) {
    const cached = readCache(cKey);
    if (cached) return cached;
    const pending = inflight.get(cKey);
    if (pending) return pending;
  }

  const run = (async () => {
    const lastUser = [...opts.messages].reverse().find((m) => m.role === "user")?.content
      ?? opts.messages[opts.messages.length - 1]?.content
      ?? "chat";

    const res = await fetch(routerUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...routerAuthHeaders(),
      },
      body: JSON.stringify({
        task: "chat",
        // NOTE: do NOT hardcode `provider` here. The AI Router resolves the
        // provider from the requested model (google/* -> Gemini,
        // anthropic/* -> Anthropic, otherwise OpenAI). Hardcoding "openai"
        // caused Gemini models like "google/gemini-2.5-flash" to be sent to
        // the OpenAI endpoint and rejected as invalid_model.
        model: opts.model ?? DEFAULT_MODEL,
        prompt: lastUser.slice(0, 100_000),
        options: {
          messages: opts.messages,
          temperature: opts.temperature ?? 0.6,
          ...(opts.response_format ? { response_format: opts.response_format } : {}),
        },
      }),
    });

    if (res.status === 429) throw new Error("AI service rate limit reached. Please retry shortly.");
    if (res.status === 402) throw new Error("AI service credits exhausted.");
    if (!res.ok) {
      // Try to parse the router's JSON error envelope so callers see the
      // provider error code, request ID, and endpoint instead of an opaque
      // "AI Router error (400)" blob.
      const t = await res.text().catch(() => "");
      let requestId: string | undefined;
      let providerCode: string | undefined;
      let providerMsg: string | undefined;
      try {
        const parsed = JSON.parse(t) as {
          error?: { code?: string; message?: string; details?: { error?: { code?: string; message?: string; type?: string }; requestId?: string } };
          meta?: { requestId?: string };
        };
        requestId = parsed?.meta?.requestId ?? parsed?.error?.details?.requestId;
        providerCode = parsed?.error?.details?.error?.code ?? parsed?.error?.code;
        providerMsg = parsed?.error?.details?.error?.message ?? parsed?.error?.message;
      } catch {
        /* body was not JSON — fall through */
      }
      const summary = [
        `AI Router error (${res.status})`,
        providerCode ? `[${providerCode}]` : null,
        providerMsg ?? t.slice(0, 300),
        requestId ? `(requestId=${requestId})` : null,
      ].filter(Boolean).join(" ");
      throw new Error(summary);
    }
    const data = (await res.json()) as {
      success?: boolean;
      content?: string;
      data?: { content?: string };
      error?: { message?: string };
    };
    if (data?.success === false) {
      throw new Error(data.error?.message ?? "AI Router returned an error.");
    }
    const content = data?.content ?? data?.data?.content;
    if (!content) throw new Error("AI Router returned no content");
    const str = String(content);
    if (!opts.bypassCache) writeCache(cKey, str);
    return str;
  })();

  if (!opts.bypassCache) {
    inflight.set(cKey, run);
    run.finally(() => inflight.delete(cKey)).catch(() => {});
  }

  return run;
}

/** Call the AI Router and return raw string content (no JSON parse). */
export async function callLovableAiText(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  bypassCache?: boolean;
}): Promise<string> {
  return callRouterChat({ ...opts });
}

/** Call the AI Router and parse the response as JSON, with one retry. */
export async function callLovableAiJson<T = unknown>(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  bypassCache?: boolean;
}): Promise<T> {
  const attempt = async (extraSystem?: string, bypass = false) => {
    const messages = extraSystem
      ? [{ role: "system" as const, content: extraSystem }, ...opts.messages]
      : opts.messages;
    return callRouterChat({
      ...opts,
      messages,
      response_format: { type: "json_object" },
      bypassCache: bypass || opts.bypassCache,
    });
  };

  let raw = await attempt();
  try {
    return parseAiJson<T>(raw);
  } catch (err) {
    if (err instanceof AiJsonParseError) {
      console.error("[callLovableAiJson] JSON.parse failed (attempt 1)", {
        parseError: err.message,
        offset: err.offset,
        field: err.field,
        truncated: err.truncated,
        rawResponse: err.raw,
      });
    } else {
      console.error("[callLovableAiJson] non-parse failure (attempt 1)", err);
    }
    raw = await attempt(
      "Your previous response was not valid JSON. Return ONLY a single JSON object. " +
        "Escape every backslash, newline, tab, and double-quote inside string values " +
        "(\\\\ for a literal backslash, \\n for newline, \\t for tab, \\\" for a quote). " +
        "Do not wrap the JSON in markdown code fences.",
      true,
    );
    try {
      return parseAiJson<T>(raw);
    } catch (err2) {
      if (err2 instanceof AiJsonParseError) {
        console.error("[callLovableAiJson] JSON.parse failed (attempt 2 / final)", {
          parseError: err2.message,
          offset: err2.offset,
          field: err2.field,
          truncated: err2.truncated,
          rawResponse: err2.raw,
        });
        throw new Error(
          `AI returned an unreadable response${err2.field ? ` (near "${err2.field}")` : ""}. Please retry.`,
        );
      }
      throw err2;
    }
  }
}

/**
 * OpenAI-Chat-Completions-shaped passthrough for call sites that were
 * previously talking to the Lovable AI Gateway directly. Returns the
 * assistant content string. This is the migration on-ramp: it lets
 * legacy callers keep their existing request-shape logic while routing
 * every request through the centralized AI Router.
 */
export async function callAiChatCompletions(opts: {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  response_format?: { type: "json_object" | "text" };
  bypassCache?: boolean;
}): Promise<string> {
  return callRouterChat({
    messages: opts.messages,
    model: opts.model,
    temperature: opts.temperature,
    response_format: opts.response_format,
    bypassCache: opts.bypassCache,
  });
}

export function __clearAiResponseCache(): void {
  responseCache.clear();
  inflight.clear();
}
