import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Search, Filter, Trash2, Star, TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import {
  listBlogPosts,
  upsertBlogPost,
  deleteBlogPost,
  patchBlogPost,
} from "@/lib/admin/blogs.functions";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  archived: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export const Route = createFileRoute("/_authenticated/admin/blogs/")({
  component: BlogsListPage,
  validateSearch: (s: Record<string, unknown>) => ({
    q: (s.q as string) || "",
    status: (s.status as string) || "",
    topic: (s.topic as string) || "",
    category: (s.category as string) || "",
  }),
});

function BlogsListPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/blogs" });
  const qc = useQueryClient();
  const [inputQ, setInputQ] = useState(search.q);

  const listFn = useServerFn(listBlogPosts);
  const upsertFn = useServerFn(upsertBlogPost);
  const delFn = useServerFn(deleteBlogPost);
  const patchFn = useServerFn(patchBlogPost);

  const params = useMemo(
    () => ({
      q: search.q || undefined,
      status: (search.status || undefined) as any,
      topic: search.topic || undefined,
      category: search.category || undefined,
      limit: 50,
      offset: 0,
    }),
    [search],
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-blogs", params],
    queryFn: () => listFn({ data: params }),
    staleTime: 10_000,
  });

  const createMut = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          title: "Untitled draft",
          short_summary: "",
          content_markdown: "",
          author_display_name: "Glintr Editorial",
          faqs: [],
          keywords: [],
          status: "draft",
          is_featured: false,
          is_trending: false,
          display_order: 0,
        },
      }),
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      navigate({ to: "/admin/blogs/$id" as any, params: { id: r.id } as any });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });

  const patchMut = useMutation({
    mutationFn: (v: {
      id: string;
      status?: any;
      is_featured?: boolean;
      is_trending?: boolean;
    }) => patchFn({ data: v }),
    onSuccess: () => refetch(),
    onError: (e: any) => toast.error(e.message ?? "Failed to update"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: (p: any) => ({ ...p, q: inputQ }) });
  }

  const counts = data?.counts ?? {
    total: 0,
    draft: 0,
    in_review: 0,
    scheduled: 0,
    published: 0,
    archived: 0,
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold">Blog CMS</h1>
          <p className="text-sm text-muted-foreground">
            Editorial posts published at <code>/blog/&lt;slug&gt;</code>. Edits go live immediately once
            status is set to Published.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild size="sm">
            <a href="/blog" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4 mr-1.5" /> View blog
            </a>
          </Button>
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            <Plus className="size-4 mr-1.5" /> New Post
          </Button>
        </div>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[
          { key: "total", label: "Total" },
          { key: "published", label: "Published" },
          { key: "draft", label: "Drafts" },
          { key: "in_review", label: "In Review" },
          { key: "scheduled", label: "Scheduled" },
          { key: "archived", label: "Archived" },
        ].map((k) => (
          <Card
            key={k.key}
            className={cn(
              "p-3 cursor-pointer hover:bg-surface-2/40 transition-colors",
              search.status === (k.key === "total" ? "" : k.key) && "ring-1 ring-primary/40",
            )}
            onClick={() =>
              navigate({
                search: (p: any) => ({ ...p, status: k.key === "total" ? "" : k.key }),
              })
            }
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {k.label}
            </div>
            <div className="text-2xl font-display font-semibold">
              {(counts as any)[k.key] ?? 0}
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-3">
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              placeholder="Search title, slug, summary…"
              className="pl-9 h-9"
            />
          </div>
          <Select
            value={search.status || "__all"}
            onValueChange={(v) =>
              navigate({ search: (p: any) => ({ ...p, status: v === "__all" ? "" : v }) })
            }
          >
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All statuses</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={search.topic || "__all"}
            onValueChange={(v) =>
              navigate({ search: (p: any) => ({ ...p, topic: v === "__all" ? "" : v }) })
            }
          >
            <SelectTrigger className="h-9 w-48">
              <SelectValue placeholder="All topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All topics</SelectItem>
              {(data?.topics ?? []).map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={search.category || "__all"}
            onValueChange={(v) =>
              navigate({ search: (p: any) => ({ ...p, category: v === "__all" ? "" : v }) })
            }
          >
            <SelectTrigger className="h-9 w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All categories</SelectItem>
              {(data?.categories ?? []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" variant="secondary">
            <Filter className="size-4 mr-1.5" /> Apply
          </Button>
        </form>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/60 bg-surface-1/40">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Topic</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Updated</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : !(data?.rows ?? []).length ? (
          <div className="p-8 text-center text-muted-foreground">
            No posts match these filters.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {(data!.rows as any[]).map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-surface-2/40"
              >
                <Link
                  to={"/admin/blogs/$id" as any}
                  params={{ id: r.id } as any}
                  className="col-span-5 min-w-0"
                >
                  <div className="text-sm font-medium truncate flex items-center gap-2">
                    {r.title}
                    {r.is_featured && (
                      <Star
                        className="size-3.5 text-amber-500 fill-amber-500"
                        aria-label="Featured"
                      />
                    )}
                    {r.is_trending && (
                      <TrendingUp
                        className="size-3.5 text-emerald-500"
                        aria-label="Trending"
                      />
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    /blog/{r.slug}
                  </div>
                </Link>
                <div className="col-span-2 text-xs text-muted-foreground truncate">
                  {r.topic?.name ?? "—"}
                </div>
                <div className="col-span-2">
                  <Select
                    value={r.status}
                    onValueChange={(v) => patchMut.mutate({ id: r.id, status: v })}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-7 w-32 text-[11px] px-2 border-0 uppercase font-medium",
                        STATUS_COLOR[r.status],
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(r.updated_at))} ago
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1.5">
                  <button
                    title="Toggle featured"
                    onClick={() =>
                      patchMut.mutate({ id: r.id, is_featured: !r.is_featured })
                    }
                    className={cn(
                      "hover:text-amber-500",
                      r.is_featured ? "text-amber-500" : "text-muted-foreground",
                    )}
                  >
                    <Star
                      className={cn("size-3.5", r.is_featured && "fill-amber-500")}
                    />
                  </button>
                  <button
                    title="Toggle trending"
                    onClick={() =>
                      patchMut.mutate({ id: r.id, is_trending: !r.is_trending })
                    }
                    className={cn(
                      "hover:text-emerald-500",
                      r.is_trending ? "text-emerald-500" : "text-muted-foreground",
                    )}
                  >
                    <TrendingUp className="size-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${r.title}"?`)) delMut.mutate(r.id);
                    }}
                    className="text-muted-foreground hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border/60">
          {data ? (
            <>
              Showing {data.rows.length} of {data.count}
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
