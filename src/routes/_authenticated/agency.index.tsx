import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users2,
  FolderKanban,
  DollarSign,
  Sparkles,
  HardDrive,
  UserPlus,
  Rocket,
  Activity,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/agency/")({
  component: AgencyOverview,
});

const KPI = [
  { label: "Total Clients", value: "128", delta: "+12 this month", icon: Users2 },
  { label: "Active Projects", value: "1,842", delta: "+264 this week", icon: FolderKanban },
  { label: "Monthly Revenue", value: "$84,320", delta: "+18.4% MoM", icon: DollarSign },
  { label: "AI Credits Used", value: "4.2M", delta: "62% of pool", icon: Sparkles },
  { label: "Storage", value: "1.2 TB", delta: "of 5 TB", icon: HardDrive },
  { label: "Team Members", value: "34", delta: "+3 this week", icon: UserPlus },
  { label: "New Signups", value: "24", delta: "last 7 days", icon: Rocket },
  { label: "Campaigns Generated", value: "9,412", delta: "all time", icon: Activity },
];

const TOP_CLIENTS = [
  { name: "Acme Media", plan: "Enterprise", revenue: "$12,400", projects: 96 },
  { name: "Northwind Growth", plan: "Professional", revenue: "$8,120", projects: 74 },
  { name: "Vertex Labs", plan: "Professional", revenue: "$6,880", projects: 61 },
  { name: "Blue Ocean CX", plan: "Growth", revenue: "$4,320", projects: 48 },
  { name: "Cielo University", plan: "Enterprise", revenue: "$3,940", projects: 39 },
];

const ACTIVITY = [
  { who: "Acme Media", what: "Published Q4 campaign", when: "12m ago" },
  { who: "Northwind Growth", what: "Connected HubSpot", when: "1h ago" },
  { who: "Vertex Labs", what: "New team member invited", when: "3h ago" },
  { who: "Blue Ocean CX", what: "Upgraded to Growth plan", when: "Yesterday" },
];

function AgencyOverview() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">Bird's-eye view of every client under your agency.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/agency/branding">Customize brand</Link></Button>
          <Button asChild><Link to="/agency/clients">+ New client</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {KPI.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
                  <div className="mt-2 text-2xl font-semibold">{k.value}</div>
                  <div className="mt-1 text-xs text-emerald-600">{k.delta}</div>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Top clients</h3>
            <Button size="sm" variant="ghost" asChild><Link to="/agency/clients">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </div>
          <div className="divide-y">
            {TOP_CLIENTS.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-xs font-semibold text-primary-foreground">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.projects} projects</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{c.plan}</Badge>
                  <div className="w-20 text-right font-medium">{c.revenue}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Recent activity</h3>
          <div className="space-y-4 text-sm">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <div><span className="font-medium">{a.who}</span> <span className="text-muted-foreground">{a.what}</span></div>
                  <div className="text-xs text-muted-foreground">{a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
