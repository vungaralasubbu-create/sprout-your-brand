import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Award,
  LifeBuoy,
  UserCircle,
  Menu,
  X,
  Home,
  Radio,
} from "lucide-react";
import { getStudentContext } from "@/lib/student/lms.functions";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/programs", label: "My Programs", icon: BookOpen },
  { to: "/student/live-sessions", label: "Live Sessions", icon: Radio },
  { to: "/student/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/student/assessments", label: "Assessments", icon: GraduationCap },
  { to: "/student/certificates", label: "Certificates", icon: Award },
  { to: "/student/support", label: "Support", icon: LifeBuoy },
  { to: "/student/profile", label: "Profile", icon: UserCircle },
] as const;


const MOBILE_NAV = [
  { to: "/student/dashboard", label: "Home", icon: Home },
  { to: "/student/programs", label: "Programs", icon: BookOpen },
  { to: "/student/learn", label: "Learn", icon: GraduationCap },
  { to: "/student/certificates", label: "Certificates", icon: Award },
] as const;

export function StudentShell() {
  const fetchCtx = useServerFn(getStudentContext);
  const { data: ctx } = useQuery({ queryKey: ["student-context"], queryFn: () => fetchCtx() });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.005_240)] text-foreground pb-16 lg:pb-0">
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-white">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight">glintr</Link>
        <button className="p-2 rounded-md hover:bg-muted" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[240px_1fr]">
        <aside className={cn(
          "border-r bg-white lg:sticky lg:top-0 lg:h-screen lg:block",
          open ? "block" : "hidden",
        )}>
          <div className="p-5 border-b hidden lg:block">
            <Link to="/" className="font-display text-xl font-semibold tracking-tight">glintr</Link>
            <div className="mt-0.5 text-caption font-mono uppercase tracking-widest text-primary">Student Workspace</div>
          </div>
          <div className="px-3 py-4">
            {ctx ? (
              <div className="mb-4 p-3 rounded-xl bg-[oklch(0.97_0.02_240)] border border-border/50">
                <div className="text-caption uppercase tracking-wider text-muted-foreground">Signed in as</div>
                <div className="mt-0.5 text-sm font-semibold truncate">{ctx.displayName}</div>
                <div className="text-xs text-muted-foreground truncate">{ctx.email}</div>
              </div>
            ) : null}
            <nav className="space-y-0.5">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active ? "bg-primary/10 text-primary font-medium" : "text-foreground/75 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white border-t grid grid-cols-4">
        {MOBILE_NAV.map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className={cn(
              "flex flex-col items-center justify-center py-2 text-[11px]",
              active ? "text-primary" : "text-muted-foreground",
            )}>
              <Icon className="size-5 mb-0.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
