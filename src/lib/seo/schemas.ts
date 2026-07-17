/**
 * JSON-LD schema builders for every content type on Glintr.
 * All builders return plain objects ready for `buildPageHead({ schema })`.
 */
import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo-head";

const ORG_ID = `${SITE_ORIGIN}/#organization`;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Glintr",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/__l5e/assets-v1/d12f985f-d4a9-44a8-ae66-6ea6d0a3b725/glintr-mark.png`,
    slogan: "Launch. Sell. Grow.",
    sameAs: [
      "https://www.linkedin.com/company/glintr",
      "https://twitter.com/glintrhq",
      "https://www.instagram.com/glintrhq",
      "https://www.youtube.com/@glintrhq",
    ],
  };
}

export function educationalOrganizationSchema(name: string, url: string, description?: string, logo?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name,
    url,
    description,
    logo,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    url: SITE_ORIGIN,
    name: "Glintr",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_ORIGIN}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export interface CourseSchemaInput {
  name: string;
  description: string;
  slug: string;
  categorySlug: string;
  image?: string | null;
  duration?: string | null;
  level?: string | null;
  language?: string | null;
  price?: number | null;
  currency?: string;
  rating?: { value: number; count: number } | null;
}

export function courseSchema(c: CourseSchemaInput) {
  const url = absoluteUrl(`/programs/${c.categorySlug}/${c.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.name,
    description: c.description,
    url,
    image: c.image ?? undefined,
    provider: { "@id": ORG_ID, "@type": "Organization", name: "Glintr", sameAs: SITE_ORIGIN },
    inLanguage: c.language ?? "en",
    educationalLevel: c.level ?? undefined,
    timeRequired: c.duration ?? undefined,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      inLanguage: c.language ?? "en",
    },
    offers: c.price != null ? {
      "@type": "Offer",
      price: c.price,
      priceCurrency: c.currency ?? "INR",
      availability: "https://schema.org/InStock",
      url,
    } : undefined,
    aggregateRating: c.rating ? {
      "@type": "AggregateRating",
      ratingValue: c.rating.value,
      reviewCount: c.rating.count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  slug: string;
  image?: string | null;
  authorName?: string | null;
  authorSlug?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  section?: string | null;
  keywords?: string[];
}

export function articleSchema(a: ArticleSchemaInput) {
  const url = absoluteUrl(`/blog/${a.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    url,
    mainEntityOfPage: url,
    image: a.image ?? undefined,
    author: a.authorName ? {
      "@type": "Person",
      name: a.authorName,
      url: a.authorSlug ? absoluteUrl(`/authors/${a.authorSlug}`) : undefined,
    } : undefined,
    publisher: { "@id": ORG_ID },
    datePublished: a.publishedAt ?? undefined,
    dateModified: a.updatedAt ?? a.publishedAt ?? undefined,
    articleSection: a.section ?? undefined,
    keywords: a.keywords?.length ? a.keywords.join(", ") : undefined,
  };
}

export function faqSchema(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

export function collectionPageSchema(name: string, path: string, description: string, count?: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    ...(count != null ? { numberOfItems: count } : {}),
  };
}

export function itemListSchema(name: string, items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: absoluteUrl(it.path),
    })),
  };
}

export function educationalOccupationalProgramSchema(input: {
  name: string;
  description: string;
  path: string;
  duration?: string;
  occupation?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { "@id": ORG_ID },
    timeToComplete: input.duration,
    occupationalCategory: input.occupation,
  };
}

export function reviewSchema(input: {
  itemName: string;
  author: string;
  rating: number;
  body: string;
  date?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@type": "Course", name: input.itemName },
    reviewRating: { "@type": "Rating", ratingValue: input.rating, bestRating: 5 },
    author: { "@type": "Person", name: input.author },
    reviewBody: input.body,
    datePublished: input.date,
  };
}

export function aggregateRatingSchema(input: {
  itemName: string;
  value: number;
  count: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    itemReviewed: { "@type": "Course", name: input.itemName },
    ratingValue: input.value,
    reviewCount: input.count,
    bestRating: 5,
    worstRating: 1,
  };
}
