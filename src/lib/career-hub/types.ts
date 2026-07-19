export const CAREER_HUB_TYPES = [
  { id: "roadmap", label: "Career Roadmap", path: "roadmap", emoji: "🗺️", desc: "Step-by-step career paths" },
  { id: "salary_guide", label: "Salary Guide", path: "salary", emoji: "💰", desc: "India pay bands & top payers" },
  { id: "job_description", label: "Job Description", path: "job", emoji: "📄", desc: "Role responsibilities & skills" },
  { id: "interview_questions", label: "Interview Questions", path: "interview", emoji: "🎤", desc: "Common questions & answers" },
  { id: "resume_tips", label: "Resume Tips", path: "resume", emoji: "📝", desc: "Winning resume playbooks" },
  { id: "career_switch", label: "Career Switch Guide", path: "switch", emoji: "🔀", desc: "Pivot into a new field" },
  { id: "skill", label: "Skill Deep-Dive", path: "skill", emoji: "🧠", desc: "Master in-demand skills" },
  { id: "trending_tech", label: "Trending Tech", path: "trending", emoji: "🚀", desc: "What's hot right now" },
] as const;

export type CareerHubTypeId = typeof CAREER_HUB_TYPES[number]["id"];

export const CAREER_PATH_TO_TYPE: Record<string, CareerHubTypeId> = Object.fromEntries(
  CAREER_HUB_TYPES.map((t) => [t.path, t.id]),
) as any;

export const CAREER_TYPE_TO_PATH: Record<CareerHubTypeId, string> = Object.fromEntries(
  CAREER_HUB_TYPES.map((t) => [t.id, t.path]),
) as any;
