import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiSearchDashboard } from "@/lib/admin/ai-search.functions";
import { Card } from "@/components/ui/card";
import { MessageSquareQuote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-search/citation")({
  component: Citation,
});

function Citation() {
  const fn = useServerFn(getAiSearchDashboard);
  const { data } = useQuery({ queryKey: ["ai-search-dash"], queryFn: () => fn(), staleTime: 60_000 });

  const parts = [
    { k: "definition", label: "Definitions", desc: "Clear canonical explanations of each concept." },
    { k: "faq", label: "FAQ sections", desc: "Concise Q&A that AI systems can extract directly." },
    { k: "summary", label: "Quick Answers", desc: "TL;DR and Key Takeaways at the top of the page." },
    { k: "entities", label: "Entity links", desc: "Internal links to canonical entity pages." },
    { k: "structure", label: "Retrieval structure", desc: "Headings, bullets and short paragraphs." },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><MessageSquareQuote className="size-4 text-primary" /> Citation Readiness</h1>
        <p className="text-sm text-muted-foreground">How likely AI systems are to cite Glintr as a source for definitions, comparisons and how-to answers.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {parts.map((p) => {
          const v = (data?.readiness as any)?.[p.k] ?? 0;
          return (
            <Card key={p.k} className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{p.label}</div>
                <div className="font-mono text-sm">{v}<span className="text-muted-foreground">/100</span></div>
              </div>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${v}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{p.desc}</p>
            </Card>
          );
        })}
      </div>
      <Card className="p-4 text-xs text-muted-foreground">
        Citation blocks are surfaced on live pages via <code>AiCitationBlock</code>, <code>QuickAnswer</code> and <code>KeyTakeaways</code>. Never fabricate summaries — they must reflect the article's actual content.
      </Card>
    </div>
  );
}
