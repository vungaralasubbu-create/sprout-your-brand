import type { PseoPage, PseoStatus } from "./types";

const KEY = "glintr.pseo.pages.v1";

function read(): PseoPage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PseoPage[]) : [];
  } catch {
    return [];
  }
}

function write(pages: PseoPage[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(pages));
}

export const pseoStore = {
  list(): PseoPage[] {
    return read();
  },
  get(id: string): PseoPage | undefined {
    return read().find((p) => p.id === id);
  },
  upsert(page: PseoPage) {
    const pages = read();
    const idx = pages.findIndex((p) => p.id === page.id);
    if (idx >= 0) pages[idx] = { ...page, updatedAt: new Date().toISOString() };
    else pages.unshift(page);
    write(pages);
  },
  upsertMany(newPages: PseoPage[]) {
    const pages = read();
    for (const p of newPages) {
      const idx = pages.findIndex((x) => x.id === p.id);
      if (idx >= 0) pages[idx] = p;
      else pages.unshift(p);
    }
    write(pages);
  },
  remove(id: string) {
    write(read().filter((p) => p.id !== id));
  },
  updateStatus(id: string, status: PseoStatus, note?: string) {
    const pages = read();
    const p = pages.find((x) => x.id === id);
    if (!p) return;
    p.status = status;
    p.updatedAt = new Date().toISOString();
    if (note) p.reviewNotes = note;
    if (status === "published") p.publishedAt = new Date().toISOString();
    write(pages);
  },
  reset() {
    write([]);
  },
};
