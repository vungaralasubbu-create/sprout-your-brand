import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Panel } from "@/components/workspace/panel";
import { useActivity, type ActivityKind } from "@/lib/workspace/storage";

export const Route = createFileRoute("/my/activity")({
  component: ActivityPage,
});

const FILTERS: Array<{ key: ActivityKind | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "view", label: "Views" },
  { key: "bookmark", label: "Bookmarks" },
  { key: "note", label: "Notes" },
  { key: "roadmap", label: "Roadmaps" },
  { key: "goal", label: "Goals" },
  { key: "mentor", label: "Mentor" },
  { key: "tool", label: "Tools" },
  { key: "achievement", label: "Achievements" },
];

function ActivityPage() {
  const activity = useActivity();
  const [filter, setFilter] = useState<ActivityKind | "all">("all");
  const filtered = useMemo(
    () => (filter === "all" ? activity : activity.filter((a) => a.kind === filter)),
    [activity, filter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((e) => {
      const d = new Date(e.at).toDateString();
      const arr = map.get(d) ?? [];
      arr.push(e);
      map.set(d, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Timeline
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Recent activity
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A chronological view of everything you've done in Glintr recently. Stored privately on your device.
        </p>
      </header>

      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold " +
              (filter === f.key
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border/60 bg-card text-muted-foreground")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <Panel>
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activity yet. Open a program, save a bookmark, or ask the AI mentor to fill this timeline.
          </p>
        ) : (
          <div className="space-y-6">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {day}
                </h3>
                <ol className="relative space-y-3 border-l border-border/60 pl-4">
                  {items.map((e) => (
                    <li key={e.id} className="relative">
                      <span
                        className="absolute -left-[21px] mt-1.5 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-primary to-accent"
                        aria-hidden
                      />
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm text-foreground">
                          {e.href ? (
                            <Link to={e.href} className="hover:underline">
                              {e.label}
                            </Link>
                          ) : (
                            e.label
                          )}
                        </p>
                        <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {e.kind}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
