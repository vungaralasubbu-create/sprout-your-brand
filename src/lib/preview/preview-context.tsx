import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "glintr.preview.v1";
const CHANGE_EVENT = "glintr:preview-changed";

export type PreviewSession = {
  userId: string;
  name: string;
  email: string | null;
  primaryRole: string | null;
  roleLabel: string;
  dashboardPath: string;
  readOnly: boolean;
  startedAt: number;
};

type PreviewContextValue = {
  preview: PreviewSession | null;
  isActive: boolean;
  isReadOnly: boolean;
  startPreview: (p: Omit<PreviewSession, "readOnly" | "startedAt"> & { readOnly?: boolean }) => void;
  exitPreview: () => void;
  setReadOnly: (readOnly: boolean) => void;
};

const PreviewContext = createContext<PreviewContextValue | null>(null);

function readStorage(): PreviewSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PreviewSession;
    if (!parsed?.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(next: PreviewSession | null) {
  if (typeof window === "undefined") return;
  if (next) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  else window.sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<PreviewSession | null>(null);

  // Hydrate on mount (client-only) so SSR markup stays stable.
  useEffect(() => {
    setPreview(readStorage());
    const onChange = () => setPreview(readStorage());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const startPreview = useCallback<PreviewContextValue["startPreview"]>((p) => {
    const next: PreviewSession = {
      userId: p.userId,
      name: p.name,
      email: p.email,
      primaryRole: p.primaryRole,
      roleLabel: p.roleLabel,
      dashboardPath: p.dashboardPath,
      readOnly: p.readOnly ?? true,
      startedAt: Date.now(),
    };
    writeStorage(next);
    setPreview(next);
  }, []);

  const exitPreview = useCallback(() => {
    writeStorage(null);
    setPreview(null);
  }, []);

  const setReadOnly = useCallback((readOnly: boolean) => {
    setPreview((current) => {
      if (!current) return current;
      const next = { ...current, readOnly };
      writeStorage(next);
      return next;
    });
  }, []);

  const value = useMemo<PreviewContextValue>(
    () => ({
      preview,
      isActive: !!preview,
      isReadOnly: !!preview?.readOnly,
      startPreview,
      exitPreview,
      setReadOnly,
    }),
    [preview, startPreview, exitPreview, setReadOnly],
  );

  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview() {
  const ctx = useContext(PreviewContext);
  if (!ctx) {
    // Safe fallback during SSR or when provider is not mounted.
    return {
      preview: null,
      isActive: false,
      isReadOnly: false,
      startPreview: () => {},
      exitPreview: () => {},
      setReadOnly: () => {},
    } satisfies PreviewContextValue;
  }
  return ctx;
}
