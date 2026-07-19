// Enterprise AI Content Hub — shared types and taxonomy.
// Backend-only module. No UI dependencies.

export const CONTENT_HUB_TYPES = [
  "blog_article",
  "career_guide",
  "roadmap",
  "learning_path",
  "technology_guide",
  "interview_questions",
  "interview_guide",
  "project",
  "mini_tutorial",
  "course_guide",
  "salary_guide",
  "company_hiring_guide",
  "certification_guide",
  "industry_news",
  "ai_trend",
  "success_story",
  "case_study",
  "faq",
  "glossary",
  "comparison",
  "tool_review",
  "student_story",
  "learn_guide",
  "cheat_sheet",
  "program_support",
] as const;
export type ContentHubType = (typeof CONTENT_HUB_TYPES)[number];

export const CONTENT_HUB_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "archived",
  "rejected",
] as const;
export type ContentHubStatus = (typeof CONTENT_HUB_STATUSES)[number];

export const SUPPORTED_LANGUAGES = ["en", "hi", "te", "ta", "kn", "ml"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const AI_ASSIST_ACTIONS = [
  "rewrite",
  "expand",
  "simplify",
  "improve_readability",
  "improve_seo",
  "generate_faq",
  "generate_cta",
  "generate_summary",
  "generate_conclusion",
  "generate_table",
  "generate_internal_links",
  "generate_external_refs",
  "generate_meta",
  "generate_schema",
  "generate_image_prompt",
  "generate_video_topics",
] as const;
export type AIAssistAction = (typeof AI_ASSIST_ACTIONS)[number];

export const RELATION_TARGETS = [
  "content",
  "course",
  "career",
  "project",
  "certification",
  "company",
  "success_story",
] as const;
export type RelationTarget = (typeof RELATION_TARGETS)[number];
