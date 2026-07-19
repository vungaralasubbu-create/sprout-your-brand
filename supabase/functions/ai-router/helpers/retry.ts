import { CONFIG } from "../config.ts";

export interface RetryOpts {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
  /** Return true to retry. Defaults to retrying any thrown error. */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  signal?: AbortSignal;
}

/**
 * Exponential backoff with optional jitter. Used by provider modules for
 * upstream API calls; kept here so every provider retries the same way.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOpts = {},
): Promise<T> {
  const {
    maxAttempts = CONFIG.retry.maxAttempts,
    baseDelayMs = CONFIG.retry.baseDelayMs,
    maxDelayMs = CONFIG.retry.maxDelayMs,
    jitter = CONFIG.retry.jitter,
    shouldRetry = () => true,
    signal,
  } = opts;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt >= maxAttempts || !shouldRetry(err, attempt)) throw err;
      const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const delay = jitter ? Math.floor(exp * (0.5 + Math.random() / 2)) : exp;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/** Wraps a promise with a timeout that aborts via AbortController. */
export async function withTimeout<T>(
  ms: number,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}
