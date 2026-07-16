/**
 * Glintr Digital Employee System — catalog + engine + storage.
 *
 * Client-only, brand-scoped localStorage. Deterministic simulation of an
 * AI-driven org: 13 role-based employees under an AI COO, task lifecycle,
 * cross-role collaboration handoffs, automation rules, and productivity KPIs.
 */

import {
  Crown,
  Megaphone,
  Search,
  PenTool,
  Palette,
  BookOpen,
  Target,
  GraduationCap,
  Users,
  LifeBuoy,
  Wallet,
  Briefcase,
  UserCheck,
  Cog,
  type LucideIcon,
} from "lucide-react";

/* ---------------- Catalog ---------------- */

export type EmployeeSlug =
  | "coo"
  | "marketing"
  | "seo"
  | "content"
  | "course"
  | "admissions"
  | "sales"
  | "student-success"
  | "placement"
  | "support"
  | "finance"
  | "design"
  | "hr";

export type Department =
  | "Executive"
  | "Marketing"
  | "Sales"
  | "Academics"
  | "Operations"
  | "Support"
  | "Finance"
  | "HR";

export interface DigitalEmployee {
  slug: EmployeeSlug;
  name: string;
  role: string;
  department: Department;
  icon: LucideIcon;
  tagline: string;
  responsibilities: string[];
  kpis: { label: string; target: string }[];
  outputs: string[];
  color: string;
  reportsTo: EmployeeSlug | null;
}

export const DIGITAL_EMPLOYEES: DigitalEmployee[] = [
  {
    slug: "coo",
    name: "Aria",
    role: "AI COO",
    department: "Executive",
    icon: Crown,
    tagline: "Runs your academy like a Chief Operating Officer",
    responsibilities: [
      "Monitor overall academy health",
      "Detect operational issues",
      "Suggest improvements",
      "Assign tasks to other AI employees",
      "Generate weekly business summaries",
      "Track KPIs",
    ],
    kpis: [
      { label: "Business Health", target: "> 80" },
      { label: "Weekly Briefings", target: "1 / week" },
      { label: "Cross-team Tasks", target: "> 15 / week" },
    ],
    outputs: ["Weekly business summary", "Priority board", "Delegation queue"],
    color: "from-amber-500/20 to-amber-500/5 text-amber-200 border-amber-500/30",
    reportsTo: null,
  },
  {
    slug: "marketing",
    name: "Mira",
    role: "AI Marketing Manager",
    department: "Marketing",
    icon: Megaphone,
    tagline: "Plans campaigns, drafts every post",
    responsibilities: [
      "Create monthly marketing calendar",
      "Generate social posts",
      "Generate ad copy",
      "Generate campaigns",
      "Recommend promotions",
      "Analyze campaign performance",
    ],
    kpis: [
      { label: "Posts / week", target: "10+" },
      { label: "Campaign CTR", target: "> 3%" },
      { label: "Leads generated", target: "> 40 / week" },
    ],
    outputs: ["Marketing calendar", "Ad creatives", "Campaign report"],
    color: "from-rose-500/20 to-rose-500/5 text-rose-200 border-rose-500/30",
    reportsTo: "coo",
  },
  {
    slug: "seo",
    name: "Sage",
    role: "AI SEO Manager",
    department: "Marketing",
    icon: Search,
    tagline: "Owns rankings, schema, and topic clusters",
    responsibilities: [
      "Monitor rankings",
      "Suggest keyword opportunities",
      "Build topic clusters",
      "Improve internal links",
      "Detect SEO issues",
      "Generate SEO reports",
    ],
    kpis: [
      { label: "Indexed pages", target: "> 200" },
      { label: "Top-10 keywords", target: "> 25" },
      { label: "Core Web Vitals", target: "Green" },
    ],
    outputs: ["Keyword map", "SEO audit", "Internal link fixes"],
    color: "from-emerald-500/20 to-emerald-500/5 text-emerald-200 border-emerald-500/30",
    reportsTo: "coo",
  },
  {
    slug: "content",
    name: "Nova",
    role: "AI Content Manager",
    department: "Marketing",
    icon: PenTool,
    tagline: "Blogs, landing pages, newsletters",
    responsibilities: [
      "Generate blogs",
      "Generate landing pages",
      "Update course descriptions",
      "Create newsletters",
      "Maintain content quality",
    ],
    kpis: [
      { label: "Blogs / month", target: "8+" },
      { label: "Editorial score", target: "> 85" },
      { label: "Content coverage", target: "> 90%" },
    ],
    outputs: ["Blog drafts", "Landing page copy", "Newsletter"],
    color: "from-sky-500/20 to-sky-500/5 text-sky-200 border-sky-500/30",
    reportsTo: "coo",
  },
  {
    slug: "course",
    name: "Cael",
    role: "AI Course Manager",
    department: "Academics",
    icon: BookOpen,
    tagline: "Curriculum, quizzes, assignments",
    responsibilities: [
      "Suggest curriculum updates",
      "Recommend new modules",
      "Detect outdated content",
      "Generate quizzes",
      "Generate assignments",
      "Recommend projects",
    ],
    kpis: [
      { label: "Course freshness", target: "< 60 days" },
      { label: "Quiz coverage", target: "> 95%" },
      { label: "Student rating", target: "> 4.4 / 5" },
    ],
    outputs: ["Curriculum updates", "Quiz bank", "Assignment sheets"],
    color: "from-violet-500/20 to-violet-500/5 text-violet-200 border-violet-500/30",
    reportsTo: "coo",
  },
  {
    slug: "admissions",
    name: "Ada",
    role: "AI Admissions Manager",
    department: "Sales",
    icon: UserCheck,
    tagline: "Owns the enquiry-to-enrollment funnel",
    responsibilities: [
      "Analyze admissions funnel",
      "Follow up with enquiries",
      "Suggest outreach messages",
      "Track conversion rates",
    ],
    kpis: [
      { label: "Funnel conversion", target: "> 18%" },
      { label: "First response", target: "< 5 min" },
      { label: "Admissions / week", target: "> 12" },
    ],
    outputs: ["Funnel report", "Outreach queue", "Enrollment forecast"],
    color: "from-orange-500/20 to-orange-500/5 text-orange-200 border-orange-500/30",
    reportsTo: "coo",
  },
  {
    slug: "sales",
    name: "Rex",
    role: "AI Sales Manager",
    department: "Sales",
    icon: Target,
    tagline: "Prioritises leads, closes deals",
    responsibilities: [
      "Lead prioritization",
      "Sales scripts",
      "Proposal generation",
      "Objection handling",
      "Follow-up reminders",
      "Sales coaching",
    ],
    kpis: [
      { label: "Weighted pipeline", target: "> ₹10L" },
      { label: "Close rate", target: "> 22%" },
      { label: "Response time", target: "< 30 min" },
    ],
    outputs: ["Priority board", "Proposals", "Objection playbook"],
    color: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-200 border-fuchsia-500/30",
    reportsTo: "coo",
  },
  {
    slug: "student-success",
    name: "Iris",
    role: "AI Student Success Manager",
    department: "Academics",
    icon: GraduationCap,
    tagline: "Keeps every learner engaged",
    responsibilities: [
      "Detect inactive students",
      "Recommend interventions",
      "Track completion rates",
      "Suggest mentoring sessions",
      "Reduce drop-offs",
    ],
    kpis: [
      { label: "Completion rate", target: "> 70%" },
      { label: "Weekly active", target: "> 80%" },
      { label: "NPS", target: "> 55" },
    ],
    outputs: ["At-risk list", "Intervention plan", "Cohort report"],
    color: "from-teal-500/20 to-teal-500/5 text-teal-200 border-teal-500/30",
    reportsTo: "coo",
  },
  {
    slug: "placement",
    name: "Piper",
    role: "AI Placement Manager",
    department: "Academics",
    icon: Briefcase,
    tagline: "Careers, resumes, mock interviews",
    responsibilities: [
      "Resume recommendations",
      "Mock interview scheduling",
      "Company matching",
      "Internship suggestions",
      "Placement analytics",
    ],
    kpis: [
      { label: "Placement rate", target: "> 65%" },
      { label: "Interview readiness", target: "> 80" },
      { label: "Avg offer CTC", target: "> ₹6 LPA" },
    ],
    outputs: ["Resume audits", "Interview schedule", "Company match list"],
    color: "from-lime-500/20 to-lime-500/5 text-lime-200 border-lime-500/30",
    reportsTo: "coo",
  },
  {
    slug: "support",
    name: "Cleo",
    role: "AI Support Manager",
    department: "Support",
    icon: LifeBuoy,
    tagline: "Categorises, triages, replies",
    responsibilities: [
      "Categorize tickets",
      "Suggest responses",
      "Escalate urgent issues",
      "Track SLA",
      "Measure satisfaction",
    ],
    kpis: [
      { label: "First response", target: "< 15 min" },
      { label: "CSAT", target: "> 4.5 / 5" },
      { label: "SLA hit rate", target: "> 95%" },
    ],
    outputs: ["Ticket digest", "Reply drafts", "Escalation list"],
    color: "from-cyan-500/20 to-cyan-500/5 text-cyan-200 border-cyan-500/30",
    reportsTo: "coo",
  },
  {
    slug: "finance",
    name: "Vera",
    role: "AI Finance Manager",
    department: "Finance",
    icon: Wallet,
    tagline: "Revenue, payouts, forecasts",
    responsibilities: [
      "Revenue reports",
      "Payout tracking",
      "Invoice reminders",
      "Subscription monitoring",
      "Financial forecasts",
    ],
    kpis: [
      { label: "Revenue MoM", target: "> +12%" },
      { label: "Collection rate", target: "> 92%" },
      { label: "Payout SLA", target: "< 3 days" },
    ],
    outputs: ["Monthly P&L", "Cashflow forecast", "Payout report"],
    color: "from-yellow-500/20 to-yellow-500/5 text-yellow-200 border-yellow-500/30",
    reportsTo: "coo",
  },
  {
    slug: "design",
    name: "Kite",
    role: "AI Design Manager",
    department: "Marketing",
    icon: Palette,
    tagline: "Posters, banners, certificates",
    responsibilities: [
      "Posters",
      "Social creatives",
      "Landing page banners",
      "Certificates",
      "Presentation graphics",
    ],
    kpis: [
      { label: "Creatives / week", target: "> 20" },
      { label: "On-brand score", target: "> 90" },
      { label: "Turnaround", target: "< 24 h" },
    ],
    outputs: ["Posters", "Banners", "Certificate templates"],
    color: "from-pink-500/20 to-pink-500/5 text-pink-200 border-pink-500/30",
    reportsTo: "coo",
  },
  {
    slug: "hr",
    name: "Hana",
    role: "AI HR Manager",
    department: "HR",
    icon: Users,
    tagline: "Faculty, mentors, attendance",
    responsibilities: [
      "Faculty onboarding",
      "Mentor management",
      "Performance tracking",
      "Attendance analytics",
    ],
    kpis: [
      { label: "Onboarding time", target: "< 3 days" },
      { label: "Attendance", target: "> 92%" },
      { label: "Faculty rating", target: "> 4.3 / 5" },
    ],
    outputs: ["Onboarding kit", "Attendance digest", "Faculty scorecard"],
    color: "from-indigo-500/20 to-indigo-500/5 text-indigo-200 border-indigo-500/30",
    reportsTo: "coo",
  },
];

export function findDigitalEmployee(slug: EmployeeSlug): DigitalEmployee | undefined {
  return DIGITAL_EMPLOYEES.find((e) => e.slug === slug);
}

/* ---------------- Types ---------------- */

export type TaskStatus =
  | "queued"
  | "working"
  | "waiting_approval"
  | "completed"
  | "blocked";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface EmployeeTask {
  id: string;
  employee: EmployeeSlug;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  hoursSaved: number;
  origin: "manual" | "coo" | "collaboration" | "automation";
  originEmployee?: EmployeeSlug;
  handoffTo?: EmployeeSlug;
  output?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  employee: EmployeeSlug;
  kind:
    | "task_created"
    | "task_started"
    | "task_completed"
    | "task_handoff"
    | "task_approved"
    | "recommendation"
    | "automation_run"
    | "briefing";
  message: string;
  taskId?: string;
}

export interface AutomationRule {
  id: string;
  employee: EmployeeSlug;
  label: string;
  description: string;
  enabled: boolean;
  cadence: "hourly" | "daily" | "weekly" | "on-event";
  autoApprove: boolean;
  lastRunAt?: string;
  runsCount: number;
}

export interface EmployeeState {
  slug: EmployeeSlug;
  status: "working" | "waiting" | "scheduled" | "idle";
  productivity: number; // 0-100
  tasksCompleted: number;
  tasksActive: number;
  hoursSaved: number;
  lastActiveAt?: string;
}

export interface CollaborationWorkflow {
  id: string;
  label: string;
  description: string;
  steps: { employee: EmployeeSlug; action: string }[];
}

export const COLLABORATION_WORKFLOWS: CollaborationWorkflow[] = [
  {
    id: "wf-blog-pipeline",
    label: "Blog → SEO → Design → Distribute",
    description: "Marketing requests a blog. Content drafts, SEO optimises, Design creates the banner, Marketing schedules distribution.",
    steps: [
      { employee: "marketing", action: "Brief the topic and target keyword" },
      { employee: "content", action: "Draft the article" },
      { employee: "seo", action: "Optimise headings, links, schema" },
      { employee: "design", action: "Create hero + social banner" },
      { employee: "marketing", action: "Schedule distribution" },
    ],
  },
  {
    id: "wf-campaign",
    label: "Weekly Campaign Launch",
    description: "COO briefs a promotion. Marketing plans it, Content writes copy, Design creates creatives, Finance sets discount cap.",
    steps: [
      { employee: "coo", action: "Brief the promotion goal" },
      { employee: "marketing", action: "Plan channels + calendar" },
      { employee: "content", action: "Write ad + email copy" },
      { employee: "design", action: "Produce visuals" },
      { employee: "finance", action: "Approve discount / EMI cap" },
    ],
  },
  {
    id: "wf-admissions",
    label: "Enquiry → Enrollment",
    description: "Admissions receives an enquiry. Sales qualifies, Content sends brochure, Support handles queries, Finance issues invoice.",
    steps: [
      { employee: "admissions", action: "Log and score the enquiry" },
      { employee: "sales", action: "Qualify, follow up, propose" },
      { employee: "content", action: "Personalised brochure" },
      { employee: "support", action: "Answer objections" },
      { employee: "finance", action: "Payment link + invoice" },
    ],
  },
  {
    id: "wf-retention",
    label: "Student At-Risk Intervention",
    description: "Student Success flags inactive cohort. Course refreshes content, HR assigns mentor, Placement offers career call.",
    steps: [
      { employee: "student-success", action: "Flag inactive students" },
      { employee: "course", action: "Refresh weakest module" },
      { employee: "hr", action: "Assign mentor" },
      { employee: "placement", action: "Offer career call" },
    ],
  },
];

export const DEFAULT_AUTOMATIONS: Omit<AutomationRule, "id" | "runsCount" | "lastRunAt">[] = [
  {
    employee: "content",
    label: "Weekly blog draft",
    description: "Draft one SEO-tuned blog every Monday morning.",
    enabled: true,
    cadence: "weekly",
    autoApprove: false,
  },
  {
    employee: "marketing",
    label: "Daily social post",
    description: "Publish one social post daily across LinkedIn + Instagram.",
    enabled: true,
    cadence: "daily",
    autoApprove: true,
  },
  {
    employee: "seo",
    label: "Weekly SEO audit",
    description: "Scan indexed pages for regressions and file fixes.",
    enabled: true,
    cadence: "weekly",
    autoApprove: false,
  },
  {
    employee: "marketing",
    label: "Bi-weekly email campaign",
    description: "Send an email nurture campaign every two weeks.",
    enabled: false,
    cadence: "weekly",
    autoApprove: false,
  },
  {
    employee: "coo",
    label: "Weekly business briefing",
    description: "Compile weekly KPIs, wins, and priorities every Sunday.",
    enabled: true,
    cadence: "weekly",
    autoApprove: true,
  },
  {
    employee: "admissions",
    label: "Enquiry auto-follow-up",
    description: "Follow up any enquiry idle for 24h.",
    enabled: true,
    cadence: "on-event",
    autoApprove: true,
  },
  {
    employee: "student-success",
    label: "Inactivity nudge",
    description: "Nudge learners inactive for 7+ days.",
    enabled: true,
    cadence: "daily",
    autoApprove: true,
  },
  {
    employee: "finance",
    label: "Weekly revenue digest",
    description: "Email a revenue + payout digest every Friday.",
    enabled: true,
    cadence: "weekly",
    autoApprove: true,
  },
];

/* ---------------- Storage ---------------- */

interface StoreShape {
  version: 1;
  employees: Record<EmployeeSlug, EmployeeState>;
  tasks: EmployeeTask[];
  activity: ActivityEvent[];
  automations: AutomationRule[];
  recommendationsAccepted: number;
  seededAt?: string;
}

const CURRENT_BRAND_KEY = "glintr.partner.active-brand";
const STORE_PREFIX = "glintr.digital-employees.v1";

function getBrandId(): string {
  if (typeof window === "undefined") return "default";
  try {
    return localStorage.getItem(CURRENT_BRAND_KEY) || "default";
  } catch {
    return "default";
  }
}

function storeKey(brandId = getBrandId()): string {
  return `${STORE_PREFIX}.${brandId}`;
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

function emptyStore(): StoreShape {
  const employees = Object.fromEntries(
    DIGITAL_EMPLOYEES.map((e) => [
      e.slug,
      {
        slug: e.slug,
        status: "idle" as const,
        productivity: 78,
        tasksCompleted: 0,
        tasksActive: 0,
        hoursSaved: 0,
      } satisfies EmployeeState,
    ]),
  ) as Record<EmployeeSlug, EmployeeState>;
  const automations = DEFAULT_AUTOMATIONS.map((a) => ({
    ...a,
    id: uid("auto"),
    runsCount: 0,
  }));
  return {
    version: 1,
    employees,
    tasks: [],
    activity: [],
    automations,
    recommendationsAccepted: 0,
  };
}

export function loadStore(): StoreShape {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(storeKey());
    if (!raw) {
      const seeded = seedInitial(emptyStore());
      saveStore(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as StoreShape;
    if (parsed.version !== 1) {
      const fresh = seedInitial(emptyStore());
      saveStore(fresh);
      return fresh;
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: StoreShape): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storeKey(), JSON.stringify(store));
  } catch {
    /* noop */
  }
}

export function resetStore(): StoreShape {
  const fresh = seedInitial(emptyStore());
  saveStore(fresh);
  return fresh;
}

/* ---------------- Engine ---------------- */

const HOURS_PER_TASK: Record<TaskPriority, number> = {
  low: 1.5,
  medium: 3,
  high: 5,
  urgent: 8,
};

function recalcEmployee(store: StoreShape, slug: EmployeeSlug): void {
  const state = store.employees[slug];
  const own = store.tasks.filter((t) => t.employee === slug);
  const active = own.filter((t) => t.status === "working" || t.status === "queued").length;
  const completed = own.filter((t) => t.status === "completed").length;
  const hoursSaved = own
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.hoursSaved, 0);
  state.tasksActive = active;
  state.tasksCompleted = completed;
  state.hoursSaved = Math.round(hoursSaved * 10) / 10;
  state.status = active > 0 ? "working" : own.some((t) => t.status === "waiting_approval") ? "waiting" : "idle";
  // productivity blends throughput + hours + baseline
  const throughput = Math.min(30, completed) * 1.5; // up to 45
  const savings = Math.min(30, hoursSaved / 2); // up to 30
  const baseline = 40;
  state.productivity = Math.min(100, Math.round(baseline + throughput + savings));
  state.lastActiveAt = isoNow();
}

function pushActivity(store: StoreShape, ev: Omit<ActivityEvent, "id" | "timestamp">): void {
  store.activity.unshift({
    ...ev,
    id: uid("act"),
    timestamp: isoNow(),
  });
  if (store.activity.length > 400) store.activity.length = 400;
}

export interface CreateTaskInput {
  employee: EmployeeSlug;
  title: string;
  description: string;
  priority?: TaskPriority;
  requiresApproval?: boolean;
  origin?: EmployeeTask["origin"];
  originEmployee?: EmployeeSlug;
  handoffTo?: EmployeeSlug;
}

export function createTask(input: CreateTaskInput): EmployeeTask {
  const store = loadStore();
  const task: EmployeeTask = {
    id: uid("task"),
    employee: input.employee,
    title: input.title,
    description: input.description,
    priority: input.priority ?? "medium",
    status: "queued",
    requiresApproval: input.requiresApproval ?? false,
    createdAt: isoNow(),
    updatedAt: isoNow(),
    hoursSaved: HOURS_PER_TASK[input.priority ?? "medium"],
    origin: input.origin ?? "manual",
    originEmployee: input.originEmployee,
    handoffTo: input.handoffTo,
  };
  store.tasks.unshift(task);
  pushActivity(store, {
    employee: input.employee,
    kind: "task_created",
    message: `${labelFor(input.employee)} received task: ${task.title}`,
    taskId: task.id,
  });
  recalcEmployee(store, input.employee);
  saveStore(store);
  return task;
}

export function startTask(taskId: string): void {
  const store = loadStore();
  const t = store.tasks.find((x) => x.id === taskId);
  if (!t) return;
  t.status = "working";
  t.updatedAt = isoNow();
  pushActivity(store, {
    employee: t.employee,
    kind: "task_started",
    message: `${labelFor(t.employee)} is working on "${t.title}"`,
    taskId: t.id,
  });
  recalcEmployee(store, t.employee);
  saveStore(store);
}

export function completeTask(taskId: string, output?: string): void {
  const store = loadStore();
  const t = store.tasks.find((x) => x.id === taskId);
  if (!t) return;
  if (t.requiresApproval && t.status !== "waiting_approval") {
    t.status = "waiting_approval";
    t.updatedAt = isoNow();
    t.output = output ?? sampleOutput(t.employee, t.title);
    pushActivity(store, {
      employee: t.employee,
      kind: "task_completed",
      message: `${labelFor(t.employee)} finished "${t.title}" — awaiting approval`,
      taskId: t.id,
    });
    recalcEmployee(store, t.employee);
    saveStore(store);
    return;
  }
  t.status = "completed";
  t.completedAt = isoNow();
  t.updatedAt = isoNow();
  t.output = output ?? t.output ?? sampleOutput(t.employee, t.title);
  pushActivity(store, {
    employee: t.employee,
    kind: "task_completed",
    message: `${labelFor(t.employee)} completed "${t.title}"`,
    taskId: t.id,
  });
  recalcEmployee(store, t.employee);
  if (t.handoffTo) {
    handoff(t.id, t.handoffTo);
  }
  saveStore(store);
}

export function approveTask(taskId: string): void {
  const store = loadStore();
  const t = store.tasks.find((x) => x.id === taskId);
  if (!t) return;
  t.status = "completed";
  t.completedAt = isoNow();
  t.updatedAt = isoNow();
  store.recommendationsAccepted += 1;
  pushActivity(store, {
    employee: t.employee,
    kind: "task_approved",
    message: `Approved "${t.title}" from ${labelFor(t.employee)}`,
    taskId: t.id,
  });
  recalcEmployee(store, t.employee);
  if (t.handoffTo) handoff(t.id, t.handoffTo);
  saveStore(store);
}

export function rejectTask(taskId: string): void {
  const store = loadStore();
  const idx = store.tasks.findIndex((x) => x.id === taskId);
  if (idx < 0) return;
  const t = store.tasks[idx];
  t.status = "blocked";
  t.updatedAt = isoNow();
  pushActivity(store, {
    employee: t.employee,
    kind: "task_approved",
    message: `Rejected "${t.title}"`,
    taskId: t.id,
  });
  recalcEmployee(store, t.employee);
  saveStore(store);
}

export function handoff(fromTaskId: string, to: EmployeeSlug): EmployeeTask | undefined {
  const store = loadStore();
  const parent = store.tasks.find((x) => x.id === fromTaskId);
  if (!parent) return undefined;
  const child: EmployeeTask = {
    id: uid("task"),
    employee: to,
    title: `[Handoff] ${parent.title}`,
    description: `Handed off from ${labelFor(parent.employee)}. Continue: ${parent.description}`,
    priority: parent.priority,
    status: "queued",
    requiresApproval: parent.requiresApproval,
    createdAt: isoNow(),
    updatedAt: isoNow(),
    hoursSaved: HOURS_PER_TASK[parent.priority],
    origin: "collaboration",
    originEmployee: parent.employee,
  };
  store.tasks.unshift(child);
  pushActivity(store, {
    employee: to,
    kind: "task_handoff",
    message: `${labelFor(parent.employee)} → ${labelFor(to)}: "${parent.title}"`,
    taskId: child.id,
  });
  recalcEmployee(store, to);
  saveStore(store);
  return child;
}

export function runWorkflow(workflowId: string, prompt: string): EmployeeTask[] {
  const wf = COLLABORATION_WORKFLOWS.find((w) => w.id === workflowId);
  if (!wf) return [];
  const created: EmployeeTask[] = [];
  for (let i = 0; i < wf.steps.length; i++) {
    const step = wf.steps[i];
    const next = wf.steps[i + 1];
    const task = createTask({
      employee: step.employee,
      title: `${wf.label} — ${step.action}`,
      description: prompt || wf.description,
      priority: "high",
      requiresApproval: i === wf.steps.length - 1,
      origin: "collaboration",
      handoffTo: next?.employee,
    });
    created.push(task);
  }
  return created;
}

export function toggleAutomation(id: string): void {
  const store = loadStore();
  const rule = store.automations.find((r) => r.id === id);
  if (!rule) return;
  rule.enabled = !rule.enabled;
  saveStore(store);
}

export function toggleAutoApprove(id: string): void {
  const store = loadStore();
  const rule = store.automations.find((r) => r.id === id);
  if (!rule) return;
  rule.autoApprove = !rule.autoApprove;
  saveStore(store);
}

export function runAutomation(id: string): EmployeeTask | undefined {
  const store = loadStore();
  const rule = store.automations.find((r) => r.id === id);
  if (!rule) return undefined;
  rule.lastRunAt = isoNow();
  rule.runsCount += 1;
  pushActivity(store, {
    employee: rule.employee,
    kind: "automation_run",
    message: `Automation "${rule.label}" executed`,
  });
  saveStore(store);
  const task = createTask({
    employee: rule.employee,
    title: rule.label,
    description: rule.description,
    priority: "medium",
    requiresApproval: !rule.autoApprove,
    origin: "automation",
  });
  // Auto-complete if auto-approve enabled
  if (rule.autoApprove) {
    completeTask(task.id);
  }
  return task;
}

/* ---------------- COO delegation ---------------- */

export function generateWeeklyBriefing(): { summary: string; priorities: string[]; risks: string[] } {
  const store = loadStore();
  const totalCompleted = store.tasks.filter((t) => t.status === "completed").length;
  const active = store.tasks.filter((t) => t.status === "working" || t.status === "queued").length;
  const hoursSaved = Math.round(
    store.tasks.filter((t) => t.status === "completed").reduce((s, t) => s + t.hoursSaved, 0),
  );
  const summary = `${totalCompleted} tasks completed this cycle across your team. ${hoursSaved}h of work automated. ${active} tasks in progress.`;
  const priorities = [
    "Publish 3 SEO-tuned blogs on trending AI keywords",
    "Launch WhatsApp nurture campaign for cold enquiries",
    "Refresh the weakest module in your flagship course",
    "Schedule mock interviews for at-risk cohort",
  ];
  const risks = [
    "Response time on enquiries slipped above 15 min — Admissions to intervene",
    "Two blogs pending approval for > 48h — approve or reject in Content queue",
    "Payout SLA at 3.2 days — Finance to escalate stuck items",
  ];
  const store2 = loadStore();
  pushActivity(store2, {
    employee: "coo",
    kind: "briefing",
    message: "Weekly business briefing generated by AI COO",
  });
  saveStore(store2);
  return { summary, priorities, risks };
}

export function delegateFromCOO(target: EmployeeSlug, title: string, description: string): EmployeeTask {
  return createTask({
    employee: target,
    title,
    description,
    priority: "high",
    requiresApproval: false,
    origin: "coo",
    originEmployee: "coo",
  });
}

/* ---------------- Command bar ---------------- */

const COMMAND_INTENTS: { pattern: RegExp; slug: EmployeeSlug; label: string }[] = [
  { pattern: /(blog|article|post|newsletter)/i, slug: "content", label: "Draft content" },
  { pattern: /(seo|keyword|rank|schema)/i, slug: "seo", label: "SEO task" },
  { pattern: /(campaign|instagram|linkedin|marketing|social)/i, slug: "marketing", label: "Marketing campaign" },
  { pattern: /(design|banner|poster|creative|certificate)/i, slug: "design", label: "Design brief" },
  { pattern: /(course|module|quiz|assignment|curriculum)/i, slug: "course", label: "Course update" },
  { pattern: /(enquiry|admission|admissions)/i, slug: "admissions", label: "Admissions" },
  { pattern: /(lead|sales|proposal|objection|close)/i, slug: "sales", label: "Sales" },
  { pattern: /(student|dropout|retention|inactive)/i, slug: "student-success", label: "Student success" },
  { pattern: /(placement|resume|interview|company)/i, slug: "placement", label: "Placement" },
  { pattern: /(ticket|support|reply|escalate)/i, slug: "support", label: "Support" },
  { pattern: /(revenue|payout|invoice|forecast|finance)/i, slug: "finance", label: "Finance" },
  { pattern: /(faculty|mentor|attendance|onboarding)/i, slug: "hr", label: "HR" },
  { pattern: /(brief|kpi|health|coo|summary|priorit)/i, slug: "coo", label: "COO briefing" },
];

export function runCommand(text: string): { assigned: EmployeeSlug; task: EmployeeTask; reply: string } {
  const match = COMMAND_INTENTS.find((i) => i.pattern.test(text));
  const slug: EmployeeSlug = match?.slug ?? "coo";
  const task = createTask({
    employee: slug,
    title: `Command: ${text.slice(0, 60)}${text.length > 60 ? "…" : ""}`,
    description: text,
    priority: "high",
    requiresApproval: slug !== "coo",
    origin: "manual",
  });
  const reply = match
    ? `Assigned to ${labelFor(slug)} — ${match.label}. Task queued.`
    : `Routed to AI COO for triage.`;
  return { assigned: slug, task, reply };
}

function labelFor(slug: EmployeeSlug): string {
  return findDigitalEmployee(slug)?.role ?? slug;
}

function sampleOutput(slug: EmployeeSlug, title: string): string {
  const e = findDigitalEmployee(slug);
  return `${e?.role ?? slug} produced: "${title}". Draft attached. Review the artifact and approve to publish.`;
}

/* ---------------- Seed ---------------- */

function seedInitial(store: StoreShape): StoreShape {
  const seeds: CreateTaskInput[] = [
    { employee: "marketing", title: "October content calendar", description: "Plan 20 posts across LinkedIn, Instagram, and email.", priority: "high" },
    { employee: "content", title: "Draft: What is Prompt Engineering?", description: "1,800-word SEO blog targeting 'prompt engineering guide'.", priority: "medium", requiresApproval: true },
    { employee: "seo", title: "Fix internal links on Programs pages", description: "Audit orphan pages and interlink 12 top-priority course pages.", priority: "medium" },
    { employee: "admissions", title: "Follow up 34 idle enquiries", description: "Enquiries from last week without a response.", priority: "urgent" },
    { employee: "sales", title: "Priority calls for today", description: "Rank hot leads and prep talking points.", priority: "high" },
    { employee: "student-success", title: "At-risk cohort (Cohort 12)", description: "Identify inactive learners and recommend interventions.", priority: "medium" },
    { employee: "placement", title: "Resume audits — batch of 18", description: "Audit and score 18 resumes for the Nov drive.", priority: "medium" },
    { employee: "support", title: "Triage 22 open tickets", description: "Categorise and draft replies for pending tickets.", priority: "high" },
    { employee: "finance", title: "October revenue digest", description: "Compile revenue, payouts, and forecast for October.", priority: "medium", requiresApproval: true },
    { employee: "design", title: "Course cover — Gen AI Bootcamp", description: "1200×628 hero + 3 social variants.", priority: "medium" },
    { employee: "hr", title: "Onboard 2 new faculty", description: "Create onboarding kits for new AI + Data faculty.", priority: "low" },
    { employee: "course", title: "Refresh Module 3 of ChatGPT program", description: "Rewrite with latest GPT release notes.", priority: "medium" },
  ];
  for (const s of seeds) {
    const t: EmployeeTask = {
      id: uid("task"),
      employee: s.employee,
      title: s.title,
      description: s.description,
      priority: s.priority ?? "medium",
      status: Math.random() > 0.7 ? "completed" : Math.random() > 0.5 ? "working" : "queued",
      requiresApproval: s.requiresApproval ?? false,
      createdAt: new Date(Date.now() - Math.random() * 5 * 86400000).toISOString(),
      updatedAt: isoNow(),
      hoursSaved: HOURS_PER_TASK[s.priority ?? "medium"],
      origin: "manual",
    };
    if (t.status === "completed") t.completedAt = t.updatedAt;
    store.tasks.push(t);
  }
  // Some baseline activity
  store.activity.unshift({
    id: uid("act"),
    timestamp: isoNow(),
    employee: "coo",
    kind: "briefing",
    message: "AI COO onboarded your Digital Employee team. 13 specialists ready.",
  });
  for (const slug of DIGITAL_EMPLOYEES.map((e) => e.slug)) {
    recalcEmployee(store, slug);
  }
  store.seededAt = isoNow();
  return store;
}
