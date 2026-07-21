/**
 * Constant-time verification for internal cron / scheduler endpoints.
 * Callers (pg_cron, external schedulers) must present the server-only
 * CRON_SECRET in the `x-cron-secret` header. The Supabase anon/publishable
 * key is intentionally NOT accepted — it ships in the client bundle.
 */

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function verifyCronRequest(request: Request): boolean {
  const expected = process.env.CRON_SECRET ?? "";
  if (!expected) return false;
  const provided = request.headers.get("x-cron-secret") ?? "";
  if (!provided) return false;
  return timingSafeEqualStr(provided, expected);
}

export function cronUnauthorizedResponse(): Response {
  return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
