/**
 * Per-page-type SEO generators. Each helper maps a domain object
 * (course row, blog post row, partner profile, etc.) into a
 * fully-populated `SeoInput` for `buildSeo()`.
 *
 * Every page type on the platform is covered:
 *   homepage, course, blog, career, instructor, partner, brand,
 *   category, subcategory, program, certification, location,
 *   AI-generated, landing, success story, FAQ, docs.
 *
 * Generators are pure: no I/O, no DB access, no side effects. Callers
 * fetch data in a loader and pipe it through the generator inside
 * `head()`. This lets every route ship its own SEO with zero UI churn.
 */
import type { SeoInput } from "./engine";
import { buildSeo, type HeadPayload, SITE_ORIGIN } from "./engine";
import { withHome, type BreadcrumbItem } from "./breadcrumbs";
import {
  organizationSchema,
  websiteSchema,
} from "./schemas";

/** Wrap generator output in the TanStack head payload shape. */
function head(input: SeoInput): HeadPayload {
  return buildSeo(input);
}

// ---------- Homepage ----------
export function homepageSeo(): HeadPayload {
  return head({
    path: "/",
    title: "Glintr — Launch, Sell & Grow Your Career with AI-First Programs",
    description:
      "Glintr helps ambitious learners and sales professionals launch AI-first careers and businesses with live cohorts, mentors, and hands-on projects.",
    ogType: "website",
    schemas: [organizationSchema(), websiteSchema()],
  });
}

// ---------- Course / Program detail ----------
export interface CourseSeoData {
  slug: string;
  categorySlug: string;
  categoryName?: string;
  title: string;
  summary: string;
  cover?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  instructorName?: string | null;
  priceInr?: number | null;
  ratingValue?: number | null;
  ratingCount?: number | null;
}

export function courseSeo(c: CourseSeoData): HeadPayload {
  const path = `/programs/${c.categorySlug}/${c.slug}`;
  const breadcrumbs = withHome([
    { name: "Programs", path: "/programs" },
    { name: c.categoryName ?? c.categorySlug, path: `/programs/${c.categorySlug}` },
    { name: c.title, path },
  ]);
  const courseSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: c.summary,
    url: `${SITE_ORIGIN}${path}`,
    provider: { "@type": "Organization", name: "Glintr", url: SITE_ORIGIN },
  };
  if (c.instructorName) {
    courseSchema.instructor = { "@type": "Person", name: c.instructorName };
  }
  if (c.ratingValue && c.ratingCount) {
    courseSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: c.ratingValue,
      ratingCount: c.ratingCount,
    };
  }
  if (c.priceInr) {
    courseSchema.offers = {
      "@type": "Offer",
      price: c.priceInr,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_ORIGIN}${path}`,
    };
  }
  return head({
    path,
    title: `${c.title} — ${c.categoryName ?? "Program"}`,
    description: c.summary,
    ogType: "article",
    image: c.cover ?? null,
    imageAlt: c.title,
    updatedAt: c.updatedAt ?? undefined,
    publishedAt: c.publishedAt ?? undefined,
    breadcrumbs,
    schemas: [courseSchema],
  });
}

// ---------- Blog post ----------
export interface BlogSeoData {
  slug: string;
  title: string;
  excerpt: string;
  cover?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  category?: string | null;
  tags?: string[];
}

export function blogPostSeo(b: BlogSeoData): HeadPayload {
  const path = `/blog/${b.slug}`;
  const breadcrumbs = withHome([
    { name: "Blog", path: "/blog" },
    ...(b.category ? [{ name: b.category, path: `/blog?category=${encodeURIComponent(b.category)}` }] : []),
    { name: b.title, path },
  ]);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: b.title,
    description: b.excerpt,
    image: b.cover ?? undefined,
    datePublished: b.publishedAt ?? undefined,
    dateModified: b.updatedAt ?? b.publishedAt ?? undefined,
    author: b.author ? { "@type": "Person", name: b.author } : undefined,
    publisher: {
      "@type": "Organization",
      name: "Glintr",
      logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/favicon.ico` },
    },
    mainEntityOfPage: `${SITE_ORIGIN}${path}`,
  };
  return head({
    path,
    title: b.title,
    description: b.excerpt,
    ogType: "article",
    image: b.cover ?? null,
    imageAlt: b.title,
    author: b.author ?? undefined,
    publishedAt: b.publishedAt ?? undefined,
    updatedAt: b.updatedAt ?? undefined,
    keywords: b.tags,
    breadcrumbs,
    schemas: [articleSchema],
  });
}

// ---------- Blog index (paginated) ----------
export function blogIndexSeo(page = 1, totalPages = 1): HeadPayload {
  return head({
    path: page > 1 ? `/blog?page=${page}` : "/blog",
    title: page > 1 ? `Blog — Page ${page}` : "Glintr Blog — AI-first career, sales & entrepreneurship playbooks",
    description:
      "Deep-dive playbooks, tutorials and success stories on AI careers, sales, entrepreneurship, education and building an online academy with Glintr.",
    ogType: "website",
    pagination: totalPages > 1 ? { basePath: "/blog", page, totalPages } : undefined,
    breadcrumbs: withHome([{ name: "Blog", path: "/blog" }]),
  });
}

// ---------- Career pages ----------
export function careerPageSeo(role: { title: string; slug: string; summary: string; location?: string; }): HeadPayload {
  const path = `/careers/${role.slug}`;
  const jobSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.title,
    description: role.summary,
    hiringOrganization: { "@type": "Organization", name: "Glintr", sameAs: SITE_ORIGIN },
    jobLocation: role.location
      ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: role.location } }
      : undefined,
  };
  return head({
    path,
    title: `${role.title} — Careers at Glintr`,
    description: role.summary,
    ogType: "article",
    breadcrumbs: withHome([
      { name: "Careers", path: "/careers" },
      { name: role.title, path },
    ]),
    schemas: [jobSchema],
  });
}

// ---------- Instructor profile ----------
export interface InstructorSeoData {
  slug: string;
  name: string;
  headline: string;
  bio: string;
  avatar?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
}

export function instructorSeo(i: InstructorSeoData): HeadPayload {
  const path = `/instructors/${i.slug}`;
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: i.name,
    description: i.bio,
    image: i.avatar ?? undefined,
    url: `${SITE_ORIGIN}${path}`,
    sameAs: [i.linkedin, i.twitter].filter(Boolean),
    jobTitle: i.headline,
    worksFor: { "@type": "Organization", name: "Glintr" },
  };
  return head({
    path,
    title: `${i.name} — ${i.headline}`,
    description: i.bio,
    ogType: "profile",
    image: i.avatar ?? null,
    imageAlt: i.name,
    breadcrumbs: withHome([
      { name: "Instructors", path: "/instructors" },
      { name: i.name, path },
    ]),
    schemas: [personSchema],
  });
}

// ---------- Partner profile ----------
export interface PartnerSeoData {
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  logo?: string | null;
}

export function partnerSeo(p: PartnerSeoData): HeadPayload {
  const path = `/partners/${p.slug}`;
  return head({
    path,
    title: `${p.name} — Glintr Partner`,
    description: `${p.tagline}. ${p.bio}`,
    ogType: "profile",
    image: p.logo ?? null,
    imageAlt: p.name,
    breadcrumbs: withHome([
      { name: "Partners", path: "/partners" },
      { name: p.name, path },
    ]),
  });
}

// ---------- Brand / Academy page ----------
export interface BrandSeoData {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo?: string | null;
  cover?: string | null;
}

export function brandSeo(b: BrandSeoData): HeadPayload {
  const path = `/academy/${b.slug}`;
  return head({
    path,
    title: `${b.name} — ${b.tagline}`,
    description: b.description,
    ogType: "website",
    image: b.cover ?? b.logo ?? null,
    imageAlt: b.name,
    breadcrumbs: withHome([
      { name: "Academies", path: "/academy" },
      { name: b.name, path },
    ]),
  });
}

// ---------- Category listing ----------
export function categorySeo(cat: { slug: string; name: string; description: string; count?: number }): HeadPayload {
  const path = `/programs/${cat.slug}`;
  return head({
    path,
    title: `${cat.name} — Programs on Glintr`,
    description: cat.description,
    ogType: "website",
    breadcrumbs: withHome([
      { name: "Programs", path: "/programs" },
      { name: cat.name, path },
    ]),
  });
}

// ---------- Subcategory listing ----------
export function subcategorySeo(cat: { slug: string; name: string; subSlug: string; subName: string; description: string; }): HeadPayload {
  const path = `/programs/${cat.slug}/${cat.subSlug}`;
  return head({
    path,
    title: `${cat.subName} — ${cat.name} on Glintr`,
    description: cat.description,
    ogType: "website",
    breadcrumbs: withHome([
      { name: "Programs", path: "/programs" },
      { name: cat.name, path: `/programs/${cat.slug}` },
      { name: cat.subName, path },
    ]),
  });
}

// ---------- Program overview (top-level like /programs) ----------
export function programsIndexSeo(): HeadPayload {
  return head({
    path: "/programs",
    title: "All Programs — AI, Sales, Career & Entrepreneurship",
    description:
      "Browse every Glintr program: AI mastery, sales careers, entrepreneurship, marketing, career OS and more — live cohorts with mentors and outcomes.",
    ogType: "website",
    breadcrumbs: withHome([{ name: "Programs", path: "/programs" }]),
  });
}

// ---------- Certification page ----------
export function certificationSeo(cert: {
  slug: string;
  name: string;
  issuedBy?: string;
  description: string;
  image?: string | null;
}): HeadPayload {
  const path = `/certifications/${cert.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    name: cert.name,
    description: cert.description,
    credentialCategory: "Certificate",
    recognizedBy: { "@type": "Organization", name: cert.issuedBy ?? "Glintr" },
    url: `${SITE_ORIGIN}${path}`,
  };
  return head({
    path,
    title: `${cert.name} Certification`,
    description: cert.description,
    ogType: "article",
    image: cert.image ?? null,
    imageAlt: cert.name,
    breadcrumbs: withHome([
      { name: "Certifications", path: "/certifications" },
      { name: cert.name, path },
    ]),
    schemas: [schema],
  });
}

// ---------- Location page ----------
export function locationSeo(loc: { slug: string; city: string; region?: string; country?: string; summary: string; }): HeadPayload {
  const path = `/locations/${loc.slug}`;
  return head({
    path,
    title: `Glintr in ${loc.city}${loc.region ? `, ${loc.region}` : ""} — Programs & Careers`,
    description: loc.summary,
    ogType: "website",
    breadcrumbs: withHome([
      { name: "Locations", path: "/locations" },
      { name: loc.city, path },
    ]),
  });
}

// ---------- AI-generated / dynamic content page ----------
export function aiGeneratedSeo(page: {
  slug: string;
  title: string;
  description: string;
  cover?: string | null;
  publishedAt?: string | null;
  index?: boolean;
}): HeadPayload {
  const path = `/ai/${page.slug}`;
  return head({
    path,
    title: page.title,
    description: page.description,
    ogType: "article",
    image: page.cover ?? null,
    publishedAt: page.publishedAt ?? undefined,
    robots: page.index === false ? { index: false } : { maxImagePreview: "large" },
    breadcrumbs: withHome([
      { name: "AI Library", path: "/ai" },
      { name: page.title, path },
    ]),
  });
}

// ---------- Landing page (marketing) ----------
export function landingSeo(lp: {
  slug: string;
  title: string;
  description: string;
  cover?: string | null;
}): HeadPayload {
  const path = `/l/${lp.slug}`;
  return head({
    path,
    title: lp.title,
    description: lp.description,
    ogType: "website",
    image: lp.cover ?? null,
    breadcrumbs: withHome([{ name: lp.title, path }]),
  });
}

// ---------- Student success story ----------
export function successStorySeo(s: {
  slug: string;
  studentName: string;
  headline: string;
  summary: string;
  cover?: string | null;
  publishedAt?: string | null;
}): HeadPayload {
  const path = `/success/${s.slug}`;
  return head({
    path,
    title: `${s.studentName} — ${s.headline}`,
    description: s.summary,
    ogType: "article",
    image: s.cover ?? null,
    imageAlt: s.studentName,
    publishedAt: s.publishedAt ?? undefined,
    breadcrumbs: withHome([
      { name: "Success Stories", path: "/success" },
      { name: s.studentName, path },
    ]),
  });
}

// ---------- FAQ page ----------
export function faqSeo(faq: {
  path: string;
  title: string;
  description: string;
  questions: Array<{ q: string; a: string }>;
  breadcrumbs?: BreadcrumbItem[];
}): HeadPayload {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.questions.map((qa) => ({
      "@type": "Question",
      name: qa.q,
      acceptedAnswer: { "@type": "Answer", text: qa.a },
    })),
  };
  return head({
    path: faq.path,
    title: faq.title,
    description: faq.description,
    ogType: "website",
    breadcrumbs: faq.breadcrumbs ?? withHome([{ name: "FAQ", path: faq.path }]),
    schemas: [schema],
  });
}

// ---------- Docs / help article ----------
export function docsSeo(d: {
  slug: string;
  title: string;
  summary: string;
  section?: string;
  updatedAt?: string | null;
}): HeadPayload {
  const path = `/help/${d.slug}`;
  const techArticle = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: d.title,
    description: d.summary,
    dateModified: d.updatedAt ?? undefined,
    articleSection: d.section,
    mainEntityOfPage: `${SITE_ORIGIN}${path}`,
  };
  return head({
    path,
    title: `${d.title} — Glintr Help`,
    description: d.summary,
    ogType: "article",
    updatedAt: d.updatedAt ?? undefined,
    breadcrumbs: withHome([
      { name: "Help", path: "/help" },
      ...(d.section ? [{ name: d.section, path: `/help#${encodeURIComponent(d.section)}` }] : []),
      { name: d.title, path },
    ]),
    schemas: [techArticle],
  });
}
