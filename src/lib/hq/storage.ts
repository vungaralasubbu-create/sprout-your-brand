/**
 * Glintr HQ — local-first storage for the unified workspace.
 * Client-only, per-user namespace via localStorage.
 */

export interface HqTask {
  id: string;
  title: string;
  done: boolean;
  due?: string; // ISO
  createdAt: string;
}
export interface HqNote {
  id: string;
  title: string;
  body: string; // markdown-ish
  updatedAt: string;
}
export interface HqEvent {
  id: string;
  title: string;
  when: string; // ISO
  kind: "class" | "meeting" | "call" | "deadline" | "event";
}
export interface HqPinned {
  id: string;
  label: string;
  to: string;
}
export interface HqDoc {
  id: string;
  name: string;
  kind: "contract" | "certificate" | "brochure" | "deck" | "asset" | "pdf";
  url?: string;
  addedAt: string;
}
export interface HqNotification {
  id: string;
  title: string;
  body?: string;
  at: string;
  read: boolean;
  kind:
    | "student"
    | "lead"
    | "payment"
    | "certificate"
    | "course"
    | "support"
    | "system";
}
export interface HqWidgetPrefs {
  hidden: string[];
  order: string[];
}

const NS = "glintr:hq:v1";
const key = (k: string) => `${NS}:${k}`;

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key(k));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(k), JSON.stringify(v));
  } catch {
    /* quota */
  }
}

export const hqStore = {
  tasks: {
    list: () => read<HqTask[]>("tasks", []),
    save: (v: HqTask[]) => write("tasks", v),
  },
  notes: {
    list: () => read<HqNote[]>("notes", []),
    save: (v: HqNote[]) => write("notes", v),
  },
  events: {
    list: () => read<HqEvent[]>("events", []),
    save: (v: HqEvent[]) => write("events", v),
  },
  pinned: {
    list: () => read<HqPinned[]>("pinned", []),
    save: (v: HqPinned[]) => write("pinned", v),
  },
  docs: {
    list: () => read<HqDoc[]>("docs", []),
    save: (v: HqDoc[]) => write("docs", v),
  },
  notifications: {
    list: () => read<HqNotification[]>("notifications", []),
    save: (v: HqNotification[]) => write("notifications", v),
  },
  recent: {
    list: () => read<HqPinned[]>("recent", []),
    push: (item: HqPinned) => {
      const cur = read<HqPinned[]>("recent", []).filter((x) => x.to !== item.to);
      cur.unshift(item);
      write("recent", cur.slice(0, 8));
    },
  },
  prefs: {
    get: () =>
      read<HqWidgetPrefs>("prefs", { hidden: [], order: [] }),
    save: (v: HqWidgetPrefs) => write("prefs", v),
  },
};

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function seedIfEmpty() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(key("_seeded"))) {
    const now = new Date();
    const iso = (d: Date) => d.toISOString();
    const plus = (h: number) => {
      const d = new Date(now);
      d.setHours(d.getHours() + h);
      return iso(d);
    };
    hqStore.tasks.save([
      { id: uid(), title: "Review today's admissions funnel", done: false, due: plus(3), createdAt: iso(now) },
      { id: uid(), title: "Approve weekly marketing calendar", done: false, due: plus(6), createdAt: iso(now) },
      { id: uid(), title: "Reply to pending support tickets", done: true, createdAt: iso(now) },
    ]);
    hqStore.events.save([
      { id: uid(), title: "Sales standup", when: plus(1), kind: "meeting" },
      { id: uid(), title: "Cohort live class · AI Foundations", when: plus(4), kind: "class" },
      { id: uid(), title: "Payout cutoff", when: plus(20), kind: "deadline" },
    ]);
    hqStore.notifications.save([
      { id: uid(), title: "New student joined", body: "Aarav enrolled in ChatGPT Mastery", at: iso(now), read: false, kind: "student" },
      { id: uid(), title: "Lead assigned", body: "Priya · warm · Bangalore", at: iso(now), read: false, kind: "lead" },
      { id: uid(), title: "Payment received", body: "₹18,000 · Order #GX-1042", at: iso(now), read: false, kind: "payment" },
      { id: uid(), title: "Certificate issued", body: "Rohan · Sales Mastery", at: iso(now), read: true, kind: "certificate" },
    ]);
    hqStore.notes.save([
      { id: uid(), title: "Welcome to your HQ", body: "This is your workspace. Capture ideas, tasks, and links here.\n\n- [ ] Try the ⌘K palette\n- [ ] Pin your favorite modules\n- [ ] Ask GlintrAI for suggestions", updatedAt: iso(now) },
    ]);
    localStorage.setItem(key("_seeded"), "1");
  }
}
