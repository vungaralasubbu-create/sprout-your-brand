// connect-meta: returns a Meta OAuth authorization URL for the caller.
// Requires an authenticated caller. State encodes user_id + nonce (signed with app secret).
import {
  META_DEFAULT_SCOPES,
  META_OAUTH,
  getRedirectUri,
  json,
  preflight,
  requireEnv,
} from "../_shared/meta/meta.ts";
import { getUserFromRequest } from "../_shared/meta/auth.ts";

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  let s = "";
  for (const b of sig) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function buildState(userId: string, brandId: string | null): Promise<string> {
  const secret = requireEnv("META_APP_SECRET");
  const payload = {
    u: userId,
    b: brandId,
    n: crypto.randomUUID(),
    t: Date.now(),
  };
  const body = btoa(JSON.stringify(payload))
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const sig = await sign(body, secret);
  return `${body}.${sig}`;
}

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Unauthorized" }, { status: 401 });

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const brandId = (body as { brand_id?: string })?.brand_id ?? null;
    const scopes = (body as { scopes?: string })?.scopes ?? META_DEFAULT_SCOPES;

    const state = await buildState(user.id, brandId);
    const url = new URL(META_OAUTH);
    url.searchParams.set("client_id", requireEnv("META_APP_ID"));
    url.searchParams.set("redirect_uri", getRedirectUri());
    url.searchParams.set("state", state);
    url.searchParams.set("scope", scopes);
    url.searchParams.set("response_type", "code");
    return json({ authorize_url: url.toString(), state });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
