// Enterprise GEO Platform — constants (additive, backend-only).

export const GEO_ENTITY_TYPES = [
  "technology",
  "programming_language",
  "company",
  "university",
  "skill",
  "job_role",
  "certification",
  "course",
  "framework",
  "tool",
  "industry",
  "country",
  "city",
  "standard",
  "concept",
  "person",
] as const;
export type GeoEntityType = (typeof GEO_ENTITY_TYPES)[number];

export const GEO_RECOMMENDATION_CATEGORIES = [
  "summary",
  "quick_answer",
  "tldr",
  "key_takeaways",
  "important_facts",
  "statistics",
  "definitions",
  "examples",
  "step_by_step",
  "common_mistakes",
  "faqs",
  "glossary",
  "comparison_table",
  "checklist",
  "decision_tree",
  "resource_list",
  "structured_section",
  "schema",
  "citation",
  "freshness",
  "entity",
  "question",
] as const;
export type GeoRecommendationCategory =
  (typeof GEO_RECOMMENDATION_CATEGORIES)[number];

export const GEO_QUESTION_TYPES = [
  "what",
  "how",
  "why",
  "when",
  "which",
  "who",
  "how_much",
  "how_to_become",
  "requirements",
  "comparison",
] as const;
export type GeoQuestionType = (typeof GEO_QUESTION_TYPES)[number];

export const GEO_SCHEMA_TYPES = [
  "Article",
  "Course",
  "FAQPage",
  "HowTo",
  "Organization",
  "BreadcrumbList",
  "VideoObject",
  "Person",
  "Review",
  "Event",
  "JobPosting",
  "EducationalOrganization",
  "ItemList",
  "Product",
] as const;

export const GEO_CONTENT_TYPES = [
  "blog",
  "course",
  "content_hub",
  "pseo",
  "career",
  "topic",
  "glossary",
  "page",
] as const;
export type GeoContentType = (typeof GEO_CONTENT_TYPES)[number];

export const GEO_STRUCTURED_SECTIONS = [
  "definition",
  "benefits",
  "prerequisites",
  "use_cases",
  "career_scope",
  "industry_demand",
  "salary",
  "roadmap",
  "projects",
  "interview_questions",
  "certifications",
  "related_technologies",
  "further_reading",
] as const;

export const GEO_PROMPT_VERSION = "geo.v1";
