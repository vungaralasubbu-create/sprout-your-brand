// Local (session + persistent) storage helpers for the GlintrAI.
// Bookmarks: persistent (localStorage). Recently viewed: persistent. Conversation: session.

import { useEffect, useState, useCallback } from "react";

export type Bookmark = {
  href: string;
  label: string;
  kind: "program" | "blog" | "glossary" | "path" | "tool" | "compare" | "other";
  addedAt: number;
};

export type RecentItem = {
  href: string;
  label: string;
  kind: Bookmark["kind"];
  visitedAt: number;
};

const BOOKMARKS_KEY = "glintr_mentor_bookmarks_v1";
const RECENT_KEY = "glintr_mentor_recent_v1";
const RECENT_LIMIT = 12;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function useBookmarks() {
  const [items, setItems] = useState<Bookmark[]>([]);

  useEffect(() => {
    setItems(readJson<Bookmark[]>(BOOKMARKS_KEY, []));
    const onStorage = (e: StorageEvent) => {
      if (e.key === BOOKMARKS_KEY) setItems(readJson<Bookmark[]>(BOOKMARKS_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isBookmarked = useCallback(
    (href: string) => items.some((b) => b.href === href),
    [items],
  );

  const add = useCallback((b: Omit<Bookmark, "addedAt">) => {
    setItems((prev) => {
      if (prev.some((p) => p.href === b.href)) return prev;
      const next = [{ ...b, addedAt: Date.now() }, ...prev].slice(0, 40);
      writeJson(BOOKMARKS_KEY, next);
      return next;
    });
  }, []);

  const remove = useCallback((href: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.href !== href);
      writeJson(BOOKMARKS_KEY, next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (b: Omit<Bookmark, "addedAt">) => {
      if (items.some((p) => p.href === b.href)) remove(b.href);
      else add(b);
    },
    [items, add, remove],
  );

  return { items, isBookmarked, add, remove, toggle };
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    setItems(readJson<RecentItem[]>(RECENT_KEY, []));
  }, []);
  return items;
}

export function trackVisit(item: Omit<RecentItem, "visitedAt">) {
  if (typeof window === "undefined") return;
  const list = readJson<RecentItem[]>(RECENT_KEY, []);
  const filtered = list.filter((i) => i.href !== item.href);
  const next = [{ ...item, visitedAt: Date.now() }, ...filtered].slice(0, RECENT_LIMIT);
  writeJson(RECENT_KEY, next);
}

// Auto-detect page kind from path for RouteTracker.
export function inferKindFromPath(path: string): Bookmark["kind"] {
  if (path.startsWith("/programs/")) return "program";
  if (path.startsWith("/blog")) return "blog";
  if (path.startsWith("/glossary")) return "glossary";
  if (path.startsWith("/learning-paths") || path.startsWith("/career-maps")) return "path";
  if (path.startsWith("/tools")) return "tool";
  if (path.startsWith("/compare")) return "compare";
  return "other";
}
