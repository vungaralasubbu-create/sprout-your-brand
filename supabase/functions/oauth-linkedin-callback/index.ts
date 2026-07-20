// oauth-linkedin-callback: called by /auth/linkedin/callback client page.
// Verifies state, exchanges code, fetches profile, stores account in soc_accounts.
import {
  exchangeCodeForToken,
  fetchUserInfo,
  json,
  preflight,
  verifyState,
} from "../_shared/linkedin/linkedin.ts";
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
    if (!code || !state) return json({ ok: false, stage: "input", error: "Missing code or state" });

    const parsed = await verifyState(state);
    if (!parsed) return json({ ok: false, stage: "state", error: "Invalid or expired state" });

    const caller = await getUserFromRequest(req);
    if (caller && caller.id !== parsed.userId) {
      return json({ ok: false, stage: "session", error: "State does not match session user" });
    }

    let tok;
    try {
      tok = await exchangeCodeForToken(code);
    } catch (e) {
      return json({ ok: false, stage: "token_exchange", error: (e as Error).message });
    }
    const accessToken = tok.access_token;
    const expiresAt = tok.expires_in
      ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
      : null;

    let profile;
    try {
      profile = await fetchUserInfo(accessToken);
    } catch (e) {
      return json({ ok: false, stage: "userinfo", error: (e as Error).message });
    }
    const memberUrn = `urn:li:person:${profile.sub}`;
    const displayName = profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ") || profile.email || profile.sub;

    const admin = getAdminClient();
    const now = new Date().toISOString();

    const { error: upsertErr } = await admin.from("soc_accounts").upsert(
      {
        owner_id: parsed.userId,
        brand_id: parsed.brandId,
        platform: "linkedin",
        account_name: displayName,
        account_external_id: profile.sub,
        organization: "linkedin",
        access_token_ciphertext: await encryptToken(accessToken),
        refresh_token_ciphertext: tok.refresh_token ? await encryptToken(tok.refresh_token) : null,
        token_expires_at: expiresAt,
        can_post: true,
        can_read_analytics: false,
        connection_status: "connected",
        permissions: (tok.scope ?? "").split(/[ ,]+/).filter(Boolean),
        metadata: {
          member_urn: memberUrn,
          sub: profile.sub,
          email: profile.email ?? null,
          picture: profile.picture ?? null,
          scope: tok.scope ?? null,
          refresh_token_expires_at: tok.refresh_token_expires_in
            ? new Date(Date.now() + tok.refresh_token_expires_in * 1000).toISOString()
            : null,
        },
        last_synced_at: now,
      },
      { onConflict: "owner_id,platform,account_external_id" as unknown as string },
    );
    if (upsertErr) {
      return json({ ok: false, stage: "db_upsert", error: upsertErr.message, details: upsertErr });
    }

    return json({
      ok: true,
      connected: [{ platform: "linkedin", account_name: displayName, external_id: profile.sub }],
    });
  } catch (err) {
    return json({ ok: false, stage: "unhandled", error: (err as Error).message, stack: (err as Error).stack });
  }
});
