/**
 * Anthropic (Claude) chat provider for the AI Router.
 *
 * Powers the `chat` task when the requested model is an Anthropic
 * Claude model (e.g. "claude-3-5-sonnet-latest",
 * "anthropic/claude-3-5-sonnet-latest"). Uses the public Messages API
 * and returns the assistant content as a plain string, mirroring the
 * OpenAI chat provider's contract.
 *
 * Auth: ANTHROPIC_API_KEY (workspace-owned).
 */

import {
  ProviderBadRequestError,
  ProviderNotConfiguredError,
  UpstreamError,
} from "../errors.ts";
import { withRetry } from "../helpers/retry.ts";
import { logger } from "../helpers/logger.ts";
import { getSecret } from "../config.ts";
import type { AIProvider } from "../types.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

type ChatMsg = {
  role: "system" | "user" | "assistant" | "tool" | "developer";
  content: unknown;
};

function getKey(): string {
  const key = getSecret("ANTHROPIC_API_KEY");
  if (!key) throw new ProviderNotConfiguredError("anthropic");
  return key;
}

function normalizeModel(model: string): string {
  return model.replace(/^anthropic\//i, "").trim();
}

function contentToString(c: unknown): string {
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          const p = part as Record<string, unknown>;
          if (typeof p.text === "string") return p.text;
        }
        return "";
      })
      .join("");
  }
  return "";
}

function coerceMessages(
  opts: Record<string, unknown> | undefined,
  prompt: string,
): ChatMsg[] {
  const raw = opts?.messages;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.filter((m): m is ChatMsg => !!m && typeof m === "object") as ChatMsg[];
  }
  return [{ role: "user", content: prompt }];
}

export const anthropicChatProvider: AIProvider = {
  id: "anthropic",

  isConfigured() {
    return !!getSecret("ANTHROPIC_API_KEY");
  },

  async execute({ task, model, prompt, options, signal }) {
    const apiKey = getKey();
    const opts = (options ?? {}) as Record<string, unknown>;
    const messages = coerceMessages(opts, prompt);
    const chosenModel = normalizeModel(
      model ?? (opts.model as string | undefined) ?? "claude-3-5-sonnet-latest",
    );

    const systemParts: string[] = [];
    const anthMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (const m of messages) {
      const text = contentToString(m.content);
      if (!text) continue;
      if (m.role === "system" || m.role === "developer") systemParts.push(text);
      else if (m.role === "assistant") anthMessages.push({ role: "assistant", content: text });
      else anthMessages.push({ role: "user", content: text });
    }
    if (anthMessages.length === 0) {
      throw new ProviderBadRequestError(
        "Anthropic chat requires at least one non-system message.",
        { provider: "anthropic", model: chosenModel },
      );
    }

    const body: Record<string, unknown> = {
      model: chosenModel,
      messages: anthMessages,
      max_tokens:
        (typeof opts.max_tokens === "number" && opts.max_tokens) ||
        (typeof opts.max_completion_tokens === "number" && opts.max_completion_tokens) ||
        4096,
    };
    if (systemParts.length > 0) body.system = systemParts.join("\n\n");
    if (typeof opts.temperature === "number") body.temperature = opts.temperature;
    if (typeof opts.top_p === "number") body.top_p = opts.top_p;
    if (opts.stop !== undefined) body.stop_sequences = Array.isArray(opts.stop) ? opts.stop : [opts.stop];

    logger.info({
      provider: "anthropic",
      task,
      message: "anthropic_chat_request",
      endpoint: ANTHROPIC_URL,
      model: chosenModel,
      msgCount: anthMessages.length,
      hasSystem: systemParts.length > 0,
    });

    const res = await withRetry(
      async () => {
        const r = await fetch(ANTHROPIC_URL, {
          method: "POST",
          signal,
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": ANTHROPIC_VERSION,
          },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          let parsed: Record<string, unknown> | undefined;
          try {
            parsed = text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
          } catch { /* ignore */ }
          const err = parsed?.error as Record<string, unknown> | undefined;
          const msg = (err?.message as string | undefined) ?? text.slice(0, 500);
          if (r.status >= 400 && r.status < 500) {
            throw new ProviderBadRequestError(
              `Anthropic ${r.status}: ${msg}`,
              { provider: "anthropic", endpoint: ANTHROPIC_URL, model: chosenModel, upstream: parsed ?? text },
              r.status,
            );
          }
          throw new UpstreamError(`Anthropic ${r.status}: ${msg}`, {
            provider: "anthropic",
            endpoint: ANTHROPIC_URL,
            model: chosenModel,
          });
        }
        return r;
      },
      {
        signal,
        shouldRetry: (err) => !(err instanceof ProviderBadRequestError),
      },
    );

    const json = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const content =
      json?.content?.map((p) => (p?.type === "text" ? p.text ?? "" : "")).join("") ?? "";

    return { data: { content }, model: chosenModel };
  },
};
