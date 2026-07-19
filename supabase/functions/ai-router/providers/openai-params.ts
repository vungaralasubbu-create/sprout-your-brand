/**
 * Centralized OpenAI Responses API parameter normalization.
 *
 * Different OpenAI model families accept different parameters. This module
 * classifies models and builds a request body containing only supported
 * parameters, silently dropping unsupported ones instead of failing.
 */

export type ModelFamily = "reasoning" | "chat";

/**
 * Reasoning-class models (GPT-5.x, o-series, future reasoning models):
 * - Do NOT accept `temperature`, `top_p`, `presence_penalty`, `frequency_penalty`.
 * - Use `max_output_tokens` (Responses API) — same field name; kept.
 * - Accept optional `reasoning: { effort }` and `text: { verbosity }`.
 */
export function classifyModel(model: string): ModelFamily {
  const m = model.toLowerCase();
  if (
    m.startsWith("gpt-5") ||
    m.startsWith("o1") ||
    m.startsWith("o3") ||
    m.startsWith("o4")
  ) {
    return "reasoning";
  }
  return "chat";
}

export interface NormalizedInputs {
  model: string;
  system: string;
  prompt: string;
  options?: Record<string, unknown>;
}

/**
 * Build a Responses API request body for the given model, keeping only
 * parameters supported by that model family.
 */
export function buildResponsesBody({ model, system, prompt, options }: NormalizedInputs) {
  const family = classifyModel(model);
  const opts = options ?? {};

  const body: Record<string, unknown> = {
    model,
    input: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    max_output_tokens: (opts.max_output_tokens as number) ?? 2000,
  };

  if (family === "chat") {
    // GPT-4o / 4.1 / 4o-mini and similar chat models support sampling params.
    body.temperature = (opts.temperature as number) ?? 0.7;
    if (typeof opts.top_p === "number") body.top_p = opts.top_p;
    if (typeof opts.presence_penalty === "number") body.presence_penalty = opts.presence_penalty;
    if (typeof opts.frequency_penalty === "number") body.frequency_penalty = opts.frequency_penalty;
  } else {
    // Reasoning models: only pass reasoning-family knobs when explicitly provided.
    const effort = opts.reasoning_effort ?? (opts.reasoning as any)?.effort;
    if (effort) body.reasoning = { effort };
    const verbosity = opts.verbosity ?? (opts.text as any)?.verbosity;
    if (verbosity) body.text = { verbosity };
  }

  return { body, family };
}
