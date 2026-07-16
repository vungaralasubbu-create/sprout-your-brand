import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Sparkles, Boxes, HelpCircle, FileText, ClipboardList, Eye, Braces,
  BookMarked, ShieldCheck, Bot, MessageSquareQuote,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/ai-search")({
  component: AiSearchShell,
});

const NAV = [
  { to: "/admin/ai-search", label: "AI Readiness", icon: LayoutDashboard, exact: true },
  { to: "/admin/ai-search/citation", label: "Citation Readiness", icon: MessageSquareQuote },
  { to: "/admin/ai-search/entities", label: "Entity Coverage", icon: Boxes },
  { to: "/admin/ai-search/summaries", label: "AI Summaries", icon: Sparkles },
  { to: "/admin/ai-search/faqs", label: "FAQ Coverage", icon: HelpCircle },
  { to: "/admin/ai-search/definitions", label: "Definitions", icon: BookMarked },
  { to: "/admin/ai-search/schema", label: "Structured Data", icon: Braces },
  { to: "/admin/ai-search/preview", label: "Search Preview", icon: Eye },
  { to: "/admin/ai-search/tasks", label: "Editor Tasks", icon: ClipboardList },
  { to: "/admin/ai-search/reports", label: "Reports", icon: FileText },
  { to: "/admin/ai-search/permissions", label: "Permissions", icon: ShieldCheck },
];

function AiSearchShell() {
  const loc = useLocation();
  const active = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname === to || loc.pathname.startsWith(to + "/");

  return (
    <div className="flex flex-col lg:flex-row gap-6 -m-4 lg:-m-6 min-h-[calc(100vh-3.5rem)]">
      <aside className="lg:w-60 lg:min-w-60 lg:border-r lg:border-border/60 lg:bg-white lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14 p-4 lg:overflow-y-auto">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70 mb-2 px-1 flex items-center gap-1.5">
          <Bot className="size-3 text-primary" /> AI Search
        </div>
        <nav className="space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const on = active(n.to, n.exact);
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                )}
              >
                <Icon className="size-[15px]" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-[11px] leading-relaxed">
          <strong className="text-primary">Clarity over manipulation.</strong> Every enhancement here helps humans first — AI systems benefit as a consequence.
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
