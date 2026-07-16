import { createFileRoute, Link } from "@tanstack/react-router";
import { HubShell } from "@/components/workspace/hub-shell";
import { LIVE_CLASSES } from "@/data/live-classes";
import { useScheduled } from "@/lib/live/store";
import { Radio, Calendar, Users, Sparkles } from "lucide-react";

function WorkspaceLive() {
  const { ids, toggle } = useScheduled();
  const mine = LIVE_CLASSES.filter((c) => ids.includes(c.id) || c.status === "live");
  const recommended = LIVE_CLASSES.filter((c) => c.status === "upcoming" && !ids.includes(c.id)).slice(0, 4);

  return (
    <HubShell>
      <header>
        <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Radio className="h-3 w-3" /> Live AI Classroom
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">My live schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your saved classes, live rooms you can join, and recommended sessions curated for your learning path.
        </p>
      </header>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Joining today</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {mine.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              You haven't added any classes yet. Browse <Link to="/live" className="text-primary hover:underline">the Live home</Link> and tap "Add to schedule".
            </p>
          ) : null}
          {mine.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/60 bg-card/70 p-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">{c.status}</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {c.participants}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold">{c.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                <Calendar className="mr-1 inline h-3 w-3" />
                {new Date(c.startsAt).toLocaleString()}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  to="/live/$classId"
                  params={{ classId: c.id }}
                  search={{ tab: c.status === "live" ? "room" : "lobby" }}
                  className="flex-1 rounded-lg bg-foreground px-3 py-1.5 text-center text-xs font-medium text-background"
                >
                  {c.status === "live" ? "Join now" : "Open lobby"}
                </Link>
                <button onClick={() => toggle(c.id)} className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-muted">
                  {ids.includes(c.id) ? "Remove" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3" /> Recommended for you
        </h2>
        <ul className="mt-3 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/70">
          {recommended.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.instructor} · {new Date(c.startsAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(c.id)} className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-muted">
                  Save
                </button>
                <Link
                  to="/live/$classId"
                  params={{ classId: c.id }}
                  className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </HubShell>
  );
}

export const Route = createFileRoute("/workspace/live")({
  head: () => ({
    meta: [
      { title: "My Live Schedule — Glintr" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceLive,
});
