import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Award,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  ChevronDown,
  Clock,
  Cpu,
  Cog,
  FolderKanban,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Rocket,
  Search,
  Settings,
  Sparkles,
  User as UserIcon,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlintrLogo } from "@/components/shared/logo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HeaderSearchDialog } from "@/components/shared/header-search-dialog";
import { openGlintrAI } from "@/lib/glintr-ai";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPathForRole, fetchUserRoles, primaryRole, type AppRole } from "@/lib/auth/role-redirect";
import { cn } from "@/lib/utils";


type MegaItem = {
  label: string;
  description?: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  meta?: string;
};

type NavGroup = { title?: string; items: MegaItem[] };

interface NavEntry {
  label: string;
  href?: string;
  width?: "sm" | "md" | "lg";
  groups?: NavGroup[];
}

const nav: NavEntry[] = [
  {
    label: "Programs",
    width: "lg",
    groups: [
      {
        title: "Program Areas",
        items: [
          { label: "Computer Science", description: "AI, ML, Data, Cloud, Cyber", href: "/programs/computer-science", icon: GraduationCap },
          { label: "Electronics & Electrical", description: "VLSI, IoT, Embedded, Robotics", href: "/programs/electronics-electrical", icon: Cpu },
          { label: "Mechanical Engineering", description: "CAD/CAM, Drones, Product design", href: "/programs/mechanical-engineering", icon: Cog },
          { label: "Management", description: "Marketing, Finance, HR, Analytics", href: "/programs/management", icon: Briefcase },
        ],
      },
      {
        items: [
          { label: "Explore All Programs", description: "Browse the full catalog", href: "/programs", icon: Layers },
        ],
      },
    ],
  },
  {
    label: "Earn With Us",
    width: "lg",
    groups: [
      {
        title: "Revenue Models",
        items: [
          { label: "Become a Sales Partner", description: "Overview of the partner program", href: "/earn", icon: Handshake },
          { label: "Sales Opportunity", description: "For sales professionals — flexible earning", href: "/sales-opportunity", icon: Users, meta: "New" },
          { label: "Own Leads Model", description: "Up to 70% revenue share", href: "/earn#own-leads", icon: Users, meta: "70%" },
          { label: "Supported Sales Model", description: "Company-supported, up to 50%", href: "/earn#supported", icon: Briefcase, meta: "50%" },
        ],
      },
      {
        title: "Tools & Payouts",
        items: [
          { label: "Income Calculator", description: "Estimate your earnings", href: "/#calculator", icon: Calculator },
          { label: "Payout System", description: "48-hour processing workflow", href: "/earn#payouts", icon: Wallet },
        ],
      },
    ],
  },
  {
    label: "Launch Your Brand",
    width: "lg",
    groups: [
      {
        title: "White-Label EdTech",
        items: [
          { label: "Launch Your EdTech Brand", description: "Overview & what's included", href: "/launch-your-brand", icon: Rocket },
          { label: "Start Brand Builder", description: "8-step interactive setup", href: "/launch-your-brand/start", icon: Sparkles },
          { label: "What's Included", description: "LMS, CRM, website, creatives", href: "/launch-your-brand#included", icon: Layers },
        ],
      },
      {
        title: "Support & Timeline",
        items: [
          { label: "Launch Timeline", description: "Under 24-hour eligible setup", href: "/launch-your-brand#pricing", icon: Clock },
          { label: "FAQs", description: "Common brand launch questions", href: "/launch-your-brand#faq", icon: BookOpen },
          { label: "Book Consultation", description: "Talk to our brand team", href: "/launch-your-brand/consultation", icon: Building2 },
        ],
      },
    ],
  },
  { label: "About", href: "/about" },
  {
    label: "More",
    width: "sm",
    groups: [
      {
        items: [
          { label: "Topics", href: "/topics", description: "Pillar guides across AI, tech, engineering, business" },
          { label: "Partner Network", href: "/partner-network" },
          { label: "Success Stories", href: "/success-stories" },
          { label: "Careers", href: "/careers" },
          { label: "Blog", href: "/blog" },
          { label: "FAQs", href: "/faq" },
          { label: "Contact", href: "/contact" },
          { label: "Support", href: "/support" },
        ],
      },
    ],
  },
];


function MegaPanel({ entry }: { entry: NavEntry }) {
  if (!entry.groups) return null;
  const widthCls =
    entry.width === "sm" ? "w-[240px]" : entry.width === "md" ? "w-[420px]" : "w-[640px]";
  return (
    <div
      className={cn(
        "invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0",
        "transition-all duration-200 absolute left-0 top-full pt-3",
        widthCls,
      )}
    >
      <div className="card-elevated p-4 shadow-xl grid gap-4 md:grid-cols-2">
        {entry.groups.map((g, gi) => (
          <div key={gi} className="flex flex-col gap-1">
            {g.title ? (
              <p className="text-label px-2 pb-1">{g.title}</p>
            ) : null}
            {g.items.map((it) => (
              <a
                key={it.label}
                href={it.href}
                className="rounded-lg p-2.5 hover:bg-accent transition-colors flex gap-3 items-start group/item"
              >
                {it.icon ? (
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <it.icon className="size-4" />
                  </span>
                ) : null}
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{it.label}</span>
                    {it.meta ? (
                      <span className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-gradient-brand text-primary-foreground">
                        {it.meta}
                      </span>
                    ) : null}
                  </span>
                  {it.description ? (
                    <span className="block text-caption mt-0.5">{it.description}</span>
                  ) : null}
                </span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

type Session = { userId: string; email: string | null } | null;

function initialsFromEmail(email: string | null | undefined): string {
  if (!email) return "G";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const chars = (parts[0]?.[0] ?? "G") + (parts[1]?.[0] ?? "");
  return chars.toUpperCase().slice(0, 2);
}

function NotificationsBell() {
  const [items, setItems] = React.useState<Array<{ id: string; title: string; message: string | null; read_at: string | null; action_route: string | null; created_at: string }>>([]);
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, count } = await supabase
      .from("student_notifications" as any)
      .select("id, title, message, read_at, action_route, created_at", { count: "exact" })
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(8);
    setItems((data ?? []) as any);
    setUnread(count ?? 0);
  }, []);

  React.useEffect(() => { void load(); }, [load]);
  React.useEffect(() => {
    if (open) void load();
  }, [open, load]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">Notifications</p>
          <a href="/student/notifications" className="text-xs text-primary hover:underline">View all</a>
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground p-6 text-center">You're all caught up.</p>
          ) : items.map((n) => (
            <a
              key={n.id}
              href={n.action_route ?? "/student/notifications"}
              className="block px-4 py-3 hover:bg-accent border-b border-border/60 last:border-0"
            >
              <p className="text-sm font-medium truncate">{n.title}</p>
              {n.message ? <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p> : null}
            </a>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const LOGIN_ROLES: Array<{ label: string; sub: string; href: string; icon: React.ComponentType<{ className?: string }> }> = [
  { label: "Student", sub: "Learners & aspirants", href: "/auth?role=student", icon: GraduationCap },
  { label: "Working Professional", sub: "Upskilling for career growth", href: "/auth?role=working-professional", icon: Briefcase },
  { label: "Partner", sub: "Sales & channel partners", href: "/auth?role=partner", icon: Handshake },
  { label: "Brand Owner", sub: "White-label EdTech operators", href: "/auth?role=brand", icon: Building2 },
];

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [openMobile, setOpenMobile] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Session>(null);
  const [role, setRole] = React.useState<AppRole | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ? { userId: data.session.user.id, email: data.session.user.email ?? null } : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setSession(s ? { userId: s.user.id, email: s.user.email ?? null } : null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    if (!session) { setRole(null); return; }
    fetchUserRoles(session.userId).then((roles) => {
      if (mounted) setRole(primaryRole(roles));
    }).catch(() => { if (mounted) setRole("student"); });
    return () => { mounted = false; };
  }, [session]);

  // ⌘K / Ctrl-K opens search
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const dashboardHref = dashboardPathForRole(role);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const handleOpenAI = () => openGlintrAI({ source: "site-header" });

  return (
    <header
      data-site-header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled ? "surface-glass-strong shadow-sm border-b border-border/60" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 md:px-8 h-16">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <GlintrLogo className="h-8" />
        </Link>
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {nav.map((item) => (
            <div key={item.label} className="relative group">
              {item.href ? (
                <a
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  {item.label}
                </a>
              ) : (
                <button className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  {item.label}
                  <ChevronDown className="size-3.5 opacity-70" />
                </button>
              )}
              <MegaPanel entry={item} />
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-1 ml-auto">
          {/* Search — always visible */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setSearchOpen(true)}
            aria-label="Search Glintr"
            title="Search  (⌘K)"
          >
            <Search className="size-5" />
          </Button>

          {/* GlintrAI — always visible */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-primary hover:text-primary"
            onClick={handleOpenAI}
            aria-label="Ask GlintrAI"
            title="Ask GlintrAI"
          >
            <Sparkles className="size-5" />
          </Button>

          {session ? (
            <>
              <div className="hidden md:block"><NotificationsBell /></div>
              <Button variant="ghost" size="sm" className="hidden lg:inline-flex rounded-full px-3 gap-1.5" asChild>
                <a href={dashboardHref}>
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </a>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/60" aria-label="Profile menu">
                    <Avatar className="size-9 border border-border/60">
                      <AvatarFallback className="bg-gradient-brand text-primary-foreground text-xs font-bold">
                        {initialsFromEmail(session.email)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
                    <span className="text-sm font-semibold truncate">{session.email ?? "My account"}</span>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{role ?? "member"}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><a href={dashboardHref}><LayoutDashboard className="size-4 mr-2" />Dashboard</a></DropdownMenuItem>
                  <DropdownMenuItem asChild><a href="/student/programs"><BookOpen className="size-4 mr-2" />My Courses</a></DropdownMenuItem>
                  <DropdownMenuItem asChild><a href="/student/certificates"><Award className="size-4 mr-2" />Certificates</a></DropdownMenuItem>
                  <DropdownMenuItem asChild><a href="/student/projects"><FolderKanban className="size-4 mr-2" />Projects</a></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><a href="/student/profile"><Settings className="size-4 mr-2" />Settings</a></DropdownMenuItem>
                  <DropdownMenuItem asChild><a href="/student/support"><LifeBuoy className="size-4 mr-2" />Support</a></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="size-4 mr-2" />Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Login menu */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden md:inline-flex rounded-full px-3 gap-1">
                    Log in <ChevronDown className="size-3.5 opacity-70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[320px] p-2">
                  <p className="text-label px-3 pt-1 pb-2">Continue as</p>
                  {LOGIN_ROLES.map((r) => (
                    <a
                      key={r.label}
                      href={r.href}
                      className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-accent transition-colors"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                        <r.icon className="size-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold">{r.label}</span>
                        <span className="block text-caption">{r.sub}</span>
                      </span>
                    </a>
                  ))}
                  <div className="border-t border-border mt-2 pt-2 px-1">
                    <a href="/auth?mode=forgot" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</a>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="sm" className="hidden md:inline-flex rounded-full px-4" asChild>
                <a href="/auth?mode=signup" aria-label="Sign up with mobile OTP">Sign up</a>
              </Button>
            </>
          )}

          {/* Start Earning — primary CTA */}
          <Button
            variant="gradient"
            size="sm"
            className="cta-earn hidden md:inline-flex rounded-full px-4 shadow-[0_10px_30px_-10px_oklch(0.62_0.19_245/0.55)] hover:-translate-y-px"
            asChild
          >
            <a href="/join" aria-label="Start Earning with Glintr">
              <Sparkles className="size-4" />
              <span className="relative z-10">Start Earning</span>
            </a>
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="lg:hidden border-t border-border bg-background max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 flex flex-col gap-1">
            {session ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 mb-2">
                  <Avatar className="size-10 border border-border/60">
                    <AvatarFallback className="bg-gradient-brand text-primary-foreground text-xs font-bold">
                      {initialsFromEmail(session.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{session.email ?? "My account"}</p>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{role ?? "member"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pb-2">
                  <a href={dashboardHref} className="px-3 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center inline-flex items-center justify-center gap-2" onClick={() => setOpen(false)}>
                    <LayoutDashboard className="size-4" /> Dashboard
                  </a>
                  <a href="/student/notifications" className="px-3 py-3 rounded-lg border text-sm font-medium text-center inline-flex items-center justify-center gap-2" onClick={() => setOpen(false)}>
                    <Bell className="size-4" /> Notifications
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2 pb-2 text-sm">
                  <a href="/student/programs" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg border text-center inline-flex items-center justify-center gap-2"><BookOpen className="size-4"/>My Courses</a>
                  <a href="/student/certificates" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg border text-center inline-flex items-center justify-center gap-2"><Award className="size-4"/>Certificates</a>
                  <a href="/student/projects" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg border text-center inline-flex items-center justify-center gap-2"><FolderKanban className="size-4"/>Projects</a>
                  <a href="/student/settings" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg border text-center inline-flex items-center justify-center gap-2"><Settings className="size-4"/>Settings</a>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pb-2">
                <a href="/auth" className="px-3 py-3 rounded-lg border text-sm font-medium text-center" onClick={() => setOpen(false)}>Log in</a>
                <a href="/auth?mode=signup" className="px-3 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center" onClick={() => setOpen(false)}>Sign up</a>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pb-2">
              <button
                onClick={() => { setOpen(false); setSearchOpen(true); }}
                className="px-3 py-2.5 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                <Search className="size-4" /> Search
              </button>
              <button
                onClick={() => { setOpen(false); handleOpenAI(); }}
                className="px-3 py-2.5 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 text-primary"
              >
                <Sparkles className="size-4" /> Ask GlintrAI
              </button>
            </div>

            {nav.map((n) => {
              const isOpen = openMobile === n.label;
              if (n.href && !n.groups) {
                return (
                  <a
                    key={n.label}
                    href={n.href}
                    className="px-3 py-3 rounded-lg hover:bg-accent text-sm font-medium"
                    onClick={() => setOpen(false)}
                  >
                    {n.label}
                  </a>
                );
              }
              return (
                <div key={n.label} className="flex flex-col">
                  <button
                    className="px-3 py-3 rounded-lg hover:bg-accent text-sm font-medium flex items-center justify-between"
                    onClick={() => setOpenMobile(isOpen ? null : n.label)}
                  >
                    {n.label}
                    <ChevronDown
                      className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen && n.groups ? (
                    <div className="pl-3 pb-2 flex flex-col gap-2">
                      {n.groups.map((g, gi) => (
                        <div key={gi}>
                          {g.title ? (
                            <p className="text-label px-2 pt-2 pb-1">{g.title}</p>
                          ) : null}
                          {g.items.map((it) => (
                            <a
                              key={it.label}
                              href={it.href}
                              onClick={() => setOpen(false)}
                              className="px-3 py-2 rounded-lg hover:bg-accent text-sm block"
                            >
                              {it.label}
                              {it.description ? (
                                <span className="block text-caption">{it.description}</span>
                              ) : null}
                            </a>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="grid gap-2 pt-3 border-t border-border mt-2">
              <Button variant="gradient" size="sm" className="cta-earn rounded-full" asChild>
                <a href="/join">
                  <Sparkles className="size-4" />
                  <span className="relative z-10">Start Earning</span>
                </a>
              </Button>
              {session ? (
                <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
                  <LogOut className="size-4" /> Logout
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <HeaderSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

