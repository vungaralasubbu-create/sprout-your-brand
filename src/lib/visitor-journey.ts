/**
 * Visitor Journey — client-side persistence + tracking for the
 * "Who are you?" discovery flow. Uses localStorage so a returning
 * visitor lands back on their personalized path.
 *
 * No PII. SSR-safe (guards for `window`).
 */

import { useEffect, useState } from "react";
import { track } from "@/lib/intent";

export type JourneyId =
  | "student"
  | "professional"
  | "company"
  | "partner"
  | "academy";

export interface JourneyProfile {
  id: JourneyId;
  // Student sub-profile
  branch?: string;
  year?: string;
  // Professional sub-profile
  currentRole?: string;
  currentExperience?: string;
  desiredRole?: string;
  targetSalary?: string;
  learningTime?: string;
  industry?: string;
  updatedAt: number;
}

const KEY = "glintr_journey_v1";

const isBrowser = () => typeof window !== "undefined";

export function getJourney(): JourneyProfile | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JourneyProfile;
  } catch {
    return null;
  }
}

export function setJourney(patch: Partial<JourneyProfile> & { id: JourneyId }) {
  if (!isBrowser()) return;
  const current = getJourney();
  const next: JourneyProfile = {
    ...(current ?? {}),
    ...patch,
    id: patch.id,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  track("journey_selected", { id: patch.id });
}

export function clearJourney() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** React hook — reactive read of the stored journey. */
export function useJourney(): JourneyProfile | null {
  const [state, setState] = useState<JourneyProfile | null>(null);
  useEffect(() => {
    setState(getJourney());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(getJourney());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return state;
}
