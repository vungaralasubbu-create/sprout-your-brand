import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search, ExternalLink, Copy, ArrowRight, Check } from "lucide-react";
import { listPartnerPrograms } from "@/lib/partner/programs.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/partner/programs")({
  component: ProgramsPage,
});

const PLANS = [
  { label: "Self-Paced Edge", price: 3999 },
  { label: "Career Launch", price: 5499 },
  { label: "Career Pro", price: 9999 },
];

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function ProgramsPage() {
  const fetchList = useServerFn(listPartnerPrograms);
  const { data, isLoading } = useQuery({
    queryKey: ["partner-programs"],
    queryFn: () => fetchList(),
  });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((p) => {
      if (cat !== "all" && p.category?.slug !== cat) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, cat]);

  function copyLink(p: (typeof filtered)[number]) {
    if (!p.category) return;
    const url = `${window.location.origin}/programs/${p.category.slug}/${p.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId((v) => (v === p.id ? null : v)), 1500);
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <header>
        <div className="text-caption uppercase tracking-widest text-primary font-mono">
          Sales Workspace
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Programs Library
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore Glintr programs to pitch and share with your leads.
        </p>
      </header>

      <Card className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat("all")}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              cat === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white hover:bg-muted"
            }`}
          >
            All
          </button>
          {(data?.categories ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.slug)}
              className={`px-3 py-1.5 text-xs rounded-full border ${
                cat === c.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white hover:bg-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading programs...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No programs match your filters.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const starting = PLANS[0].price;
            return (
              <Card key={p.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {p.category ? (
                      <Badge variant="secondary" className="mb-2">
                        {p.category.name}
                      </Badge>
                    ) : null}
                    <h3 className="font-semibold text-base leading-tight">{p.name}</h3>
                  </div>
                </div>
                {p.short_description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {p.short_description}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {p.duration ? <span>⏱ {p.duration}</span> : null}
                  {p.level ? <span>◆ {p.level}</span> : null}
                  {p.learning_mode ? <span>◉ {p.learning_mode}</span> : null}
                </div>
                <div className="flex items-baseline justify-between border-t pt-3">
                  <div>
                    <div className="text-caption uppercase tracking-wider text-muted-foreground">
                      Starting from
                    </div>
                    <div className="font-semibold text-lg">{formatINR(starting)}</div>
                  </div>
                  <div className="text-caption text-right text-muted-foreground">
                    3 plans
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <Button asChild size="sm" className="w-full">
                    <Link
                      to="/partner/programs/$slug"
                      params={{ slug: p.slug }}
                    >
                      Sales Details <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    {p.category ? (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={`/programs/${p.category.slug}/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="size-3.5" /> Public
                        </a>
                      </Button>
                    ) : (
                      <div />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(p)}
                    >
                      {copiedId === p.id ? (
                        <>
                          <Check className="size-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" /> Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
