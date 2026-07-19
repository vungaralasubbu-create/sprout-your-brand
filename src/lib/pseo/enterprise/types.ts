// Enterprise pSEO shared types.

export type PseoPageTypeEx =
  | "course" | "career" | "technology" | "certification"
  | "interview_questions" | "interview_experience" | "project" | "tutorial"
  | "roadmap" | "skill" | "salary" | "college" | "university"
  | "company_hiring" | "company_interview" | "job_role" | "industry"
  | "tool" | "comparison" | "trending" | "location" | "event"
  | "scholarship" | "internship" | "placement" | "success_story" | "case_study";

export type PseoTemplate = {
  id: string;
  key: string;
  name: string;
  page_type: PseoPageTypeEx;
  url_pattern: string;         // e.g. "/interview/{technology}-interview-questions"
  title_pattern: string;
  meta_pattern: string | null;
  h1_pattern: string | null;
  variables: string[];         // e.g. ["technology"]
  sections: Array<{ id: string; heading: string; prompt: string; minWords?: number }>;
  schema_types: string[];      // ["Article","FAQPage","BreadcrumbList"]
  prompt_version: string | null;
  min_words: number;
  is_active: boolean;
};

export type PseoEntity = {
  id: string;
  kind: string;                // "technology" | "role" | "company" | "skill" | ...
  slug: string;
  name: string;
  aliases: string[];
  attributes: Record<string, unknown>;
  priority: number;
  is_active: boolean;
};

export type GeneratedSection = { id: string; heading: string; body: string };

export type GeneratedPageContent = {
  intro: string;
  sections: GeneratedSection[];
  faqs: Array<{ q: string; a: string }>;
  pros?: string[];
  cons?: string[];
  bullets?: Record<string, string[]>;
  cta?: { title: string; body: string; href?: string };
  summary?: string;
  keywords: string[];
  image_prompts?: string[];
  internal_link_suggestions?: Array<{ anchor: string; slug: string }>;
  schema_suggestions?: string[];
  word_count: number;
};

export type QualityReview = {
  grammar_score: number;
  readability_score: number;
  seo_score: number;
  duplicate_score: number;
  keyword_coverage: number;
  internal_link_count: number;
  schema_complete: boolean;
  word_count: number;
  overall_score: number;
  issues: Array<{ severity: "low" | "med" | "high"; message: string }>;
  suggestions: string[];
};

export type ReviewState =
  | "draft" | "ai_generated" | "human_review" | "seo_review"
  | "approved" | "scheduled" | "published" | "archived" | "rejected";
