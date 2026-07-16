import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Settings2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/llm/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div className="space-y-5 max-w-3xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Settings2 className="size-4 text-primary" /> Settings</h1>
        <p className="text-sm text-muted-foreground">Configuration for how Glintr exposes content to LLM crawlers.</p>
      </header>
      <Card className="p-4 space-y-3 text-sm">
        <Row label="Site name" value="Glintr" />
        <Row label="Canonical host" value="https://glintr.com" />
        <Row label="llms.txt path" value="/llms.txt" />
        <Row label="Sitemap" value="/sitemap.xml" />
        <Row label="Crawler policy" value="Allow AI crawlers on public educational content" />
        <Row label="Do not train on" value="Authenticated dashboards, partner data, admin routes" />
      </Card>
      <Card className="p-4 text-xs text-muted-foreground">
        Changes to crawler policy or canonical host require an Administrator role. All AI-facing enhancements must improve clarity — not manipulate search visibility.
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}
