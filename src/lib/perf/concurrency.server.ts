/**
 * Concurrency primitives for backend hot paths:
 * - Semaphore: cap parallel requests to an upstream (AI provider, DB).
 * - pLimit-style helper for map operations.
 * - Timeout + AbortSignal helpers.
 * Server-only. Per-worker isolate scope.
 */

export class Semaphore {
  private active = 0;
  private queue: Array<() => void> = [];
  constructor(private readonly max: number) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.max) {
      this.active++;
      return () => this.release();
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.active++;
    return () => this.release();
  }

  private release() {
    this.active = Math.max(0, this.active - 1);
    const next = this.queue.shift();
    if (next) next();
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }

  stats() {
    return { max: this.max, active: this.active, waiting: this.queue.length };
  }
}

const semaphores = new Map<string, Semaphore>();
export function namedSemaphore(name: string, max: number): Semaphore {
  const existing = semaphores.get(name);
  if (existing) return existing;
  const s = new Semaphore(max);
  semaphores.set(name, s);
  return s;
}
export function allSemaphoreStats() {
  return Array.from(semaphores.entries()).map(([name, s]) => ({ name, ...s.stats() }));
}

/** Bounded concurrency map — like p-limit(concurrency). */
export async function pMap<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, i: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Race a promise against a timeout without leaking. */
export function withTimeout<T>(p: Promise<T>, ms: number, label = "operation"): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Exponential backoff retry with jitter. */
export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: { retries?: number; baseMs?: number; maxMs?: number; shouldRetry?: (e: unknown) => boolean } = {},
): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.baseMs ?? 250;
  const cap = opts.maxMs ?? 4000;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;
      if (opts.shouldRetry && !opts.shouldRetry(e)) break;
      const delay = Math.min(cap, base * 2 ** attempt) * (0.5 + Math.random() * 0.5);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
