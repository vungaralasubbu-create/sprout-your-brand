import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listKbArticles } from "@/lib/admin/kb.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/help/search")({
  validateSearch: (s) => searchSchema.parse(s),
  head: ({ search }) => ({
    meta: [
      { title: search.q ? `Search: ${search.q} — Glintr Help` : "Search — Glintr Help" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchView,
});

function SearchView() {
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ);
  const query = useQuery({
    queryKey: ["kb-search-full", q],
    queryFn: () => listKbArticles({ data: { q, limit: 60 } }),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link to="/help" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3">
            <ArrowLeft size={14} /> Help Center
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">Search articles</h1>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 h-12 text-base"
              placeholder="Search articles, FAQs, tutorials..."
              autoFocus
            />
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {q.trim().length < 2 && <div className="text-muted-foreground">Type at least 2 characters to search.</div>}
        {query.isLoading && <div className="text-muted-foreground">Searching…</div>}
        {query.data && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{query.data.articles.length} results</div>
            {query.data.articles.map((a: any) => (
              <Link key={a.id} to="/help/$slug" params={{ slug: a.slug }}>
                <Card className="p-4 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="uppercase text-[10px]">{a.kind}</Badge>
                    {a.reading_time && <span className="text-xs text-muted-foreground">{a.reading_time} min</span>}
                  </div>
                  <div className="font-semibold">{a.title}</div>
                  {a.summary && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.summary}</div>}
                  <div className="text-xs text-primary mt-2 flex items-center gap-1">Open <ArrowRight size={12} /></div>
                </Card>
              </Link>
            ))}
            {query.data.articles.length === 0 && <div className="text-muted-foreground">No results.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
