/**
 * Programmatic SEO — shared types.
 *
 * Two families live here side by side:
 *
 *  1. Legacy editorial pSEO (in-browser localStorage prototype used by the
 *     admin `/admin/programmatic-seo` editor). Types: PseoPage, PseoStatus,
 *     PseoSection, PseoFaq, PseoTemplateDef, PseoAnalytics.
 *
 *  2. Database-backed pSEO engine (auto-generated per course × page_type ×
 *     location, served through `/p/$slug`, indexed via `/sitemap-pseo.xml`).
 *     Types: PseoDbPage, PseoDbPageWithRelations, PseoContent, PseoLocation,
 *     PseoPageType.
 *
 * The two systems don't share rows — the legacy editor is scoped to a
 * hand-authored preview flow, while the DB engine is the production
 * pipeline that scales to hundreds of thousands of pages.
 */

// ============================================================
// (1) Legacy editorial prototype
// ============================================================

export type PseoStatus =
  | "draft"
  | "review"
  | "approved"
  | "scheduled"
  | "published";

export interface PseoSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface PseoFaq {
  q: string;
  a: string;
}

export interface PseoAnalytics {
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  organicTraffic: number;
  internalClicks: number;
}

export interface PseoPage {
  id: string;
  slug: string;
  pageType: string;
  templateId: string;
  category: string;
  status: PseoStatus;
  author: string;
  title: string;
  description: string;
  canonical: string;
  h1: string;
  keywords: string[];
  variables: Record<string, string>;
  sections: PseoSection[];
  faqs: PseoFaq[];
  related: Array<{ label: string; href: string }>;
  readingTimeMin: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledFor?: string;
  reviewNotes?: string;
  analytics: PseoAnalytics;
}

export interface PseoTemplateVar {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

export interface PseoTemplateDef {
  id: string;
  label: string;
  pageType: string;
  description: string;
  variables: PseoTemplateVar[];
  titleTemplate: string;
  descriptionTemplate: string;
  slugTemplate: string;
  h1Template: string;
  keywords: string[];
  sectionPlan: PseoSection[];
  faqPlan: PseoFaq[];
}

// ============================================================
// (2) Database-backed pSEO engine
// ============================================================

export type PseoPageType =
  | "by_city"
  | "by_state"
  | "online"
  | "career_roadmap"
  | "interview_questions"
  | "salary_guide"
  | "projects"
  | "certification"
  | "faq"
  | "internship";

export interface PseoLocation {
  id: string;
  kind: "city" | "state" | "country";
  name: string;
  slug: string;
  parent_slug: string | null;
  country: string;
  population: number | null;
  priority: number;
}

export interface PseoContent {
  intro?: string;
  sections?: Array<{ heading: string; body: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  bullets?: string[];
  cta?: { label: string; href: string };
  stats?: Array<{ label: string; value: string }>;
  updated_at?: string;
  [key: string]: unknown;
}

export interface PseoDbPage {
  id: string;
  course_id: string | null;
  page_type: PseoPageType;
  location_id: string | null;
  slug: string;
  title: string | null;
  h1: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  content: PseoContent;
  keywords: string[];
  related_slugs: string[];
  status: "queued" | "generating" | "published" | "failed" | "archived";
  quality_score: number | null;
  word_count: number | null;
  view_count: number;
  published_at: string | null;
  last_regenerated_at: string | null;
  updated_at: string;
}

export interface PseoDbPageWithRelations extends PseoDbPage {
  course?: {
    id: string;
    slug: string;
    name: string;
    short_description: string | null;
    full_description: string | null;
    category_id: string | null;
    subcategory: string | null;
    hero_image_url: string | null;
    offer_price: number | null;
    base_price: number | null;
    currency: string | null;
    duration: string | null;
    level: string | null;
  } | null;
  location?: PseoLocation | null;
  interlinks?: Array<{ slug: string; title: string | null; relation: string }>;
}

export const PAGE_TYPE_LABEL: Record<PseoPageType, string> = {
  by_city: "in {location}",
  by_state: "in {location}",
  online: "Online",
  career_roadmap: "Career Roadmap",
  interview_questions: "Interview Questions",
  salary_guide: "Salary Guide",
  projects: "Projects",
  certification: "Certification",
  faq: "FAQ",
  internship: "Internship",
};
