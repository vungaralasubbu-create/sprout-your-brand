import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listContent } from "@/lib/admin/content.functions";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { CONTENT_TYPE_LABEL } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/content/seo")({
  component: SeoPage,
});

function SeoPage() {
  const fn = useServerFn(listContent);
  const { data } = useQuery({
    queryKey: ["seo-audit"],
    queryFn: () => fn({ data: { status: "published", limit: 200, offset: 0 } as any }),
  });

  const rows = (data?.rows ?? []) as any[];
  const issues = rows.map((r: any) => {
    const titleLen = (r.seo_title ?? r.title ?? "").length;
    const problems = [] as string[];
    if (titleLen < 30 || titleLen > 70) problems.push(`Title length ${titleLen}`);
    if (!r.summary) problems.push("Missing summary");
    return { ...r, problems };
  });

  return (
    <div className="space-y-4 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold">SEO Overview</h1>
        <p className="text-sm text-muted-foreground">Audit of published content — click any row to open the editor and its SEO panel.</p>
      </header>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/60 bg-surface-1/40">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">Issues</div>
          <div className="col-span-2 text-right">Words</div>
        </div>
        <div className="divide-y divide-border/60">
          {issues.map((r) => (
            <Link key={r.id} to={"/admin/content/articles/$id" as any} params={{ id: r.id }} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-surface-2/40">
              <div className="col-span-5 min-w-0">
                <div className="text-sm font-medium truncate">{r.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">/{r.slug}</div>
              </div>
              <div className="col-span-2 text-xs">{CONTENT_TYPE_LABEL[r.type] ?? r.type}</div>
              <div className="col-span-3 text-xs">
                {r.problems.length ? (
                  <span className="inline-flex items-center gap-1 text-amber-600"><AlertCircle className="size-3.5" /> {r.problems.join(" · ")}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="size-3.5" /> Clean</span>
                )}
              </div>
              <div className="col-span-2 text-xs text-right font-mono">{r.word_count ?? 0}</div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
