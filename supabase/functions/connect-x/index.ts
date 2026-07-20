// connect-x: returns an X (Twitter) OAuth 2.0 authorization URL with PKCE.
import {
  X_AUTH,
  X_DEFAULT_SCOPES,
  buildState,
  codeChallengeS256,
  generateCodeVerifier,
  getRedirectUri,
  json,
  preflight,
  requireEnv,
  TWITTER_CLIENT_ID as getTwitterClientId,
} from "../_shared/x/x.ts";
import { getUserFromRequest } from "../_shared/meta/auth.ts";

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Unauthorized" }, { status: 401 });

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const brandId = (body as { brand_id?: string })?.brand_id ?? null;
    const scopes = (body as { scopes?: string })?.scopes ?? X_DEFAULT_SCOPES;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await codeChallengeS256(codeVerifier);
    const state = await buildState(user.id, brandId, codeVerifier);

    const url = new URL(X_AUTH);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", requireEnv("X_CLIENT_ID"));
    url.searchParams.set("redirect_uri", getRedirectUri());
    url.searchParams.set("scope", scopes);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    return json({ authorize_url: url.toString(), state });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
