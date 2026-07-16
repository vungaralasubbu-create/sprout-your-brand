/**
 * Client-side intent detection + anonymous event tracking for Glintr CRO.
 *
 * All state lives in sessionStorage (per-tab, no cross-session tracking).
 * No PII, no fingerprinting. Safe on SSR (guards for `window`).
 */

import { useEffect, useState } from "react";

export type Intent =
  | "ai-learner"
  | "sales-partner"
  | "wl-owner"
  | "researcher"
  | "healthcare"
  | "management"
  | "engineering"
  | "unknown";

const STORAGE_KEY = "glintr_intent_v1";
const EVENTS_KEY = "glintr_events_v1";
const EXIT_KEY = "glintr_exit_shown_v1";

interface IntentState {
  path: string[]; // last ~20 unique paths visited
  scores: Partial<Record<Intent, number>>;
  lastAt: number;
}

const isBrowser = () => typeof window !== "undefined";

function readState(): IntentState {
  if (!isBrowser()) return { path: [], scores: {}, lastAt: 0 };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { path: [], scores: {}, lastAt: 0 };
    return JSON.parse(raw) as IntentState;
  } catch {
    return { path: [], scores: {}, lastAt: 0 };
  }
}

function writeState(s: IntentState) {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}

const RULES: { match: (p: string) => boolean; bump: Partial<Record<Intent, number>> }[] = [
  { match: (p) => /\/programs\/(computer-science|.*)\/(chatgpt|claude|gemini|artificial-intelligence|machine-learning|data-science|generative-ai)/i.test(p), bump: { "ai-learner": 3 } },
  { match: (p) => /\/programs\/computer-science/i.test(p), bump: { "ai-learner": 2, engineering: 1 } },
  { match: (p) => /\/programs\/electronics/i.test(p), bump: { engineering: 3 } },
  { match: (p) => /\/programs\/mechanical/i.test(p), bump: { engineering: 3 } },
  { match: (p) => /\/programs\/management/i.test(p), bump: { management: 3 } },
  { match: (p) => /medical-coding|healthcare/i.test(p), bump: { healthcare: 3 } },
  { match: (p) => /(70-revenue|50-supported|income-calculator|payout|\/earn)/i.test(p), bump: { "sales-partner": 3 } },
  { match: (p) => /(white-label|launch-your-brand|brand-setup|lms|marketing-support|book-consultation)/i.test(p), bump: { "wl-owner": 3 } },
  { match: (p) => /\/blog(\/|$)/i.test(p), bump: { researcher: 2 } },
  { match: (p) => /\/(glossary|learning-paths|compare|career-maps|knowledge-graph)/i.test(p), bump: { researcher: 2 } },
];

export function recordVisit(path: string) {
  if (!isBrowser()) return;
  const s = readState();
  if (s.path[s.path.length - 1] !== path) {
    s.path = [...s.path, path].slice(-20);
  }
  for (const r of RULES) {
    if (r.match(path)) {
      for (const [k, v] of Object.entries(r.bump)) {
        s.scores[k as Intent] = (s.scores[k as Intent] ?? 0) + (v ?? 0);
      }
    }
  }
  s.lastAt = Date.now();
  writeState(s);
}

export function getIntent(): Intent {
  const s = readState();
  const entries = Object.entries(s.scores) as [Intent, number][];
  if (!entries.length) return "unknown";
  entries.sort((a, b) => b[1] - a[1]);
  const [top, score] = entries[0];
  if (score < 2) return "unknown";
  return top;
}

export function useIntent(): Intent {
  const [intent, setIntent] = useState<Intent>("unknown");
  useEffect(() => {
    setIntent(getIntent());
    const onFocus = () => setIntent(getIntent());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  return intent;
}

// ---------- Anonymous event log (session only) ----------

export type GlintrEvent =
  | "program_viewed"
  | "quiz_started"
  | "quiz_completed"
  | "revenue_calculator_used"
  | "consultation_clicked"
  | "comparison_opened"
  | "blog_read"
  | "program_recommended"
  | "sticky_cta_clicked"
  | "exit_intent_shown"
  | "exit_intent_action"
  | "ai_help_opened"
  | "mentor_opened"
  | "mentor_message_sent";

export function track(event: GlintrEvent, meta?: Record<string, string | number | boolean>) {
  if (!isBrowser()) return;
  try {
    const raw = sessionStorage.getItem(EVENTS_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ e: event, t: Date.now(), ...meta });
    sessionStorage.setItem(EVENTS_KEY, JSON.stringify(list.slice(-100)));
  } catch {
    /* ignore */
  }
}

// ---------- Personalized CTA resolver ----------

export interface CTAResolved {
  label: string;
  to: string;
  intent: Intent;
}

export function ctaForPath(path: string, intent: Intent = "unknown"): CTAResolved {
  if (/\/programs\/[^/]+\/[^/]+/.test(path)) {
    return { label: "Apply to this program", to: "#apply", intent };
  }
  if (/\/programs\/[^/]+$/.test(path)) {
    return { label: "Find your best program", to: "/find-your-program", intent };
  }
  if (path.startsWith("/programs")) {
    return { label: "Find your best program", to: "/find-your-program", intent };
  }
  if (/(70-revenue|50-supported|payout|\/earn|sales-opportunity)/.test(path)) {
    return { label: "Calculate your revenue share", to: "/income-calculator", intent };
  }
  if (/income-calculator/.test(path)) {
    return { label: "Become a sales partner", to: "/partner/apply", intent };
  }
  if (/(white-label|launch-your-brand|brand-setup|lms|marketing-support)/.test(path)) {
    return { label: "Book brand consultation", to: "/book-consultation", intent };
  }
  if (/\/blog\/.+/.test(path)) {
    return { label: "Explore related programs", to: "/programs", intent };
  }
  if (/\/blog$/.test(path)) {
    return { label: "Find your best program", to: "/find-your-program", intent };
  }
  if (/\/(glossary|learning-paths|compare|career-maps|knowledge-graph)/.test(path)) {
    return { label: "Find your best program", to: "/find-your-program", intent };
  }
  // Home / other: personalize by intent
  switch (intent) {
    case "ai-learner":
      return { label: "Explore AI learning path", to: "/learning-paths/ai-foundations", intent };
    case "sales-partner":
      return { label: "See revenue models", to: "/earn", intent };
    case "wl-owner":
      return { label: "Book brand consultation", to: "/book-consultation", intent };
    case "healthcare":
      return { label: "Explore medical coding", to: "/programs/management/medical-coding", intent };
    case "researcher":
      return { label: "Find your best program", to: "/find-your-program", intent };
    default:
      return { label: "Find your best program", to: "/find-your-program", intent };
  }
}

// ---------- Exit intent (once per session) ----------

export function markExitShown() {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(EXIT_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function wasExitShown(): boolean {
  if (!isBrowser()) return true;
  try {
    return sessionStorage.getItem(EXIT_KEY) === "1";
  } catch {
    return true;
  }
}
