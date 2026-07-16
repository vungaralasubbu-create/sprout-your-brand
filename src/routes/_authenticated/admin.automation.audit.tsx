import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AutomationHeader } from "@/components/automation/header";
import { listAudit } from "@/lib/automation/store";
import type { AuditEntry } from "@/lib/automation/types";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/automation/audit")({
  component: Audit,
});

const tone: Record<AuditEntry["event"], string> = {
  created: "bg-sky-100 text-sky-800 border-sky-200",
  updated: "bg-neutral-100 text-neutral-800",
  deleted: "bg-rose-100 text-rose-800 border-rose-200",
  executed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-rose-100 text-rose-800 border-rose-200",
  published: "bg-violet-100 text-violet-800 border-violet-200",
  rolled_back: "bg-amber-100 text-amber-800 border-amber-200",
};

function Audit() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  useEffect(() => { setItems(listAudit()); }, []);

  return (
    <div className="space-y-6">
      <AutomationHeader title="Audit Log" description="A tamper-evident record of every automation change and execution." />
      <div className="rounded-lg border border-border/60 bg-white divide-y divide-border/60">
        {items.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No audit entries yet.</div>}
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Badge className={tone[a.event]}>{a.event.replace("_", " ")}</Badge>
              <span className="font-medium truncate">{a.workflowName}</span>
              {a.detail && <span className="text-muted-foreground">— {a.detail}</span>}
            </div>
            <div className="text-muted-foreground whitespace-nowrap">{new Date(a.at).toLocaleString()} · {a.actor}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
