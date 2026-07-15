import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Trophy, Search, ChevronLeft, ChevronRight, Crown, Medal, Award,
  GraduationCap, Users, TrendingUp, Sparkles, RefreshCw, ArrowDown,
  Calendar, School, AlertCircle, Radio, BookOpen, Rocket, Target, Flag,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import {
  listOverallLeaderboard,
  getMyLeaderboardRank,
  listMonthlyLeaderboard,
  getMyMonthlyRank,
  getMyCollegeContext,
  listCollegeLeaderboard,
  getMyCollegeRank,
  listLeaderboardPrograms,
  listProgramLeaderboard,
  getMyProgramRank,
  listVisibleCampaigns,
  listCampaignLeaderboard,
  getMyCampaignRank,
  type LeaderboardRow,
  type CampaignLeaderboardRow,
} from "@/lib/campus-ambassador/leaderboard.functions";
import { cn } from "@/lib/utils";

type LbSearch = {
  tab?: "overall" | "monthly" | "college" | "programs" | "campaigns";
  programId?: string;
  campaignId?: string;
};

export const Route = createFileRoute("/_authenticated/ambassador/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): LbSearch => {
    const tab = s.tab;
    const allowed = ["overall","monthly","college","programs","campaigns"] as const;
    return {
      tab: typeof tab === "string" && (allowed as readonly string[]).includes(tab)
        ? (tab as LbSearch["tab"]) : undefined,
      programId: typeof s.programId === "string" ? s.programId : undefined,
      campaignId: typeof s.campaignId === "string" ? s.campaignId : undefined,
    };
  },
  component: LeaderboardPage,
});

const PAGE_SIZE = 25;
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function initials(name: string) {
  return name
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((s) => s[0]?.toUpperCase()).join("");
}

/** Current year/month in Glintr business timezone (Asia/Kolkata). */
function currentBusinessMonth(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit",
  }).formatToParts(new Date());
  return {
    year: Number(parts.find((p) => p.type === "year")!.value),
    month: Number(parts.find((p) => p.type === "month")!.value),
  };
}

function previousBusinessMonth(): { year: number; month: number } {
  const { year, month } = currentBusinessMonth();
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function formatPeriod(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function isCurrentMonth(year: number, month: number) {
  const cur = currentBusinessMonth();
  return cur.year === year && cur.month === month;
}

function LeaderboardPage() {
  const [tab, setTab] = useState("overall");
  const meFn = useServerFn(getMyLeaderboardRank);
  const myQ = useQuery({
    queryKey: ["ambassador-leaderboard", "me"],
    queryFn: () => meFn(),
    staleTime: 30_000,
  });
  const me = myQ.data?.present ? myQ.data : null;

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

        <MyRankCard loading={myQ.isLoading} error={myQ.isError} me={me}
          onRetry={() => myQ.refetch()} />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-slate-100 rounded-xl p-1 flex-wrap h-auto">
            <TabsTrigger value="overall" className="rounded-lg">Overall</TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-lg">Monthly</TabsTrigger>
            <TabsTrigger value="college" className="rounded-lg">My College</TabsTrigger>
            <TabsTrigger value="programs" disabled className="rounded-lg opacity-60">
              Programs
            </TabsTrigger>
            <TabsTrigger value="campaigns" disabled className="rounded-lg opacity-60">
              Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="mt-5">
            <OverallTab />
          </TabsContent>
          <TabsContent value="monthly" className="mt-5">
            <MonthlyTab />
          </TabsContent>
          <TabsContent value="college" className="mt-5">
            <CollegeTab />
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

// =================== OVERALL ===================
function OverallTab() {
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
  const me = myQ.data?.present ? myQ.data : null;

  const rows = (listQ.data?.rows ?? []) as LeaderboardRow[];
  const total = listQ.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const top3 = page === 1 ? rows.slice(0, 3) : [];
  const listRows = page === 1 ? rows.slice(3) : rows;

  const jumpToMyRank = () => {
    if (!me) return;
    const target = Math.ceil(me.rank_position / PAGE_SIZE);
    setSearch(""); setPendingSearch(""); setPage(target);
    setTimeout(() => {
      document.getElementById(`amb-row-${me.ambassador_id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  return (
    <div className="space-y-5">
      <SearchAndJump
        pendingSearch={pendingSearch} setPendingSearch={setPendingSearch}
        onSearch={(v) => { setPage(1); setSearch(v); }}
        onJump={me ? jumpToMyRank : undefined}
        placeholder="Search ambassadors or colleges"
      />
      {listQ.isLoading ? <LeaderboardSkeleton /> :
        listQ.isError ? <ErrorState title="Unable to load leaderboard" onRetry={() => listQ.refetch()} /> :
        rows.length === 0 ? <EmptyState hasSearch={search.length > 0} /> : (
          <>
            {top3.length > 0 && <TopThree rows={top3} />}
            <Card className="divide-y divide-slate-100 overflow-hidden">
              {listRows.map((r) => <LeaderboardRowItem key={r.ambassador_id} row={r} />)}
            </Card>
            <Pager page={page} pages={pages} total={total} setPage={setPage} />
          </>
        )}
    </div>
  );
}

// =================== MONTHLY ===================
function MonthlyTab() {
  const cur = currentBusinessMonth();
  const [periodKey, setPeriodKey] = useState<string>(`${cur.year}-${cur.month}`);
  const [search, setSearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [page, setPage] = useState(1);

  const [year, month] = periodKey.split("-").map(Number);
  const active = isCurrentMonth(year, month);

  const listFn = useServerFn(listMonthlyLeaderboard);
  const meFn = useServerFn(getMyMonthlyRank);

  const listQ = useQuery({
    queryKey: ["ambassador-leaderboard", "monthly", year, month, search, page],
    queryFn: () => listFn({ data: { year, month, search, page, pageSize: PAGE_SIZE } }),
    staleTime: 20_000,
  });
  const myQ = useQuery({
    queryKey: ["ambassador-leaderboard", "monthly-me", year, month],
    queryFn: () => meFn({ data: { year, month } }),
    staleTime: 20_000,
  });
  const me = myQ.data?.present ? myQ.data : null;

  const rows = (listQ.data?.rows ?? []) as LeaderboardRow[];
  const total = listQ.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const top3 = page === 1 ? rows.slice(0, 3) : [];
  const listRows = page === 1 ? rows.slice(3) : rows;

  const jumpToMyRank = () => {
    if (!me) return;
    const target = Math.ceil(me.rank_position / PAGE_SIZE);
    setSearch(""); setPendingSearch(""); setPage(target);
    setTimeout(() => {
      document.getElementById(`amb-row-${me.ambassador_id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const options = useMemo(() => {
    const p = previousBusinessMonth();
    return [
      { key: `${cur.year}-${cur.month}`, label: `${formatPeriod(cur.year, cur.month)} · Current` },
      { key: `${p.year}-${p.month}`, label: `${formatPeriod(p.year, p.month)} · Previous` },
    ];
  }, [cur.year, cur.month]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <Select value={periodKey} onValueChange={(v) => { setPeriodKey(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-[240px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant={active ? "info" : "outline"} className="gap-1">
            {active ? <><Radio className="h-3 w-3" /> Live rankings</> : "Final rankings"}
          </Badge>
        </div>
      </div>

      {active && (
        <p className="text-xs text-slate-500 -mt-2">
          Rankings may update as eligible performance activity is verified.
        </p>
      )}

      <MyPeriodRankCard
        title={`My ${formatPeriod(year, month)} rank`}
        loading={myQ.isLoading}
        error={myQ.isError}
        me={me}
        contextLabel={`of ${(me?.total_ranked ?? 0).toLocaleString("en-IN")} ranked`}
        onRetry={() => myQ.refetch()}
        onJump={me ? jumpToMyRank : undefined}
        emptyText={active
          ? "You'll appear in the ranking once you have eligible referral leads or verified enrollments this month."
          : "You had no eligible performance activity in this period."}
      />

      <SearchAndJump
        pendingSearch={pendingSearch} setPendingSearch={setPendingSearch}
        onSearch={(v) => { setPage(1); setSearch(v); }}
        onJump={me ? jumpToMyRank : undefined}
        placeholder="Search ambassadors this month"
      />

      {listQ.isLoading ? <LeaderboardSkeleton /> :
        listQ.isError ? <ErrorState title="Unable to load leaderboard" onRetry={() => listQ.refetch()} /> :
        rows.length === 0 ? (
          <Card className="p-10 text-center">
            <Trophy className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <h3 className="text-base font-semibold text-slate-900">
              {search ? "No ambassadors match your search" : "Monthly leaderboard not available yet"}
            </h3>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              {search
                ? "Try a different name."
                : "Eligible monthly rankings will appear when verified performance activity is available."}
            </p>
          </Card>
        ) : (
          <>
            {top3.length > 0 && <TopThree rows={top3} />}
            <Card className="divide-y divide-slate-100 overflow-hidden">
              {listRows.map((r) => <LeaderboardRowItem key={r.ambassador_id} row={r} />)}
            </Card>
            <Pager page={page} pages={pages} total={total} setPage={setPage} />
          </>
        )}
    </div>
  );
}

// =================== COLLEGE ===================
function CollegeTab() {
  const ctxFn = useServerFn(getMyCollegeContext);
  const ctxQ = useQuery({
    queryKey: ["ambassador-leaderboard", "college-ctx"],
    queryFn: () => ctxFn(),
    staleTime: 60_000,
  });

  if (ctxQ.isLoading) return <LeaderboardSkeleton />;
  if (ctxQ.isError) return <ErrorState title="Unable to load leaderboard" onRetry={() => ctxQ.refetch()} />;
  if (!ctxQ.data?.has_college) return <CollegeVerificationRequired />;

  return <CollegeLeaderboardBody />;
}

function CollegeVerificationRequired() {
  return (
    <Card className="p-8 sm:p-10 border-amber-200 bg-amber-50/40">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            College verification required
          </h3>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Complete or verify your college information to view your Campus Leaderboard.
          </p>
          <div className="mt-4">
            <Button asChild size="sm">
              <Link to="/ambassador/profile">Review college details</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CollegeLeaderboardBody() {
  const [search, setSearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [page, setPage] = useState(1);

  const listFn = useServerFn(listCollegeLeaderboard);
  const meFn = useServerFn(getMyCollegeRank);
  const listQ = useQuery({
    queryKey: ["ambassador-leaderboard", "college", search, page],
    queryFn: () => listFn({ data: { search, page, pageSize: PAGE_SIZE } }),
    staleTime: 30_000,
  });
  const myQ = useQuery({
    queryKey: ["ambassador-leaderboard", "college-me"],
    queryFn: () => meFn(),
    staleTime: 30_000,
  });
  const me = myQ.data?.present ? myQ.data : null;
  const collegeName = listQ.data?.college_name ?? me?.college_name ?? "Your Campus";

  const rows = (listQ.data?.rows ?? []) as LeaderboardRow[];
  const total = listQ.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const top3 = page === 1 ? rows.slice(0, 3) : [];
  const listRows = page === 1 ? rows.slice(3) : rows;

  const jumpToMyRank = () => {
    if (!me) return;
    const target = Math.ceil(me.rank_position / PAGE_SIZE);
    setSearch(""); setPendingSearch(""); setPage(target);
    setTimeout(() => {
      document.getElementById(`amb-row-${me.ambassador_id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6 border-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
            <School className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              Your Campus
            </div>
            <div className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
              {collegeName}
            </div>
            <div className="text-xs text-slate-600">Campus Ambassador Rankings</div>
          </div>
        </div>
      </Card>

      <MyPeriodRankCard
        title="My campus rank"
        loading={myQ.isLoading}
        error={myQ.isError}
        me={me
          ? {
              ambassador_id: me.ambassador_id,
              rank_position: me.rank_position,
              display_identity: me.display_identity,
              college_display: me.college_name,
              photo_url: me.photo_url,
              level_name: me.level_name,
              verified_enrollments: me.verified_enrollments,
              valid_referral_leads: me.valid_referral_leads,
              conversion_rate: me.conversion_rate,
              total_ranked: me.total_ranked,
            }
          : null}
        contextLabel={`of ${(me?.total_ranked ?? 0).toLocaleString("en-IN")} at your campus`}
        onRetry={() => myQ.refetch()}
        onJump={me ? jumpToMyRank : undefined}
        emptyText="You'll appear once you and eligible campus ambassadors have verified activity."
      />

      <SearchAndJump
        pendingSearch={pendingSearch} setPendingSearch={setPendingSearch}
        onSearch={(v) => { setPage(1); setSearch(v); }}
        onJump={me ? jumpToMyRank : undefined}
        placeholder="Search ambassadors at your campus"
        jumpLabel="Jump to my campus rank"
      />

      {listQ.isLoading ? <LeaderboardSkeleton /> :
        listQ.isError ? <ErrorState title="Unable to load leaderboard" onRetry={() => listQ.refetch()} /> :
        rows.length === 0 ? (
          <Card className="p-10 text-center">
            <School className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <h3 className="text-base font-semibold text-slate-900">
              {search ? "No ambassadors match your search" : "Campus leaderboard not available yet"}
            </h3>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              {search
                ? "Try a different name."
                : "Eligible Campus Ambassador rankings for your college will appear here."}
            </p>
          </Card>
        ) : (
          <>
            {top3.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-2">
                  Top Campus Ambassadors
                </div>
                <TopThree rows={top3} />
              </div>
            )}
            <Card className="divide-y divide-slate-100 overflow-hidden">
              {listRows.map((r) => <LeaderboardRowItem key={r.ambassador_id} row={r} />)}
            </Card>
            <Pager page={page} pages={pages} total={total} setPage={setPage} />
          </>
        )}
    </div>
  );
}

// =================== Shared ===================
function SearchAndJump({
  pendingSearch, setPendingSearch, onSearch, onJump, placeholder, jumpLabel,
}: {
  pendingSearch: string;
  setPendingSearch: (v: string) => void;
  onSearch: (v: string) => void;
  onJump?: () => void;
  placeholder: string;
  jumpLabel?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <form
        onSubmit={(e) => { e.preventDefault(); onSearch(pendingSearch.trim().slice(0, 80)); }}
        className="relative w-full sm:max-w-sm"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={pendingSearch}
          onChange={(e) => setPendingSearch(e.target.value)}
          maxLength={80}
          placeholder={placeholder}
          className="pl-9 h-10 bg-white"
        />
      </form>
      {onJump && (
        <Button variant="outline" size="sm" onClick={onJump} className="gap-2">
          <ArrowDown className="h-4 w-4" /> {jumpLabel ?? "Jump to my rank"}
        </Button>
      )}
    </div>
  );
}

function Pager({
  page, pages, total, setPage,
}: { page: number; pages: number; total: number; setPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-slate-500">
        Page {page} of {pages} · {total.toLocaleString("en-IN")} ambassadors
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1}
          onClick={() => setPage(Math.max(1, page - 1))} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages}
          onClick={() => setPage(Math.min(pages, page + 1))} className="gap-1">
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// =================== My rank cards ===================
type MyRankData = NonNullable<Awaited<ReturnType<typeof getMyLeaderboardRank>>> extends infer T
  ? T extends { present: true } ? T : null : null;

function MyRankCard({
  loading, error, me, onRetry,
}: {
  loading: boolean; error: boolean; me: MyRankData; onRetry: () => void;
}) {
  if (loading) return <Skeleton className="h-32 sm:h-28 w-full rounded-2xl" />;
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
      <div aria-hidden className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20 flex items-center justify-center">
            {me.photo_url ? (
              <img src={me.photo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <span className="text-lg font-bold text-white">{initials(me.display_identity)}</span>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-cyan-300 font-medium">Overall rank</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight">#{me.rank_position}</span>
              <span className="text-sm text-slate-300">of {me.total_active.toLocaleString("en-IN")}</span>
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {me.display_identity}
              {me.college_display && <span className="text-slate-300 font-normal"> · {me.college_display}</span>}
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
          <MyStat label="Conversion" value={`${me.conversion_rate.toFixed(1)}%`} />
        </div>
      </div>
    </Card>
  );
}

type PeriodRankData = {
  ambassador_id: string;
  rank_position: number;
  display_identity: string;
  college_display: string | null;
  photo_url: string | null;
  level_name: string | null;
  verified_enrollments: number;
  valid_referral_leads: number;
  conversion_rate: number;
  total_ranked: number;
};

function MyPeriodRankCard({
  title, loading, error, me, contextLabel, onRetry, onJump, emptyText,
}: {
  title: string;
  loading: boolean;
  error: boolean;
  me: PeriodRankData | null;
  contextLabel: string;
  onRetry: () => void;
  onJump?: () => void;
  emptyText: string;
}) {
  if (loading) return <Skeleton className="h-28 w-full rounded-2xl" />;
  if (error) {
    return (
      <Card className="p-5 bg-slate-900 text-white border-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Unable to load {title.toLowerCase()}</div>
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
        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">{title}</div>
        <div className="text-sm text-slate-600 mt-1">{emptyText}</div>
      </Card>
    );
  }
  return (
    <Card className="relative overflow-hidden border-0 p-5 bg-gradient-to-br from-slate-900 to-indigo-900 text-white">
      <div aria-hidden className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
            {me.photo_url ? (
              <img src={me.photo_url} alt="" className="h-full w-full rounded-xl object-cover" />
            ) : (
              <span className="text-sm font-bold">{initials(me.display_identity)}</span>
            )}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-medium">{title}</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold">#{me.rank_position}</span>
              <span className="text-xs text-slate-300">{contextLabel}</span>
            </div>
            <div className="mt-0.5 text-sm">{me.display_identity}</div>
          </div>
        </div>
        <div className="sm:ml-auto grid grid-cols-3 gap-3 sm:min-w-[300px]">
          <MyStat label="Verified" value={me.verified_enrollments} />
          <MyStat label="Leads" value={me.valid_referral_leads} />
          <MyStat label="Conv." value={`${me.conversion_rate.toFixed(1)}%`} />
        </div>
      </div>
      {onJump && (
        <div className="relative mt-3">
          <Button size="sm" variant="secondary"
            className="bg-white text-slate-900 hover:bg-slate-100 gap-1.5" onClick={onJump}>
            <ArrowDown className="h-3.5 w-3.5" /> Jump to my row
          </Button>
        </div>
      )}
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
  const heights = ["sm:pt-8", "sm:pt-0", "sm:pt-12"];
  const trophies = [
    <Medal key="s" className="h-4 w-4 text-slate-400" />,
    <Crown key="g" className="h-4 w-4 text-amber-400" />,
    <Award key="b" className="h-4 w-4 text-orange-400" />,
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {podium.map((r, i) => (
        <Card key={r.ambassador_id}
          className={cn("p-4 border-slate-200 bg-white hover:shadow-md transition-shadow",
            heights[i], r.is_me && "ring-2 ring-cyan-400")}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden ring-1 ring-slate-200">
                {r.photo_url ? (
                  <img src={r.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-slate-500">{initials(r.display_identity)}</span>
                )}
              </div>
              <div className="absolute -top-1.5 -right-1.5 rounded-full bg-white shadow ring-1 ring-slate-200 h-6 w-6 flex items-center justify-center">
                {trophies[i]}
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">#{r.rank_position}</span>
                {r.is_me && <Badge variant="info" className="text-[10px] h-4 px-1.5">You</Badge>}
              </div>
              <div className="text-sm font-semibold text-slate-900 truncate">{r.display_identity}</div>
              {r.college_display && (
                <div className="text-xs text-slate-500 truncate">{r.college_display}</div>
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
    <div id={`amb-row-${row.ambassador_id}`}
      className={cn("flex items-center gap-3 sm:gap-4 px-4 py-3.5 transition-colors",
        row.is_me ? "bg-cyan-50/60" : "hover:bg-slate-50")}>
      <div className={cn("w-10 text-sm font-semibold tabular-nums text-center",
        row.rank_position <= 3 ? "text-amber-600" : "text-slate-500")}>
        #{row.rank_position}
      </div>
      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
        {row.photo_url ? (
          <img src={row.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-slate-500">{initials(row.display_identity)}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 truncate">{row.display_identity}</span>
          {row.is_me && <Badge variant="info" className="text-[10px] h-4 px-1.5">You</Badge>}
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
              <span key={b.badge_id} title={b.name}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100">
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
        <div className="text-sm font-semibold text-slate-900 tabular-nums">{row.verified_enrollments}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">verified</div>
      </div>
    </div>
  );
}

function StatCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
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
      <p className="text-sm text-slate-600 mt-1 mb-4">Something went wrong loading this data.</p>
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
