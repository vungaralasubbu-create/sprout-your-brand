import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { listKbArticles, listKbCategories } from "@/lib/admin/kb.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, FileText, HelpCircle, Code, Compass, BookOpen, Sparkles, Play } from "lucide-react";

const KIND_ICON: Record<string, any> = {
  article: FileText, faq: HelpCircle, documentation: Code, tutorial: Compass,
  guide: BookOpen, walkthrough: Sparkles, video: Play,
};

export const Route = createFileRoute("/help/c/$category")({
  loader: async ({ params, context }) => {
    const cats = await context.queryClient.ensureQueryData({
      queryKey: ["kb-cats"], queryFn: () => listKbCategories(), staleTime: 5 * 60_000,
    });
    const category = (cats.categories || []).find((c: any) => c.slug === params.category);
    if (!category) throw notFound();
    const articles = await context.queryClient.ensureQueryData({
      queryKey: ["kb-cat-articles", params.category],
      queryFn: () => listKbArticles({ data: { category_slug: params.category, limit: 100 } }),
      staleTime: 60_000,
    });
    return { category, articles };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Category" }] };
    const c: any = loaderData.category;
    const url = `https://glintr.com/help/c/${params.category}`;
    return {
      meta: [
        { title: `${c.name} — Glintr Help` },
        { name: "description", content: c.description || `Help articles in ${c.name}` },
        { property: "og:title", content: `${c.name} — Glintr Help` },
        { property: "og:description", content: c.description || "" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CategoryView,
  errorComponent: ({ error }) => <div className="p-6 text-red-500">{error.message}</div>,
  notFoundComponent: () => (
    <div className="p-12 text-center">
      <h1 className="text-2xl font-bold">Category not found</h1>
      <Button asChild className="mt-4"><Link to="/help">Back to Help Center</Link></Button>
    </div>
  ),
});

function CategoryView() {
  const { category, articles } = Route.useLoaderData() as any;
  const list = articles.articles || [];
  const byKind: Record<string, any[]> = {};
  for (const a of list) { (byKind[a.kind] ||= []).push(a); }

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Link to="/help" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3">
            <ArrowLeft size={14} /> Help Center
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold">{category.name}</h1>
          {category.description && <p className="text-lg text-muted-foreground mt-2">{category.description}</p>}
          <div className="text-sm text-muted-foreground mt-2">{list.length} articles</div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {Object.keys(byKind).map((kind) => {
          const KI = KIND_ICON[kind] ?? FileText;
          return (
            <section key={kind}>
              <div className="flex items-center gap-2 mb-4">
                <KI size={20} className="text-primary" />
                <h2 className="text-xl font-semibold capitalize">{kind}s</h2>
                <Badge variant="outline">{byKind[kind].length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {byKind[kind].map((a: any) => (
                  <Link key={a.id} to="/help/$slug" params={{ slug: a.slug }}>
                    <Card className="p-4 h-full hover:shadow-lg transition-all">
                      <div className="font-semibold">{a.title}</div>
                      {a.summary && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.summary}</div>}
                      <div className="text-xs text-primary mt-2 flex items-center gap-1">Read <ArrowRight size={12} /></div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
        {list.length === 0 && <div className="text-muted-foreground">No articles yet in this category.</div>}
      </div>
    </div>
  );
}
