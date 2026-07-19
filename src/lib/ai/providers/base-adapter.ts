/**
 * Shared adapter primitives — provider-agnostic HTTP client used by every
 * adapter. Each adapter provides its own `baseUrl` and `apiKey` at
 * construction; the client handles retries, timeouts, and error classification.
 *
 * No traffic is routed through the Lovable AI Gateway. Adapters call each
 * provider's native API directly (OpenAI-compatible endpoints for OpenAI,
 * native REST for Anthropic/Google via their own adapter helpers).
 */

import type { AdapterInit } from "./types";

export interface GatewayCallOpts {
  path: string;
  body: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code:
      | "rate_limited"
      | "payment_required"
      | "bad_request"
      | "unauthorized"
      | "upstream_error"
      | "timeout"
      | "network"
      | "not_configured",
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

function classify(status: number): { code: GatewayError["code"]; retryable: boolean } {
  if (status === 429) return { code: "rate_limited", retryable: true };
  if (status === 402) return { code: "payment_required", retryable: false };
  if (status === 401 || status === 403) return { code: "unauthorized", retryable: false };
  if (status >= 500) return { code: "upstream_error", retryable: true };
  return { code: "bad_request", retryable: false };
}

async function withTimeout<T>(
  ms: number,
  fn: (signal: AbortSignal) => Promise<T>,
  parent?: AbortSignal,
): Promise<T> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(new Error("timeout")), ms);
  if (parent) parent.addEventListener("abort", () => ctrl.abort(parent.reason));
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(to);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class GatewayClient {
  constructor(private readonly init: AdapterInit) {
    if (!init.baseUrl) {
      throw new GatewayError(
        "Adapter baseUrl is required — providers call their native API directly.",
        0,
        "not_configured",
        false,
      );
    }
  }

  get baseUrl(): string {
    return this.init.baseUrl as string;
  }

  private authHeaders(): Record<string, string> {
    const { apiKey, authHeader } = this.init;
    if (authHeader === "x-api-key") return { "x-api-key": apiKey };
    if (authHeader === "x-goog-api-key") return { "x-goog-api-key": apiKey };
    return { Authorization: `Bearer ${apiKey}` };
  }

  async call<T>(opts: GatewayCallOpts): Promise<T> {
    const timeout = opts.timeoutMs ?? this.init.requestTimeoutMs ?? 60_000;
    const maxRetries = opts.maxRetries ?? this.init.maxRetries ?? 2;
    let attempt = 0;
    let lastErr: unknown;

    while (attempt <= maxRetries) {
      try {
        return await withTimeout(
          timeout,
          async (signal) => {
            const res = await fetch(`${this.baseUrl}${opts.path}`, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                ...this.authHeaders(),
                ...(this.init.extraHeaders ?? {}),
                ...(opts.headers ?? {}),
              },
              body: JSON.stringify(opts.body),
              signal,
            });
            if (!res.ok) {
              const text = await res.text().catch(() => "");
              const { code, retryable } = classify(res.status);
              throw new GatewayError(
                `Provider ${res.status}: ${text.slice(0, 300)}`,
                res.status,
                code,
                retryable,
              );
            }
            return (await res.json()) as T;
          },
          opts.signal,
        );
      } catch (err) {
        lastErr = err;
        const retryable = err instanceof GatewayError ? err.retryable : true;
        if (!retryable || attempt >= maxRetries) break;
        await sleep(250 * Math.pow(2, attempt));
        attempt++;
      }
    }
    throw lastErr;
  }

  /** SSE stream reader for chat streaming. */
  async *stream(opts: GatewayCallOpts): AsyncIterable<string> {
    const timeout = opts.timeoutMs ?? this.init.requestTimeoutMs ?? 120_000;
    const res = await withTimeout(
      timeout,
      async (signal) =>
        fetch(`${this.baseUrl}${opts.path}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...this.authHeaders(),
            ...(this.init.extraHeaders ?? {}),
            ...(opts.headers ?? {}),
            accept: "text/event-stream",
          },
          body: JSON.stringify({ ...(opts.body as object), stream: true }),
          signal,
        }),
      opts.signal,
    );
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      const { code, retryable } = classify(res.status);
      throw new GatewayError(`Provider ${res.status}: ${text.slice(0, 300)}`, res.status, code, retryable);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;
        yield payload;
      }
    }
  }
}
