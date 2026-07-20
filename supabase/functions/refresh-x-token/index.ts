// refresh-x-token: refreshes the X access token via stored refresh token
// (requires offline.access scope at connect time).
import { json, preflight, refreshAccessToken } from "../_shared/x/x.ts";
import { decryptToken, encryptToken } from "../_shared/meta/crypto.ts";
import { getAdminClient, getUserFromRequest } from "../_shared/meta/auth.ts";

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const accountId = (body as { account_id?: string })?.account_id;
    if (!accountId) return json({ error: "account_id required" }, { status: 400 });

    const admin = getAdminClient();
    const { data: acc, error } = await admin
      .from("soc_accounts")
      .select("id, refresh_token_ciphertext, metadata")
      .eq("id", accountId)
      .eq("owner_id", user.id)
      .eq("platform", "x")
      .single();
    if (error || !acc) return json({ error: "X account not found" }, { status: 404 });

    const rt = await decryptToken(acc.refresh_token_ciphertext);
    if (!rt) {
      return json({
        error:
          "No refresh token stored for this X connection. Reconnect the account with offline.access scope.",
      }, { status: 400 });
    }

    const tok = await refreshAccessToken(rt);
    const expiresAt = tok.expires_in
      ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
      : null;

    const { error: updErr } = await admin.from("soc_accounts").update({
      access_token_ciphertext: await encryptToken(tok.access_token),
      refresh_token_ciphertext: tok.refresh_token
        ? await encryptToken(tok.refresh_token)
        : acc.refresh_token_ciphertext,
      token_expires_at: expiresAt,
      connection_status: "connected",
      last_synced_at: new Date().toISOString(),
    }).eq("id", accountId);
    if (updErr) return json({ error: updErr.message }, { status: 500 });

    return json({ ok: true, token_expires_at: expiresAt });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
