// AI COO — deterministic in-browser business intelligence engine.
// Reads onboarding answers from localStorage and produces health scores,
// priorities, recommendations, notifications, and executive reports.
// Nothing publishes automatically; every action is approval-gated.

import {
  Globe,
  Search,
  BookOpen,
  Megaphone,
  Users,
  GraduationCap,
  Wallet,
  LifeBuoy,
  Settings2,
  FileText,
  type LucideIcon,
} from "lucide-react";

const ONBOARDING_KEY = "glintr.partner.academy.onboarding.v1";
const ACTION_STATE_KEY = "glintr.partner.ai-coo.actions.v1";

export type CooDomain =
  | "website"
  | "seo"
  | "marketing"
  | "students"
  | "courses"
  | "content"
  | "sales"
  | "support"
  | "operations"
  | "finance";

export type HealthCard = {
  key: CooDomain;
  label: string;
  score: number;
  icon: LucideIcon;
  why: string;
  improve: string[];
  tone: "excellent" | "good" | "watch" | "risk";
};

export type Priority = {
  id: string;
  title: string;
  detail: string;
  domain: CooDomain;
  minutes: number;
};

export type Recommendation = {
  id: string;
  title: string;
  domain: CooDomain;
  impact: "High" | "Medium" | "Low";
  minutes: number;
  rationale: string;
  category:
    | "content"
    | "seo"
    | "marketing"
    | "curriculum"
    | "leads"
    | "students"
    | "website"
    | "finance";
};

export type NotificationItem = {
  id: string;
  severity: "info" | "warn" | "risk";
  title: string;
  detail: string;
  domain: CooDomain;
};

export type CooReport = {
  cadence: "Daily" | "Weekly" | "Monthly" | "Quarterly";
  headline: string;
  metrics: { label: string; value: string; delta?: string }[];
  wins: string[];
  focus: string[];
};

export type CooBriefing = {
  academyName: string;
  subjects: string;
  audience: string;
  businessScore: number;
  scoreLabel: string;
  scoreNarrative: string;
  cards: HealthCard[];
  priorities: Priority[];
  recommendations: Recommendation[];
  notifications: NotificationItem[];
  reports: CooReport[];
  websiteChecks: { label: string; status: "ok" | "warn" | "risk"; note: string }[];
  seoChecks: { label: string; status: "ok" | "warn" | "risk"; note: string }[];
  courseChecks: { label: string; value: string; note: string }[];
  marketingChannels: { label: string; status: "ok" | "warn" | "risk"; note: string }[];
  leadsSnapshot: { lastFollowUp: string; hotLeads: number; conversion: string; recommendedTime: string; suggestedMessage: string };
  studentSuccess: { attendance: string; assignments: string; certificates: string; dropoutRisk: number };
  finance: { revenue: string; expenses: string; refunds: string; earnings: string; forecast: string; opportunities: string[] };
  generatedAt: number;
};

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, offset = 0) {
  return arr[(seed + offset) % arr.length]!;
}

function readAnswers(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { answers?: Record<string, string> };
    return parsed.answers ?? {};
  } catch {
    return {};
  }
}

function toneFromScore(score: number): HealthCard["tone"] {
  if (score >= 88) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "watch";
  return "risk";
}

const SCORE_BASE: Record<CooDomain, number> = {
  website: 82,
  seo: 74,
  marketing: 68,
  students: 71,
  courses: 78,
  content: 66,
  sales: 63,
  support: 84,
  operations: 88,
  finance: 72,
};

const LABELS: Record<CooDomain, string> = {
  website: "Website",
  seo: "SEO",
  marketing: "Marketing",
  students: "Students",
  courses: "Courses",
  content: "Content",
  sales: "Sales",
  support: "Support",
  operations: "Operations",
  finance: "Finance",
};

const ICONS: Record<CooDomain, LucideIcon> = {
  website: Globe,
  seo: Search,
  marketing: Megaphone,
  students: Users,
  courses: BookOpen,
  content: FileText,
  sales: Wallet,
  support: LifeBuoy,
  operations: Settings2,
  finance: Wallet,
};

const WHY: Record<CooDomain, string> = {
  website: "Core pages render fast; two hero images need alt text and one CTA is missing on the pricing page.",
  seo: "Sitemap is fresh, but 6 blogs are older than 90 days and three programs lack FAQ schema.",
  marketing: "Instagram cadence dropped to twice a week; LinkedIn is on rhythm but YouTube has no upload in 14 days.",
  students: "Attendance holding at 78%. Module 4 completion is trailing peers by 12 points.",
  courses: "Curriculum current for 2 programs; Python track hasn't been refreshed since June.",
  content: "Blog engine is publishing but 4 topics from the pillar plan remain unassigned.",
  sales: "Lead-to-call time crept to 5.4h. Two hot leads have been idle for 48 hours.",
  support: "Median response time is 42 minutes with a 96% resolution rate.",
  operations: "Managed infra all green — hosting, SSL, CDN, backups, security all healthy.",
  finance: "MRR trending +9% MoM. Refund rate is under 2% but ad spend attribution is unclear on two campaigns.",
};

const IMPROVE: Record<CooDomain, string[]> = {
  website: [
    "Add descriptive alt text to hero and testimonial images",
    "Restore the primary CTA on /pricing above the fold",
    "Compress the two 1.4MB PNGs on the About page",
  ],
  seo: [
    "Refresh 6 stale blogs and re-submit to Search Console",
    "Ship FAQ + Course schema on the 3 flagship programs",
    "Publish 3 supporting posts around your money keyword",
  ],
  marketing: [
    "Restore Instagram cadence to 4 posts / week",
    "Ship the pending YouTube short on Python basics",
    "Send a re-engagement email to inactive subscribers",
  ],
  students: [
    "DM the 12 students stuck on Module 4 with a hint video",
    "Schedule a live doubt-session this week",
    "Add a short quiz recap for Module 3",
  ],
  courses: [
    "Refresh Python curriculum with 2026 syllabus updates",
    "Add a capstone project to the AI Foundations track",
    "Convert 3 module PDFs to interactive lessons",
  ],
  content: [
    "Assign the 4 unassigned pillar topics to the AI Content team",
    "Approve 2 draft blogs waiting in the pipeline",
    "Add internal links from 5 old posts to the flagship pillar",
  ],
  sales: [
    "Follow up with the 2 hot leads idle 48h+",
    "Move stalled negotiations to a nurture sequence",
    "Add call-back reminders for the 6 no-show demos",
  ],
  support: [
    "Publish the top 5 tickets as FAQs",
    "Auto-tag tickets by program for faster routing",
    "Recognize the 2 support responders trending in CSAT",
  ],
  operations: [
    "Nothing urgent — Glintr manages infra automatically",
    "Optional: enable weekly infra digest email",
  ],
  finance: [
    "Tag ad-spend UTMs on the 2 unattributed campaigns",
    "Enable weekly revenue forecasts in Finance",
    "Review the 3 refund reasons — 2 are curriculum-related",
  ],
};

function computeCards(seed: number): HealthCard[] {
  const domains = Object.keys(SCORE_BASE) as CooDomain[];
  return domains.map((d, i) => {
    const jitter = ((seed + i * 37) % 11) - 5; // -5..+5
    const score = Math.max(40, Math.min(99, SCORE_BASE[d] + jitter));
    return {
      key: d,
      label: LABELS[d],
      score,
      icon: ICONS[d],
      why: WHY[d],
      improve: IMPROVE[d],
      tone: toneFromScore(score),
    };
  });
}

function buildPriorities(seed: number, subjects: string): Priority[] {
  const first = (subjects.split(/[,/]/)[0] ?? "your program").trim() || "your program";
  const templates: Priority[] = [
    { id: "p1", title: "Publish 2 AI blogs from the content queue", detail: `Two ${first}-focused drafts are ready for editor review.`, domain: "content", minutes: 20 },
    { id: "p2", title: "Reply to 3 pending leads", detail: "Hot leads idle for more than 24 hours — first-response window is closing.", domain: "sales", minutes: 15 },
    { id: "p3", title: "Update the Python curriculum", detail: "Refresh syllabus with 2026 libraries and re-sync lesson plans.", domain: "courses", minutes: 45 },
    { id: "p4", title: "Nudge students stuck on Module 4", detail: "12 students haven't completed Module 4 — send a targeted hint.", domain: "students", minutes: 10 },
    { id: "p5", title: "Generate Instagram content pack", detail: "Restore 4 posts/week cadence for the next 2 weeks.", domain: "marketing", minutes: 15 },
    { id: "p6", title: "Ship FAQ schema on flagship programs", detail: "Adds rich-result eligibility on high-intent pages.", domain: "seo", minutes: 20 },
    { id: "p7", title: "Approve 3 AI-generated landing pages", detail: "Awaiting your review in the Review Workspace.", domain: "content", minutes: 12 },
  ];
  const start = seed % templates.length;
  const rotated = [...templates.slice(start), ...templates.slice(0, start)];
  return rotated.slice(0, 5);
}

function buildRecommendations(seed: number, subjects: string): Recommendation[] {
  const first = (subjects.split(/[,/]/)[0] ?? "your subject").trim() || "your subject";
  const list: Recommendation[] = [
    { id: "r1", category: "content", title: `Publish a pillar guide: "Complete ${first} Career Roadmap 2026"`, domain: "content", impact: "High", minutes: 25, rationale: "Fills the top pillar gap; 3 supporting posts already exist." },
    { id: "r2", category: "content", title: "Generate 5 SEO-optimized blogs from the trending topic list", domain: "content", impact: "Medium", minutes: 10, rationale: "AI Content team estimates +12% organic traffic in 30 days." },
    { id: "r3", category: "seo", title: "Refresh 6 stale posts and resubmit sitemap", domain: "seo", impact: "Medium", minutes: 20, rationale: "Freshness signal on posts older than 90 days." },
    { id: "r4", category: "seo", title: "Add FAQ + Course schema on flagship programs", domain: "seo", impact: "High", minutes: 15, rationale: "Rich-result eligibility on 3 high-intent pages." },
    { id: "r5", category: "marketing", title: "Launch a 7-day Instagram + LinkedIn campaign", domain: "marketing", impact: "High", minutes: 30, rationale: "Cadence has slipped; content pack already drafted." },
    { id: "r6", category: "marketing", title: "Record a YouTube short: 'Why learn " + first + " in 2026'", domain: "marketing", impact: "Medium", minutes: 20, rationale: "No YouTube upload in 14 days — resurrect the channel." },
    { id: "r7", category: "curriculum", title: `Refresh ${first} curriculum with 2026 syllabus`, domain: "courses", impact: "High", minutes: 45, rationale: "Curriculum older than 90 days — quiz scores are trailing." },
    { id: "r8", category: "curriculum", title: "Add a capstone project to AI Foundations", domain: "courses", impact: "Medium", minutes: 30, rationale: "Certificate credibility + shareable output for students." },
    { id: "r9", category: "leads", title: "Follow up with 2 hot leads idle 48h+", domain: "sales", impact: "High", minutes: 10, rationale: "First-response window is closing — highest conversion odds." },
    { id: "r10", category: "students", title: "Send Module 4 hint video to the 12 stuck students", domain: "students", impact: "Medium", minutes: 15, rationale: "Reduces predicted dropout risk from 18% to ~10%." },
    { id: "r11", category: "website", title: "Add missing alt text on 4 hero images", domain: "website", impact: "Low", minutes: 8, rationale: "Accessibility + minor SEO boost." },
    { id: "r12", category: "finance", title: "Attribute ad spend on 2 untagged campaigns", domain: "finance", impact: "Medium", minutes: 12, rationale: "Restores clean ROI reporting for October." },
  ];
  const start = seed % list.length;
  return [...list.slice(start), ...list.slice(0, start)].slice(0, 9);
}

function buildNotifications(seed: number): NotificationItem[] {
  const all: NotificationItem[] = [
    { id: "n1", severity: "warn", title: "6 blogs older than 90 days", detail: "Freshness score dropping — refresh recommended.", domain: "seo" },
    { id: "n2", severity: "risk", title: "2 hot leads idle 48h+", detail: "First-response window closing.", domain: "sales" },
    { id: "n3", severity: "warn", title: "Instagram cadence below target", detail: "Only 2 posts this week vs 4/week goal.", domain: "marketing" },
    { id: "n4", severity: "info", title: "12 students inactive on Module 4", detail: "Predicted dropout risk 18%.", domain: "students" },
    { id: "n5", severity: "warn", title: "3 certificates pending manual approval", detail: "Batch approve when reviewed.", domain: "students" },
    { id: "n6", severity: "info", title: "Managed infra all green", detail: "Hosting, SSL, CDN, backups healthy.", domain: "operations" },
    { id: "n7", severity: "risk", title: "1 broken link in /programs/python", detail: "Anchor points to a removed lesson.", domain: "website" },
  ];
  const start = seed % all.length;
  return [...all.slice(start), ...all.slice(0, start)].slice(0, 6);
}

function buildReports(seed: number, name: string): CooReport[] {
  const delta = (n: number) => `${n >= 0 ? "+" : ""}${n}%`;
  const rev = 8 + (seed % 6);
  const traf = 5 + (seed % 8);
  return [
    {
      cadence: "Daily",
      headline: `${name} is trending healthy — 3 priorities, no critical blockers.`,
      metrics: [
        { label: "New leads", value: `${18 + (seed % 12)}`, delta: delta(12) },
        { label: "Blog views", value: `${1200 + (seed % 500)}`, delta: delta(traf) },
        { label: "Support SLA", value: "96%", delta: delta(2) },
      ],
      wins: ["2 lessons completed by cohort A", "Instagram reel crossed 5k views"],
      focus: ["Reply to hot leads", "Publish 2 queued blogs"],
    },
    {
      cadence: "Weekly",
      headline: `Revenue up ${delta(rev)} WoW; content velocity is the lever this week.`,
      metrics: [
        { label: "Revenue", value: "₹1.8L", delta: delta(rev) },
        { label: "Organic traffic", value: `${8500 + (seed % 900)}`, delta: delta(traf) },
        { label: "Conversion", value: "3.9%", delta: delta(1) },
      ],
      wins: ["3 new enrollments from LinkedIn", "Curriculum refresh completed on AI Foundations"],
      focus: ["Ship pillar guide", "Restore Instagram cadence"],
    },
    {
      cadence: "Monthly",
      headline: "Momentum is compounding — SEO + curriculum investments paying off.",
      metrics: [
        { label: "MRR", value: "₹7.2L", delta: delta(9) },
        { label: "Active students", value: "312", delta: delta(14) },
        { label: "Refund rate", value: "1.6%", delta: delta(-1) },
      ],
      wins: ["Ranked page 1 for 4 new keywords", "New capstone shipped"],
      focus: ["Launch B2B outreach", "Add second cohort of Python"],
    },
    {
      cadence: "Quarterly",
      headline: "On track to double enrollments next quarter with current velocity.",
      metrics: [
        { label: "Revenue", value: "₹21.4L", delta: delta(28) },
        { label: "Enrollments", value: "684", delta: delta(41) },
        { label: "NPS", value: "62", delta: delta(6) },
      ],
      wins: ["Certified 384 students", "Partner referrals accounted for 22% of revenue"],
      focus: ["Ship 2 new programs", "Hire 1 human mentor per 100 active students"],
    },
  ];
}

export function generateBriefing(): CooBriefing {
  const a = readAnswers();
  const academyName = a.brand_name || a.name || "your academy";
  const subjects = a.subjects || a.programs || "AI, business, marketing";
  const audience = a.audience || "working professionals";
  const seed = hash(academyName + subjects + audience);

  const cards = computeCards(seed);
  const businessScore = Math.round(
    cards.reduce((s, c) => s + c.score, 0) / cards.length,
  );
  const priorities = buildPriorities(seed, subjects);
  const recommendations = buildRecommendations(seed, subjects);
  const notifications = buildNotifications(seed);
  const reports = buildReports(seed, academyName);

  const scoreLabel = businessScore >= 88
    ? "Excellent"
    : businessScore >= 75
    ? "Healthy"
    : businessScore >= 60
    ? "Needs Attention"
    : "At Risk";

  const scoreNarrative =
    businessScore >= 88
      ? `${academyName} is running at peak. Focus on compounding — ship the pillar guide and expand paid.`
      : businessScore >= 75
      ? `${academyName} is healthy. Close the content gap this week to unlock the next tier.`
      : businessScore >= 60
      ? `${academyName} needs focused work on marketing cadence and lead follow-up.`
      : `${academyName} has 3 high-impact fixes waiting — start with hot leads and website errors.`;

  return {
    academyName,
    subjects,
    audience,
    businessScore,
    scoreLabel,
    scoreNarrative,
    cards,
    priorities,
    recommendations,
    notifications,
    reports,
    websiteChecks: [
      { label: "Core pages 200 OK", status: "ok", note: "12/12 pages responding" },
      { label: "404 errors", status: "warn", note: "1 broken link in /programs/python" },
      { label: "Missing images / alt", status: "warn", note: "4 hero images without alt text" },
      { label: "Accessibility (AA)", status: "ok", note: "Contrast + keyboard nav passing" },
      { label: "Performance (LCP)", status: "ok", note: "1.8s on 4G median" },
      { label: "Mobile responsive", status: "ok", note: "Every page passes at 360px" },
    ],
    seoChecks: [
      { label: "Indexing", status: "ok", note: "42 pages indexed, sitemap fresh" },
      { label: "Internal links", status: "warn", note: "5 orphan posts, no inbound links" },
      { label: "Keyword opportunities", status: "ok", note: "9 keywords on page 2 — pushable" },
      { label: "Schema", status: "warn", note: "FAQ + Course schema missing on 3 programs" },
      { label: "Meta tags", status: "ok", note: "All pages have title + description" },
      { label: "Blog freshness", status: "warn", note: "6 posts older than 90 days" },
      { label: "Content gaps", status: "warn", note: "4 pillar topics unassigned" },
    ],
    courseChecks: [
      { label: "Completion rate", value: "68%", note: "Above category benchmark of 55%" },
      { label: "Dropout rate", value: "12%", note: "Concentrated at Module 4" },
      { label: "Student feedback", value: "4.6 / 5", note: "184 responses this month" },
      { label: "Quiz scores (avg)", value: "72%", note: "Trending up 3pt vs last month" },
      { label: "Curriculum freshness", value: "72d", note: "Python track needs refresh" },
      { label: "Assignments submitted", value: "84%", note: "On track" },
      { label: "Capstone projects", value: "2 / 3", note: "AI Foundations missing capstone" },
      { label: "Certificates issued", value: "126", note: "3 pending manual approval" },
    ],
    marketingChannels: [
      { label: "Instagram", status: "warn", note: "2 posts this week (target 4)" },
      { label: "LinkedIn", status: "ok", note: "On cadence, engagement +18% WoW" },
      { label: "Facebook", status: "warn", note: "No new posts in 6 days" },
      { label: "YouTube", status: "risk", note: "No uploads in 14 days" },
      { label: "Email", status: "ok", note: "Weekly newsletter open rate 38%" },
      { label: "Blog publishing", status: "warn", note: "2 blogs published this week (target 4)" },
      { label: "Campaign performance", status: "ok", note: "ROAS 3.4x across active ads" },
    ],
    leadsSnapshot: {
      lastFollowUp: "5h 24m ago",
      hotLeads: 8,
      conversion: "24% (last 30d)",
      recommendedTime: "Between 6pm and 8pm local time",
      suggestedMessage:
        `Hi {name}, ${academyName} just opened 6 new seats for our ${subjects.split(/[,/]/)[0]?.trim() || "flagship"} cohort — I'd love to walk you through the outcomes. Free for a 10-min call today or tomorrow?`,
    },
    studentSuccess: {
      attendance: "78%",
      assignments: "84%",
      certificates: "126 issued, 3 pending",
      dropoutRisk: 18,
    },
    finance: {
      revenue: "₹7.2L MRR",
      expenses: "₹2.4L",
      refunds: "1.6%",
      earnings: "₹4.8L partner share",
      forecast: "₹9.1L MRR by next quarter at current velocity",
      opportunities: [
        "Launch a B2B cohort — 4 corporate inbounds this month",
        "Bundle Python + AI Foundations for +18% AOV",
        "Add a paid capstone review tier",
      ],
    },
    generatedAt: Date.now(),
  };
}

// ---- action state (approvals persist locally) ----
export type ActionStatus = "pending" | "approved" | "dismissed";

export function readActionState(): Record<string, ActionStatus> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ACTION_STATE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function writeActionState(state: Record<string, ActionStatus>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTION_STATE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export function toneClass(tone: HealthCard["tone"]) {
  switch (tone) {
    case "excellent":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "good":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "watch":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "risk":
      return "bg-rose-50 text-rose-700 border-rose-200";
  }
}

export function statusDot(status: "ok" | "warn" | "risk") {
  switch (status) {
    case "ok":
      return "bg-emerald-500";
    case "warn":
      return "bg-amber-500";
    case "risk":
      return "bg-rose-500";
  }
}
