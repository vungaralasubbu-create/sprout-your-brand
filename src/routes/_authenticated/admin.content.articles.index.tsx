import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Search, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import {
  listContent, upsertContent, deleteContent, listCategories,
} from "@/lib/admin/content.functions";
import { CONTENT_TYPES, CONTENT_TYPE_LABEL, CONTENT_STATUSES, STATUS_COLOR, STATUS_LABEL, type ContentType } from "@/lib/admin/content-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/content/articles/")({
  component: ArticlesPage,
  validateSearch: (s: Record<string, unknown>) => ({
    type: (s.type as string) || "",
    status: (s.status as string) || "",
    q: (s.q as string) || "",
    category: (s.category as string) || "",
  }),
});

function ArticlesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/content/articles" });
  const qc = useQueryClient();
  const [inputQ, setInputQ] = useState(search.q);

  const listFn = useServerFn(listContent);
  const createFn = useServerFn(upsertContent);
  const delFn = useServerFn(deleteContent);
  const catsFn = useServerFn(listCategories);

  const { data: categories } = useQuery({ queryKey: ["content-categories"], queryFn: () => catsFn(), staleTime: 60_000 });

  const params = useMemo(() => ({
    type: (search.type || undefined) as ContentType | undefined,
    status: (search.status || undefined) as any,
    q: search.q || undefined,
    category_id: search.category || undefined,
    limit: 50,
    offset: 0,
  }), [search]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["content-list", params],
    queryFn: () => listFn({ data: params }),
    staleTime: 15_000,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const type: ContentType = (search.type as ContentType) || "learn_guide";
      const r = await createFn({ data: { type, title: "Untitled draft", body_markdown: "", tag_slugs: [], related_topics: [] } });
      return r;
    },
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ["content-list"] });
      navigate({ to: "/admin/content/articles/$id" as any, params: { id: r.id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: (prev: any) => ({ ...prev, q: inputQ }) });
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold">Articles</h1>
          <p className="text-sm text-muted-foreground">All content items — learn guides, glossary terms, comparisons and more.</p>
        </div>
        <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
          <Plus className="size-4 mr-1.5" /> New content
        </Button>
      </header>

      <Card className="p-3">
        <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={inputQ} onChange={(e) => setInputQ(e.target.value)} placeholder="Search title, slug, summary…" className="pl-9 h-9" />
          </div>
          <Select value={search.type || "__all"} onValueChange={(v) => navigate({ search: (p: any) => ({ ...p, type: v === "__all" ? "" : v }) })}>
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All types</SelectItem>
              {CONTENT_TYPES.map((t) => <SelectItem key={t} value={t}>{CONTENT_TYPE_LABEL[t]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={search.status || "__all"} onValueChange={(v) => navigate({ search: (p: any) => ({ ...p, status: v === "__all" ? "" : v }) })}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All statuses</SelectItem>
              {CONTENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={search.category || "__all"} onValueChange={(v) => navigate({ search: (p: any) => ({ ...p, category: v === "__all" ? "" : v }) })}>
            <SelectTrigger className="h-9 w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All categories</SelectItem>
              {(categories ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" variant="secondary"><Filter className="size-4 mr-1.5" /> Apply</Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/60 bg-surface-1/40">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Updated</div>
          <div className="col-span-1 text-right">Words</div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : !(data?.rows ?? []).length ? (
          <div className="p-8 text-center text-muted-foreground">No content matches these filters.</div>
        ) : (
          <div className="divide-y divide-border/60">
            {(data!.rows).map((r: any) => (
              <div key={r.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-surface-2/40">
                <Link to={"/admin/content/articles/$id" as any} params={{ id: r.id }} className="col-span-5 min-w-0">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate">/{r.slug}</div>
                </Link>
                <div className="col-span-2 text-xs">{CONTENT_TYPE_LABEL[r.type] ?? r.type}</div>
                <div className="col-span-2">
                  <span className={cn("inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-medium", STATUS_COLOR[r.status])}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(r.updated_at))} ago
                </div>
                <div className="col-span-1 text-xs text-right font-mono flex items-center justify-end gap-2">
                  {r.word_count ?? 0}
                  <button
                    onClick={() => { if (confirm(`Delete "${r.title}"?`)) delMut.mutate(r.id); }}
                    className="text-muted-foreground hover:text-red-600"
                    aria-label="Delete"
                  ><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border/60">
          {data ? <>Showing {data.rows.length} of {data.count}</> : null}
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">Quick filters</div>
        <div className="flex flex-wrap gap-1.5">
          {CONTENT_TYPES.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="cursor-pointer hover:bg-surface-2"
              onClick={() => navigate({ search: (p: any) => ({ ...p, type: t }) })}
            >{CONTENT_TYPE_LABEL[t]}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
