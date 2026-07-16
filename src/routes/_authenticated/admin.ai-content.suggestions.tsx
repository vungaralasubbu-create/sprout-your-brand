import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateContentSuggestions } from "@/lib/admin/ai-content.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, GitCompare, BookOpen, Zap } from "lucide-react";
import { CONTENT_TYPE_LABEL } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/ai-content/suggestions")({
  component: SuggestionsPage,
});

function SuggestionsPage() {
  const fn = useServerFn(generateContentSuggestions);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["ai-suggestions"], queryFn: () => fn() });

  function openWizard() { navigate({ to: "/admin/ai-content/wizard" as any }); }

  const sections = [
    { key: "program_gaps", title: "Program gaps", icon: BookOpen, items: data?.program_gaps ?? [], subtitle: "Programs missing a learn-guide companion." },
    { key: "comparisons", title: "Missing comparisons", icon: GitCompare, items: data?.comparisons ?? [], subtitle: "High-intent 'X vs Y' queries with no matching page." },
    { key: "glossary", title: "Glossary candidates", icon: BookOpen, items: data?.glossary ?? [], subtitle: "Technical vocabulary you don't cover yet." },
    { key: "trending", title: "Trending & roadmap ideas", icon: Zap, items: data?.trending ?? [], subtitle: "Editorially curated ideas aligned to Glintr's models." },
  ];

  return (
    <div className="space-y-4 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2"><Lightbulb className="size-5 text-primary" /> AI Content Suggestions</h1>
        <p className="text-sm text-muted-foreground">Opportunities based on your published programs, glossary and comparisons.</p>
      </header>

      {isLoading ? <div className="text-sm text-muted-foreground">Analysing catalog…</div> : sections.map((s) => (
        <Card key={s.key} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium flex items-center gap-2"><s.icon className="size-4" /> {s.title} <Badge variant="outline" className="ml-1 text-[10px]">{s.items.length}</Badge></h2>
              <p className="text-xs text-muted-foreground">{s.subtitle}</p>
            </div>
          </div>
          <div className="divide-y divide-border/60">
            {s.items.map((it: any, i: number) => (
              <div key={i} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{it.title}</div>
                  <div className="text-xs text-muted-foreground">{CONTENT_TYPE_LABEL[it.kind] ?? it.kind} · {it.rationale}</div>
                </div>
                <Button size="sm" onClick={openWizard}><Sparkles className="size-3.5 mr-1" /> Draft</Button>
              </div>
            ))}
            {!s.items.length && <div className="text-xs text-muted-foreground py-3 text-center">Nothing here right now.</div>}
          </div>
        </Card>
      ))}
    </div>
  );
}
