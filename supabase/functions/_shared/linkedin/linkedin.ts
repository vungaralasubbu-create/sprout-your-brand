// Shared LinkedIn API helpers for edge functions.
// Uses OpenID Connect + w_member_social for posting.
export const LI_AUTH = "https://www.linkedin.com/oauth/v2/authorization";
export const LI_TOKEN = "https://www.linkedin.com/oauth/v2/accessToken";
export const LI_API = "https://api.linkedin.com";

// openid+profile+email → /v2/userinfo (sub, name, email, picture)
// w_member_social       → publish /v2/ugcPosts as the member
// openid+profile+email       → /v2/userinfo (sub, name, email, picture)
// w_member_social             → publish /v2/ugcPosts as the member
// r_organization_admin        → list organizations the member administers
// w_organization_social       → publish /v2/ugcPosts as an organization
// r_organization_social       → read organization posts/analytics
export const LI_DEFAULT_SCOPES = [
  "openid",
  "profile",
  "email",
  "w_member_social",
  "r_organization_admin",
  "w_organization_social",
  "r_organization_social",
].join(" ");

export function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export function getRedirectUri(): string {
  return Deno.env.get("LINKEDIN_REDIRECT_URI") || "https://glintr.com/auth/linkedin/callback";
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
  id_token?: string;
}> {
  const clientId = requireEnv("LINKEDIN_CLIENT_ID");
  const clientSecret = requireEnv("LINKEDIN_CLIENT_SECRET");
  const redirectUri = getRedirectUri();

  console.info("LinkedIn token exchange config", {
    client_id_exists: Boolean(Deno.env.get("LINKEDIN_CLIENT_ID")),
    client_secret_exists: Boolean(Deno.env.get("LINKEDIN_CLIENT_SECRET")),
    client_id_prefix: clientId.slice(0, 8),
    client_id_length: clientId.length,
    client_secret_length: clientSecret.length,
    expected_secret: "LinkedIn Primary Client Secret (from Auth tab)",
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    includes_code: Boolean(code),
  });

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(LI_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${res.status} ${JSON.stringify(json)}`);
  return json;
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: requireEnv("LINKEDIN_CLIENT_ID"),
    client_secret: requireEnv("LINKEDIN_CLIENT_SECRET"),
  });
  const res = await fetch(LI_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`LinkedIn refresh failed: ${res.status} ${JSON.stringify(json)}`);
  return json;
}

export interface LiUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  locale?: string;
}

export async function fetchUserInfo(accessToken: string): Promise<LiUserInfo> {
  const res = await fetch(`${LI_API}/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`LinkedIn userinfo failed: ${res.status} ${JSON.stringify(json)}`);
  return json as LiUserInfo;
}

export async function revokeToken(token: string): Promise<void> {
  const body = new URLSearchParams({
    token,
    client_id: requireEnv("LINKEDIN_CLIENT_ID"),
    client_secret: requireEnv("LINKEDIN_CLIENT_SECRET"),
  });
  await fetch("https://www.linkedin.com/oauth/v2/revoke", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  }).catch(() => {});
}

// ---------- Publishing ----------

export interface UgcPostResult {
  id: string;
}

/**
 * Register an image upload on behalf of the member and PUT the binary bytes.
 * Returns the LinkedIn asset URN (urn:li:digitalmediaAsset:...).
 */
export async function uploadImageAsset(
  accessToken: string,
  ownerUrn: string,
  imageUrl: string,
): Promise<string> {
  // 1. Register upload
  const regRes = await fetch(`${LI_API}/v2/assets?action=registerUpload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: ownerUrn,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    }),
  });
  const reg = await regRes.json().catch(() => ({}));
  if (!regRes.ok) throw new Error(`registerUpload failed: ${regRes.status} ${JSON.stringify(reg)}`);
  const uploadUrl: string =
    reg.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]
      ?.uploadUrl;
  const assetUrn: string = reg.value?.asset;
  if (!uploadUrl || !assetUrn) throw new Error("registerUpload: missing uploadUrl or asset");

  // 2. Fetch source image bytes
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Fetch image failed: ${imgRes.status}`);
  const bytes = new Uint8Array(await imgRes.arrayBuffer());

  // 3. PUT bytes to LinkedIn upload URL (bearer required)
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": imgRes.headers.get("content-type") || "application/octet-stream",
    },
    body: bytes,
  });
  if (!putRes.ok) {
    const t = await putRes.text().catch(() => "");
    throw new Error(`Upload PUT failed: ${putRes.status} ${t}`);
  }

  return assetUrn;
}

/**
 * Create a UGC post as the given member (author = urn:li:person:{sub}).
 */
export async function createUgcPost(
  accessToken: string,
  ownerUrn: string,
  text: string,
  imageAssetUrn?: string | null,
): Promise<UgcPostResult> {
  const shareContent: Record<string, unknown> = {
    shareCommentary: { text: text ?? "" },
    shareMediaCategory: imageAssetUrn ? "IMAGE" : "NONE",
  };
  if (imageAssetUrn) {
    shareContent.media = [
      {
        status: "READY",
        media: imageAssetUrn,
      },
    ];
  }

  const res = await fetch(`${LI_API}/v2/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: ownerUrn,
      lifecycleState: "PUBLISHED",
      specificContent: { "com.linkedin.ugc.ShareContent": shareContent },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`ugcPosts failed: ${res.status} ${JSON.stringify(json)}`);
  return { id: (json as { id: string }).id };
}

// ---------- CORS helpers (mirrors _shared/meta/meta.ts) ----------

export interface JsonResponseInit {
  status?: number;
  headers?: HeadersInit;
}

export function json(body: unknown, init: JsonResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "authorization, x-client-info, apikey, content-type",
  );
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers });
}

export function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "authorization, x-client-info, apikey, content-type",
  );
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers });
}

// Signed state (same shape as connect-meta)
export async function signState(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  let s = "";
  for (const b of sig) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function buildState(userId: string, brandId: string | null): Promise<string> {
  const secret = requireEnv("LINKEDIN_CLIENT_SECRET");
  const payload = { u: userId, b: brandId, n: crypto.randomUUID(), t: Date.now() };
  const body = btoa(JSON.stringify(payload))
    .replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const sig = await signState(body, secret);
  return `${body}.${sig}`;
}

export async function verifyState(
  state: string,
): Promise<{ userId: string; brandId: string | null } | null> {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const secret = requireEnv("LINKEDIN_CLIENT_SECRET");
  const expected = await signState(body, secret);
  if (expected !== sig) return null;
  const padded = body.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((body.length + 3) % 4);
  const decoded = JSON.parse(atob(padded));
  if (Date.now() - decoded.t > 15 * 60_000) return null;
  return { userId: decoded.u, brandId: decoded.b ?? null };
}
