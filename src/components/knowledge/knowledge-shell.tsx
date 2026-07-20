import { Link, useLocation } from "@tanstack/react-router";
import { Brain, FileText, Globe, Package, HelpCircle, Users, History, Upload, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/knowledge", label: "Overview", icon: Brain, exact: true },
  { to: "/knowledge/upload", label: "Upload", icon: Upload },
  { to: "/knowledge/documents", label: "Documents", icon: FileText },
  { to: "/knowledge/websites", label: "Websites", icon: Globe },
  { to: "/knowledge/products", label: "Products", icon: Package },
  { to: "/knowledge/faq", label: "FAQs", icon: HelpCircle },
  { to: "/knowledge/team", label: "Team", icon: Users },
  { to: "/knowledge/history", label: "History", icon: History },
];

export function KnowledgeShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Knowledge Hub</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your company's AI brain</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Upload everything about your business once. Your AI team will remember forever — every agent uses this knowledge automatically.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b pb-2 overflow-x-auto">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to as any}
              className={cn("inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="h-4 w-4" />{n.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
