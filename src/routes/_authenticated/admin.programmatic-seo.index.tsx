import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Sparkles, Plus, Search, Filter, Eye, Edit3, Trash2, CheckCircle2, Clock,
  Calendar, FileText, BarChart3, ArrowUpRight, AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pseoStore } from "@/lib/pseo/store";
import { PSEO_TEMPLATES } from "@/lib/pseo/templates";
import type { PseoPage, PseoStatus } from "@/lib/pseo/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/programmatic-seo/")({
  component: PseoIndexPage,
});

const STATUS_STYLE: Record<PseoStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  scheduled: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  published: "bg-primary/15 text-primary border-primary/30",
};

function PseoIndexPage() {
  const [pages, setPages] = useState<PseoPage[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<PseoStatus | "all">("all");
  const [tpl, setTpl] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [author, setAuthor] = useState<string>("all");

  useEffect(() => setPages(pseoStore.list()), []);

  const refresh = () => setPages(pseoStore.list());

  const categories = useMemo(() => Array.from(new Set(pages.map((p) => p.category))), [pages]);
  const authors = useMemo(() => Array.from(new Set(pages.map((p) => p.author))), [pages]);

  const filtered = useMemo(() => {
    return pages.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (tpl !== "all" && p.templateId !== tpl) return false;
      if (category !== "all" && p.category !== category) return false;
      if (author !== "all" && p.author !== author) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!p.title.toLowerCase().includes(needle) && !p.slug.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [pages, q, status, tpl, category, author]);

  const kpis = useMemo(() => {
    const total = pages.length;
    const published = pages.filter((p) => p.status === "published").length;
    const review = pages.filter((p) => p.status === "review").length;
    const scheduled = pages.filter((p) => p.status === "scheduled").length;
    const impressions = pages.reduce((n, p) => n + (p.analytics?.impressions ?? 0), 0);
    const clicks = pages.reduce((n, p) => n + (p.analytics?.clicks ?? 0), 0);
    return { total, published, review, scheduled, impressions, clicks };
  }, [pages]);

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="size-5 text-primary" /> Programmatic SEO Engine
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Generate thousands of unique, high-quality landing pages from editorial templates. Every page goes through review before it can be published.
          </p>
        </div>
        <Link
          to={"/admin/programmatic-seo/new" as any}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90"
        >
          <Plus className="size-4" /> Generate pages
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Kpi icon={FileText} label="Total pages" value={kpis.total} />
        <Kpi icon={Clock} label="In review" value={kpis.review} tone="warn" />
        <Kpi icon={Calendar} label="Scheduled" value={kpis.scheduled} tone="info" />
        <Kpi icon={CheckCircle2} label="Published" value={kpis.published} tone="good" />
        <Kpi icon={BarChart3} label="Impressions" value={kpis.impressions.toLocaleString()} />
        <Kpi icon={ArrowUpRight} label="Clicks" value={kpis.clicks.toLocaleString()} />
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or slug…" className="pl-8" />
            </div>
            <Select label="Status" value={status} onChange={(v) => setStatus(v as PseoStatus | "all")}
              options={[["all", "All statuses"], ["draft", "Draft"], ["review", "Review"], ["approved", "Approved"], ["scheduled", "Scheduled"], ["published", "Published"]]} />
            <Select label="Template" value={tpl} onChange={setTpl}
              options={[["all", "All templates"], ...PSEO_TEMPLATES.map((t) => [t.id, t.label] as [string, string])]} />
            <Select label="Category" value={category} onChange={setCategory}
              options={[["all", "All categories"], ...categories.map((c) => [c, c] as [string, string])]} />
            <Select label="Author" value={author} onChange={setAuthor}
              options={[["all", "All authors"], ...authors.map((a) => [a, a] as [string, string])]} />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {pages.length === 0
                ? "No pages generated yet. Start by generating a batch from a template."
                : "No pages match the current filters."}
            </p>
            {pages.length === 0 && (
              <Link
                to={"/admin/programmatic-seo/new" as any}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium"
              >
                <Plus className="size-4" /> Generate your first pages
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="text-left px-4 py-2.5">Title</th>
                  <th className="text-left px-3 py-2.5">Template</th>
                  <th className="text-left px-3 py-2.5">Status</th>
                  <th className="text-left px-3 py-2.5">Author</th>
                  <th className="text-left px-3 py-2.5">Updated</th>
                  <th className="text-left px-3 py-2.5">Impr.</th>
                  <th className="text-left px-3 py-2.5">Clicks</th>
                  <th className="text-right px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <div className="font-medium truncate max-w-[380px]" title={p.title}>{p.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[380px]">/p/{p.slug}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">{PSEO_TEMPLATES.find((t) => t.id === p.templateId)?.label ?? p.templateId}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className={cn("capitalize", STATUS_STYLE[p.status])}>{p.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.author}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                    </td>
                    <td className="px-3 py-2.5 text-xs tabular-nums">{p.analytics?.impressions.toLocaleString() ?? 0}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums">{p.analytics?.clicks.toLocaleString() ?? 0}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link to={`/admin/programmatic-seo/${p.id}` as any} className="p-1.5 rounded hover:bg-muted" title="Edit">
                          <Edit3 className="size-4" />
                        </Link>
                        <Button
                          variant="ghost" size="icon" className="size-8"
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Delete "${p.title}"?`)) {
                              pseoStore.remove(p.id);
                              refresh();
                            }
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 flex items-start gap-3 text-xs text-muted-foreground">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <strong className="text-foreground">Editorial-only publishing.</strong> Generated pages start as drafts. Editors must review and approve every page before it moves to <em>scheduled</em> or <em>published</em>. Duplicate, thin, or stuffed content is blocked by quality checks.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof FileText; label: string; value: number | string; tone?: "good" | "warn" | "info" }) {
  const toneCls =
    tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : tone === "info" ? "text-sky-600" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-3.5" />{label}</div>
        <div className={cn("mt-1 font-display text-xl font-semibold tabular-nums", toneCls)}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs">
      <Filter className="size-3.5 text-muted-foreground" />
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border bg-background px-2 py-1.5 text-sm"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keepEye = Eye;
