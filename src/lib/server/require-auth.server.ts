// Lightweight server-route auth helper. Verifies the caller's Supabase
// session (Bearer JWT in the Authorization header) and optionally checks
// an admin role. Returns the userId on success, or a Response to return
// directly on failure.
import { createClient } from "@supabase/supabase-js";

type Ok = { ok: true; userId: string; token: string };
type Fail = { ok: false; response: Response };

function getBearer(request: Request): string | null {
  const h = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function requireAuthedUser(request: Request): Promise<Ok | Fail> {
  const token = getBearer(request);
  if (!token) return { ok: false, response: new Response("Unauthorized", { status: 401 }) };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { ok: false, response: new Response("Auth not configured", { status: 500 }) };

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { ok: false, response: new Response("Unauthorized", { status: 401 }) };
  return { ok: true, userId: data.user.id, token };
}

export async function requireAdmin(request: Request): Promise<Ok | Fail> {
  const auth = await requireAuthedUser(request);
  if (!auth.ok) return auth;
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${auth.token}` } },
  });
  const { data, error } = await supabase.rpc("is_admin", { _user_id: auth.userId });
  if (error || !data) return { ok: false, response: new Response("Forbidden", { status: 403 }) };
  return auth;
}
