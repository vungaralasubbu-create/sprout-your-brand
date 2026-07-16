import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRelatedSuggestions } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { LinkIcon, ArrowRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/related")({
  component: Related,
});

function Related() {
  const fn = useServerFn(getRelatedSuggestions);
  const { data, isLoading } = useQuery({ queryKey: ["ci-related"], queryFn: () => fn({ data: {} }), staleTime: 60_000 });
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-5 max-w-6xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><LinkIcon className="size-4 text-primary" /> Related Content Engine</h1>
        <p className="text-sm text-muted-foreground">Article pairs that should probably link to each other. Approve to queue an editor task; nothing is auto-inserted.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Scanning links…</div>}

      <div className="space-y-2">
        {(data?.suggestions ?? []).map((s, i) => {
          const key = `${s.source_id}-${s.target_id}`;
          if (dismissed.has(key)) return null;
          const isApproved = approved.has(key);
          return (
            <Card key={key + i} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0 text-sm">
                <div className="truncate font-medium">{s.source_title}</div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                  <ArrowRight className="size-3" />
                  <span className="truncate">{s.target_title}</span>
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase">{s.target_type}</span>
                </div>
              </div>
              <div className="text-xs font-mono text-muted-foreground">{s.confidence}%</div>
              {isApproved ? (
                <span className="text-xs font-medium text-emerald-600">Queued</span>
              ) : (
                <>
                  <button onClick={() => setApproved((p) => new Set(p).add(key))} className="rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs font-medium">Approve</button>
                  <button onClick={() => setDismissed((p) => new Set(p).add(key))} className="rounded-md border px-2.5 py-1 text-xs font-medium">Dismiss</button>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
