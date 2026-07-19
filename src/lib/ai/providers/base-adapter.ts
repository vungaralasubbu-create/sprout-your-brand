/**
 * Shared adapter primitives:
 *  - Lovable AI Gateway transport (fetch wrapper)
 *  - Retry with exponential backoff (only on 429 / 5xx)
 *  - Per-attempt timeout
 *
 * Every provider adapter routes chat/embedding/image calls through the
 * Lovable AI Gateway (`ai.gateway.lovable.dev`). The gateway is OpenAI-
 * compatible, so we build one HTTP client here and let each adapter map
 * its own request/response shapes on top.
 */

import type { AdapterInit } from "./types";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

export interface GatewayCallOpts {
  path: string;
  body: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRetries?: number;
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
      | "network",
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
  constructor(private readonly init: AdapterInit) {}

  get baseUrl(): string {
    return this.init.baseUrl ?? GATEWAY_URL;
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
                Authorization: `Bearer ${this.init.apiKey}`,
              },
              body: JSON.stringify(opts.body),
              signal,
            });
            if (!res.ok) {
              const text = await res.text().catch(() => "");
              const { code, retryable } = classify(res.status);
              throw new GatewayError(
                `Gateway ${res.status}: ${text.slice(0, 300)}`,
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
        await sleep(250 * Math.pow(2, attempt)); // 250ms, 500ms, 1s...
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
            Authorization: `Bearer ${this.init.apiKey}`,
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
      throw new GatewayError(`Gateway ${res.status}: ${text.slice(0, 300)}`, res.status, code, retryable);
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
