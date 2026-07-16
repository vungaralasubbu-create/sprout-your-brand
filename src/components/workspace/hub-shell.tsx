import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  Highlighter,
  BookmarkIcon,
  Layers3,
  Sparkles,
  CalendarDays,
  Activity,
  Search,
  BrainCircuit,
  GraduationCap,
  Library,
  Mic,
} from "lucide-react";

const NAV = [
  { to: "/workspace", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/workspace/notebooks", label: "Notebooks", icon: BookOpen },
  { to: "/workspace/highlights", label: "Highlights", icon: Highlighter },
  { to: "/workspace/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  { to: "/workspace/flashcards", label: "Flashcards", icon: Layers3 },
  { to: "/workspace/revision", label: "Revision", icon: BrainCircuit },
  { to: "/workspace/library", label: "Library", icon: Library },
  { to: "/workspace/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/workspace/study", label: "AI Study Mode", icon: GraduationCap },
  { to: "/workspace/mentor", label: "AI Mentor", icon: Sparkles },
  { to: "/workspace/voice", label: "Voice AI", icon: Mic },
  { to: "/workspace/activity", label: "Activity", icon: Activity },
  { to: "/workspace/search", label: "Search", icon: Search },
];

export function HubShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_10%_-10%,oklch(0.98_0.02_220/0.6),transparent),radial-gradient(1000px_500px_at_100%_0%,oklch(0.98_0.02_180/0.5),transparent)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8 lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:h-fit lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur-xl">
            <div className="px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Your second brain</p>
            </div>
            <nav className="mt-2 flex flex-row overflow-x-auto lg:flex-col lg:overflow-visible">
              {NAV.map(({ to, label, icon: Icon, exact }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors lg:shrink ${
                    isActive(to, exact)
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-xl transition-shadow hover:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] sm:p-6 " +
        className
      }
    >
      {children}
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "primary" | "success" }) {
  const cls =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "success"
        ? "bg-emerald-500/10 text-emerald-700"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
