# Glintr SEO Engine — Architecture

Centralized, additive SEO layer. No UI, route, auth, or payment code was
touched. Every existing SEO helper (`meta.ts`, `schemas.ts`,
`sitemap-utils.ts`, `internal-links.ts`, `audit.functions.ts`, the 10
existing sitemap routes) still works — the engine sits alongside them
as the single call site for new pages.

## Files created

- `src/lib/seo/engine.ts` — `buildSeo({...})`: the single entry point
  that returns `{ meta, links, scripts }` for TanStack `head()`.
  Covers dynamic title, description, canonical, Open Graph, Twitter
  Cards, robots, hreflang, pagination, breadcrumb JSON-LD, and
  arbitrary schema stacking.
- `src/lib/seo/engine-constants.ts` — shared `SITE_ORIGIN` +
  `absoluteUrl()` (kept separate to avoid a cycle with `engine.ts`).
- `src/lib/seo/breadcrumbs.ts` — `BreadcrumbItem` model +
  `breadcrumbListSchema()` JSON-LD.
- `src/lib/seo/hreflang.ts` — hreflang alternate builder.
- `src/lib/seo/pagination.ts` — rel prev/next builder.
- `src/lib/seo/redirects.ts` — central redirect catalog +
  `resolveRedirect(pathname)` resolver for 301/302 consolidation.
- `src/lib/seo/generators.ts` — 17 per-page-type adapters:
  `homepageSeo`, `courseSeo`, `blogPostSeo`, `blogIndexSeo`,
  `careerPageSeo`, `instructorSeo`, `partnerSeo`, `brandSeo`,
  `categorySeo`, `subcategorySeo`, `programsIndexSeo`,
  `certificationSeo`, `locationSeo`, `aiGeneratedSeo`, `landingSeo`,
  `successStorySeo`, `faqSeo`, `docsSeo`.
- `src/routes/sitemap-programs.xml.ts` — category + program listings.
- `src/routes/sitemap-partners.xml.ts` — public partner profiles.
- `src/routes/sitemap-brands.xml.ts` — partner academies / brand storefronts.
- `src/routes/sitemap-landing.xml.ts` — evergreen marketing pages.
- `src/routes/sitemap-locations.xml.ts` — geo pages.
- `src/routes/sitemap-instructors.xml.ts` — instructor / mentor profiles.

## Files modified

- `src/routes/sitemap-index.xml.ts` — added references to the six new
  segmented sitemaps.
- `public/robots.txt` — appended sitemap URLs for the six new segments.
  All existing `User-agent` / `Disallow` rules preserved.

## Usage — one call per route

```ts
// src/routes/programs.$category.$slug.tsx
import { courseSeo } from "@/lib/seo/generators";

export const Route = createFileRoute("/programs/$category/$slug")({
  loader: /* fetches course row */,
  head: ({ loaderData }) => courseSeo({
    slug: loaderData.slug,
    categorySlug: loaderData.category.slug,
    categoryName: loaderData.category.name,
    title: loaderData.title,
    summary: loaderData.summary,
    cover: loaderData.cover_url,
    updatedAt: loaderData.updated_at,
    instructorName: loaderData.instructor?.name,
    priceInr: loaderData.price_inr,
    ratingValue: loaderData.rating_value,
    ratingCount: loaderData.rating_count,
  }),
});
```

## What each SEO surface produces automatically

- **Title** clamped to ≤ 60 chars with the `| Glintr` suffix.
- **Description** padded/trimmed to 140–160 chars.
- **Canonical** self-references the route (leaf-only rule respected —
  the engine never emits canonical outside `links[]`).
- **Open Graph** — title, description, url, type, site_name, locale,
  image, image:alt, and article:author/published/modified when the
  page is an article.
- **Twitter Card** — `summary_large_image`, matching title/description
  and image/image alt.
- **Robots** — honors `noindex`, `nofollow`, `noarchive`, `nosnippet`,
  `max-snippet`, `max-image-preview`, `max-video-preview`. Omitted
  entirely when a page is fully indexable (default).
- **Breadcrumbs** — every generator emits a `BreadcrumbList` JSON-LD.
- **Structured data** — page-type-specific schemas (`Course`,
  `Article`, `JobPosting`, `Person`, `FAQPage`, `TechArticle`,
  `EducationalOccupationalCredential`) stack alongside `BreadcrumbList`.
- **Hreflang** — pass `hreflang: [{ hreflang, path }]` for localized
  variants; emitted as `<link rel="alternate" hreflang="…">`.
- **Pagination** — pass `pagination: { basePath, page, totalPages }`
  for `rel="prev"` / `rel="next"`.

## Sitemap architecture (16 segments)

```
/sitemap-index.xml
├── /sitemap.xml                # static site routes
├── /sitemap-courses.xml        # course detail pages
├── /sitemap-categories.xml     # category listings
├── /sitemap-programs.xml       # program landings (new)
├── /sitemap-blog.xml           # blog posts
├── /sitemap-learning-paths.xml # curated paths
├── /sitemap-careers.xml        # career pages
├── /sitemap-success-stories.xml
├── /sitemap-images.xml
├── /sitemap-help.xml           # help / docs
├── /sitemap-partners.xml       # partner profiles (new)
├── /sitemap-brands.xml         # partner academies (new)
├── /sitemap-landing.xml        # marketing landings (new)
├── /sitemap-locations.xml      # geo pages (new)
└── /sitemap-instructors.xml    # instructor profiles (new)
```

Every segment is a server route, so each is generated fresh on request
and stays in sync with published rows without a rebuild — ready for
unlimited courses, brands, blogs, and AI-generated pages.

## Redirect management

`resolveRedirect(pathname)` is a pure function. Call it from a route's
`beforeLoad` (or a public server route) and `throw redirect({ to, statusCode })`
when it returns a match. Extend `REDIRECT_RULES` to consolidate any legacy
URL — no other code needs to change.

## What did NOT change

- No UI file was edited. No component moved. No route was renamed.
- Authentication (`src/integrations/supabase/*`, OTP flows, role-redirect)
  untouched.
- Payment logic (`src/routes/api/public/webhooks/cashfree*`, payments
  functions) untouched.
- Existing SEO helpers (`meta.ts`, `schemas.ts`, `sitemap-utils.ts`)
  untouched. The engine calls into `schemas.ts` for
  `organizationSchema()` and `webSiteSchema()`.
