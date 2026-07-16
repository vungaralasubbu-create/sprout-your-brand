import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { listMyPrograms } from "@/lib/student/lms.functions";
import { listCourses, listCategories, formatPrice } from "@/lib/programs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, GraduationCap, Award, Clock, Layers, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/programs/")({ component: Page });

type Tab = "mine" | "browse";

type Filter = "all" | "in_progress" | "not_started" | "completed";

const STATUS_META: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-muted text-foreground/70 border-border" },
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  access_suspended: { label: "Access Suspended", className: "bg-amber-50 text-amber-800 border-amber-200" },
  access_expired: { label: "Access Expired", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.not_started;
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] uppercase tracking-widest", m.className)}>
      {m.label}
    </Badge>
  );
}

function ProgramCard({ p }: { p: any }) {
  const blocked = p.status === "access_suspended" || p.status === "access_expired";
  const cta =
    p.status === "completed" ? "Review Program"
    : p.status === "not_started" ? "Start Program"
    : "Continue Program";

  return (
    <Card className="p-0 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="aspect-[16/9] bg-surface-1 relative overflow-hidden">
        {p.thumbnail ? (
          <img src={p.thumbnail} alt={p.title} className="size-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <BookOpen className="size-10 text-primary/50" />
          </div>
        )}
        <div className="absolute top-3 left-3"><StatusBadge status={p.status} /></div>
        {p.certificate && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest text-emerald-700">
            <Award className="size-3" /> Issued
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <span>{p.category ?? "Program"}</span>
          {p.learningMode && <><span>·</span><span>{p.learningMode}</span></>}
        </div>
        <h3 className="font-display text-[15px] font-semibold leading-snug line-clamp-2">{p.title}</h3>

        <div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>{p.progress}% complete</span>
            <span>{p.completedLessons}/{p.totalLessons} lessons</span>
          </div>
          <Progress value={p.progress} className="h-1.5" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers className="size-3 shrink-0" />
            <span className="truncate">{p.currentModule?.name ?? `${p.totalModules} modules`}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="size-3 shrink-0" />
            <span className="truncate">Enrolled {p.enrolledAt ? new Date(p.enrolledAt).toLocaleDateString() : "—"}</span>
          </div>
        </div>

        <div className="pt-1">
          {p.slug ? (
            <Button asChild size="sm" className="w-full" disabled={blocked}>
              <Link
                to="/student/programs/$slug"
                params={{ slug: p.slug }}
                aria-disabled={blocked}
                onClick={(e) => blocked && e.preventDefault()}
              >
                {blocked ? "Access Unavailable" : cta}
              </Link>
            </Button>
          ) : (
            <Button size="sm" className="w-full" disabled>Program Unavailable</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <BookOpen className="size-6" />
      </div>
      <div className="font-display text-lg font-semibold">No Enrolled Programs Yet</div>
      <div className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
        Your Glintr programs will appear here once your learning access is activated.
      </div>
      <Button className="mt-5" onClick={onBrowse}><Sparkles className="size-4 mr-1.5" /> Browse Catalog</Button>
    </Card>
  );
}

function BrowseCard({ c }: { c: any }) {
  const price = c.offer_price ?? c.base_price;
  const hasDiscount = c.offer_price && c.base_price && c.offer_price < c.base_price;
  return (
    <Card className="p-0 overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
      <div className="aspect-[16/9] bg-surface-1 relative overflow-hidden">
        {c.thumbnail_url ? (
          <img src={c.thumbnail_url} alt={c.name} className="size-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <BookOpen className="size-10 text-primary/50" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {c.is_bestseller && <Badge className="bg-amber-500/95 text-white border-0 text-[10px] font-mono uppercase tracking-widest">Bestseller</Badge>}
          {c.is_trending && !c.is_bestseller && <Badge className="bg-primary/95 text-white border-0 text-[10px] font-mono uppercase tracking-widest">Trending</Badge>}
          {c.is_featured && !c.is_bestseller && !c.is_trending && <Badge className="bg-emerald-600/95 text-white border-0 text-[10px] font-mono uppercase tracking-widest">Featured</Badge>}
        </div>
      </div>
      <div className="p-4 space-y-3 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <span>{c.category?.name ?? "Program"}</span>
          {c.level && <><span>·</span><span>{c.level}</span></>}
        </div>
        <h3 className="font-display text-[15px] font-semibold leading-snug line-clamp-2">{c.name}</h3>
        {c.short_description && (
          <p className="text-[12px] text-muted-foreground line-clamp-2">{c.short_description}</p>
        )}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
          {c.duration && (
            <div className="flex items-center gap-1.5 min-w-0"><Clock className="size-3 shrink-0" /><span className="truncate">{c.duration}</span></div>
          )}
          {c.learning_mode && (
            <div className="flex items-center gap-1.5 min-w-0"><Layers className="size-3 shrink-0" /><span className="truncate">{c.learning_mode}</span></div>
          )}
        </div>
        <div className="mt-auto pt-2 flex items-end justify-between gap-3">
          <div>
            {price != null ? (
              <>
                <div className="font-display text-lg font-semibold leading-none">{formatPrice(price, c.currency ?? "INR")}</div>
                {hasDiscount && (
                  <div className="text-[11px] text-muted-foreground line-through mt-0.5">{formatPrice(c.base_price, c.currency ?? "INR")}</div>
                )}
              </>
            ) : (
              <div className="text-[11px] text-muted-foreground">Contact for pricing</div>
            )}
          </div>
          {c.category?.slug && c.slug ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/programs/${c.category.slug}/${c.slug}`} target="_blank" rel="noreferrer">
                View <ExternalLink className="size-3 ml-1" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function Page() {
  const fn = useServerFn(listMyPrograms);
  const { data = [], isLoading } = useQuery({ queryKey: ["my-programs"], queryFn: () => fn() });
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data as any[]).filter((p) => {
      if (filter === "in_progress" && p.status !== "in_progress") return false;
      if (filter === "not_started" && p.status !== "not_started") return false;
      if (filter === "completed" && p.status !== "completed") return false;
      if (term && !`${p.title} ${p.category ?? ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data, filter, q]);

  const counts = useMemo(() => {
    const c = { all: (data as any[]).length, in_progress: 0, not_started: 0, completed: 0 };
    for (const p of data as any[]) {
      if (p.status === "in_progress") c.in_progress++;
      else if (p.status === "not_started") c.not_started++;
      else if (p.status === "completed") c.completed++;
    }
    return c;
  }, [data]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All Programs" },
    { key: "in_progress", label: "In Progress" },
    { key: "not_started", label: "Not Started" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1400px]">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Student Workspace</div>
        <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight mt-1 flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" /> My Programs
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Everything you're enrolled in, in one place.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-white border border-border/70 rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                filter === f.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] text-muted-foreground/70">
                {counts[f.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search my programs…"
            className="pl-9 h-9 bg-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-0 overflow-hidden">
              <div className="aspect-[16/9] bg-surface-1 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-24 bg-surface-1 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-surface-1 rounded animate-pulse" />
                <div className="h-1.5 w-full bg-surface-1 rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      ) : (data as any[]).length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No programs match this filter.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p: any) => <ProgramCard key={p.enrollmentId} p={p} />)}
        </div>
      )}
    </div>
  );
}
