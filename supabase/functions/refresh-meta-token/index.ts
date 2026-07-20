// refresh-meta-token: refreshes long-lived user tokens for the caller's Meta
// accounts and re-derives Page tokens. Can be invoked by the user or a scheduler.
import {
  exchangeForLongLivedToken,
  fetchUserPagesAndIG,
  json,
  preflight,
} from "../_shared/meta/meta.ts";
import { decryptToken, encryptToken } from "../_shared/meta/crypto.ts";
import { getAdminClient, getUserFromRequest } from "../_shared/meta/auth.ts";

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  try {
    const user = await getUserFromRequest(req);
    // Allow service-role invocation for scheduled refresh
    const isService =
      req.headers.get("authorization") ===
      `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
    if (!user && !isService) return json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const targetOwner = isService
      ? (body as { owner_id?: string })?.owner_id ?? null
      : user!.id;

    const admin = getAdminClient();
    let q = admin
      .from("soc_accounts")
      .select("id, owner_id, platform, account_external_id, metadata")
      .eq("platform", "facebook");
    if (targetOwner) q = q.eq("owner_id", targetOwner);
    const { data: fbAccounts, error } = await q;
    if (error) return json({ error: error.message }, { status: 500 });
    if (!fbAccounts?.length) return json({ ok: true, refreshed: 0 });

    // Group by owner_id (each owner has one user token stored on their FB rows).
    const ownerSet = new Set(fbAccounts.map((r) => r.owner_id));
    let refreshed = 0;
    const errors: string[] = [];

    for (const ownerId of ownerSet) {
      try {
        // Take any FB row's stored user_token
        const row = fbAccounts.find(
          (r) => r.owner_id === ownerId && (r.metadata as Record<string, unknown> | null)?.user_token_ciphertext,
        );
        if (!row) continue;
        const meta = row.metadata as Record<string, string>;
        const currentUserToken = await decryptToken(meta.user_token_ciphertext);
        if (!currentUserToken) continue;

        const refreshedToken = await exchangeForLongLivedToken(currentUserToken);
        const expiresAt = refreshedToken.expires_in
          ? new Date(Date.now() + refreshedToken.expires_in * 1000).toISOString()
          : null;

        const pages = await fetchUserPagesAndIG(refreshedToken.access_token);
        const encryptedUser = await encryptToken(refreshedToken.access_token);

        for (const p of pages) {
          const pageTokenCt = await encryptToken(p.page_access_token);
          await admin
            .from("soc_accounts")
            .update({
              access_token_ciphertext: pageTokenCt,
              token_expires_at: expiresAt,
              connection_status: "connected",
              last_synced_at: new Date().toISOString(),
              metadata: {
                page_id: p.page_id,
                page_name: p.page_name,
                user_token_ciphertext: encryptedUser,
              },
            })
            .eq("owner_id", ownerId)
            .eq("platform", "facebook")
            .eq("account_external_id", p.page_id);

          if (p.ig_business_id) {
            await admin
              .from("soc_accounts")
              .update({
                access_token_ciphertext: pageTokenCt,
                token_expires_at: expiresAt,
                connection_status: "connected",
                last_synced_at: new Date().toISOString(),
                metadata: {
                  ig_business_id: p.ig_business_id,
                  ig_username: p.ig_username,
                  page_id: p.page_id,
                  page_name: p.page_name,
                },
              })
              .eq("owner_id", ownerId)
              .eq("platform", "instagram")
              .eq("account_external_id", p.ig_business_id);
          }
        }
        refreshed++;
      } catch (e) {
        errors.push(`${ownerId}: ${(e as Error).message}`);
      }
    }

    return json({ ok: true, refreshed, errors });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
