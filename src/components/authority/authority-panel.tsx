import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, RefreshCw, ExternalLink, CheckCircle2, AlertCircle, XCircle, Link2, BookOpen } from "lucide-react";
import {
  analyzeContentAuthority,
  listCitations,
  createCitation,
  attachCitationToClaim,
  setClaimStatus,
  transitionReviewStatus,
  listReviewHistory,
} from "@/lib/admin/content-authority.functions";

type ContentType = "blog" | "course" | "landing" | "program" | "resource" | "career" | "kb";

function scoreColor(n: number) {
  if (n >= 85) return "text-emerald-600";
  if (n >= 65) return "text-amber-600";
  return "text-red-600";
}
function scoreBg(n: number) {
  if (n >= 85) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (n >= 65) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 p-2.5 bg-card/50">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold ${scoreColor(value)}`}>{value}</div>
    </div>
  );
}

const WORKFLOW = ["draft", "ai_generated", "under_review", "fact_checked", "seo_approved", "legal_approved", "published", "archived"] as const;

export function AuthorityPanel({ contentType, contentId, triggerLabel = "Authority" }: {
  contentType: ContentType;
  contentId: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldCheck className="size-4 mr-1.5" /> {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        {open ? <AuthorityBody contentType={contentType} contentId={contentId} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function AuthorityBody({ contentType, contentId }: { contentType: ContentType; contentId: string }) {
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeContentAuthority);
  const listCits = useServerFn(listCitations);
  const createCit = useServerFn(createCitation);
  const attachCit = useServerFn(attachCitationToClaim);
  const setStatus = useServerFn(setClaimStatus);
  const transition = useServerFn(transitionReviewStatus);
  const history = useServerFn(listReviewHistory);

  const key = ["authority", contentType, contentId];
  const analysisQ = useQuery({
    queryKey: key,
    queryFn: () => analyze({ data: { content_type: contentType, content_id: contentId, persist: true } }),
    refetchOnWindowFocus: false,
  });
  const citationsQ = useQuery({
    queryKey: ["citations"],
    queryFn: () => listCits({ data: {} }),
    staleTime: 30_000,
  });
  const historyQ = useQuery({
    queryKey: [...key, "history"],
    queryFn: () => history({ data: { content_type: contentType, content_id: contentId } }),
  });

  const reanalyzeMut = useMutation({
    mutationFn: () => analyze({ data: { content_type: contentType, content_id: contentId, persist: true } }),
    onSuccess: (d) => { qc.setQueryData(key, d); toast.success("Re-analyzed"); },
    onError: (e: any) => toast.error(e?.message ?? "Analyze failed"),
  });

  const transitionMut = useMutation({
    mutationFn: (to: string) => transition({ data: { content_type: contentType, content_id: contentId, to_status: to as any } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: [...key, "history"] });
      toast.success("Workflow updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Transition failed"),
  });

  const attachMut = useMutation({
    mutationFn: (v: { claim_id: string; citation_id: string }) => attachCit({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success("Citation attached"); },
    onError: (e: any) => toast.error(e?.message ?? "Attach failed"),
  });
  const statusMut = useMutation({
    mutationFn: (v: { claim_id: string; status: string }) => setStatus({ data: v as any }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const [newCite, setNewCite] = useState({ source_url: "", source_type: "research", title: "", publisher: "", published_at: "", notes: "" });
  const createCitMut = useMutation({
    mutationFn: () => createCit({ data: { ...newCite, published_at: newCite.published_at || undefined, title: newCite.title || undefined, publisher: newCite.publisher || undefined, notes: newCite.notes || undefined } as any }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citations"] });
      setNewCite({ source_url: "", source_type: "research", title: "", publisher: "", published_at: "", notes: "" });
      toast.success("Citation saved");
    },
    onError: (e: any) => toast.error(e?.message ?? "Citation failed"),
  });

  if (analysisQ.isLoading || !analysisQ.data) {
    return <div className="p-6 text-sm text-muted-foreground">Analyzing…</div>;
  }

  const d = analysisQ.data;
  const s = d.scores;
  const qc2 = s.signals.quality_checks;
  const workflow = (d as any).workflow_status ?? historyQ.data?.[0]?.to_status ?? "draft";

  return (
    <div className="p-5 space-y-5">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" /> Content Authority
        </SheetTitle>
        <div className="text-xs text-muted-foreground truncate">{d.content.title}</div>
      </SheetHeader>

      {/* Score header */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Overall Authority</div>
            <div className={`text-4xl font-bold ${scoreColor(s.overall_score)}`}>{s.overall_score}<span className="text-lg text-muted-foreground">/100</span></div>
          </div>
          <Button variant="outline" size="sm" onClick={() => reanalyzeMut.mutate()} disabled={reanalyzeMut.isPending}>
            <RefreshCw className={`size-4 mr-1.5 ${reanalyzeMut.isPending ? "animate-spin" : ""}`} />
            Re-analyze
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ScoreTile label="Experience" value={s.experience_score} />
          <ScoreTile label="Expertise" value={s.expertise_score} />
          <ScoreTile label="Authority" value={s.authoritativeness_score} />
          <ScoreTile label="Trust" value={s.trust_score} />
          <ScoreTile label="Freshness" value={s.freshness_score} />
          <ScoreTile label="Originality" value={s.originality_score} />
        </div>
      </div>

      {/* Workflow */}
      <div className="rounded-xl border border-border/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Review Workflow</div>
            <Badge variant="outline" className="mt-1 capitalize">{workflow.replace(/_/g, " ")}</Badge>
          </div>
          <Select onValueChange={(v) => transitionMut.mutate(v)}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Move to…" /></SelectTrigger>
            <SelectContent>
              {WORKFLOW.map((w) => <SelectItem key={w} value={w} className="capitalize">{w.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {historyQ.data && historyQ.data.length > 0 ? (
          <div className="text-[11px] text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
            {historyQ.data.slice(0, 5).map((h: any) => (
              <div key={h.id} className="flex justify-between">
                <span>{h.from_status ?? "—"} → <b>{h.to_status}</b> · {h.reviewer_name ?? "admin"}</span>
                <span>{new Date(h.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="claims">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="citations">Sources</TabsTrigger>
          <TabsTrigger value="freshness">Freshness</TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-3 mt-3">
          {d.claims.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg border-dashed">
              No claims detected. Add statistics or references to trigger detection.
            </div>
          ) : d.claims.map((c: any) => (
            <div key={c.id} className="border border-border/60 rounded-lg p-3 space-y-2 bg-card/40">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className="capitalize text-[10px]">{c.claim_type.replace(/_/g, " ")}</Badge>
                <StatusPill status={c.status} />
              </div>
              <div className="text-xs text-foreground/90 leading-relaxed line-clamp-3">{c.claim_text}</div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Select onValueChange={(citId) => attachMut.mutate({ claim_id: c.id, citation_id: citId })}>
                  <SelectTrigger className="h-7 text-xs w-44"><SelectValue placeholder="Attach citation" /></SelectTrigger>
                  <SelectContent>
                    {(citationsQ.data ?? []).map((ct: any) => (
                      <SelectItem key={ct.id} value={ct.id} className="text-xs">
                        {ct.title || ct.source_url.slice(0, 40)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {c.status !== "verified" ? (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => statusMut.mutate({ claim_id: c.id, status: "verified" })}>Mark verified</Button>
                ) : null}
                {c.status !== "unverified" ? (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => statusMut.mutate({ claim_id: c.id, status: "unverified" })}>Unverified</Button>
                ) : null}
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => statusMut.mutate({ claim_id: c.id, status: "dismissed" })}>Dismiss</Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="quality" className="space-y-2 mt-3">
          <QualityRow label="Word count" value={s.signals.word_count} good={s.signals.word_count >= 600} />
          <QualityRow label="Readability grade" value={s.signals.readability_grade} good={s.signals.readability_grade >= 8 && s.signals.readability_grade <= 14} />
          <QualityRow label="Passive voice" value={`${Math.round(s.signals.passive_voice_ratio * 100)}%`} good={!qc2.passive_voice_high} />
          <QualityRow label="Repetition" value={s.signals.repetition_score} good={s.signals.repetition_score < 20} />
          <QualityRow label="Duplicate paragraphs" value={s.signals.duplicate_paragraphs} good={s.signals.duplicate_paragraphs === 0} />
          <CheckRow label="Strong introduction" ok={!qc2.weak_intro} />
          <CheckRow label="Strong conclusion" ok={!qc2.weak_conclusion} />
          <CheckRow label="Has examples" ok={!qc2.missing_examples} />
          <CheckRow label="Has visuals" ok={!qc2.missing_visuals} />
          <CheckRow label="Has FAQs" ok={!qc2.missing_faqs} />
          <CheckRow label="Has CTA" ok={!qc2.missing_cta} />
        </TabsContent>

        <TabsContent value="citations" className="space-y-3 mt-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Citation library</div>
          <div className="max-h-56 overflow-y-auto space-y-1.5">
            {(citationsQ.data ?? []).map((ct: any) => (
              <a key={ct.id} href={ct.source_url} target="_blank" rel="noreferrer" className="block border border-border/60 rounded p-2 text-xs hover:bg-muted/50">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] capitalize">{ct.source_type}</Badge>
                  <span className="truncate font-medium">{ct.title || ct.source_url}</span>
                </div>
                {ct.publisher ? <div className="text-muted-foreground mt-0.5">{ct.publisher}</div> : null}
              </a>
            ))}
            {(citationsQ.data ?? []).length === 0 ? <div className="text-xs text-muted-foreground p-3 text-center border rounded border-dashed">No citations yet. Add one below.</div> : null}
          </div>
          <div className="border-t pt-3 space-y-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Add citation</div>
            <Input placeholder="https://..." value={newCite.source_url} onChange={(e) => setNewCite({ ...newCite, source_url: e.target.value })} className="h-8 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={newCite.source_type} onValueChange={(v) => setNewCite({ ...newCite, source_type: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["gov", "research", "university", "docs", "vendor", "industry", "news", "other"].map((t) => (
                    <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={newCite.published_at} onChange={(e) => setNewCite({ ...newCite, published_at: e.target.value })} className="h-8 text-xs" />
            </div>
            <Input placeholder="Title" value={newCite.title} onChange={(e) => setNewCite({ ...newCite, title: e.target.value })} className="h-8 text-xs" />
            <Input placeholder="Publisher" value={newCite.publisher} onChange={(e) => setNewCite({ ...newCite, publisher: e.target.value })} className="h-8 text-xs" />
            <Textarea placeholder="Notes" value={newCite.notes} onChange={(e) => setNewCite({ ...newCite, notes: e.target.value })} rows={2} className="text-xs" />
            <Button size="sm" className="w-full" disabled={!newCite.source_url || createCitMut.isPending} onClick={() => createCitMut.mutate()}>
              <BookOpen className="size-4 mr-1.5" /> Save citation
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="freshness" className="space-y-3 mt-3">
          <div className="rounded-lg border border-border/60 p-3">
            <div className="text-xs text-muted-foreground">Last updated</div>
            <div className="text-sm">{d.content.updated_at ? new Date(d.content.updated_at).toLocaleDateString() : "—"} · {s.signals.days_since_update}d ago</div>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <div className="text-xs text-muted-foreground">Outdated year mentions</div>
            <div className="text-sm">{s.signals.outdated_year_mentions} references &gt;3 years old</div>
          </div>
          {s.freshness_score < 60 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>Freshness is low. Refresh statistics, add recent sources, and update outdated year references.</span>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <div className="text-[10px] text-muted-foreground italic border-t pt-3">
        Copilot never rewrites content. All actions above require explicit confirmation.
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { icon: any; cls: string; label: string }> = {
    verified: { icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Verified" },
    needs_citation: { icon: AlertCircle, cls: "bg-amber-100 text-amber-700 border-amber-200", label: "Needs citation" },
    unverified: { icon: XCircle, cls: "bg-red-100 text-red-700 border-red-200", label: "Unverified" },
    dismissed: { icon: XCircle, cls: "bg-muted text-muted-foreground border-border", label: "Dismissed" },
  };
  const m = map[status] ?? map.needs_citation;
  const Icon = m.icon;
  return <Badge variant="outline" className={`text-[10px] ${m.cls}`}><Icon className="size-3 mr-1" />{m.label}</Badge>;
}

function QualityRow({ label, value, good }: { label: string; value: any; good: boolean }) {
  return (
    <div className={`flex items-center justify-between p-2 rounded border ${good ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40"}`}>
      <span className="text-xs">{label}</span>
      <span className={`text-xs font-medium ${good ? "text-emerald-700" : "text-amber-700"}`}>{value}</span>
    </div>
  );
}
function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded border ${ok ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40"}`}>
      {ok ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <AlertCircle className="size-3.5 text-amber-600" />}
      <span className="text-xs">{label}</span>
    </div>
  );
}
