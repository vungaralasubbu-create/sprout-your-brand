// Editorial workflow constants — reused across content pages.
export const REVIEW_STAGES = [
  "Draft",
  "Technical Review",
  "Editorial Review",
  "SEO Review",
  "Legal Review",
  "Approved",
  "Published",
] as const;
export type ReviewStage = (typeof REVIEW_STAGES)[number];

export const CONTENT_BADGES = [
  "Beginner Friendly",
  "Expert Reviewed",
  "Updated Recently",
  "AI Assisted",
  "Practical Guide",
  "Career Focused",
] as const;
export type ContentBadge = (typeof CONTENT_BADGES)[number];

export interface ChangelogEntry {
  version: string;
  date: string;
  summary: string;
  editor: string; // author slug or display name
}

export interface Reference {
  id: string;
  title: string;
  publisher: string;
  publishedAt: string;
  url: string;
  category: string;
  reliability: "High" | "Medium" | "Low";
}

export interface EditorialMeta {
  status: ReviewStage;
  publishedAt: string;
  updatedAt: string;
  reviewedBy?: string; // author slug
  reviewDate?: string;
  version: string;
  reasonForUpdate?: string;
  badges?: ContentBadge[];
  changelog?: ChangelogEntry[];
  references?: Reference[];
  qualityScore?: number; // 0-100
}

export function defaultEditorial(overrides: Partial<EditorialMeta> = {}): EditorialMeta {
  return {
    status: "Published",
    publishedAt: "2026-01-15",
    updatedAt: "2026-07-10",
    reviewedBy: "review-board",
    reviewDate: "2026-07-10",
    version: "1.2.0",
    badges: ["Expert Reviewed", "Updated Recently"],
    qualityScore: 88,
    changelog: [
      { version: "1.2.0", date: "2026-07-10", summary: "Refreshed statistics and added new examples.", editor: "editorial-team" },
      { version: "1.1.0", date: "2026-04-02", summary: "Added FAQ and references section.", editor: "curriculum-desk" },
      { version: "1.0.0", date: "2026-01-15", summary: "Initial publication.", editor: "editorial-team" },
    ],
    ...overrides,
  };
}
