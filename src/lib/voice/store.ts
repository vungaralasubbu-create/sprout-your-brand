// Local-first voice session storage. All data stays in the user's browser.
import { useEffect, useState, useCallback } from "react";
import type { VoiceModeId } from "./modes";

export type VoiceTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
};

export type VoiceSession = {
  id: string;
  mode: VoiceModeId;
  title: string;
  createdAt: number;
  updatedAt: number;
  turns: VoiceTurn[];
  bookmarks: string[]; // turn ids
  summary?: string;
  language?: string;
};

export type VoiceSettings = {
  speed: number; // 0.75 - 1.5
  voice: string; // override
  autoTranscript: boolean;
  autoSaveNotes: boolean;
  subtitleSize: "sm" | "md" | "lg";
  language: string;
};

const SESSIONS_KEY = "glintr.voice.sessions.v1";
const SETTINGS_KEY = "glintr.voice.settings.v1";

const DEFAULT_SETTINGS: VoiceSettings = {
  speed: 1,
  voice: "alloy",
  autoTranscript: true,
  autoSaveNotes: false,
  subtitleSize: "md",
  language: "en",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* quota */
  }
}

export function listSessions(): VoiceSession[] {
  return read<VoiceSession[]>(SESSIONS_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSession(id: string): VoiceSession | undefined {
  return listSessions().find((s) => s.id === id);
}

export function saveSession(s: VoiceSession) {
  const all = read<VoiceSession[]>(SESSIONS_KEY, []);
  const idx = all.findIndex((x) => x.id === s.id);
  const next = { ...s, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  write(SESSIONS_KEY, all);
}

export function deleteSession(id: string) {
  write(
    SESSIONS_KEY,
    read<VoiceSession[]>(SESSIONS_KEY, []).filter((s) => s.id !== id),
  );
}

export function createSession(mode: VoiceModeId, title: string): VoiceSession {
  const s: VoiceSession = {
    id: `vs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    mode,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    turns: [],
    bookmarks: [],
  };
  saveSession(s);
  return s;
}

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setSettings(read<VoiceSettings>(SETTINGS_KEY, DEFAULT_SETTINGS));
  }, []);
  const update = useCallback((patch: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      write(SETTINGS_KEY, next);
      return next;
    });
  }, []);
  return { settings, update };
}

export function useVoiceSessions() {
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const refresh = useCallback(() => setSessions(listSessions()), []);
  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSIONS_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);
  return { sessions, refresh };
}
