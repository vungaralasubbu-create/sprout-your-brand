import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listKbCategories, listKbArticles, kbRecommendations } from "@/lib/admin/kb.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Rocket, GraduationCap, Building2, Presentation, CreditCard, Code, Shield,
  BookOpen, Sparkles, Play, ArrowRight, MessageSquare, HelpCircle, FileText, Compass,
} from "lucide-react";
import { KbAiWidget } from "@/components/kb/kb-ai-widget";

const ICONS: Record<string, any> = {
  Rocket, GraduationCap, Building2, Presentation, CreditCard, Code, Shield,
  BookOpen, Sparkles, HelpCircle, FileText, Compass,
};

const KIND_ICON: Record<string, any> = {
  article: FileText, faq: HelpCircle, documentation: Code, tutorial: Compass,
  guide: BookOpen, walkthrough: Sparkles, video: Play,
};

export const Route = createFileRoute("/help/")({
  loader: async ({ context }) => {
    const [categories, featured] = await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["kb-cats"], queryFn: () => listKbCategories(), staleTime: 5 * 60_000,
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["kb-featured"], queryFn: () => kbRecommendations({ data: { limit: 6 } }), staleTime: 5 * 60_000,
      }),
    ]);
    return { categories, featured };
  },
  head: () => {
    const url = "https://glintr.com/help";
    return {
      meta: [
        { title: "Help Center — Glintr Knowledge Base" },
        { name: "description", content: "Search articles, FAQs, tutorials, guides, and video walkthroughs for students, partners, and instructors. Ask Glintr AI anything about the platform." },
        { property: "og:title", content: "Help Center — Glintr" },
        { property: "og:description", content: "Answers, tutorials and platform walkthroughs for the Glintr ecosystem." },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Glintr Help Center",
          url,
          potentialAction: {
            "@type": "SearchAction",
            target: `${url}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }),
      }],
    };
  },
  component: HelpIndex,
  errorComponent: ({ error }) => <div className="p-6 text-red-500">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

function HelpIndex() {
  const { categories, featured } = Route.useLoaderData() as any;
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const search = useQuery({
    queryKey: ["kb-search", q],
    queryFn: () => listKbArticles({ data: { q, limit: 12 } }),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <section className="border-b bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <Badge variant="info" className="mb-3">Help Center</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            How can we help?
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Search articles, FAQs, tutorials, guides and walkthroughs — or ask Glintr AI anything.
          </p>
          <form
            className="mt-6 max-w-2xl mx-auto flex gap-2"
            onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate({ to: "/help/search", search: { q } as any }); }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Try 'how to enroll' or 'partner payouts'..."
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg">Search</Button>
          </form>

          {q.trim().length >= 2 && search.data?.articles?.length ? (
            <Card className="mt-3 max-w-2xl mx-auto text-left divide-y">
              {search.data.articles.slice(0, 6).map((a: any) => {
                const KI = KIND_ICON[a.kind] ?? FileText;
                return (
                  <Link key={a.id} to="/help/$slug" params={{ slug: a.slug }} className="flex items-start gap-3 p-3 hover:bg-accent/40">
                    <KI size={18} className="mt-0.5 text-primary shrink-0" />
                    <div>
                      <div className="font-medium">{a.title}</div>
                      {a.summary && <div className="text-sm text-muted-foreground line-clamp-1">{a.summary}</div>}
                    </div>
                  </Link>
                );
              })}
            </Card>
          ) : null}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Browse by category</h2>
          <Link to="/help/search" search={{ q: "" } as any} className="text-sm text-primary hover:underline flex items-center gap-1">
            All articles <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(categories.categories || []).map((c: any) => {
            const I = ICONS[c.icon || "BookOpen"] ?? BookOpen;
            return (
              <Link key={c.id} to="/help/c/$category" params={{ category: c.slug }}>
                <Card className="p-5 hover:shadow-lg transition-all border-2 hover:border-primary/40 h-full">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${c.color || "#22d3ee"}22`, color: c.color || "#22d3ee" }}
                  >
                    <I size={22} />
                  </div>
                  <div className="font-semibold">{c.name}</div>
                  {c.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</div>}
                  <div className="text-xs text-muted-foreground mt-3">{c.article_count} articles</div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {featured?.articles?.length ? (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={20} className="text-primary" />
            <h2 className="text-2xl font-semibold">Recommended reads</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.articles.map((a: any) => {
              const KI = KIND_ICON[a.kind] ?? FileText;
              return (
                <Link key={a.id} to="/help/$slug" params={{ slug: a.slug }}>
                  <Card className="p-5 h-full hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <KI size={16} className="text-primary" />
                      <Badge variant="outline" className="text-xs uppercase">{a.kind}</Badge>
                    </div>
                    <div className="font-semibold line-clamp-2">{a.title}</div>
                    {a.summary && <div className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.summary}</div>}
                    <div className="mt-3 text-xs text-primary flex items-center gap-1">Read <ArrowRight size={12} /></div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="max-w-4xl mx-auto px-4 pb-20">
        <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 text-center">
          <MessageSquare size={36} className="text-primary mx-auto mb-3" />
          <h3 className="text-2xl font-semibold">Still stuck?</h3>
          <p className="text-muted-foreground mt-2">Ask Glintr AI — it's trained on the whole help center.</p>
          <div className="mt-4">
            <KbAiWidget triggerLabel="Ask Glintr AI" />
          </div>
        </Card>
      </section>
    </div>
  );
}
