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
 *        presence_penalty, frequency_penalty, max_tokens }
 *  - Falls back to constructing `messages` from `input.prompt` when the
 *    caller does not supply an explicit array.
 *  - Returns { content } — the assistant message content as a plain string.
 *
 * Auth: uses the workspace-owned OPENAI_API_KEY (never Lovable API keys).
 */

import { ProviderNotConfiguredError, UpstreamError } from "../errors.ts";
import { withRetry } from "../helpers/retry.ts";
import { logger } from "../helpers/logger.ts";
import { getSecret } from "../config.ts";
import type { AIProvider } from "../types.ts";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

function getOpenAiKey(): string {
  const key = getSecret("OPENAI_API_KEY");
  if (!key) throw new ProviderNotConfiguredError("openai");
  return key;
}

function coerceMessages(opts: Record<string, unknown> | undefined, prompt: string): ChatMsg[] {
  const raw = opts?.messages;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .filter((m): m is ChatMsg => {
        if (!m || typeof m !== "object") return false;
        const r = (m as Record<string, unknown>).role;
        const c = (m as Record<string, unknown>).content;
        return (r === "system" || r === "user" || r === "assistant") && typeof c === "string";
      })
      .map((m) => ({ role: m.role, content: m.content }));
  }
  return [{ role: "user", content: prompt }];
}

export const openAiChatProvider: AIProvider = {
  id: "openai",

  isConfigured() {
    return !!getSecret("OPENAI_API_KEY");
  },

  async execute({ task, model, prompt, options, signal }) {
    const apiKey = getOpenAiKey();
    const messages = coerceMessages(options as Record<string, unknown> | undefined, prompt);
    const chosenModel =
      model ?? (options?.model as string | undefined) ?? "gpt-4o-mini";

    const body: Record<string, unknown> = {
      model: chosenModel,
      messages,
    };

    // Pass-through of common OpenAI chat params if present.
    const opts = (options ?? {}) as Record<string, unknown>;
    if (typeof opts.temperature === "number") body.temperature = opts.temperature;
    if (typeof opts.top_p === "number") body.top_p = opts.top_p;
    if (typeof opts.presence_penalty === "number") body.presence_penalty = opts.presence_penalty;
    if (typeof opts.frequency_penalty === "number") body.frequency_penalty = opts.frequency_penalty;
    if (typeof opts.max_tokens === "number") body.max_tokens = opts.max_tokens;
    if (opts.response_format && typeof opts.response_format === "object") {
      body.response_format = opts.response_format;
    }

    logger.info({
      provider: "openai",
      task,
      message: "openai_chat_request",
      model: chosenModel,
      msgCount: messages.length,
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
          const retryable = r.status === 429 || r.status >= 500;
          const err = new UpstreamError(
            `OpenAI chat request failed (${r.status}): ${text.slice(0, 300)}`,
            { provider: "openai", status: r.status },
          );
          // deno-lint-ignore no-explicit-any
          (err as any).__retryable = retryable;
          throw err;
        }
        return r.json();
      },
      // deno-lint-ignore no-explicit-any
      { shouldRetry: (e) => Boolean((e as any)?.__retryable) },
    );

    // deno-lint-ignore no-explicit-any
    const content: string = (res as any)?.choices?.[0]?.message?.content ?? "";
    if (!content) throw new UpstreamError("OpenAI returned an empty response.");

    return {
      model: chosenModel,
      // deno-lint-ignore no-explicit-any
      data: { content, raw: { id: (res as any)?.id, usage: (res as any)?.usage } },
    };
  },
};
