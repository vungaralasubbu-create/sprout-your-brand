// Glintr AI Execution Engine — workflow catalog
// Reusable, modular business workflows executed by GlintrAI.

export type ExecutionMode = "suggestion" | "review" | "approval" | "auto";

export type ApproverRole =
  | "content"
  | "marketing"
  | "seo"
  | "founder"
  | "academy_owner";

export type WorkflowCategory =
  | "content"
  | "marketing"
  | "product"
  | "onboarding"
  | "operations"
  | "growth";

export type WorkflowStep = {
  id: string;
  title: string;
  agent: string; // AI agent responsible
  produces: string; // artifact
  estSeconds: number; // simulated duration
  requiresApproval?: boolean;
  approver?: ApproverRole;
};

export type Workflow = {
  id: string;
  name: string;
  tagline: string;
  category: WorkflowCategory;
  defaultMode: ExecutionMode;
  metrics: { tasksAutomated: number; hoursSaved: number };
  approvers: ApproverRole[];
  steps: WorkflowStep[];
};

const s = (
  id: string,
  title: string,
  agent: string,
  produces: string,
  estSeconds = 6,
  requiresApproval = false,
  approver?: ApproverRole
): WorkflowStep => ({ id, title, agent, produces, estSeconds, requiresApproval, approver });

export const WORKFLOWS: Workflow[] = [
  {
    id: "launch-course",
    name: "Launch New Course",
    tagline: "12-step end-to-end course launch, from content to analytics dashboard.",
    category: "product",
    defaultMode: "approval",
    metrics: { tasksAutomated: 42, hoursSaved: 38 },
    approvers: ["content", "marketing", "seo", "academy_owner"],
    steps: [
      s("course-content", "Generate course content", "Content Architect", "Course outline + modules", 8),
      s("hero-image", "Generate hero image", "Visual Studio", "1600×900 cover art", 5),
      s("curriculum", "Generate curriculum", "Curriculum AI", "Weekly curriculum plan", 6),
      s("faqs", "Generate FAQs", "SEO AI", "18 FAQ schema entries", 4),
      s("projects", "Generate capstone projects", "Career AI", "5 industry projects", 5),
      s("landing-page", "Generate landing page", "Growth AI", "12-section landing page", 7, true, "marketing"),
      s("seo", "Generate SEO pack", "SEO AI", "Title, meta, JSON-LD, sitemap entry", 5, true, "seo"),
      s("certificate", "Generate certificate template", "Design AI", "SVG certificate", 4),
      s("social", "Generate social kit", "Social AI", "11-platform social assets", 6),
      s("emails", "Generate email sequence", "Email AI", "7-email launch sequence", 5),
      s("schedule", "Schedule publication", "Ops AI", "Cron + calendar entries", 3, true, "academy_owner"),
      s("analytics", "Generate analytics dashboard", "Analytics AI", "KPI dashboard + funnel", 4),
    ],
  },
  {
    id: "publish-blog",
    name: "Publish Blog",
    tagline: "One blog fans out into blog + 11 channels + newsletter + indexing.",
    category: "content",
    defaultMode: "review",
    metrics: { tasksAutomated: 14, hoursSaved: 9 },
    approvers: ["content", "seo", "marketing"],
    steps: [
      s("blog-body", "Generate blog article", "Content AI", "1500-word draft", 8),
      s("banner", "Generate banner", "Visual Studio", "OG + inline banner", 4),
      s("seo", "Generate SEO", "SEO AI", "Title, meta, canonical, JSON-LD", 3),
      s("faq", "Generate FAQ block", "SEO AI", "6 Q&A pairs", 3),
      s("og-image", "Generate OpenGraph image", "Visual Studio", "1200×630 OG", 3),
      s("linkedin", "Create LinkedIn carousel", "Social AI", "8-slide carousel", 4),
      s("instagram-carousel", "Create Instagram carousel", "Social AI", "10-slide carousel", 4),
      s("instagram-caption", "Create Instagram caption", "Social AI", "Caption + hashtags", 2),
      s("facebook", "Create Facebook post", "Social AI", "Facebook copy", 2),
      s("x-thread", "Create X thread", "Social AI", "8-tweet thread", 3),
      s("whatsapp", "Create WhatsApp campaign", "Messaging AI", "WA broadcast", 2),
      s("telegram", "Create Telegram message", "Messaging AI", "Telegram post", 2),
      s("newsletter", "Generate newsletter", "Email AI", "Newsletter block", 3),
      s("schedule", "Schedule publication", "Ops AI", "Publish calendar", 2, true, "content"),
      s("indexing", "Request search indexing", "SEO AI", "Google + Bing ping", 3, true, "seo"),
    ],
  },
  {
    id: "launch-webinar",
    name: "Launch Webinar",
    tagline: "Full webinar campaign: landing, emails, ads, reminders and replay.",
    category: "marketing",
    defaultMode: "approval",
    metrics: { tasksAutomated: 22, hoursSaved: 16 },
    approvers: ["marketing", "founder"],
    steps: [
      s("brief", "Generate webinar brief", "Growth AI", "Positioning + hooks", 4),
      s("landing", "Generate landing page", "Growth AI", "Registration page", 6, true, "marketing"),
      s("ads", "Generate ad creatives", "Visual Studio", "Meta + Google ads", 5),
      s("emails", "Generate email sequence", "Email AI", "6-email sequence", 4),
      s("reminders", "Schedule reminders", "Ops AI", "SMS + WhatsApp + Email", 3),
      s("deck", "Generate presentation deck", "Content AI", "Slide deck outline", 5),
      s("replay", "Generate replay page", "Ops AI", "Replay + CTA", 3),
    ],
  },
  {
    id: "seo-sprint",
    name: "SEO Optimization Sprint",
    tagline: "Audit → fixes → schema → internal links → indexing across the site.",
    category: "growth",
    defaultMode: "review",
    metrics: { tasksAutomated: 18, hoursSaved: 12 },
    approvers: ["seo"],
    steps: [
      s("audit", "Run technical audit", "SEO AI", "Findings report", 6),
      s("meta", "Optimize titles & metas", "SEO AI", "Optimized head tags", 5),
      s("schema", "Generate schema.org JSON-LD", "SEO AI", "Schema per template", 5),
      s("internal-links", "Add internal links", "SEO AI", "Link graph patch", 4),
      s("images", "Compress + ALT text", "SEO AI", "Image optimization pass", 4),
      s("sitemap", "Regenerate sitemap", "Ops AI", "sitemap.xml", 2),
      s("indexing", "Request indexing", "SEO AI", "Search Console pings", 3, true, "seo"),
    ],
  },
  {
    id: "social-campaign",
    name: "Social Campaign",
    tagline: "Design once, adapt across 9 channels with per-platform variants.",
    category: "marketing",
    defaultMode: "approval",
    metrics: { tasksAutomated: 16, hoursSaved: 11 },
    approvers: ["marketing", "content"],
    steps: [
      s("concept", "Campaign concept", "Growth AI", "Big idea + narrative", 4),
      s("instagram", "Adapt for Instagram", "Social AI", "Reels + carousel", 3),
      s("linkedin", "Adapt for LinkedIn", "Social AI", "Article + carousel", 3),
      s("facebook", "Adapt for Facebook", "Social AI", "Post + reel", 2),
      s("x", "Adapt for X", "Social AI", "Thread + poll", 2),
      s("threads", "Adapt for Threads", "Social AI", "Thread post", 2),
      s("youtube", "YouTube community post", "Social AI", "Poll + copy", 2),
      s("telegram", "Adapt for Telegram", "Messaging AI", "Broadcast copy", 2),
      s("whatsapp", "Adapt for WhatsApp", "Messaging AI", "Broadcast template", 2),
      s("email", "Adapt for email", "Email AI", "Email variant", 3),
      s("schedule", "Cross-channel schedule", "Ops AI", "Calendar", 2, true, "marketing"),
    ],
  },
  {
    id: "student-onboarding",
    name: "Student Onboarding",
    tagline: "Welcome, learning path, mentor match, first-week nudges.",
    category: "onboarding",
    defaultMode: "auto",
    metrics: { tasksAutomated: 9, hoursSaved: 6 },
    approvers: ["content"],
    steps: [
      s("welcome", "Send welcome kit", "Email AI", "Welcome email + PDF", 3),
      s("path", "Generate learning path", "Curriculum AI", "Personalized path", 4),
      s("mentor", "Assign mentor", "Ops AI", "Mentor match", 3),
      s("checklist", "First-week checklist", "Ops AI", "In-app checklist", 2),
      s("nudges", "Schedule nudges", "Messaging AI", "7-day nudges", 3),
    ],
  },
  {
    id: "partner-onboarding",
    name: "Partner Onboarding",
    tagline: "Contract → brand kit → sales academy → first campaign.",
    category: "onboarding",
    defaultMode: "approval",
    metrics: { tasksAutomated: 12, hoursSaved: 9 },
    approvers: ["founder", "marketing"],
    steps: [
      s("contract", "Prepare contract", "Ops AI", "e-Sign contract", 4, true, "founder"),
      s("brand-kit", "Generate brand kit", "Visual Studio", "Logo + palette", 4),
      s("academy", "Provision Academy shell", "Ops AI", "Subdomain + LMS", 4),
      s("sales-academy", "Enroll in sales academy", "Learning AI", "Curriculum", 3),
      s("first-campaign", "Launch first campaign", "Growth AI", "Awareness kit", 4),
    ],
  },
  {
    id: "corporate-onboarding",
    name: "Corporate Onboarding",
    tagline: "MSA, cohort setup, LMS provisioning, KPI dashboard.",
    category: "onboarding",
    defaultMode: "approval",
    metrics: { tasksAutomated: 11, hoursSaved: 8 },
    approvers: ["founder"],
    steps: [
      s("msa", "Prepare MSA", "Ops AI", "MSA document", 4, true, "founder"),
      s("cohort", "Create cohort", "Ops AI", "Cohort record", 3),
      s("lms", "Provision LMS", "Ops AI", "Corporate LMS", 4),
      s("comms", "Kick-off comms", "Email AI", "Welcome + calendar", 3),
      s("kpi", "KPI dashboard", "Analytics AI", "Live dashboard", 3),
    ],
  },
  {
    id: "academy-launch",
    name: "Academy Launch",
    tagline: "Turn a partner into a full academy in one workflow.",
    category: "product",
    defaultMode: "approval",
    metrics: { tasksAutomated: 28, hoursSaved: 22 },
    approvers: ["founder", "academy_owner", "marketing"],
    steps: [
      s("brand", "Generate brand identity", "Visual Studio", "Logo + system", 5),
      s("site", "Generate website", "Growth AI", "12-page site", 8),
      s("catalog", "Import course catalog", "Curriculum AI", "Course pack", 5),
      s("payments", "Wire payments", "Ops AI", "Razorpay + Stripe", 4),
      s("crm", "Provision CRM", "Ops AI", "Leads + pipeline", 3),
      s("launch", "Launch announcement", "Growth AI", "Multi-channel", 4, true, "founder"),
    ],
  },
  {
    id: "placement-drive",
    name: "Placement Drive",
    tagline: "Kick off a placement season across employers, students and campus.",
    category: "operations",
    defaultMode: "approval",
    metrics: { tasksAutomated: 20, hoursSaved: 15 },
    approvers: ["founder", "marketing"],
    steps: [
      s("employers", "Outreach to employers", "Sales AI", "Outreach queue", 5),
      s("jd", "Generate JDs", "Content AI", "JD library", 4),
      s("students", "Student communication", "Email AI", "Prep + JDs", 4),
      s("mock", "Mock interviews", "Learning AI", "Interview slots", 3),
      s("reports", "Placement reports", "Analytics AI", "Weekly reports", 3),
    ],
  },
];

export const EXECUTION_MODES: Record<ExecutionMode, { label: string; description: string }> = {
  suggestion: {
    label: "Suggestion",
    description: "GlintrAI drafts artifacts and posts them as suggestions. Nothing runs.",
  },
  review: {
    label: "Review",
    description: "GlintrAI executes every step and stops before publish. Editors review outputs.",
  },
  approval: {
    label: "Approval",
    description: "GlintrAI executes and requests approval at gated steps before continuing.",
  },
  auto: {
    label: "Fully Automated",
    description: "GlintrAI executes end-to-end. Audit log records every action.",
  },
};

export const APPROVER_ROLES: Record<ApproverRole, string> = {
  content: "Content Team",
  marketing: "Marketing",
  seo: "SEO",
  founder: "Founder",
  academy_owner: "Academy Owner",
};

export const QA_CHECKS = [
  "Grammar",
  "Brand Voice",
  "SEO",
  "Broken Links",
  "Accessibility",
  "Image ALT Text",
  "Duplicate Content",
  "Readability",
  "Compliance",
] as const;
export type QaCheck = (typeof QA_CHECKS)[number];
