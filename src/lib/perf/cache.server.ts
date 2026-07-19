/**
 * In-memory LRU + TTL cache with single-flight stampede protection.
 * Server-only. Per-worker instance (Cloudflare Workers isolate scope).
 *
 * Designed for hot read-through paths: prompt registry, provider health
 * snapshots, knowledge chunks, feature flags, role lookups, etc.
 */

type Entry<V> = { value: V; expiresAt: number; size: number };

export interface LruTtlCacheOptions {
  /** Maximum number of entries retained. */
  maxEntries?: number;
  /** Default TTL in ms for entries that don't override it. */
  defaultTtlMs?: number;
  /** Optional label for health/metrics. */
  name?: string;
}

export class LruTtlCache<K, V> {
  private map = new Map<K, Entry<V>>();
  private inflight = new Map<K, Promise<V>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  readonly name: string;
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;

  constructor(opts: LruTtlCacheOptions = {}) {
    this.name = opts.name ?? "cache";
    this.maxEntries = opts.maxEntries ?? 1000;
    this.defaultTtlMs = opts.defaultTtlMs ?? 60_000;
  }

  get(key: K): V | undefined {
    const e = this.map.get(key);
    if (!e) {
      this.misses++;
      return undefined;
    }
    if (e.expiresAt <= Date.now()) {
      this.map.delete(key);
      this.misses++;
      return undefined;
    }
    // Refresh LRU recency.
    this.map.delete(key);
    this.map.set(key, e);
    this.hits++;
    return e.value;
  }

  set(key: K, value: V, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt, size: 1 });
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
      this.evictions++;
    }
  }

  delete(key: K): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
    this.inflight.clear();
  }

  /**
   * Read-through with single-flight: concurrent callers for the same key
   * share one loader invocation and one round-trip to the source.
   */
  async getOrLoad(key: K, loader: () => Promise<V>, ttlMs?: number): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const existing = this.inflight.get(key);
    if (existing) return existing;
    const p = (async () => {
      try {
        const v = await loader();
        this.set(key, v, ttlMs);
        return v;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, p);
    return p;
  }

  stats() {
    const total = this.hits + this.misses;
    return {
      name: this.name,
      entries: this.map.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: total === 0 ? 0 : this.hits / total,
    };
  }
}

/** Named global caches — reuse across handlers instead of re-allocating. */
const globalCaches = new Map<string, LruTtlCache<unknown, unknown>>();

export function namedCache<K, V>(name: string, opts?: LruTtlCacheOptions): LruTtlCache<K, V> {
  const existing = globalCaches.get(name) as LruTtlCache<K, V> | undefined;
  if (existing) return existing;
  const c = new LruTtlCache<K, V>({ ...opts, name });
  globalCaches.set(name, c as LruTtlCache<unknown, unknown>);
  return c;
}

export function allCacheStats() {
  return Array.from(globalCaches.values()).map((c) => c.stats());
}
