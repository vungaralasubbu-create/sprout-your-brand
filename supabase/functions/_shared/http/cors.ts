export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

export function withCors(headers: HeadersInit = {}): Headers {
  const h = new Headers(headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) h.set(k, v);
  return h;
}