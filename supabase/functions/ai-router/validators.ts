import { CONFIG, type ProviderId, type TaskType } from "./config.ts";
import { ValidationError } from "./errors.ts";
import type { AIRouterRequest } from "./types.ts";

function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function validateRequest(body: unknown): AIRouterRequest {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;

  // task
  if (!isString(b.task)) throw new ValidationError("'task' is required.");
  if (!(CONFIG.tasks as readonly string[]).includes(b.task)) {
    throw new ValidationError(
      `Unsupported task '${b.task}'.`,
      { supported: CONFIG.tasks },
    );
  }
  const task = b.task as TaskType;

  // prompt
  if (!isString(b.prompt) || b.prompt.trim().length === 0) {
    throw new ValidationError("'prompt' must be a non-empty string.");
  }
  if (b.prompt.length > CONFIG.maxPromptChars) {
    throw new ValidationError(
      `'prompt' exceeds max length of ${CONFIG.maxPromptChars} chars.`,
    );
  }

  // provider (optional; router may pick a default)
  let provider: ProviderId | undefined;
  if (b.provider !== undefined) {
    if (!isString(b.provider)) throw new ValidationError("'provider' must be a string.");
    if (!(CONFIG.providers as readonly string[]).includes(b.provider)) {
      throw new ValidationError(
        `Unsupported provider '${b.provider}'.`,
        { supported: CONFIG.providers },
      );
    }
    provider = b.provider as ProviderId;
  }

  // model (optional)
  if (b.model !== undefined && !isString(b.model)) {
    throw new ValidationError("'model' must be a string when provided.");
  }

  // options (optional)
  if (b.options !== undefined && (typeof b.options !== "object" || b.options === null || Array.isArray(b.options))) {
    throw new ValidationError("'options' must be an object when provided.");
  }

  // stream (optional, reserved for future use)
  if (b.stream !== undefined && typeof b.stream !== "boolean") {
    throw new ValidationError("'stream' must be a boolean when provided.");
  }

  return {
    task,
    provider,
    model: b.model as string | undefined,
    prompt: b.prompt as string,
    options: (b.options as Record<string, unknown> | undefined) ?? {},
    stream: (b.stream as boolean | undefined) ?? false,
  };
}
