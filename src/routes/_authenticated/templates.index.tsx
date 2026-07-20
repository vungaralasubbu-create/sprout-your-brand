import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, Sparkles, TrendingUp, Award, Building2, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listTemplates, listCategories } from "@/lib/templates/templates.functions";
import { TemplateCard } from "@/components/templates/template-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/templates/")({
  component: TemplatesHome,
  head: () => ({
    meta: [
      { title: "Template Marketplace — Glintr" },
      { name: "description", content: "Start with proven AI marketing templates. Instantly launch complete campaigns personalized for your business." },
    ],
  }),
});

const SORTS = [
  { key: "popular", label: "Popular" },
  { key: "trending", label: "Trending" },
  { key: "highest_rated", label: "Highest Rated" },
  { key: "most_used", label: "Most Used" },
  { key: "newest", label: "Newest" },
] as const;

function TemplatesHome() {
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [channel, setChannel] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("popular");

  const lt = useServerFn(listTemplates);
  const lc = useServerFn(listCategories);

  const templatesQ = useQuery({
    queryKey: ["tpl-list", q, industry, goal, channel, difficulty, sort],
    queryFn: () =>
      lt({
        data: {
          q: q || undefined,
          industry: industry || undefined,
          goal: goal || undefined,
          channel: channel || undefined,
          difficulty: (difficulty as any) || undefined,
          sort,
          limit: 48,
          cursor: 0,
        },
      }),
  });

  const catsQ = useQuery({ queryKey: ["tpl-cats"], queryFn: () => lc({}) });

  const cats = catsQ.data?.categories ?? [];
  const industries = useMemo(() => cats.filter((c: any) => c.kind === "industry"), [cats]);
  const goals = useMemo(() => cats.filter((c: any) => c.kind === "goal"), [cats]);
  const channels = useMemo(() => cats.filter((c: any) => c.kind === "channel"), [cats]);

  const templates = templatesQ.data?.templates ?? [];
  const featured = templates.filter((t: any) => t.is_featured).slice(0, 3);
  const rest = templates.filter((t: any) => !featured.includes(t));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-fuchsia-500/5 to-blue-500/10 p-8 md:p-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
            <Sparkles className="h-3 w-3" /> Template Marketplace
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Start with proven AI templates.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Choose a professionally designed marketing template and let AI personalize it for your business — strategy, posts, images, videos, emails, landing page, and workflow.
          </p>

          {/* Search */}
          <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-2xl border bg-background p-2 shadow-sm">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search templates by title, industry, or goal…"
              className="flex-1 bg-transparent px-1 py-2 text-sm outline-none"
            />
            <Button asChild variant="outline"><Link to="/template-builder">Create your own</Link></Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 space-y-3">
        <FilterRow label="Industry" values={industries} value={industry} onChange={setIndustry} />
        <FilterRow label="Goal" values={goals} value={goal} onChange={setGoal} />
        <FilterRow label="Channel" values={channels} value={channel} onChange={setChannel} />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                sort === s.key ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted",
              )}
            >
              {s.label}
            </button>
          ))}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="ml-auto rounded-full border bg-background px-3 py-1 text-xs"
          >
            <option value="">All difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Curator collections */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CollectionTile icon={Sparkles} title="Featured" cls="from-primary/20 to-primary/5" onClick={() => setSort("popular")} />
        <CollectionTile icon={TrendingUp} title="Trending" cls="from-fuchsia-500/20 to-fuchsia-500/5" onClick={() => setSort("trending")} />
        <CollectionTile icon={Award} title="Editor's Choice" cls="from-amber-500/20 to-amber-500/5" onClick={() => setSort("highest_rated")} />
        <CollectionTile icon={Building2} title="Enterprise Ready" cls="from-emerald-500/20 to-emerald-500/5" onClick={() => setSort("most_used")} />
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Featured templates</h2>
              <p className="text-sm text-muted-foreground">Handpicked by our team</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((t: any) => <TemplateCard key={t.id} t={t} size="lg" />)}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">All templates</h2>
          {templatesQ.isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {templatesQ.isLoading && templates.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted/40" />)}
          </div>
        ) : rest.length === 0 && featured.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No templates match your filters</div>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or search for something else.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rest.map((t: any) => <TemplateCard key={t.id} t={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, values, value, onChange }: { label: string; values: any[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground w-20">{label}</span>
      <button
        onClick={() => onChange("")}
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
          value === "" ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted",
        )}
      >
        All
      </button>
      {values.map((c: any) => (
        <button
          key={c.slug}
          onClick={() => onChange(c.slug)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
            value === c.slug ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted",
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

function CollectionTile({ icon: Icon, title, cls, onClick }: { icon: any; title: string; cls: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn("group flex items-center justify-between rounded-2xl border bg-gradient-to-br p-4 text-left transition hover:-translate-y-0.5", cls)}
    >
      <div>
        <Icon className="h-5 w-5" />
        <div className="mt-2 font-semibold">{title}</div>
      </div>
      <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}
