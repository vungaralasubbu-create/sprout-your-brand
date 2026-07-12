import * as React from "react";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  BookOpen,
  Users,
  Wallet,
  BarChart3,
  Award,
  Settings,
  Sparkles,
  Search,
  Command,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlintrLogo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: string;
  href?: string;
}

export interface DashboardNavGroup {
  label?: string;
  items: DashboardNavItem[];
}

export const defaultAdminNav: DashboardNavGroup[] = [
  {
    items: [
      { label: "Overview", icon: LayoutDashboard, active: true },
      { label: "Courses", icon: BookOpen, badge: "128" },
      { label: "Partners", icon: Users },
      { label: "Revenue", icon: Wallet },
      { label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Certificates", icon: Award },
      { label: "Settings", icon: Settings },
    ],
  },
];

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  role?: string;
  nav?: DashboardNavGroup[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({
  title,
  subtitle,
  role = "Admin",
  nav = defaultAdminNav,
  actions,
  children,
  className,
}: DashboardShellProps) {
  return (
    <div className={cn("flex min-h-[720px] w-full bg-surface rounded-2xl border border-border overflow-hidden", className)}>
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border">
          <GlintrLogo />
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-5 overflow-y-auto scrollbar-thin">
          {nav.map((group, i) => (
            <div key={i} className="flex flex-col gap-1">
              {group.label ? <p className="text-label px-3 mb-1">{group.label}</p> : null}
              {group.items.map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all w-full",
                    item.active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={cn(
                        "text-[11px] font-semibold rounded-full px-1.5 py-0.5",
                        item.active ? "bg-white/25 text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-xl bg-gradient-brand p-4 text-primary-foreground">
            <Sparkles className="size-4 mb-2" />
            <p className="text-sm font-semibold">Upgrade to Scale</p>
            <p className="text-xs opacity-90 mt-0.5">Unlock unlimited seats & white-label.</p>
            <Button size="sm" variant="secondary" className="mt-3 w-full">Upgrade</Button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center gap-3 px-5 bg-background">
          <div className="relative hidden md:flex items-center flex-1 max-w-md">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <Input placeholder="Search courses, partners, students..." className="pl-9 pr-16" />
            <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              <Command className="size-3" />K
            </kbd>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger animate-pulse-ring" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border ml-1">
              <Avatar className="size-8">
                <AvatarFallback>AK</AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-xs font-semibold">Aditi Kumar</span>
                <span className="text-[10px] text-muted-foreground">{role}</span>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </div>
          </div>
        </header>
        <div className="px-6 py-5 border-b border-border flex flex-wrap items-end justify-between gap-4 bg-background">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-dashboard-title">{title}</h1>
              <Badge variant="primary">{role}</Badge>
            </div>
            {subtitle ? <p className="text-caption mt-1">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        <div className="flex-1 p-6 overflow-y-auto scrollbar-thin bg-background">{children}</div>
      </div>
    </div>
  );
}
