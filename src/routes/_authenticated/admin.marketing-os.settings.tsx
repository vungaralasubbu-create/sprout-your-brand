import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Palette, Radar, Sparkles, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Marketing OS" },
      { name: "description", content: "Marketing OS configuration and preferences." },
    ],
  }),
  component: SettingsHub,
});

// Additive restore: the sidebar Settings link 404'd because no route file
// existed. This hub links to the existing configuration surfaces — no new
// functionality added.
const LINKS = [
  { to: "/admin/marketing-os/brand-kit", label: "Brand Kit", description: "Logos, colors, fonts, and voice used across every generation.", icon: Palette },
  { to: "/admin/marketing-os/intelligence", label: "Market Intelligence", description: "Competitor tracking and market signals.", icon: Radar },
  { to: "/admin/marketing-os/generation-engine", label: "Generation Engine", description: "Model routing, quality controls, and provider health.", icon: Sparkles },
  { to: "/admin/marketing-os/publisher", label: "Publisher", description: "Connected social accounts and publishing rules.", icon: Send },
];

function SettingsHub() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure how Marketing OS generates, approves, and publishes content.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.to} to={l.to as unknown as "/admin/marketing-os"} className="group">
              <Card className="p-4 h-full transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{l.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{l.description}</div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
