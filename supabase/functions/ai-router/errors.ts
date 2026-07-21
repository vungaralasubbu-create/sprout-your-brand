export class AIRouterHttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AIRouterHttpError";
  }
}

export class ValidationError extends AIRouterHttpError {
  constructor(message: string, details?: unknown) {
    super(400, "validation_error", message, details);
    this.name = "ValidationError";
  }
}

export class ProviderNotConfiguredError extends AIRouterHttpError {
  constructor(provider: string) {
    super(
      503,
      "provider_not_configured",
      `Provider '${provider}' is not configured. Set its API key in Supabase Secrets.`,
    );
    this.name = "ProviderNotConfiguredError";
  }
}

export class ProviderSecretMalformedError extends AIRouterHttpError {
  constructor(provider: string, reasons: string[], diagnostics?: unknown) {
    super(
      503,
      "provider_secret_malformed",
      `Provider '${provider}' API key is malformed: ${reasons.join(" ")}`,
      diagnostics,
    );
    this.name = "ProviderSecretMalformedError";
  }
}

export class ProviderTaskUnsupportedError extends AIRouterHttpError {
  constructor(provider: string, task: string) {
    super(
      422,
      "task_unsupported_by_provider",
      `Provider '${provider}' does not support task '${task}'.`,
    );
    this.name = "ProviderTaskUnsupportedError";
  }
}

export class UpstreamTimeoutError extends AIRouterHttpError {
  constructor(ms: number) {
    super(504, "upstream_timeout", `Upstream request exceeded ${ms}ms.`);
    this.name = "UpstreamTimeoutError";
  }
}

export class UpstreamError extends AIRouterHttpError {
  constructor(message: string, details?: unknown) {
    super(502, "upstream_error", message, details);
    this.name = "UpstreamError";
  }
}

/**
 * Provider returned a non-retryable client error (4xx). The router surfaces
 * it verbatim to the caller so the exact validation error from OpenAI /
 * Anthropic / Gemini is visible instead of being hidden behind a 502.
 * Preserves the upstream HTTP status where possible (falls back to 400).
 */
export class ProviderBadRequestError extends AIRouterHttpError {
  constructor(
    message: string,
    details?: unknown,
    status: number = 400,
  ) {
    // Only allow 4xx to pass through; clamp anything else to 400.
    const s = status >= 400 && status < 500 ? status : 400;
    super(s, "provider_bad_request", message, details);
    this.name = "ProviderBadRequestError";
  }
}

