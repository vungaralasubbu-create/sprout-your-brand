import { createFileRoute, Outlet, Link, useLocation, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, FolderTree, GraduationCap, FileText, LogOut, Menu, X, Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!data) throw redirect({ to: "/" });
  },
  component: AdminShell,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/courses", label: "Courses", icon: GraduationCap },
  { to: "/admin/applications", label: "Applications", icon: FileText },
] as const;

function AdminShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-surface-1 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-background transition-transform lg:translate-x-0 lg:static lg:z-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2"><Logo className="h-7 w-auto" /></Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X className="size-5" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-3 right-3 space-y-1">
          <div className="px-3 py-2 text-caption rounded-lg bg-surface-2/60 flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" /> Admin console
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <h1 className="font-display font-semibold text-lg">Admin</h1>
          </div>
          <div className="text-caption">Glintr CMS</div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
