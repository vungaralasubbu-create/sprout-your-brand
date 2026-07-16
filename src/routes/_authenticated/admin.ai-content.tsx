import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Sparkles, Wand2, FileEdit, Send, LayoutTemplate, Image as ImageIcon,
  Search, Network, BarChart3, Settings, ShieldCheck, Lightbulb, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/ai-content")({
  component: AiFactoryShell,
});

const NAV_PRIMARY = [
  { to: "/admin/ai-content", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/ai-content/wizard", label: "Generate Content", icon: Wand2 },
  { to: "/admin/ai-content/drafts", label: "Drafts", icon: FileEdit },
  { to: "/admin/ai-content/queue", label: "Publishing Queue", icon: Send },
  { to: "/admin/ai-content/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/admin/ai-content/media", label: "Media", icon: ImageIcon },
  { to: "/admin/ai-content/seo", label: "SEO", icon: Search },
  { to: "/admin/ai-content/knowledge-graph", label: "Knowledge Graph", icon: Network },
  { to: "/admin/ai-content/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/ai-content/settings", label: "Settings", icon: Settings },
];

const NAV_SECONDARY = [
  { to: "/admin/ai-content/review", label: "Editor Review", icon: ShieldCheck },
  { to: "/admin/ai-content/suggestions", label: "AI Suggestions", icon: Lightbulb },
  { to: "/admin/ai-content/calendar", label: "Content Calendar", icon: Calendar },
  { to: "/admin/ai-content/clusters", label: "Topic Clusters", icon: Network },
];

function AiFactoryShell() {
  const loc = useLocation();
  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname === to || loc.pathname.startsWith(to + "/");

  return (
    <div className="flex flex-col lg:flex-row gap-6 -m-4 lg:-m-6 min-h-[calc(100vh-3.5rem)]">
      <aside className="lg:w-60 lg:min-w-60 lg:border-r lg:border-border/60 lg:bg-white lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14 p-4 lg:overflow-y-auto">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70 mb-2 px-1 flex items-center gap-1.5">
          <Sparkles className="size-3 text-primary" /> AI Content Factory
        </div>
        <nav className="space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = isActive(n.to, n.exact);
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                )}
              >
                <Icon className="size-[15px]" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-[11px] leading-relaxed">
          <strong className="text-primary">Editorial rule:</strong> nothing publishes automatically. Every AI draft requires human review, fact-checking and final approval.
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
