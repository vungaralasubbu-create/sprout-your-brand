import { createFileRoute, Link } from "@tanstack/react-router";
import { LIVE_CLASSES, PRACTICE_ROOMS } from "@/data/live-classes";
import { useScheduled } from "@/lib/live/store";
import { Radio, Calendar, Users, Sparkles, PlayCircle, ArrowRight, CheckCircle2 } from "lucide-react";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LiveHome() {
  const { ids, toggle } = useScheduled();
  const live = LIVE_CLASSES.filter((c) => c.status === "live");
  const upcoming = LIVE_CLASSES.filter((c) => c.status === "upcoming");
  const past = LIVE_CLASSES.filter((c) => c.status === "past");
  const mine = LIVE_CLASSES.filter((c) => ids.includes(c.id));

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_10%_-10%,oklch(0.98_0.02_220/0.7),transparent),radial-gradient(1000px_500px_at_100%_0%,oklch(0.98_0.02_180/0.5),transparent)]">
      <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8">
        <header className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Radio className="h-3 w-3 text-rose-500" /> Live AI Classroom
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Learn live. Learn together. Learn with AI.
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Enterprise-grade live classes with real-time quizzes, shared notes, an always-on AI Tutor, and post-class study
            packs generated for every learner.
          </p>
        </header>

        {live.length ? (
          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" /> Live now
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {live.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-500">Live</span>
                    <span>{c.participants} in the room</span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.instructor} · {c.program}
                  </p>
                  <Link
                    to="/live/$classId"
                    params={{ classId: c.id }}
                    search={{ tab: "room" as const }}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
                  >
                    Join classroom <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Upcoming classes</h2>
            <span className="text-xs text-muted-foreground">All times in your local zone</span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((c) => {
              const scheduled = ids.includes(c.id);
              return (
                <article key={c.id} className="rounded-2xl border border-border/60 bg-card/70 p-5">
                  <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {c.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-full bg-muted px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug">{c.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{c.instructor}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatTime(c.startsAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {c.participants}/{c.capacity}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      to="/live/$classId"
                      params={{ classId: c.id }}
                      className="flex-1 rounded-lg bg-foreground px-3 py-1.5 text-center text-xs font-medium text-background"
                    >
                      View lobby
                    </Link>
                    <button
                      onClick={() => toggle(c.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        scheduled
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                          : "border-border/60 hover:bg-muted"
                      }`}
                    >
                      {scheduled ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Saved
                        </span>
                      ) : (
                        "Add to schedule"
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {mine.length ? (
          <section className="mt-12">
            <h2 className="text-lg font-semibold">My schedule</h2>
            <ul className="mt-3 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/70">
              {mine.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(c.startsAt)} · {c.instructor}
                    </p>
                  </div>
                  <Link
                    to="/live/$classId"
                    params={{ classId: c.id }}
                    className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Open lobby
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="text-lg font-semibold">AI Practice Rooms</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Small-group study rooms moderated by AI. Voice, chat, whiteboard, and shared notes always available.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRACTICE_ROOMS.map((r) => (
              <div key={r.id} className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-5">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> {r.topic}
                </div>
                <h3 className="mt-2 text-base font-semibold">{r.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{r.activeLearners} learners active</span>
                  <button className="rounded-lg border border-border/60 px-3 py-1 hover:bg-muted">Enter</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">Past sessions</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {past.map((c) => (
              <Link
                key={c.id}
                to="/live/$classId"
                params={{ classId: c.id }}
                search={{ tab: "recording" as const }}
                className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 transition hover:border-foreground/40"
              >
                <PlayCircle className="mt-0.5 h-6 w-6 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.instructor} · {c.durationMin} min · Recording + AI summary
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live AI Classroom — Glintr" },
      {
        name: "description",
        content: "Live classes with real-time quizzes, shared whiteboards, AI Tutor, and post-class study packs.",
      },
      { property: "og:title", content: "Live AI Classroom — Glintr" },
      {
        property: "og:description",
        content: "Learn live, together, with AI. Enterprise-grade collaborative learning on Glintr.",
      },
    ],
  }),
  component: LiveHome,
});
