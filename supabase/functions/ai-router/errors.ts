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
