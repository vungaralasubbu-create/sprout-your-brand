// Enterprise Technical SEO & Site Health Center — constants.

export const TSH_ISSUE_CATEGORIES = [
  "crawl",
  "links",
  "redirects",
  "indexing",
  "canonical",
  "sitemap",
  "robots",
  "title_meta",
  "content",
  "image",
  "performance",
  "core_web_vitals",
  "schema",
  "mobile",
  "accessibility",
  "security",
  "orphan",
  "duplicate",
] as const;
export type TshIssueCategory = (typeof TSH_ISSUE_CATEGORIES)[number];

export const TSH_ISSUE_CODES = {
  // links & crawl
  BROKEN_INTERNAL_LINK: "broken_internal_link",
  BROKEN_EXTERNAL_LINK: "broken_external_link",
  REDIRECT_CHAIN: "redirect_chain",
  REDIRECT_LOOP: "redirect_loop",
  PAGE_404: "http_404",
  SOFT_404: "soft_404",
  SERVER_5XX: "http_5xx",
  ORPHAN_PAGE: "orphan_page",
  DUPLICATE_URL: "duplicate_url",
  LARGE_PAGE: "large_page",
  SLOW_PAGE: "slow_page",
  MISSING_ASSET: "missing_asset",
  // title & meta
  TITLE_MISSING: "title_missing",
  TITLE_DUPLICATE: "title_duplicate",
  TITLE_TOO_SHORT: "title_too_short",
  TITLE_TOO_LONG: "title_too_long",
  META_MISSING: "meta_missing",
  META_DUPLICATE: "meta_duplicate",
  META_WEAK: "meta_weak",
  KEYWORD_STUFFING: "keyword_stuffing",
  OG_MISSING: "og_missing",
  TWITTER_MISSING: "twitter_missing",
  // content
  THIN_CONTENT: "thin_content",
  DUPLICATE_CONTENT: "duplicate_content",
  NEAR_DUPLICATE: "near_duplicate_content",
  H1_MISSING: "h1_missing",
  HEADING_STRUCTURE: "improper_heading_structure",
  LOW_READABILITY: "low_readability",
  LOW_WORD_COUNT: "low_word_count",
  OVER_OPTIMIZATION: "over_optimization",
  UNDER_OPTIMIZATION: "under_optimization",
  // image
  IMG_LARGE: "image_too_large",
  IMG_ALT_MISSING: "image_alt_missing",
  IMG_DIMENSIONS_MISSING: "image_dimensions_missing",
  IMG_FORMAT_LEGACY: "image_format_legacy",
  IMG_LAZY_MISSING: "image_lazy_missing",
  IMG_BROKEN: "image_broken",
  // canonical / indexing
  CANONICAL_MISSING: "canonical_missing",
  CANONICAL_MISMATCH: "canonical_mismatch",
  NOINDEX_ON_INDEXABLE: "noindex_on_indexable",
  BLOCKED_IN_ROBOTS: "blocked_in_robots",
  DISCOVERED_NOT_INDEXED: "discovered_not_indexed",
  CRAWLED_NOT_INDEXED: "crawled_not_indexed",
  // sitemap & robots
  SITEMAP_MISSING_URL: "sitemap_missing_url",
  SITEMAP_INVALID_URL: "sitemap_invalid_url",
  SITEMAP_BROKEN_ENTRY: "sitemap_broken_entry",
  SITEMAP_DUPLICATE: "sitemap_duplicate_entry",
  SITEMAP_LARGE: "sitemap_too_large",
  ROBOTS_BLOCKS_ALL: "robots_blocks_all",
  ROBOTS_MISSING_SITEMAP: "robots_missing_sitemap_reference",
  // performance / cwv
  CWV_LCP_POOR: "cwv_lcp_poor",
  CWV_INP_POOR: "cwv_inp_poor",
  CWV_CLS_POOR: "cwv_cls_poor",
  CWV_TTFB_SLOW: "cwv_ttfb_slow",
  // schema
  SCHEMA_MISSING_FIELDS: "schema_missing_fields",
  SCHEMA_INVALID_FIELDS: "schema_invalid_fields",
  SCHEMA_DEPRECATED: "schema_deprecated_property",
  SCHEMA_CONFLICT: "schema_conflict",
  // mobile / a11y / security
  MOBILE_VIEWPORT_MISSING: "mobile_viewport_missing",
  MOBILE_TOUCH_SMALL: "mobile_touch_target_small",
  A11Y_CONTRAST_LOW: "a11y_contrast_low",
  A11Y_LABEL_MISSING: "a11y_label_missing",
  A11Y_ARIA_INVALID: "a11y_aria_invalid",
  SEC_MIXED_CONTENT: "security_mixed_content",
  SEC_HEADER_MISSING: "security_header_missing",
  SEC_HSTS_MISSING: "security_hsts_missing",
  SEC_CSP_MISSING: "security_csp_missing",
} as const;

export const TSH_SEVERITY = ["low", "medium", "high", "critical"] as const;
export type TshSeverity = (typeof TSH_SEVERITY)[number];

export const TSH_SCORE_CATEGORIES = [
  "technical",
  "content_quality",
  "metadata",
  "performance",
  "accessibility",
  "internal_linking",
  "schema_health",
  "mobile",
  "ai_readiness",
] as const;

export const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
  tbt: { good: 200, poor: 600 },
} as const;
