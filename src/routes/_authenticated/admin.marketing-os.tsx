import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Sparkles, LayoutDashboard, CalendarDays, ListTodo, Send, BarChart3, Wand2, CheckSquare, Palette, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os")({
  component: MarketingOSShell,
});

const TABS: Array<{ to: string; label: string; icon: typeof LayoutDashboard; live: boolean; exact?: boolean }> = [
  { to: "/admin/marketing-os", label: "Dashboard", icon: LayoutDashboard, live: true, exact: true },
  { to: "/admin/marketing-os/campaigns", label: "Campaign Manager", icon: Megaphone, live: true },
  { to: "/admin/marketing-os/planner", label: "AI Planner", icon: Wand2, live: true },
  { to: "/admin/marketing-os/approvals", label: "Approval Center", icon: CheckSquare, live: true },
  { to: "/admin/marketing-os/queue", label: "Content Queue", icon: ListTodo, live: false },
  { to: "/admin/marketing-os/publisher", label: "Publisher", icon: Send, live: true },
  { to: "/admin/marketing-os/calendar", label: "Calendar", icon: CalendarDays, live: true },
  { to: "/admin/marketing-os/analytics", label: "Analytics", icon: BarChart3, live: true },
  { to: "/admin/marketing-os/brand-kit", label: "Brand Kit", icon: Palette, live: true },
];

function MarketingOSShell() {
  const loc = useLocation();
  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname === to || loc.pathname.startsWith(to + "/");

  return (
    <div className="min-h-full">
      <header className="border-b border-border/60 bg-white/70 backdrop-blur">
        <div className="px-6 py-5 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Enterprise</div>
            <h1 className="text-xl font-semibold tracking-tight">Marketing OS</h1>
          </div>
        </div>
        <nav className="px-4 flex flex-wrap gap-1">
          {TABS.map((t) => {
            const active = isActive(t.to, t.exact);
            const Icon = t.icon;
            return t.live ? (
              <Link
                key={t.to}
                to={t.to as unknown as "/admin/marketing-os"}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm rounded-t-md border-b-2 transition-colors",
                  active
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </Link>
            ) : (
              <span
                key={t.to}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-t-md border-b-2 border-transparent text-muted-foreground/50 cursor-not-allowed"
                title="Coming soon"
              >
                <Icon className="size-4" />
                {t.label}
                <span className="ml-1 text-[9px] uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded">Soon</span>
              </span>
            );
          })}
        </nav>
      </header>
      <div className="p-6">
        <Outlet />
      </div>
    </div>
  );
}
