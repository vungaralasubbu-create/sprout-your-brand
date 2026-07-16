// Client-side storage for AIOS conversations, prompts, feedback.
import { useEffect, useState, useCallback } from "react";

const KEY_CONVOS = "glintr.aios.conversations.v1";
const KEY_PROMPTS = "glintr.aios.prompts.v1";
const KEY_FEEDBACK = "glintr.aios.feedback.v1";

export type AiosMessage = { role: "user" | "assistant"; content: string; at: number };
export type AiosConversation = {
  id: string;
  agentId: string;
  title: string;
  messages: AiosMessage[];
  pinned: boolean;
  bookmarks: number[];
  createdAt: number;
  updatedAt: number;
};

export type PromptTemplate = {
  id: string;
  title: string;
  body: string;
  category: "learning" | "career" | "sales" | "marketing" | "content" | "support" | "administration";
  agentId?: string;
  version: number;
  updatedAt: number;
};

export type FeedbackEntry = {
  id: string;
  agentId: string;
  conversationId: string;
  messageIndex: number;
  rating: "helpful" | "not_helpful" | "needs_improvement";
  note?: string;
  at: number;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function write<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

export function useConversations() {
  const [items, setItems] = useState<AiosConversation[]>([]);
  useEffect(() => { setItems(read<AiosConversation[]>(KEY_CONVOS, [])); }, []);
  const persist = (next: AiosConversation[]) => { setItems(next); write(KEY_CONVOS, next); };

  const create = useCallback((agentId: string, title = "New conversation") => {
    const c: AiosConversation = {
      id: uid(), agentId, title, messages: [], pinned: false, bookmarks: [],
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    const next = [c, ...read<AiosConversation[]>(KEY_CONVOS, [])];
    persist(next);
    return c;
  }, []);

  const update = useCallback((id: string, patch: Partial<AiosConversation>) => {
    const next = read<AiosConversation[]>(KEY_CONVOS, []).map((c) =>
      c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c,
    );
    persist(next);
  }, []);

  const append = useCallback((id: string, msg: AiosMessage) => {
    const next = read<AiosConversation[]>(KEY_CONVOS, []).map((c) =>
      c.id === id ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() } : c,
    );
    persist(next);
  }, []);

  const remove = useCallback((id: string) => {
    persist(read<AiosConversation[]>(KEY_CONVOS, []).filter((c) => c.id !== id));
  }, []);

  return { items, create, update, append, remove };
}

export function usePrompts() {
  const [items, setItems] = useState<PromptTemplate[]>([]);
  useEffect(() => { setItems(read<PromptTemplate[]>(KEY_PROMPTS, DEFAULT_PROMPTS)); }, []);
  const persist = (next: PromptTemplate[]) => { setItems(next); write(KEY_PROMPTS, next); };

  const save = useCallback((p: Omit<PromptTemplate, "id" | "version" | "updatedAt"> & { id?: string }) => {
    const all = read<PromptTemplate[]>(KEY_PROMPTS, DEFAULT_PROMPTS);
    if (p.id) {
      const next = all.map((x) => x.id === p.id ? { ...x, ...p, version: x.version + 1, updatedAt: Date.now() } : x);
      persist(next);
      return next.find((x) => x.id === p.id)!;
    }
    const created: PromptTemplate = { ...p, id: uid(), version: 1, updatedAt: Date.now() };
    persist([created, ...all]);
    return created;
  }, []);

  const remove = useCallback((id: string) => {
    persist(read<PromptTemplate[]>(KEY_PROMPTS, DEFAULT_PROMPTS).filter((x) => x.id !== id));
  }, []);

  return { items, save, remove };
}

export function useFeedback() {
  const [items, setItems] = useState<FeedbackEntry[]>([]);
  useEffect(() => { setItems(read<FeedbackEntry[]>(KEY_FEEDBACK, [])); }, []);
  const submit = useCallback((f: Omit<FeedbackEntry, "id" | "at">) => {
    const created: FeedbackEntry = { ...f, id: uid(), at: Date.now() };
    const next = [created, ...read<FeedbackEntry[]>(KEY_FEEDBACK, [])];
    write(KEY_FEEDBACK, next);
    setItems(next);
    return created;
  }, []);
  return { items, submit };
}

const DEFAULT_PROMPTS: PromptTemplate[] = [
  { id: "p-l1", title: "Explain like I'm new", body: "Explain {topic} in plain English with a short example.", category: "learning", agentId: "learning-mentor", version: 1, updatedAt: Date.now() },
  { id: "p-l2", title: "4-week study plan", body: "Create a 4-week study plan for {topic}. Include weekly goals and one project.", category: "learning", agentId: "learning-mentor", version: 1, updatedAt: Date.now() },
  { id: "p-c1", title: "Career skill map", body: "List the top 8 skills needed for a {role} and how to learn each on Glintr.", category: "career", agentId: "career-coach", version: 1, updatedAt: Date.now() },
  { id: "p-s1", title: "Lead reply", body: "Draft a warm, professional WhatsApp reply for a lead interested in {program}. No income guarantees.", category: "sales", agentId: "sales-assistant", version: 1, updatedAt: Date.now() },
  { id: "p-m1", title: "LinkedIn 5-pack", body: "Write 5 LinkedIn posts promoting {program}. Different angles, no hype.", category: "marketing", agentId: "marketing-assistant", version: 1, updatedAt: Date.now() },
  { id: "p-ct1", title: "Article outline", body: "Outline a 1500-word Learn guide on {topic}. Include H2s, FAQs and internal-link ideas.", category: "content", agentId: "content-assistant", version: 1, updatedAt: Date.now() },
  { id: "p-sp1", title: "Refund FAQ", body: "Answer this support question from public policy pages only: {question}", category: "support", agentId: "support-assistant", version: 1, updatedAt: Date.now() },
  { id: "p-a1", title: "Ops summary", body: "Summarize the pasted admin report in 5 bullets. Flag anomalies. Data:\n{report}", category: "administration", agentId: "administrator-assistant", version: 1, updatedAt: Date.now() },
];
