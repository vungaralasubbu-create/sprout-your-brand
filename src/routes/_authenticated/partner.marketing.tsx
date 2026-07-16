import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Copy, Check, Download, ExternalLink, Sparkles } from "lucide-react";
import { ASSET_CATEGORIES, MARKETING_ASSETS, type AssetCategory, type MarketingAsset } from "@/data/partner-marketing-assets";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/partner/marketing")({
  head: () => ({ meta: [{ title: "Marketing Assets — Glintr Partner" }, { name: "robots", content: "noindex" }] }),
  component: MarketingAssetsPage,
});

function MarketingAssetsPage() {
  const [active, setActive] = useState<AssetCategory | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return MARKETING_ASSETS.filter((a) => {
      if (active !== "all" && a.category !== active) return false;
      if (!query) return true;
      return (
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query))
      );
    });
  }, [active, q]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
      <header className="space-y-3">
        <div className="text-caption font-mono uppercase tracking-widest text-primary">Toolkit</div>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">Marketing Assets</h1>
        <p className="text-muted-foreground max-w-2xl">
          Copy-ready templates and brand-approved downloads for every stage of your partner conversations. Reuse as-is or adapt to your voice.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search assets, templates, tags…"
            className="w-full h-11 pl-10 pr-3 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="text-xs text-muted-foreground">{filtered.length} of {MARKETING_ASSETS.length}</div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <CategoryPill label="All" active={active === "all"} onClick={() => setActive("all")} />
        {ASSET_CATEGORIES.map((c) => (
          <CategoryPill
            key={c.key}
            label={c.label}
            active={active === c.key}
            onClick={() => setActive(c.key)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <AssetCard key={a.id} asset={a} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            No assets match that search. Try a different keyword or category.
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 h-9 px-3.5 rounded-full text-sm border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-white text-foreground/80 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

function AssetCard({ asset }: { asset: MarketingAsset }) {
  const [copied, setCopied] = useState(false);
  const cat = ASSET_CATEGORIES.find((c) => c.key === asset.category);

  async function handleCopy() {
    if (!asset.body) return;
    try {
      await navigator.clipboard.writeText(asset.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="group rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.15)] transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {cat?.label}
        </div>
        <KindBadge kind={asset.kind} />
      </div>
      <h3 className="font-medium leading-snug mb-1">{asset.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{asset.description}</p>

      {asset.body && (
        <pre className="mb-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs whitespace-pre-wrap font-sans text-foreground/85 max-h-40 overflow-hidden">
          {asset.body}
        </pre>
      )}

      <div className="flex items-center gap-2">
        {asset.kind === "template" && asset.body && (
          <Button size="sm" variant={copied ? "outline" : "default"} onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy template"}
          </Button>
        )}
        {asset.kind === "download" && (
          <Button size="sm" variant="outline" disabled>
            <Download className="size-4" /> Coming soon
          </Button>
        )}
        {asset.kind === "external" && (
          <Button size="sm" variant="outline" disabled>
            <ExternalLink className="size-4" /> Coming soon
          </Button>
        )}
        {asset.tags.slice(0, 2).map((t) => (
          <span key={t} className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-slate-50 border">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: MarketingAsset["kind"] }) {
  const label = kind === "template" ? "Copy-ready" : kind === "download" ? "Download" : "Watch";
  const Icon = kind === "template" ? Sparkles : kind === "download" ? Download : ExternalLink;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-primary bg-primary/[0.08] px-2 py-1 rounded-full">
      <Icon className="size-3" /> {label}
    </span>
  );
}
