import { createFileRoute, Outlet, Link, useLocation, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  LayoutDashboard, ShieldCheck, FolderTree, GraduationCap, BookOpen, FileText, Users, UserCheck,
  Shield, Layers, Target, Handshake, Scale, Wallet, RefreshCw, Building2, Rocket, ClipboardList,
  Activity, FileSignature, Bell, Settings, History, Menu, X, LogOut, Search, UserCog,
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

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  perms?: string[]; // any-of permissions required to show
};
type NavGroup = { label: string | null; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: null,
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/sales-command", label: "Sales Command Center", icon: Activity, perms: ["sales_command.view"] },
    ],
  },
  {
    label: "Program Management",
    items: [
      { to: "/admin/categories", label: "Categories", icon: FolderTree, perms: ["programs.view", "programs.manage"] },
      { to: "/admin/courses", label: "Courses", icon: GraduationCap, perms: ["programs.view", "programs.manage"] },
      { to: "/admin/curriculum", label: "Curriculum", icon: BookOpen, perms: ["programs.view", "programs.manage"] },
      { to: "/admin/program-sales-content", label: "Program Sales Content", icon: Target, perms: ["programs.view", "programs.manage"] },
      { to: "/admin/applications", label: "Applications", icon: FileText, perms: ["programs.view", "programs.manage"] },
    ],
  },
  {
    label: "Partner Management",
    items: [
      { to: "/admin/partners", label: "Partners", icon: Users, perms: ["sales_partners.view"] },
      { to: "/admin/partner-applications", label: "Partner Applications", icon: UserCheck, perms: ["sales_partners.view"] },
      { to: "/admin/model-approvals", label: "Model Approvals", icon: Shield, perms: ["sales_partners.manage"] },
      { to: "/admin/partner-programs", label: "Partner Programs", icon: Layers, perms: ["sales_partners.view"] },
      { to: "/admin/partner-reviews", label: "Partner Reviews", icon: UserCheck, perms: ["sales_partners.view"] },
    ],
  },
  {
    label: "Sales Operations",
    items: [
      { to: "/admin/lead-management", label: "Lead Management", icon: Target, perms: ["leads.view"] },
      { to: "/admin/lead-monitoring", label: "Lead Work Monitoring", icon: Activity, perms: ["leads.view"] },
      { to: "/admin/leads", label: "All Leads", icon: Target, perms: ["leads.view"] },
      { to: "/admin/assigned-leads", label: "Assigned Leads", icon: Handshake, perms: ["leads.view"] },
      { to: "/admin/attribution-reviews", label: "Attribution Reviews", icon: Scale, perms: ["lead_ownership.view"] },
      { to: "/admin/lead-ownership", label: "Ownership Reviews", icon: Scale, perms: ["lead_ownership.view"] },
      { to: "/admin/risk-review", label: "Risk Review", icon: Shield, perms: ["risk_review.view"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/admin/revenue", label: "Revenue", icon: Wallet, perms: ["earnings.view"] },
      { to: "/admin/revenue-verification", label: "Revenue Verification", icon: Shield, perms: ["earnings.view"] },
      { to: "/admin/payment-links", label: "Payment Links", icon: FileSignature, perms: ["payment_links.view", "payment_links.manage"] },
      { to: "/admin/payment-verification", label: "Payment Verification", icon: ShieldCheck, perms: ["payments.view"] },
      { to: "/admin/payouts", label: "Payouts", icon: FileText, perms: ["payouts.view"] },
      { to: "/admin/partner-payouts", label: "Partner Payouts", icon: Wallet, perms: ["payouts.view"] },
      { to: "/admin/referral-management", label: "Referral Management", icon: Handshake, perms: ["referrals.view"] },
      { to: "/admin/adjustments", label: "Adjustments", icon: RefreshCw, perms: ["payouts.approve"] },
    ],
  },
  {
    label: "Brand Management",
    items: [
      { to: "/admin/partner-brands", label: "Partner Brands", icon: Building2, perms: ["brands.view"] },
      { to: "/admin/brand-applications", label: "Brand Applications", icon: Building2, perms: ["brands.view"] },
      { to: "/admin/brands", label: "Brands", icon: Rocket, perms: ["brands.view"] },
      { to: "/admin/brand-launch-tasks", label: "Brand Launch Tasks", icon: ClipboardList, perms: ["brands.view"] },
    ],
  },
  {
    label: "HR & Payroll",
    items: [
      { to: "/admin/employees", label: "Employees", icon: Users, perms: ["employment.view"] },
      { to: "/admin/payroll", label: "Payroll", icon: Wallet, perms: ["payroll.view"] },
      { to: "/admin/employment-settings", label: "Attendance Settings", icon: Settings, perms: ["attendance.manage"] },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/admin/support", label: "Support Tickets", icon: Bell, perms: ["support.view"] },
      { to: "/admin/team", label: "Admin Team", icon: UserCog, perms: ["admin_team.view"] },
      { to: "/admin/activity", label: "Admin Activity", icon: History, perms: ["admin_team.view"] },
      { to: "/admin/account", label: "My Account", icon: UserCheck },
      { to: "/admin/settings", label: "Analytics & Settings", icon: Settings, perms: ["system_settings.view"] },
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

  const flat = useMemo(() => filteredNav.flatMap((g) => g.items), [filteredNav]);
  const currentLabel = flat.find((i) => isActive(i.to))?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.004_240)] text-foreground flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-border/70 bg-white transition-transform lg:translate-x-0 lg:static lg:z-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-border/70">
          <Link to="/" className="flex items-center gap-2.5">
            <GlintrLogo className="h-7 w-auto" />
            <div className="leading-none">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">
                {session?.isSuperAdmin ? "Super Admin" : session?.adminUser?.admin_role ? session.adminUser.admin_role.replace(/_/g, " ") : "Admin"}
              </div>
            </div>
          </Link>
          <button className="lg:hidden text-muted-foreground" onClick={() => setOpen(false)} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {filteredNav.map((group, gi) => (
            <div key={gi} className="space-y-1">
              {group.label && (
                <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-[15px]" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-border/70 p-3 space-y-1">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
          >
            <LogOut className="size-[15px]" /> Sign out
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
        <header className="sticky top-0 z-20 h-14 border-b border-border/70 bg-white/85 backdrop-blur px-4 lg:px-8 flex items-center justify-between gap-4">
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
                placeholder="Search partners, courses, applications…"
                className="pl-9 h-9 bg-surface-1/70"
              />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
