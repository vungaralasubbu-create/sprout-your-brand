import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, GraduationCap, FileText, Wrench, Compass, BookMarked, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { listCourses } from "@/lib/programs";
import { listPosts } from "@/lib/blog";
import { searchTools } from "@/data/tools";

type Hit = {
  group: "Programs" | "Blogs" | "AI Tools" | "Career Paths" | "Learning Resources";
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const CAREER_PATHS: Array<{ title: string; href: string; subtitle?: string }> = [
  { title: "AI Engineer", href: "/careers/ai-engineer", subtitle: "Career path" },
  { title: "Data Scientist", href: "/careers/data-scientist", subtitle: "Career path" },
  { title: "Full Stack Developer", href: "/careers/full-stack-developer", subtitle: "Career path" },
  { title: "Product Manager", href: "/careers/product-manager", subtitle: "Career path" },
  { title: "Digital Marketer", href: "/careers/digital-marketer", subtitle: "Career path" },
  { title: "UI/UX Designer", href: "/careers/ui-ux-designer", subtitle: "Career path" },
  { title: "Cybersecurity Analyst", href: "/careers/cybersecurity-analyst", subtitle: "Career path" },
  { title: "Cloud Engineer", href: "/careers/cloud-engineer", subtitle: "Career path" },
];

const LEARNING_RESOURCES: Array<{ title: string; href: string; subtitle: string }> = [
  { title: "Glossary", href: "/glossary", subtitle: "Definitions & concepts" },
  { title: "Topics & Pillar Guides", href: "/topics", subtitle: "Deep-dive learning tracks" },
  { title: "FAQs", href: "/faq", subtitle: "Answers to common questions" },
  { title: "Success Stories", href: "/success-stories", subtitle: "Learner outcomes" },
  { title: "Income Calculator", href: "/income-calculator", subtitle: "Estimate your earnings" },
  { title: "Book a Consultation", href: "/book-consultation", subtitle: "Talk to our team" },
];

function matches(hay: string, q: string) {
  return hay.toLowerCase().includes(q.toLowerCase());
}

export function HeaderSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [hits, setHits] = React.useState<Hit[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
    if (!open) setQ("");
  }, [open]);

  React.useEffect(() => {
    let cancelled = false;
    const term = q.trim();
    if (!term) { setHits([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const [courses, posts] = await Promise.all([
          listCourses({ search: term }).catch(() => []),
          listPosts({ search: term }).catch(() => []),
        ]);
        if (cancelled) return;
        const out: Hit[] = [];
        for (const c of (courses as any[]).slice(0, 5)) {
          out.push({
            group: "Programs",
            title: c.title,
            subtitle: c.short_description ?? c.category?.name,
            href: c.category?.slug && c.slug ? `/programs/${c.category.slug}/${c.slug}` : "/programs",
            icon: GraduationCap,
          });
        }
        for (const p of (posts as any[]).slice(0, 5)) {
          out.push({ group: "Blogs", title: p.title, subtitle: p.excerpt ?? undefined, href: `/blog/${p.slug}`, icon: FileText });
        }
        for (const t of searchTools(term).slice(0, 4)) {
          out.push({ group: "AI Tools", title: t.name, subtitle: t.tagline, href: `/tools/${t.slug}`, icon: Wrench });
        }
        for (const cp of CAREER_PATHS.filter((r) => matches(r.title, term)).slice(0, 4)) {
          out.push({ group: "Career Paths", title: cp.title, subtitle: cp.subtitle, href: cp.href, icon: Compass });
        }
        for (const r of LEARNING_RESOURCES.filter((r) => matches(r.title, term) || matches(r.subtitle, term)).slice(0, 4)) {
          out.push({ group: "Learning Resources", title: r.title, subtitle: r.subtitle, href: r.href, icon: BookMarked });
        }
        setHits(out);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Hit[]>();
    for (const h of hits) {
      const arr = map.get(h.group) ?? [];
      arr.push(h);
      map.set(h.group, arr);
    }
    return Array.from(map.entries());
  }, [hits]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl top-[15%] translate-y-0 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search programs, blogs, career paths, AI tools…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          {loading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!q.trim() ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <p className="mb-3">Try searching for a program, blog, career path, or AI tool.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["ChatGPT", "AI Engineer", "Data Science", "Resume Builder", "70% Revenue"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQ(s)}
                    className="px-2.5 py-1 rounded-full border border-border text-xs hover:bg-accent"
                  >{s}</button>
                ))}
              </div>
            </div>
          ) : grouped.length === 0 && !loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No results for "{q}".</div>
          ) : (
            <div className="flex flex-col gap-3 p-2">
              {grouped.map(([group, items]) => (
                <div key={group}>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground px-2 py-1">{group}</div>
                  <div className="flex flex-col">
                    {items.map((h) => (
                      <a
                        key={h.group + h.href + h.title}
                        href={h.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-accent transition-colors group",
                        )}
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                          <h.icon className="size-4" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold truncate">{h.title}</span>
                          {h.subtitle ? (
                            <span className="block text-xs text-muted-foreground truncate">{h.subtitle}</span>
                          ) : null}
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
