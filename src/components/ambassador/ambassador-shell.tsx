import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Users, GraduationCap, Wallet, ScrollText,
  Sparkles, UserCircle, LifeBuoy, Menu, X, Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/ambassador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ambassador/dashboard", label: "My Referrals", icon: Users, soon: true },
  { to: "/ambassador/dashboard", label: "Enrollments", icon: GraduationCap, soon: true },
  { to: "/ambassador/dashboard", label: "Earnings", icon: Wallet, soon: true },
  { to: "/ambassador/dashboard", label: "Commission Structure", icon: ScrollText, soon: true },
  { to: "/ambassador/dashboard", label: "Marketing Resources", icon: Sparkles, soon: true },
  { to: "/campus-ambassador/status", label: "My Profile", icon: UserCircle },
  { to: "/ambassador/dashboard", label: "Support", icon: LifeBuoy, soon: true },
] as const;

export function AmbassadorShell({ children }: { children?: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white/95 backdrop-blur border-b px-4 h-14">
        <Link to="/ambassador/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-500 to-emerald-400 grid place-items-center text-white">
            <Compass className="h-4 w-4" />
          </div>
          <div className="font-display font-semibold">Ambassador</div>
        </Link>
        <button className="p-2" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr] min-h-dvh">
        <aside
          className={cn(
            "bg-white border-r p-4 flex flex-col gap-1",
            "lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto",
            open ? "block" : "hidden lg:block",
          )}
        >
          <div className="hidden lg:flex items-center gap-2 mb-6 pt-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-emerald-400 grid place-items-center text-white">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display font-semibold leading-tight">Glintr</div>
              <div className="text-[11px] text-slate-500 leading-tight">Campus Ambassador</div>
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-2 mb-1 px-2">
            Ambassador
          </div>

          {NAV.map((item) => {
            const active = path === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition",
                  active
                    ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-slate-900 border border-blue-100 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {("soon" in item && item.soon) && (
                  <span className="text-[9px] uppercase tracking-widest text-slate-400">Soon</span>
                )}
              </Link>
            );
          })}

          <div className="mt-auto pt-6 text-[11px] text-slate-400 px-2">
            Represent Glintr on your campus.
          </div>
        </aside>

        <main className="min-w-0">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
