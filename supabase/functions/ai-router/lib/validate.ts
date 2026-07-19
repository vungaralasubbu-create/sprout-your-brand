/**
 * Request validation for the ai-router endpoint.
 *
 * Kept dependency-free (no zod) so the Edge Function cold-starts fast.
 */
export const SUPPORTED_TASKS = [
  "generate_blog",
  "generate_text",
  "summarize",
  "classify",
  "embed",
] as const;

export type SupportedTask = (typeof SUPPORTED_TASKS)[number];

export interface AiRouterRequest {
  task: SupportedTask;
  prompt: string;
  options: Record<string, unknown>;
  stream?: boolean;
  provider?: string;
  model?: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: string[] };

export function validateRequest(input: unknown): ValidationResult<AiRouterRequest> {
  const issues: string[] = [];
  if (!input || typeof input !== "object") {
    return { ok: false, issues: ["Body must be a JSON object"] };
  }
  const b = input as Record<string, unknown>;

  const task = b.task;
  if (typeof task !== "string" || task.length === 0) {
    issues.push("`task` is required and must be a non-empty string");
  } else if (!(SUPPORTED_TASKS as readonly string[]).includes(task)) {
    issues.push(
      `\`task\` must be one of: ${SUPPORTED_TASKS.join(", ")}`,
    );
  }

  const prompt = b.prompt;
  if (typeof prompt !== "string" || prompt.length === 0) {
    issues.push("`prompt` is required and must be a non-empty string");
  } else if (prompt.length > 32_000) {
    issues.push("`prompt` must be at most 32,000 characters");
  }

  let options: Record<string, unknown> = {};
  if (b.options !== undefined) {
    if (typeof b.options !== "object" || b.options === null || Array.isArray(b.options)) {
      issues.push("`options` must be an object when provided");
    } else {
      options = b.options as Record<string, unknown>;
    }
  }

  const stream = b.stream;
  if (stream !== undefined && typeof stream !== "boolean") {
    issues.push("`stream` must be a boolean when provided");
  }

  const provider = b.provider;
  if (provider !== undefined && typeof provider !== "string") {
    issues.push("`provider` must be a string when provided");
  }

  const model = b.model;
  if (model !== undefined && typeof model !== "string") {
    issues.push("`model` must be a string when provided");
  }

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    value: {
      task: task as SupportedTask,
      prompt: prompt as string,
      options,
      stream: stream as boolean | undefined,
      provider: provider as string | undefined,
      model: model as string | undefined,
    },
  };
}
