import { createFileRoute, Outlet, Link, useLocation, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  LayoutDashboard, Activity, Users, UserCheck, Target, Scale, ShieldCheck, FileSignature, Wallet,
  Handshake, Building2, Bell, Shield, GraduationCap, FolderTree, BookOpen, ClipboardList,
  History, Settings, UserCog, Menu, X, LogOut, Search, ChevronDown, Sparkles, Server, Eye, Rocket,
  MessageSquare, HelpCircle,
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { GlintrLogo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { useAdminSession, hasAnyPermission } from "@/hooks/use-admin-permissions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!data) throw redirect({ to: "/" });
  },
  component: AdminShell,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; perms?: string[]; hash?: string };
type NavGroup = { key: string; label: string | null; items: NavItem[]; collapsible?: boolean };

const NAV: NavGroup[] = [
  {
    key: "overview",
    label: "Overview",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/sales-command", label: "Sales Command Center", icon: Activity, perms: ["sales_command.view"] },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    collapsible: true,
    items: [
      { to: "/admin/partners", label: "Sales Partners", icon: Users, perms: ["sales_partners.view"] },
      { to: "/admin/partner-applications", label: "Partner Applications", icon: UserCheck, perms: ["sales_partners.view"] },
      { to: "/admin/lead-management", label: "Lead Management", icon: Target, perms: ["leads.view"] },
      { to: "/admin/lead-ownership", label: "Lead Ownership Review", icon: Scale, perms: ["lead_ownership.view"] },
      { to: "/admin/payment-verification", label: "Payment Verification", icon: ShieldCheck, perms: ["payments.view"] },
      { to: "/admin/payment-links", label: "Payment Links", icon: FileSignature, perms: ["payment_links.view", "payment_links.manage"] },
      { to: "/admin/payments", label: "Course Payments", icon: ShieldCheck, perms: ["payments.view"] },
      { to: "/admin/partner-payouts", label: "Partner Payouts", icon: Wallet, perms: ["payouts.view"] },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    collapsible: true,
    items: [
      { to: "/admin/referral-management", label: "Referral Management", icon: Handshake, perms: ["referrals.view"] },
      { to: "/admin/partner-brands", label: "Brand Management", icon: Building2, perms: ["brands.view"] },
      { to: "/admin/support", label: "Support Tickets", icon: Bell, perms: ["support.view"] },
      { to: "/admin/risk-review", label: "Risk Review", icon: Shield, perms: ["risk_review.view"] },
    ],
  },
  {
    key: "payments",
    label: "Payments",
    collapsible: true,
    items: [
      { to: "/admin/payments/gateway", label: "Payment Gateway", icon: ShieldCheck },
      { to: "/admin/payments/gateway", label: "Payment Accounts", icon: Wallet, hash: "accounts" },
      { to: "/admin/payment-verification", label: "Payment Verification", icon: ShieldCheck },
      { to: "/admin/payments", label: "Transactions", icon: FileSignature },
      { to: "/admin/payments", label: "Reports", icon: Activity, hash: "reports" },
      { to: "/admin/payments/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    key: "content",
    label: "Content Studio",
    collapsible: true,
    items: [
      { to: "/admin/content", label: "Content Dashboard", icon: BookOpen },
      { to: "/admin/blogs", label: "Blog CMS", icon: BookOpen },
      { to: "/admin/blog-os", label: "Blog OS", icon: Sparkles },
      { to: "/admin/ai-content", label: "AI Content Factory", icon: Sparkles },
      { to: "/admin/keyword-research", label: "Keyword Research", icon: Search },
      { to: "/admin/reviews", label: "Reviews & Success", icon: Sparkles },
      { to: "/admin/career-hub", label: "Career Hub", icon: Rocket },
      { to: "/admin/community", label: "Community Mod", icon: MessageSquare },
      { to: "/admin/knowledge-base", label: "Knowledge Base", icon: HelpCircle },

      { to: "/admin/content-intelligence", label: "Content Intelligence", icon: Activity },
      { to: "/admin/content-authority", label: "Content Authority", icon: ShieldCheck },
      { to: "/admin/marketing-os", label: "Marketing OS", icon: Sparkles },
    ],
  },
  {
    key: "programs",
    label: "Programs",
    collapsible: true,
    items: [
      { to: "/admin/categories", label: "Categories", icon: FolderTree, perms: ["programs.view", "programs.manage"] },
      { to: "/admin/courses", label: "Courses", icon: GraduationCap, perms: ["programs.view", "programs.manage"] },
      { to: "/admin/program-sales-content", label: "Sales Content", icon: BookOpen, perms: ["programs.view", "programs.manage"] },
    ],
  },
  {
    key: "employment",
    label: "Employment",
    collapsible: true,
    items: [
      { to: "/admin/employees", label: "Employees", icon: Users, perms: ["employment.view"] },
      { to: "/admin/employment-settings", label: "Attendance", icon: ClipboardList, perms: ["attendance.manage"] },
      { to: "/admin/payroll", label: "Payroll", icon: Wallet, perms: ["payroll.view"] },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    collapsible: true,
    items: [
      { to: "/admin/team", label: "Admin Team", icon: UserCog, perms: ["admin_team.view"] },
      { to: "/admin/preview", label: "Preview as User", icon: Eye },
      { to: "/admin/activity", label: "Admin Activity", icon: History, perms: ["admin_team.view"] },
      { to: "/admin/infrastructure", label: "Infrastructure", icon: Server, perms: ["system_settings.view"] },
      { to: "/admin/aios", label: "AIOS", icon: Sparkles, perms: ["system_settings.view"] },
      { to: "/admin/ai-agents", label: "AI Agents", icon: Sparkles, perms: ["system_settings.view"] },
      { to: "/admin/voice-ai", label: "Voice AI", icon: Sparkles, perms: ["system_settings.view"] },
      { to: "/admin/live", label: "Live Classroom", icon: Sparkles, perms: ["system_settings.view"] },
      { to: "/admin/live-classes", label: "Zoom LMS · Live Classes", icon: Sparkles, perms: ["system_settings.view"] },
      { to: "/admin/automation", label: "Automation Studio", icon: Sparkles, perms: ["system_settings.view"] },
      { to: "/admin/workflows", label: "Workflows", icon: Sparkles, perms: ["system_settings.view"] },
      { to: "/admin/social-accounts", label: "Social Accounts", icon: Sparkles, perms: ["system_settings.view"] },
      { to: "/admin/settings", label: "Settings", icon: Settings, perms: ["system_settings.view"] },

    ],
  },
  {
    key: "account",
    label: "Account",
    items: [
      { to: "/admin/account", label: "Account", icon: UserCheck },
    ],
  },
];

function AdminShell() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = useAdminSession();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/admin/dashboard" && location.pathname.startsWith(to + "/"));

  const filteredNav = useMemo(() => {
    return NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.perms || hasAnyPermission(session, item.perms)),
    })).filter((group) => group.items.length > 0);
  }, [session]);

  // Collapsible group state — default open, keep active-group open
  const activeGroupKey = useMemo(
    () => filteredNav.find((g) => g.items.some((i) => isActive(i.to)))?.key,
    [filteredNav, location.pathname],
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const isGroupOpen = (g: NavGroup) => (g.collapsible ? !(collapsed[g.key] ?? false) : true);
  const toggleGroup = (key: string) =>
    setCollapsed((s) => ({ ...s, [key]: !(s[key] ?? false) }));

  const flat = useMemo(() => filteredNav.flatMap((g) => g.items), [filteredNav]);
  const currentLabel = flat.find((i) => isActive(i.to))?.label ?? "Admin";

  const roleLabel = session?.isSuperAdmin
    ? "Super Admin"
    : session?.adminUser?.admin_role
    ? String(session.adminUser.admin_role).replace(/_/g, " ")
    : "Admin";

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.006_240)] text-foreground flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[264px] border-r border-border/60 bg-white transition-transform lg:translate-x-0 lg:static lg:z-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/60">
          <Link to="/" className="flex items-center gap-2.5">
            <GlintrLogo className="h-7 w-auto" />
            <div className="leading-none">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary capitalize">
                {roleLabel}
              </div>
            </div>
          </Link>
          <button className="lg:hidden text-muted-foreground" onClick={() => setOpen(false)} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3 scrollbar-thin">
          {filteredNav.map((group) => {
            const groupActive = group.key === activeGroupKey;
            const opened = isGroupOpen(group) || groupActive;
            return (
              <div key={group.key} className="space-y-0.5">
                {group.label && (
                  group.collapsible ? (
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-[0.16em] transition-colors",
                        groupActive ? "text-primary" : "text-muted-foreground/70 hover:text-foreground",
                      )}
                    >
                      <span>{group.label}</span>
                      <ChevronDown className={cn("size-3 transition-transform", opened ? "" : "-rotate-90")} />
                    </button>
                  ) : (
                    <div className={cn(
                      "px-2 py-1 text-[10px] font-mono uppercase tracking-[0.16em]",
                      groupActive ? "text-primary" : "text-muted-foreground/70",
                    )}>
                      {group.label}
                    </div>
                  )
                )}
                <div
                  className={cn(
                    "space-y-0.5 overflow-hidden transition-[max-height,opacity] duration-200",
                    opened ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  {group.items.map((item) => {
                    const active = isActive(item.to);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={`${item.to}#${item.hash ?? ""}:${item.label}`}
                        to={item.to as any}
                        hash={item.hash as any}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                        )}
                      >
                        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />}
                        <Icon className="size-[15px]" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-2.5">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground hover:bg-surface-2/60 hover:text-foreground transition-colors"
          >
            <LogOut className="size-[15px]" /> Logout
          </button>
        </div>
      </aside>

      {open && (
        <button
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-14 border-b border-border/60 bg-white/90 backdrop-blur px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground hidden sm:block">
              Admin
            </div>
            <span className="text-muted-foreground/60 hidden sm:inline">/</span>
            <h1 className="font-display font-semibold text-[15px] truncate">{currentLabel}</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 max-w-md flex-1">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search partner, lead, UTR, ticket…"
                className="pl-9 h-9 bg-surface-1/70"
              />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
