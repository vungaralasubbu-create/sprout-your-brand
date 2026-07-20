import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listDocuments } from "@/lib/knowledge/knowledge.functions";

export const Route = createFileRoute("/_authenticated/knowledge/documents")({
  component: DocsPage,
});

const CATEGORIES = ["all","documents","brand","products","services","sales","marketing","support","competitors","personas","faqs","team","media"];

function DocsPage() {
  const [category, setCategory] = useState<string>("all");
  const [q, setQ] = useState("");
  const ld = useServerFn(listDocuments);
  const query = useQuery({
    queryKey: ["kn-docs", category, q],
    queryFn: () => ld({ data: { category: category === "all" ? undefined : category, q: q || undefined } }),
  });
  const docs = query.data?.documents ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…"
            className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <Button asChild><Link to="/knowledge/upload">Add document</Link></Button>
      </div>

      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium capitalize transition",
              category === c ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted")}>
            {c}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-card">
        {query.isLoading ? (
          <div className="h-40 animate-pulse bg-muted/40" />
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No documents yet.</p>
          </div>
        ) : (
          <div className="divide-y">
            {docs.map((d: any) => (
              <div key={d.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">{d.category}</span>
                    <span className="text-[10px] text-muted-foreground">v{d.version}</span>
                  </div>
                  <div className="mt-1 font-medium">{d.title}</div>
                  {d.summary && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.summary}</div>}
                  {d.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.tags.slice(0, 5).map((t: string) => (
                        <span key={t} className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">{new Date(d.updated_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
