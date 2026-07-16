// Curated editorial authors — verified by admins. Never fabricate credentials.
export type EditorRole =
  | "Author"
  | "Technical Reviewer"
  | "SEO Reviewer"
  | "Content Editor"
  | "Administrator";

export interface Author {
  slug: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  languages: string[];
  yearsExperience?: number;
  verified: boolean;
  roles: EditorRole[];
  socials?: { label: string; href: string }[];
  contributions: {
    programs: string[];
    learnGuides: string[];
    blogs: string[];
    glossary: string[];
  };
  lastActive: string; // ISO date
  photoInitials: string;
}

export const authors: Author[] = [
  {
    slug: "editorial-team",
    name: "Glintr Editorial Team",
    title: "In-house Editorial Desk",
    bio: "The Glintr editorial desk curates, reviews and publishes every learning guide, glossary entry and program page. All content passes technical, editorial and SEO review before publication.",
    expertise: ["Content Strategy", "Learning Design", "SEO"],
    languages: ["English", "Hindi"],
    verified: true,
    roles: ["Author", "Content Editor", "Administrator"],
    contributions: {
      programs: ["chatgpt-mastery", "python-programming", "aws-cloud"],
      learnGuides: ["what-is-ai", "python-basics", "cloud-101"],
      blogs: ["how-to-learn-ai", "career-in-ai"],
      glossary: ["ai", "ml", "llm"],
    },
    lastActive: "2026-07-14",
    photoInitials: "GE",
  },
  {
    slug: "curriculum-desk",
    name: "Glintr Curriculum Desk",
    title: "Curriculum & Instructional Design",
    bio: "Designs learning outcomes, difficulty gradients and assessment rubrics across every Glintr program. Reviews prerequisites and study-time estimates.",
    expertise: ["Instructional Design", "Assessment", "Curriculum"],
    languages: ["English"],
    verified: true,
    roles: ["Author", "Technical Reviewer"],
    contributions: {
      programs: ["data-science", "generative-ai", "prompt-engineering"],
      learnGuides: ["study-plan", "learning-paths"],
      blogs: [],
      glossary: ["curriculum", "prerequisite"],
    },
    lastActive: "2026-07-10",
    photoInitials: "CD",
  },
  {
    slug: "review-board",
    name: "Glintr Review Board",
    title: "Technical & Fact-Check Review",
    bio: "Verifies technical accuracy, cites primary sources and flags unsupported claims. Every published article carries a review-board sign-off with date and version.",
    expertise: ["Fact Checking", "Technical Review", "References"],
    languages: ["English"],
    verified: true,
    roles: ["Technical Reviewer", "SEO Reviewer"],
    contributions: {
      programs: [],
      learnGuides: ["what-is-ml", "what-is-llm"],
      blogs: [],
      glossary: [],
    },
    lastActive: "2026-07-13",
    photoInitials: "RB",
  },
];

export function listAuthors() {
  return authors;
}
export function getAuthor(slug: string) {
  return authors.find((a) => a.slug === slug);
}
