import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
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
  LifeBuoy,
  Sparkles,
  GraduationCap,
  Megaphone,
  Palette,
  Search,
  Rocket,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { getPartnerContext } from "@/lib/partner/dashboard.functions";
import { getFollowUpCounts } from "@/lib/partner/follow-ups.functions";
import { listMySupportTickets } from "@/lib/partner/support.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const OVERVIEW: NavItem[] = [
  { to: "/partner/dashboard", label: "Overview", icon: LayoutDashboard },
];

// Sales Partner (70%, own leads) — sells Glintr programs via own network.
const SALES_LEADS: NavItem[] = [
  { to: "/partner/my-leads", label: "Lead Dashboard", icon: Users },
  { to: "/partner/add-leads", label: "Add Leads", icon: UserPlus },
];
const SALES_REVENUE: NavItem[] = [
  { to: "/partner/payment-links", label: "Payment Links", icon: Link2 },
  { to: "/partner/payment-verification", label: "Payment Verification", icon: ShieldCheck },
  { to: "/partner/earnings", label: "Commission Wallet", icon: Wallet },
  { to: "/partner/referral-bonus", label: "Referral Bonus", icon: Gift },
];
const SALES_TOOLKIT: NavItem[] = [
  { to: "/partner/programs", label: "Programs", icon: Package },
  { to: "/partner/analytics", label: "Performance Analytics", icon: BarChart3 },
  { to: "/partner/marketing", label: "Marketing Materials", icon: Palette },
  { to: "/partner/academy", label: "Sales Scripts & Academy", icon: GraduationCap },
  { to: "/partner/sales-ai", label: "Sales AI Center", icon: Sparkles },
  { to: "/partner/ai-assistant", label: "AI Sales Assistant", icon: Sparkles },
  { to: "/partner/announcements", label: "Announcements", icon: Megaphone },
  { to: "/partner/search", label: "Search", icon: Search },
];

// Assisted Sales Partner (50%, receives verified leads).
const ASSISTED_LEADS: NavItem[] = [
  { to: "/partner/my-leads", label: "Lead Queue", icon: Users },
  { to: "/partner/ownership-reviews", label: "Lead Ownership", icon: Scale },
];
const ASSISTED_REVENUE: NavItem[] = [
  { to: "/partner/earnings", label: "Commission Wallet", icon: Wallet },
];
const ASSISTED_TOOLKIT: NavItem[] = [
  { to: "/partner/analytics", label: "Performance Analytics", icon: BarChart3 },
  { to: "/partner/sales-ai", label: "Sales AI Center", icon: Sparkles },
  { to: "/partner/ai-assistant", label: "AI Call Assistant", icon: Sparkles },
  { to: "/partner/academy", label: "Sales Training", icon: GraduationCap },
  { to: "/partner/announcements", label: "Announcements", icon: Megaphone },
];

// Academy Partner (optional upgrade).
const ACADEMY_NAV: NavItem[] = [
  { to: "/partner/ai-coo", label: "AI COO — Command Center", icon: Sparkles },
  { to: "/partner/academy/onboarding", label: "Launch My Academy", icon: Rocket },
  { to: "/partner/academy/workspace", label: "Academy Workspace", icon: LayoutDashboard },
  { to: "/partner/ai-employees", label: "AI Employees", icon: Sparkles },
  { to: "/partner/business-os", label: "AI Business OS", icon: Sparkles },
  { to: "/partner/brand-studio", label: "Brand Launch Studio", icon: Rocket },
  { to: "/partner/academy-builder", label: "Academy Builder", icon: GraduationCap },
  { to: "/partner/brand-profile", label: "Brand Profile", icon: Building2 },
];

const ACADEMY_OPT_IN_KEY = "glintr.partner.academy.optin";

function useAcademyEnabled(hasBrandProfile: boolean) {
  const [optIn, setOptIn] = useState(false);
  useEffect(() => {
    try {
      setOptIn(localStorage.getItem(ACADEMY_OPT_IN_KEY) === "1");
    } catch { /* noop */ }
  }, []);
  return {
    enabled: hasBrandProfile || optIn,
    enable: () => {
      try { localStorage.setItem(ACADEMY_OPT_IN_KEY, "1"); } catch { /* noop */ }
      setOptIn(true);
    },
  };
}

export function PartnerShell() {
  const fetchCtx = useServerFn(getPartnerContext);
  const { data } = useQuery({ queryKey: ["partner-context"], queryFn: () => fetchCtx() });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem("glintr.partner.sidebar.collapsed") === "1"); } catch { /* noop */ }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem("glintr.partner.sidebar.collapsed", next ? "1" : "0"); } catch { /* noop */ }
      return next;
    });
  };

  const partner = data?.partner ?? null;
  const isFullTime = partner?.work_model === "full_time" && !!data?.employeeProfile;
  const model = (partner?.sales_model_selection as string | null) ?? null;
  const isAssisted = model === "supported_sales";
  const isDual = model === "dual_model";
  const isSales = model === "own_leads" || !model; // default to sales partner view

  const academy = useAcademyEnabled(!!data?.hasBrandProfile);

  const employmentItem: NavItem = isFullTime
    ? { to: "/partner/employment", label: "Employment", icon: Briefcase }
    : { to: "/partner/earnings-statement", label: "Monthly Statement", icon: Briefcase };

  // Merge nav based on selected model(s).
  const leadItems: NavItem[] = isDual
    ? [...SALES_LEADS, { to: "/partner/ownership-reviews", label: "Lead Ownership", icon: Scale }]
    : isAssisted ? ASSISTED_LEADS : SALES_LEADS;

  const revenueItems: NavItem[] = isAssisted && !isDual
    ? [...ASSISTED_REVENUE, employmentItem]
    : [...SALES_REVENUE, employmentItem];

  const toolkitItems: NavItem[] = isDual
    ? [...SALES_TOOLKIT]
    : isAssisted ? ASSISTED_TOOLKIT : SALES_TOOLKIT;

  const groups: NavGroup[] = [
    { label: "", items: OVERVIEW },
    { label: "Leads", items: leadItems },
    { label: "Revenue", items: revenueItems },
    { label: "Toolkit", items: toolkitItems },
  ];

  if (academy.enabled) {
    groups.push({ label: "Academy", items: ACADEMY_NAV });
  }

  groups.push({
    label: "Workspace",
    items: [
      { to: "/partner/support", label: "Support", icon: LifeBuoy },
      { to: "/partner/account", label: "Account", icon: UserCircle },
    ],
  });

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

  const workspaceLabel = isAssisted && !isDual
    ? "Assisted Sales"
    : academy.enabled ? "Academy Workspace" : "Sales Workspace";


  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_240)] text-foreground">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-white/95 backdrop-blur">
        <button
          className="inline-flex items-center gap-2 rounded-md p-2 -ml-2 hover:bg-muted"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <Link to="/" className="font-display text-lg font-semibold tracking-tight">
          glintr
        </Link>
        <div className="flex items-center gap-1">
          <SupportAlert compact />
          <FollowUpAlerts compact />
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150"
        />
      )}

      <div
        className={cn(
          "lg:grid",
          collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[240px_1fr]",
        )}
      >
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col lg:border-r",
            "fixed inset-y-0 left-0 z-50 w-72 border-r shadow-xl transition-[transform,width] duration-200 ease-out lg:shadow-none lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            collapsed ? "lg:w-[72px]" : "lg:w-60",
          )}
        >
          <div className={cn("flex items-center gap-2 border-b", collapsed ? "lg:px-2 lg:py-4 p-5" : "p-5")}>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <Link to="/" className="font-display text-xl font-semibold tracking-tight">
                  glintr
                </Link>
                <div className="mt-0.5 text-caption font-mono uppercase tracking-widest text-primary truncate">
                  {workspaceLabel}
                </div>
              </div>
            )}
            {collapsed && (
              <Link
                to="/"
                className="hidden lg:flex mx-auto size-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-display text-lg font-semibold"
                aria-label="Glintr home"
              >
                g
              </Link>
            )}
            <button
              type="button"
              className="hidden lg:inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-muted"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className={cn("py-4 flex-1 overflow-y-auto", collapsed ? "lg:px-2 px-3" : "px-3")}>
            {partner && !collapsed ? (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-primary/[0.06] via-white to-cyan-50/60 border border-border/60">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
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

            <nav className="space-y-4">
              {groups.map((group, gi) => (
                <div key={gi}>
                  {group.label && !collapsed && (
                    <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
                      {group.label}
                    </div>
                  )}
                  {group.label && collapsed && gi > 0 && (
                    <div className="mx-2 mb-1.5 h-px bg-border/60" aria-hidden />
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item.to, item.label);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to + item.label}
                          to={item.to}
                          title={collapsed ? item.label : undefined}
                          aria-label={collapsed ? item.label : undefined}
                          className={cn(
                            "group relative flex items-center rounded-lg text-sm transition-all duration-150",
                            collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                            active
                              ? "bg-primary/10 text-primary font-medium shadow-[inset_0_0_0_1px_oklch(0.7_0.15_230/0.15)]"
                              : "text-foreground/75 hover:bg-slate-50 hover:text-foreground",
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />
                          )}
                          <Icon
                            className={cn(
                              "size-4 shrink-0 transition-colors",
                              active
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-foreground",
                            )}
                          />
                          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {!academy.enabled && partner && !collapsed && (
              <div className="mt-6 rounded-xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/[0.04] via-white to-emerald-50/40 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
                  Optional Upgrade
                </div>
                <div className="mt-1 font-display text-sm font-semibold tracking-tight">
                  Launch My Own Academy
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Build your own education brand with AI. Website, courses, logo, marketing — generated for you.
                </p>
                <Link
                  to="/partner/launch-academy"
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full"
                >
                  Explore Academy Builder
                </Link>
              </div>
            )}
          </div>


          <div className={cn("py-4 border-t bg-white", collapsed ? "lg:px-2 px-3" : "px-3")}>
            <Button
              variant="outline"
              size="sm"
              className={cn("w-full", collapsed ? "lg:justify-center lg:px-0" : "justify-start")}
              onClick={handleSignOut}
              title={collapsed ? "Logout" : undefined}
              aria-label={collapsed ? "Logout" : undefined}
            >
              <LogOut className="size-4" />
              {!collapsed && "Logout"}
            </Button>
          </div>
        </aside>

        {/* Content */}
        <main className="min-h-screen">
          <div className="hidden lg:flex sticky top-0 z-30 h-14 items-center justify-end gap-2 border-b bg-white/85 backdrop-blur px-6">
            <SupportAlert />
            <FollowUpAlerts />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function FollowUpAlerts({ compact = false }: { compact?: boolean }) {
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
          className={cn(
            "relative inline-flex items-center gap-2 rounded-lg border bg-white text-sm transition-colors hover:bg-slate-50",
            compact ? "p-2" : "px-3 py-1.5",
          )}
          aria-label="Lead reminders"
        >
          <Bell className="size-4" />
          {!compact && <span className="font-medium">{total} Leads Need Attention</span>}
          {total > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold inline-flex items-center justify-center ring-2 ring-white">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Needs Your Attention
        </div>
        <div className="space-y-0.5">
          {items.map((it) => (
            <Link
              key={it.key}
              to="/partner/my-leads"
              search={{ filter: it.key, index: 0 }}
              className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted transition-colors"
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

function SupportAlert({ compact = false }: { compact?: boolean }) {
  const fetchTickets = useServerFn(listMySupportTickets);
  const { data } = useQuery({
    queryKey: ["partner-support-summary"],
    queryFn: () => fetchTickets({ data: {} }),
    refetchInterval: 90_000,
  });
  const s = data?.summary;
  const needsAttention = s?.needsAttention ?? 0;
  const openCount = s?.open ?? 0;
  const showBadge = needsAttention > 0 || openCount > 0;

  return (
    <Link
      to="/partner/support"
      className={cn(
        "relative inline-flex items-center gap-2 rounded-lg border bg-white text-sm transition-colors hover:bg-slate-50",
        compact ? "p-2" : "px-3 py-1.5",
      )}
      aria-label="Support tickets"
    >
      <LifeBuoy className="size-4" />
      {!compact && <span className="font-medium">Support</span>}
      {showBadge && (
        <span
          className={cn(
            "min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-semibold inline-flex items-center justify-center ring-2 ring-white",
            compact && "absolute -top-1 -right-1",
            needsAttention > 0 ? "bg-red-500" : "bg-slate-500",
          )}
        >
          {needsAttention > 0 ? needsAttention : openCount}
        </span>
      )}
    </Link>
  );
}
