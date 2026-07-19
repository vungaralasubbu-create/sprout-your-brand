import { getSecret } from "../config.ts";
import { ProviderNotConfiguredError, ProviderTaskUnsupportedError, UpstreamError } from "../errors.ts";
import { withRetry } from "../helpers/retry.ts";
import type { AIProvider } from "../types.ts";

const RESPONSES_URL = "https://api.openai.com/v1/responses";

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
    return Boolean(getSecret("OPENAI_API_KEY"));
  },

  async execute({ task, model, prompt, options, signal }) {
    const apiKey = getSecret("OPENAI_API_KEY");
    if (!apiKey) throw new ProviderNotConfiguredError("openai");

    const system = SYSTEM_PROMPTS[task];
    if (!system) throw new ProviderTaskUnsupportedError("openai", task);

    const chosenModel = model ?? (options?.model as string | undefined) ?? "gpt-4o-mini";

    const body = {
      model: chosenModel,
      input: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_output_tokens: (options?.max_output_tokens as number) ?? 2000,
      temperature: (options?.temperature as number) ?? 0.7,
    };

    const res = await withRetry(
      async () => {
        const r = await fetch(RESPONSES_URL, {
          method: "POST",
          signal,
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!r.ok) {
          const text = await r.text().catch(() => "");
          // Retry on transient upstream errors; fail fast on 4xx (except 429).
          const retryable = r.status === 429 || r.status >= 500;
          const err = new UpstreamError(
            `OpenAI request failed (${r.status})`,
            { status: r.status, body: text.slice(0, 500) },
          );
          (err as any).__retryable = retryable;
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
