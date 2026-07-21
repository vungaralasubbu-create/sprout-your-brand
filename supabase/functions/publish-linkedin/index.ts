// publish-linkedin: publishes a text or image post to a connected LinkedIn member.
import { createUgcPost, json, preflight, uploadImageAsset } from "../_shared/linkedin/linkedin.ts";
import { decryptToken } from "../_shared/meta/crypto.ts";
import { getAdminClient, getUserFromRequest } from "../_shared/meta/auth.ts";

interface Payload {
  account_id: string; // soc_accounts.id
  message?: string;
  image_url?: string;
  author_urn?: string;   // optional per-request override (urn:li:person:... or urn:li:organization:...)
  author_kind?: "person" | "organization"; // optional hint; inferred from author_urn otherwise
}

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });
  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Partial<Payload>;
    if (!body.account_id) return json({ error: "account_id required" }, { status: 400 });
    if (!body.message && !body.image_url) {
      return json({ error: "message or image_url required" }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: acc, error } = await admin
      .from("soc_accounts")
      .select("id, owner_id, account_external_id, access_token_ciphertext, metadata")
      .eq("id", body.account_id)
      .eq("owner_id", user.id)
      .eq("platform", "linkedin")
      .single();
    if (error || !acc) return json({ error: "LinkedIn account not found" }, { status: 404 });

    const accessToken = await decryptToken(acc.access_token_ciphertext);
    if (!accessToken) return json({ error: "Access token missing" }, { status: 500 });

    const md = (acc.metadata ?? {}) as {
      member_urn?: string;
      default_author_urn?: string;
      default_author_kind?: "person" | "organization";
    };
    // Precedence: explicit per-request override > saved default > personal member URN.
    const personUrn = md.member_urn ?? `urn:li:person:${acc.account_external_id}`;
    const requestedUrn = body.author_urn?.trim() || md.default_author_urn || personUrn;
    const ownerUrn = requestedUrn.startsWith("urn:li:") ? requestedUrn : `urn:li:person:${requestedUrn}`;
    const authorKind: "person" | "organization" =
      body.author_kind ??
      (ownerUrn.includes(":organization:") ? "organization" : "person");

    let assetUrn: string | null = null;
    if (body.image_url) {
      assetUrn = await uploadImageAsset(accessToken, ownerUrn, body.image_url);
    }

    const result = await createUgcPost(accessToken, ownerUrn, body.message ?? "", assetUrn);
    return json({ ok: true, result, author_urn: ownerUrn, author_kind: authorKind });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
