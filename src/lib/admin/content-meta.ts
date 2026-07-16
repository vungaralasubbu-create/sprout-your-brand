export const CONTENT_TYPES = [
  "learn_guide","glossary","comparison","faq","roadmap",
  "career_guide","interview_guide","cheat_sheet","learning_path","program_support",
] as const;
export type ContentType = typeof CONTENT_TYPES[number];

export const CONTENT_STATUSES = [
  "draft","in_review","approved","scheduled","published","archived",
] as const;
export type ContentStatus = typeof CONTENT_STATUSES[number];

export const CONTENT_TYPE_LABEL: Record<string, string> = {
  learn_guide: "Learn Guide",
  glossary: "Glossary",
  comparison: "Comparison",
  faq: "FAQ",
  roadmap: "Roadmap",
  career_guide: "Career Guide",
  interview_guide: "Interview Guide",
  cheat_sheet: "Cheat Sheet",
  learning_path: "Learning Path",
  program_support: "Program Support",
};

export const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-foreground",
  in_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  approved: "bg-blue-100 text-blue-800",
  scheduled: "bg-purple-100 text-purple-800",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-neutral-200 text-neutral-700",
};

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};
