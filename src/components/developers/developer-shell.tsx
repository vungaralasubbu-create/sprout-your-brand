import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  Key,
  Package,
  Webhook,
  ShieldCheck,
  Boxes,
  ScrollText,
  TerminalSquare,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: LucideIcon; exact?: boolean };
const NAV: Item[] = [
  { to: "/developers", label: "Overview", icon: Home, exact: true },
  { to: "/developers/api", label: "API Keys", icon: Key },
  { to: "/developers/sdk", label: "SDKs", icon: Package },
  { to: "/developers/webhooks", label: "Webhooks", icon: Webhook },
  { to: "/developers/oauth", label: "OAuth", icon: ShieldCheck },
  { to: "/developers/apps", label: "Apps", icon: Boxes },
  { to: "/developers/logs", label: "Logs", icon: ScrollText },
  { to: "/developers/playground", label: "Playground", icon: TerminalSquare },
  { to: "/developers/docs", label: "Docs", icon: BookOpen },
];

export function DeveloperShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              Developer Platform
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Build with AI Marketing Cloud
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              APIs, SDKs, Webhooks and OAuth to integrate AI Marketing into your applications.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600">
              ● All systems operational
            </span>
            <span className="rounded-full border bg-muted px-2.5 py-1 font-mono text-muted-foreground">
              v2026.07
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b pb-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.exact
              ? loc.pathname === n.to
              : loc.pathname.startsWith(n.to) && loc.pathname !== "/developers";
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
