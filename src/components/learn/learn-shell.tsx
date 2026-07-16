import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Bookmark,
  Clock,
  Compass,
  GraduationCap,
  History,
  LayoutGrid,
  Library,
  Map,
  Menu,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { collections, topics, articles } from "@/data/learn";

const LEARN_STORE = "glintr.learn.bookmarks";
const RECENT_STORE = "glintr.learn.recent";

/* -------------------------- bookmarks / recent utilities ------------------------- */

export function getLearnBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LEARN_STORE) ?? "[]");
  } catch {
    return [];
  }
}
export function toggleLearnBookmark(slug: string): string[] {
  const list = getLearnBookmarks();
  const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
  try {
    localStorage.setItem(LEARN_STORE, JSON.stringify(next));
  } catch {}
  return next;
}
export function trackLearnRecent(slug: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_STORE) ?? "[]") as string[];
    const next = [slug, ...raw.filter((s) => s !== slug)].slice(0, 8);
    localStorage.setItem(RECENT_STORE, JSON.stringify(next));
  } catch {}
}
export function getLearnRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_STORE) ?? "[]");
  } catch {
    return [];
  }
}

/* --------------------------------- Sidebar --------------------------------- */

export function LearnSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [bookmarks, setBookmarks] = React.useState<string[]>([]);
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => {
    setBookmarks(getLearnBookmarks());
    setRecent(getLearnRecent());
  }, [pathname]);

  const bookmarkArticles = bookmarks
    .map((s) => articles.find((a) => a.slug === s))
    .filter(Boolean);
  const recentArticles = recent
    .map((s) => articles.find((a) => a.slug === s))
    .filter(Boolean);

  return (
    <nav
      aria-label="Glintr Learn navigation"
      className="flex h-full flex-col gap-8 overflow-y-auto px-5 py-6 text-sm"
    >
      <SidebarGroup label="Explore" icon={Compass}>
        <SidebarLink to="/learn" active={pathname === "/learn"} label="Home" onNavigate={onNavigate} />
        <SidebarLink to="/learn/topics" active={pathname === "/learn/topics"} label="All Topics" onNavigate={onNavigate} />
        <SidebarLink to="/learn/paths" active={pathname === "/learn/paths"} label="Learning Paths" onNavigate={onNavigate} />
        <SidebarLink to="/learn/glossary" active={pathname.startsWith("/glossary")} external label="Glossary" onNavigate={onNavigate} />
      </SidebarGroup>

      <SidebarGroup label="Collections" icon={Library}>
        {collections.map((c) => (
          <SidebarLink
            key={c.slug}
            to={`/learn/collections/${c.slug}`}
            active={pathname === `/learn/collections/${c.slug}`}
            label={c.name}
            onNavigate={onNavigate}
          />
        ))}
      </SidebarGroup>

      <SidebarGroup label="Popular Guides" icon={Sparkles}>
        {articles
          .filter((a) => a.featured)
          .slice(0, 6)
          .map((a) => (
            <SidebarLink
              key={a.slug}
              to={`/learn/${a.slug}`}
              active={pathname === `/learn/${a.slug}`}
              label={a.title}
              onNavigate={onNavigate}
            />
          ))}
      </SidebarGroup>

      <SidebarGroup label="Bookmarks" icon={Bookmark}>
        {bookmarkArticles.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">
            Bookmark a guide to keep it here.
          </p>
        ) : (
          bookmarkArticles.map((a) => (
            <SidebarLink
              key={a!.slug}
              to={`/learn/${a!.slug}`}
              active={pathname === `/learn/${a!.slug}`}
              label={a!.title}
              onNavigate={onNavigate}
            />
          ))
        )}
      </SidebarGroup>

      <SidebarGroup label="Recently Viewed" icon={History}>
        {recentArticles.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">Your recent guides will appear here.</p>
        ) : (
          recentArticles.map((a) => (
            <SidebarLink
              key={a!.slug}
              to={`/learn/${a!.slug}`}
              active={pathname === `/learn/${a!.slug}`}
              label={a!.title}
              onNavigate={onNavigate}
            />
          ))
        )}
      </SidebarGroup>
    </nav>
  );
}

function SidebarGroup({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({
  to,
  label,
  active,
  external,
  onNavigate,
}: {
  to: string;
  label: string;
  active?: boolean;
  external?: boolean;
  onNavigate?: () => void;
}) {
  const cls = cn(
    "block truncate rounded-md px-2 py-1.5 text-sm transition-colors",
    active ? "bg-primary/10 font-semibold text-primary" : "text-foreground/70 hover:bg-muted/50 hover:text-foreground",
  );
  if (external) {
    return (
      <a href={to} className={cls} onClick={onNavigate}>
        {label}
      </a>
    );
  }
  return (
    <Link to={to} className={cls} onClick={onNavigate}>
      {label}
    </Link>
  );
}

/* --------------------------------- Search --------------------------------- */

type SearchHit = { kind: string; label: string; sublabel: string; href: string };

function buildSearchIndex(): SearchHit[] {
  const items: SearchHit[] = [];
  articles.forEach((a) =>
    items.push({
      kind: "Learn Guide",
      label: a.title,
      sublabel: a.subtitle,
      href: `/learn/${a.slug}`,
    }),
  );
  topics.forEach((t) =>
    items.push({
      kind: "Topic",
      label: t.name,
      sublabel: t.tagline,
      href: `/learn/topics#${t.slug}`,
    }),
  );
  collections.forEach((c) =>
    items.push({
      kind: "Collection",
      label: c.name,
      sublabel: c.description,
      href: `/learn/collections/${c.slug}`,
    }),
  );
  return items;
}

export function LearnSearch({
  autoFocus,
  onNavigate,
  large,
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
  large?: boolean;
}) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const index = React.useMemo(buildSearchIndex, []);
  const results = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return index
      .filter(
        (h) =>
          h.label.toLowerCase().includes(query) ||
          h.sublabel.toLowerCase().includes(query),
      )
      .slice(0, 10);
  }, [q, index]);

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "flex items-center gap-3 rounded-full border border-border/70 bg-background px-4 shadow-[0_1px_0_hsl(var(--border))]",
          large ? "h-14" : "h-11",
        )}
      >
        <Search className="size-4 text-muted-foreground" />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search programs, glossary, learn guides, comparisons…"
          className={cn(
            "flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
            large ? "text-base" : "text-sm",
          )}
          aria-label="Search Glintr Learn"
        />
        {q ? (
          <button onClick={() => setQ("")} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      {open && results.length > 0 ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border bg-background shadow-2xl">
          <ul className="max-h-96 overflow-y-auto py-2">
            {results.map((r) => (
              <li key={r.href}>
                <Link
                  to={r.href}
                  onClick={onNavigate}
                  className="flex flex-col gap-0.5 px-4 py-2.5 hover:bg-muted/60"
                >
                  <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {r.kind}
                  </span>
                  <span className="text-sm font-medium">{r.label}</span>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {r.sublabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------- Shell --------------------------------- */

export function LearnShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-16 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 md:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden"
            aria-label="Open Learn navigation"
          >
            <Menu className="size-5" />
          </Button>
          <Link
            to="/learn"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span className="grid size-7 place-items-center rounded-md bg-gradient-brand text-primary-foreground">
              <BookOpen className="size-4" />
            </span>
            Glintr Learn
          </Link>
          <nav className="hidden items-center gap-4 pl-6 text-sm text-muted-foreground md:flex">
            <Link to="/learn/topics" className="hover:text-foreground">Topics</Link>
            <Link to="/learn/paths" className="hover:text-foreground">Paths</Link>
            <Link to="/learn/collections/ai" className="hover:text-foreground">Collections</Link>
            <a href="/glossary" className="hover:text-foreground">Glossary</a>
          </nav>
          <div className="ml-auto hidden max-w-md flex-1 md:block">
            <LearnSearch />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-[8.5rem] hidden h-[calc(100vh-8.5rem)] shrink-0 border-r lg:block">
          <LearnSidebar />
        </aside>

        {/* Content */}
        <div className="min-w-0">{children}</div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">Glintr Learn</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                <X className="size-5" />
              </Button>
            </div>
            <div className="border-b p-4">
              <LearnSearch onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="flex-1 overflow-y-auto">
              <LearnSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------- helpers used in pages ---------------------- */

export const learnIconMap = {
  BookOpen,
  Bookmark,
  Clock,
  Compass,
  GraduationCap,
  History,
  LayoutGrid,
  Library,
  Map,
  Menu,
  Search,
  Sparkles,
  X,
};
