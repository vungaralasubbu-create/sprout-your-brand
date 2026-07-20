// oauth-x-callback: verifies state, exchanges code + PKCE verifier, fetches
// profile, and upserts the connected account into soc_accounts.
import {
  exchangeCodeForToken,
  fetchMe,
  json,
  preflight,
  verifyState,
} from "../_shared/x/x.ts";
import { encryptToken } from "../_shared/meta/crypto.ts";
import { getAdminClient, getUserFromRequest } from "../_shared/meta/auth.ts";

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  try {
    const url = new URL(req.url);
    let code = url.searchParams.get("code");
    let state = url.searchParams.get("state");
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      code = (body as { code?: string }).code ?? code;
      state = (body as { state?: string }).state ?? state;
    }
    if (!code || !state) return json({ error: "Missing code or state" }, { status: 400 });

    const parsed = await verifyState(state);
    if (!parsed) return json({ error: "Invalid or expired state" }, { status: 400 });

    const caller = await getUserFromRequest(req);
    if (caller && caller.id !== parsed.userId) {
      return json({ error: "State does not match session" }, { status: 403 });
    }

    const tok = await exchangeCodeForToken(code, parsed.codeVerifier);
    const accessToken = tok.access_token;
    const expiresAt = tok.expires_in
      ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
      : null;

    const profile = await fetchMe(accessToken);
    const displayName = profile.name || profile.username || profile.id;

    const admin = getAdminClient();
    const now = new Date().toISOString();

    const { error: upErr } = await admin.from("soc_accounts").upsert(
      {
        owner_id: parsed.userId,
        brand_id: parsed.brandId,
        platform: "x",
        account_name: displayName,
        account_external_id: profile.id,
        organization: "x",
        access_token_ciphertext: await encryptToken(accessToken),
        refresh_token_ciphertext: tok.refresh_token ? await encryptToken(tok.refresh_token) : null,
        token_expires_at: expiresAt,
        can_post: true,
        can_read_analytics: false,
        connection_status: "connected",
        permissions: (tok.scope ?? "").split(/[ ,]+/).filter(Boolean),
        metadata: {
          username: profile.username ?? null,
          profile_image_url: profile.profile_image_url ?? null,
          scope: tok.scope ?? null,
        },
        last_synced_at: now,
      },
      { onConflict: "owner_id,platform,account_external_id" as unknown as string },
    );
    if (upErr) return json({ error: `Upsert failed: ${upErr.message}` }, { status: 500 });

    return json({
      ok: true,
      connected: [{ platform: "x", account_name: displayName, external_id: profile.id }],
    });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
