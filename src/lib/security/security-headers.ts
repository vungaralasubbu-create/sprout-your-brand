/**
 * Security HTTP Headers
 * ---------------------
 * Baseline hardening for server routes returning HTML or JSON. TanStack
 * server routes should merge these into their `Response` init. `csp`
 * defaults to a strict same-origin policy; override for routes that
 * need to include remote assets.
 */

export interface SecurityHeaderOptions {
  csp?: string;
  frameAncestors?: string[];
  reportUri?: string;
}

const DEFAULT_CSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob: https:; " +
  "font-src 'self' data: https:; " +
  "connect-src 'self' https: wss:; " +
  "frame-ancestors 'self'; " +
  "base-uri 'self'; " +
  "form-action 'self'; " +
  "object-src 'none'";

export function securityHeaders(opts: SecurityHeaderOptions = {}): Record<string, string> {
  const csp = opts.csp ?? DEFAULT_CSP;
  return {
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}

export function withSecurityHeaders(response: Response, opts?: SecurityHeaderOptions): Response {
  const headers = new Headers(response.headers);
  const add = securityHeaders(opts);
  for (const [k, v] of Object.entries(add)) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
