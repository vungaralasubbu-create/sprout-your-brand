import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Boxes, Database, HeartPulse, Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ApiCenter,
  AppMarketplace,
  HealthMonitor,
  IntegrationHub,
} from "@/components/integrations/hub";

export const Route = createFileRoute("/_authenticated/admin/integrations")({
  head: () => ({
    meta: [
      { title: "Integration Hub · Glintr Admin" },
      { name: "description", content: "Connect payments, communication, storage, CRM, AI providers and more." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IntegrationsPage,
});

type Tab = "hub" | "marketplace" | "api" | "health";

const TABS: Array<{ id: Tab; label: string; icon: typeof Plug }> = [
  { id: "hub", label: "Integrations", icon: Plug },
  { id: "marketplace", label: "Marketplace", icon: Boxes },
  { id: "api", label: "API Center", icon: Database },
  { id: "health", label: "Health", icon: HeartPulse },
];

function IntegrationsPage() {
  const [tab, setTab] = useState<Tab>("hub");
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "hub" && <IntegrationHub />}
      {tab === "marketplace" && <AppMarketplace />}
      {tab === "api" && <ApiCenter />}
      {tab === "health" && <HealthMonitor />}
    </div>
  );
}
