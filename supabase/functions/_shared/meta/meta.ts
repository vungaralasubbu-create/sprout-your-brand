// Shared Meta Graph API helpers for edge functions.
export const META_GRAPH_VERSION = "v20.0";
export const META_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
export const META_OAUTH = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`;

export const META_DEFAULT_SCOPES = [
  "public_profile",
  "email",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_manage_metadata",
  "business_management",
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_insights",
].join(",");

export function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export function getRedirectUri(): string {
  return Deno.env.get("META_REDIRECT_URI") || "https://glintr.com/auth/meta/callback";
}

export async function graphGet(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`${META_GRAPH}${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Meta GET ${path} failed: ${res.status} ${JSON.stringify(body)}`);
  return body;
}

export async function graphPost(
  path: string,
  token: string,
  form: Record<string, string>,
) {
  const body = new URLSearchParams({ ...form, access_token: token });
  const res = await fetch(`${META_GRAPH}${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Meta POST ${path} failed: ${res.status} ${JSON.stringify(json)}`);
  return json;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  expires_in?: number;
  token_type?: string;
}> {
  const url = new URL(`${META_GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", requireEnv("META_APP_ID"));
  url.searchParams.set("client_secret", requireEnv("META_APP_SECRET"));
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("code", code);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(json)}`);
  return json;
}

export async function exchangeForLongLivedToken(shortLived: string): Promise<{
  access_token: string;
  expires_in?: number;
}> {
  const url = new URL(`${META_GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", requireEnv("META_APP_ID"));
  url.searchParams.set("client_secret", requireEnv("META_APP_SECRET"));
  url.searchParams.set("fb_exchange_token", shortLived);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) throw new Error(`Long-lived token exchange failed: ${JSON.stringify(json)}`);
  return json;
}

export async function fetchUserPagesAndIG(userToken: string) {
  // Returns array of { page_id, page_name, page_access_token, ig_business_id?, ig_username? }
  const pages = await graphGet("/me/accounts", userToken, {
    fields: "id,name,access_token,instagram_business_account{id,username}",
    limit: "100",
  });
  return (pages.data ?? []).map((p: Record<string, unknown>) => {
    const ig = p.instagram_business_account as { id?: string; username?: string } | undefined;
    return {
      page_id: p.id as string,
      page_name: p.name as string,
      page_access_token: p.access_token as string,
      ig_business_id: ig?.id ?? null,
      ig_username: ig?.username ?? null,
    };
  });
}

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
  return json({}, { status: 204 });
}
