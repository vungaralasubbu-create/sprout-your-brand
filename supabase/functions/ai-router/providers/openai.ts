import {
  ProviderBadRequestError,
  ProviderNotConfiguredError,
  ProviderTaskUnsupportedError,
  UpstreamError,
} from "../errors.ts";
import { withRetry } from "../helpers/retry.ts";
import { logger } from "../helpers/logger.ts";
import {
  getOpenAiAuthHeader,
  getOpenAiSecretForAuth,
  OPENAI_RESPONSES_URL,
  readOpenAiError,
} from "./openai-diagnostics.ts";
import { buildResponsesBody } from "./openai-params.ts";
import type { AIProvider } from "../types.ts";

/** Extract plain text from an OpenAI Responses API payload. */
function extractText(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.length) {
    return payload.output_text;
  }
  const chunks: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const c of item?.content ?? []) {
      if (typeof c?.text === "string") chunks.push(c.text);
      else if (typeof c?.text?.value === "string") chunks.push(c.text.value);
    }
  }
  return chunks.join("").trim();
}

const SYSTEM_PROMPTS: Record<string, string> = {
  generate_blog:
    "You are an expert long-form editorial writer for Glintr, an EdTech platform. Write a well-structured, SEO-friendly blog post in Markdown with a compelling H1, clear H2/H3 sections, short paragraphs, and a concise conclusion. Do not include front-matter.",
};

export const openAiProvider: AIProvider = {
  id: "openai",

  isConfigured() {
    try {
      getOpenAiSecretForAuth();
      return true;
    } catch {
      return false;
    }
  },

  async execute({ task, model, prompt, options, signal }) {
    const { value: apiKey, diagnostics } = getOpenAiSecretForAuth();

    const system = SYSTEM_PROMPTS[task];
    if (!system) throw new ProviderTaskUnsupportedError("openai", task);

    const chosenModel = model ?? (options?.model as string | undefined) ?? "gpt-4o-mini";

    const { body, family } = buildResponsesBody({
      model: chosenModel,
      system,
      prompt,
      options: options as Record<string, unknown> | undefined,
    });

    logger.info({
      provider: "openai",
      task,
      message: "openai_request_normalized",
      model: chosenModel,
      family,
      params: Object.keys(body),
    });

    const authorization = getOpenAiAuthHeader(apiKey);

    logger.info({
      provider: "openai",
      task,
      message: "openai_secret_diagnostics",
      secretExists: diagnostics.secretExists,
      secretLength: diagnostics.secretLength,
      startsWith: diagnostics.startsWith,
      endsWith: diagnostics.endsWith,
      authorizationHeaderShape: diagnostics.authorizationHeaderShape,
    });

    const res = await withRetry(
      async () => {
        const r = await fetch(OPENAI_RESPONSES_URL, {
          method: "POST",
          signal,
          headers: {
            "content-type": "application/json",
            "authorization": authorization,
          },
          body: JSON.stringify(body),
        });

        if (!r.ok) {
          const openaiError = await readOpenAiError(r);
          const requestId = r.headers.get("x-request-id") ??
            r.headers.get("openai-request-id") ?? undefined;
          const details = {
            provider: "openai",
            endpoint: OPENAI_RESPONSES_URL,
            model: chosenModel,
            family,
            status: r.status,
            requestId,
            error: openaiError,
          };
          const upstreamMessage = openaiError.message || `OpenAI request failed (${r.status})`;

          logger.warn({
            provider: "openai",
            task,
            message: "openai_responses_error",
            status: r.status,
            requestId,
            errorType: openaiError.type,
            errorCode: openaiError.code,
            errorParam: openaiError.param,
            errorMessage: upstreamMessage,
          });

          // 4xx (except 429) — surface provider error verbatim, do NOT retry.
          if (r.status >= 400 && r.status < 500 && r.status !== 429) {
            const bad = new ProviderBadRequestError(
              `OpenAI request failed (${r.status} ${openaiError.type ?? "invalid_request_error"}): ${upstreamMessage}`,
              details,
              r.status,
            );
            (bad as any).__retryable = false;
            throw bad;
          }

          // 429 / 5xx — retryable upstream error.
          const err = new UpstreamError(upstreamMessage, details);
          (err as any).__retryable = true;
          throw err;
        }
        return r.json();
      },
      { shouldRetry: (e) => Boolean((e as any)?.__retryable) },
    );

    const content = extractText(res);
    if (!content) throw new UpstreamError("OpenAI returned an empty response.");

    return {
      model: chosenModel,
      data: { content, raw: { id: res?.id, usage: res?.usage } },
    };
  },
};
