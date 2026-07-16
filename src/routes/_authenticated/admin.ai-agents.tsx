import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, Plus, Route as RouteIcon, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/ai-agents")({
  component: Shell,
});

const NAV = [
  { to: "/admin/ai-agents", label: "Marketplace", icon: LayoutGrid, exact: true },
  { to: "/admin/ai-agents/new", label: "Custom Agents", icon: Plus },
  { to: "/admin/ai-agents/orchestrator", label: "Orchestrator", icon: RouteIcon },
  { to: "/admin/ai-agents/analytics", label: "Analytics", icon: BarChart3 },
];

function Shell() {
  const loc = useLocation();
  const isActive = (to: string, exact?: boolean) => exact ? loc.pathname === to : loc.pathname === to || loc.pathname.startsWith(to + "/");
  return (
    <div className="flex flex-col lg:flex-row gap-6 -m-4 lg:-m-6 min-h-[calc(100vh-3.5rem)]">
      <aside className="lg:w-60 lg:min-w-60 lg:border-r lg:border-border/60 lg:bg-white lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14 p-4 lg:overflow-y-auto">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70 mb-2 px-1 flex items-center gap-1.5"><Sparkles className="size-3 text-primary" /> AI Agents</div>
        <nav className="space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon; const active = isActive(n.to, n.exact);
            return (
              <Link key={n.to} to={n.to as any} className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground")}>
                <Icon className="size-[15px]" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <Link to="/ai-agents" className="mt-4 block rounded-md border border-primary/20 bg-primary/5 p-3 text-[11px] leading-relaxed hover:bg-primary/10">
          <strong className="text-primary">Public marketplace →</strong>
          <br />See what learners and partners see at /ai-agents.
        </Link>
      </aside>
      <main className="flex-1 min-w-0 p-4 lg:p-6"><Outlet /></main>
    </div>
  );
}
