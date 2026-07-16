// Programmatic SEO engine — types

export type PseoStatus = "draft" | "review" | "approved" | "scheduled" | "published";

export type PseoPageType =
  | "course"
  | "career-guide"
  | "salary-guide"
  | "learning-path"
  | "interview-guide"
  | "certification-guide"
  | "technology-guide"
  | "comparison"
  | "skill-guide"
  | "industry-guide"
  | "glossary"
  | "faq"
  | "location";

export type PseoTemplateId =
  | "best-skill-course"
  | "how-to-learn-skill"
  | "what-is-technology"
  | "career-guide"
  | "salary-guide"
  | "technology-roadmap"
  | "interview-questions"
  | "certification-guide"
  | "technology-projects"
  | "technology-for-beginners"
  | "technology-trends"
  | "location-course"
  | "comparison"
  | "how-to-become"
  | "faq-hub"
  | "glossary-term";

export interface PseoSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface PseoFaq {
  q: string;
  a: string;
}

export interface PseoRelated {
  label: string;
  href: string;
}

export interface PseoPage {
  id: string;
  slug: string;
  pageType: PseoPageType;
  templateId: PseoTemplateId;
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
  related: PseoRelated[];
  readingTimeMin: number;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  publishedAt?: string;
  reviewNotes?: string;
  analytics?: {
    impressions: number;
    clicks: number;
    ctr: number;
    avgPosition: number;
    organicTraffic: number;
    internalClicks: number;
  };
}

export interface PseoTemplateDef {
  id: PseoTemplateId;
  label: string;
  pageType: PseoPageType;
  description: string;
  variables: Array<{ key: string; label: string; placeholder?: string; required?: boolean }>;
  titleTemplate: string;
  descriptionTemplate: string;
  slugTemplate: string;
  h1Template: string;
  sectionPlan: Array<{ heading: string; body: string; bullets?: string[] }>;
  faqPlan: Array<{ q: string; a: string }>;
  keywords: string[];
}
