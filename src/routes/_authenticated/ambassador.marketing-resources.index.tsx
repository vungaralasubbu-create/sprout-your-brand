import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search, Sparkles, Bookmark, BookmarkCheck, Download, Copy, Share2,
  Instagram, MessageCircle, Image as ImageIcon, FileText, Wand2,
  ExternalLink, AlertTriangle, QrCode, Loader2, ArrowRight, CheckCircle2,
  ShieldCheck, Flag,
} from "lucide-react";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getMarketingOverview, listMarketingResources, listProgramsWithResources,
  toggleSaveResource, trackInteraction, submitResourceIssue, getResourceDownloadUrl,
  listRecentlyUsed, getMarketingResource,
} from "@/lib/campus-ambassador/marketing.functions";

export const Route = createFileRoute("/_authenticated/ambassador/marketing-resources/")({
  head: () => ({
    meta: [
      { title: "Marketing Resources — Glintr Campus Ambassador" },
      { name: "description", content: "Approved Glintr program creatives, captions and sharing resources." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarketingResourcesPage,
});

const FILTERS = [
  { key: "all", label: "All Resources" },
  { key: "posters", label: "Posters" },
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "stories", label: "Stories" },
  { key: "captions", label: "Captions" },
  { key: "program_creatives", label: "Program Creatives" },
  { key: "campaign_resources", label: "Campaign Resources" },
  { key: "featured", label: "Featured" },
  { key: "saved", label: "Saved" },
] as const;

const TYPE_ICON: Record<string, any> = {
  program_poster: ImageIcon,
  program_banner: ImageIcon,
  campaign_poster: Sparkles,
  square_social: Instagram,
  portrait_social: Instagram,
  instagram_story: Instagram,
  whatsapp_creative: MessageCircle,
  whatsapp_message: MessageCircle,
  linkedin_creative: FileText,
  caption_instagram: FileText,
  caption_linkedin: FileText,
  short_copy: FileText,
  story_text: FileText,
};

const TYPE_LABEL: Record<string, string> = {
  program_poster: "Program Poster",
  program_banner: "Program Banner",
  campaign_poster: "Campaign Poster",
  square_social: "Square Post",
  portrait_social: "Portrait Post",
  instagram_story: "Instagram Story",
  whatsapp_creative: "WhatsApp Creative",
  whatsapp_message: "WhatsApp Message",
  linkedin_creative: "LinkedIn Creative",
  caption_instagram: "Instagram Caption",
  caption_linkedin: "LinkedIn Caption",
  short_copy: "Quick Share Copy",
  story_text: "Story Text",
};

function programUrl(slug?: string | null, categorySlug?: string | null, referral?: string | null) {
  if (!slug) return "";
  const base = typeof window !== "undefined" ? window.location.origin : "https://glintr.com";
  const cat = categorySlug || "programs";
  return `${base}/programs/${cat}/${slug}${referral ? `?ref=${referral}` : ""}`;
}

function fillPlaceholders(text: string | null | undefined, ctx: { program_name?: string; ambassador_referral_link?: string; campaign_name?: string; campaign_end_date?: string; ambassador_name?: string; referral_code?: string }) {
  if (!text) return "";
  return text
    .replaceAll("{{program_name}}", ctx.program_name || "")
    .replaceAll("{{ambassador_referral_link}}", ctx.ambassador_referral_link || "")
    .replaceAll("{{campaign_name}}", ctx.campaign_name || "")
    .replaceAll("{{campaign_end_date}}", ctx.campaign_end_date || "")
    .replaceAll("{{ambassador_name}}", ctx.ambassador_name || "")
    .replaceAll("{{referral_code}}", ctx.referral_code || "");
}

function MarketingResourcesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [programId, setProgramId] = useState<string | undefined>(undefined);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const overviewFn = useServerFn(getMarketingOverview);
  const listFn = useServerFn(listMarketingResources);
  const programsFn = useServerFn(listProgramsWithResources);
  const recentFn = useServerFn(listRecentlyUsed);

  const overviewQ = useQuery({ queryKey: ["mkt-overview"], queryFn: () => overviewFn() });
  const programsQ = useQuery({ queryKey: ["mkt-programs"], queryFn: () => programsFn() });
  const recentQ = useQuery({ queryKey: ["mkt-recent"], queryFn: () => recentFn() });
  const listQ = useQuery({
    queryKey: ["mkt-list", search, filter, programId],
    queryFn: () => listFn({ data: { search: search || undefined, filter, programId, page: 1, pageSize: 24 } }),
  });

  if (overviewQ.isLoading) return <AmbassadorShell><Skeleton /></AmbassadorShell>;

  const gate = (overviewQ.data as any)?.gate;
  if (gate === "not_approved") {
    return (
      <AmbassadorShell>
        <div className="p-8 max-w-md mx-auto">
          <Card className="p-8 text-center">
            <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <div className="font-medium">Marketing resources are available to approved Campus Ambassadors.</div>
            <Button asChild size="sm" className="mt-3">
              <Link to="/campus-ambassador/status">View Application Status</Link>
            </Button>
          </Card>
        </div>
      </AmbassadorShell>
    );
  }

  const m = (overviewQ.data as any)?.metrics || {};
  const featured = (overviewQ.data as any)?.featured || [];
  const ambassador = (overviewQ.data as any)?.ambassador;
  const programs = ((programsQ.data as any)?.programs || []) as any[];
  const resources = ((listQ.data as any)?.resources || []) as any[];
  const recent = ((recentQ.data as any)?.resources || []) as any[];

  return (
    <AmbassadorShell>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-500">Content Hub</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Marketing Resources</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Access approved Glintr program creatives, captions and sharing resources for your Campus Ambassador promotions.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric label="Available Resources" value={m.available ?? 0} accent="from-cyan-500 to-blue-500" />
          <Metric label="Program Creatives" value={m.programCreatives ?? 0} accent="from-blue-500 to-indigo-500" />
          <Metric label="Active Campaign Resources" value={m.campaignResources ?? 0} accent="from-amber-500 to-orange-500" />
          <Metric label="Recently Added" value={m.recentlyAdded ?? 0} accent="from-emerald-500 to-teal-500" />
        </div>

        {/* Featured carousel */}
        {featured.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> Featured Resources
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {featured.map((r: any) => (
                <FeaturedCard key={r.id} r={r} onOpen={() => setPreviewId(r.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Used */}
        {recent.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2">Recently Used</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {recent.slice(0, 6).map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => setPreviewId(r.id)}
                  className="text-left rounded-lg overflow-hidden border bg-white hover:shadow-md transition"
                >
                  <ThumbBox r={r} className="aspect-square" />
                  <div className="p-2">
                    <div className="text-xs font-medium line-clamp-1">{r.title}</div>
                    <div className="text-[10px] text-slate-500">{TYPE_LABEL[r.resource_type]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources, titles or captions..."
                className="pl-9"
              />
            </div>
            <Select value={programId ?? "all"} onValueChange={(v) => setProgramId(v === "all" ? undefined : v)}>
              <SelectTrigger className="md:w-64">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  filter === f.key
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resources By Program */}
        {programs.length > 0 && !programId && filter === "all" && !search && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Resources By Program</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {programs.map((p) => (
                <Link
                  key={p.id}
                  to="/ambassador/marketing-resources/programs/$slug"
                  params={{ slug: p.slug }}
                  className="group block rounded-xl border bg-white hover:shadow-lg transition p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 shrink-0 overflow-hidden">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">{p.category_name}</div>
                      <div className="font-medium text-sm mt-0.5">{p.name}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                    <MiniCount label="Posters" value={p.counts.posters} />
                    <MiniCount label="Socials" value={p.counts.socials} />
                    <MiniCount label="Captions" value={p.counts.captions} />
                    <MiniCount label="Campaigns" value={p.counts.campaigns} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 group-hover:text-slate-900">
                    <span>{p.counts.total} resources</span>
                    <span className="inline-flex items-center gap-1">View Resources <ArrowRight className="h-3.5 w-3.5" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Resource Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">
              {filter === "saved" ? "Saved Resources" : filter === "featured" ? "Featured Resources" : "All Resources"}
              <span className="text-slate-400 font-normal ml-1">· {resources.length}</span>
            </div>
          </div>

          {listQ.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-white overflow-hidden">
                  <div className="aspect-square bg-slate-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : listQ.isError ? (
            <ErrorBox onRetry={() => listQ.refetch()} />
          ) : resources.length === 0 ? (
            <EmptyBox filtered={!!search || filter !== "all" || !!programId} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {resources.map((r) => (
                <ResourceCard
                  key={r.id}
                  r={r}
                  ambassador={ambassador}
                  onOpen={() => setPreviewId(r.id)}
                  onReport={() => setReportId(r.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Brand Guidelines */}
        <Card className="p-5 bg-gradient-to-br from-slate-50 to-white border">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">Brand Guidelines</div>
              <ul className="text-xs text-slate-600 mt-1.5 space-y-1 list-disc pl-4">
                <li>Use official Glintr logo assets — do not alter the Glintr logo.</li>
                <li>Do not change official program claims or pricing.</li>
                <li>Do not create fake discounts or urgency messaging.</li>
                <li>Do not promise guaranteed jobs, placements, or salaries.</li>
                <li>Do not impersonate Glintr employees. Represent yourself as a Glintr Campus Ambassador.</li>
                <li>Share only approved program creatives and captions available to you here.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Preview modal */}
      {previewId && (
        <ResourcePreviewModal
          id={previewId}
          onClose={() => setPreviewId(null)}
          onReport={() => {
            setReportId(previewId);
            setPreviewId(null);
          }}
        />
      )}

      {/* Report modal */}
      {reportId && <ReportIssueDialog id={reportId} onClose={() => setReportId(null)} />}
    </AmbassadorShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <Card className="p-4">
      <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${accent} mb-2`} />
      <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="font-display text-2xl font-semibold mt-0.5">{value}</div>
    </Card>
  );
}

function MiniCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function ThumbBox({ r, className }: { r: any; className?: string }) {
  const src = r.thumbnail_url || r.media_url;
  const Icon = TYPE_ICON[r.resource_type] || ImageIcon;
  const isText = ["caption_instagram", "caption_linkedin", "short_copy", "whatsapp_message", "story_text"].includes(r.resource_type);
  if (isText) {
    return (
      <div className={`bg-gradient-to-br from-slate-100 to-slate-50 p-3 flex items-center ${className || ""}`}>
        <div className="text-xs text-slate-700 line-clamp-6 whitespace-pre-line">
          {r.caption_content || r.short_copy || r.share_message || r.title}
        </div>
      </div>
    );
  }
  if (src) {
    return (
      <div className={`bg-slate-100 relative ${className || ""}`}>
        <img src={src} alt={r.title} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div className={`bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center ${className || ""}`}>
      <Icon className="h-10 w-10 text-slate-400" />
    </div>
  );
}

function FeaturedCard({ r, onOpen }: { r: any; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group text-left rounded-xl border bg-white overflow-hidden hover:shadow-lg transition">
      <ThumbBox r={r} className="aspect-video" />
      <div className="p-3">
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">Featured</Badge>
        <div className="font-medium text-sm mt-1.5 line-clamp-2">{r.title}</div>
      </div>
    </button>
  );
}

function ResourceCard({ r, ambassador, onOpen, onReport }: any) {
  const qc = useQueryClient();
  const saveFn = useServerFn(toggleSaveResource);
  const trackFn = useServerFn(trackInteraction);

  const referralLink = programUrl(r.program?.slug, r.program?.course_categories?.slug, ambassador?.referral_code);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { resourceId: r.id, save: !r.is_saved } }),
    onSuccess: (res: any) => {
      if (res?.gate === "ok") {
        toast.success(res.saved ? "Resource saved" : "Removed from saved");
        qc.invalidateQueries({ queryKey: ["mkt-list"] });
      }
    },
  });

  const copyLink = async () => {
    if (!referralLink) return toast.error("Program referral link unavailable");
    await navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied");
    trackFn({ data: { resourceId: r.id, programId: r.program?.id, type: "referral_link_copied" } });
  };

  return (
    <Card className="overflow-hidden group hover:shadow-md transition p-0">
      <button onClick={onOpen} className="block w-full">
        <ThumbBox r={r} className={r.resource_type === "instagram_story" ? "aspect-[9/16]" : r.resource_type === "portrait_social" ? "aspect-[4/5]" : "aspect-square"} />
      </button>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">{TYPE_LABEL[r.resource_type]}</div>
            <div className="font-medium text-sm mt-0.5 line-clamp-1">{r.title}</div>
            {r.program?.name && (
              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{r.program.name}</div>
            )}
          </div>
          <button
            onClick={() => save.mutate()}
            className="shrink-0 p-1.5 rounded-md hover:bg-slate-100"
            title={r.is_saved ? "Remove from saved" : "Save resource"}
          >
            {r.is_saved ? <BookmarkCheck className="h-4 w-4 text-amber-600" /> : <Bookmark className="h-4 w-4 text-slate-400" />}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onOpen}>
            Preview
          </Button>
          {referralLink && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={copyLink}>
              <Copy className="h-3 w-3 mr-1" /> Link
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function ResourcePreviewModal({ id, onClose, onReport }: { id: string; onClose: () => void; onReport: () => void }) {
  const qc = useQueryClient();
  const detailFn = useServerFn(getMarketingResource);
  const dQuery = useQuery({
    queryKey: ["mkt-detail", id],
    queryFn: () => detailFn({ data: { id } }),
  });

  const trackFn = useServerFn(trackInteraction);
  const dlFn = useServerFn(getResourceDownloadUrl);
  const saveFn = useServerFn(toggleSaveResource);

  const d = dQuery.data as any;
  const r = d?.resource;
  const program = d?.program;
  const ambassador = d?.ambassador;
  const isText = r && ["caption_instagram", "caption_linkedin", "short_copy", "whatsapp_message", "story_text"].includes(r.resource_type);

  const referralLink = program ? programUrl(program.slug, program.course_categories?.slug, ambassador?.referral_code) : "";
  const ctx = useMemo(
    () => ({
      program_name: program?.name || "",
      ambassador_referral_link: referralLink,
      ambassador_name: ambassador?.full_name?.split(" ")[0] || "",
      referral_code: ambassador?.referral_code || "",
    }),
    [program, referralLink, ambassador]
  );

  const resolvedCaption = fillPlaceholders(r?.caption_content, ctx);
  const resolvedShort = fillPlaceholders(r?.short_copy, ctx);
  const resolvedShare = fillPlaceholders(
    r?.share_message ||
      (program?.name
        ? `Explore Glintr's ${program.name} program designed around industry-focused learning and practical project experience.\n\nView program details here:\n${referralLink}`
        : ""),
    ctx
  );

  const qrUrl = referralLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(referralLink)}`
    : "";

  const copyText = async (text: string, type: "caption_copied" | "share_message_copied" | "referral_link_copied", label: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
    trackFn({ data: { resourceId: r?.id, programId: program?.id, type } });
  };

  const download = async () => {
    if (!r) return;
    const res: any = await dlFn({ data: { resourceId: r.id } });
    if (res?.gate === "ok" && res.url) {
      window.open(res.url, "_blank");
    } else {
      toast.error("Unable to download resource");
    }
  };

  const shareWhatsApp = () => {
    if (!resolvedShare) return;
    trackFn({ data: { resourceId: r?.id, programId: program?.id, type: "share_started", metadata: { channel: "whatsapp" } } });
    window.open(`https://wa.me/?text=${encodeURIComponent(resolvedShare)}`, "_blank");
  };

  const shareNative = async () => {
    if (!resolvedShare) return;
    trackFn({ data: { resourceId: r?.id, programId: program?.id, type: "share_started", metadata: { channel: "native" } } });
    if (navigator.share) {
      try {
        await navigator.share({ text: resolvedShare, url: referralLink });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(resolvedShare);
      toast.success("Share message copied");
    }
  };

  const toggleSave = useMutation({
    mutationFn: () => saveFn({ data: { resourceId: r.id, save: !d?.is_saved } }),
    onSuccess: (res: any) => {
      if (res?.gate === "ok") {
        toast.success(res.saved ? "Saved" : "Removed from saved");
        qc.invalidateQueries({ queryKey: ["mkt-detail", id] });
        qc.invalidateQueries({ queryKey: ["mkt-list"] });
      }
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {dQuery.isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
          </div>
        ) : d?.gate !== "ok" || !r ? (
          <div className="p-6 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <div className="font-medium">Resource Preview Unavailable</div>
            <Button size="sm" className="mt-3" onClick={() => dQuery.refetch()}>Retry</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 font-mono">{r.resource_code}</div>
                  <DialogTitle className="mt-1">{r.title}</DialogTitle>
                  <DialogDescription className="text-xs">
                    {TYPE_LABEL[r.resource_type]}
                    {program?.name ? ` · ${program.name}` : ""}
                    {" · Version "}{r.version}
                  </DialogDescription>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">Published</Badge>
              </div>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Preview */}
              <div>
                {isText ? (
                  <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-4">
                    <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Caption Preview</div>
                    <div className="text-sm whitespace-pre-line">
                      {resolvedCaption || resolvedShort || resolvedShare || r.title}
                    </div>
                    {r.short_copy && r.caption_content && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Short Copy</div>
                        <div className="text-xs whitespace-pre-line">{resolvedShort}</div>
                      </div>
                    )}
                    <div className="mt-3 text-[10px] text-slate-500">
                      {(resolvedCaption || resolvedShort || "").length} characters
                    </div>
                  </div>
                ) : (
                  <div
                    className={`rounded-xl overflow-hidden border bg-slate-100 ${
                      r.resource_type === "instagram_story" ? "aspect-[9/16]" : r.resource_type === "portrait_social" ? "aspect-[4/5]" : "aspect-square"
                    }`}
                  >
                    {r.media_url || r.thumbnail_url ? (
                      <img src={r.media_url || r.thumbnail_url} alt={r.title} className="h-full w-full object-contain" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                )}
                {r.description && <p className="text-xs text-slate-600 mt-3">{r.description}</p>}
              </div>

              {/* Sidebar actions */}
              <div className="space-y-3">
                <div className="rounded-xl border p-3">
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">Share</div>
                  <div className="grid grid-cols-2 gap-2">
                    {!isText && r.media_url && (
                      <Button size="sm" variant="outline" onClick={download}>
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                      </Button>
                    )}
                    {(r.caption_content || resolvedCaption) && (
                      <Button size="sm" variant="outline" onClick={() => copyText(resolvedCaption, "caption_copied", "Caption")}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Caption
                      </Button>
                    )}
                    {resolvedShort && (
                      <Button size="sm" variant="outline" onClick={() => copyText(resolvedShort, "caption_copied", "Text")}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Text
                      </Button>
                    )}
                    {referralLink && (
                      <Button size="sm" variant="outline" onClick={() => copyText(referralLink, "referral_link_copied", "Referral link")}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link
                      </Button>
                    )}
                    {resolvedShare && (
                      <Button size="sm" variant="outline" onClick={() => copyText(resolvedShare, "share_message_copied", "Share message")}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Message
                      </Button>
                    )}
                    {referralLink && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={shareWhatsApp}>
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
                      </Button>
                    )}
                    {referralLink && (
                      <Button size="sm" variant="outline" onClick={shareNative}>
                        <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share
                      </Button>
                    )}
                  </div>
                </div>

                {referralLink && (
                  <div className="rounded-xl border p-3">
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">Program Referral</div>
                    <div className="text-xs font-mono bg-slate-50 border rounded px-2 py-1.5 break-all">{referralLink}</div>
                    <a
                      href={referralLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1.5 inline-flex items-center gap-1"
                    >
                      Open program page <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {qrUrl && (
                  <div className="rounded-xl border p-3">
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                      <QrCode className="h-3.5 w-3.5" /> Program Referral QR
                    </div>
                    <img src={qrUrl} alt="QR" className="h-32 w-32 mx-auto" />
                    <a
                      href={qrUrl}
                      download={`referral-${ambassador?.referral_code || "qr"}.png`}
                      onClick={() => trackFn({ data: { resourceId: r.id, programId: program?.id, type: "qr_downloaded" } })}
                      className="mt-2 block text-center text-xs text-blue-600 hover:underline"
                    >
                      Download QR
                    </a>
                  </div>
                )}

                {r.personalisation_allowed && (
                  <div className="rounded-xl border p-3 bg-gradient-to-br from-amber-50 to-white">
                    <div className="text-[11px] uppercase tracking-widest text-amber-800 mb-2 flex items-center gap-1.5">
                      <Wand2 className="h-3.5 w-3.5" /> Personalisation Enabled
                    </div>
                    <div className="text-xs text-slate-600">
                      This resource can include your name and referral identity. Approved placeholders will resolve to your Ambassador data — pricing, discounts and Glintr claims stay locked to the official template.
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => {
                        toast.success("Personalised version prepared");
                        trackFn({ data: { resourceId: r.id, programId: program?.id, type: "personalised_generated" } });
                      }}
                    >
                      <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Personalise For Me
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4 flex flex-row items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={onReport}>
                  <Flag className="h-3.5 w-3.5 mr-1.5" /> Report Issue
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleSave.mutate()}>
                  {d?.is_saved ? (
                    <>
                      <BookmarkCheck className="h-3.5 w-3.5 mr-1.5" /> Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Save
                    </>
                  )}
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReportIssueDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const [type, setType] = useState<any>("broken_download");
  const [desc, setDesc] = useState("");
  const submitFn = useServerFn(submitResourceIssue);
  const m = useMutation({
    mutationFn: () => submitFn({ data: { resourceId: id, issueType: type, description: desc || undefined } }),
    onSuccess: (res: any) => {
      if (res?.gate === "ok") {
        toast.success(`Issue submitted (${res.issueCode})`);
        onClose();
      } else {
        toast.error(res?.message || "Unable to submit issue");
      }
    },
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Resource Issue</DialogTitle>
          <DialogDescription>
            Flag broken, incorrect or outdated resources so the Glintr team can fix them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-600">Issue Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="broken_download">Broken Download</SelectItem>
                <SelectItem value="incorrect_program_info">Incorrect Program Information</SelectItem>
                <SelectItem value="outdated_price">Outdated Price</SelectItem>
                <SelectItem value="incorrect_referral_link">Incorrect Referral Link</SelectItem>
                <SelectItem value="image_quality">Image Quality Issue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-600">Description (optional)</label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="Describe the issue..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Submit Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyBox({ filtered }: { filtered: boolean }) {
  return (
    <Card className="p-10 text-center">
      <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-2" />
      <div className="font-medium">
        {filtered ? "No Resources Found" : "No Marketing Resources Available"}
      </div>
      <div className="text-xs text-slate-500 mt-1">
        {filtered
          ? "Try changing your program or resource filters."
          : "Approved Glintr Campus Ambassador marketing resources will appear here when published."}
      </div>
    </Card>
  );
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
      <div className="font-medium">Unable To Load Marketing Resources</div>
      <Button size="sm" className="mt-3" onClick={onRetry}>Retry</Button>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-4">
      <div className="h-8 w-64 bg-slate-100 rounded animate-pulse" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
