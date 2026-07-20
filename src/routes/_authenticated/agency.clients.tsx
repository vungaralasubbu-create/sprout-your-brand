import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agency/clients")({
  component: ClientsPage,
});

const CLIENTS = [
  { name: "Acme Media", workspace: "acme-media", plan: "Enterprise", projects: 96, usage: "92%", status: "Active", created: "Jan 12, 2026" },
  { name: "Northwind Growth", workspace: "northwind", plan: "Professional", projects: 74, usage: "78%", status: "Active", created: "Feb 03, 2026" },
  { name: "Vertex Labs", workspace: "vertex", plan: "Professional", projects: 61, usage: "64%", status: "Active", created: "Feb 22, 2026" },
  { name: "Blue Ocean CX", workspace: "blueocean", plan: "Growth", projects: 48, usage: "44%", status: "Trial", created: "Mar 14, 2026" },
  { name: "Cielo University", workspace: "cielo", plan: "Enterprise", projects: 39, usage: "31%", status: "Active", created: "Apr 02, 2026" },
  { name: "Harbor Retail", workspace: "harbor", plan: "Growth", projects: 22, usage: "18%", status: "Suspended", created: "May 09, 2026" },
];

function ClientsPage() {
  const [q, setQ] = useState("");
  const filtered = CLIENTS.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Clients</h2>
          <p className="text-sm text-muted-foreground">Every branded portal you operate.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" className="pl-9 w-64" />
          </div>
          <CreateClientDialog />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Projects</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.workspace} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">/{c.workspace}</td>
                  <td className="px-4 py-3"><Badge variant="muted">{c.plan}</Badge></td>
                  <td className="px-4 py-3">{c.projects}</td>
                  <td className="px-4 py-3">{c.usage}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === "Active" ? "default" : c.status === "Trial" ? "secondary" : "destructive"}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.created}</td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Open</DropdownMenuItem>
                        <DropdownMenuItem>Login as client</DropdownMenuItem>
                        <DropdownMenuItem>Transfer ownership</DropdownMenuItem>
                        <DropdownMenuItem>Suspend</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CreateClientDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> New client</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a new client portal</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          {[
            ["Company name", "Acme Media"],
            ["Workspace name", "acme"],
            ["Industry", "Media & Publishing"],
            ["Website", "https://acme.com"],
            ["Owner name", "Jane Doe"],
            ["Owner email", "jane@acme.com"],
            ["Language", "English"],
            ["Timezone", "America/Los_Angeles"],
          ].map(([label, placeholder]) => (
            <div key={label} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input placeholder={placeholder as string} />
            </div>
          ))}
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Subscription plan</Label>
              <Input placeholder="Professional" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">AI credits</Label>
              <Input placeholder="50,000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Storage (GB)</Label>
              <Input placeholder="50" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Create client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
