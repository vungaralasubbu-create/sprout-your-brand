/**
 * Career OS — client-side derivations for the Glintr Career Operating System.
 * All scores are deterministic derivations from the existing career overview,
 * so nothing is fabricated. AI-generated content lives in career-os.functions.ts.
 */

export type CareerOverview = {
  profile: any;
  education: any[];
  skills: any[];
  preferences: any;
  portfolioProjects: any[];
  certificates: any[];
  internships: any[];
  metrics: {
    profileProgressPercent: number;
    resumeStatus: string;
    interviewSessions: number;
    latestInterviewScore: number | null;
    latestInterviewDate: string | null;
    portfolioProjectsCount: number;
    careerTasksCompleted: number;
    careerTasksTotal: number;
  };
  readiness: { percent: number; sections: Record<string, boolean> };
};

export type ScoreBand = "critical" | "developing" | "strong" | "excellent";

export function bandFor(score: number): ScoreBand {
  if (score >= 85) return "excellent";
  if (score >= 65) return "strong";
  if (score >= 40) return "developing";
  return "critical";
}

export const BAND_LABEL: Record<ScoreBand, string> = {
  critical: "Needs work",
  developing: "Developing",
  strong: "Strong",
  excellent: "Excellent",
};

export const BAND_COLOR: Record<ScoreBand, string> = {
  critical: "text-rose-600 bg-rose-50 border-rose-200",
  developing: "text-amber-700 bg-amber-50 border-amber-200",
  strong: "text-primary bg-primary/10 border-primary/20",
  excellent: "text-emerald-700 bg-emerald-50 border-emerald-200",
};

export const BAND_RING: Record<ScoreBand, string> = {
  critical: "stroke-rose-500",
  developing: "stroke-amber-500",
  strong: "stroke-primary",
  excellent: "stroke-emerald-500",
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// ----------------------------------------------------------------------------
// Individual score calculators
// ----------------------------------------------------------------------------

/** Career Score = weighted average of all sub-scores. */
export function careerScore(o: CareerOverview): number {
  const scores = [
    atsResumeScore(o),
    linkedinProfileScore(o),
    portfolioScore(o),
    interviewReadinessScore(o),
    technicalSkillScore(o),
    softSkillScore(o),
    communicationScore(o),
    placementReadinessScore(o),
  ];
  return clamp(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** ATS Resume Score based on completeness of resume-critical fields. */
export function atsResumeScore(o: CareerOverview): number {
  let s = 0;
  const p = o.profile ?? {};
  if (p.full_name) s += 8;
  if (p.headline) s += 10;
  if (p.objective && String(p.objective).length > 60) s += 12;
  if (p.city || p.state) s += 6;
  if (o.education.length > 0) s += 14;
  if (o.skills.length >= 5) s += 15;
  else s += o.skills.length * 2;
  if (o.portfolioProjects.length >= 2) s += 15;
  else s += o.portfolioProjects.length * 6;
  if (o.certificates.length > 0) s += 10;
  if (o.internships.length > 0) s += 10;
  return clamp(s);
}

/** LinkedIn Profile Score reuses the same signals with LinkedIn weights. */
export function linkedinProfileScore(o: CareerOverview): number {
  let s = 0;
  const p = o.profile ?? {};
  if (p.full_name) s += 10;
  if (p.headline) s += 20;
  if (p.objective) s += 15;
  if (o.education.length > 0) s += 12;
  if (o.skills.length >= 5) s += 18;
  else s += o.skills.length * 3;
  if (o.portfolioProjects.length > 0) s += 12;
  if (o.certificates.length > 0) s += 8;
  const prefs = o.preferences ?? {};
  if (prefs.preferred_role) s += 5;
  return clamp(s);
}

export function portfolioScore(o: CareerOverview): number {
  const count = o.portfolioProjects.length;
  const withLinks = o.portfolioProjects.filter(
    (p: any) => p.live_url || p.repository_url,
  ).length;
  return clamp(count * 20 + withLinks * 10 + o.certificates.length * 5);
}

export function interviewReadinessScore(o: CareerOverview): number {
  const sessions = o.metrics.interviewSessions;
  const latest = o.metrics.latestInterviewScore ?? 0;
  return clamp(sessions * 15 + latest * 0.6);
}

export function technicalSkillScore(o: CareerOverview): number {
  const tech = o.skills.filter((s: any) =>
    ["program_skill", "project_skill", "internship_skill"].includes(s.skill_source),
  );
  const advanced = o.skills.filter((s: any) => s.skill_level === "advanced").length;
  const intermediate = o.skills.filter((s: any) => s.skill_level === "intermediate").length;
  return clamp(tech.length * 8 + advanced * 12 + intermediate * 6 + o.portfolioProjects.length * 6);
}

export function softSkillScore(o: CareerOverview): number {
  const soft = o.skills.filter((s: any) => {
    const n = String(s.skill_name ?? "").toLowerCase();
    return /(communication|leadership|teamwork|creative|collaboration|adaptab|problem|critical|empath|time)/.test(n);
  });
  const base = soft.length * 15;
  const bonus = o.internships.length * 12 + (o.metrics.interviewSessions ? 10 : 0);
  return clamp(base + bonus);
}

export function communicationScore(o: CareerOverview): number {
  const p = o.profile ?? {};
  let s = 0;
  if (p.headline && p.headline.length > 20) s += 20;
  if (p.objective && p.objective.length > 120) s += 30;
  s += Math.min(30, o.metrics.interviewSessions * 10);
  if (o.metrics.latestInterviewScore) s += Math.min(20, o.metrics.latestInterviewScore * 0.2);
  return clamp(s);
}

export function placementReadinessScore(o: CareerOverview): number {
  const r = o.readiness.percent;
  const boosters =
    (o.portfolioProjects.length >= 2 ? 8 : 0) +
    (o.certificates.length ? 6 : 0) +
    (o.internships.length ? 8 : 0) +
    (o.metrics.interviewSessions >= 2 ? 8 : 0);
  return clamp(r * 0.7 + boosters);
}

export type ScoreCard = {
  key: string;
  label: string;
  score: number;
  hint: string;
};

export function allScoreCards(o: CareerOverview): ScoreCard[] {
  return [
    { key: "career", label: "Career Score", score: careerScore(o), hint: "Overall placement momentum" },
    { key: "ats", label: "ATS Resume", score: atsResumeScore(o), hint: "Resume completeness for ATS parsers" },
    { key: "linkedin", label: "LinkedIn Profile", score: linkedinProfileScore(o), hint: "Recruiter discoverability" },
    { key: "portfolio", label: "Portfolio", score: portfolioScore(o), hint: "Shipped work + live links" },
    { key: "interview", label: "Interview Readiness", score: interviewReadinessScore(o), hint: "Mock interview practice" },
    { key: "technical", label: "Technical Skills", score: technicalSkillScore(o), hint: "Depth of technical skills" },
    { key: "soft", label: "Soft Skills", score: softSkillScore(o), hint: "Communication, teamwork, empathy" },
    { key: "communication", label: "Communication", score: communicationScore(o), hint: "Written + verbal presence" },
    { key: "placement", label: "Placement Readiness", score: placementReadinessScore(o), hint: "Ready-to-apply signal" },
  ];
}

// ----------------------------------------------------------------------------
// Deterministic roadmap (used as fallback when AI is unavailable)
// ----------------------------------------------------------------------------
export type RoadmapPlan = {
  today: string[];
  thisWeek: string[];
  thisMonth: string[];
  sixMonths: string[];
  expectedSalary: string;
  missingSkills: string[];
  recommendedCertifications: string[];
};

export function fallbackRoadmap(o: CareerOverview): RoadmapPlan {
  const scores = allScoreCards(o);
  const weakest = [...scores].sort((a, b) => a.score - b.score).slice(0, 3);

  const today: string[] = [];
  const week: string[] = [];
  const month: string[] = [];

  weakest.forEach((s) => {
    if (s.key === "ats") today.push("Fill in your resume headline and objective.");
    if (s.key === "linkedin") today.push("Draft a LinkedIn headline using the LinkedIn Optimizer.");
    if (s.key === "portfolio") week.push("Add one live project link to your portfolio.");
    if (s.key === "interview") week.push("Complete one mock interview session this week.");
    if (s.key === "technical") month.push("Complete 2 skill lessons and mark them on your profile.");
    if (s.key === "soft") week.push("Practise a behavioural interview scenario.");
    if (s.key === "communication") today.push("Rewrite your career objective — target 120+ characters.");
    if (s.key === "placement") month.push("Apply to 5 curated roles from the Job Match tab.");
  });

  if (!today.length) today.push("Review your daily coach brief and pick a priority.");
  if (!week.length) week.push("Book one mentor session this week.");
  if (!month.length) month.push("Ship 1 new portfolio project this month.");

  const preferredRole = o.preferences?.preferred_role ?? "Associate roles in your target function";

  return {
    today,
    thisWeek: week,
    thisMonth: month,
    sixMonths: [
      `Land an internship or first role as ${preferredRole}.`,
      "Ship 3 portfolio-grade projects with case studies.",
      "Complete 6 mock interviews across HR, Technical, and Managerial rounds.",
      "Earn 2 additional certifications aligned with your target role.",
    ],
    expectedSalary: expectedSalaryEstimate(o),
    missingSkills: fallbackMissingSkills(o),
    recommendedCertifications: fallbackCertifications(o),
  };
}

function expectedSalaryEstimate(o: CareerOverview): string {
  const exp = Number(o.profile?.years_of_experience ?? 0);
  const boost = o.certificates.length * 0.5 + o.portfolioProjects.length * 0.4;
  const low = 3.5 + exp * 1.2 + boost;
  const high = low + 3.5;
  return `₹${low.toFixed(1)}–${high.toFixed(1)} LPA (India, entry range)`;
}

function fallbackMissingSkills(o: CareerOverview): string[] {
  const have = new Set(o.skills.map((s: any) => String(s.skill_name).toLowerCase()));
  const universal = [
    "Communication",
    "SQL",
    "Data Analysis",
    "Presentation Skills",
    "Prompt Engineering",
    "Excel / Google Sheets",
    "Business Storytelling",
    "Stakeholder Management",
  ];
  return universal.filter((s) => !have.has(s.toLowerCase())).slice(0, 6);
}

function fallbackCertifications(o: CareerOverview): string[] {
  const role = String(o.preferences?.preferred_role ?? "").toLowerCase();
  if (role.includes("data")) {
    return ["Google Data Analytics", "Microsoft Power BI", "Glintr Data Storytelling"];
  }
  if (role.includes("market") || role.includes("brand")) {
    return ["HubSpot Inbound", "Meta Digital Marketing", "Glintr Growth Marketing"];
  }
  if (role.includes("sales")) {
    return ["HubSpot Sales", "Glintr Sales OS", "LinkedIn Sales Navigator"];
  }
  return ["Glintr AI Fundamentals", "HubSpot Inbound", "Google Digital Marketing"];
}

// ----------------------------------------------------------------------------
// Local storage helpers (jobs, applications, placement tracker)
// ----------------------------------------------------------------------------
const STORAGE_PREFIX = "glintr:career-os:";

export function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export type SavedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  workType: "remote" | "hybrid" | "onsite";
  experience: string;
  salary: string;
  matchPercent: number;
  requiredSkills: string[];
  missingSkills: string[];
  status: "matched" | "saved" | "applied" | "shortlisted" | "interview" | "offer" | "rejected" | "accepted";
  savedAt: string;
  notes?: string;
};

export const PLACEMENT_STAGES: SavedJob["status"][] = [
  "matched",
  "saved",
  "applied",
  "shortlisted",
  "interview",
  "offer",
  "rejected",
  "accepted",
];

export const PLACEMENT_STAGE_LABEL: Record<SavedJob["status"], string> = {
  matched: "Matched",
  saved: "Saved",
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  accepted: "Accepted",
};
