import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Card, EmptyState, SectionHeader } from "@/components/workspace/hub-shell";
import { useHighlights } from "@/lib/workspace/hub";

export const Route = createFileRoute("/workspace/highlights")({
  component: HighlightsPage,
});

function HighlightsPage() {
  const { allHighlights, remove } = useHighlights();
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return t ? allHighlights.filter((h) => `${h.text} ${h.comment ?? ""}`.toLowerCase().includes(t)) : allHighlights;
  }, [q, allHighlights]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Saved"
        title="Highlights"
        description="Every quote and passage you've saved across Glintr. Click ‘Jump back’ to return to the source page."
      />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search highlights…"
        className="w-full rounded-full border border-border/70 bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      {filtered.length === 0 ? (
        <EmptyState title="No highlights" hint="Save highlights from Learn guides, blogs and program pages." />
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => (
            <Card key={h.id} className="!p-4">
              <p className="border-l-4 border-primary/60 pl-3 text-sm text-foreground">"{h.text}"</p>
              {h.comment && <p className="mt-2 text-xs text-muted-foreground">💭 {h.comment}</p>}
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="min-w-0 truncate">
                  {h.source.title && <span>{h.source.title}</span>}
                  {h.source.path && (
                    <>
                      {" • "}
                      <Link to={h.source.path} className="text-primary hover:underline">
                        Jump back
                      </Link>
                    </>
                  )}
                </div>
                <button type="button" onClick={() => remove(h.id)} className="hover:text-red-500" aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
