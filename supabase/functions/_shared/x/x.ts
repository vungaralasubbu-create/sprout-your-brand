// Shared X (Twitter) API helpers for edge functions.
// OAuth 2.0 Authorization Code Flow with PKCE (S256).
export const X_AUTH = "https://twitter.com/i/oauth2/authorize";
export const X_TOKEN = "https://api.twitter.com/2/oauth2/token";
export const X_REVOKE = "https://api.twitter.com/2/oauth2/revoke";
export const X_API = "https://api.twitter.com";
export const X_UPLOAD = "https://upload.twitter.com/1.1/media/upload.json";

// tweet.read + tweet.write + users.read + media.write + offline.access (refresh tokens)
export const X_DEFAULT_SCOPES = [
  "tweet.read",
  "tweet.write",
  "users.read",
  "media.write",
  "offline.access",
].join(" ");

export function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getTwitterClientId(): string {
  return requireEnv("TWITTER_CLIENT_ID");
}

function getTwitterClientSecret(): string {
  return requireEnv("TWITTER_CLIENT_SECRET");
}

export function getRedirectUri(): string {
  return Deno.env.get("X_REDIRECT_URI") || "https://glintr.com/auth/x/callback";
}

// ---------- base64url + PKCE ----------
function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function generateCodeVerifier(): string {
  const buf = new Uint8Array(48);
  crypto.getRandomValues(buf);
  return b64url(buf);
}

export async function codeChallengeS256(verifier: string): Promise<string> {
  const hash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  );
  return b64url(hash);
}

// ---------- HTTP helpers ----------
function basicAuth(): string {
  const id = getTwitterClientId();
  const secret = getTwitterClientSecret();
  return "Basic " + btoa(`${id}:${secret}`);
}

export interface XTokenResponse {
  token_type: string;
  access_token: string;
  scope?: string;
  expires_in?: number;
  refresh_token?: string;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<XTokenResponse> {
  const clientId = getTwitterClientId();
  const clientSecret = getTwitterClientSecret();
  const redirectUri = getRedirectUri();

  console.log("[X OAuth] token exchange diagnostics", {
    hasClientId: !!clientId,
    clientIdPrefix: clientId.slice(0, 8),
    clientIdLength: clientId.length,
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret.length,
    redirectUri,
    codeVerifierLength: codeVerifier.length,
    expectedSecret: "Twitter/X App Primary Client Secret (not trimmed)",
  });

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_id: clientId,
  });
  const res = await fetch(X_TOKEN, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(),
    },
    body,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[X OAuth] token exchange failed", { status: res.status, body: j });
    throw new Error(`X token exchange failed: ${res.status} ${JSON.stringify(j)}`);
  }
  return j as XTokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<XTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: getTwitterClientId(),
  });
  const res = await fetch(X_TOKEN, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(),
    },
    body,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`X refresh failed: ${res.status} ${JSON.stringify(j)}`);
  return j as XTokenResponse;
}

export async function revokeToken(token: string, tokenTypeHint: "access_token" | "refresh_token" = "access_token"): Promise<void> {
  const body = new URLSearchParams({
    token,
    token_type_hint: tokenTypeHint,
    client_id: getTwitterClientId(),
  });
  await fetch(X_REVOKE, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(),
    },
    body,
  }).catch(() => {});
}

// ---------- User info ----------
export interface XUserInfo {
  id: string;
  name?: string;
  username?: string;
  profile_image_url?: string;
}

export async function fetchMe(accessToken: string): Promise<XUserInfo> {
  const url = `${X_API}/2/users/me?user.fields=profile_image_url,name,username`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`X users/me failed: ${res.status} ${JSON.stringify(j)}`);
  return (j as { data: XUserInfo }).data;
}

// ---------- Media upload (v1.1 chunked, OAuth2 bearer supported for media.write) ----------
export async function uploadMedia(accessToken: string, imageUrl: string): Promise<string> {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Fetch image failed: ${imgRes.status}`);
  const contentType = imgRes.headers.get("content-type") || "image/jpeg";
  const bytes = new Uint8Array(await imgRes.arrayBuffer());

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // INIT
  const initBody = new URLSearchParams({
    command: "INIT",
    total_bytes: String(bytes.length),
    media_type: contentType,
    media_category: "tweet_image",
  });
  const initRes = await fetch(X_UPLOAD, {
    method: "POST",
    headers: { ...authHeader, "content-type": "application/x-www-form-urlencoded" },
    body: initBody,
  });
  const initJson = await initRes.json().catch(() => ({}));
  if (!initRes.ok) throw new Error(`X media INIT failed: ${initRes.status} ${JSON.stringify(initJson)}`);
  const mediaId: string = (initJson as { media_id_string: string }).media_id_string;

  // APPEND (single segment; chunks up to ~5MB works fine)
  const form = new FormData();
  form.append("command", "APPEND");
  form.append("media_id", mediaId);
  form.append("segment_index", "0");
  form.append("media", new Blob([bytes], { type: contentType }));
  const appRes = await fetch(X_UPLOAD, { method: "POST", headers: authHeader, body: form });
  if (!appRes.ok) {
    const t = await appRes.text().catch(() => "");
    throw new Error(`X media APPEND failed: ${appRes.status} ${t}`);
  }

  // FINALIZE
  const finBody = new URLSearchParams({ command: "FINALIZE", media_id: mediaId });
  const finRes = await fetch(X_UPLOAD, {
    method: "POST",
    headers: { ...authHeader, "content-type": "application/x-www-form-urlencoded" },
    body: finBody,
  });
  const finJson = await finRes.json().catch(() => ({}));
  if (!finRes.ok) throw new Error(`X media FINALIZE failed: ${finRes.status} ${JSON.stringify(finJson)}`);
  return mediaId;
}

// ---------- Tweet creation ----------
export interface CreateTweetOptions {
  text: string;
  mediaIds?: string[];
  replyToTweetId?: string;
}
export interface XTweetResult {
  id: string;
  text: string;
}

export async function createTweet(accessToken: string, opts: CreateTweetOptions): Promise<XTweetResult> {
  const body: Record<string, unknown> = { text: opts.text ?? "" };
  if (opts.mediaIds && opts.mediaIds.length > 0) {
    body.media = { media_ids: opts.mediaIds.slice(0, 4) };
  }
  if (opts.replyToTweetId) {
    body.reply = { in_reply_to_tweet_id: opts.replyToTweetId };
  }
  const res = await fetch(`${X_API}/2/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`X create tweet failed: ${res.status} ${JSON.stringify(j)}`);
  return (j as { data: XTweetResult }).data;
}

// ---------- CORS + JSON helpers (mirror linkedin.ts) ----------
export interface JsonResponseInit { status?: number; headers?: HeadersInit; }

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

// ---------- Signed state (embeds PKCE verifier) ----------
async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return b64url(sig);
}

export interface StatePayload {
  u: string;           // user id
  b: string | null;    // brand id
  v: string;           // pkce code_verifier
  n: string;           // nonce
  t: number;           // timestamp
}

export async function buildState(userId: string, brandId: string | null, codeVerifier: string): Promise<string> {
  const secret = getTwitterClientSecret();
  const payload: StatePayload = { u: userId, b: brandId, v: codeVerifier, n: crypto.randomUUID(), t: Date.now() };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacSign(body, secret);
  return `${body}.${sig}`;
}

export async function verifyState(
  state: string,
): Promise<{ userId: string; brandId: string | null; codeVerifier: string } | null> {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const secret = getTwitterClientSecret();
  const expected = await hmacSign(body, secret);
  if (expected !== sig) return null;
  const decoded = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as StatePayload;
  if (Date.now() - decoded.t > 15 * 60_000) return null;
  return { userId: decoded.u, brandId: decoded.b ?? null, codeVerifier: decoded.v };
}
