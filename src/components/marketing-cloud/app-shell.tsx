import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  FolderKanban,
  LayoutTemplate,
  Brain,
  Bot,
  Plug,
  BarChart3,
  CreditCard,
  Settings as SettingsIcon,
  Users,
  User,
  LogOut,
  Sparkles,
  Building2,
} from "lucide-react";
import { CloudLogo } from "./logo";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const NAV: { to: string; label: string; icon: any }[] = [
  { to: "/cloud/dashboard", label: "Home", icon: Home },
  { to: "/cloud/projects", label: "Projects", icon: FolderKanban },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/knowledge", label: "Knowledge", icon: Brain },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/agents", label: "AI Agents", icon: Bot },
  { to: "/agency", label: "Agency", icon: Building2 },
  { to: "/cloud/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/cloud/settings", label: "Settings", icon: SettingsIcon },
];

const BOTTOM_NAV: { to: string; label: string; icon: any }[] = [
  { to: "/cloud/team", label: "Team", icon: Users },
  { to: "/cloud/account", label: "Account", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleSignOut = async () => {
    try {
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      navigate({ to: "/cloud" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign out failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-card/40 lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <CloudLogo />
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
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
          <div className="my-3 border-t" />
          {BOTTOM_NAV.map((n) => {
            const Icon = n.icon;
            const active = loc.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
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
        </nav>
        <div className="border-t p-3">
          <Link
            to="/cloud/dashboard"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-cyan-500/10 via-sky-500/10 to-lime-500/10 p-3 text-xs"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <div className="font-semibold">Upgrade to Pro</div>
              <div className="text-muted-foreground">Unlock unlimited generations</div>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
          <CloudLogo />
          <button
            onClick={handleSignOut}
            className="rounded-lg border p-2"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <main className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen">{children}</main>
        {/* Mobile bottom tabs */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-background/95 backdrop-blur lg:hidden">
          {NAV.slice(0, 5).map((n) => {
            const Icon = n.icon;
            const active = loc.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
