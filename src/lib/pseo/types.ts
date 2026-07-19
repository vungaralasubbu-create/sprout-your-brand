/**
 * Programmatic SEO — shared types.
 *
 * The pSEO engine generates a landing page for every (course × page_type × location)
 * combination. Each row lives in `pseo_pages` and is served through `/p/$slug`.
 *
 * Page types:
 *  - by_city / by_state / online — geo & delivery variants of a course
 *  - career_roadmap / interview_questions / salary_guide / projects
 *  - certification / faq / internship — informational long-tails
 */

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
}

export interface PseoPage {
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

export interface PseoPageWithRelations extends PseoPage {
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
