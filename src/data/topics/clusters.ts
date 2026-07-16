import type { Cluster, ClusterKind, ClusterSeed, Pillar } from "./types";
import { getPillar, PILLARS } from "./pillars";

// Fixed publish date used as `updatedAt` fallback. Rich pillars can
// override per-cluster in the future without redesign.
const UPDATED_AT = "2026-01-15";

interface ClusterTemplate {
  kind: ClusterKind;
  slugSuffix: string; // e.g. "what-is-{slug}"
  makeTitle: (p: Pillar) => string;
  makeDescription: (p: Pillar) => string;
  makeIntro: (p: Pillar) => string;
  makeSections: (p: Pillar) => ClusterSeed["sections"];
  makeFaqs?: (p: Pillar) => ClusterSeed["faqs"];
  difficulty?: ClusterSeed["difficulty"];
  readingMinutes?: number;
}

// 12 canonical cluster templates. Every pillar automatically generates
// all 12 unless it provides overrides. This scales cleanly to any
// future pillar without redesign.
const TEMPLATES: ClusterTemplate[] = [
  {
    kind: "what-is",
    slugSuffix: "what-is",
    makeTitle: (p) => `What is ${p.name}? A Complete 2026 Guide`,
    makeDescription: (p) =>
      truncate(`${p.overview} Learn what ${p.name} is, how it works, why it matters and how to build a career.`, 158),
    makeIntro: (p) => p.overview,
    makeSections: (p) => [
      { heading: `What is ${p.name}?`, body: p.body ?? p.overview },
      { heading: "Why it matters in 2026", body: `${p.name} is reshaping industries. These are the fastest-growing applications:`, bullets: p.applications },
      { heading: "Skills you need", body: `Employers hire for a well-defined skill stack:`, bullets: p.skills },
      { heading: "How to get started", body: `A pragmatic path to your first ${p.name} role:`, bullets: p.roadmap.flatMap((r) => r.items).slice(0, 6) },
    ],
    makeFaqs: (p) => p.faqs.slice(0, 4),
    difficulty: "Beginner",
    readingMinutes: 8,
  },
  {
    kind: "career-roadmap",
    slugSuffix: "career-roadmap",
    makeTitle: (p) => `${p.name} Career Roadmap 2026: Roles, Skills, Salary`,
    makeDescription: (p) =>
      truncate(`Step-by-step ${p.name} career roadmap: roles, salary bands, skills and a 6-12 month learning plan for 2026.`, 158),
    makeIntro: (p) => `A structured ${p.name} career roadmap — the roles, skills and milestones to move from beginner to hire-ready in 2026.`,
    makeSections: (p) => [
      { heading: "Career ladder", body: `Common ${p.name} roles and typical compensation bands in India:`, bullets: p.careers.map((c) => `${c.role} — ${c.salaryInr}`) },
      ...p.roadmap.map((r) => ({
        heading: `${r.phase}${r.weeks ? ` · Weeks ${r.weeks}` : ""}`,
        body: `Focus areas for the ${r.phase.toLowerCase()} phase:`,
        bullets: r.items,
      })),
      { heading: "Signals recruiters look for", body: "Beyond skills, hiring managers screen for these signals:", bullets: ["Shipped projects on GitHub / portfolio", "Certifications relevant to the role", "Communication in interviews", "Domain knowledge (industry-specific)"] },
    ],
    difficulty: "Intermediate",
    readingMinutes: 10,
  },
  {
    kind: "salary-guide",
    slugSuffix: "salary-guide",
    makeTitle: (p) => `${p.name} Salary Guide 2026 (India + Global)`,
    makeDescription: (p) =>
      truncate(`${p.name} salary in India by role, experience and city. Compare junior to senior compensation for 2026.`, 158),
    makeIntro: (p) => `Detailed ${p.name} salary ranges in India for 2026, plus what drives compensation growth in this field.`,
    makeSections: (p) => [
      { heading: "By role", body: `Typical ${p.name} compensation in India:`, bullets: p.careers.map((c) => `${c.role} — ${c.salaryInr}${c.salaryUsd ? ` (${c.salaryUsd} USD)` : ""}`) },
      { heading: "What drives pay", body: "Compensation in this field is driven by:", bullets: ["Depth in a specialization", "Company tier (product > services)", "Portfolio and public work", "Certifications where relevant", "City (tier-1 metros pay 20-40% more)"] },
      { heading: "How to increase your salary", body: "The fastest levers are:", bullets: ["Switch to a product company", "Add a scarce specialization", "Ship visible projects", "Own P&L / revenue-linked outcomes"] },
    ],
    difficulty: "Beginner",
    readingMinutes: 7,
  },
  {
    kind: "tools",
    slugSuffix: "tools",
    makeTitle: (p) => `Top ${p.name} Tools in 2026`,
    makeDescription: (p) =>
      truncate(`The essential ${p.name} tools professionals use in 2026 — with strengths, use cases and how to learn each.`, 158),
    makeIntro: (p) => `The ${p.name} tool stack is evolving fast. These are the tools most professionals use day-to-day in 2026.`,
    makeSections: (p) => [
      { heading: "Essential tools", body: `Every ${p.name} professional should be comfortable with:`, bullets: p.tools },
      { heading: "How to pick your stack", body: "Choose tools by the shape of your role:", bullets: ["Match tools your target employers hire for", "Prefer widely-hired tools over trending ones", "Learn deeply in 1-2, familiar in the rest"] },
    ],
    difficulty: "Beginner",
    readingMinutes: 6,
  },
  {
    kind: "applications",
    slugSuffix: "applications",
    makeTitle: (p) => `${p.name} Applications: Real Industry Use Cases`,
    makeDescription: (p) =>
      truncate(`How ${p.name} is used across industries — from healthcare to finance. Real 2026 use cases you can learn from.`, 158),
    makeIntro: (p) => `${p.name} is reshaping industries. Here's where it delivers the most impact in 2026.`,
    makeSections: (p) => [
      { heading: "Industries transformed", body: `The strongest ${p.name} adoption today:`, bullets: p.applications },
      { heading: "How adoption typically happens", body: "Most organizations follow the same maturity curve:", bullets: ["Pilot on 1 narrow use case", "Prove ROI", "Standardize on a stack", "Scale org-wide with governance"] },
    ],
    difficulty: "Beginner",
    readingMinutes: 6,
  },
  {
    kind: "certifications",
    slugSuffix: "certifications",
    makeTitle: (p) => `Best ${p.name} Certifications in 2026`,
    makeDescription: (p) =>
      truncate(`Which ${p.name} certifications actually help you get hired in 2026 — and which to skip.`, 158),
    makeIntro: (p) => `Certifications don't replace projects, but the right ones raise callbacks. Here's what hiring managers actually recognize for ${p.name} in 2026.`,
    makeSections: (p) => [
      { heading: "High-value certifications", body: `Widely respected ${p.name} certifications:`, bullets: p.tools.slice(0, 5).map((t) => `${t} — official certification track`) },
      { heading: "How to sequence", body: "A typical certification path:", bullets: ["Foundation cert first (broad, cheap)", "Role-specific cert next", "Specialist certs only after 2 years of work"] },
    ],
    difficulty: "Intermediate",
    readingMinutes: 6,
  },
  {
    kind: "interview-questions",
    slugSuffix: "interview-questions",
    makeTitle: (p) => `Top ${p.name} Interview Questions & Answers (2026)`,
    makeDescription: (p) =>
      truncate(`The most-asked ${p.name} interview questions in 2026 with structured answers, plus what recruiters look for.`, 158),
    makeIntro: (p) => `A curated set of ${p.name} interview questions asked in 2026 by product and services companies — with what a strong answer looks like.`,
    makeSections: (p) => [
      { heading: "Behavioral", body: `Standard behavioral prompts:`, bullets: ["Walk me through your resume", `Tell me about a hard ${p.name} problem you solved`, "How do you prioritize under a deadline?"] },
      { heading: "Technical / functional", body: `Common technical prompts:`, bullets: p.skills.slice(0, 5).map((s) => `Explain ${s} and give a real example`) },
      { heading: "How to prepare", body: "The reliable prep loop:", bullets: ["List 6 STAR stories", "Do 10+ mock interviews", "Practice a whiteboard-friendly explanation for every core concept"] },
    ],
    difficulty: "Intermediate",
    readingMinutes: 9,
  },
  {
    kind: "projects",
    slugSuffix: "projects",
    makeTitle: (p) => `${p.name} Projects for Your Portfolio (2026)`,
    makeDescription: (p) =>
      truncate(`Impressive ${p.name} project ideas for students and career switchers — with scope, tech stack and outcomes.`, 158),
    makeIntro: (p) => `The right portfolio project moves you from resume to hire. These ${p.name} projects show real capability in 2026.`,
    makeSections: (p) => [
      { heading: "Beginner projects", body: "Great first projects to publish:", bullets: [`A ${p.name} tutorial reproduction with your own twist`, "A small end-to-end demo with clear README", "A public write-up explaining your approach"] },
      { heading: "Intermediate projects", body: "Stand-out projects for interviews:", bullets: [`A ${p.name} project deployed publicly`, "A dataset or benchmark you contribute to", "An open-source PR merged"] },
      { heading: "Advanced projects", body: "Projects that beat certifications:", bullets: ["A production-grade system with real users", "A published paper, talk or teardown", "A tool used by others in the field"] },
    ],
    difficulty: "Intermediate",
    readingMinutes: 8,
  },
  {
    kind: "trends",
    slugSuffix: "trends-2026",
    makeTitle: (p) => `${p.name} Trends in 2026: What's Actually Changing`,
    makeDescription: (p) =>
      truncate(`The ${p.name} trends that matter in 2026 — filtered from hype to what changes how you work and hire.`, 158),
    makeIntro: (p) => `A focused view of ${p.name} trends in 2026 — the shifts that materially change what practitioners build and how they're hired.`,
    makeSections: (p) => [
      { heading: "2026 signals", body: `Where the field is moving:`, bullets: p.trends },
      { heading: "What to bet on", body: "How to allocate your learning time:", bullets: ["70% on foundational skills that don't age", "20% on trends with 3+ year traction", "10% on experiments"] },
    ],
    difficulty: "Intermediate",
    readingMinutes: 7,
  },
  {
    kind: "learning-path",
    slugSuffix: "learning-path",
    makeTitle: (p) => `${p.name} Learning Path: 90-Day Plan for 2026`,
    makeDescription: (p) =>
      truncate(`A structured 90-day ${p.name} learning path with weekly milestones, projects and evaluation checkpoints.`, 158),
    makeIntro: (p) => `A disciplined 90-day ${p.name} learning path with weekly deliverables — designed for working professionals with 10-15 hrs/week.`,
    makeSections: (p) => [
      ...p.roadmap.map((r) => ({
        heading: `${r.phase}${r.weeks ? ` · Weeks ${r.weeks}` : ""}`,
        body: "This phase should deliver a portfolio artifact you can show:",
        bullets: r.items,
      })),
      { heading: "Weekly cadence", body: "How to structure each week:", bullets: ["3-4 focused study blocks", "1 project checkpoint", "1 hour of review + notes", "One community post or share"] },
    ],
    difficulty: "Beginner",
    readingMinutes: 10,
  },
  {
    kind: "for-beginners",
    slugSuffix: "for-beginners",
    makeTitle: (p) => `${p.name} for Beginners: Start Here in 2026`,
    makeDescription: (p) =>
      truncate(`New to ${p.name}? This beginner guide covers the fundamentals, first project and next 90 days for 2026.`, 158),
    makeIntro: (p) => `Everything a beginner needs to start ${p.name} in 2026 — without wasting time on the wrong tutorials.`,
    makeSections: (p) => [
      { heading: "Prerequisites", body: `Before starting ${p.name}, make sure you have:`, bullets: p.skills.slice(0, 3) },
      { heading: "Your first month", body: "Focus on shipping small, complete artifacts:", bullets: p.roadmap[0]?.items ?? [] },
      { heading: "Common beginner mistakes", body: "Skip these to save weeks:", bullets: ["Watching without building", "Jumping frameworks weekly", "Skipping fundamentals", "Not shipping anything public"] },
    ],
    difficulty: "Beginner",
    readingMinutes: 7,
  },
  {
    kind: "jobs",
    slugSuffix: "jobs",
    makeTitle: (p) => `${p.name} Jobs in 2026: Where Companies Hire`,
    makeDescription: (p) =>
      truncate(`Where ${p.name} roles are being hired in 2026 — companies, cities, remote options and application tips.`, 158),
    makeIntro: (p) => `A practical look at where ${p.name} hiring is strongest in 2026 and how to break in.`,
    makeSections: (p) => [
      { heading: "Roles that hire the most", body: "Most-hired titles for this field:", bullets: p.careers.map((c) => c.role) },
      { heading: "Where they hire", body: "The strongest hubs for this role:", bullets: ["Bengaluru", "Hyderabad", "Pune", "Delhi NCR", "Remote (global)"] },
      { heading: "How to apply well", body: "Signals that raise callback rates:", bullets: ["Tailored resume with metrics", "Portfolio link in the top third", "Referrals via LinkedIn", "Public writing on the topic"] },
    ],
    difficulty: "Beginner",
    readingMinutes: 6,
  },
];

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

function buildCluster(pillar: Pillar, tpl: ClusterTemplate): Cluster {
  return {
    pillarSlug: pillar.slug,
    slug: `${pillar.slug}-${tpl.slugSuffix}`,
    kind: tpl.kind,
    title: tpl.makeTitle(pillar),
    description: tpl.makeDescription(pillar),
    intro: tpl.makeIntro(pillar),
    sections: tpl.makeSections(pillar),
    faqs: tpl.makeFaqs?.(pillar),
    difficulty: tpl.difficulty,
    readingMinutes: tpl.readingMinutes,
    updatedAt: UPDATED_AT,
  };
}

const CLUSTERS_BY_PILLAR = new Map<string, Cluster[]>();
for (const p of PILLARS) {
  const generated = TEMPLATES.map((t) => buildCluster(p, t));
  const overrides = (p.clusterOverrides ?? []).map<Cluster>((c) => ({
    ...c,
    pillarSlug: p.slug,
    updatedAt: UPDATED_AT,
  }));
  const mergedBySlug = new Map<string, Cluster>();
  for (const c of generated) mergedBySlug.set(c.slug, c);
  for (const c of overrides) mergedBySlug.set(c.slug, c);
  CLUSTERS_BY_PILLAR.set(p.slug, Array.from(mergedBySlug.values()));
}

export function listClusters(pillarSlug: string): Cluster[] {
  return CLUSTERS_BY_PILLAR.get(pillarSlug) ?? [];
}

export function getCluster(pillarSlug: string, clusterSlug: string): Cluster | undefined {
  return listClusters(pillarSlug).find((c) => c.slug === clusterSlug);
}

export function listAllClusters(): Cluster[] {
  const out: Cluster[] = [];
  for (const list of CLUSTERS_BY_PILLAR.values()) out.push(...list);
  return out;
}

export function getPillarWithClusters(slug: string) {
  const p = getPillar(slug);
  if (!p) return undefined;
  return { pillar: p, clusters: listClusters(slug) };
}
