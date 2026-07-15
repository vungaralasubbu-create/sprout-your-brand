import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Trophy, Award, Crown, Medal, Share2, Sparkles, Calendar, School, Rocket, Flag,
  AlertCircle, RefreshCw, Copy, Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listMyRecognitions,
  listPreviousMonthlyLeaders,
  type MyRecognition,
} from "@/lib/campus-ambassador/recognition.functions";
import { cn } from "@/lib/utils";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatPeriod(period_key: string): string {
  if (period_key.startsWith("campaign:")) return "Campaign";
  const [y, m] = period_key.split("-").map(Number);
  if (!y || !m) return period_key;
  return `${MONTHS[m - 1]} ${y}`;
}

export const Route = createFileRoute("/_authenticated/ambassador/recognition")({
  head: () => ({
    meta: [
      { title: "My Recognition — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecognitionPage,
});

function RecognitionPage() {
  const listFn = useServerFn(listMyRecognitions);
  const leadersFn = useServerFn(listPreviousMonthlyLeaders);

  const listQ = useQuery({
    queryKey: ["ambassador-recognition", "mine"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });
  const leadersQ = useQuery({
    queryKey: ["ambassador-recognition", "previous-monthly"],
    queryFn: () => leadersFn({ data: { limit: 6 } }),
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          <Award className="h-3.5 w-3.5" /> Recognition
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          My Recognition
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Verified Campus Ambassador achievements based on finalised leaderboard results.
        </p>
      </header>

      {/* My Recognition */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Your recognition</h2>
        {listQ.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : listQ.isError ? (
          <ErrorState title="Unable to load recognition" onRetry={() => listQ.refetch()} />
        ) : (listQ.data?.length ?? 0) === 0 ? (
          <EmptyRecognition />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listQ.data!.map((r) => <RecognitionCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      {/* Previous Monthly Leaders */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Previous Monthly Leaders</h2>
          <span className="text-xs text-slate-500">Rank #1 · finalised months</span>
        </div>
        {leadersQ.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : leadersQ.isError ? (
          <ErrorState title="Unable to load monthly leaders" onRetry={() => leadersQ.refetch()} />
        ) : (leadersQ.data?.length ?? 0) === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            Monthly Leaders Not Available Yet
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leadersQ.data!.map((l) => (
              <Card key={l.period_key} className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center text-white font-semibold">
                  <Crown className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500">{formatPeriod(l.period_key)}</div>
                  <div className="font-medium text-slate-900 truncate">{l.display_identity}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {l.college_display ?? "—"} · {Number(l.metric_value)} {l.primary_metric.replace(/_/g," ")}
                  </div>
                </div>
                {l.level_name && (
                  <Badge variant="outline" className="text-[10px]">{l.level_name}</Badge>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function typeIcon(type: string) {
  if (type.startsWith("monthly")) return <Calendar className="h-4 w-4" />;
  if (type.startsWith("college")) return <School className="h-4 w-4" />;
  if (type.startsWith("program")) return <Rocket className="h-4 w-4" />;
  if (type.startsWith("campaign")) return <Flag className="h-4 w-4" />;
  return <Trophy className="h-4 w-4" />;
}

function rankBadge(rank: number) {
  if (rank === 1) return { icon: Crown, cls: "from-amber-400 to-orange-500", label: "#1" };
  if (rank === 2) return { icon: Medal, cls: "from-slate-300 to-slate-500", label: "#2" };
  if (rank === 3) return { icon: Medal, cls: "from-orange-300 to-orange-500", label: "#3" };
  return { icon: Award, cls: "from-blue-400 to-cyan-500", label: `#${rank}` };
}

function RecognitionCard({ r }: { r: MyRecognition }) {
  const [copied, setCopied] = useState(false);
  const rb = rankBadge(r.final_rank);
  const RankIcon = rb.icon;

  const periodLabel = r.leaderboard_type === "campaign"
    ? (r.campaign_name ?? "Campaign")
    : formatPeriod(r.ranking_period_key);

  const contextLabel = r.leaderboard_type === "program" && r.program_name
    ? r.program_name
    : r.leaderboard_type === "college"
    ? "College Leaderboard"
    : r.leaderboard_type === "campaign"
    ? "Campaign Leaderboard"
    : "Monthly Leaderboard";

  const shareText = `Proud to be recognised as ${r.recognition_title} in Glintr's Campus Ambassador Program for ${periodLabel}.`;

  const doShare = async () => {
    try {
      const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
      if (nav.share) {
        await nav.share({ text: shareText, title: r.recognition_title });
        return;
      }
    } catch { /* fallthrough to copy */ }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  return (
    <Card className="p-5 relative overflow-hidden group">
      <div className={cn(
        "absolute -top-8 -right-8 h-28 w-28 rounded-full opacity-10 bg-gradient-to-br",
        rb.cls,
      )} />
      <div className="flex items-start justify-between gap-3">
        <div className={cn(
          "h-11 w-11 rounded-xl grid place-items-center text-white shadow-sm bg-gradient-to-br",
          rb.cls,
        )}>
          <RankIcon className="h-5 w-5" />
        </div>
        <Badge variant="outline" className="gap-1 text-[10px]">
          {typeIcon(r.recognition_type)}
          Final Rank {rb.label}
        </Badge>
      </div>

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">Recognition</div>
        <div className="text-lg font-semibold text-slate-900 leading-snug">{r.recognition_title}</div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-600">
        <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {periodLabel}</div>
        <div className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> {contextLabel}</div>
        {r.badge_name && (
          <div className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Badge: {r.badge_name}</div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={doShare}>
          {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Share2 className="h-3.5 w-3.5" /> Share</>}
        </Button>
      </div>
    </Card>
  );
}

function EmptyRecognition() {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 grid place-items-center text-slate-500 mb-3">
        <Award className="h-6 w-6" />
      </div>
      <div className="font-semibold text-slate-800">No Recognition Yet</div>
      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        Your verified Campus Ambassador ranking achievements will appear here.
      </p>
    </Card>
  );
}

function ErrorState({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <Card className="p-6 flex items-center gap-3 border-red-100 bg-red-50/50">
      <AlertCircle className="h-5 w-5 text-red-500" />
      <div className="flex-1 text-sm text-red-800">{title}</div>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </Button>
    </Card>
  );
}

// suppress unused import lint (kept for future use)
void useMemo;
