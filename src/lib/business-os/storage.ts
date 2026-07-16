// Client-side storage for Business OS extras: multi-brand, tasks, documents, settings.
// LocalStorage-only (persona/partner scope). Server persistence lives in existing
// partner tables; this file layers on the operating-system UX state.

const KEY = "glintr:business-os:v1";

export type BrandProfile = {
  id: string;
  name: string;
  slug: string;
  logoDataUrl?: string;
  color?: string;
  createdAt: string;
};

export type BusinessTask = {
  id: string;
  title: string;
  detail?: string;
  owner?: string;
  center: TaskCenter;
  status: "open" | "in_progress" | "done";
  priority: "low" | "med" | "high";
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  source: "manual" | "ai";
};

export type TaskCenter =
  | "operations" | "finance" | "marketing" | "sales" | "content"
  | "website" | "lms" | "communication" | "hr" | "analytics" | "general";

export type BusinessDocument = {
  id: string;
  name: string;
  kind: "certificate" | "invoice" | "agreement" | "marketing" | "training" | "brand" | "other";
  size?: number;
  url?: string;
  addedAt: string;
  tags?: string[];
};

export type BusinessSettings = {
  brandName: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  businessHours: string;
  address: string;
  gstNumber: string;
  paymentGateway: "razorpay" | "stripe" | "paddle" | "cashfree" | "none";
  domain: string;
  socials: { instagram: string; linkedin: string; youtube: string; facebook: string; x: string };
  legalPages: { privacy: boolean; terms: boolean; refund: boolean; cookies: boolean };
};

export type OsState = {
  activeBrandId: string;
  brands: BrandProfile[];
  tasks: BusinessTask[];
  documents: BusinessDocument[];
  settings: BusinessSettings;
};

const DEFAULT_BRAND: BrandProfile = {
  id: "default",
  name: "My Academy",
  slug: "my-academy",
  color: "#22d3ee",
  createdAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: BusinessSettings = {
  brandName: "My Academy",
  supportEmail: "support@myacademy.com",
  supportPhone: "+91 90000 00000",
  whatsappNumber: "+91 90000 00000",
  businessHours: "Mon–Sat · 10:00–19:00 IST",
  address: "",
  gstNumber: "",
  paymentGateway: "razorpay",
  domain: "",
  socials: { instagram: "", linkedin: "", youtube: "", facebook: "", x: "" },
  legalPages: { privacy: false, terms: false, refund: false, cookies: false },
};

const SEED_TASKS: BusinessTask[] = [
  { id: "t1", title: "Publish 2 blogs this week", center: "content", status: "open", priority: "med", source: "ai", createdAt: new Date().toISOString() },
  { id: "t2", title: "Follow up with 12 warm leads (>48h idle)", center: "sales", status: "open", priority: "high", source: "ai", createdAt: new Date().toISOString() },
  { id: "t3", title: "Approve 5 pending certificates", center: "operations", status: "open", priority: "med", source: "ai", createdAt: new Date().toISOString() },
  { id: "t4", title: "Fix 3 broken internal links on /programs", center: "website", status: "open", priority: "low", source: "ai", createdAt: new Date().toISOString() },
  { id: "t5", title: "Launch WhatsApp campaign for AI cohort", center: "marketing", status: "in_progress", priority: "high", source: "manual", createdAt: new Date().toISOString() },
];

function initialState(): OsState {
  return {
    activeBrandId: DEFAULT_BRAND.id,
    brands: [DEFAULT_BRAND],
    tasks: SEED_TASKS,
    documents: [],
    settings: DEFAULT_SETTINGS,
  };
}

export function loadOs(): OsState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<OsState>;
    return {
      ...initialState(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}), socials: { ...DEFAULT_SETTINGS.socials, ...(parsed.settings?.socials ?? {}) }, legalPages: { ...DEFAULT_SETTINGS.legalPages, ...(parsed.settings?.legalPages ?? {}) } },
    } as OsState;
  } catch {
    return initialState();
  }
}

export function saveOs(state: OsState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("glintr:os:update"));
}

export function updateOs(mutator: (s: OsState) => void): OsState {
  const next = loadOs();
  mutator(next);
  saveOs(next);
  return next;
}

export function activeBrand(state: OsState): BrandProfile {
  return state.brands.find((b) => b.id === state.activeBrandId) ?? state.brands[0] ?? DEFAULT_BRAND;
}

export function useOsListener(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("glintr:os:update", cb);
  return () => window.removeEventListener("glintr:os:update", cb);
}

/**
 * Compute a 0-100 business health score from KPI signals + task hygiene + settings completeness.
 * Deterministic — pure function so it can be memoised.
 */
export function computeHealthScore(input: {
  leadsMonth?: number;
  unreadMessages?: number;
  followUpsPending?: number;
  tasksOpen: number;
  tasksOverdue: number;
  settingsComplete: number; // 0..1
}): { score: number; band: "low" | "fair" | "good" | "excellent"; hints: string[] } {
  let score = 60;
  const hints: string[] = [];

  if ((input.leadsMonth ?? 0) > 20) score += 10;
  else if ((input.leadsMonth ?? 0) < 5) { score -= 8; hints.push("Lead volume is low — launch a campaign."); }

  if (input.followUpsPending && input.followUpsPending > 10) { score -= 8; hints.push("Follow-ups are piling up — batch them today."); }
  if (input.unreadMessages && input.unreadMessages > 5) { score -= 4; hints.push("Clear the inbox — response time affects conversion."); }

  if (input.tasksOverdue > 0) { score -= Math.min(15, input.tasksOverdue * 3); hints.push(`${input.tasksOverdue} overdue task${input.tasksOverdue === 1 ? "" : "s"} — resolve or reschedule.`); }
  if (input.tasksOpen > 15) { score -= 4; hints.push("Task backlog is large — delegate or archive stale items."); }

  score += Math.round(input.settingsComplete * 20);
  if (input.settingsComplete < 0.5) hints.push("Complete business settings (brand, support, gateway) to look production-ready.");

  score = Math.max(0, Math.min(100, score));
  const band: "low" | "fair" | "good" | "excellent" =
    score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "low";
  return { score, band, hints };
}

export function settingsCompleteness(s: BusinessSettings): number {
  const checks = [
    !!s.brandName, !!s.supportEmail, !!s.supportPhone, !!s.whatsappNumber,
    !!s.businessHours, !!s.address, !!s.gstNumber, !!s.domain,
    s.paymentGateway !== "none",
    !!s.socials.instagram || !!s.socials.linkedin,
    s.legalPages.privacy, s.legalPages.terms,
  ];
  return checks.filter(Boolean).length / checks.length;
}
