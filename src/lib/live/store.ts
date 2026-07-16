// Local-first live-class state. Notes, chat drafts, questions, quizzes, attendance.
import { useCallback, useEffect, useState } from "react";

export type LiveNote = { id: string; text: string; ts: number; timestamp?: number };
export type LiveQuestion = {
  id: string;
  author: string;
  text: string;
  ts: number;
  upvotes: number;
  status: "open" | "answered-instructor" | "answered-ai" | "pinned" | "later";
  answer?: string;
};
export type LiveChatMsg = {
  id: string;
  author: string;
  role: "student" | "instructor" | "ai" | "system";
  text: string;
  ts: number;
  pinned?: boolean;
  reactions?: Record<string, number>;
};
export type LiveQuizAnswer = { qIndex: number; choice: number; correct: boolean };
export type LiveAttendance = { joinedAt?: number; leftAt?: number; participationScore: number };

export type LiveState = {
  notes: LiveNote[];
  questions: LiveQuestion[];
  chat: LiveChatMsg[];
  quizAnswers: LiveQuizAnswer[];
  attendance: LiveAttendance;
  scheduled: string[]; // classIds saved to "My Schedule"
};

const KEY = "glintr.live.v1";

function empty(): LiveState {
  return {
    notes: [],
    questions: [],
    chat: [],
    quizAnswers: [],
    attendance: { participationScore: 0 },
    scheduled: [],
  };
}

type Store = Record<string, LiveState> & { __scheduled?: string[] };

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function save(store: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("glintr.live.change"));
  } catch {}
}

export function useLiveState(classId: string) {
  const [state, setState] = useState<LiveState>(empty);

  useEffect(() => {
    const sync = () => {
      const s = load();
      setState(s[classId] ?? empty());
    };
    sync();
    window.addEventListener("glintr.live.change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("glintr.live.change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [classId]);

  const update = useCallback(
    (mut: (prev: LiveState) => LiveState) => {
      const store = load();
      const next = mut(store[classId] ?? empty());
      store[classId] = next;
      save(store);
      setState(next);
    },
    [classId],
  );

  return [state, update] as const;
}

export function useScheduled() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => {
      const s = load();
      setIds(s.__scheduled ?? []);
    };
    sync();
    window.addEventListener("glintr.live.change", sync);
    return () => window.removeEventListener("glintr.live.change", sync);
  }, []);

  const toggle = useCallback((id: string) => {
    const s = load();
    const cur = s.__scheduled ?? [];
    s.__scheduled = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    save(s);
    setIds(s.__scheduled);
  }, []);

  return { ids, toggle };
}

export const uid = () => Math.random().toString(36).slice(2, 10);
