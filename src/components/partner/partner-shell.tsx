import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  UserCheck,
  CalendarClock,
  Link2,
  Wallet,
  Receipt,
  BarChart3,
  FileText,
  Bell,
  LifeBuoy,
  UserCircle,
  Rocket,
  Menu,
  X,
} from "lucide-react";
import { getPartnerContext } from "@/lib/partner/dashboard.functions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/partner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/partner/onboarding", label: "Onboarding", icon: UserCheck },
  { to: "/partner/programs", label: "Programs", icon: Package },
  { to: "/partner/leads", label: "My Leads", icon: Users },
  { to: "/partner/assigned-leads", label: "Assigned Leads", icon: UserCheck },
  { to: "/partner/follow-ups", label: "Follow-Ups", icon: CalendarClock },
  { to: "/partner/links", label: "My Links", icon: Link2 },
  { to: "/partner/earnings", label: "Earnings", icon: Wallet },
  { to: "/partner/payouts", label: "Payouts", icon: Receipt },
  { to: "/partner/performance", label: "Performance", icon: BarChart3 },
  { to: "/partner/statements", label: "Statements", icon: FileText },
  { to: "/partner/notifications", label: "Notifications", icon: Bell },
  { to: "/partner/support", label: "Support", icon: LifeBuoy },
  { to: "/partner/profile", label: "Profile", icon: UserCircle },
] as const;

export function PartnerShell() {
  const fetchCtx = useServerFn(getPartnerContext);
  const { data } = useQuery({ queryKey: ["partner-context"], queryFn: () => fetchCtx() });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const partner = data?.partner ?? null;
  const unread = data?.unreadNotifications ?? 0;

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.005_240)] text-foreground">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-white">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight">
          glintr
        </Link>
        <button
          className="p-2 rounded-md hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside
          className={cn(
            "border-r bg-white lg:sticky lg:top-0 lg:h-screen lg:block",
            open ? "block" : "hidden",
          )}
        >
          <div className="p-5 border-b hidden lg:block">
            <Link to="/" className="font-display text-xl font-semibold tracking-tight">
              glintr
            </Link>
            <div className="mt-0.5 text-caption font-mono uppercase tracking-widest text-primary">
              Partner Workspace
            </div>
          </div>

          <div className="px-3 py-4">
            {partner ? (
              <div className="mb-4 p-3 rounded-xl bg-[oklch(0.97_0.02_240)] border border-border/50">
                <div className="text-caption uppercase tracking-wider text-muted-foreground">
                  Partner Code
                </div>
                <div className="mt-0.5 font-mono text-sm font-semibold">
                  {partner.partner_code ?? "—"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground truncate">
                  {partner.display_name}
                </div>
              </div>
            ) : null}
            <nav className="space-y-0.5">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground/75 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.to === "/partner/notifications" && unread > 0 ? (
                      <Badge variant="primary" className="h-5 px-1.5 text-[10px]">
                        {unread}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 pt-6 border-t">
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link to="/launch-your-brand" onClick={() => setOpen(false)}>
                  <Rocket className="size-4" />
                  Launch My Brand
                </Link>
              </Button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
