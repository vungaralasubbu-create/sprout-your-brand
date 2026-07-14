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
  Briefcase,
  Scale,
  LogOut,
  Menu,
  X,
  Bell,
  AlertTriangle,
  CalendarClock,
  PhoneOff,
  CreditCard,
} from "lucide-react";
import { getPartnerContext } from "@/lib/partner/dashboard.functions";
import { getFollowUpCounts } from "@/lib/partner/follow-ups.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/partner/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/partner/my-leads", label: "My Leads", icon: Users },
  { to: "/partner/add-leads", label: "Add Leads", icon: UserPlus },
  { to: "/partner/ownership-reviews", label: "Ownership Reviews", icon: Scale },
  { to: "/partner/payment-links", label: "Payment Links", icon: Link2 },
  { to: "/partner/payment-verification", label: "Payment Verification", icon: ShieldCheck },
  { to: "/partner/coming-soon", label: "My Sales", icon: ShoppingBag },
  { to: "/partner/earnings", label: "Earnings", icon: Wallet },
  { to: "/partner/programs", label: "Programs", icon: Package },
  { to: "/partner/referral-bonus", label: "Referral Bonus", icon: Gift },
  { to: "/partner/brand-profile", label: "Brand Profile", icon: Building2 },
  { to: "/partner/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/partner/account", label: "Account", icon: UserCircle },
] as const;

export function PartnerShell() {
  const fetchCtx = useServerFn(getPartnerContext);
  const { data } = useQuery({ queryKey: ["partner-context"], queryFn: () => fetchCtx() });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const partner = data?.partner ?? null;
  const isFullTime = partner?.work_model === "full_time" && !!data?.employeeProfile;

  const navItems = [
    ...NAV.slice(0, 11), // through Analytics
    ...(isFullTime
      ? [{ to: "/partner/employment", label: "Employment", icon: Briefcase } as const]
      : [{ to: "/partner/earnings-statement", label: "Monthly Statement", icon: Briefcase } as const]),
    NAV[11]!, // Account
  ];




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
              {navItems.map((item, i) => {
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
          <div className="hidden lg:flex sticky top-0 z-30 h-14 items-center justify-end gap-2 border-b bg-white/90 backdrop-blur px-6">
            <FollowUpAlerts />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function FollowUpAlerts() {
  const fetchCounts = useServerFn(getFollowUpCounts);
  const { data } = useQuery({
    queryKey: ["follow-up-counts"],
    queryFn: () => fetchCounts(),
    refetchInterval: 60_000,
  });
  const total = data?.total ?? 0;

  const items = [
    { key: "overdue", label: "Overdue Follow-Ups", icon: AlertTriangle, count: data?.overdue ?? 0, tone: "text-red-600" },
    { key: "today", label: "Today's Follow-Ups", icon: CalendarClock, count: data?.today ?? 0, tone: "text-blue-600" },
    { key: "no_answer_retry", label: "No Answer Retry", icon: PhoneOff, count: data?.no_answer_retry ?? 0, tone: "text-amber-600" },
    { key: "payment_follow_up", label: "Payment Follow-Up", icon: CreditCard, count: data?.payment_follow_up ?? 0, tone: "text-emerald-600" },
    { key: "not_contacted", label: "Not Contacted", icon: Users, count: data?.not_contacted ?? 0, tone: "text-slate-600" },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm hover:bg-muted/50"
          aria-label="Lead reminders"
        >
          <Bell className="size-4" />
          <span className="font-medium">{total} Leads Need Attention</span>
          {total > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold inline-flex items-center justify-center">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <div className="px-2 py-1.5 text-caption font-mono uppercase tracking-widest text-muted-foreground">
          Needs Your Attention
        </div>
        <div className="space-y-0.5">
          {items.map((it) => (
            <Link
              key={it.key}
              to="/partner/my-leads"
              search={{ filter: it.key, index: 0 }}
              className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <it.icon className={cn("size-4", it.tone)} />
                {it.label}
              </span>
              <span className="font-mono tabular-nums font-semibold">{it.count}</span>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
