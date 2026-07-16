import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Wand2, Eye, BookOpen, Settings2, Globe, Award,
  GraduationCap, Users2, Megaphone, PanelsTopLeft, BarChart3, Sparkles,
  MessageSquare, LifeBuoy, CreditCard, ShieldCheck, Users, LogOut, Menu, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { loadState } from "@/lib/brand-os/storage";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  { label: "", items: [
    { to: "/brand/dashboard", label: "Overview", icon: LayoutDashboard },
  ]},
  { label: "Brand", items: [
    { to: "/brand/setup", label: "Setup Wizard", icon: Wand2 },
    { to: "/brand/preview", label: "Live Preview", icon: Eye },
    { to: "/brand/website", label: "Website Builder", icon: PanelsTopLeft },
    { to: "/brand/domain", label: "Domain & SSL", icon: Globe },
  ]},
  { label: "Academy", items: [
    { to: "/brand/courses", label: "Course Catalogue", icon: BookOpen },
    { to: "/brand/lms", label: "LMS Settings", icon: Settings2 },
    { to: "/brand/certificates", label: "Certificates", icon: Award },
    { to: "/brand/students", label: "Students", icon: GraduationCap },
    { to: "/brand/faculty", label: "Faculty", icon: Users2 },
  ]},
  { label: "Growth", items: [
    { to: "/brand/marketing", label: "Marketing Center", icon: Megaphone },
    { to: "/brand/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/brand/ai-assistant", label: "AI Assistant", icon: Sparkles },
    { to: "/brand/communications", label: "Communications", icon: MessageSquare },
  ]},
  { label: "Workspace", items: [
    { to: "/brand/team", label: "Team & Roles", icon: Users },
    { to: "/brand/security", label: "Security", icon: ShieldCheck },
    { to: "/brand/billing", label: "Billing", icon: CreditCard },
    { to: "/brand/support", label: "Support", icon: LifeBuoy },
  ]},
];

export function BrandShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [brandName, setBrandName] = useState("Your Academy");
  const [plan, setPlan] = useState("growth");

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const sync = () => { const s = loadState(); setBrandName(s.config.brandName); setPlan(s.billing.plan); };
    sync();
    window.addEventListener("brand-os:update", sync);
    return () => window.removeEventListener("brand-os:update", sync);
  }, []);

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_240)] text-foreground">
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-white/95 backdrop-blur">
        <button className="rounded-md p-2 -ml-2 hover:bg-muted" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <Link to="/" className="font-display text-lg font-semibold tracking-tight">glintr</Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary">White Label</span>
      </div>

      {open && (
        <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
      )}

      <div className="lg:grid lg:grid-cols-[264px_1fr]">
        <aside className={cn(
          "bg-white lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col lg:border-r",
          "fixed inset-y-0 left-0 z-50 w-72 border-r shadow-xl transition-transform duration-200 lg:shadow-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}>
          <div className="flex items-center justify-between p-5 border-b">
            <div>
              <Link to="/" className="font-display text-xl font-semibold tracking-tight">glintr</Link>
              <div className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-primary">White Label OS</div>
            </div>
            <button className="lg:hidden p-2 rounded-md hover:bg-muted" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="size-4" />
            </button>
          </div>

          <div className="px-3 py-4 flex-1 overflow-y-auto">
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-primary/[0.06] via-white to-emerald-50/60 border border-border/60">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Brand</div>
              <div className="mt-0.5 font-semibold text-sm truncate">{brandName}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-emerald-600 font-mono">{plan} plan</div>
            </div>

            <nav className="space-y-4">
              {GROUPS.map((group, gi) => (
                <div key={gi}>
                  {group.label && (
                    <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
                      {group.label}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item.to);
                      const Icon = item.icon;
                      return (
                        <Link key={item.to} to={item.to} className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                          active
                            ? "bg-primary/10 text-primary font-medium shadow-[inset_0_0_0_1px_oklch(0.7_0.15_230/0.15)]"
                            : "text-foreground/75 hover:bg-slate-50 hover:text-foreground",
                        )}>
                          {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />}
                          <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                          <span className="flex-1 truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="px-3 py-4 border-t bg-white">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="size-4" /> Logout
            </Button>
          </div>
        </aside>

        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Reusable glass surface for feature pages
export function BrandPageHeader({ eyebrow, title, description, actions }: {
  eyebrow: string; title: string; description?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b bg-white/60 backdrop-blur px-6 py-6 lg:px-10">
      <div className="min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">{eyebrow}</div>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight truncate">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function BrandBody({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-8 lg:px-10 space-y-6">{children}</div>;
}

export function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/70 bg-white/80 backdrop-blur-sm shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] p-5",
      className,
    )}>{children}</div>
  );
}

export function StatCard({ label, value, delta, hint }: {
  label: string; value: string | number; delta?: string; hint?: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta && <span className="font-mono text-emerald-600">{delta}</span>}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </GlassCard>
  );
}
