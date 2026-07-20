import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles, LayoutDashboard, CalendarDays, Send, BarChart3, Wand2,
  CheckSquare, Palette, Megaphone, FolderOpen, FileText, Settings,
  Search, Bell, Zap, ChevronsUpDown, Plus, ChevronDown, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/admin/marketing-os")({
  component: MarketingOSShell,
});

const NAV: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin/marketing-os", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/marketing-os/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/marketing-os/planner", label: "Planner", icon: Wand2 },
  { to: "/admin/marketing-os/content", label: "Content", icon: FileText },
  { to: "/admin/marketing-os/approvals", label: "Approval", icon: CheckSquare },
  { to: "/admin/marketing-os/publisher", label: "Publisher", icon: Send },
  { to: "/admin/marketing-os/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/marketing-os/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/marketing-os/brand-kit", label: "Brand Kit", icon: Palette },
  { to: "/admin/marketing-os/media-library", label: "Media Library", icon: FolderOpen },
  { to: "/admin/marketing-os/seo-hub", label: "SEO Hub", icon: TrendingUp },
];

function MarketingOSShell() {
  const loc = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname === to || loc.pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Left Sidebar 280px */}
      <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-border/60 bg-white flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-border/60">
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-white grid place-items-center shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Enterprise</div>
            <div className="font-semibold tracking-tight truncate">Marketing OS</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <div className="px-2 pt-2 pb-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Workspace</div>
          {NAV.map((item) => {
            const active = isActive(item.to, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as unknown as "/admin/marketing-os"}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 px-2 pb-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">System</div>
          <Link
            to={"/admin/marketing-os/settings" as unknown as "/admin/marketing-os"}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <Settings className="size-4 shrink-0" />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-border/60">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Zap className="size-3.5 text-primary" />
              <span>Generation credits</span>
            </div>
            <div className="mt-1 text-2xl font-semibold">4,820</div>
            <div className="text-[11px] text-muted-foreground">of 10,000 · resets Aug 1</div>
            <div className="mt-2 h-1.5 rounded-full bg-primary/10 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "48%" }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Right column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Navigation */}
        <header className="sticky top-0 z-20 h-16 border-b border-border/60 bg-white/80 backdrop-blur flex items-center gap-3 px-4 lg:px-6">
          <div className="relative w-full max-w-[450px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns, posts, assets, leads…"
              className="pl-9 h-10 bg-muted/40 border-transparent focus-visible:bg-white"
            />
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-primary/5 text-xs">
            <Zap className="size-3.5 text-primary" />
            <span className="font-mono text-muted-foreground">Credits</span>
            <span className="font-semibold text-foreground">4,820</span>
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
                <div className="size-5 rounded bg-gradient-to-br from-primary to-primary/60" />
                <span className="max-w-[140px] truncate">Glintr Academy</span>
                <ChevronsUpDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuItem>Glintr Academy</DropdownMenuItem>
              <DropdownMenuItem>Glintr Partners</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Manage workspaces</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1.5 shadow-sm">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Create</span>
                <ChevronDown className="size-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/marketing-os/campaigns" })}>
                <Megaphone className="size-4 mr-2" /> New Campaign
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/marketing-os/planner" })}>
                <Wand2 className="size-4 mr-2" /> AI Plan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/marketing-os/calendar" })}>
                <CalendarDays className="size-4 mr-2" /> Schedule Post
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/marketing-os/media-library" })}>
                <FolderOpen className="size-4 mr-2" /> Upload Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-semibold">
                    GA
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
