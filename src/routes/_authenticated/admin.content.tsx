import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Newspaper, BookOpen, GraduationCap, Briefcase, Map,
  MessageSquareQuote, FolderKanban, Trophy, HelpCircle, GitCompare, Route as RouteIcon,
  FolderTree, Tags, Image as ImageIcon, Users, Search, Sparkles, ListChecks, BarChart3, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/content")({
  component: ContentShell,
});

type NavItem = { to: string; label: string; icon: any; exact?: boolean; group?: string };

const NAV: NavItem[] = [
  { to: "/admin/content", label: "Dashboard", icon: LayoutDashboard, exact: true, group: "Overview" },

  { to: "/admin/content/articles", label: "Articles", icon: FileText, group: "Content" },
  { to: "/admin/blogs", label: "Blog", icon: Newspaper, group: "Content" },
  { to: "/admin/content/learn", label: "Learn Guides", icon: BookOpen, group: "Content" },
  { to: "/admin/content/glossary", label: "Glossary", icon: GraduationCap, group: "Content" },
  { to: "/admin/content/career", label: "Career Guides", icon: Briefcase, group: "Content" },
  { to: "/admin/content/roadmaps", label: "Roadmaps", icon: Map, group: "Content" },
  { to: "/admin/content/interviews", label: "Interview Guides", icon: MessageSquareQuote, group: "Content" },
  { to: "/admin/content/projects", label: "Projects", icon: FolderKanban, group: "Content" },
  { to: "/admin/content/case-studies", label: "Case Studies", icon: Trophy, group: "Content" },
  { to: "/admin/content/faqs", label: "FAQs", icon: HelpCircle, group: "Content" },
  { to: "/admin/content/comparisons", label: "Comparisons", icon: GitCompare, group: "Content" },
  { to: "/admin/content/paths", label: "Learning Paths", icon: RouteIcon, group: "Content" },

  { to: "/admin/content/categories", label: "Categories", icon: FolderTree, group: "Taxonomy" },
  { to: "/admin/content/tags", label: "Tags", icon: Tags, group: "Taxonomy" },
  { to: "/admin/content/authors", label: "Authors", icon: Users, group: "Taxonomy" },
  { to: "/admin/content/media", label: "Media Library", icon: ImageIcon, group: "Taxonomy" },

  { to: "/admin/content/seo", label: "SEO", icon: Search, group: "Operations" },
  { to: "/admin/content/ai-writer", label: "AI Writer", icon: Sparkles, group: "Operations" },
  { to: "/admin/content/queue", label: "Publishing Queue", icon: ListChecks, group: "Operations" },
  { to: "/admin/content/analytics", label: "Analytics", icon: BarChart3, group: "Operations" },
  { to: "/admin/content/settings", label: "Settings", icon: Settings, group: "Operations" },
];

function ContentShell() {
  const loc = useLocation();
  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname === to || loc.pathname.startsWith(to + "/");

  return (
    <div className="flex flex-col lg:flex-row gap-6 -m-4 lg:-m-6 min-h-[calc(100vh-3.5rem)]">
      <aside className="lg:w-56 lg:min-w-56 lg:border-r lg:border-border/60 lg:bg-white lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14 p-4 lg:overflow-y-auto">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70 mb-2 px-1">
          Content Studio
        </div>
        <nav className="space-y-3">
          {Array.from(new Set(NAV.map((n) => n.group ?? "Content"))).map((group) => (
            <div key={group} className="space-y-0.5">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 px-2.5 py-1">
                {group}
              </div>
              {NAV.filter((n) => (n.group ?? "Content") === group).map((n) => {
                const Icon = n.icon;
                const active = isActive(n.to, n.exact);
                return (
                  <Link
                    key={n.to}
                    to={n.to as any}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-[15px]" /> {n.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
