import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  BookmarkIcon,
  NotebookPen,
  Route as RouteIcon,
  CalendarClock,
  Activity,
  Trophy,
  Sparkles,
  Search,
  UserCircle,
} from "lucide-react";
import { pingStreak } from "@/lib/workspace/storage";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/my")({
  ssr: false,
  head: () =>
    buildPageHead({
      path: "/my",
      title: "My Learning Workspace — Glintr",
      description:
        "Your personal Glintr learning workspace: continue courses, track progress, plan study, save roadmaps, and get AI mentor guidance.",
      noindex: true,
    }),
  component: WorkspaceLayout,
});

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const NAV = [
  { to: "/my", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/my/roadmaps", label: "Roadmaps", icon: RouteIcon },
  { to: "/my/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  { to: "/my/notes", label: "Notes", icon: NotebookPen },
  { to: "/my/planner", label: "Planner", icon: CalendarClock },
  { to: "/my/activity", label: "Activity", icon: Activity },
  { to: "/my/achievements", label: "Achievements", icon: Trophy },
  { to: "/my/discover", label: "Discover", icon: Sparkles },
  { to: "/my/search", label: "Search", icon: Search },
  { to: "/my/profile", label: "Profile", icon: UserCircle },
] as const;

function WorkspaceLayout() {
  useEffect(() => {
    pingStreak();
  }, []);
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8 lg:py-10">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur-xl">
            <div className="mb-3 px-3 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Workspace
              </p>
              <p className="text-lg font-bold tracking-tight text-foreground">My Learning</p>
            </div>
            <nav aria-label="Workspace navigation" className="flex flex-col gap-0.5">
              {NAV.map(({ to, label, icon: Icon, exact }) => {
                const active = exact ? pathname === to : pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors " +
                      (active
                        ? "bg-gradient-to-r from-primary/15 to-accent/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")
                    }
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} aria-hidden />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile top nav */}
        <nav
          aria-label="Workspace navigation"
          className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
        >
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold " +
                  (active
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card text-muted-foreground")
                }
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
