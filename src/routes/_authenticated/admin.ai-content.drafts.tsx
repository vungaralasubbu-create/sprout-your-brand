import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiFactoryDashboard } from "@/lib/admin/ai-content.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Search, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { CONTENT_TYPE_LABEL } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/ai-content/drafts")({
  component: DraftsPage,
});

function DraftsPage() {
  const fn = useServerFn(getAiFactoryDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["ai-factory-dashboard"], queryFn: () => fn(), staleTime: 30_000 });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const items = (data?.recentAi ?? []) as any[];
  const filtered = items.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (q && !r.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <FileEdit className="size-5 text-primary" /> Drafts
        </h1>
        <p className="text-sm text-muted-foreground">Every AI-generated article waiting for editor review, revision, or approval.</p>
      </header>

      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search drafts by title…" className="pl-9" />
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="size-3.5 text-muted-foreground" />
          {(["all", "draft", "in_review", "needs_changes", "approved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-2.5 py-1 rounded-md border text-[11px] font-medium capitalize transition ${
                status === s ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-surface-2/60"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-0 divide-y divide-border/60">
        {isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Loading drafts…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No drafts match your filters. Start one from the{" "}
            <Link to={"/admin/ai-content/wizard" as any} className="text-primary hover:underline">Generate Content</Link> workspace.
          </div>
        )}
        {filtered.map((r) => (
          <Link
            key={r.id}
            to={"/admin/content/articles/$id" as any}
            params={{ id: r.id } as any}
            className="flex items-center justify-between px-4 py-3 hover:bg-surface-2/40 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{r.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {CONTENT_TYPE_LABEL[r.type] ?? r.type} · {r.word_count ?? 0} words · updated {formatDistanceToNow(new Date(r.updated_at))} ago
              </div>
            </div>
            <Badge variant="outline" className="capitalize text-[10px]">{String(r.status).replace("_", " ")}</Badge>
          </Link>
        ))}
      </Card>
    </div>
  );
}
