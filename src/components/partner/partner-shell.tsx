import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Link2,
  ShieldCheck,
  ShoppingBag,
  Wallet,
  Package,
  Gift,
  Building2,
  BarChart3,
  UserCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { getPartnerContext } from "@/lib/partner/dashboard.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/partner/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/partner/coming-soon", label: "My Leads", icon: Users },
  { to: "/partner/add-leads", label: "Add Leads", icon: UserPlus },
  { to: "/partner/payment-links", label: "Payment Links", icon: Link2 },
  { to: "/partner/payment-verification", label: "Payment Verification", icon: ShieldCheck },
  { to: "/partner/coming-soon", label: "My Sales", icon: ShoppingBag },
  { to: "/partner/earnings", label: "Earnings", icon: Wallet },
  { to: "/partner/coming-soon", label: "Programs", icon: Package },
  { to: "/partner/referral-bonus", label: "Referral Bonus", icon: Gift },
  { to: "/partner/coming-soon", label: "Brand Profile", icon: Building2 },
  { to: "/partner/coming-soon", label: "Analytics", icon: BarChart3 },
  { to: "/partner/coming-soon", label: "Account", icon: UserCircle },
] as const;

export function PartnerShell() {
  const fetchCtx = useServerFn(getPartnerContext);
  const { data } = useQuery({ queryKey: ["partner-context"], queryFn: () => fetchCtx() });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const partner = data?.partner ?? null;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const isActive = (to: string, label: string) => {
    if (label === "Overview") return pathname === "/partner/dashboard";
    if (to === "/partner/coming-soon") return false;
    return pathname === to || pathname.startsWith(to + "/");
  };

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
            "border-r bg-white lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col",
            open ? "block" : "hidden lg:flex",
          )}
        >
          <div className="p-5 border-b hidden lg:block">
            <Link to="/" className="font-display text-xl font-semibold tracking-tight">
              glintr
            </Link>
            <div className="mt-0.5 text-caption font-mono uppercase tracking-widest text-primary">
              Sales Workspace
            </div>
          </div>

          <div className="px-3 py-4 flex-1 overflow-y-auto">
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
              {NAV.map((item, i) => {
                const active = isActive(item.to, item.label);
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.label}-${i}`}
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
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="px-3 py-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Logout
            </Button>
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
