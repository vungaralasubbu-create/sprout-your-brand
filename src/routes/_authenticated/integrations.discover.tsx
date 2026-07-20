import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PROVIDERS, CATEGORIES } from "@/lib/integrations/catalog";
import { ProviderLogo } from "@/components/integrations/integrations-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/integrations/discover")({
  component: Discover,
});

function Discover() {
  const [q, setQ] = useState("");
  const grouped = CATEGORIES.map((c) => ({
    ...c,
    items: PROVIDERS.filter((p) => p.category === c.id &&
      (q ? (p.name + " " + p.tagline).toLowerCase().includes(q.toLowerCase()) : true)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-2xl border bg-background px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search across all categories..."
          className="flex-1 bg-transparent text-sm outline-none" />
      </div>

      {grouped.map((g) => (
        <section key={g.id}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((p) => (
              <Link key={p.id} to="/integrations/$provider" params={{ provider: p.id }}
                className={cn("group flex items-center gap-3 rounded-xl border bg-card p-3 transition hover:bg-muted/40")}>
                <ProviderLogo provider={p.id} name={p.name} brandColor={p.brandColor} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.tagline}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
