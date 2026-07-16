import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { LayoutGrid, Workflow, History, FileText, ScrollText, Sparkles } from "lucide-react";

const TABS = [
  { to: "/admin/automation", label: "Home", icon: LayoutGrid, exact: true },
  { to: "/admin/workflows", label: "Workflows", icon: Workflow },
  { to: "/admin/workflows/templates", label: "Templates", icon: FileText },
  { to: "/admin/automation/history", label: "Execution History", icon: History },
  { to: "/admin/automation/audit", label: "Audit Log", icon: ScrollText },
];

export function AutomationHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5">
            <Sparkles className="size-3" /> Automation Studio
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-border/60">
        {TABS.map((t) => {
          const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link key={t.to} to={t.to} className={cn(
              "px-3 py-2 text-xs font-medium flex items-center gap-1.5 border-b-2 -mb-px whitespace-nowrap",
              active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}>
              <Icon className="size-3.5" /> {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
