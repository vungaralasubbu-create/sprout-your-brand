import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users2,
  Palette,
  Globe,
  LayoutTemplate,
  BarChart3,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: LucideIcon; exact?: boolean };
const NAV: Item[] = [
  { to: "/agency", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/agency/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agency/clients", label: "Clients", icon: Users2 },
  { to: "/agency/branding", label: "Branding", icon: Palette },
  { to: "/agency/domains", label: "Domains", icon: Globe },
  { to: "/agency/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/agency/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/agency/billing", label: "Billing", icon: CreditCard },
  { to: "/agency/settings", label: "Settings", icon: Settings },
];

export function AgencyShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">White Label Platform</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Agency Command Center</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Launch and manage a branded AI Marketing Platform for every client — brand, domain, users, AI, and billing under one roof.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b pb-2">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to) && loc.pathname !== "/agency";
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
  );
}
