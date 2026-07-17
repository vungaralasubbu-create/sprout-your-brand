import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  ChevronDown,
  Clock,
  Cpu,
  Cog,
  GraduationCap,
  Handshake,
  Layers,
  Menu,
  Rocket,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlintrLogo } from "@/components/shared/logo";
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

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [openMobile, setOpenMobile] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<{ email: string | null } | null>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => {
        if (mounted) setSession(data.session ? { email: data.session.user.email ?? null } : null);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        if (mounted) setSession(s ? { email: s.user.email ?? null } : null);
      });
      return () => sub.subscription.unsubscribe();
    });
    return () => { mounted = false; };
  }, []);

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
        <div className="flex items-center gap-2 ml-auto">
          {session ? (
            <Button variant="ghost" size="sm" className="hidden md:inline-flex rounded-full px-4" asChild>
              <a href="/student/dashboard">My Dashboard</a>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex rounded-full px-4" asChild>
                <a href="/auth">Log in</a>
              </Button>
              <Button variant="outline" size="sm" className="hidden md:inline-flex rounded-full px-4" asChild>
                <a href="/auth?mode=signup">Sign up</a>
              </Button>
            </>
          )}
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
              <a href="/student/dashboard" className="px-3 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center" onClick={() => setOpen(false)}>My Dashboard</a>
            ) : (
              <div className="grid grid-cols-2 gap-2 pb-2">
                <a href="/auth" className="px-3 py-3 rounded-lg border text-sm font-medium text-center" onClick={() => setOpen(false)}>Log in</a>
                <a href="/auth?mode=signup" className="px-3 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center" onClick={() => setOpen(false)}>Sign up</a>
              </div>
            )}
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
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
