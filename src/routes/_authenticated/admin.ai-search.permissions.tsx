import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Check, X } from "lucide-react";

const ROLES = ["Administrator", "SEO Manager", "Content Manager", "Editor", "Reviewer"] as const;
const CAPS = [
  { c: "View dashboards", grants: [1, 1, 1, 1, 1] },
  { c: "Edit AI summary blocks", grants: [1, 1, 1, 1, 0] },
  { c: "Approve schema changes", grants: [1, 1, 0, 0, 0] },
  { c: "Publish llms.txt updates", grants: [1, 1, 0, 0, 0] },
  { c: "Generate reports", grants: [1, 1, 1, 0, 0] },
  { c: "Mark tasks complete", grants: [1, 1, 1, 1, 1] },
  { c: "Manage permissions", grants: [1, 0, 0, 0, 0] },
];

export const Route = createFileRoute("/_authenticated/admin/ai-search/permissions")({
  component: Permissions,
});

function Permissions() {
  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Permissions</h1>
        <p className="text-sm text-muted-foreground">Role-based access for the AI Search Optimization platform.</p>
      </header>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-[11px] uppercase font-mono text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Capability</th>
              {ROLES.map((r) => <th key={r} className="text-center px-3 py-2">{r}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {CAPS.map((row) => (
              <tr key={row.c}>
                <td className="px-4 py-2">{row.c}</td>
                {row.grants.map((g, i) => (
                  <td key={i} className="text-center px-3 py-2">
                    {g ? <Check className="size-4 text-emerald-600 inline" /> : <X className="size-4 text-muted-foreground/40 inline" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
