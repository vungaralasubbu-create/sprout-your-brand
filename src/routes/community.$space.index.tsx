import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listSpaces, listThreads } from "@/lib/community/community.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, HelpCircle, Vote, Megaphone, Calendar, Plus, ArrowLeft } from "lucide-react";

const KIND_META: Record<string, { icon: any; label: string; color: string }> = {
  discussion: { icon: MessageSquare, label: "Discussion", color: "text-primary" },
  question: { icon: HelpCircle, label: "Question", color: "text-amber-500" },
  poll: { icon: Vote, label: "Poll", color: "text-fuchsia-500" },
  announcement: { icon: Megaphone, label: "Announcement", color: "text-cyan-500" },
  event: { icon: Calendar, label: "Event", color: "text-emerald-500" },
};

export const Route = createFileRoute("/community/$space/")({
  loader: async ({ params, context }) => {
    const res = await context.queryClient.ensureQueryData({
      queryKey: ["community-space", params.space],
      queryFn: async () => {
        const { spaces } = await listSpaces();
        const space = spaces.find((s: any) => s.slug === params.space);
        return space ?? null;
      },
      staleTime: 60_000,
    });
    if (!res) throw notFound();
    return { space: res };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const s: any = loaderData.space;
    const title = `${s.name} — Glintr Community`;
    const desc = s.description || `Join the ${s.name} community on Glintr.`;
    const url = `https://glintr.com/community/${params.space}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: SpacePage,
  notFoundComponent: () => (
    <div className="p-12 text-center">
      <h1 className="text-2xl font-bold">Space not found</h1>
      <Button asChild className="mt-4"><Link to="/community">Back to community</Link></Button>
    </div>
  ),
  errorComponent: ({ error }) => <div className="p-6 text-red-500">{error.message}</div>,
});

function SpacePage() {
  const { space } = Route.useLoaderData();
  const { space: spaceSlug } = Route.useParams();
  const [sort, setSort] = useState<"latest" | "top" | "new">("latest");
  const [kind, setKind] = useState<string | undefined>();
  const fn = useServerFn(listThreads);
  const threads = useQuery({
    queryKey: ["community-space-threads", spaceSlug, sort, kind],
    queryFn: () => fn({ data: { space_slug: spaceSlug, sort, kind: kind as any, limit: 30, offset: 0 } }),
    staleTime: 20_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-primary/5 to-transparent">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Link to="/community" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> All spaces
          </Link>
          <div className="mt-3 flex items-start gap-4 flex-wrap">
            <div className="text-5xl">{(space as any).icon || "💬"}</div>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-3xl md:text-4xl font-bold">{(space as any).name}</h1>
              <p className="text-muted-foreground mt-1 max-w-2xl">{(space as any).description}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <Badge variant="outline">{(space as any).thread_count} threads</Badge>
                {(space as any).audience !== "public" && <Badge variant="info">{(space as any).audience.replace("_", " ")}</Badge>}
              </div>
            </div>
            <Button asChild>
              <Link to="/community/new" search={{ space: spaceSlug } as any}><Plus className="w-4 h-4 mr-1" /> New thread</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(["latest", "top", "new"] as const).map((s) => (
            <Button key={s} size="sm" variant={sort === s ? "primary" : "outline"} onClick={() => setSort(s)}>
              {s === "latest" ? "Latest activity" : s === "top" ? "Top" : "Newest"}
            </Button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-1">
            <Button size="sm" variant={!kind ? "primary" : "ghost"} onClick={() => setKind(undefined)}>All</Button>
            {Object.entries(KIND_META).map(([k, m]) => (
              <Button key={k} size="sm" variant={kind === k ? "primary" : "ghost"} onClick={() => setKind(k)}>
                <m.icon className={`w-3 h-3 mr-1 ${m.color}`} /> {m.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {threads.isLoading && <div className="text-muted-foreground text-sm">Loading…</div>}
          {threads.data?.threads.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground">
              Nothing here yet. <Link to="/community/new" search={{ space: spaceSlug } as any} className="text-primary underline">Start the conversation</Link>.
            </Card>
          )}
          {threads.data?.threads.map((t: any) => {
            const meta = KIND_META[t.kind] || KIND_META.discussion;
            const Icon = meta.icon;
            return (
              <Link key={t.id} to="/community/$space/$slug" params={{ space: spaceSlug, slug: t.slug }}>
                <Card className="p-4 hover:border-primary hover:shadow-sm transition flex gap-3">
                  <div className="text-center w-14 shrink-0">
                    <div className="text-lg font-bold">{t.upvote_count}</div>
                    <div className="text-[10px] text-muted-foreground">upvotes</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                      {t.is_pinned && <Badge variant="warning" className="text-[10px]">Pinned</Badge>}
                      {t.is_featured && <Badge variant="featured" className="text-[10px]">Featured</Badge>}
                      <span className="text-xs text-muted-foreground">{meta.label}</span>
                    </div>
                    <div className="font-semibold hover:text-primary mt-0.5 line-clamp-2">{t.title}</div>
                    {t.excerpt && <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{t.excerpt}</div>}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{t.post_count} replies</span>
                      <span>·</span>
                      <span>{new Date(t.last_activity_at).toLocaleDateString()}</span>
                      {t.tags?.slice(0, 4).map((tag: string) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
