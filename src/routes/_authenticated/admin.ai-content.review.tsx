import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, XCircle, MessageSquare, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getAiReviewQueue, submitAiReviewAction, scoreContent } from "@/lib/admin/ai-content.functions";
import { CONTENT_TYPE_LABEL } from "@/lib/admin/content-meta";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/ai-content/review")({
  component: ReviewPage,
});

function ReviewPage() {
  const list = useServerFn(getAiReviewQueue);
  const act = useServerFn(submitAiReviewAction);
  const score = useServerFn(scoreContent);
  const { data, refetch } = useQuery({ queryKey: ["ai-review-queue"], queryFn: () => list() });

  const [q, setQ] = useState("");
  const [scoreOf, setScoreOf] = useState<any | null>(null);
  const [scoreData, setScoreData] = useState<any | null>(null);
  const [action, setAction] = useState<{ id: string; kind: "approve" | "reject" | "request_changes" } | null>(null);
  const [note, setNote] = useState("");

  const scoreMut = useMutation({
    mutationFn: (id: string) => score({ data: { id } }),
    onSuccess: (r) => setScoreData(r),
    onError: (e: any) => toast.error(e.message),
  });

  const actionMut = useMutation({
    mutationFn: () => act({ data: { id: action!.id, action: action!.kind, note: note || undefined } }),
    onSuccess: () => { toast.success("Recorded"); setAction(null); setNote(""); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = ((data ?? []) as any[]).filter((r) =>
    !q.trim() || r.title.toLowerCase().includes(q.toLowerCase()) || r.slug?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-6xl">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">Editor Review</h1>
          <p className="text-sm text-muted-foreground">Approve, request changes or reject AI-assisted drafts before they publish.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search drafts…" className="pl-9 h-9" />
        </div>
      </header>

      <Card className="divide-y divide-border/60">
        {rows.map((r) => (
          <div key={r.id} className="p-4 flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link to={"/admin/content/articles/$id" as any} params={{ id: r.id } as any} className="text-sm font-medium hover:underline">{r.title}</Link>
                <Badge variant="outline" className="text-[10px]">{CONTENT_TYPE_LABEL[r.type]}</Badge>
                <span className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded ${r.status === "in_review" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{r.status}</span>
                {r.metadata?.generated_by === "ai_writer" && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">AI</Badge>}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {r.word_count ?? 0} words · updated {formatDistanceToNow(new Date(r.updated_at))} ago
              </div>
              {r.seo_description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.seo_description}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => { setScoreOf(r); setScoreData(null); scoreMut.mutate(r.id); }}>
                <Sparkles className="size-3.5 mr-1" /> Score
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setAction({ id: r.id, kind: "request_changes" }); setNote(""); }}>
                <MessageSquare className="size-3.5 mr-1" /> Request changes
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setAction({ id: r.id, kind: "reject" }); setNote(""); }}>
                <XCircle className="size-3.5 mr-1 text-red-600" /> Reject
              </Button>
              <Button size="sm" onClick={() => { setAction({ id: r.id, kind: "approve" }); setNote(""); }}>
                <CheckCircle2 className="size-3.5 mr-1" /> Approve
              </Button>
            </div>
          </div>
        ))}
        {!rows.length && <div className="p-8 text-center text-sm text-muted-foreground">Nothing in the queue. Send drafts to review from the editor.</div>}
      </Card>

      <Dialog open={!!scoreOf} onOpenChange={(v) => !v && setScoreOf(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Content Score · {scoreOf?.title}</DialogTitle></DialogHeader>
          {scoreMut.isPending || !scoreData ? (
            <div className="py-6 text-sm text-muted-foreground text-center">Scoring…</div>
          ) : (
            <div className="space-y-3">
              <div className="text-4xl font-display font-semibold">{scoreData.scores.overall}<span className="text-base text-muted-foreground">/100</span></div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(scoreData.scores).filter(([k]) => k !== "overall").map(([k, v]: any) => (
                  <div key={k} className="rounded-md border border-border/60 p-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
                    <div className="font-mono font-semibold">{v}/100</div>
                    <div className="h-1.5 bg-surface-2 rounded overflow-hidden mt-1">
                      <div className={`h-full ${v >= 70 ? "bg-emerald-500" : v >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {scoreData.similar && (
                <div className="rounded-md border border-amber-500/40 bg-amber-50/40 p-3 text-xs text-amber-800">
                  <strong>Similarity warning:</strong> {scoreData.similar.overlap}% overlap with <em>{scoreData.similar.title}</em>. Consider merging or differentiating.
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {scoreData.counts.wc} words · {scoreData.counts.headings} headings · {scoreData.counts.internalLinks} internal / {scoreData.counts.externalLinks} external links · {scoreData.counts.images} images
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!action} onOpenChange={(v) => !v && setAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action?.kind.replace("_", " ")}</DialogTitle></DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the writer" rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={() => actionMut.mutate()} disabled={actionMut.isPending}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
