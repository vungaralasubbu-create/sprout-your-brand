import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, ExternalLink, FileText, Image as ImageIcon,
  Link2, RefreshCw, Search, ShieldCheck, Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { runSeoHealthAudit, pingSearchEngines, type SeoHealthRow } from "@/lib/seo/audit.functions";

export const Route = createFileRoute("/_authenticated/admin/seo/health")({
  component: SeoHealthPage,
});

const ISSUE_LABEL: Record<string, string> = {
  missing_title: "Missing title",
  missing_description: "Missing description",
  title_too_short: "Title too short",
  title_too_long: "Title too long",
  description_too_short: "Description too short",
  description_too_long: "Description too long",
  missing_image: "Missing OG/hero image",
  missing_alt: "Missing image alt text",
  thin_content: "Thin content",
  unpublished: "Not published",
};

function SeoHealthPage() {
  const runAudit = useServerFn(runSeoHealthAudit);
  const ping = useServerFn(pingSearchEngines);
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"all" | SeoHealthRow["scope"]>("all");

  const audit = useQuery({
    queryKey: ["admin", "seo", "health"],
    queryFn: () => runAudit(),
    staleTime: 60_000,
  });

  const pingMutation = useMutation({
    mutationFn: () => ping(),
  });

  const rows = audit.data?.rows ?? [];
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (scope !== "all" && r.scope !== scope) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return r.title.toLowerCase().includes(s) || r.slug.toLowerCase().includes(s) || r.url.toLowerCase().includes(s);
    });
  }, [rows, q, scope]);

  const s = audit.data;

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Search className="size-5 text-primary" /> SEO Health Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Automated audit of every public page. Metadata, schema, sitemap and image coverage — all in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => audit.refetch()} disabled={audit.isFetching}>
            <RefreshCw className={`size-3.5 mr-1.5 ${audit.isFetching ? "animate-spin" : ""}`} />
            Rescan
          </Button>
          <Button size="sm" onClick={() => pingMutation.mutate()} disabled={pingMutation.isPending}>
            <Zap className="size-3.5 mr-1.5" />
            {pingMutation.isPending ? "Pinging…" : "Ping search engines"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Scanned pages" value={s?.totals.scanned ?? 0} icon={FileText} />
        <MetricCard label="Healthy" value={s?.totals.healthy ?? 0} icon={CheckCircle2} tone="text-emerald-600" />
        <MetricCard label="Warnings" value={s?.totals.warnings ?? 0} icon={AlertTriangle} tone="text-amber-600" />
        <MetricCard label="Critical" value={s?.totals.critical ?? 0} icon={AlertTriangle} tone="text-rose-600" />
      </div>

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" /> Issue breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
          {Object.entries(s?.buckets ?? {}).map(([k, v]) => (
            <div key={k} className="rounded-md border border-border/60 bg-muted/30 p-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {ISSUE_LABEL[k] ?? k}
              </div>
              <div className={`mt-1 text-xl font-semibold ${v > 0 ? "text-foreground" : "text-muted-foreground"}`}>{v as number}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-base font-semibold flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Pages with issues
          </h2>
          <div className="flex items-center gap-2">
            <Input placeholder="Search title, slug or URL…" className="h-9 w-64" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <Tabs value={scope} onValueChange={(v) => setScope(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="course">Courses</TabsTrigger>
            <TabsTrigger value="category">Categories</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="faq">FAQs</TabsTrigger>
            <TabsTrigger value="role">Careers</TabsTrigger>
          </TabsList>
          <TabsContent value={scope} className="mt-4">
            <div className="rounded-lg border border-border/60 divide-y divide-border/60">
              {audit.isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Scanning…</div>}
              {!audit.isLoading && filtered.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">No pages with issues in this scope.</div>
              )}
              {filtered.slice(0, 200).map((r) => (
                <div key={`${r.scope}-${r.id}`} className="flex items-start gap-3 p-3">
                  <Badge variant="muted" className="uppercase text-[10px] mt-0.5">{r.scope}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{r.title}</div>
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                      {r.url} <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {r.issues.length === 0 && (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Healthy</Badge>
                    )}
                    {r.issues.map((i) => (
                      <Badge key={i} variant="outline" className={
                        i === "missing_title" || i === "missing_description" ? "border-rose-300 text-rose-700" :
                        i === "unpublished" ? "border-muted text-muted-foreground" : "border-amber-300 text-amber-700"
                      }>{ISSUE_LABEL[i] ?? i}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
            <Link2 className="size-4 text-primary" /> Duplicate titles
          </h2>
          {(s?.duplicates.titles ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No duplicate titles detected.</div>
          ) : (
            <ul className="space-y-2 text-sm max-h-72 overflow-auto">
              {s?.duplicates.titles.slice(0, 20).map((d) => (
                <li key={d.value} className="rounded-md border border-border/60 p-2">
                  <div className="truncate font-medium">{d.value}</div>
                  <div className="text-xs text-muted-foreground">{d.count} pages • {d.slugs.slice(0, 4).join(", ")}{d.slugs.length > 4 ? "…" : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" /> Sitemaps & robots
          </h2>
          <ul className="space-y-2 text-sm">
            {[
              "/sitemap-index.xml", "/sitemap.xml", "/sitemap-courses.xml", "/sitemap-categories.xml",
              "/sitemap-blog.xml", "/sitemap-learning-paths.xml", "/sitemap-careers.xml", "/sitemap-images.xml",
              "/robots.txt",
            ].map((path) => (
              <li key={path} className="flex items-center justify-between rounded-md border border-border/60 p-2">
                <span className="font-mono text-xs">{path}</span>
                <a href={path} target="_blank" rel="noreferrer" className="text-primary text-xs inline-flex items-center gap-1">
                  Open <ExternalLink className="size-3" />
                </a>
              </li>
            ))}
          </ul>
          {pingMutation.data && (
            <div className="mt-3 text-xs text-muted-foreground">
              Last ping: {new Date(pingMutation.data.pingedAt).toLocaleString()} — {pingMutation.data.results.map((r) => `${r.engine}:${r.ok ? "ok" : "fail"}`).join(", ")}
            </div>
          )}
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Last audit: {s?.generatedAt ? new Date(s.generatedAt).toLocaleString() : "—"}
      </p>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        <Icon className={`size-4 ${tone ?? "text-muted-foreground"}`} />
      </div>
      <div className="mt-1 text-2xl font-display font-semibold tracking-tight">{value}</div>
    </Card>
  );
}
