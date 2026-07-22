// linkedin-orgs: list LinkedIn Organizations (Company Pages) the connected
// LinkedIn member administers. Reuses the stored access token — no new OAuth.
import {
  fetchAdminOrganizations,
  json,
  preflight,
} from "../_shared/linkedin/linkedin.ts";
import { decryptToken } from "../_shared/meta/crypto.ts";
import { getAdminClient, getUserFromRequest } from "../_shared/meta/auth.ts";

interface Payload {
  account_id: string;
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

    const admin = getAdminClient();
    const { data: acc, error } = await admin
      .from("soc_accounts")
      .select("id, owner_id, account_external_id, account_name, access_token_ciphertext, metadata")
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
      default_author_name?: string;
      scope?: string | null;
    };
    const personUrn = md.member_urn ?? `urn:li:person:${acc.account_external_id}`;

    // Detect whether the token actually carries organization scopes. If
    // LinkedIn didn't grant them at token exchange, the app is not yet
    // approved for the Community Management API (Products tab in the
    // LinkedIn Developer Portal). Once approval lands, users reconnect.
    const grantedScopes = String(md.scope ?? "").split(/[ ,]+/).filter(Boolean);
    const hasOrgScopes =
      grantedScopes.includes("r_organization_admin") &&
      grantedScopes.includes("w_organization_social");

    let orgs;
    try {
      orgs = await fetchAdminOrganizations(accessToken);
    } catch (e) {
      const msg = (e as Error).message;
      const insufficient = msg.startsWith("insufficient_scope:");
      // approval_pending: app-level Community Management API not granted yet.
      // reconnect_required: token needs re-issuing (e.g. after approval landed).
      const approvalPending = insufficient && !hasOrgScopes;
      return json({
        error: msg,
        code: approvalPending ? "approval_pending" : insufficient ? "insufficient_scope" : "linkedin_error",
        approval_pending: approvalPending,
        reconnect_required: insufficient && hasOrgScopes,
        granted_scopes: grantedScopes,
        person: { urn: personUrn, name: acc.account_name ?? "Personal profile" },
        organizations: [],
        default: { urn: md.default_author_urn ?? personUrn, kind: md.default_author_kind ?? "person" },
      }, { status: insufficient ? 200 : 502 });
    }

    return json({
      ok: true,
      person: { urn: personUrn, name: acc.account_name ?? "Personal profile" },
      organizations: orgs,
      default: {
        urn: md.default_author_urn ?? personUrn,
        kind: md.default_author_kind ?? "person",
        name: md.default_author_name ?? acc.account_name ?? "Personal profile",
      },
    });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
