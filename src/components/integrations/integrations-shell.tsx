import { Link, useLocation } from "@tanstack/react-router";
import { Compass, CheckCircle2, Search, Settings, Activity, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: LucideIcon; exact?: boolean };
const NAV: Item[] = [
  { to: "/integrations", label: "Marketplace", icon: Compass, exact: true },
  { to: "/integrations/installed", label: "Installed", icon: CheckCircle2 },
  { to: "/integrations/discover", label: "Discover", icon: Search },
  { to: "/integrations/logs", label: "Activity", icon: Activity },
  { to: "/integrations/settings", label: "Settings", icon: Settings },
];

export function IntegrationsShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Integration Hub</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Connect your business stack</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Connect your favorite applications once. Your AI Team will automatically use them.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b pb-2">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to) && loc.pathname !== "/integrations";
          const isMarket = n.exact && loc.pathname === "/integrations";
          const on = active || isMarket && n.exact;
          return (
            <Link key={n.to} to={n.to as any}
              className={cn("inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="h-4 w-4" />{n.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function ProviderLogo({ provider, name, brandColor }: { provider: string; name: string; brandColor?: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold text-white"
      style={{ background: brandColor ?? `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))` }}>
      {initial}
    </div>
  );
}
