/**
 * Unified health registry for backend services.
 * Each service registers a probe returning latency + status.
 * Consumed by /api/public/health and internal dashboards.
 */

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthResult {
  status: HealthStatus;
  latencyMs: number;
  details?: Record<string, unknown>;
  error?: string;
}

export type HealthProbe = () => Promise<Omit<HealthResult, "latencyMs">>;

const probes = new Map<string, HealthProbe>();

export function registerHealthProbe(name: string, probe: HealthProbe): void {
  probes.set(name, probe);
}

export async function runHealthProbe(name: string): Promise<HealthResult> {
  const probe = probes.get(name);
  if (!probe) {
    return { status: "unhealthy", latencyMs: 0, error: `unknown probe: ${name}` };
  }
  const start = Date.now();
  try {
    const r = await Promise.race([
      probe(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("probe timeout")), 5000)),
    ]);
    return { ...r, latencyMs: Date.now() - start };
  } catch (e) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function runAllHealthProbes(): Promise<Record<string, HealthResult>> {
  const names = Array.from(probes.keys());
  const results = await Promise.all(names.map((n) => runHealthProbe(n)));
  const out: Record<string, HealthResult> = {};
  names.forEach((n, i) => (out[n] = results[i]));
  return out;
}

export function listRegisteredProbes(): string[] {
  return Array.from(probes.keys());
}

export function overallStatus(results: Record<string, HealthResult>): HealthStatus {
  const statuses = Object.values(results).map((r) => r.status);
  if (statuses.some((s) => s === "unhealthy")) return "unhealthy";
  if (statuses.some((s) => s === "degraded")) return "degraded";
  return "healthy";
}
