// Client-side storage for the White Label OS workspace.
// Persists brand config, wizard progress, courses selection, students, team, tickets.
const KEY = "glintr.brand-os.v1";

export type BrandConfig = {
  businessName: string;
  brandName: string;
  tagline: string;
  logoDataUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: "Inter" | "Manrope" | "Space Grotesk" | "Playfair";
  buttonStyle: "rounded" | "square" | "pill";
  domain: string;
  subdomain: string;
  sslStatus: "pending" | "issued" | "failed";
  published: boolean;
};

export type CourseFlag = { id: string; enabled: boolean; featured: boolean; category: string };

export type LmsSettings = {
  visibility: "public" | "enrolled" | "invite";
  certificates: boolean;
  autoEnroll: boolean;
  allowDiscussions: boolean;
  emailFromName: string;
  emailFromAddr: string;
  brandEmails: boolean;
  notifyEnroll: boolean;
  notifyCompletion: boolean;
};

export type Student = {
  id: string; name: string; email: string; program: string; progress: number;
  status: "active" | "completed" | "paused"; enrolledAt: string;
};

export type Faculty = {
  id: string; name: string; email: string; programs: string[]; role: "instructor" | "mentor" | "author";
};

export type TeamMember = {
  id: string; name: string; email: string;
  role: "owner" | "admin" | "manager" | "faculty" | "support" | "marketing";
};

export type Ticket = {
  id: string; subject: string; category: string; status: "open" | "pending" | "resolved";
  createdAt: string; lastReply?: string;
};

export type SecuritySettings = {
  twoFactor: boolean;
  passwordAgeDays: number;
  auditRetention: number;
  apiKeys: { id: string; label: string; created: string; last4: string }[];
  sessions: { id: string; device: string; ip: string; lastActive: string }[];
};

export type BrandState = {
  config: BrandConfig;
  wizardStep: number;
  wizardComplete: boolean;
  courses: Record<string, CourseFlag>;
  categories: { id: string; label: string; order: number }[];
  lms: LmsSettings;
  students: Student[];
  faculty: Faculty[];
  team: TeamMember[];
  tickets: Ticket[];
  security: SecuritySettings;
  billing: {
    plan: "starter" | "growth" | "scale" | "enterprise";
    seats: number;
    storageGb: number;
    renewsOn: string;
    invoices: { id: string; date: string; amount: number; status: "paid" | "pending" }[];
  };
  pages: Record<string, { title: string; body: string; published: boolean }>;
};

const DEFAULT: BrandState = {
  config: {
    businessName: "",
    brandName: "Your Academy",
    tagline: "Learn. Build. Grow.",
    logoDataUrl: null,
    primaryColor: "#0ea5e9",
    secondaryColor: "#84cc16",
    fontFamily: "Inter",
    buttonStyle: "rounded",
    domain: "",
    subdomain: "academy",
    sslStatus: "pending",
    published: false,
  },
  wizardStep: 1,
  wizardComplete: false,
  courses: {},
  categories: [
    { id: "ai", label: "AI & Data", order: 0 },
    { id: "management", label: "Management", order: 1 },
    { id: "engineering", label: "Engineering", order: 2 },
    { id: "freelancing", label: "Freelancing", order: 3 },
  ],
  lms: {
    visibility: "enrolled",
    certificates: true,
    autoEnroll: false,
    allowDiscussions: true,
    emailFromName: "",
    emailFromAddr: "",
    brandEmails: true,
    notifyEnroll: true,
    notifyCompletion: true,
  },
  students: seedStudents(),
  faculty: seedFaculty(),
  team: [
    { id: "u1", name: "You", email: "owner@brand.com", role: "owner" },
  ],
  tickets: [
    { id: "t1", subject: "Domain not verifying", category: "Domain", status: "open", createdAt: iso(-2) },
    { id: "t2", subject: "Certificate template feedback", category: "Certificates", status: "pending", createdAt: iso(-5) },
  ],
  security: {
    twoFactor: false,
    passwordAgeDays: 90,
    auditRetention: 180,
    apiKeys: [{ id: "k1", label: "Production API", created: iso(-30), last4: "9F4A" }],
    sessions: [{ id: "s1", device: "MacBook · Chrome", ip: "203.0.113.5", lastActive: iso(0) }],
  },
  billing: {
    plan: "growth",
    seats: 5,
    storageGb: 20,
    renewsOn: iso(20),
    invoices: [
      { id: "INV-2041", date: iso(-30), amount: 24000, status: "paid" },
      { id: "INV-2042", date: iso(-1), amount: 24000, status: "pending" },
    ],
  },
  pages: {
    home: { title: "Home", body: "Welcome to your academy.", published: true },
    about: { title: "About", body: "Our story.", published: true },
    programs: { title: "Programs", body: "Explore programs.", published: true },
    contact: { title: "Contact", body: "Get in touch.", published: true },
    blog: { title: "Blog", body: "Latest posts.", published: false },
  },
};

function iso(daysOffset: number) {
  const d = new Date(); d.setDate(d.getDate() + daysOffset); return d.toISOString();
}

function seedStudents(): Student[] {
  const names = ["Aarav Sharma", "Diya Patel", "Rohan Iyer", "Ishita Rao", "Kabir Malhotra", "Ananya Nair", "Vivaan Gupta", "Mira Sen"];
  const progs = ["ChatGPT Mastery", "Claude for Analysts", "Gemini Pro", "AI for Freelancers"];
  return names.map((n, i) => ({
    id: `s${i + 1}`, name: n, email: n.toLowerCase().replace(/\s+/g, ".") + "@student.dev",
    program: progs[i % progs.length], progress: Math.round((i * 13 + 22) % 100),
    status: (i % 5 === 0 ? "completed" : i % 4 === 0 ? "paused" : "active") as Student["status"],
    enrolledAt: iso(-((i + 1) * 6)),
  }));
}

function seedFaculty(): Faculty[] {
  return [
    { id: "f1", name: "Dr. Neha Kapoor", email: "neha@brand.com", programs: ["ChatGPT Mastery"], role: "instructor" },
    { id: "f2", name: "Arjun Menon", email: "arjun@brand.com", programs: ["Claude for Analysts", "Gemini Pro"], role: "mentor" },
    { id: "f3", name: "Priya Shetty", email: "priya@brand.com", programs: ["AI for Freelancers"], role: "author" },
  ];
}

export function loadState(): BrandState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) } as BrandState;
  } catch { return DEFAULT; }
}

export function saveState(state: BrandState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("brand-os:update"));
}

export function updateState(mutator: (s: BrandState) => void) {
  const s = loadState();
  mutator(s);
  saveState(s);
  return s;
}

export function useBrandState(): [BrandState, (m: (s: BrandState) => void) => void] {
  const { useSyncExternalStore, useCallback } = require("react") as typeof import("react");
  const subscribe = useCallback((cb: () => void) => {
    const h = () => cb();
    window.addEventListener("brand-os:update", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("brand-os:update", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  const snap = useSyncExternalStore(subscribe, () => JSON.stringify(loadState()), () => JSON.stringify(DEFAULT));
  const state = JSON.parse(snap) as BrandState;
  return [state, updateState];
}
