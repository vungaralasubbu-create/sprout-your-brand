import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getIntelSummary } from "@/lib/content-intelligence/intel.functions";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/ai-citation")({
  component: AiCitationPage,
});

const CRITERIA = [
  { key: "quickAnswers", label: "Quick Answers", desc: "Concise 40-60 word summaries near the top of the page." },
  { key: "definitions", label: "Definitions", desc: "Canonical, schema-backed definitions for every entity." },
  { key: "entityStructure", label: "Entity Structure", desc: "Named entities with unambiguous relationships." },
  { key: "faqQuality", label: "FAQ Quality", desc: "Distinct question phrasings that mirror real search intent." },
  { key: "knowledgeBlocks", label: "Knowledge Blocks", desc: "Definition, history, application, trends sections." },
  { key: "summaries", label: "Summaries", desc: "Key takeaways and TL;DR blocks." },
  { key: "relatedConcepts", label: "Related Concepts", desc: "Recursive linking between related entities." },
  { key: "structuredData", label: "Structured Data", desc: "JSON-LD payloads for DefinedTerm, FAQ, HowTo, Course." },
] as const;

function AiCitationPage() {
  const fn = useServerFn(getIntelSummary);
  const { data, isLoading } = useQuery({ queryKey: ["intel-summary"], queryFn: () => fn(), staleTime: 60_000 });
  const s = data?.scores;

  const readiness = s?.aiCitationReadiness ?? 0;
  const derived: Record<string, number> = s ? {
    quickAnswers: s.geoScore,
    definitions: s.entityCoverage,
    entityStructure: Math.round((s.entityCoverage + s.knowledgeGraphHealth) / 2),
    faqQuality: s.geoScore,
    knowledgeBlocks: Math.round((s.geoScore + s.contentQuality) / 2),
    summaries: s.geoScore,
    relatedConcepts: s.internalLinkHealth,
    structuredData: s.overallSeo,
  } : {};

  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Sparkles className="size-5 text-primary" /> AI Citation Readiness
        </h1>
        <p className="text-sm text-muted-foreground">
          How ready the library is to be cited by ChatGPT, Gemini, Claude and AI Overviews. Reflects structure, definitions, summaries and schema.
        </p>
      </header>

      <Card className="p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Overall readiness</div>
            <div className="text-4xl font-semibold">{isLoading ? "—" : `${readiness}/100`}</div>
          </div>
          <div className="text-xs text-muted-foreground">
            {readiness >= 70 ? "Strong — content is AI-friendly." :
             readiness >= 45 ? "Improving — expand structured summaries and FAQs." :
             "Needs work — add quick answers, definitions and JSON-LD."}
          </div>
        </div>
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <div
            className={`h-full ${readiness >= 70 ? "bg-emerald-500" : readiness >= 45 ? "bg-amber-500" : "bg-rose-500"}`}
            style={{ width: `${readiness}%` }}
          />
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {CRITERIA.map((c) => {
          const v = derived[c.key] ?? 0;
          return (
            <Card key={c.key} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-sm">{c.label}</div>
                <div className="text-sm font-mono">{v}</div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{c.desc}</p>
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className={`h-full ${v >= 70 ? "bg-emerald-500" : v >= 45 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${v}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
