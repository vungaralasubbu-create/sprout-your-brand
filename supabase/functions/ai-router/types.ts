import type { ProviderId, TaskType } from "./config.ts";

export interface AIRouterRequest {
  task: TaskType;
  provider?: ProviderId;
  model?: string;
  prompt: string;
  options?: Record<string, unknown>;
  stream?: boolean;
}

export interface AIRouterSuccess<T = unknown> {
  success: true;
  provider: ProviderId | null;
  task: TaskType | null;
  message?: string;
  data?: T;
  meta?: {
    requestId: string;
    executionMs: number;
    model?: string;
  };
}

export interface AIRouterError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    executionMs: number;
  };
}

export type AIRouterResponse<T = unknown> = AIRouterSuccess<T> | AIRouterError;

/**
 * Provider contract. Every provider module implements this shape so the
 * router can dispatch tasks uniformly. Providers may implement only a
 * subset of tasks; unsupported tasks throw ProviderTaskUnsupportedError.
 */
export interface AIProvider {
  readonly id: ProviderId;

  /** True when required secrets are present. Never throws. */
  isConfigured(): boolean;

  /**
   * Execute a task. For now, providers return placeholder responses so
   * the pipeline can be exercised end-to-end without incurring API costs.
   */
  execute(input: {
    task: TaskType;
    model?: string;
    prompt: string;
    options?: Record<string, unknown>;
    signal?: AbortSignal;
  }): Promise<{ data: unknown; model?: string }>;
}
