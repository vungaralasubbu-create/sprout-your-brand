import { createFileRoute } from "@tanstack/react-router";
import { DeveloperShell } from "@/components/developers/developer-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Boxes, Star, Download, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/developers/apps")({ component: AppsPage });

const APPS = [
  { name: "Slack Notifier", cat: "Communication", type: "Public", downloads: 4200, rating: 4.8, verified: true },
  { name: "HubSpot Sync", cat: "CRM", type: "Public", downloads: 3100, rating: 4.7, verified: true },
  { name: "Google Analytics Bridge", cat: "Analytics", type: "Public", downloads: 2800, rating: 4.6, verified: true },
  { name: "Internal Approvals Bot", cat: "Workflow", type: "Internal", downloads: 45, rating: 4.9, verified: false },
  { name: "Zapier Automation", cat: "Integrations", type: "Marketplace Ready", downloads: 5600, rating: 4.9, verified: true },
  { name: "Notion Publisher", cat: "Content", type: "Private", downloads: 12, rating: 5.0, verified: false },
];

function AppsPage() {
  return (
    <DeveloperShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Developer Apps</h2>
          <p className="text-sm text-muted-foreground">Public, private, internal, and marketplace-ready applications.</p>
        </div>
        <Button><Boxes className="mr-2 h-4 w-4" />Create App</Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((a) => (
          <Card key={a.name} className="p-5">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary"><Boxes className="h-5 w-5" /></div>
              {a.verified && <Badge className="gap-1"><ShieldCheck className="h-3 w-3" />Verified</Badge>}
            </div>
            <div className="mt-3 font-semibold">{a.name}</div>
            <div className="text-xs text-muted-foreground">{a.cat} · {a.type}</div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" />{a.downloads.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{a.rating}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">Manage</Button>
              <Button size="sm" variant="ghost">View</Button>
            </div>
          </Card>
        ))}
      </div>
    </DeveloperShell>
  );
}
