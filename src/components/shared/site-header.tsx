import * as React from "react";
import { Menu, Search, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlintrLogo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; description?: string; href: string }[];
}

const defaultNav: NavItem[] = [
  {
    label: "Solutions",
    href: "#",
    children: [
      { label: "Sales Partner Program", description: "Earn 70% with your own leads", href: "#" },
      { label: "Company Leads", description: "Sell using our lead pipeline, keep 50%", href: "#" },
      { label: "White-Label EdTech", description: "Launch your brand in 24 hours", href: "#" },
    ],
  },
  { label: "Courses", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Resources", href: "#" },
];

export function SiteHeader({ nav = defaultNav }: { nav?: NavItem[] }) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled ? "surface-glass-strong shadow-sm" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-6 px-6 md:px-8 h-16">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <GlintrLogo className="h-8" />
        </a>
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {nav.map((item) => (
            <div key={item.label} className="relative group">
              <button className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </button>
              {item.children ? (
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute left-0 top-full pt-2 w-[380px]">
                  <div className="card-elevated p-3 flex flex-col gap-1 shadow-xl">
                    {item.children.map((c) => (
                      <a
                        key={c.label}
                        href={c.href}
                        className="rounded-lg p-3 hover:bg-accent transition-colors flex flex-col gap-0.5"
                      >
                        <span className="text-sm font-semibold">{c.label}</span>
                        {c.description ? (
                          <span className="text-caption">{c.description}</span>
                        ) : null}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" aria-label="Search" className="hidden md:inline-flex">
            <Search className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:inline-flex">
            Sign in
          </Button>
          <Button variant="gradient" size="sm" className="hidden md:inline-flex">
            <Sparkles className="size-4" />
            Get started
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>
      {open ? (
        <div className="md:hidden border-t border-border bg-background">
          <div className="p-4 flex flex-col gap-1">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="px-3 py-3 rounded-lg hover:bg-accent text-sm font-medium"
              >
                {n.label}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border mt-2">
              <Button variant="outline" size="sm">Sign in</Button>
              <Button variant="gradient" size="sm">Get started</Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
