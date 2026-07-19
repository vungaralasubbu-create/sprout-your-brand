import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Sparkles, Shield, Video, Award, TrendingUp, CheckCircle2, XCircle, AlertCircle, Search } from "lucide-react";
import {
  listReviews, moderateReview, scanReviewSpam, generateSuccessStoryFromReview, getReviewAnalytics,
} from "@/lib/admin/reviews.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: ReviewsPage,
  errorComponent: ({ error }) => <div className="p-6 text-red-500">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

type Status = "pending" | "approved" | "rejected" | "spam" | "archived" | "all";

function ReviewsPage() {
  const [status, setStatus] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const list = useServerFn(listReviews);
  const analytics = useServerFn(getReviewAnalytics);
  const moderate = useServerFn(moderateReview);
  const scan = useServerFn(scanReviewSpam);
  const genStory = useServerFn(generateSuccessStoryFromReview);

  const stats = useQuery({ queryKey: ["review-analytics"], queryFn: () => analytics() });
  const reviews = useQuery({
    queryKey: ["reviews", status, search],
    queryFn: () => list({ data: { status, search: search || undefined, limit: 100 } }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["reviews"] });
    qc.invalidateQueries({ queryKey: ["review-analytics"] });
  };

  const mMod = useMutation({
    mutationFn: (v: any) => moderate({ data: v }),
    onSuccess: () => { toast.success("Updated"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const mScan = useMutation({
    mutationFn: (id: string) => scan({ data: { id } }),
    onSuccess: (r: any) => toast.success(`Spam score: ${(r.spam_score * 100).toFixed(0)}% (${r.verdict})`),
    onError: (e: any) => toast.error(e.message),
  });
  const mGen = useMutation({
    mutationFn: (id: string) => genStory({ data: { review_id: id } }),
    onSuccess: (r: any) => { toast.success("Success story generated"); invalidate(); window.open(r.story?.story_url || "#", "_blank"); },
    onError: (e: any) => toast.error(e.message),
  });

  const s = stats.data;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="w-7 h-7 text-primary" /> Reviews & Success</h1>
          <p className="text-muted-foreground mt-1">Moderate reviews, detect spam, and auto-generate SEO success stories.</p>
        </div>
      </header>

      {s && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <StatCard label="Pending" value={s.counts.pending} icon={AlertCircle} tone="warning" />
          <StatCard label="Approved" value={s.counts.approved} icon={CheckCircle2} tone="success" />
          <StatCard label="Spam" value={s.counts.spam} icon={Shield} tone="danger" />
          <StatCard label="Avg Rating" value={s.avg_rating} icon={Star} />
          <StatCard label="Response Rate" value={`${s.response_rate}%`} icon={TrendingUp} />
          <StatCard label="Total" value={s.total} icon={Award} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "approved", "spam", "rejected", "archived", "all"] as Status[]).map((k) => (
          <Button key={k} size="sm" variant={status === k ? "default" : "outline"} onClick={() => setStatus(k)}>
            {k[0].toUpperCase() + k.slice(1)}
          </Button>
        ))}
        <div className="ml-auto relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8 w-64" placeholder="Search name, text, company" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        {reviews.isLoading && <div className="text-muted-foreground">Loading reviews…</div>}
        {reviews.data?.rows.length === 0 && <Card className="p-8 text-center text-muted-foreground">No reviews in this bucket.</Card>}
        {reviews.data?.rows.map((r: any) => (
          <Card key={r.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {r.reviewer_avatar_url
                  ? <img src={r.reviewer_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">{(r.reviewer_name || "?")[0]}</div>}
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {r.reviewer_name}
                    {r.video_url && <Video className="w-4 h-4 text-primary" />}
                    {r.featured && <Badge variant="secondary">Featured</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.target_label} · {r.company_name || "—"} · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                  ))}
                </div>
                {r.spam_score > 0 && (
                  <div className="text-xs mt-1 text-muted-foreground">Spam {(r.spam_score * 100).toFixed(0)}%</div>
                )}
              </div>
            </div>

            {r.title && <div className="font-medium">{r.title}</div>}
            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{r.review_text}</p>

            {(r.salary_before_lpa || r.salary_after_lpa) && (
              <div className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-md inline-flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Salary: {r.salary_before_lpa ?? "?"} → {r.salary_after_lpa ?? "?"} LPA
                {r.salary_growth_pct && ` (+${r.salary_growth_pct}%)`}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button size="sm" onClick={() => mMod.mutate({ id: r.id, action: "approve", display_locations: ["homepage", "course_pages"] })}
                disabled={mMod.isPending}><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</Button>
              <Button size="sm" variant="outline" onClick={() => mMod.mutate({ id: r.id, action: r.featured ? "unfeature" : "feature" })}>
                {r.featured ? "Unfeature" : "Feature"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => mScan.mutate(r.id)} disabled={mScan.isPending}>
                <Shield className="w-4 h-4 mr-1" /> Spam Scan
              </Button>
              <Button size="sm" variant="outline" onClick={() => mGen.mutate(r.id)} disabled={mGen.isPending}>
                <Sparkles className="w-4 h-4 mr-1" /> Generate Success Story
              </Button>
              <Button size="sm" variant="ghost" onClick={() => mMod.mutate({ id: r.id, action: "reject" })}>
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button size="sm" variant="ghost" onClick={() => mMod.mutate({ id: r.id, action: "spam" })}>
                Mark Spam
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: any; icon: any; tone?: string }) {
  const toneClass = tone === "success" ? "text-emerald-500" : tone === "danger" ? "text-red-500" : tone === "warning" ? "text-amber-500" : "text-primary";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <Icon className={`w-4 h-4 ${toneClass}`} />
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Card>
  );
}
