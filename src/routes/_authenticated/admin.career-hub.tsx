import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Rocket, Trash2, ExternalLink, Search, Star, Eye, EyeOff } from "lucide-react";
import {
  listCareerPages, generateCareerPage, bulkGenerateCareerPages,
  updateCareerPage, deleteCareerPage,
} from "@/lib/admin/career-hub.functions";
import { CAREER_HUB_TYPES, type CareerHubTypeId, CAREER_TYPE_TO_PATH } from "@/lib/career-hub/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/career-hub")({
  component: CareerHubAdmin,
  errorComponent: ({ error }) => <div className="p-6 text-red-500">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function CareerHubAdmin() {
  const [pageType, setPageType] = useState<CareerHubTypeId>("roadmap");
  const [search, setSearch] = useState("");
  const [published, setPublished] = useState<"all" | "true" | "false">("all");
  const [singleSeed, setSingleSeed] = useState("");
  const [bulkSeeds, setBulkSeeds] = useState("");
  const [overwrite, setOverwrite] = useState(false);

  const qc = useQueryClient();
  const list = useServerFn(listCareerPages);
  const gen = useServerFn(generateCareerPage);
  const bulk = useServerFn(bulkGenerateCareerPages);
  const upd = useServerFn(updateCareerPage);
  const del = useServerFn(deleteCareerPage);

  const pages = useQuery({
    queryKey: ["career-hub", pageType, search, published],
    queryFn: () => list({ data: { page_type: pageType, search: search || undefined, published, limit: 200 } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["career-hub"] });

  const mGen = useMutation({
    mutationFn: () => gen({ data: { page_type: pageType, seed: singleSeed, overwrite } }),
    onSuccess: (r) => { toast.success(`Generated: ${r.title}`); setSingleSeed(""); invalidate(); window.open(r.url, "_blank"); },
    onError: (e: any) => toast.error(e.message),
  });
  const mBulk = useMutation({
    mutationFn: () => {
      const seeds = bulkSeeds.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
      return bulk({ data: { page_type: pageType, seeds, overwrite } });
    },
    onSuccess: (r) => { toast.success(`Bulk: ${r.succeeded} created, ${r.failed} failed`); setBulkSeeds(""); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const mUpd = useMutation({
    mutationFn: (v: { id: string; patch: any }) => upd({ data: v }),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e.message),
  });
  const mDel = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const currentType = CAREER_HUB_TYPES.find((t) => t.id === pageType)!;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Rocket className="w-7 h-7 text-primary" /> AI Career Hub
        </h1>
        <p className="text-muted-foreground mt-1">Generate hundreds of Google-indexable career SEO pages with AI.</p>
      </header>

      {/* Type selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {CAREER_HUB_TYPES.map((t) => (
          <button key={t.id} onClick={() => setPageType(t.id)}
            className={`p-3 rounded-lg border text-left transition ${pageType === t.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
            <div className="text-2xl">{t.emoji}</div>
            <div className="font-semibold text-sm mt-1">{t.label}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Generator */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold"><Sparkles className="w-4 h-4 text-primary" /> Single generate</div>
          <Input placeholder={`e.g. ${currentType.id === "roadmap" ? "Data Engineer" : currentType.id === "salary_guide" ? "AI Engineer India" : "Frontend Developer"}`}
            value={singleSeed} onChange={(e) => setSingleSeed(e.target.value)} />
          <div className="flex items-center gap-2">
            <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> Overwrite existing</label>
          </div>
          <Button disabled={mGen.isPending || singleSeed.trim().length < 2} onClick={() => mGen.mutate()}>
            <Sparkles className="w-4 h-4 mr-2" /> {mGen.isPending ? "Generating…" : `Generate ${currentType.label}`}
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold"><Rocket className="w-4 h-4 text-primary" /> Bulk generate (up to 50)</div>
          <Textarea rows={5} placeholder={"One topic per line or comma separated:\nData Engineer\nMachine Learning Engineer\nCloud Architect"}
            value={bulkSeeds} onChange={(e) => setBulkSeeds(e.target.value)} />
          <Button disabled={mBulk.isPending || bulkSeeds.trim().length < 2} onClick={() => mBulk.mutate()}>
            <Rocket className="w-4 h-4 mr-2" /> {mBulk.isPending ? "Running…" : "Bulk Generate"}
          </Button>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input className="pl-8 w-64" placeholder="Search title, slug, category" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {(["all", "true", "false"] as const).map((v) => (
          <Button key={v} size="sm" variant={published === v ? "primary" : "outline"} onClick={() => setPublished(v)}>
            {v === "all" ? "All" : v === "true" ? "Published" : "Drafts"}
          </Button>
        ))}
        <div className="ml-auto text-sm text-muted-foreground">{pages.data?.total ?? 0} pages</div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {pages.isLoading && <div className="text-muted-foreground">Loading…</div>}
        {pages.data?.rows.length === 0 && <Card className="p-8 text-center text-muted-foreground">No pages yet. Generate one above.</Card>}
        {pages.data?.rows.map((p: any) => {
          const url = `/career-hub/${CAREER_TYPE_TO_PATH[p.page_type as CareerHubTypeId]}/${p.slug}`;
          return (
            <Card key={p.id} className="p-4 flex items-center gap-3 flex-wrap">
              <div className="text-2xl">{p.hero_emoji || "🎯"}</div>
              <div className="flex-1 min-w-[240px]">
                <div className="font-semibold flex items-center gap-2 flex-wrap">
                  {p.title}
                  {p.featured && <Badge variant="featured">Featured</Badge>}
                  {!p.published && <Badge variant="warning">Draft</Badge>}
                  {p.category && <Badge variant="info">{p.category}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{url} · {p.view_count || 0} views</div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" title="Open" onClick={() => window.open(url, "_blank")}><ExternalLink className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" title="Toggle publish" onClick={() => mUpd.mutate({ id: p.id, patch: { published: !p.published } })}>
                  {p.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="ghost" title="Feature" onClick={() => mUpd.mutate({ id: p.id, patch: { featured: !p.featured } })}>
                  <Star className={`w-4 h-4 ${p.featured ? "fill-yellow-400 text-yellow-400" : ""}`} />
                </Button>
                <Button size="sm" variant="ghost" title="Delete" onClick={() => { if (confirm(`Delete ${p.title}?`)) mDel.mutate(p.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
