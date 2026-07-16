// Topical-authority data model. Every pillar declares structured
// knowledge (overview, applications, careers, roadmap, tools, FAQs);
// clusters are generated from a shared template + per-pillar overrides.

export type PillarCategory =
  | "AI & Machine Learning"
  | "Data & Analytics"
  | "Programming & Development"
  | "Cloud & DevOps"
  | "Security"
  | "Emerging Tech"
  | "Engineering"
  | "Business & Finance"
  | "Marketing & People"
  | "Career";

export interface CareerRow {
  role: string;
  salaryInr: string; // "6-14 LPA"
  salaryUsd?: string;
}

export interface RoadmapPhase {
  phase: string; // "Foundation" / "Intermediate" / "Advanced"
  weeks?: string;
  items: string[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface Pillar {
  slug: string;
  name: string;
  tagline: string;
  category: PillarCategory;
  /** 2-3 sentence intro used for hero + meta description. */
  overview: string;
  /** Longer descriptive paragraph for the main body. */
  body?: string;
  applications: string[];
  careers: CareerRow[];
  skills: string[];
  roadmap: RoadmapPhase[];
  trends: string[];
  tools: string[];
  faqs: Faq[];
  /** Optional slugs for related programs (matches courses/categories). */
  relatedProgramSlugs?: string[];
  /** Slug seeds for related pillars (used for internal linking). */
  relatedPillarSlugs?: string[];
  /** Optional cluster overrides. When absent, a standard set is generated. */
  clusterOverrides?: ClusterSeed[];
}

export type ClusterKind =
  | "what-is"
  | "career-roadmap"
  | "salary-guide"
  | "tools"
  | "applications"
  | "certifications"
  | "interview-questions"
  | "projects"
  | "trends"
  | "learning-path"
  | "for-beginners"
  | "jobs"
  | "custom";

export interface ClusterSeed {
  slug: string;
  kind: ClusterKind;
  title: string;
  /** 140-160 char meta description. */
  description: string;
  intro: string;
  sections: { heading: string; body: string; bullets?: string[] }[];
  faqs?: Faq[];
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  readingMinutes?: number;
}

export interface Cluster extends ClusterSeed {
  pillarSlug: string;
  updatedAt: string;
}
