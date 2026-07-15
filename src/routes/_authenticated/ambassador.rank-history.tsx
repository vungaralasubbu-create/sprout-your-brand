import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  History, Trophy, Calendar, School, Rocket, Flag, Award,
  AlertCircle, RefreshCw, ChevronDown, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listMyRankHistory,
  type RankHistoryItem,
} from "@/lib/campus-ambassador/recognition.functions";
import { cn } from "@/lib/utils";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TABS = ["all","monthly","college","program","campaign"] as const;
type Tab = typeof TABS[number];

function formatPeriod(period_key: string): string {
  if (period_key.startsWith("campaign:")) return "Campaign";
  const [y, m] = period_key.split("-").map(Number);
  if (!y || !m) return period_key;
  return `${MONTHS[m - 1]} ${y}`;
}

function typeIcon(type: string) {
  if (type === "monthly") return <Calendar className="h-4 w-4" />;
  if (type === "college") return <School className="h-4 w-4" />;
  if (type === "program") return <Rocket className="h-4 w-4" />;
  if (type === "campaign") return <Flag className="h-4 w-4" />;
  return <Trophy className="h-4 w-4" />;
}

type Search = { type?: Tab };

export const Route = createFileRoute("/_authenticated/ambassador/rank-history")({
  head: () => ({
    meta: [
      { title: "My Rank History — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => {
    const t = s.type;
    return {
      type: typeof t === "string" && (TABS as readonly string[]).includes(t)
        ? (t as Tab) : undefined,
    };
  },
  component: RankHistoryPage,
});

function RankHistoryPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab: Tab = search.type ?? "all";

  const fn = useServerFn(listMyRankHistory);
  const q = useQuery({
    queryKey: ["ambassador-rank-history", tab],
    queryFn: () => fn({ data: { type: tab } }),
    staleTime: 30_000,
  });

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          <History className="h-3.5 w-3.5" /> Rank History
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          My Rank History
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mt-1">
          Your finalised Campus Ambassador leaderboard results.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) =>
        navigate({ search: { type: v === "all" ? undefined : (v as Tab) } })
      }>
        <TabsList className="bg-slate-100 rounded-xl p-1 flex-wrap h-auto">
          <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg">Monthly</TabsTrigger>
          <TabsTrigger value="college" className="rounded-lg">College</TabsTrigger>
          <TabsTrigger value="program" className="rounded-lg">Program</TabsTrigger>
          <TabsTrigger value="campaign" className="rounded-lg">Campaign</TabsTrigger>
        </TabsList>
      </Tabs>

      {q.isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : q.isError ? (
        <Card className="p-6 flex items-center gap-3 border-red-100 bg-red-50/50">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div className="flex-1 text-sm text-red-800">Unable To Load Rank History</div>
          <Button size="sm" variant="outline" onClick={() => q.refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </Card>
      ) : (q.data?.length ?? 0) === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 grid place-items-center text-slate-500 mb-3">
            <History className="h-6 w-6" />
          </div>
          <div className="font-semibold text-slate-800">No Finalised Rank History Yet</div>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Your finalised Leaderboard results will appear here.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {q.data!.map((it, i) => <HistoryRow key={i} it={it} />)}
        </Card>
      )}
    </div>
  );
}

function HistoryRow({ it }: { it: RankHistoryItem }) {
  const [open, setOpen] = useState(false);
  const ChevronIcon = open ? ChevronDown : ChevronRight;
  const leaderboardLabel =
    it.leaderboard_type === "monthly" ? "Monthly Leaderboard" :
    it.leaderboard_type === "college" ? "College Leaderboard" :
    it.leaderboard_type === "program" ? "Program Leaderboard" :
    "Campaign Leaderboard";

  const contextName = it.leaderboard_type === "campaign"
    ? (it.campaign_name ?? "Campaign")
    : it.leaderboard_type === "program"
    ? (it.program_name ?? "Program")
    : it.leaderboard_type === "college"
    ? "College"
    : formatPeriod(it.period_key);

  return (
    <div>
      <button
        className="w-full text-left p-4 flex items-center gap-4 hover:bg-slate-50 transition"
        onClick={() => setOpen((v) => !v)}
      >
        <div className={cn(
          "h-10 w-10 rounded-lg grid place-items-center bg-slate-100 text-slate-600",
        )}>
          {typeIcon(it.leaderboard_type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">
              Final Rank #{it.final_rank}
            </span>
            <Badge variant="outline" className="text-[10px]">{leaderboardLabel}</Badge>
            {it.recognition_title && (
              <Badge variant="info" className="text-[10px] gap-1">
                <Award className="h-3 w-3" />
                {it.recognition_title}
              </Badge>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {formatPeriod(it.period_key)} · {contextName} · {Number(it.metric_value)} {it.primary_metric.replace(/_/g," ")}
          </div>
        </div>
        <ChevronIcon className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="px-4 pb-4 -mt-1 grid gap-2 text-sm text-slate-600 bg-slate-50/40">
          <Detail k="Leaderboard Type" v={leaderboardLabel} />
          <Detail k="Ranking Period" v={formatPeriod(it.period_key)} />
          <Detail k="Final Rank" v={`#${it.final_rank}`} />
          <Detail k="Primary Metric" v={it.primary_metric.replace(/_/g," ")} />
          <Detail k="Final Metric Value" v={String(Number(it.metric_value))} />
          {it.leaderboard_type === "program" && it.program_name && <Detail k="Program" v={it.program_name} />}
          {it.leaderboard_type === "campaign" && it.campaign_name && <Detail k="Campaign" v={it.campaign_name} />}
          {it.leaderboard_type === "college" && it.college_key && <Detail k="College" v={it.college_key} />}
          {it.recognition_title && <Detail k="Recognition" v={it.recognition_title} />}
        </div>
      )}
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[11px] uppercase tracking-wider text-slate-400 w-40 shrink-0">{k}</span>
      <span className="text-slate-800">{v}</span>
    </div>
  );
}
