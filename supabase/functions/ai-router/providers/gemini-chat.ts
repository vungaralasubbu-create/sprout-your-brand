/**
 * Gemini chat provider for the AI Router.
 *
 * Powers the `chat` task when the requested model is a Google Gemini
 * model (e.g. "gemini-2.5-flash", "google/gemini-2.5-flash"). Uses the
 * public Generative Language REST API and returns the assistant content
 * as a plain string, mirroring the OpenAI chat provider's contract so
 * the router can dispatch to either provider uniformly.
 *
 * Auth: GEMINI_API_KEY (workspace-owned).
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

type ChatMsg = {
  role: "system" | "user" | "assistant" | "tool" | "developer";
  content: unknown;
};

function getKey(): string {
  const key = getSecret("GEMINI_API_KEY");
  if (!key) throw new ProviderNotConfiguredError("gemini");
  return key;
}

/** Strip vendor prefix. `google/gemini-2.5-flash` -> `gemini-2.5-flash`. */
function normalizeModel(model: string): string {
  return model.replace(/^google\//i, "").trim();
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

export const geminiChatProvider: AIProvider = {
  id: "gemini",

  isConfigured() {
    return !!getSecret("GEMINI_API_KEY");
  },

  async execute({ task, model, prompt, options, signal }) {
    const apiKey = getKey();
    const opts = (options ?? {}) as Record<string, unknown>;
    const messages = coerceMessages(opts, prompt);
    const chosenModel = normalizeModel(
      model ?? (opts.model as string | undefined) ?? "gemini-2.5-flash",
    );

    // Convert chat messages to Gemini's `contents` + `systemInstruction`.
    const systemParts: string[] = [];
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
    for (const m of messages) {
      const text = contentToString(m.content);
      if (!text) continue;
      if (m.role === "system" || m.role === "developer") {
        systemParts.push(text);
      } else if (m.role === "assistant") {
        contents.push({ role: "model", parts: [{ text }] });
      } else {
        // user / tool — treat as user turn
        contents.push({ role: "user", parts: [{ text }] });
      }
    }
    if (contents.length === 0) {
      throw new ProviderBadRequestError(
        "Gemini chat requires at least one non-system message.",
        { provider: "gemini", model: chosenModel },
      );
    }

    const generationConfig: Record<string, unknown> = {};
    if (typeof opts.temperature === "number") generationConfig.temperature = opts.temperature;
    if (typeof opts.top_p === "number") generationConfig.topP = opts.top_p;
    if (typeof opts.max_tokens === "number") generationConfig.maxOutputTokens = opts.max_tokens;
    if (typeof opts.max_completion_tokens === "number") {
      generationConfig.maxOutputTokens = opts.max_completion_tokens;
    }
    const rf = opts.response_format as Record<string, unknown> | undefined;
    if (rf?.type === "json_object") generationConfig.responseMimeType = "application/json";

    const body: Record<string, unknown> = { contents };
    if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;
    if (systemParts.length > 0) {
      body.systemInstruction = { role: "system", parts: [{ text: systemParts.join("\n\n") }] };
    }

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chosenModel)}:generateContent`;

    logger.info({
      provider: "gemini",
      task,
      message: "gemini_chat_request",
      endpoint,
      model: chosenModel,
      msgCount: contents.length,
      hasSystem: systemParts.length > 0,
      responseMimeType: generationConfig.responseMimeType,
    });

    const res = await withRetry(
      async () => {
        const r = await fetch(endpoint, {
          method: "POST",
          signal,
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          let parsed: Record<string, unknown> | undefined;
          try {
            parsed = text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
          } catch { /* ignore */ }
          const err = (parsed?.error as Record<string, unknown> | undefined);
          const msg = (err?.message as string | undefined) ?? text.slice(0, 500);
          if (r.status >= 400 && r.status < 500) {
            throw new ProviderBadRequestError(
              `Gemini ${r.status}: ${msg}`,
              { provider: "gemini", endpoint, model: chosenModel, upstream: parsed ?? text },
              r.status,
            );
          }
          throw new UpstreamError(`Gemini ${r.status}: ${msg}`, {
            provider: "gemini",
            endpoint,
            model: chosenModel,
          });
        }
        return r;
      },
      {
        signal,
        shouldRetry: (err) => {
          if (err instanceof ProviderBadRequestError) return false;
          return true;
        },
      },
    );

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const content =
      json?.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? "").join("") ?? "";

    return { data: { content }, model: chosenModel };
  },
};
