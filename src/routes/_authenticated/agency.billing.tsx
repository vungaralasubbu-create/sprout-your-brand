import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/agency/billing")({
  component: BillingPage,
});

const PLANS = [
  { name: "Starter", price: "$29", credits: "5,000", users: "3", projects: "10" },
  { name: "Growth", price: "$99", credits: "25,000", users: "10", projects: "50" },
  { name: "Professional", price: "$249", credits: "100,000", users: "25", projects: "200" },
  { name: "Enterprise", price: "Custom", credits: "Unlimited", users: "Unlimited", projects: "Unlimited" },
];

function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Agency Billing</h2>
          <p className="text-sm text-muted-foreground">Define plans, choose who pays, and manage invoices.</p>
        </div>
        <Button>+ Create plan</Button>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 font-semibold">Billing mode</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {["Agency pays", "Client pays", "Shared billing"].map((m, i) => (
            <label key={m} className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/40">
              <input type="radio" name="mode" defaultChecked={i === 0} className="mt-1" />
              <div>
                <div className="font-medium">{m}</div>
                <div className="text-xs text-muted-foreground">
                  {i === 0 && "You are invoiced for all client usage — bill clients directly."}
                  {i === 1 && "Each client pays their own subscription on your branded portal."}
                  {i === 2 && "Base fee to agency; usage overage to client."}
                </div>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Invoice frequency:</span>
          {["Monthly", "Quarterly", "Yearly"].map((f, i) => (
            <Badge key={f} variant={i === 0 ? "default" : "outline"} className="cursor-pointer">{f}</Badge>
          ))}
        </div>
      </Card>

      <div>
        <h3 className="mb-3 font-semibold">Client plans</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <Card key={p.name} className="p-5">
              <div className="text-sm font-medium text-muted-foreground">{p.name}</div>
              <div className="mt-2 text-3xl font-semibold">{p.price}<span className="text-sm text-muted-foreground">/mo</span></div>
              <ul className="mt-4 space-y-1.5 text-sm">
                <li><span className="text-muted-foreground">AI credits:</span> {p.credits}</li>
                <li><span className="text-muted-foreground">Users:</span> {p.users}</li>
                <li><span className="text-muted-foreground">Projects:</span> {p.projects}</li>
              </ul>
              <Button variant="outline" className="mt-4 w-full">Edit plan</Button>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 font-semibold">Recent invoices</h3>
        <div className="divide-y text-sm">
          {[
            ["INV-2026-1042", "Acme Media", "Jun 30, 2026", "$4,200", "Paid"],
            ["INV-2026-1041", "Northwind Growth", "Jun 30, 2026", "$2,480", "Paid"],
            ["INV-2026-1040", "Vertex Labs", "Jun 30, 2026", "$1,960", "Pending"],
          ].map(([id, client, date, amt, status]) => (
            <div key={id} className="flex items-center justify-between py-2.5">
              <div className="flex gap-4"><span className="font-mono text-xs text-muted-foreground">{id}</span><span>{client}</span></div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">{date}</span>
                <span className="font-medium">{amt}</span>
                <Badge variant={status === "Paid" ? "default" : "muted"}>{status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
