import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiSearchDashboard } from "@/lib/admin/ai-search.functions";
import { Card } from "@/components/ui/card";
import { Bot, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-search/")({
  component: AiSearchDash,
});

function AiSearchDash() {
  const fn = useServerFn(getAiSearchDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["ai-search-dash"], queryFn: () => fn(), staleTime: 60_000 });

  const tiles = [
    { key: "overall", label: "AI Readiness Score", accent: "text-primary" },
    { key: "citation", label: "Citation Readiness" },
    { key: "entities", label: "Entity Coverage" },
    { key: "schema", label: "Structured Data Score" },
    { key: "summary", label: "Quick Answer Coverage" },
    { key: "faq", label: "FAQ Coverage" },
    { key: "definition", label: "Definition Coverage" },
    { key: "metadata", label: "Metadata Health" },
    { key: "structure", label: "Retrieval Structure" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <Bot className="size-4 text-primary" /> AI Search Optimization
        </h1>
        <p className="text-sm text-muted-foreground">How well Glintr's educational content can be understood, summarized and cited by AI search systems.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Analyzing content…</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiles.map((t) => {
          const v = (data?.readiness as any)?.[t.key] ?? 0;
          return (
            <Card key={t.key} className="p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{t.label}</div>
              <div className={`mt-1 font-display text-2xl font-semibold ${t.accent ?? ""}`}>{v}<span className="text-sm text-muted-foreground">/100</span></div>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${v}%` }} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Coverage across published content</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          {Object.entries(data?.coverage ?? {}).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded border border-border/60 px-3 py-2">
              <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
              <span className="font-mono text-xs">{v}%</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm font-semibold mb-2">Weakest for AI retrieval</div>
          <div className="space-y-1.5">
            {data?.weakest?.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{w.title}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{w.overall}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold mb-2">Strongest for AI retrieval</div>
          <div className="space-y-1.5">
            {data?.strongest?.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{w.title}</span>
                <span className="text-[10px] font-mono text-emerald-600">{w.overall}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Link to={"/admin/ai-search/tasks" as any} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        Open editor tasks <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
