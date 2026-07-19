/**
 * Request coalescer / micro-batcher.
 * Groups per-key requests fired within a small window into one upstream
 * call. Ideal for embedding batches, DB lookups by id, and RAG retrievals.
 */

export interface BatcherOptions<K, V> {
  /** Max items per batch. */
  maxBatch?: number;
  /** Max wait before flushing a partial batch (ms). */
  windowMs?: number;
  /** Bulk resolver — must return values in the same order as keys. */
  resolver: (keys: K[]) => Promise<V[]>;
}

export class Batcher<K, V> {
  private pending: { key: K; resolve: (v: V) => void; reject: (e: unknown) => void }[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly maxBatch: number;
  private readonly windowMs: number;
  private readonly resolver: (keys: K[]) => Promise<V[]>;

  constructor(opts: BatcherOptions<K, V>) {
    this.maxBatch = opts.maxBatch ?? 32;
    this.windowMs = opts.windowMs ?? 8;
    this.resolver = opts.resolver;
  }

  load(key: K): Promise<V> {
    return new Promise<V>((resolve, reject) => {
      this.pending.push({ key, resolve, reject });
      if (this.pending.length >= this.maxBatch) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.windowMs);
      }
    });
  }

  private async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const batch = this.pending;
    if (batch.length === 0) return;
    this.pending = [];
    try {
      const values = await this.resolver(batch.map((b) => b.key));
      batch.forEach((b, i) => b.resolve(values[i]));
    } catch (e) {
      batch.forEach((b) => b.reject(e));
    }
  }
}
