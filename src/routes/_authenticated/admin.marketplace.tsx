import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, LineChart, Package, Sparkles, Workflow, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AgentStore,
  AppStore,
  DeveloperCenter,
  MarketplaceAnalytics,
  WorkflowsHub,
} from "@/components/marketplace/hub";

export const Route = createFileRoute("/_authenticated/admin/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace · Glintr Admin" },
      {
        name: "description",
        content: "Install apps and activate AI agents to extend your Glintr academy — official and partner-built.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarketplacePage,
});

type Tab = "apps" | "agents" | "workflows" | "analytics" | "developer";

const TABS: Array<{ id: Tab; label: string; icon: typeof Package; hint?: string }> = [
  { id: "apps", label: "App Store", icon: Package, hint: "Install extensions" },
  { id: "agents", label: "AI Agents", icon: Bot, hint: "Activate specialists" },
  { id: "workflows", label: "Workflows", icon: Workflow, hint: "Chain agents" },
  { id: "analytics", label: "Analytics", icon: LineChart, hint: "Usage & audit" },
  { id: "developer", label: "Developer", icon: Wrench, hint: "Publish an app" },
];

function MarketplacePage() {
  const [tab, setTab] = useState<Tab>("apps");
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Glintr Marketplace
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Extend Glintr — apps, AI agents & workflows
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Grow your academy through installable capabilities. Official Glintr apps, verified partner apps and
            specialized AI agents live here. Admins approve permissions before installation and can enforce mandatory
            apps across all brands.
          </p>
        </div>
      </header>

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

      {tab === "apps" && <AppStore />}
      {tab === "agents" && <AgentStore />}
      {tab === "workflows" && <WorkflowsHub />}
      {tab === "analytics" && <MarketplaceAnalytics />}
      {tab === "developer" && <DeveloperCenter />}
    </div>
  );
}
