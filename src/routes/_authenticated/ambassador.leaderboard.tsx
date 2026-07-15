import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Trophy, Search, ChevronLeft, ChevronRight, Crown, Medal, Award,
  GraduationCap, Users, TrendingUp, Sparkles, RefreshCw, ArrowDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import {
  listOverallLeaderboard,
  getMyLeaderboardRank,
  type LeaderboardRow,
} from "@/lib/campus-ambassador/leaderboard.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ambassador/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeaderboardPage,
});

const PAGE_SIZE = 25;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function LeaderboardPage() {
  const [tab, setTab] = useState("overall");
  const [search, setSearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [page, setPage] = useState(1);

  const listFn = useServerFn(listOverallLeaderboard);
  const meFn = useServerFn(getMyLeaderboardRank);

  const listQ = useQuery({
    queryKey: ["ambassador-leaderboard", "overall", search, page],
    queryFn: () => listFn({ data: { search, page, pageSize: PAGE_SIZE } }),
    staleTime: 30_000,
  });

  const myQ = useQuery({
    queryKey: ["ambassador-leaderboard", "me"],
    queryFn: () => meFn(),
    staleTime: 30_000,
  });

  const rows = (listQ.data?.rows ?? []) as LeaderboardRow[];
  const total = listQ.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const me = myQ.data?.present ? myQ.data : null;

  const top3 = useMemo(() => {
    if (page !== 1) return [];
    return rows.slice(0, 3);
  }, [rows, page]);

  const listRows = useMemo(() => {
    if (page !== 1) return rows;
    return rows.slice(3);
  }, [rows, page]);

  const jumpToMyRank = () => {
    if (!me) return;
    const target = Math.ceil(me.rank_position / PAGE_SIZE);
    setSearch("");
    setPendingSearch("");
    setPage(target);
    setTimeout(() => {
      const el = document.getElementById(`amb-row-${me.ambassador_id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  return (
    <AmbassadorShell>
      <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            <Trophy className="h-3.5 w-3.5" /> Campus Ambassador Leaderboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Campus Ambassador Leaderboard
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Track your ranking and compare verified Campus Ambassador performance.
          </p>
        </header>

        <MyRankCard
          loading={myQ.isLoading}
          error={myQ.isError}
          me={me}
          onRetry={() => myQ.refetch()}
          onJump={jumpToMyRank}
        />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-slate-100 rounded-xl p-1 flex-wrap h-auto">
            <TabsTrigger value="overall" className="rounded-lg">Overall</TabsTrigger>
            <TabsTrigger value="monthly" disabled className="rounded-lg opacity-60">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="college" disabled className="rounded-lg opacity-60">
              My College
            </TabsTrigger>
            <TabsTrigger value="programs" disabled className="rounded-lg opacity-60">
              Programs
            </TabsTrigger>
            <TabsTrigger value="campaigns" disabled className="rounded-lg opacity-60">
              Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-5 mt-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                  setSearch(pendingSearch.trim().slice(0, 80));
                }}
                className="relative w-full sm:max-w-sm"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  maxLength={80}
                  placeholder="Search ambassadors or colleges"
                  className="pl-9 h-10 bg-white"
                />
              </form>
              {me && (
                <Button variant="outline" size="sm" onClick={jumpToMyRank} className="gap-2">
                  <ArrowDown className="h-4 w-4" /> Jump to my rank
                </Button>
              )}
            </div>

            {listQ.isLoading ? (
              <LeaderboardSkeleton />
            ) : listQ.isError ? (
              <ErrorState
                title="Unable to load leaderboard"
                onRetry={() => listQ.refetch()}
              />
            ) : rows.length === 0 ? (
              <EmptyState hasSearch={search.length > 0} />
            ) : (
              <>
                {top3.length > 0 && <TopThree rows={top3} />}
                <Card className="divide-y divide-slate-100 overflow-hidden">
                  {listRows.map((r) => (
                    <LeaderboardRowItem key={r.ambassador_id} row={r} />
                  ))}
                </Card>

                {pages > 1 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-slate-500">
                      Page {page} of {pages} · {total.toLocaleString("en-IN")} ambassadors
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pages}
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                        className="gap-1"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="monthly">
            <ComingSoon label="Monthly rankings" />
          </TabsContent>
          <TabsContent value="college">
            <ComingSoon label="My College leaderboard" />
          </TabsContent>
          <TabsContent value="programs">
            <ComingSoon label="Program leaderboards" />
          </TabsContent>
          <TabsContent value="campaigns">
            <ComingSoon label="Campaign leaderboards" />
          </TabsContent>
        </Tabs>
      </div>
    </AmbassadorShell>
  );
}

function MyRankCard({
  loading, error, me, onRetry, onJump,
}: {
  loading: boolean;
  error: boolean;
  me: NonNullable<Awaited<ReturnType<typeof getMyLeaderboardRank>>> extends infer T
    ? T extends { present: true }
      ? T
      : null
    : null;
  onRetry: () => void;
  onJump: () => void;
}) {
  if (loading) {
    return <Skeleton className="h-32 sm:h-28 w-full rounded-2xl" />;
  }
  if (error) {
    return (
      <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-200">Unable to load your rank</div>
            <div className="text-xs text-slate-400">We couldn't reach the leaderboard.</div>
          </div>
          <Button size="sm" variant="secondary" onClick={onRetry} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </Card>
    );
  }
  if (!me) {
    return (
      <Card className="p-5 bg-slate-50 border-slate-200">
        <div className="text-sm text-slate-600">
          Your rank will appear here once your Campus Ambassador account is active.
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 text-white">
      <div
        aria-hidden
        className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
      />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20 flex items-center justify-center">
            {me.photo_url ? (
              <img
                src={me.photo_url}
                alt=""
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-white">
                {initials(me.display_identity)}
              </span>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-cyan-300 font-medium">
              My rank
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight">#{me.rank_position}</span>
              <span className="text-sm text-slate-300">
                of {me.total_active.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {me.display_identity}
              {me.college_display && (
                <span className="text-slate-300 font-normal"> · {me.college_display}</span>
              )}
            </div>
            {me.level_name && (
              <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-cyan-200">
                <Sparkles className="h-3 w-3" /> {me.level_name}
              </div>
            )}
          </div>
        </div>

        <div className="sm:ml-auto grid grid-cols-3 gap-3 sm:gap-6 sm:min-w-[320px]">
          <MyStat label="Verified" value={me.verified_enrollments} />
          <MyStat label="Leads" value={me.valid_referral_leads} />
          <MyStat
            label="Conversion"
            value={`${me.conversion_rate.toFixed(1)}%`}
          />
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="bg-white text-slate-900 hover:bg-slate-100 gap-1.5"
          onClick={onJump}
        >
          <ArrowDown className="h-3.5 w-3.5" /> Jump to my row
        </Button>
        <Button
          size="sm"
          variant="ghost"
          asChild
          className="text-white hover:bg-white/10"
        >
          <Link to="/ambassador/profile">View my profile</Link>
        </Button>
      </div>
    </Card>
  );
}

function MyStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-300">{label}</div>
      <div className="text-lg sm:text-xl font-semibold text-white tabular-nums">{value}</div>
    </div>
  );
}

function TopThree({ rows }: { rows: LeaderboardRow[] }) {
  const podium = [rows[1], rows[0], rows[2]].filter(Boolean);
  const heights = [
    "sm:pt-8",
    "sm:pt-0",
    "sm:pt-12",
  ];
  const trophies = [
    <Medal key="s" className="h-4 w-4 text-slate-400" />,
    <Crown key="g" className="h-4 w-4 text-amber-400" />,
    <Award key="b" className="h-4 w-4 text-orange-400" />,
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {podium.map((r, i) => (
        <Card
          key={r.ambassador_id}
          className={cn(
            "p-4 border-slate-200 bg-white hover:shadow-md transition-shadow",
            heights[i],
            r.is_me && "ring-2 ring-cyan-400"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden ring-1 ring-slate-200">
                {r.photo_url ? (
                  <img src={r.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-slate-500">
                    {initials(r.display_identity)}
                  </span>
                )}
              </div>
              <div className="absolute -top-1.5 -right-1.5 rounded-full bg-white shadow ring-1 ring-slate-200 h-6 w-6 flex items-center justify-center">
                {trophies[i]}
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  #{r.rank_position}
                </span>
                {r.is_me && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    You
                  </Badge>
                )}
              </div>
              <div className="text-sm font-semibold text-slate-900 truncate">
                {r.display_identity}
              </div>
              {r.college_display && (
                <div className="text-xs text-slate-500 truncate">
                  {r.college_display}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="inline-flex items-center gap-1 font-medium text-slate-700">
              <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
              {r.verified_enrollments} verified
            </div>
            {r.level_name && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700 ring-1 ring-cyan-100">
                <Sparkles className="h-2.5 w-2.5" /> {r.level_name}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function LeaderboardRowItem({ row }: { row: LeaderboardRow }) {
  return (
    <div
      id={`amb-row-${row.ambassador_id}`}
      className={cn(
        "flex items-center gap-3 sm:gap-4 px-4 py-3.5 transition-colors",
        row.is_me ? "bg-cyan-50/60" : "hover:bg-slate-50"
      )}
    >
      <div
        className={cn(
          "w-10 text-sm font-semibold tabular-nums text-center",
          row.rank_position <= 3 ? "text-amber-600" : "text-slate-500"
        )}
      >
        #{row.rank_position}
      </div>
      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
        {row.photo_url ? (
          <img src={row.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-slate-500">
            {initials(row.display_identity)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 truncate">
            {row.display_identity}
          </span>
          {row.is_me && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">You</Badge>
          )}
          {row.level_name && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700 ring-1 ring-cyan-100">
              <Sparkles className="h-2.5 w-2.5" /> {row.level_name}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 truncate">
          {row.college_display ?? "College hidden"}
        </div>
        {row.featured_badges.length > 0 && (
          <div className="mt-1 flex gap-1">
            {row.featured_badges.map((b) => (
              <span
                key={b.badge_id}
                title={b.name}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100"
              >
                <Award className="h-2.5 w-2.5" /> {b.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <StatCell icon={<GraduationCap className="h-3.5 w-3.5" />} label="Verified" value={row.verified_enrollments} />
        <StatCell icon={<Users className="h-3.5 w-3.5" />} label="Leads" value={row.valid_referral_leads} />
        <StatCell icon={<TrendingUp className="h-3.5 w-3.5" />} label="Conv." value={`${row.conversion_rate.toFixed(1)}%`} />
      </div>
      <div className="sm:hidden text-right">
        <div className="text-sm font-semibold text-slate-900 tabular-nums">
          {row.verified_enrollments}
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">verified</div>
      </div>
    </div>
  );
}

function StatCell({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-center min-w-[64px]">
      <div className="text-sm font-semibold text-slate-900 tabular-nums">{value}</div>
      <div className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 uppercase tracking-wider">
        {icon} {label}
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Card className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-3">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-32 hidden sm:block" />
          </div>
        ))}
      </Card>
    </div>
  );
}

function ErrorState({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <Card className="p-10 text-center">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 mt-1 mb-4">
        Something went wrong loading this data.
      </p>
      <Button size="sm" onClick={onRetry} variant="outline" className="gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </Button>
    </Card>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <Card className="p-10 text-center">
      <Trophy className="h-10 w-10 mx-auto text-slate-300 mb-2" />
      <h3 className="text-base font-semibold text-slate-900">
        {hasSearch ? "No ambassadors match your search" : "Leaderboard not available yet"}
      </h3>
      <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
        {hasSearch
          ? "Try a different name or college."
          : "Eligible Campus Ambassador rankings will appear when verified performance activity is available."}
      </p>
    </Card>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <Card className="p-10 mt-5 text-center bg-slate-50 border-dashed">
      <Sparkles className="h-8 w-8 mx-auto text-slate-400 mb-2" />
      <h3 className="text-base font-semibold text-slate-900">{label} coming soon</h3>
      <p className="text-sm text-slate-600 mt-1">
        This ranking view is being finalised and will unlock in a later release.
      </p>
    </Card>
  );
}
