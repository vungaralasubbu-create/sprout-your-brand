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
import { BookOpen, Search, GraduationCap, Award, Clock, Layers, Sparkles, Eye, CheckCircle2, Signal, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

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

function BrowseCard({ c, onView }: { c: any; onView: (course: any) => void }) {
  const price = c.offer_price ?? c.base_price;
  const hasDiscount = c.offer_price && c.base_price && c.offer_price < c.base_price;
  return (
    <Card className="p-0 overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
      <button
        type="button"
        onClick={() => onView(c)}
        className="aspect-[16/9] bg-surface-1 relative overflow-hidden text-left"
        aria-label={`View ${c.name} details`}
      >
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
      </button>
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
          <Button size="sm" variant="outline" onClick={() => onView(c)}>
            <Eye className="size-3.5 mr-1" /> View Brief
          </Button>
        </div>
      </div>
    </Card>
  );
}

function toStringList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|•|\u2022|;|\|/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function ProgramBriefSheet({ course, onOpenChange }: { course: any | null; onOpenChange: (open: boolean) => void }) {
  const c = course;
  const outcomes = c ? toStringList(c.learning_outcomes ?? c.what_you_will_learn ?? c.highlights) : [];
  const skills = c ? toStringList(c.key_skills ?? c.skills_covered) : [];
  const price = c ? (c.offer_price ?? c.base_price) : null;
  const hasDiscount = c && c.offer_price && c.base_price && c.offer_price < c.base_price;

  return (
    <Sheet open={!!c} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        {c ? (
          <div className="flex flex-col">
            <div className="aspect-[16/9] bg-surface-1 relative overflow-hidden">
              {c.thumbnail_url ? (
                <img src={c.thumbnail_url} alt={c.name} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                  <BookOpen className="size-12 text-primary/50" />
                </div>
              )}
            </div>
            <SheetHeader className="px-6 pt-5 pb-2 text-left">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <span>{c.category?.name ?? "Program"}</span>
                {c.level && <><span>·</span><span>{c.level}</span></>}
                {c.learning_mode && <><span>·</span><span>{c.learning_mode}</span></>}
              </div>
              <SheetTitle className="font-display text-2xl leading-tight">{c.name}</SheetTitle>
              {c.short_description && (
                <SheetDescription className="text-sm">{c.short_description}</SheetDescription>
              )}
            </SheetHeader>

            <div className="px-6 pb-6 space-y-5">
              <div className="grid grid-cols-3 gap-2">
                {c.duration && (
                  <div className="rounded-lg border border-border/70 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> Duration</div>
                    <div className="text-sm font-medium mt-1">{c.duration}</div>
                  </div>
                )}
                {c.level && (
                  <div className="rounded-lg border border-border/70 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Signal className="size-3" /> Level</div>
                    <div className="text-sm font-medium mt-1">{c.level}</div>
                  </div>
                )}
                {price != null && (
                  <div className="rounded-lg border border-border/70 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1"><IndianRupee className="size-3" /> Price</div>
                    <div className="text-sm font-semibold mt-1">{formatPrice(price, c.currency ?? "INR")}</div>
                    {hasDiscount && (
                      <div className="text-[10px] text-muted-foreground line-through">{formatPrice(c.base_price, c.currency ?? "INR")}</div>
                    )}
                  </div>
                )}
              </div>

              {c.full_description && (
                <section>
                  <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">About this program</div>
                  <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">{c.full_description}</p>
                </section>
              )}

              {outcomes.length > 0 && (
                <section>
                  <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">What you'll learn</div>
                  <ul className="space-y-1.5">
                    {outcomes.slice(0, 8).map((o, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {skills.length > 0 && (
                <section>
                  <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">Skills covered</div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.slice(0, 20).map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[11px]">{s}</Badge>
                    ))}
                  </div>
                </section>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/70">
                <Button className="flex-1" onClick={() => onOpenChange(false)}>
                  <Sparkles className="size-4 mr-1.5" /> Request Enrollment
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Your Glintr advisor will confirm access and unlock this program in your workspace.
              </p>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Page() {
  const fn = useServerFn(listMyPrograms);
  const { data = [], isLoading } = useQuery({ queryKey: ["my-programs"], queryFn: () => fn() });
  const [tab, setTab] = useState<Tab>("mine");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  // Browse catalog data
  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: ["programs-catalog"],
    queryFn: () => listCourses(),
    enabled: tab === "browse",
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["programs-categories"],
    queryFn: () => listCategories(),
    enabled: tab === "browse",
  });
  const [catFilter, setCatFilter] = useState<string>("all");
  const [browseQ, setBrowseQ] = useState("");

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

  const filteredCatalog = useMemo(() => {
    const term = browseQ.trim().toLowerCase();
    return (catalog as any[]).filter((c) => {
      if (catFilter !== "all" && c.category?.slug !== catFilter) return false;
      if (term && !`${c.name} ${c.short_description ?? ""} ${c.category?.name ?? ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [catalog, catFilter, browseQ]);

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
          <GraduationCap className="size-6 text-primary" /> Programs
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Your learning journey and the full Glintr catalog — all in one place.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { key: "mine" as const, label: "My Programs", count: (data as any[]).length },
          { key: "browse" as const, label: "Browse Catalog", count: (catalog as any[]).length || undefined },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-[11px] text-muted-foreground/70">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "mine" ? (
        <>
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
            <EmptyState onBrowse={() => setTab("browse")} />
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No programs match this filter.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p: any) => <ProgramCard key={p.enrollmentId} p={p} />)}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-white border border-border/70 rounded-lg p-1 overflow-x-auto max-w-full">
              <button
                onClick={() => setCatFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap",
                  catFilter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                All Categories
              </button>
              {(categories as any[]).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCatFilter(cat.slug)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap",
                    catFilter === cat.slug ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="relative md:ml-auto md:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={browseQ}
                onChange={(e) => setBrowseQ(e.target.value)}
                placeholder="Search catalog…"
                className="pl-9 h-9 bg-white"
              />
            </div>
          </div>

          {catalogLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-0 overflow-hidden">
                  <div className="aspect-[16/9] bg-surface-1 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-24 bg-surface-1 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-surface-1 rounded animate-pulse" />
                    <div className="h-3 w-full bg-surface-1 rounded animate-pulse" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredCatalog.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No programs match your search.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCatalog.map((c: any) => <BrowseCard key={c.id} c={c} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
