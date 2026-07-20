// connect-linkedin: returns a LinkedIn OAuth authorization URL for the caller.
import {
  LI_AUTH,
  LI_DEFAULT_SCOPES,
  buildState,
  getRedirectUri,
  json,
  preflight,
  requireEnv,
} from "../_shared/linkedin/linkedin.ts";
import { getUserFromRequest } from "../_shared/meta/auth.ts";

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Unauthorized" }, { status: 401 });

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const brandId = (body as { brand_id?: string })?.brand_id ?? null;
    const scopes = (body as { scopes?: string })?.scopes ?? LI_DEFAULT_SCOPES;

    const state = await buildState(user.id, brandId);
    const url = new URL(LI_AUTH);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", requireEnv("LINKEDIN_CLIENT_ID"));
    url.searchParams.set("redirect_uri", getRedirectUri());
    url.searchParams.set("state", state);
    url.searchParams.set("scope", scopes);
    return json({ authorize_url: url.toString(), state });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
