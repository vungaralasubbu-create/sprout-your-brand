/**
 * Glintr App Store & AI Agent Marketplace catalog
 *
 * Static, versioned catalog of installable apps and AI agents. Real
 * capability wiring (tool execution, permission enforcement, sandboxing)
 * ships in follow-up phases — this file defines the surface the admin
 * marketplace renders and stores install/enable state against.
 */

export type AppCategory =
  | "Marketing"
  | "Sales"
  | "CRM"
  | "Finance"
  | "HR"
  | "Student Success"
  | "Placement"
  | "Certificates"
  | "SEO"
  | "Analytics"
  | "Automation"
  | "Communication"
  | "Reporting"
  | "AI"
  | "Developer Tools";

export type AppPermission =
  | "students"
  | "courses"
  | "blogs"
  | "crm"
  | "marketing"
  | "payments"
  | "analytics"
  | "settings";

export interface AppVersion {
  version: string;
  releasedAt: string; // ISO
  notes: string;
}

export interface MarketplaceApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: AppCategory;
  publisher: "Glintr" | "Partner" | "Community";
  featured?: boolean;
  popular?: boolean;
  version: string;
  releasedAt: string;
  history: AppVersion[];
  permissions: AppPermission[];
  downloads: number;
  rating: number; // 0..5
  reviews: number;
  pricing: "Free" | "Included" | "Paid";
  compatibility: string; // e.g. "Glintr 2024+"
  screenshots?: string[];
  docsUrl?: string;
  color: string; // hex tint for card accent
  icon: string; // lucide icon name
}

export interface AiAgent {
  id: string;
  name: string;
  role: string;
  purpose: string;
  category: AppCategory;
  tools: string[];
  knowledge: string[];
  permissions: AppPermission[];
  publisher: "Glintr" | "Partner";
  featured?: boolean;
  popular?: boolean;
  version: string;
  releasedAt: string;
  color: string;
  icon: string;
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  agents: string[]; // agent ids in order
  category: AppCategory;
  outcome: string;
}

export const APP_CATEGORIES: AppCategory[] = [
  "Marketing",
  "Sales",
  "CRM",
  "Finance",
  "HR",
  "Student Success",
  "Placement",
  "Certificates",
  "SEO",
  "Analytics",
  "Automation",
  "Communication",
  "Reporting",
  "AI",
  "Developer Tools",
];

// ---------------------------------------------------------------------------
// APPS
// ---------------------------------------------------------------------------

const iso = (d: string) => new Date(d).toISOString();

export const MARKETPLACE_APPS: MarketplaceApp[] = [
  {
    id: "attendance-pro",
    name: "Attendance Pro",
    tagline: "Biometric-free daily attendance for cohorts",
    description:
      "Track student attendance across live sessions, self-paced modules, and internships. Push absentee alerts and monthly attendance certificates.",
    category: "Student Success",
    publisher: "Glintr",
    featured: true,
    popular: true,
    version: "2.4.0",
    releasedAt: iso("2026-05-14"),
    history: [
      { version: "2.4.0", releasedAt: iso("2026-05-14"), notes: "Cohort-wide absentee alerts, WhatsApp escalation." },
      { version: "2.3.0", releasedAt: iso("2026-02-01"), notes: "Bulk import, monthly certificate PDFs." },
      { version: "2.0.0", releasedAt: iso("2025-08-10"), notes: "Rewrite on Glintr LMS core." },
    ],
    permissions: ["students", "courses", "analytics"],
    downloads: 4820,
    rating: 4.7,
    reviews: 312,
    pricing: "Free",
    compatibility: "Glintr LMS 2024+",
    docsUrl: "https://docs.glintr.com/apps/attendance-pro",
    color: "#22d3ee",
    icon: "CalendarCheck",
  },
  {
    id: "certificates-studio",
    name: "Certificate Studio",
    tagline: "Verifiable, custom-branded course certificates",
    description:
      "Design, sign, and issue verifiable certificates. Auto-generate for graduates and expose a public verification URL.",
    category: "Certificates",
    publisher: "Glintr",
    featured: true,
    popular: true,
    version: "3.1.2",
    releasedAt: iso("2026-06-02"),
    history: [
      { version: "3.1.2", releasedAt: iso("2026-06-02"), notes: "Blockchain proof (optional), QR verification." },
      { version: "3.0.0", releasedAt: iso("2026-01-19"), notes: "New designer, template gallery." },
    ],
    permissions: ["students", "courses"],
    downloads: 3910,
    rating: 4.8,
    reviews: 248,
    pricing: "Included",
    compatibility: "Glintr LMS 2024+",
    color: "#a3e635",
    icon: "Award",
  },
  {
    id: "placement-tracker",
    name: "Placement Tracker",
    tagline: "Manage the placement pipeline end-to-end",
    description: "Track student interviews, offers, hiring partners, and salary offers. Feeds the Placement Dashboard.",
    category: "Placement",
    publisher: "Glintr",
    featured: true,
    popular: true,
    version: "1.9.0",
    releasedAt: iso("2026-04-22"),
    history: [
      { version: "1.9.0", releasedAt: iso("2026-04-22"), notes: "Interview scorecards, offer letter templates." },
      { version: "1.5.0", releasedAt: iso("2025-11-01"), notes: "Hiring partner CRM." },
    ],
    permissions: ["students", "crm", "analytics"],
    downloads: 2740,
    rating: 4.6,
    reviews: 168,
    pricing: "Included",
    compatibility: "Glintr LMS 2024+",
    color: "#60a5fa",
    icon: "Briefcase",
  },
  {
    id: "seo-command",
    name: "SEO Command",
    tagline: "Programmatic SEO audits and content scoring",
    description:
      "Continuous audits across the public site: title tags, meta, schema, internal links, and Core Web Vitals.",
    category: "SEO",
    publisher: "Glintr",
    popular: true,
    version: "2.0.0",
    releasedAt: iso("2026-06-08"),
    history: [
      { version: "2.0.0", releasedAt: iso("2026-06-08"), notes: "Rewrite: per-page grades, LLM readability score." },
      { version: "1.4.0", releasedAt: iso("2025-10-14"), notes: "Sitemap health, canonical checks." },
    ],
    permissions: ["blogs", "analytics", "settings"],
    downloads: 3020,
    rating: 4.5,
    reviews: 201,
    pricing: "Free",
    compatibility: "Glintr Content 2024+",
    color: "#f59e0b",
    icon: "Search",
  },
  {
    id: "leadflow",
    name: "LeadFlow CRM",
    tagline: "Lightweight CRM tuned for education admissions",
    description:
      "Kanban pipeline (Lead → Contacted → Consulted → Enrolled → Won/Lost), reminders, tasks, and round-robin routing.",
    category: "CRM",
    publisher: "Glintr",
    featured: true,
    version: "4.2.1",
    releasedAt: iso("2026-05-30"),
    history: [
      { version: "4.2.1", releasedAt: iso("2026-05-30"), notes: "Round-robin, cohort tagging." },
      { version: "4.0.0", releasedAt: iso("2026-01-05"), notes: "Multi-brand pipeline isolation." },
    ],
    permissions: ["crm", "students", "analytics"],
    downloads: 5610,
    rating: 4.7,
    reviews: 402,
    pricing: "Included",
    compatibility: "Glintr Business OS 2024+",
    color: "#f472b6",
    icon: "Users",
  },
  {
    id: "whatsapp-automation",
    name: "WhatsApp Automation",
    tagline: "Automated learner nudges over WhatsApp Business",
    description: "Trigger reminders for classes, payment dues, assignment deadlines and drip-content campaigns.",
    category: "Communication",
    publisher: "Glintr",
    popular: true,
    version: "1.6.0",
    releasedAt: iso("2026-04-11"),
    history: [
      { version: "1.6.0", releasedAt: iso("2026-04-11"), notes: "Drip flows, personalization variables." },
      { version: "1.2.0", releasedAt: iso("2025-09-27"), notes: "Template library." },
    ],
    permissions: ["students", "marketing"],
    downloads: 3280,
    rating: 4.4,
    reviews: 176,
    pricing: "Paid",
    compatibility: "Requires WhatsApp Business connection",
    color: "#34d399",
    icon: "MessageCircle",
  },
  {
    id: "accounts-lite",
    name: "Accounts Lite",
    tagline: "Invoices, receipts and GST-ready ledgers",
    description: "Generate GST invoices, receipts, and monthly ledgers. Export to Tally / Zoho Books.",
    category: "Finance",
    publisher: "Glintr",
    version: "1.3.0",
    releasedAt: iso("2026-03-18"),
    history: [
      { version: "1.3.0", releasedAt: iso("2026-03-18"), notes: "Zoho Books sync." },
      { version: "1.0.0", releasedAt: iso("2025-07-01"), notes: "Initial release." },
    ],
    permissions: ["payments", "analytics"],
    downloads: 1980,
    rating: 4.5,
    reviews: 112,
    pricing: "Paid",
    compatibility: "Glintr Payments 2024+",
    color: "#f97316",
    icon: "Receipt",
  },
  {
    id: "hr-lite",
    name: "HR Lite",
    tagline: "Staff, mentors, and payroll runs",
    description: "Manage internal team, mentor payouts, leaves, and monthly payroll for academy partners.",
    category: "HR",
    publisher: "Glintr",
    version: "1.1.0",
    releasedAt: iso("2026-02-12"),
    history: [{ version: "1.1.0", releasedAt: iso("2026-02-12"), notes: "Mentor payouts, leave calendar." }],
    permissions: ["settings", "payments"],
    downloads: 1140,
    rating: 4.3,
    reviews: 74,
    pricing: "Paid",
    compatibility: "Glintr Business OS 2024+",
    color: "#c084fc",
    icon: "Users2",
  },
  {
    id: "growth-analytics",
    name: "Growth Analytics",
    tagline: "Conversion funnels, cohort retention, LTV",
    description: "Drop-in analytics: funnels, cohorts, retention, referral attribution, and LTV per program.",
    category: "Analytics",
    publisher: "Glintr",
    popular: true,
    version: "2.1.0",
    releasedAt: iso("2026-05-25"),
    history: [
      { version: "2.1.0", releasedAt: iso("2026-05-25"), notes: "Per-cohort LTV and payback period." },
      { version: "2.0.0", releasedAt: iso("2026-01-30"), notes: "Rewrite on ClickHouse-backed store." },
    ],
    permissions: ["analytics"],
    downloads: 2640,
    rating: 4.6,
    reviews: 158,
    pricing: "Included",
    compatibility: "Glintr Analytics 2024+",
    color: "#38bdf8",
    icon: "LineChart",
  },
  {
    id: "automation-flows",
    name: "Automation Flows",
    tagline: "If-this-then-that for education operations",
    description:
      "Trigger workflows on lead created, payment received, assignment submitted. Zapier-style visual builder.",
    category: "Automation",
    publisher: "Glintr",
    featured: true,
    version: "1.4.0",
    releasedAt: iso("2026-04-30"),
    history: [
      { version: "1.4.0", releasedAt: iso("2026-04-30"), notes: "Visual builder, retry policy." },
      { version: "1.0.0", releasedAt: iso("2025-11-15"), notes: "Initial trigger set." },
    ],
    permissions: ["students", "crm", "marketing", "payments", "analytics"],
    downloads: 2210,
    rating: 4.5,
    reviews: 141,
    pricing: "Included",
    compatibility: "Glintr Business OS 2024+",
    color: "#818cf8",
    icon: "Workflow",
  },
  {
    id: "reports-hub",
    name: "Reports Hub",
    tagline: "Board-ready weekly, monthly, and investor reports",
    description: "Curated reports across admissions, revenue, placement, marketing. Schedule to email, Slack, Notion.",
    category: "Reporting",
    publisher: "Glintr",
    version: "1.2.0",
    releasedAt: iso("2026-03-06"),
    history: [{ version: "1.2.0", releasedAt: iso("2026-03-06"), notes: "Investor mode preset." }],
    permissions: ["analytics", "settings"],
    downloads: 980,
    rating: 4.4,
    reviews: 62,
    pricing: "Included",
    compatibility: "Glintr Analytics 2024+",
    color: "#4ade80",
    icon: "FileBarChart",
  },
  {
    id: "sales-coach",
    name: "Sales Coach",
    tagline: "Real-time coaching for admissions counsellors",
    description: "Call scoring, objection library, and daily coaching digests for the admissions team.",
    category: "Sales",
    publisher: "Glintr",
    version: "1.0.0",
    releasedAt: iso("2026-05-01"),
    history: [{ version: "1.0.0", releasedAt: iso("2026-05-01"), notes: "Public launch." }],
    permissions: ["crm", "analytics"],
    downloads: 720,
    rating: 4.6,
    reviews: 41,
    pricing: "Paid",
    compatibility: "Glintr CRM 2024+",
    color: "#fb7185",
    icon: "Headphones",
  },
  {
    id: "marketing-pixel-pack",
    name: "Pixel Pack",
    tagline: "Meta, Google, LinkedIn, TikTok pixels in one place",
    description: "Install and manage marketing pixels with consent-mode support and conversion API bridges.",
    category: "Marketing",
    publisher: "Glintr",
    version: "1.0.4",
    releasedAt: iso("2026-05-19"),
    history: [{ version: "1.0.4", releasedAt: iso("2026-05-19"), notes: "TikTok Events API bridge." }],
    permissions: ["marketing", "analytics"],
    downloads: 1560,
    rating: 4.3,
    reviews: 88,
    pricing: "Free",
    compatibility: "Any Glintr site",
    color: "#eab308",
    icon: "Target",
  },
  {
    id: "webhooks-forge",
    name: "Webhooks Forge",
    tagline: "Outbound webhooks for every platform event",
    description: "Signed, retriable webhooks for lead, enrolment, payment, and assignment events.",
    category: "Developer Tools",
    publisher: "Glintr",
    version: "1.1.0",
    releasedAt: iso("2026-06-01"),
    history: [{ version: "1.1.0", releasedAt: iso("2026-06-01"), notes: "HMAC signing, retry policy UI." }],
    permissions: ["settings", "analytics"],
    downloads: 640,
    rating: 4.7,
    reviews: 34,
    pricing: "Free",
    compatibility: "Requires Developer API keys",
    color: "#94a3b8",
    icon: "Webhook",
  },
  {
    id: "ai-tutor",
    name: "AI Tutor",
    tagline: "24/7 doubt-solver embedded in the LMS",
    description: "Context-aware tutor over course content — answers doubts, generates practice questions, grades MCQs.",
    category: "AI",
    publisher: "Glintr",
    featured: true,
    popular: true,
    version: "2.0.0",
    releasedAt: iso("2026-06-10"),
    history: [
      { version: "2.0.0", releasedAt: iso("2026-06-10"), notes: "Multi-model routing, image doubts." },
      { version: "1.0.0", releasedAt: iso("2025-12-01"), notes: "Public launch." },
    ],
    permissions: ["students", "courses"],
    downloads: 4310,
    rating: 4.8,
    reviews: 274,
    pricing: "Paid",
    compatibility: "Glintr LMS 2024+",
    color: "#22d3ee",
    icon: "Sparkles",
  },
];

// ---------------------------------------------------------------------------
// AI AGENTS
// ---------------------------------------------------------------------------

export const AI_AGENTS: AiAgent[] = [
  {
    id: "agent-admissions",
    name: "Admissions Agent",
    role: "Admissions Counsellor",
    purpose:
      "Qualifies leads, books consultations, answers course/pricing questions and hands off high-intent leads to human counsellors.",
    category: "Sales",
    tools: ["CRM.readLead", "CRM.updateLead", "Calendar.book", "Chat.send", "Email.send"],
    knowledge: ["Programs catalog", "Pricing", "Refund policy", "Cohort schedule"],
    permissions: ["crm", "students", "marketing"],
    publisher: "Glintr",
    featured: true,
    popular: true,
    version: "1.4.0",
    releasedAt: iso("2026-05-20"),
    color: "#f472b6",
    icon: "Users",
  },
  {
    id: "agent-career-advisor",
    name: "Career Advisor",
    role: "Career Counsellor",
    purpose: "Guides learners on career paths, target roles, salary bands and required skills.",
    category: "Student Success",
    tools: ["Programs.recommend", "Roadmap.build", "Chat.send"],
    knowledge: ["Career roles", "Salary benchmarks", "Skills graph"],
    permissions: ["students", "courses"],
    publisher: "Glintr",
    featured: true,
    version: "1.2.0",
    releasedAt: iso("2026-04-14"),
    color: "#60a5fa",
    icon: "Compass",
  },
  {
    id: "agent-seo-expert",
    name: "SEO Expert",
    role: "SEO Specialist",
    purpose: "Audits pages, suggests titles/metas, generates schema and internal-link recommendations.",
    category: "SEO",
    tools: ["SEO.audit", "Content.rewrite", "Sitemap.check"],
    knowledge: ["Google guidelines", "Schema.org", "Core Web Vitals"],
    permissions: ["blogs", "analytics", "settings"],
    publisher: "Glintr",
    popular: true,
    version: "1.3.1",
    releasedAt: iso("2026-06-04"),
    color: "#f59e0b",
    icon: "Search",
  },
  {
    id: "agent-content-writer",
    name: "Content Writer",
    role: "Long-form Editor",
    purpose: "Produces SEO-ready articles, program pages, and email nurture sequences.",
    category: "Marketing",
    tools: ["Content.generate", "Content.rewrite", "Image.generate", "Grammar.check"],
    knowledge: ["Brand voice", "Style guide", "Program catalog"],
    permissions: ["blogs", "marketing"],
    publisher: "Glintr",
    featured: true,
    version: "1.5.0",
    releasedAt: iso("2026-05-28"),
    color: "#a3e635",
    icon: "PenLine",
  },
  {
    id: "agent-curriculum-designer",
    name: "Curriculum Designer",
    role: "Instructional Designer",
    purpose: "Drafts module curriculums, lesson objectives, quizzes, and capstone projects.",
    category: "AI",
    tools: ["Curriculum.generate", "Assessment.generate", "Project.suggest"],
    knowledge: ["Bloom's taxonomy", "Industry syllabi"],
    permissions: ["courses"],
    publisher: "Glintr",
    version: "1.1.0",
    releasedAt: iso("2026-04-02"),
    color: "#c084fc",
    icon: "GraduationCap",
  },
  {
    id: "agent-placement-coach",
    name: "Placement Coach",
    role: "Placement Coordinator",
    purpose: "Prepares learners for placements: mock interviews, resume tuning, hiring-partner matching.",
    category: "Placement",
    tools: ["Resume.review", "Interview.mock", "Placement.match"],
    knowledge: ["Hiring partners", "JD library"],
    permissions: ["students", "crm"],
    publisher: "Glintr",
    popular: true,
    version: "1.2.0",
    releasedAt: iso("2026-05-06"),
    color: "#34d399",
    icon: "Briefcase",
  },
  {
    id: "agent-interview-coach",
    name: "Interview Coach",
    role: "Mock Interviewer",
    purpose: "Runs role-specific mock interviews with structured feedback and rubric-based scoring.",
    category: "Placement",
    tools: ["Interview.mock", "Feedback.generate"],
    knowledge: ["Interview rubrics", "Question banks"],
    permissions: ["students"],
    publisher: "Glintr",
    version: "1.0.0",
    releasedAt: iso("2026-03-24"),
    color: "#fb7185",
    icon: "Mic",
  },
  {
    id: "agent-resume-reviewer",
    name: "Resume Reviewer",
    role: "Resume Editor",
    purpose: "Rewrites resumes for target roles, ATS-optimises and produces role-specific variants.",
    category: "Placement",
    tools: ["Resume.review", "Resume.rewrite"],
    knowledge: ["ATS rules", "JD templates"],
    permissions: ["students"],
    publisher: "Glintr",
    version: "1.0.0",
    releasedAt: iso("2026-03-04"),
    color: "#38bdf8",
    icon: "FileText",
  },
  {
    id: "agent-marketing-manager",
    name: "Marketing Manager",
    role: "Growth Lead",
    purpose: "Plans monthly marketing calendars, spend allocation, and campaign creative briefs.",
    category: "Marketing",
    tools: ["Campaign.plan", "Content.brief", "Ads.recommend"],
    knowledge: ["Historical campaigns", "Channel benchmarks"],
    permissions: ["marketing", "analytics"],
    publisher: "Glintr",
    featured: true,
    version: "1.3.0",
    releasedAt: iso("2026-06-01"),
    color: "#f97316",
    icon: "Megaphone",
  },
  {
    id: "agent-sales-coach",
    name: "Sales Coach",
    role: "Sales Enablement",
    purpose: "Scores admissions calls, suggests next best actions, coaches counsellors on objections.",
    category: "Sales",
    tools: ["Call.score", "Objection.suggest", "Playbook.serve"],
    knowledge: ["Objection library", "Playbooks"],
    permissions: ["crm", "analytics"],
    publisher: "Glintr",
    version: "1.1.0",
    releasedAt: iso("2026-04-19"),
    color: "#fb7185",
    icon: "Headphones",
  },
  {
    id: "agent-business-analyst",
    name: "Business Analyst",
    role: "Strategy Analyst",
    purpose: "Analyses KPI drift, calls out anomalies, and writes weekly / monthly narratives.",
    category: "Reporting",
    tools: ["Analytics.query", "Report.write"],
    knowledge: ["KPI definitions", "Benchmarks"],
    permissions: ["analytics"],
    publisher: "Glintr",
    version: "1.0.0",
    releasedAt: iso("2026-02-27"),
    color: "#4ade80",
    icon: "LineChart",
  },
  {
    id: "agent-finance-advisor",
    name: "Finance Advisor",
    role: "CFO Assistant",
    purpose: "Cashflow forecasting, unit-economics, invoice reminders and finance narratives for the board.",
    category: "Finance",
    tools: ["Ledger.query", "Forecast.build", "Invoice.remind"],
    knowledge: ["GAAP-lite", "Unit economics", "Tax basics"],
    permissions: ["payments", "analytics"],
    publisher: "Glintr",
    version: "1.0.0",
    releasedAt: iso("2026-03-11"),
    color: "#eab308",
    icon: "Wallet",
  },
  {
    id: "agent-student-success",
    name: "Student Success Manager",
    role: "CSM",
    purpose: "Detects at-risk learners, nudges them, and escalates cases to human mentors.",
    category: "Student Success",
    tools: ["Progress.monitor", "Nudge.send", "Escalation.open"],
    knowledge: ["Attendance policy", "Engagement rubric"],
    permissions: ["students", "courses"],
    publisher: "Glintr",
    popular: true,
    version: "1.2.0",
    releasedAt: iso("2026-05-11"),
    color: "#22d3ee",
    icon: "HeartPulse",
  },
  {
    id: "agent-support",
    name: "Support Agent",
    role: "Tier-1 Support",
    purpose: "Handles FAQs, opens tickets, escalates unresolved issues to the human support desk.",
    category: "Communication",
    tools: ["FAQ.serve", "Ticket.open", "Ticket.escalate"],
    knowledge: ["FAQ library", "SOP docs"],
    permissions: ["students"],
    publisher: "Glintr",
    version: "1.4.0",
    releasedAt: iso("2026-05-22"),
    color: "#818cf8",
    icon: "LifeBuoy",
  },
  {
    id: "agent-community",
    name: "Community Manager",
    role: "Community Lead",
    purpose: "Moderates cohorts on Discord/WhatsApp, surfaces highlights, and runs weekly community rituals.",
    category: "Communication",
    tools: ["Community.moderate", "Digest.publish"],
    knowledge: ["Community guidelines"],
    permissions: ["students", "marketing"],
    publisher: "Glintr",
    version: "1.0.0",
    releasedAt: iso("2026-02-08"),
    color: "#c084fc",
    icon: "MessageSquare",
  },
  {
    id: "agent-corporate-training",
    name: "Corporate Training Advisor",
    role: "B2B Consultant",
    purpose: "Scopes corporate training deals, prepares proposals, and forecasts pipeline conversion.",
    category: "Sales",
    tools: ["Proposal.draft", "Pipeline.forecast"],
    knowledge: ["Corporate case studies", "Pricing playbook"],
    permissions: ["crm", "analytics"],
    publisher: "Glintr",
    version: "1.0.0",
    releasedAt: iso("2026-04-05"),
    color: "#38bdf8",
    icon: "Building2",
  },
];

// ---------------------------------------------------------------------------
// MULTI-AGENT WORKFLOWS
// ---------------------------------------------------------------------------

export const AGENT_WORKFLOWS: AgentWorkflow[] = [
  {
    id: "wf-content-engine",
    name: "AI Content Engine",
    description: "SEO topic discovery → article → images → publish → distribute → measure.",
    category: "Marketing",
    outcome: "One SEO-optimised article published, distributed, and measured — hands-off.",
    agents: [
      "agent-seo-expert",
      "agent-content-writer",
      "agent-marketing-manager",
      "agent-business-analyst",
    ],
  },
  {
    id: "wf-admissions",
    name: "Admissions Autopilot",
    description: "New lead → qualification → nurture sequence → consultation booked → counsellor handoff.",
    category: "Sales",
    outcome: "Higher-quality consultations on the counsellor's calendar with zero manual triage.",
    agents: ["agent-admissions", "agent-sales-coach", "agent-marketing-manager"],
  },
  {
    id: "wf-placement",
    name: "Placement Fast-Track",
    description: "Resume review → interview prep → hiring-partner match → offer negotiation.",
    category: "Placement",
    outcome: "Learners graduate placement-ready with a personalized coaching trail.",
    agents: [
      "agent-resume-reviewer",
      "agent-interview-coach",
      "agent-placement-coach",
      "agent-career-advisor",
    ],
  },
  {
    id: "wf-retention",
    name: "Learner Retention Loop",
    description: "Detect at-risk learners → nudge → escalate to mentor → measure recovery.",
    category: "Student Success",
    outcome: "Reduced churn and stronger cohort NPS via proactive intervention.",
    agents: ["agent-student-success", "agent-support", "agent-career-advisor"],
  },
];

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function findApp(id: string) {
  return MARKETPLACE_APPS.find((a) => a.id === id);
}
export function findAgent(id: string) {
  return AI_AGENTS.find((a) => a.id === id);
}
