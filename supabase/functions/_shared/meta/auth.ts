// Authenticated Supabase clients for Meta edge functions.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export function getAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase env not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getUserFromRequest(req: Request): Promise<{ id: string } | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);

  // Additive: internal server-side dispatcher (Publishing Engine) may run as
  // an arbitrary owner by presenting the service-role JWT plus the target
  // user id header. Legacy user-token path below is unchanged.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const runAs = req.headers.get("x-run-as-user-id");
  if (serviceKey && token === serviceKey && runAs && /^[0-9a-f-]{36}$/i.test(runAs)) {
    return { id: runAs };
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !anon) return null;
  const client = createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id };
}
