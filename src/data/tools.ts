/**
 * Glintr Tools catalog — every /tools/* utility is registered here so the
 * hub, search, sitemap and related-content components can discover them.
 */

export type ToolCategory =
  | "AI Tools"
  | "Career Tools"
  | "Revenue Tools"
  | "Learning Tools"
  | "Business Tools"
  | "Resume Tools"
  | "Programming Tools"
  | "Engineering Tools"
  | "Marketing Tools"
  | "Finance Tools";

export interface ToolEntry {
  slug: string;
  title: string;
  short: string;
  description: string;
  category: ToolCategory;
  tags: string[];
  featured?: boolean;
  popular?: boolean;
  icon: string; // lucide icon name
  accent: string; // tailwind gradient class
  relatedGlossary?: string[];
  relatedPrograms?: string[];
  relatedPaths?: string[];
}

export const TOOLS: ToolEntry[] = [
  {
    slug: "ai-career-finder",
    title: "AI Career Finder",
    short: "Answer six quick questions and get a personalised program roadmap.",
    description:
      "An interactive career quiz that maps your background, interests and goals to specific programs, learning paths and adjacent skills — with no salary promises.",
    category: "Career Tools",
    tags: ["career", "quiz", "recommendation", "roadmap"],
    featured: true,
    popular: true,
    icon: "Compass",
    accent: "from-[#00E6FF] to-[#2E5CFF]",
    relatedPaths: ["artificial-intelligence", "software-development"],
    relatedGlossary: ["artificial-intelligence", "prompt-engineering"],
    relatedPrograms: ["artificial-intelligence", "chatgpt"],
  },
  {
    slug: "learning-roadmap",
    title: "Learning Roadmap Generator",
    short: "Choose a domain and get a foundation → advanced roadmap with projects.",
    description:
      "Generates a structured, stage-by-stage learning roadmap for AI, Web, VLSI, Embedded, IoT, Marketing, Finance and Medical Coding — including recommended programs and project ideas.",
    category: "Learning Tools",
    tags: ["roadmap", "learning path", "curriculum"],
    featured: true,
    popular: true,
    icon: "Route",
    accent: "from-[#7CFF6B] to-[#00E6FF]",
    relatedPaths: ["artificial-intelligence", "software-development"],
  },
  {
    slug: "skill-gap-analyzer",
    title: "Skill Gap Analyzer",
    short: "Compare your current skills with a target role and see what's missing.",
    description:
      "Paste your current skills and pick a target role. The analyzer surfaces the missing skills, learning sequence, glossary terms and related programs — without hiring or salary promises.",
    category: "Career Tools",
    tags: ["skill gap", "career", "upskilling"],
    featured: true,
    icon: "Scale",
    accent: "from-[#2E5CFF] to-[#7CFF6B]",
  },
  {
    slug: "ai-prompt-builder",
    title: "AI Prompt Builder",
    short: "Build structured, reliable prompts for ChatGPT, Claude and Gemini.",
    description:
      "Choose a use case, tone, output type and context, and the builder assembles a well-structured prompt template you can copy into any modern AI model.",
    category: "AI Tools",
    tags: ["prompt engineering", "chatgpt", "claude", "gemini"],
    featured: true,
    popular: true,
    icon: "Sparkles",
    accent: "from-[#00E6FF] to-[#7CFF6B]",
    relatedGlossary: ["prompt-engineering", "chatgpt", "claude", "gemini"],
    relatedPrograms: ["chatgpt", "claude-ai", "gemini-ai"],
  },
  {
    slug: "study-planner",
    title: "Study Planner",
    short: "Turn a goal + weekly hours into a realistic study schedule.",
    description:
      "Enter your learning goal, weekly hours and timeline. The planner returns a weekly schedule with milestones, revision blocks and recommended programs.",
    category: "Learning Tools",
    tags: ["study plan", "schedule", "time"],
    icon: "CalendarClock",
    accent: "from-[#7CFF6B] to-[#2E5CFF]",
    popular: true,
  },
  {
    slug: "revenue-share-calculator",
    title: "Revenue Share Calculator",
    short: "See illustrative revenue splits for the 70% and 50% partner models.",
    description:
      "Enter a sample sale value and Glintr revenue-share model. The calculator returns example splits with the operating policy and links — earnings are illustrative, not guaranteed.",
    category: "Revenue Tools",
    tags: ["revenue share", "partner", "earnings"],
    featured: true,
    icon: "Percent",
    accent: "from-[#2E5CFF] to-[#00E6FF]",
    relatedPrograms: [],
  },
  {
    slug: "resume-analyzer",
    title: "Resume Analyzer",
    short: "Paste your resume for an educational skill and learning breakdown.",
    description:
      "An AI-assisted educational tool that highlights skill signals, learning suggestions and adjacent glossary terms. It does not score resumes for ATS and does not promise hiring outcomes.",
    category: "Resume Tools",
    tags: ["resume", "skills", "learning"],
    icon: "FileText",
    accent: "from-[#00E6FF] to-[#2E5CFF]",
  },
  {
    slug: "interview-questions",
    title: "Interview Question Generator",
    short: "Practice questions and concept explanations by topic and difficulty.",
    description:
      "Pick a topic and difficulty. The generator returns practice questions with concept explanations and related programs — designed for learning, not hiring.",
    category: "Career Tools",
    tags: ["interview", "practice", "questions"],
    icon: "MessagesSquare",
    accent: "from-[#7CFF6B] to-[#00E6FF]",
    popular: true,
  },
  {
    slug: "learning-time-estimator",
    title: "Learning Time Estimator",
    short: "Estimate how long a program takes based on your weekly hours.",
    description:
      "Choose a Glintr program and enter your weekly hours to see an estimated study timeline, weekly plan and milestones.",
    category: "Learning Tools",
    tags: ["estimator", "time", "planning"],
    icon: "Timer",
    accent: "from-[#2E5CFF] to-[#7CFF6B]",
  },
  {
    slug: "certification-path-finder",
    title: "Certification Path Finder",
    short: "Understand certification pathways that pair with our programs.",
    description:
      "An educational overview of common third-party certification pathways adjacent to each domain. Glintr does not issue third-party certificates and does not claim provider partnerships unless explicitly named.",
    category: "Learning Tools",
    tags: ["certification", "career", "pathway"],
    icon: "BadgeCheck",
    accent: "from-[#00E6FF] to-[#7CFF6B]",
  },
  {
    slug: "program-comparison",
    title: "Program Comparison",
    short: "Compare AI vs ML, ChatGPT vs Claude vs Gemini, VLSI vs Embedded and more.",
    description:
      "Structured, side-by-side comparisons across our full curriculum — overview, skills, learning path and related programs. Powered by the Glintr comparison hub.",
    category: "Learning Tools",
    tags: ["compare", "vs", "difference"],
    featured: true,
    icon: "GitCompareArrows",
    accent: "from-[#7CFF6B] to-[#2E5CFF]",
  },
];

export const TOOL_CATEGORIES: ToolCategory[] = [
  "AI Tools",
  "Career Tools",
  "Revenue Tools",
  "Learning Tools",
  "Business Tools",
  "Resume Tools",
  "Programming Tools",
  "Engineering Tools",
  "Marketing Tools",
  "Finance Tools",
];

export function listTools(): ToolEntry[] {
  return TOOLS;
}

export function getTool(slug: string): ToolEntry | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolsByCategory(): Record<ToolCategory, ToolEntry[]> {
  const map = {} as Record<ToolCategory, ToolEntry[]>;
  for (const c of TOOL_CATEGORIES) map[c] = [];
  for (const t of TOOLS) map[t.category].push(t);
  return map;
}

export function searchTools(query: string): ToolEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  return TOOLS.filter((t) => {
    return (
      t.title.toLowerCase().includes(q) ||
      t.short.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q))
    );
  });
}
