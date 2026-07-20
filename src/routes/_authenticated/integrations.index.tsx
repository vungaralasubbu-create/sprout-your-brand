import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ShieldCheck, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORIES, PROVIDERS, type IntegrationCategory } from "@/lib/integrations/catalog";
import { listAccounts } from "@/lib/integrations/integrations.functions";
import { ProviderLogo } from "@/components/integrations/integrations-shell";

export const Route = createFileRoute("/_authenticated/integrations/")({
  component: Marketplace,
});

function Marketplace() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<IntegrationCategory | "all">("all");
  const la = useServerFn(listAccounts);
  const query = useQuery({ queryKey: ["intg-accounts"], queryFn: () => la({}) });
  const connected = new Set((query.data?.accounts ?? []).map((a: any) => a.provider));

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PROVIDERS.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (!needle) return true;
      return p.name.toLowerCase().includes(needle) || p.tagline.toLowerCase().includes(needle);
    });
  }, [q, cat]);

  const featured = PROVIDERS.filter((p) => p.featured).slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border bg-gradient-to-br from-primary/10 via-fuchsia-500/5 to-blue-500/10 p-8">
        <div className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
          <Sparkles className="h-3 w-3" /> {PROVIDERS.length}+ apps · one-click connect
        </div>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">Connect once. Your AI Team uses everything.</h2>
        <div className="mt-5 flex max-w-2xl items-center gap-2 rounded-2xl border bg-background p-2 shadow-sm">
          <Search className="ml-2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search integrations..."
            className="flex-1 bg-transparent px-1 py-2 text-sm outline-none" />
        </div>
        <div className="mt-5 flex flex-wrap gap-1.5">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>All</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Chip>
          ))}
        </div>
      </div>

      {cat === "all" && !q && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Featured</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => <Card key={p.id} provider={p} connected={connected.has(p.id)} />)}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {cat === "all" ? "All integrations" : CATEGORIES.find((c) => c.id === cat)?.label}
          <span className="ml-2 text-muted-foreground/70">{filtered.length}</span>
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <Card key={p.id} provider={p} connected={connected.has(p.id)} />)}
        </div>
        {filtered.length === 0 && (
          <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
            No integrations match. Try another search.
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({ active, children, onClick }: any) {
  return (
    <button onClick={onClick}
      className={cn("rounded-full px-3 py-1 text-xs font-medium transition",
        active ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:bg-muted")}>{children}</button>
  );
}

function Card({ provider, connected }: any) {
  return (
    <Link to="/integrations/$provider" params={{ provider: provider.id }}
      className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <ProviderLogo provider={provider.id} name={provider.name} brandColor={provider.brandColor} />
        {connected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
            <CheckCircle2 className="h-3 w-3" /> Connected
          </span>
        ) : provider.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        ) : null}
      </div>
      <div className="mt-4 font-semibold">{provider.name}</div>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{provider.tagline}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{provider.category}</span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
          {connected ? "Manage" : "Connect"} <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
