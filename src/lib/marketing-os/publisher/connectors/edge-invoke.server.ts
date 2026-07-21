// Server-only helper: invoke an existing platform edge function on behalf of
// an owner using the additive service-mode header on `_shared/meta/auth.ts`.
// Never called from client code.

export async function invokeEdgeAs(
  fnName: string,
  ownerId: string,
  body: Record<string, unknown>,
): Promise<{ status: number; json: unknown }> {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const dispatchSecret = process.env.INTERNAL_DISPATCH_SECRET;
  if (!url || !key) throw new Error("Supabase server env missing");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    "x-run-as-user-id": ownerId,
  };
  // Additive: send shared-secret so edge function can authenticate the
  // dispatcher even when the worker's SERVICE_ROLE key drifts from the
  // edge function's env at runtime.
  if (dispatchSecret) headers["x-internal-secret"] = dispatchSecret;
  const res = await fetch(`${url}/functions/v1/${fnName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: res.status, json: parsed };
}

export function classifyError(status: number, body: unknown): {
  code: "validation" | "network" | "expired_token" | "rate_limit" | "duplicate" | "platform" | "unknown";
  message: string;
  retryable: boolean;
} {
  const raw = typeof body === "object" && body && "error" in body ? String((body as { error: unknown }).error) : JSON.stringify(body);
  const msg = raw || `HTTP ${status}`;
  const lower = msg.toLowerCase();
  if (status === 401 || lower.includes("token") && lower.includes("expire")) return { code: "expired_token", message: msg, retryable: false };
  if (status === 429 || lower.includes("rate limit")) return { code: "rate_limit", message: msg, retryable: true };
  if (status >= 500) return { code: "network", message: msg, retryable: true };
  if (lower.includes("duplicate")) return { code: "duplicate", message: msg, retryable: false };
  if (status === 400) return { code: "validation", message: msg, retryable: false };
  return { code: "platform", message: msg, retryable: status >= 500 || status === 408 };
}
