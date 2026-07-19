/**
 * Redirect management — a central catalog of legacy → canonical path
 * redirects, plus a `resolveRedirect(pathname)` helper for use in a
 * TanStack Router `beforeLoad` or in a server route.
 *
 * Rules of the road:
 *  - Prefer 301 (permanent) for content that moved for good.
 *  - Prefer 302 (temporary) for A/B experiments and short-term rewrites.
 *  - Do NOT redirect authenticated routes here — auth guards own those.
 *  - Do NOT put marketing UTM rewrites here — this is for canonical
 *    URL consolidation only, so search engines pass link equity.
 *
 * Adding a rule is additive and never touches UI or existing routes.
 */

export type RedirectRule =
  | { kind: "exact"; from: string; to: string; status?: 301 | 302 }
  | { kind: "prefix"; from: string; to: string; status?: 301 | 302 };

export const REDIRECT_RULES: RedirectRule[] = [
  // Legacy blog → new /blog namespace
  { kind: "prefix", from: "/articles/", to: "/blog/", status: 301 },
  // Legacy programs alias
  { kind: "prefix", from: "/courses/", to: "/programs/", status: 301 },
  // Legacy partner → become-a-partner
  { kind: "exact", from: "/become-partner", to: "/become-a-partner", status: 301 },
  { kind: "exact", from: "/partner-signup", to: "/become-a-partner", status: 301 },
  // Legacy calculators
  { kind: "exact", from: "/calculator", to: "/income-calculator", status: 301 },
  { kind: "exact", from: "/earn-with-glintr", to: "/earn", status: 301 },
];

export interface ResolvedRedirect {
  to: string;
  status: 301 | 302;
}

/** Match a request pathname against the catalog. Returns null if none match. */
export function resolveRedirect(pathname: string): ResolvedRedirect | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  for (const rule of REDIRECT_RULES) {
    if (rule.kind === "exact" && (rule.from === pathname || rule.from === clean)) {
      return { to: rule.to, status: rule.status ?? 301 };
    }
    if (rule.kind === "prefix" && pathname.startsWith(rule.from)) {
      const tail = pathname.slice(rule.from.length);
      return { to: `${rule.to}${tail}`, status: rule.status ?? 301 };
    }
  }
  return null;
}
