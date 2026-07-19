/**
 * Pagination SEO — emit rel="prev"/rel="next" link tags for paginated
 * listing pages (blog index, category listings, search results).
 *
 * `basePath` is the un-paginated path; the helper constructs page-N
 * URLs using the caller's `pageParam` (default `page`).
 */
import { absoluteUrl } from "./engine-constants";

export interface PaginationInput {
  basePath: string;
  page: number;
  totalPages: number;
  pageParam?: string;
}

function pageUrl(basePath: string, page: number, param: string): string {
  if (page <= 1) return absoluteUrl(basePath);
  const sep = basePath.includes("?") ? "&" : "?";
  return absoluteUrl(`${basePath}${sep}${param}=${page}`);
}

export function paginationLinks(
  input: PaginationInput | undefined,
): Array<Record<string, string>> {
  if (!input) return [];
  const param = input.pageParam ?? "page";
  const out: Array<Record<string, string>> = [];
  if (input.page > 1) {
    out.push({ rel: "prev", href: pageUrl(input.basePath, input.page - 1, param) });
  }
  if (input.page < input.totalPages) {
    out.push({ rel: "next", href: pageUrl(input.basePath, input.page + 1, param) });
  }
  return out;
}
