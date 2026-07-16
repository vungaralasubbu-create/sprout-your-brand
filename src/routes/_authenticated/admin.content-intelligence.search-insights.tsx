import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSearchInsights } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { TrendingUp, Link as LinkIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/search-insights")({
  component: SearchInsights,
});

function SearchInsights() {
  const fn = useServerFn(getSearchInsights);
  const { data } = useQuery({ queryKey: ["ci-gsc"], queryFn: () => fn(), staleTime: 300_000 });

  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> Search Insights</h1>
        <p className="text-sm text-muted-foreground">Google Search Console signals feed this view once the property is connected.</p>
      </header>

      {!data?.connected ? (
        <Card className="p-6">
          <h2 className="text-sm font-semibold">Search Console isn't connected yet</h2>
          <p className="text-sm text-muted-foreground mt-1">Once connected, this view surfaces:</p>
          <ul className="mt-3 text-sm space-y-1 list-disc pl-5 text-muted-foreground">
            <li>Top queries driving traffic</li>
            <li>Growing and declining queries week-over-week</li>
            <li>Low-CTR opportunities with meaningful impressions</li>
            <li>High-impression pages worth expanding</li>
            <li>Pages that Google discovered but hasn't indexed</li>
          </ul>
          <div className="mt-4 rounded-md border border-border/60 bg-surface-2/60 p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground mb-1">Setup guidance</div>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Verify glintr.com in Google Search Console (a META token can be generated automatically).</li>
              <li>Connect the Google Search Console connector from workspace settings.</li>
              <li>Return here — this view will populate on the next refresh.</li>
            </ol>
          </div>
          <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <LinkIcon className="size-3" /> Open Search Console
          </a>
        </Card>
      ) : null}
    </div>
  );
}
