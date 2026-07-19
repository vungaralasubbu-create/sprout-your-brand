/**
 * Retry with full-jitter exponential backoff.
 *
 * Used by provider adapters when calling upstream AI APIs. Aborts immediately
 * when the supplied AbortSignal fires (e.g. request timeout).
 */
export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  signal?: AbortSignal;
  isRetryable?: (err: unknown) => boolean;
  onRetry?: (attempt: number, err: unknown, delayMs: number) => void;
}

const defaultIsRetryable = (err: unknown): boolean => {
  if (err instanceof Error) {
    // Network errors / 5xx / 429 signalled via HttpError below.
    if ((err as { status?: number }).status !== undefined) {
      const s = (err as { status: number }).status;
      return s === 429 || (s >= 500 && s < 600);
    }
    return true;
  }
  return false;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.baseDelayMs ?? 250;
  const max = opts.maxDelayMs ?? 4_000;
  const isRetryable = opts.isRetryable ?? defaultIsRetryable;

  let attempt = 0;
  // Attempt 0 is the initial try; up to `retries` additional attempts.
  for (;;) {
    if (opts.signal?.aborted) throw new Error("aborted");
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const expo = Math.min(max, base * 2 ** attempt);
      const delay = Math.floor(Math.random() * expo); // full jitter
      opts.onRetry?.(attempt + 1, err, delay);
      await sleep(delay, opts.signal);
      attempt++;
    }
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error("aborted"));
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new Error("aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = "HttpError";
  }
}
