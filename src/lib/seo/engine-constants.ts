/**
 * Small constants + helpers shared across the SEO engine modules
 * (breadcrumbs, hreflang, pagination). Kept in a separate file to
 * avoid a circular import back into `engine.ts`.
 */
export const SITE_ORIGIN = "https://glintr.com";

export function absoluteUrl(path: string): string {
  if (!path) return SITE_ORIGIN;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${clean}`;
}
