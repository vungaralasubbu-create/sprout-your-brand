import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { CloudLogo } from "./logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/cloud/features", label: "Features" },
  { to: "/cloud/pricing", label: "Pricing" },
  { to: "/cloud/templates", label: "Templates" },
  { to: "/cloud/blog", label: "Blog" },
  { to: "/cloud/contact", label: "Contact" },
] as const;

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <CloudLogo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to as any}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/cloud/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/cloud/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
        <button
          className="rounded-lg border p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-background md:hidden">
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
                  Sign in
                </Button>
              </Link>
              <Link to="/cloud/signup" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full">
                  Start free
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
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <CloudLogo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Generate complete marketing campaigns with AI.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              ["/cloud/features", "Features"],
              ["/cloud/pricing", "Pricing"],
              ["/cloud/templates", "Templates"],
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              ["/cloud/blog", "Blog"],
              ["/cloud/contact", "Contact"],
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              ["/cloud/privacy", "Privacy"],
              ["/cloud/terms", "Terms"],
            ]}
          />
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} AI Marketing Cloud. All rights reserved.</div>
          <div>Made for teams shipping campaigns fast.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link
              to={to as any}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
