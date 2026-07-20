// oauth-callback: called by the client landing page at /auth/meta/callback.
// Verifies state, exchanges code for a long-lived user token, discovers Pages
// and Instagram Business accounts, and persists them into soc_accounts.
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchUserPagesAndIG,
  json,
  preflight,
  requireEnv,
} from "../_shared/meta/meta.ts";
import { encryptToken } from "../_shared/meta/crypto.ts";
import { getAdminClient, getUserFromRequest } from "../_shared/meta/auth.ts";

async function verifyState(state: string): Promise<{ userId: string; brandId: string | null } | null> {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const secret = requireEnv("META_APP_SECRET");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  );
  let expB = "";
  for (const b of expected) expB += String.fromCharCode(b);
  const expectedSig = btoa(expB).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  if (expectedSig !== sig) return null;

  const padded = body.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((body.length + 3) % 4);
  const decoded = JSON.parse(atob(padded));
  if (Date.now() - decoded.t > 15 * 60_000) return null; // 15 min TTL
  return { userId: decoded.u, brandId: decoded.b ?? null };
}

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

    // Optional: also require an authenticated session that matches state.u
    const caller = await getUserFromRequest(req);
    if (caller && caller.id !== parsed.userId) {
      return json({ error: "State does not match session" }, { status: 403 });
    }

    // 1. Short-lived user token
    const shortLived = await exchangeCodeForToken(code);
    // 2. Long-lived user token (~60 days)
    const longLived = await exchangeForLongLivedToken(shortLived.access_token);
    const userToken = longLived.access_token;
    const expiresAt = longLived.expires_in
      ? new Date(Date.now() + longLived.expires_in * 1000).toISOString()
      : null;

    // 3. Discover managed pages + linked IG business accounts
    const pages = await fetchUserPagesAndIG(userToken);
    if (pages.length === 0) {
      return json({
        error:
          "No Facebook Pages found for this account. Ensure the connecting user is an admin of at least one Page.",
      }, { status: 400 });
    }

    const admin = getAdminClient();
    const now = new Date().toISOString();
    const saved: Array<{ platform: string; account_name: string; page_id: string }> = [];

    for (const p of pages) {
      // Facebook Page account
      const fbEncrypted = await encryptToken(p.page_access_token);
      await admin.from("soc_accounts").upsert(
        {
          owner_id: parsed.userId,
          brand_id: parsed.brandId,
          platform: "facebook",
          account_name: p.page_name,
          account_external_id: p.page_id,
          organization: "meta",
          access_token_ciphertext: fbEncrypted,
          token_expires_at: expiresAt,
          can_post: true,
          can_read_analytics: true,
          connection_status: "connected",
          metadata: {
            page_id: p.page_id,
            page_name: p.page_name,
            user_token_ciphertext: await encryptToken(userToken),
          },
          last_synced_at: now,
        },
        { onConflict: "owner_id,platform,account_external_id" as unknown as string },
      );
      saved.push({ platform: "facebook", account_name: p.page_name, page_id: p.page_id });

      if (p.ig_business_id) {
        const igEncrypted = await encryptToken(p.page_access_token); // IG publishing uses page token
        await admin.from("soc_accounts").upsert(
          {
            owner_id: parsed.userId,
            brand_id: parsed.brandId,
            platform: "instagram",
            account_name: p.ig_username || `IG for ${p.page_name}`,
            account_external_id: p.ig_business_id,
            organization: "meta",
            access_token_ciphertext: igEncrypted,
            token_expires_at: expiresAt,
            can_post: true,
            can_read_analytics: true,
            connection_status: "connected",
            metadata: {
              ig_business_id: p.ig_business_id,
              ig_username: p.ig_username,
              page_id: p.page_id,
              page_name: p.page_name,
            },
            last_synced_at: now,
          },
          { onConflict: "owner_id,platform,account_external_id" as unknown as string },
        );
        saved.push({
          platform: "instagram",
          account_name: p.ig_username || p.page_name,
          page_id: p.ig_business_id,
        });
      }
    }

    return json({ ok: true, connected: saved });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
