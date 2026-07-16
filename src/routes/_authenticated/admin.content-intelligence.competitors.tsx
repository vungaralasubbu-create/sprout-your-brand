import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Swords, Info } from "lucide-react";
import { REFERENCE_COMPETITORS } from "@/lib/content-intelligence/authority";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/competitors")({
  component: CompetitorsPage,
});

function CompetitorsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Swords className="size-5 text-primary" /> Competitor Tracking
        </h1>
        <p className="text-sm text-muted-foreground">
          Architecture for tracking public content, topic and keyword coverage across peer platforms. Editors add competitors here — the crawler queues comparisons using only publicly available content.
        </p>
      </header>

      <Card className="p-4 border-primary/30 bg-primary/5 flex gap-3">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong>Read-only reference set.</strong> Automated crawling is disabled until an editor connects a data source (e.g. Semrush, Ahrefs). Nothing is scraped from private or auth-gated pages.
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {REFERENCE_COMPETITORS.map((c) => (
          <Card key={c.slug} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="text-[11px] font-mono text-muted-foreground">{c.domain}</div>
              </div>
              <span className="rounded-full border border-border/70 bg-surface-2/60 px-2 py-0.5 text-[10px] uppercase tracking-wider">Reference</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{c.notes}</p>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Focus areas</div>
            <div className="flex flex-wrap gap-1.5">
              {c.focus.map((f) => (
                <span key={f} className="rounded-full border border-border/60 bg-white px-2 py-0.5 text-[11px]">{f}</span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-4 text-center border-t border-border/60 pt-3">
              {[
                { k: "Content", v: "—" },
                { k: "Topics", v: "—" },
                { k: "Keywords", v: "—" },
                { k: "Gaps", v: "—" },
              ].map((m) => (
                <div key={m.k}>
                  <div className="text-sm font-semibold">{m.v}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.k}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
