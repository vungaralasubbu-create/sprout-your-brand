// Glintr Workspace Hub — personal notebooks, highlights, flashcards, mastery,
// calendar, chats. Local-first (localStorage). Namespaced under `glintr_hub_*_v1`.
import { useCallback, useEffect, useState } from "react";

/* ---------------- generic ---------------- */
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
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch {
    /* quota */
  }
}
function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    setValue(read<T>(key, initial));
    const on = (e: StorageEvent) => {
      if (e.key === key || e.key === null) setValue(read<T>(key, initial));
    };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const setter = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        write(key, v);
        return v;
      });
    },
    [key],
  );
  return [value, setter] as const;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ---------------- types ---------------- */
export type SourceRef = {
  path?: string; // /programs/ai/chatgpt
  title?: string;
  kind?: "program" | "blog" | "glossary" | "learn" | "path" | "other";
};

export type Notebook = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  description?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  archived?: boolean;
};

export type NBNote = {
  id: string;
  notebookId: string;
  title: string;
  body: string; // markdown
  tags: string[];
  source?: SourceRef;
  createdAt: number;
  updatedAt: number;
};

export type Highlight = {
  id: string;
  notebookId?: string;
  text: string;
  comment?: string;
  tags: string[];
  source: SourceRef;
  color?: "yellow" | "green" | "cyan" | "pink";
  createdAt: number;
};

export type NBBookmark = {
  id: string;
  notebookId?: string;
  folder?: string;
  title: string;
  href: string;
  note?: string;
  tags: string[];
  createdAt: number;
};

export type Flashcard = {
  id: string;
  notebookId?: string;
  front: string;
  back: string;
  tags: string[];
  source?: SourceRef;
  difficulty: "easy" | "medium" | "hard" | "unset";
  reviewCount: number;
  lastReviewedAt?: number;
  nextReviewAt?: number;
  createdAt: number;
};

export type MasteryState = "read" | "reviewed" | "practiced" | "mastered" | "needs-revision";
export type ConceptMastery = {
  id: string; // stable key (e.g. glossary slug or path)
  label: string;
  state: MasteryState;
  source?: SourceRef;
  updatedAt: number;
};

export type CalendarEvent = {
  id: string;
  title: string;
  kind: "study" | "revision" | "goal" | "milestone" | "lesson";
  date: string; // yyyy-mm-dd
  time?: string; // hh:mm
  minutes?: number;
  notes?: string;
  linkedNotebookId?: string;
  createdAt: number;
  completedAt?: number;
};

export type ActivityEvent = {
  id: string;
  at: number;
  kind:
    | "view"
    | "note"
    | "highlight"
    | "bookmark"
    | "flashcard"
    | "chat"
    | "notebook"
    | "mastery"
    | "revision"
    | "export";
  label: string;
  href?: string;
};

export type ChatSession = {
  id: string;
  notebookId?: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string; at: number }[];
  createdAt: number;
  updatedAt: number;
};

export type DailyGoal = {
  date: string;
  minutes: number;
  target: number;
};

/* ---------------- keys ---------------- */
const K = {
  notebooks: "glintr_hub_notebooks_v1",
  notes: "glintr_hub_notes_v1",
  highlights: "glintr_hub_highlights_v1",
  bookmarks: "glintr_hub_bookmarks_v1",
  flashcards: "glintr_hub_flashcards_v1",
  mastery: "glintr_hub_mastery_v1",
  events: "glintr_hub_events_v1",
  activity: "glintr_hub_activity_v1",
  chats: "glintr_hub_chats_v1",
  goal: "glintr_hub_dailygoal_v1",
};

/* ---------------- notebooks ---------------- */
export function useNotebooks() {
  const [items, setItems] = usePersisted<Notebook[]>(K.notebooks, []);
  const create = useCallback(
    (input: Partial<Notebook> & { name: string }) => {
      const now = Date.now();
      const nb: Notebook = {
        id: uid(),
        name: input.name,
        emoji: input.emoji ?? "📘",
        color: input.color ?? "#22d3ee",
        description: input.description ?? "",
        tags: input.tags ?? [],
        createdAt: now,
        updatedAt: now,
      };
      setItems((prev) => [nb, ...prev]);
      pushActivity({ kind: "notebook", label: `Created notebook: ${nb.name}`, href: `/workspace/notebooks/${nb.id}` });
      return nb;
    },
    [setItems],
  );
  const update = useCallback(
    (id: string, patch: Partial<Notebook>) =>
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))),
    [setItems],
  );
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((n) => n.id !== id)), [setItems]);
  return { notebooks: items, create, update, remove };
}
export function getNotebook(id: string): Notebook | undefined {
  return read<Notebook[]>(K.notebooks, []).find((n) => n.id === id);
}

/* ---------------- notes ---------------- */
export function useNotes(notebookId?: string) {
  const [items, setItems] = usePersisted<NBNote[]>(K.notes, []);
  const filtered = notebookId ? items.filter((n) => n.notebookId === notebookId) : items;
  const upsert = useCallback(
    (input: Partial<NBNote> & { title: string; body: string; notebookId: string }) => {
      const now = Date.now();
      setItems((prev) => {
        if (input.id) {
          return prev.map((n) => (n.id === input.id ? { ...n, ...input, updatedAt: now } as NBNote : n));
        }
        const note: NBNote = {
          id: uid(),
          notebookId: input.notebookId,
          title: input.title,
          body: input.body,
          tags: input.tags ?? [],
          source: input.source,
          createdAt: now,
          updatedAt: now,
        };
        return [note, ...prev];
      });
      pushActivity({ kind: "note", label: `Saved note: ${input.title.slice(0, 60)}` });
    },
    [setItems],
  );
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((n) => n.id !== id)), [setItems]);
  return { notes: filtered, allNotes: items, upsert, remove };
}

/* ---------------- highlights ---------------- */
export function useHighlights(notebookId?: string) {
  const [items, setItems] = usePersisted<Highlight[]>(K.highlights, []);
  const filtered = notebookId ? items.filter((h) => h.notebookId === notebookId) : items;
  const add = useCallback(
    (input: Omit<Highlight, "id" | "createdAt">) => {
      const h: Highlight = { ...input, id: uid(), createdAt: Date.now() };
      setItems((prev) => [h, ...prev]);
      pushActivity({ kind: "highlight", label: `Highlight: ${h.text.slice(0, 60)}`, href: input.source.path });
      return h;
    },
    [setItems],
  );
  const update = useCallback(
    (id: string, patch: Partial<Highlight>) => setItems((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h))),
    [setItems],
  );
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((h) => h.id !== id)), [setItems]);
  return { highlights: filtered, allHighlights: items, add, update, remove };
}

/* ---------------- bookmarks (workspace layer, folders) ---------------- */
export function useHubBookmarks(notebookId?: string) {
  const [items, setItems] = usePersisted<NBBookmark[]>(K.bookmarks, []);
  const filtered = notebookId ? items.filter((b) => b.notebookId === notebookId) : items;
  const add = useCallback(
    (input: Omit<NBBookmark, "id" | "createdAt">) => {
      const b: NBBookmark = { ...input, id: uid(), createdAt: Date.now() };
      setItems((prev) => [b, ...prev]);
      pushActivity({ kind: "bookmark", label: `Bookmarked: ${b.title}`, href: b.href });
      return b;
    },
    [setItems],
  );
  const update = useCallback(
    (id: string, patch: Partial<NBBookmark>) => setItems((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    [setItems],
  );
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((b) => b.id !== id)), [setItems]);
  return { bookmarks: filtered, allBookmarks: items, add, update, remove };
}

/* ---------------- flashcards ---------------- */
export function useFlashcards(notebookId?: string) {
  const [items, setItems] = usePersisted<Flashcard[]>(K.flashcards, []);
  const filtered = notebookId ? items.filter((f) => f.notebookId === notebookId) : items;
  const addMany = useCallback(
    (
      cards: { front: string; back: string; tags?: string[] }[],
      opts: { notebookId?: string; source?: SourceRef } = {},
    ) => {
      const now = Date.now();
      const created: Flashcard[] = cards.map((c) => ({
        id: uid(),
        notebookId: opts.notebookId,
        front: c.front,
        back: c.back,
        tags: c.tags ?? [],
        source: opts.source,
        difficulty: "unset",
        reviewCount: 0,
        createdAt: now,
      }));
      setItems((prev) => [...created, ...prev]);
      pushActivity({ kind: "flashcard", label: `Added ${created.length} flashcards` });
      return created;
    },
    [setItems],
  );
  const update = useCallback(
    (id: string, patch: Partial<Flashcard>) => setItems((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f))),
    [setItems],
  );
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((f) => f.id !== id)), [setItems]);

  const review = useCallback(
    (id: string, difficulty: "easy" | "medium" | "hard") => {
      const now = Date.now();
      const daysAhead = difficulty === "easy" ? 7 : difficulty === "medium" ? 3 : 1;
      setItems((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                difficulty,
                reviewCount: f.reviewCount + 1,
                lastReviewedAt: now,
                nextReviewAt: now + daysAhead * 86_400_000,
              }
            : f,
        ),
      );
    },
    [setItems],
  );
  return { flashcards: filtered, allFlashcards: items, addMany, update, remove, review };
}

/* ---------------- mastery ---------------- */
export function useMastery() {
  const [items, setItems] = usePersisted<ConceptMastery[]>(K.mastery, []);
  const setState = useCallback(
    (id: string, label: string, state: MasteryState, source?: SourceRef) => {
      setItems((prev) => {
        const now = Date.now();
        const idx = prev.findIndex((m) => m.id === id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], label, state, source, updatedAt: now };
          return next;
        }
        return [{ id, label, state, source, updatedAt: now }, ...prev];
      });
      pushActivity({ kind: "mastery", label: `${label}: ${state}` });
    },
    [setItems],
  );
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((m) => m.id !== id)), [setItems]);
  return { mastery: items, setState, remove };
}

/* ---------------- calendar ---------------- */
export function useCalendar() {
  const [items, setItems] = usePersisted<CalendarEvent[]>(K.events, []);
  const add = useCallback(
    (input: Omit<CalendarEvent, "id" | "createdAt">) => {
      const e: CalendarEvent = { ...input, id: uid(), createdAt: Date.now() };
      setItems((prev) => [e, ...prev]);
      return e;
    },
    [setItems],
  );
  const update = useCallback(
    (id: string, patch: Partial<CalendarEvent>) => setItems((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [setItems],
  );
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((e) => e.id !== id)), [setItems]);
  const complete = useCallback(
    (id: string) => setItems((prev) => prev.map((e) => (e.id === id ? { ...e, completedAt: Date.now() } : e))),
    [setItems],
  );
  return { events: items, add, update, remove, complete };
}

/* ---------------- activity ---------------- */
export function pushActivity(input: Omit<ActivityEvent, "id" | "at">) {
  if (typeof window === "undefined") return;
  const list = read<ActivityEvent[]>(K.activity, []);
  const e: ActivityEvent = { ...input, id: uid(), at: Date.now() };
  const next = [e, ...list].slice(0, 300);
  write(K.activity, next);
}
export function useActivityFeed() {
  const [items] = usePersisted<ActivityEvent[]>(K.activity, []);
  return items;
}

/* ---------------- chats ---------------- */
export function useChats(notebookId?: string) {
  const [items, setItems] = usePersisted<ChatSession[]>(K.chats, []);
  const filtered = notebookId ? items.filter((c) => c.notebookId === notebookId) : items;
  const create = useCallback(
    (title: string, nb?: string) => {
      const now = Date.now();
      const c: ChatSession = { id: uid(), notebookId: nb, title, messages: [], createdAt: now, updatedAt: now };
      setItems((prev) => [c, ...prev]);
      return c;
    },
    [setItems],
  );
  const appendMessage = useCallback(
    (id: string, msg: { role: "user" | "assistant"; content: string }) => {
      const now = Date.now();
      setItems((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, messages: [...c.messages, { ...msg, at: now }], updatedAt: now }
            : c,
        ),
      );
      pushActivity({ kind: "chat", label: `AI chat: ${msg.content.slice(0, 60)}` });
    },
    [setItems],
  );
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((c) => c.id !== id)), [setItems]);
  return { chats: filtered, allChats: items, create, appendMessage, remove };
}

/* ---------------- daily goal ---------------- */
function today() {
  return new Date().toISOString().slice(0, 10);
}
export function useDailyGoal() {
  const [goal, setGoal] = usePersisted<DailyGoal>(K.goal, { date: today(), minutes: 0, target: 30 });
  useEffect(() => {
    if (goal.date !== today()) setGoal({ date: today(), minutes: 0, target: goal.target });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const addMinutes = useCallback(
    (m: number) =>
      setGoal((g) => ({ date: today(), minutes: (g.date === today() ? g.minutes : 0) + m, target: g.target })),
    [setGoal],
  );
  const setTarget = useCallback((t: number) => setGoal((g) => ({ ...g, target: Math.max(5, t) })), [setGoal]);
  return { goal, addMinutes, setTarget };
}

/* ---------------- export ---------------- */
export function exportAll(): string {
  if (typeof window === "undefined") return "";
  const data = {
    exportedAt: new Date().toISOString(),
    notebooks: read(K.notebooks, []),
    notes: read(K.notes, []),
    highlights: read(K.highlights, []),
    bookmarks: read(K.bookmarks, []),
    flashcards: read(K.flashcards, []),
    mastery: read(K.mastery, []),
    events: read(K.events, []),
    chats: read(K.chats, []),
  };
  return JSON.stringify(data, null, 2);
}

export function downloadFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- search across everything ---------------- */
export type SearchResult = {
  id: string;
  title: string;
  snippet: string;
  kind: "note" | "highlight" | "bookmark" | "flashcard" | "notebook" | "event" | "chat";
  href?: string;
};
export function useHubSearch(query: string): SearchResult[] {
  const [notebooks] = usePersisted<Notebook[]>(K.notebooks, []);
  const [notes] = usePersisted<NBNote[]>(K.notes, []);
  const [highlights] = usePersisted<Highlight[]>(K.highlights, []);
  const [bookmarks] = usePersisted<NBBookmark[]>(K.bookmarks, []);
  const [flashcards] = usePersisted<Flashcard[]>(K.flashcards, []);
  const [events] = usePersisted<CalendarEvent[]>(K.events, []);
  const [chats] = usePersisted<ChatSession[]>(K.chats, []);
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: SearchResult[] = [];
  const push = (r: SearchResult) => out.push(r);
  notebooks.forEach((n) => {
    if (`${n.name} ${n.description ?? ""}`.toLowerCase().includes(q))
      push({ id: n.id, title: n.name, snippet: n.description ?? "", kind: "notebook", href: `/workspace/notebooks/${n.id}` });
  });
  notes.forEach((n) => {
    if (`${n.title} ${n.body}`.toLowerCase().includes(q))
      push({ id: n.id, title: n.title, snippet: n.body.slice(0, 160), kind: "note", href: `/workspace/notebooks/${n.notebookId}` });
  });
  highlights.forEach((h) => {
    if (`${h.text} ${h.comment ?? ""}`.toLowerCase().includes(q))
      push({ id: h.id, title: h.source.title ?? "Highlight", snippet: h.text.slice(0, 160), kind: "highlight", href: h.source.path });
  });
  bookmarks.forEach((b) => {
    if (`${b.title} ${b.note ?? ""}`.toLowerCase().includes(q))
      push({ id: b.id, title: b.title, snippet: b.note ?? b.href, kind: "bookmark", href: b.href });
  });
  flashcards.forEach((f) => {
    if (`${f.front} ${f.back}`.toLowerCase().includes(q))
      push({ id: f.id, title: f.front, snippet: f.back.slice(0, 160), kind: "flashcard", href: `/workspace/flashcards` });
  });
  events.forEach((e) => {
    if (`${e.title} ${e.notes ?? ""}`.toLowerCase().includes(q))
      push({ id: e.id, title: e.title, snippet: `${e.date}${e.time ? ` • ${e.time}` : ""}`, kind: "event", href: `/workspace/calendar` });
  });
  chats.forEach((c) => {
    const hay = `${c.title} ${c.messages.map((m) => m.content).join(" ")}`.toLowerCase();
    if (hay.includes(q))
      push({ id: c.id, title: c.title, snippet: c.messages.at(-1)?.content.slice(0, 160) ?? "", kind: "chat", href: `/workspace/mentor` });
  });
  return out.slice(0, 60);
}
