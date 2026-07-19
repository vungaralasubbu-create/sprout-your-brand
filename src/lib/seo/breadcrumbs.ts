/**
 * Breadcrumb utilities — data model + schema.org JSON-LD builder.
 * Consumed by the SEO Engine (`engine.ts`) and by page components that
 * want to render on-page breadcrumb trails from the same source.
 */
import { absoluteUrl } from "./engine-constants";

export interface BreadcrumbItem {
  name: string;
  /** Path relative to SITE_ORIGIN, e.g. "/programs/ai". */
  path: string;
}

export function breadcrumbListSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Convenience builder: prefix trail with a "Home → …" entry. */
export function withHome(items: BreadcrumbItem[]): BreadcrumbItem[] {
  return [{ name: "Home", path: "/" }, ...items];
}
