import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ShieldCheck, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agency/domains")({
  component: DomainsPage,
});

const DOMAINS = [
  { domain: "acme.youragency.com", client: "Acme Media", status: "connected", ssl: "active" },
  { domain: "marketing.northwind.io", client: "Northwind Growth", status: "connected", ssl: "active" },
  { domain: "ai.vertexlabs.com", client: "Vertex Labs", status: "verifying", ssl: "pending" },
  { domain: "portal.blueocean.io", client: "Blue Ocean CX", status: "pending", ssl: "pending" },
];

function DomainsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Custom Domains</h2>
          <p className="text-sm text-muted-foreground">Give every client a native experience on their own domain.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="clientagency.com" className="w-72" />
          <Button>Add domain</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {DOMAINS.map((d) => (
          <Card key={d.domain} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="flex items-center gap-2 font-medium">
                {d.domain}
                <a className="text-xs text-primary hover:underline" href={`https://${d.domain}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="inline h-3.5 w-3.5" />
                </a>
              </div>
              <div className="text-xs text-muted-foreground">{d.client}</div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {d.status === "connected" ? (
                <Badge className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</Badge>
              ) : (
                <Badge variant="secondary" className="gap-1"><Clock className="h-3.5 w-3.5" /> {d.status}</Badge>
              )}
              <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3.5 w-3.5" /> SSL {d.ssl}</Badge>
              <Button size="sm" variant="outline">DNS instructions</Button>
              <Button size="sm" variant="ghost">Remove</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="mb-3 font-semibold">DNS setup</h3>
        <p className="text-sm text-muted-foreground">Add these records at your DNS provider. Verification usually completes within minutes.</p>
        <div className="mt-4 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-2">Type</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Value</th></tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="px-4 py-2">A</td><td className="px-4 py-2">@</td><td className="px-4 py-2 font-mono text-xs">185.158.133.1</td></tr>
              <tr><td className="px-4 py-2">CNAME</td><td className="px-4 py-2">www</td><td className="px-4 py-2 font-mono text-xs">yourplatform.app</td></tr>
              <tr><td className="px-4 py-2">TXT</td><td className="px-4 py-2">_verify</td><td className="px-4 py-2 font-mono text-xs">wl_verify=abcd1234</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
