import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight, Bookmark, Flame, Sparkles, Target, MessageCircle } from "lucide-react";
import { Panel, PanelLink, ProgressRing } from "@/components/workspace/panel";
import { useBookmarks, useRecentlyViewed } from "@/lib/mentor/storage";
import {
  useActivity,
  useAchievements,
  useProfile,
  useRoadmaps,
  useStreak,
  useWeeklyGoals,
} from "@/lib/workspace/storage";
import { buildRecommendations } from "@/lib/workspace/recommendations";

export const Route = createFileRoute("/my/")({
  component: DashboardHome,
});

function DashboardHome() {
  const recent = useRecentlyViewed();
  const { items: bookmarks } = useBookmarks();
  const streak = useStreak();
  const { goals } = useWeeklyGoals();
  const { roadmaps } = useRoadmaps();
  const activity = useActivity();
  const achievements = useAchievements();
  const { profile } = useProfile();

  const lastProgram = useMemo(() => recent.find((r) => r.kind === "program"), [recent]);
  const lastBlog = useMemo(() => recent.find((r) => r.kind === "blog"), [recent]);
  const lastGlossary = useMemo(() => recent.find((r) => r.kind === "glossary"), [recent]);
  const lastTool = useMemo(() => recent.find((r) => r.kind === "tool"), [recent]);

  const seenHrefs = useMemo(
    () => new Set([...recent.map((r) => r.href), ...bookmarks.map((b) => b.href)]),
    [recent, bookmarks],
  );
  const recs = useMemo(
    () => buildRecommendations(recent, bookmarks, seenHrefs),
    [recent, bookmarks, seenHrefs],
  );

  const goalTotal = goals.reduce((a, g) => a + g.target, 0);
  const goalDone = goals.reduce((a, g) => a + Math.min(g.done, g.target), 0);
  const unlocked = achievements.filter((a) => a.unlockedAt).length;

  const greeting = getGreeting();
  const name = profile.displayName || "Learner";
  const focus = profile.focus || (lastProgram?.label ?? "Explore what interests you");

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card/80 to-accent/10 p-6 backdrop-blur-xl sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -left-8 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              {greeting}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {name}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Current focus: <span className="font-semibold text-foreground">{focus}</span>. You have{" "}
              {goalTotal - goalDone} weekly goal steps left and {roadmaps.length} active roadmap
              {roadmaps.length === 1 ? "" : "s"}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {lastProgram && (
                <Link
                  to={lastProgram.href}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-transform hover:-translate-y-0.5"
                >
                  Continue: {truncate(lastProgram.label, 40)} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
              <Link
                to="/my/planner"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
              >
                Plan today
              </Link>
              <Link
                to="/my/discover"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
              >
                Discover more
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
            <StatCard icon={Flame} label="Streak" value={`${streak.current}d`} sub={`Best ${streak.longest}d`} />
            <StatCard icon={Target} label="Goals" value={`${goalDone}/${goalTotal}`} sub="This week" />
            <StatCard icon={Sparkles} label="Achievements" value={String(unlocked)} sub={`of ${achievements.length}`} />
          </div>
        </div>
      </section>

      {/* Continue learning */}
      <Panel eyebrow="Continue" title="Pick up where you left off">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ContinueCard label="Last program" item={lastProgram} fallback="/programs" fallbackText="Explore programs" />
          <ContinueCard label="Last article" item={lastBlog} fallback="/blog" fallbackText="Read the blog" />
          <ContinueCard label="Last glossary" item={lastGlossary} fallback="/glossary" fallbackText="Browse glossary" />
          <ContinueCard label="Last tool" item={lastTool} fallback="/tools" fallbackText="Open tools" />
        </div>
      </Panel>

      {/* Progress & Goals */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel eyebrow="This week" title="Learning progress" action={<PanelLink to="/my/activity">See activity</PanelLink>}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ProgressRing value={goalDone} max={goalTotal || 1} label="Goals" sub={`${goalDone}/${goalTotal}`} />
            <ProgressRing value={streak.current} max={7} label="Streak" sub={`${streak.current}/7 days`} />
            <ProgressRing
              value={activity.filter((a) => a.href?.includes("/blog")).length}
              max={10}
              label="Articles"
              sub="Read this week"
            />
            <ProgressRing
              value={roadmaps.reduce((a, r) => a + r.completedSteps.length, 0)}
              max={Math.max(1, roadmaps.reduce((a, r) => a + r.totalSteps, 0))}
              label="Roadmap"
              sub="Steps done"
            />
          </div>
        </Panel>

        <Panel eyebrow="Weekly goals" title="Today's goals" action={<PanelLink to="/my/profile">Edit</PanelLink>}>
          <ul className="space-y-3">
            {goals.slice(0, 4).map((g) => {
              const pct = Math.round((g.done / g.target) * 100);
              return (
                <li key={g.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{g.label}</span>
                    <span className="text-muted-foreground">
                      {g.done}/{g.target}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {/* Recommendations + Mentor summary */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          eyebrow="For you"
          title="Recommended next"
          action={<PanelLink to="/my/discover">More</PanelLink>}
        >
          {recs.length === 0 ? (
            <EmptyHint text="Open a program, blog, or tool to unlock personalized recommendations." to="/programs" cta="Explore programs" />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {recs.map((r) => (
                <li key={r.href}>
                  <Link
                    to={r.href}
                    className="group flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-card/50 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{r.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{r.reason}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {r.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          eyebrow="AI mentor"
          title="Your learning coach"
          action={
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
              onClick={() => window.dispatchEvent(new CustomEvent("glintr:open-mentor"))}
            >
              <MessageCircle className="h-3.5 w-3.5" /> Chat
            </button>
          }
        >
          <ul className="space-y-2 text-sm">
            <MentorSuggestion label="Suggested next lesson" value={lastProgram?.label ?? "Explore AI Fundamentals"} href={lastProgram?.href ?? "/programs"} />
            <MentorSuggestion label="Recommended reading" value={lastBlog?.label ?? "Prompt engineering basics"} href={lastBlog?.href ?? "/blog"} />
            <MentorSuggestion label="Try a tool" value={lastTool?.label ?? "Career finder"} href={lastTool?.href ?? "/tools"} />
          </ul>
        </Panel>
      </div>

      {/* Bookmarks + Activity + Achievements */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel eyebrow="Bookmarks" title="Saved for later" action={<PanelLink to="/my/bookmarks">All</PanelLink>}>
          {bookmarks.length === 0 ? (
            <EmptyHint text="Bookmark programs, articles or glossary entries to find them here." to="/glossary" cta="Browse glossary" />
          ) : (
            <ul className="space-y-2">
              {bookmarks.slice(0, 5).map((b) => (
                <li key={b.href}>
                  <Link
                    to={b.href}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Bookmark className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      <span className="truncate">{b.label}</span>
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {b.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel eyebrow="Timeline" title="Recent activity" action={<PanelLink to="/my/activity">All</PanelLink>}>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet — start exploring to build your timeline.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activity.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{e.label}</p>
                    <p className="text-[11px] text-muted-foreground">{formatWhen(e.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel eyebrow="Milestones" title="Achievements" action={<PanelLink to="/my/achievements">All</PanelLink>}>
          <ul className="space-y-2 text-sm">
            {achievements.slice(0, 5).map((a) => (
              <li
                key={a.id}
                className={
                  "flex items-start gap-2 rounded-lg border p-2 " +
                  (a.unlockedAt
                    ? "border-primary/30 bg-primary/5"
                    : "border-dashed border-border/60 opacity-70")
                }
              >
                <Trophy2 unlocked={!!a.unlockedAt} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{a.title}</p>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">{a.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Trophy2({ unlocked }: { unlocked: boolean }) {
  return (
    <span
      className={
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " +
        (unlocked ? "bg-gradient-to-br from-primary to-accent text-primary-foreground" : "bg-muted text-muted-foreground")
      }
      aria-hidden
    >
      ★
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur-xl">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <p className="mt-1.5 text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function ContinueCard({
  label,
  item,
  fallback,
  fallbackText,
}: {
  label: string;
  item?: { href: string; label: string } | undefined;
  fallback: string;
  fallbackText: string;
}) {
  const href = item?.href ?? fallback;
  const text = item?.label ?? fallbackText;
  return (
    <Link
      to={href}
      className="group flex flex-col justify-between gap-2 rounded-xl border border-border/60 bg-card/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="line-clamp-2 text-sm font-semibold text-foreground">{text}</p>
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
        {item ? "Resume" : "Open"} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function MentorSuggestion({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <li>
      <Link to={href} className="block rounded-lg px-2 py-1.5 hover:bg-muted/60">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </Link>
    </li>
  );
}

function EmptyHint({ text, to, cta }: { text: string; to: string; cta: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
      <p>{text}</p>
      <Link to={to} className="mt-2 inline-flex text-xs font-semibold text-primary">
        {cta} →
      </Link>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function formatWhen(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
