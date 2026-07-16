import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFreshnessQueue } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/freshness")({
  component: Freshness,
});

const BUCKETS = [
  { key: "critical", label: "Critical (>365d)", tone: "bg-rose-100 text-rose-700" },
  { key: "review", label: "Review due (>180d)", tone: "bg-amber-100 text-amber-700" },
  { key: "watch", label: "Watch (>90d)", tone: "bg-yellow-100 text-yellow-700" },
  { key: "fresh", label: "Fresh", tone: "bg-emerald-100 text-emerald-700" },
];

function Freshness() {
  const fn = useServerFn(getFreshnessQueue);
  const { data, isLoading } = useQuery({ queryKey: ["ci-freshness"], queryFn: () => fn(), staleTime: 60_000 });
  const [bucket, setBucket] = useState<string>("review");
  const rows = (data?.rows ?? []).filter((r) => r.bucket === bucket).sort((a, b) => b.ageDays - a.ageDays);

  return (
    <div className="space-y-5 max-w-6xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Clock className="size-4 text-primary" /> Content Freshness</h1>
        <p className="text-sm text-muted-foreground">Articles that should be reviewed. Reviews stay manual — nothing is rewritten automatically.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {BUCKETS.map((b) => (
          <button key={b.key} onClick={() => setBucket(b.key)} className={`text-left rounded-md border p-3 ${bucket === b.key ? "border-primary bg-primary/5" : "border-border/60 bg-white"}`}>
            <div className={`inline-block text-[10px] font-mono uppercase rounded px-1.5 py-0.5 ${b.tone}`}>{b.label}</div>
            <div className="mt-2 text-2xl font-semibold">{data?.buckets[b.key as keyof typeof data.buckets] ?? 0}</div>
          </button>
        ))}
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <Card className="divide-y">
        {rows.slice(0, 60).map((r) => (
          <div key={r.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{r.title}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{r.type} · {r.ageDays} days old · {r.word_count ?? 0} words</div>
            </div>
            <Link to={"/admin/content/articles/$id" as any} params={{ id: r.id } as any} className="text-xs font-medium text-primary">Review</Link>
          </div>
        ))}
        {rows.length === 0 && !isLoading && <div className="p-4 text-sm text-muted-foreground">Nothing in this bucket.</div>}
      </Card>
    </div>
  );
}
