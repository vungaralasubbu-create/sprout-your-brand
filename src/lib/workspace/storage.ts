// Glintr Learning Workspace — client-side persistence for personal state.
// All keys are namespaced under `glintr_ws_*_v1`.
// Everything runs on localStorage; no server sync (privacy-first, offline-friendly).

import { useCallback, useEffect, useState } from "react";

type Kind = "program" | "blog" | "glossary" | "path" | "tool" | "compare" | "roadmap" | "other";

/* ============================ Generic helpers ============================ */

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // notify same-tab subscribers
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch {
    /* quota */
  }
}
function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    setValue(read<T>(key, initial));
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) setValue(read<T>(key, initial));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
        write(key, next);
        return next;
      });
    },
    [key],
  );
  return [value, set] as const;
}

/* ============================ Weekly goals ============================ */

export interface WeeklyGoal {
  id: string;
  label: string;
  target: number;
  metric: "articles" | "modules" | "glossary" | "roadmap-steps" | "custom";
  done: number;
}
const GOALS_KEY = "glintr_ws_goals_v1";
const DEFAULT_GOALS: WeeklyGoal[] = [
  { id: "g1", label: "Read 3 articles", target: 3, metric: "articles", done: 0 },
  { id: "g2", label: "Explore 2 glossary topics", target: 2, metric: "glossary", done: 0 },
  { id: "g3", label: "Finish 1 roadmap stage", target: 1, metric: "roadmap-steps", done: 0 },
];
export function useWeeklyGoals() {
  const [goals, setGoals] = usePersisted<WeeklyGoal[]>(GOALS_KEY, DEFAULT_GOALS);
  return { goals, setGoals };
}
export function bumpGoalMetric(metric: WeeklyGoal["metric"], by = 1) {
  const list = read<WeeklyGoal[]>(GOALS_KEY, DEFAULT_GOALS);
  const next = list.map((g) =>
    g.metric === metric ? { ...g, done: Math.min(g.target, g.done + by) } : g,
  );
  write(GOALS_KEY, next);
}

/* ============================ Notes ============================ */

export interface Note {
  id: string;
  title: string;
  body: string; // markdown
  attachTo?: { href: string; label: string; kind: Kind };
  createdAt: number;
  updatedAt: number;
}
const NOTES_KEY = "glintr_ws_notes_v1";
export function useNotes() {
  const [notes, setNotes] = usePersisted<Note[]>(NOTES_KEY, []);
  const upsert = useCallback(
    (note: Partial<Note> & { id?: string; title: string; body: string }) => {
      setNotes((prev) => {
        const now = Date.now();
        if (note.id && prev.some((n) => n.id === note.id)) {
          return prev.map((n) =>
            n.id === note.id
              ? { ...n, ...note, id: note.id!, updatedAt: now }
              : n,
          );
        }
        const id = note.id ?? `n_${now}_${Math.random().toString(36).slice(2, 7)}`;
        return [{ ...note, id, createdAt: now, updatedAt: now } as Note, ...prev];
      });
    },
    [setNotes],
  );
  const remove = useCallback(
    (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id)),
    [setNotes],
  );
  return { notes, upsert, remove };
}

/* ============================ Activity timeline ============================ */

export type ActivityKind =
  | "view"
  | "bookmark"
  | "note"
  | "goal"
  | "roadmap"
  | "mentor"
  | "tool"
  | "streak"
  | "achievement";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  label: string;
  href?: string;
  at: number;
}
const ACTIVITY_KEY = "glintr_ws_activity_v1";
const ACTIVITY_LIMIT = 60;
export function trackActivity(evt: Omit<ActivityEvent, "id" | "at">) {
  const list = read<ActivityEvent[]>(ACTIVITY_KEY, []);
  const next = [
    { ...evt, id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, at: Date.now() },
    ...list,
  ].slice(0, ACTIVITY_LIMIT);
  write(ACTIVITY_KEY, next);
}
export function useActivity() {
  const [items] = usePersisted<ActivityEvent[]>(ACTIVITY_KEY, []);
  return items;
}

/* ============================ Learning streak ============================ */

interface StreakState {
  current: number;
  longest: number;
  lastDay: string | null; // YYYY-MM-DD
  history: string[]; // last 30 days seen
}
const STREAK_KEY = "glintr_ws_streak_v1";
const DEFAULT_STREAK: StreakState = { current: 0, longest: 0, lastDay: null, history: [] };

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function yesterdayIsoOf(dayIso: string) {
  const d = new Date(dayIso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function pingStreak() {
  if (typeof window === "undefined") return;
  const s = read<StreakState>(STREAK_KEY, DEFAULT_STREAK);
  const today = todayIso();
  if (s.lastDay === today) return;
  let current = 1;
  if (s.lastDay && yesterdayIsoOf(today) === s.lastDay) current = s.current + 1;
  const longest = Math.max(current, s.longest);
  const history = [...s.history.filter((d) => d !== today), today].slice(-30);
  write(STREAK_KEY, { current, longest, lastDay: today, history });
}
export function useStreak() {
  const [s] = usePersisted<StreakState>(STREAK_KEY, DEFAULT_STREAK);
  return s;
}

/* ============================ Roadmaps (saved paths) ============================ */

export interface SavedRoadmap {
  slug: string; // matches LEARNING_PATHS slug OR custom
  title: string;
  domain: string;
  totalSteps: number;
  completedSteps: number[]; // step indexes
  addedAt: number;
}
const ROADMAPS_KEY = "glintr_ws_roadmaps_v1";
export function useRoadmaps() {
  const [roadmaps, setRoadmaps] = usePersisted<SavedRoadmap[]>(ROADMAPS_KEY, []);
  const save = useCallback(
    (r: Omit<SavedRoadmap, "addedAt" | "completedSteps">) => {
      setRoadmaps((prev) => {
        if (prev.some((p) => p.slug === r.slug)) return prev;
        return [{ ...r, completedSteps: [], addedAt: Date.now() }, ...prev];
      });
    },
    [setRoadmaps],
  );
  const remove = useCallback(
    (slug: string) => setRoadmaps((prev) => prev.filter((p) => p.slug !== slug)),
    [setRoadmaps],
  );
  const toggleStep = useCallback(
    (slug: string, stepIndex: number) =>
      setRoadmaps((prev) =>
        prev.map((r) => {
          if (r.slug !== slug) return r;
          const has = r.completedSteps.includes(stepIndex);
          return {
            ...r,
            completedSteps: has
              ? r.completedSteps.filter((i) => i !== stepIndex)
              : [...r.completedSteps, stepIndex],
          };
        }),
      ),
    [setRoadmaps],
  );
  return { roadmaps, save, remove, toggleStep };
}

/* ============================ Planner ============================ */

export interface PlannerBlock {
  id: string;
  day: number; // 0=Mon .. 6=Sun
  hour: number; // 6..22
  title: string;
  kind: "study" | "read" | "practice" | "review";
}
const PLANNER_KEY = "glintr_ws_planner_v1";
export function usePlanner() {
  const [blocks, setBlocks] = usePersisted<PlannerBlock[]>(PLANNER_KEY, []);
  const upsert = useCallback(
    (b: Omit<PlannerBlock, "id"> & { id?: string }) => {
      setBlocks((prev) => {
        if (b.id && prev.some((p) => p.id === b.id))
          return prev.map((p) => (p.id === b.id ? ({ ...p, ...b, id: b.id! }) : p));
        return [
          ...prev,
          { ...b, id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` },
        ];
      });
    },
    [setBlocks],
  );
  const remove = useCallback(
    (id: string) => setBlocks((prev) => prev.filter((p) => p.id !== id)),
    [setBlocks],
  );
  return { blocks, upsert, remove };
}

/* ============================ Profile ============================ */

export interface WsProfile {
  displayName: string;
  focus: string; // primary learning focus
  interests: string[]; // category slugs / tag strings
  notifications: {
    weeklySummary: boolean;
    studyReminder: boolean;
    roadmapUpdates: boolean;
    newArticles: boolean;
  };
}
const PROFILE_KEY = "glintr_ws_profile_v1";
const DEFAULT_PROFILE: WsProfile = {
  displayName: "",
  focus: "",
  interests: [],
  notifications: {
    weeklySummary: true,
    studyReminder: true,
    roadmapUpdates: true,
    newArticles: false,
  },
};
export function useProfile() {
  const [profile, setProfile] = usePersisted<WsProfile>(PROFILE_KEY, DEFAULT_PROFILE);
  return { profile, setProfile };
}

/* ============================ Achievements ============================ */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: number | null;
}

export const ACHIEVEMENT_DEFS: Omit<Achievement, "unlockedAt">[] = [
  { id: "first-program", title: "First program explored", description: "You opened your first Glintr program page." },
  { id: "first-blog", title: "First article read", description: "You opened your first blog article." },
  { id: "ten-articles", title: "10 articles read", description: "You've read 10 or more articles." },
  { id: "first-path", title: "Roadmap saved", description: "You saved your first learning roadmap." },
  { id: "first-note", title: "First note captured", description: "You saved your first personal note." },
  { id: "streak-7", title: "7-day learning streak", description: "You returned to learn 7 days in a row." },
  { id: "first-tool", title: "First tool used", description: "You tried a Glintr AI tool." },
  { id: "explorer", title: "Curious explorer", description: "You visited five different knowledge areas." },
];
const ACH_KEY = "glintr_ws_achievements_v1";
export function useAchievements() {
  const [state] = usePersisted<Record<string, number>>(ACH_KEY, {});
  return ACHIEVEMENT_DEFS.map((d) => ({ ...d, unlockedAt: state[d.id] ?? null })) as Achievement[];
}
export function unlockAchievement(id: string) {
  if (typeof window === "undefined") return;
  const state = read<Record<string, number>>(ACH_KEY, {});
  if (state[id]) return;
  state[id] = Date.now();
  write(ACH_KEY, state);
  const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
  if (def) trackActivity({ kind: "achievement", label: `Unlocked: ${def.title}` });
}
