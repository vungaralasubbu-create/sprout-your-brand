/**
 * OpenAI Chat Completions provider for the AI Router.
 *
 * This adapter powers the generic `chat` task and is the workhorse used
 * by every Glintr AI feature (Ask Glintr AI, Mentor, Career Coach, Blog
 * Generator, Email Generator, Marketing / Sales agents, Support agents, etc.)
 *
 * Contract:
 *  - Accepts an OpenAI-Chat-Completions-shaped payload via `options`:
 *      { messages, model, temperature, response_format, top_p,
 *        presence_penalty, frequency_penalty, max_tokens, tools,
 *        tool_choice, seed, stop, user, parallel_tool_calls,
 *        max_completion_tokens }
 *  - Falls back to constructing `messages` from `input.prompt` when the
 *    caller does not supply an explicit array.
 *  - Returns { content } — the assistant message content as a plain string.
 *
 * Auth: uses the workspace-owned OPENAI_API_KEY (never Lovable API keys).
 *
 * Error surfacing: OpenAI 400 (invalid_request_error) is returned to the
 * caller with the full provider error body, model, endpoint, and the
 * outgoing payload shape — never hidden inside a generic 502. Retries only
 * on 429 / 5xx.
 */

import {
  ProviderBadRequestError,
  ProviderNotConfiguredError,
  UpstreamError,
  ValidationError,
} from "../errors.ts";
import { withRetry } from "../helpers/retry.ts";
import { logger } from "../helpers/logger.ts";
import { getSecret } from "../config.ts";
import type { AIProvider } from "../types.ts";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

type ChatMsg = {
  role: "system" | "user" | "assistant" | "tool" | "developer";
  content: unknown;
  name?: string;
  tool_call_id?: string;
  tool_calls?: unknown;
};

function getOpenAiKey(): string {
  const key = getSecret("OPENAI_API_KEY");
  if (!key) throw new ProviderNotConfiguredError("openai");
  return key;
}

function coerceMessages(
  opts: Record<string, unknown> | undefined,
  prompt: string,
): ChatMsg[] {
  const raw = opts?.messages;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .filter((m): m is ChatMsg => {
        if (!m || typeof m !== "object") return false;
        const r = (m as Record<string, unknown>).role;
        return (
          r === "system" ||
          r === "user" ||
          r === "assistant" ||
          r === "tool" ||
          r === "developer"
        );
      })
      .map((m) => {
        const rec = m as Record<string, unknown>;
        const out: ChatMsg = { role: rec.role as ChatMsg["role"], content: rec.content };
        if (typeof rec.name === "string") out.name = rec.name;
        if (typeof rec.tool_call_id === "string") {
          out.tool_call_id = rec.tool_call_id;
        }
        if (rec.tool_calls) out.tool_calls = rec.tool_calls;
        return out;
      });
  }
  return [{ role: "user", content: prompt }];
}

/**
 * Pre-flight validation. Catches malformed requests BEFORE they hit OpenAI
 * so the caller sees a clear ValidationError instead of a provider 400.
 */
function validatePayload(body: Record<string, unknown>): void {
  const problems: string[] = [];

  if (typeof body.model !== "string" || !body.model) {
    problems.push("`model` must be a non-empty string.");
  }

  const messages = body.messages as unknown;
  if (!Array.isArray(messages) || messages.length === 0) {
    problems.push("`messages` must be a non-empty array.");
  } else {
    messages.forEach((m, i) => {
      if (!m || typeof m !== "object") {
        problems.push(`messages[${i}] must be an object.`);
        return;
      }
      const rec = m as Record<string, unknown>;
      if (
        rec.role !== "system" &&
        rec.role !== "user" &&
        rec.role !== "assistant" &&
        rec.role !== "tool" &&
        rec.role !== "developer"
      ) {
        problems.push(
          `messages[${i}].role must be one of system|user|assistant|tool|developer.`,
        );
      }
      // content may be string OR content-parts array (vision / multimodal).
      // Tool messages MUST carry a tool_call_id.
      if (rec.role === "tool" && typeof rec.tool_call_id !== "string") {
        problems.push(`messages[${i}] (role=tool) requires tool_call_id.`);
      }
      const c = rec.content;
      const validContent =
        typeof c === "string" ||
        c === null ||
        Array.isArray(c) ||
        (rec.role === "assistant" && rec.tool_calls);
      if (!validContent) {
        problems.push(
          `messages[${i}].content must be string, null, or content-parts array.`,
        );
      }
    });
  }

  if (body.temperature !== undefined) {
    const t = body.temperature as number;
    if (typeof t !== "number" || t < 0 || t > 2) {
      problems.push("`temperature` must be a number between 0 and 2.");
    }
  }
  if (body.top_p !== undefined) {
    const p = body.top_p as number;
    if (typeof p !== "number" || p < 0 || p > 1) {
      problems.push("`top_p` must be a number between 0 and 1.");
    }
  }
  if (body.max_tokens !== undefined) {
    const n = body.max_tokens as number;
    if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
      problems.push("`max_tokens` must be a positive number.");
    }
  }
  if (body.max_completion_tokens !== undefined) {
    const n = body.max_completion_tokens as number;
    if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
      problems.push("`max_completion_tokens` must be a positive number.");
    }
  }
  if (body.response_format !== undefined) {
    const rf = body.response_format as Record<string, unknown> | null;
    if (!rf || typeof rf !== "object") {
      problems.push("`response_format` must be an object.");
    } else if (
      rf.type !== "text" &&
      rf.type !== "json_object" &&
      rf.type !== "json_schema"
    ) {
      problems.push(
        "`response_format.type` must be one of text|json_object|json_schema.",
      );
    } else if (rf.type === "json_schema") {
      const js = rf.json_schema as Record<string, unknown> | undefined;
      if (!js || typeof js !== "object") {
        problems.push(
          "`response_format.json_schema` is required when type=json_schema.",
        );
      } else if (typeof js.name !== "string" || !js.name) {
        problems.push(
          "`response_format.json_schema.name` must be a non-empty string.",
        );
      } else if (!js.schema || typeof js.schema !== "object") {
        problems.push(
          "`response_format.json_schema.schema` must be an object.",
        );
      }
    }
  }
  if (body.tools !== undefined) {
    if (!Array.isArray(body.tools)) {
      problems.push("`tools` must be an array.");
    } else {
      (body.tools as unknown[]).forEach((t, i) => {
        if (!t || typeof t !== "object") {
          problems.push(`tools[${i}] must be an object.`);
          return;
        }
        const rec = t as Record<string, unknown>;
        if (rec.type !== "function") {
          problems.push(`tools[${i}].type must be "function".`);
        }
        const fn = rec.function as Record<string, unknown> | undefined;
        if (!fn || typeof fn !== "object") {
          problems.push(`tools[${i}].function must be an object.`);
        } else if (typeof fn.name !== "string" || !fn.name) {
          problems.push(`tools[${i}].function.name must be a non-empty string.`);
        }
      });
    }
  }

  if (problems.length > 0) {
    throw new ValidationError(
      `Malformed OpenAI chat request: ${problems.join(" ")}`,
      { provider: "openai", endpoint: OPENAI_CHAT_URL, problems },
    );
  }
}

/**
 * Redact a payload for logging: strips large text content but preserves
 * shape so operators can see model, param types, tool names, and
 * response_format without leaking prompts or keys.
 */
function redactPayload(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...body };
  const messages = Array.isArray(body.messages) ? body.messages : [];
  out.messages = (messages as Array<Record<string, unknown>>).map((m) => ({
    role: m.role,
    contentType: Array.isArray(m.content)
      ? "parts"
      : m.content === null
      ? "null"
      : typeof m.content,
    contentLength: typeof m.content === "string" ? (m.content as string).length : undefined,
    has_tool_call_id: typeof m.tool_call_id === "string",
    has_tool_calls: Boolean(m.tool_calls),
  }));
  if (Array.isArray(body.tools)) {
    out.tools = (body.tools as Array<Record<string, unknown>>).map((t) => ({
      type: t.type,
      name: (t.function as Record<string, unknown> | undefined)?.name,
    }));
  }
  return out;
}

export const openAiChatProvider: AIProvider = {
  id: "openai",

  isConfigured() {
    return !!getSecret("OPENAI_API_KEY");
  },

  async execute({ task, model, prompt, options, signal }) {
    const apiKey = getOpenAiKey();
    const opts = (options ?? {}) as Record<string, unknown>;
    const messages = coerceMessages(opts, prompt);
    const chosenModel =
      model ?? (opts.model as string | undefined) ?? "gpt-4o-mini";

    const body: Record<string, unknown> = {
      model: chosenModel,
      messages,
    };

    // Pass-through of common OpenAI chat params if present.
    if (typeof opts.temperature === "number") body.temperature = opts.temperature;
    if (typeof opts.top_p === "number") body.top_p = opts.top_p;
    if (typeof opts.presence_penalty === "number") {
      body.presence_penalty = opts.presence_penalty;
    }
    if (typeof opts.frequency_penalty === "number") {
      body.frequency_penalty = opts.frequency_penalty;
    }
    if (typeof opts.max_tokens === "number") body.max_tokens = opts.max_tokens;
    if (typeof opts.max_completion_tokens === "number") {
      body.max_completion_tokens = opts.max_completion_tokens;
    }
    if (typeof opts.seed === "number") body.seed = opts.seed;
    if (typeof opts.user === "string") body.user = opts.user;
    if (opts.stop !== undefined) body.stop = opts.stop;
    if (typeof opts.parallel_tool_calls === "boolean") {
      body.parallel_tool_calls = opts.parallel_tool_calls;
    }
    if (opts.response_format && typeof opts.response_format === "object") {
      body.response_format = opts.response_format;
    }
    if (Array.isArray(opts.tools)) body.tools = opts.tools;
    if (opts.tool_choice !== undefined) body.tool_choice = opts.tool_choice;

    // Pre-flight validation — catch malformed requests before they hit OpenAI.
    validatePayload(body);

    logger.info({
      provider: "openai",
      task,
      message: "openai_chat_request",
      endpoint: OPENAI_CHAT_URL,
      model: chosenModel,
      msgCount: messages.length,
      hasTools: Array.isArray(body.tools),
      toolCount: Array.isArray(body.tools) ? (body.tools as unknown[]).length : 0,
      hasResponseFormat: Boolean(body.response_format),
      responseFormatType: (body.response_format as Record<string, unknown> | undefined)
        ?.type,
      hasToolChoice: body.tool_choice !== undefined,
      temperature: body.temperature,
      maxTokens: body.max_tokens ?? body.max_completion_tokens,
      payload: redactPayload(body),
    });

    const res = await withRetry(
      async () => {
        const r = await fetch(OPENAI_CHAT_URL, {
          method: "POST",
          signal,
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          // Try to parse the OpenAI error envelope:
          //   { error: { message, type, param, code } }
          let parsed: Record<string, unknown> | undefined;
          try {
            parsed = text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
          } catch {
            parsed = undefined;
          }
          const providerError =
            (parsed?.error as Record<string, unknown> | undefined) ?? undefined;
          const requestId = r.headers.get("x-request-id") ??
            r.headers.get("openai-request-id") ?? undefined;

          const details = {
            provider: "openai",
            endpoint: OPENAI_CHAT_URL,
            model: chosenModel,
            status: r.status,
            requestId,
            error: providerError ?? { message: text.slice(0, 2000) || r.statusText },
            payload: redactPayload(body),
          };

          const upstreamMessage = (providerError?.message as string | undefined) ??
            text.slice(0, 500) ??
            r.statusText;

          logger.warn({
            provider: "openai",
            task,
            message: "openai_chat_error",
            status: r.status,
            requestId,
            errorType: providerError?.type,
            errorCode: providerError?.code,
            errorParam: providerError?.param,
            errorMessage: upstreamMessage,
          });

          // 4xx (except 429) → surface provider error verbatim, do NOT retry.
          if (r.status >= 400 && r.status < 500 && r.status !== 429) {
            const bad = new ProviderBadRequestError(
              `OpenAI chat request failed (${r.status} ${
                providerError?.type ?? "invalid_request_error"
              }): ${upstreamMessage}`,
              details,
              r.status,
            );
            // deno-lint-ignore no-explicit-any
            (bad as any).__retryable = false;
            throw bad;
          }

          // 429 / 5xx — retryable upstream error.
          const err = new UpstreamError(
            `OpenAI chat request failed (${r.status}): ${upstreamMessage}`,
            details,
          );
          // deno-lint-ignore no-explicit-any
          (err as any).__retryable = true;
          throw err;
        }
        return r.json();
      },
      // deno-lint-ignore no-explicit-any
      { shouldRetry: (e) => Boolean((e as any)?.__retryable) },
    );

    // deno-lint-ignore no-explicit-any
    const content: string = (res as any)?.choices?.[0]?.message?.content ?? "";
    // deno-lint-ignore no-explicit-any
    const toolCalls = (res as any)?.choices?.[0]?.message?.tool_calls;
    if (!content && !toolCalls) {
      throw new UpstreamError("OpenAI returned an empty response.", {
        provider: "openai",
        endpoint: OPENAI_CHAT_URL,
        model: chosenModel,
      });
    }

    return {
      model: chosenModel,
      data: {
        content,
        tool_calls: toolCalls,
        // deno-lint-ignore no-explicit-any
        raw: { id: (res as any)?.id, usage: (res as any)?.usage },
      },
    };
  },
};
