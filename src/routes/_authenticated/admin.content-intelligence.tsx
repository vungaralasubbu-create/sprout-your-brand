import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Network, Search, LinkIcon, Clock, Gauge, Boxes, GitCompare, Route as RouteIcon,
  BookOpen, HelpCircle, TrendingUp, Snowflake, ClipboardList, Share2, FileText, Bell, Brain,
  Sparkles, Swords, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence")({
  component: IntelShell,
});

const NAV = [
  { to: "/admin/content-intelligence", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/content-intelligence/authority", label: "Topical Authority", icon: Network },
  { to: "/admin/content-intelligence/topic-map", label: "Topic Map", icon: Network },
  { to: "/admin/content-intelligence/ai-citation", label: "AI Citation", icon: Sparkles },
  { to: "/admin/content-intelligence/competitors", label: "Competitors", icon: Swords },
  { to: "/admin/content-intelligence/permissions", label: "Permissions", icon: ShieldCheck },
  { to: "/admin/content-intelligence/gaps", label: "Content Gaps", icon: Search },
  { to: "/admin/content-intelligence/related", label: "Related Content", icon: LinkIcon },
  { to: "/admin/content-intelligence/freshness", label: "Content Freshness", icon: Clock },
  { to: "/admin/content-intelligence/quality", label: "Quality Scores", icon: Gauge },
  { to: "/admin/content-intelligence/entities", label: "Entity Coverage", icon: Boxes },
  { to: "/admin/content-intelligence/comparisons", label: "Comparison Ideas", icon: GitCompare },
  { to: "/admin/content-intelligence/roadmaps", label: "Roadmap Ideas", icon: RouteIcon },
  { to: "/admin/content-intelligence/glossary", label: "Glossary Expansion", icon: BookOpen },
  { to: "/admin/content-intelligence/faqs", label: "FAQ Discovery", icon: HelpCircle },
  { to: "/admin/content-intelligence/search-insights", label: "Search Insights", icon: TrendingUp },
  { to: "/admin/content-intelligence/decay", label: "Content Decay", icon: Snowflake },
  { to: "/admin/content-intelligence/tasks", label: "Editor Tasks", icon: ClipboardList },
  { to: "/admin/content-intelligence/graph-health", label: "Graph Health", icon: Share2 },
  { to: "/admin/content-intelligence/reports", label: "Reports", icon: FileText },
  { to: "/admin/content-intelligence/notifications", label: "Notifications", icon: Bell },
];

function IntelShell() {
  const loc = useLocation();
  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname === to || loc.pathname.startsWith(to + "/");

  return (
    <div className="flex flex-col lg:flex-row gap-6 -m-4 lg:-m-6 min-h-[calc(100vh-3.5rem)]">
      <aside className="lg:w-60 lg:min-w-60 lg:border-r lg:border-border/60 lg:bg-white lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14 p-4 lg:overflow-y-auto">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70 mb-2 px-1 flex items-center gap-1.5">
          <Brain className="size-3 text-primary" /> Content Intelligence
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
          <strong className="text-primary">Editorial-first.</strong> Every recommendation requires human approval. Nothing rewrites, publishes or overwrites content automatically.
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
