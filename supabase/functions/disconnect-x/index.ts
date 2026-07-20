// disconnect-x: revokes X OAuth tokens and removes soc_accounts rows.
import { json, preflight, revokeToken } from "../_shared/x/x.ts";
import { decryptToken } from "../_shared/meta/crypto.ts";
import { getAdminClient, getUserFromRequest } from "../_shared/meta/auth.ts";

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const accountId = (body as { account_id?: string })?.account_id;
    const disconnectAll = (body as { all?: boolean })?.all === true;

    const admin = getAdminClient();
    let query = admin
      .from("soc_accounts")
      .select("id, access_token_ciphertext, refresh_token_ciphertext")
      .eq("owner_id", user.id)
      .eq("platform", "x");
    if (accountId && !disconnectAll) query = query.eq("id", accountId);
    const { data: rows, error } = await query;
    if (error) return json({ error: error.message }, { status: 500 });
    if (!rows || rows.length === 0) return json({ ok: true, removed: 0 });

    let revoked = 0;
    for (const row of rows) {
      try {
        const at = await decryptToken(row.access_token_ciphertext);
        if (at) { await revokeToken(at, "access_token"); revoked++; }
        const rt = await decryptToken(row.refresh_token_ciphertext);
        if (rt) await revokeToken(rt, "refresh_token");
      } catch (_) {
        // continue to delete regardless
      }
    }

    const ids = rows.map((r) => r.id);
    const { error: delErr } = await admin.from("soc_accounts").delete().in("id", ids);
    if (delErr) return json({ error: delErr.message }, { status: 500 });

    return json({ ok: true, removed: ids.length, revoked });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
