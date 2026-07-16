import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  BookOpen,
  Highlighter,
  BookmarkIcon,
  Layers3,
  Sparkles,
  Search,
  Flame,
  Target,
  ArrowRight,
  CalendarDays,
  Activity as ActivityIcon,
} from "lucide-react";
import { Card, EmptyState, Pill, SectionHeader } from "@/components/workspace/hub-shell";
import {
  useActivityFeed,
  useCalendar,
  useDailyGoal,
  useFlashcards,
  useHighlights,
  useHubBookmarks,
  useNotebooks,
  useNotes,
} from "@/lib/workspace/hub";

export const Route = createFileRoute("/workspace/")({
  component: WorkspaceHome,
});

function WorkspaceHome() {
  const { notebooks } = useNotebooks();
  const { allNotes } = useNotes();
  const { allHighlights } = useHighlights();
  const { allBookmarks } = useHubBookmarks();
  const { allFlashcards } = useFlashcards();
  const { events } = useCalendar();
  const activity = useActivityFeed();
  const { goal, setTarget } = useDailyGoal();

  const recentNotes = useMemo(() => [...allNotes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5), [allNotes]);
  const recentHighlights = useMemo(() => allHighlights.slice(0, 5), [allHighlights]);
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => !e.completedAt && e.date >= today)
      .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))
      .slice(0, 5);
  }, [events]);

  const stats = [
    { label: "Notebooks", value: notebooks.length, icon: BookOpen, to: "/workspace/notebooks" },
    { label: "Notes", value: allNotes.length, icon: BookOpen, to: "/workspace/notebooks" },
    { label: "Highlights", value: allHighlights.length, icon: Highlighter, to: "/workspace/highlights" },
    { label: "Bookmarks", value: allBookmarks.length, icon: BookmarkIcon, to: "/workspace/bookmarks" },
    { label: "Flashcards", value: allFlashcards.length, icon: Layers3, to: "/workspace/flashcards" },
  ];

  const goalPct = Math.min(100, Math.round((goal.minutes / Math.max(1, goal.target)) * 100));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Workspace"
        title="Welcome to your second brain"
        description="Everything you learn on Glintr — notebooks, highlights, flashcards, AI chats — organized in one place."
        action={
          <Link
            to="/workspace/search"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Search className="h-3.5 w-3.5" aria-hidden /> Quick search
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="group">
            <Card className="!p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's goal */}
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Pill tone="primary">Today</Pill>
              <h2 className="mt-2 text-base font-semibold text-foreground">Today's study goal</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {goal.minutes} of {goal.target} minutes
              </p>
            </div>
            <Target className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Target:</span>
            {[15, 30, 60, 90].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTarget(n)}
                className={`rounded-full border px-2 py-1 text-[11px] transition-colors ${
                  goal.target === n
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                {n}m
              </button>
            ))}
          </div>
        </Card>

        {/* Continue */}
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Pill>Continue Learning</Pill>
              <h2 className="mt-2 text-base font-semibold text-foreground">Pick up where you left off</h2>
            </div>
            <Flame className="h-5 w-5 text-amber-500" aria-hidden />
          </div>
          <ul className="mt-4 space-y-2">
            {activity
              .filter((a) => a.kind === "view" && a.href)
              .slice(0, 4)
              .map((a) => (
                <li key={a.id}>
                  <Link
                    to={a.href!}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <span className="truncate">{a.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            {activity.filter((a) => a.kind === "view").length === 0 && (
              <p className="text-xs text-muted-foreground">
                Visit any program, learn guide or blog — it will show up here so you can jump back instantly.
              </p>
            )}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent notes */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent notes</h2>
            <Link to="/workspace/notebooks" className="text-xs font-semibold text-primary hover:underline">
              All notebooks
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              hint="Create a notebook and jot your first note."
              action={
                <Link
                  to="/workspace/notebooks"
                  className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
                >
                  Create notebook
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {recentNotes.map((n) => (
                <li key={n.id}>
                  <Link
                    to="/workspace/notebooks/$id"
                    params={{ id: n.notebookId }}
                    className="block rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <p className="truncate font-medium text-foreground">{n.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body.slice(0, 90)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent highlights */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Saved highlights</h2>
            <Link to="/workspace/highlights" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentHighlights.length === 0 ? (
            <EmptyState title="No highlights yet" hint="Highlight text on any Learn guide or blog to save it here." />
          ) : (
            <ul className="space-y-2">
              {recentHighlights.map((h) => (
                <li key={h.id} className="rounded-xl border-l-4 border-primary/60 bg-background/60 px-3 py-2">
                  <p className="text-sm text-foreground">"{h.text.slice(0, 140)}"</p>
                  {h.source.title && (
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {h.source.title}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wider">Upcoming</span>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              hint="Plan a study session or revision to stay consistent."
              action={
                <Link
                  to="/workspace/calendar"
                  className="rounded-full border border-border/70 px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Open calendar
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-xl bg-background/60 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.date}
                      {e.time ? ` • ${e.time}` : ""}
                    </p>
                  </div>
                  <Pill tone="primary">{e.kind}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <ActivityIcon className="h-4 w-4" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wider">Recent activity</span>
          </div>
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" hint="Your notes, highlights and AI chats appear here." />
          ) : (
            <ul className="space-y-1">
              {activity.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-foreground">{a.label}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(a.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <Pill tone="primary">GlintrAI</Pill>
            <h2 className="mt-2 text-base font-semibold text-foreground">Chat with a context-aware mentor</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Ask questions, generate summaries, build flashcards from anything you're studying.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/workspace/mentor"
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Open mentor
            </Link>
            <Link
              to="/workspace/study"
              className="inline-flex items-center gap-1 rounded-full border border-border/70 px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              AI Study Mode
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
