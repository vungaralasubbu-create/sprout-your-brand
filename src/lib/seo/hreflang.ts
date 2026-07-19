/**
 * Hreflang alternates — emit <link rel="alternate" hreflang="…"> tags
 * so international variants of the same page can share ranking signal.
 * Callers pass a list of { hreflang, path } tuples.
 */
import { absoluteUrl } from "./engine-constants";

export interface HreflangAlternate {
  /** BCP-47 language tag, or "x-default". */
  hreflang: string;
  /** Path or absolute URL for the localized page. */
  path: string;
}

export function hreflangLinks(
  alternates: HreflangAlternate[] | undefined,
): Array<Record<string, string>> {
  if (!alternates || alternates.length === 0) return [];
  return alternates.map((a) => ({
    rel: "alternate",
    hreflang: a.hreflang,
    href: absoluteUrl(a.path),
  }));
}
