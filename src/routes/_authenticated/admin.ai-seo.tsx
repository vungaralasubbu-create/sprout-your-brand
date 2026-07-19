import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listSeoSuggestions,
  reviewSeoSuggestion,
  deleteSeoSuggestion,
  generateSeoSuggestion,
  seoSuggestionStats,
  AI_SEO_KINDS,
  type AiSeoKind,
} from "@/lib/seo/ai-seo.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Check, X, Rocket, Trash2, RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ai-seo")({
  component: AiSeoEnginePage,
  head: () => ({
    meta: [
      { title: "AI SEO Engine — Glintr Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const KIND_LABELS: Record<AiSeoKind, string> = {
  title: "SEO Title",
  meta_description: "Meta Description",
  faq_schema: "FAQ Schema",
  internal_links: "Internal Links",
  breadcrumbs: "Breadcrumbs",
  structured_data: "Structured Data",
  keyword_opportunities: "Keyword Opportunities",
  duplicate_content: "Duplicate Content",
  content_improvements: "Content Improvements",
  heading_hierarchy: "Heading Hierarchy",
  missing_pages: "Missing Pages",
  image_alt: "Image ALT Text",
};

function AiSeoEnginePage() {
  const router = useRouter();
  const listFn = useServerFn(listSeoSuggestions);
  const statsFn = useServerFn(seoSuggestionStats);
  const generateFn = useServerFn(generateSeoSuggestion);
  const reviewFn = useServerFn(reviewSeoSuggestion);
  const deleteFn = useServerFn(deleteSeoSuggestion);

  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "published" | "all">("pending");
  const [kindFilter, setKindFilter] = useState<AiSeoKind | "all">("all");
  const [generatorKind, setGeneratorKind] = useState<AiSeoKind>("title");
  const [inputJson, setInputJson] = useState<string>(
    JSON.stringify(
      { url: "/programs/ai-mastery", title: "AI Mastery", summary: "Learn to build with AI." },
      null,
      2,
    ),
  );
  const [busy, setBusy] = useState(false);

  const listQuery = useQuery({
    queryKey: ["ai-seo-suggestions", status, kindFilter],
    queryFn: () => listFn({ data: { status, kind: kindFilter === "all" ? undefined : kindFilter, limit: 100 } }),
  });

  const statsQuery = useQuery({
    queryKey: ["ai-seo-suggestions-stats"],
    queryFn: () => statsFn(),
  });

  async function handleGenerate() {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(inputJson);
    } catch {
      toast.error("Input must be valid JSON");
      return;
    }
    setBusy(true);
    try {
      await generateFn({ data: { kind: generatorKind, input: parsed } });
      toast.success("Suggestion queued for review");
      await Promise.all([listQuery.refetch(), statsQuery.refetch()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleReview(id: string, action: "approve" | "reject" | "publish") {
    try {
      await reviewFn({ data: { id, action } });
      toast.success(`Marked ${action === "publish" ? "published" : `${action}d`}`);
      await Promise.all([listQuery.refetch(), statsQuery.refetch()]);
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Review failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this suggestion?")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Deleted");
      await Promise.all([listQuery.refetch(), statsQuery.refetch()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const rows = listQuery.data?.rows ?? [];
  const stats = statsQuery.data;

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Sparkles className="size-5 text-primary" /> AI SEO Engine
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate reviewable SEO suggestions — titles, meta descriptions, FAQ schema, internal links,
          breadcrumbs, structured data, keyword opportunities, duplicate detection, content improvements,
          heading fixes, missing pages, and image ALT text. Nothing ships until you approve it.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["pending", "approved", "rejected", "published"] as const).map((s) => (
          <Card key={s} className="p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{s}</div>
            <div className="text-3xl font-display font-semibold mt-1">{stats?.byStatus?.[s] ?? 0}</div>
          </Card>
        ))}
        <Card className="p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total</div>
          <div className="text-3xl font-display font-semibold mt-1">{stats?.total ?? 0}</div>
        </Card>
      </div>

      {/* Generator */}
      <Card className="p-5 space-y-3">
        <h2 className="font-display text-base font-semibold flex items-center gap-2">
          <Wand2 className="size-4 text-primary" /> Generate suggestion
        </h2>
        <div className="grid md:grid-cols-[240px_1fr_auto] gap-3 items-start">
          <Select value={generatorKind} onValueChange={(v) => setGeneratorKind(v as AiSeoKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AI_SEO_KINDS.map((k) => (
                <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            className="font-mono text-xs min-h-[140px]"
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder='{"url":"/programs/xyz","title":"...","summary":"..."}'
          />
          <Button onClick={handleGenerate} disabled={busy} className="md:self-stretch">
            <Sparkles className="size-4 mr-2" /> {busy ? "Generating…" : "Generate"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Provide page context as JSON (title, url, summary, headings, images, existing links, etc.). The AI
          will emit a strict-JSON suggestion for review.
        </p>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["pending", "approved", "rejected", "published", "all"] as const).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as typeof kindFilter)}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All kinds</SelectItem>
            {AI_SEO_KINDS.map((k) => (
              <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => listQuery.refetch()}>
          <RefreshCw className="size-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Review queue */}
      <div className="space-y-3">
        {listQuery.isLoading && <Card className="p-6 text-sm text-muted-foreground">Loading suggestions…</Card>}
        {!listQuery.isLoading && rows.length === 0 && (
          <Card className="p-6 text-sm text-muted-foreground">No suggestions match your filters.</Card>
        )}
        {rows.map((row) => (
          <Card key={row.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="info">{KIND_LABELS[row.kind as AiSeoKind] ?? row.kind}</Badge>
                  <Badge>{row.status}</Badge>
                  {row.target_url && (
                    <span className="text-xs text-muted-foreground font-mono truncate">{row.target_url}</span>
                  )}
                  {row.model && <span className="text-[10px] text-muted-foreground font-mono">{row.model}</span>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {new Date(row.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {row.status === "pending" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleReview(row.id, "approve")}>
                      <Check className="size-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReview(row.id, "reject")}>
                      <X className="size-4 mr-1" /> Reject
                    </Button>
                  </>
                )}
                {(row.status === "pending" || row.status === "approved") && (
                  <Button size="sm" onClick={() => handleReview(row.id, "publish")}>
                    <Rocket className="size-4 mr-1" /> Publish
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => handleDelete(row.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <pre className="text-xs bg-muted/40 rounded-md p-3 overflow-auto max-h-[320px] font-mono">
              {JSON.stringify(row.suggestion, null, 2)}
            </pre>
          </Card>
        ))}
      </div>
    </div>
  );
}
