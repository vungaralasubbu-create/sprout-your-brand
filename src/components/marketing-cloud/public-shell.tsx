import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CloudLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/cloud/features", label: "Features" },
  { to: "/cloud/solutions", label: "Solutions" },
  { to: "/cloud/templates", label: "Templates" },
  { to: "/cloud/pricing", label: "Pricing" },
  { to: "/cloud/customers", label: "Customers" },
  { to: "/cloud/resources", label: "Resources" },
  { to: "/cloud/blog", label: "Blog" },
  { to: "/cloud/enterprise", label: "Enterprise" },
] as const;

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <CloudLogo />
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to as any}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/cloud/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link to="/cloud/signup">
            <Button size="sm" className="bg-gradient-to-r from-cyan-500 via-sky-500 to-lime-500 text-white shadow-lg shadow-sky-500/20 hover:opacity-90">
              Start Free
            </Button>
          </Link>
        </div>
        <button
          className="rounded-lg border p-2 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-background lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to as any}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 pt-2">
              <Link to="/cloud/login" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/cloud/signup" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  const cols: { title: string; links: { label: string; to: string }[] }[] = [
    {
      title: "Product",
      links: [
        { label: "Features", to: "/cloud/features" },
        { label: "Pricing", to: "/cloud/pricing" },
        { label: "Templates", to: "/cloud/templates" },
        { label: "Enterprise", to: "/cloud/enterprise" },
        { label: "Solutions", to: "/cloud/solutions" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", to: "/cloud/blog" },
        { label: "Customers", to: "/cloud/customers" },
        { label: "Guides", to: "/cloud/resources" },
        { label: "Changelog", to: "/cloud/resources" },
      ],
    },
    {
      title: "Developers",
      links: [
        { label: "API", to: "/cloud/resources" },
        { label: "Docs", to: "/cloud/resources" },
        { label: "Status", to: "/cloud/status" },
        { label: "Security", to: "/cloud/security" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Contact", to: "/cloud/contact" },
        { label: "Privacy", to: "/cloud/privacy" },
        { label: "Terms", to: "/cloud/terms" },
      ],
    },
  ];
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <CloudLogo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The AI Marketing Cloud. Replace your entire marketing stack with one intelligent workspace.
            </p>
            <div className="mt-6 flex gap-3">
              {["X", "in", "IG", "YT"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-semibold uppercase tracking-widest text-foreground">{c.title}</div>
              <ul className="mt-4 space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to as any} className="text-muted-foreground hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} AI Marketing Cloud. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/cloud/privacy">Privacy</Link>
            <Link to="/cloud/terms">Terms</Link>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
