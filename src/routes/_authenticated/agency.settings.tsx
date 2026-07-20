import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, KeyRound, Users2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agency/settings")({
  component: SettingsPage,
});

const TEAM = [
  { name: "You", email: "owner@youragency.com", role: "Owner" },
  { name: "Alicia Park", email: "alicia@youragency.com", role: "Admin" },
  { name: "Marcus Chen", email: "marcus@youragency.com", role: "Client Manager" },
  { name: "Rita Gómez", email: "rita@youragency.com", role: "Support" },
];

const PERMS = [
  "Projects", "Templates", "Billing", "Knowledge", "Analytics",
  "AI Agents", "Integrations", "Domains", "Users",
];

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Agency Settings</h2>
        <p className="text-sm text-muted-foreground">Team, permissions, AI defaults, and security policies.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Agency profile</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Agency name</Label><Input defaultValue="Your Agency" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Slug</Label><Input defaultValue="your-agency" /></div>
            <div className="col-span-2 space-y-1.5"><Label className="text-xs">Support email</Label><Input defaultValue="support@youragency.com" /></div>
            <div className="col-span-2 space-y-1.5"><Label className="text-xs">Email footer</Label><Textarea rows={2} defaultValue="Your Agency · Delivering AI marketing for growing brands." /></div>
          </div>
          <Button className="mt-4">Save profile</Button>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Default AI profile</h3>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">AI name</Label><Input defaultValue="Nova" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Personality & tone</Label><Input defaultValue="Confident, warm, concise" /></div>
            <div className="space-y-1.5"><Label className="text-xs">System instructions</Label><Textarea rows={4} defaultValue="Always respect client brand voice. Never mention underlying provider names. Route factual questions to Knowledge Hub first." /></div>
            <div className="space-y-1.5"><Label className="text-xs">Restricted topics</Label><Input defaultValue="Politics, competitor pricing, medical advice" /></div>
          </div>
          <Button className="mt-4">Save AI defaults</Button>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Users2 className="h-4 w-4" /> Team</h3>
          <Button size="sm">+ Invite member</Button>
        </div>
        <div className="divide-y text-sm">
          {TEAM.map((t) => (
            <div key={t.email} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.email}</div>
              </div>
              <Badge variant="muted">{t.role}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 font-semibold">Permissions matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr><th className="py-2 text-left">Resource</th><th>Owner</th><th>Admin</th><th>Manager</th><th>Support</th><th>Viewer</th></tr>
            </thead>
            <tbody className="divide-y">
              {PERMS.map((p) => (
                <tr key={p}>
                  <td className="py-2 font-medium">{p}</td>
                  {["FULL", "FULL", "EDIT", "VIEW", "VIEW"].map((v, i) => (
                    <td key={i} className="text-center"><Badge variant="outline" className="text-[10px]">{v}</Badge></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Security</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Workspace isolation enforced via RLS on every table</li>
            <li>• Agency isolation via role-checked policies</li>
            <li>• Encrypted secrets & API tokens</li>
            <li>• Every impersonation is audited</li>
            <li>• SAML/SSO ready (Enterprise plan)</li>
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" /> API tokens</h3>
          <p className="text-sm text-muted-foreground">Generate scoped tokens for automation and internal tools.</p>
          <Button size="sm" variant="outline" className="mt-3">Generate token</Button>
        </Card>
      </div>
    </div>
  );
}
