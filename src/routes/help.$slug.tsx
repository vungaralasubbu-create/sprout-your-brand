import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getKbArticle, submitKbFeedback } from "@/lib/admin/kb.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { ArrowRight, ThumbsUp, ThumbsDown, Clock, Eye, ChevronRight, Play, FileText, HelpCircle, Code, Compass, BookOpen, Sparkles } from "lucide-react";
import { KbAiWidget } from "@/components/kb/kb-ai-widget";
import { toast } from "sonner";

const KIND_ICON: Record<string, any> = {
  article: FileText, faq: HelpCircle, documentation: Code, tutorial: Compass,
  guide: BookOpen, walkthrough: Sparkles, video: Play,
};

export const Route = createFileRoute("/help/$slug")({
  loader: async ({ params, context }) => {
    const res = await context.queryClient.ensureQueryData({
      queryKey: ["kb-article", params.slug],
      queryFn: () => getKbArticle({ data: { slug: params.slug } }),
      staleTime: 60_000,
    });
    if (!res?.article) throw notFound();
    return res;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const a: any = loaderData.article;
    const url = `https://glintr.com/help/${params.slug}`;
    return {
      meta: [
        { title: a.seo_title || a.title },
        { name: "description", content: a.seo_description || a.summary || "" },
        { name: "keywords", content: (a.seo_keywords || []).join(", ") },
        { property: "og:title", content: a.seo_title || a.title },
        { property: "og:description", content: a.seo_description || a.summary || "" },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        ...(a.cover_image ? [{ property: "og:image", content: a.cover_image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: a.json_ld ? [{ type: "application/ld+json", children: JSON.stringify(a.json_ld) }] : [],
    };
  },
  component: ArticleView,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <p className="text-red-500">{error.message}</p>
        <Button onClick={() => { reset(); router.invalidate(); }} className="mt-2">Retry</Button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="p-12 text-center">
      <h1 className="text-2xl font-bold">Article not found</h1>
      <Button asChild className="mt-4"><Link to="/help">Back to Help Center</Link></Button>
    </div>
  ),
});

function ArticleView() {
  const { article, related, category } = Route.useLoaderData() as any;
  const KI = KIND_ICON[article.kind] ?? FileText;
  const [feedback, setFeedback] = useState<"helpful" | "unhelpful" | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function sendFeedback(helpful: boolean) {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sign in to submit feedback.");
        setSubmitting(false);
        return;
      }
      await submitKbFeedback({ data: { article_id: article.id, helpful, comment } });
      setFeedback(helpful ? "helpful" : "unhelpful");
      toast.success("Thanks for the feedback!");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <Link to="/help" className="hover:text-primary">Help</Link>
            <ChevronRight size={14} />
            {category ? (
              <>
                <Link to="/help/c/$category" params={{ category: category.slug }} className="hover:text-primary">{category.name}</Link>
                <ChevronRight size={14} />
              </>
            ) : null}
            <span className="line-clamp-1">{article.title}</span>
          </nav>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="info" className="uppercase text-[10px]"><KI size={12} className="mr-1" /> {article.kind}</Badge>
            {category && <Badge variant="outline">{category.name}</Badge>}
            {article.featured && <Badge variant="featured">Featured</Badge>}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{article.title}</h1>
          {article.summary && <p className="text-lg text-muted-foreground mt-3">{article.summary}</p>}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            {article.reading_time && <span className="flex items-center gap-1"><Clock size={14} /> {article.reading_time} min read</span>}
            <span className="flex items-center gap-1"><Eye size={14} /> {article.view_count} views</span>
            <span>v{article.version}</span>
            <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {article.kind === "video" && article.video_url && (
          <Card className="aspect-video overflow-hidden bg-black">
            <iframe
              src={article.video_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={article.title}
            />
          </Card>
        )}

        {article.body_md && (
          <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-24">
            <ReactMarkdown>{article.body_md}</ReactMarkdown>
          </article>
        )}

        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((t: string) => (
              <Badge key={t} variant="outline">#{t}</Badge>
            ))}
          </div>
        )}

        <Card className="p-6">
          <div className="font-semibold">Was this helpful?</div>
          {feedback ? (
            <div className="text-sm text-muted-foreground mt-2">Thanks — your feedback was recorded.</div>
          ) : (
            <>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => sendFeedback(true)} disabled={submitting}>
                  <ThumbsUp size={16} className="mr-2" /> Yes
                </Button>
                <Button variant="outline" onClick={() => sendFeedback(false)} disabled={submitting}>
                  <ThumbsDown size={16} className="mr-2" /> No
                </Button>
              </div>
              <Textarea
                placeholder="Optional: tell us what could be better..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-3"
              />
            </>
          )}
        </Card>

        {related?.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Related articles</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {related.map((r: any) => (
                <Link key={r.id} to="/help/$slug" params={{ slug: r.slug }}>
                  <Card className="p-4 hover:shadow-lg transition-all h-full">
                    <div className="text-xs text-muted-foreground uppercase">{r.kind}</div>
                    <div className="font-semibold mt-1">{r.title}</div>
                    {r.summary && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.summary}</div>}
                    <div className="text-xs text-primary mt-2 flex items-center gap-1">Read <ArrowRight size={12} /></div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 text-center">
          <div className="font-semibold text-lg">Have more questions?</div>
          <p className="text-muted-foreground text-sm mt-1">Ask Glintr AI — it searches the whole Knowledge Base.</p>
          <div className="mt-3 flex justify-center">
            <KbAiWidget initialQuestion={`Tell me more about: ${article.title}`} />
          </div>
        </Card>
      </div>
    </div>
  );
}
