import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/agency/analytics")({
  component: () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Client Analytics</h2>
        <p className="text-sm text-muted-foreground">Aggregated performance across every branded portal.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Campaigns", "9,412"],
          ["Projects", "1,842"],
          ["AI usage", "4.2M cr"],
          ["Revenue", "$84,320"],
          ["Leads", "24,180"],
          ["Conversions", "3,214"],
          ["Active users", "612"],
          ["Retention", "94%"],
        ].map(([l, v]) => (
          <Card key={l} className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{l}</div>
            <div className="mt-2 text-2xl font-semibold">{v}</div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Campaign volume by client</h3>
          <div className="h-56 rounded-lg bg-gradient-to-br from-primary/15 to-transparent" />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">AI credits by client</h3>
          <div className="h-56 rounded-lg bg-gradient-to-br from-emerald-500/15 to-transparent" />
        </Card>
      </div>
      <Card className="p-5">
        <h3 className="mb-4 font-semibold">Top users</h3>
        <div className="divide-y text-sm">
          {["Priya Shah — Acme Media", "James Lee — Vertex Labs", "Sarah Kim — Northwind", "Diego Ruiz — Cielo"].map((u) => (
            <div key={u} className="flex items-center justify-between py-2.5">
              <div>{u}</div>
              <div className="text-xs text-muted-foreground">1,240 actions</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  ),
});
